"""
Validate user submissions before full processing

Returns (False, model)  on success
         True            on any failure   (caller treats as {"error": True})
"""

import numpy as np
import importlib.util
import sys
import signal
import os
from contextlib import contextmanager
import time

class TimeoutException(Exception):
    pass

@contextmanager
def time_lim(seconds): # NOTE: This only works on Unix-based systems
    """Context manager for timeout"""
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

def load_python_model(processing_folder):
    """Load Python model"""
    model_file = os.path.join(processing_folder, "Model.py")
    spec = importlib.util.spec_from_file_location("Model", model_file)
    if spec is None:
        raise ImportError("Could not load Model.py")
    
    model_module = importlib.util.module_from_spec(spec)
    sys.modules["Model"] = model_module
    spec.loader.exec_module(model_module)
    
    if not hasattr(model_module, 'Model'):
        raise AttributeError("Model.py must contain a Model function")
    
    return model_module

class PythonModelWrapper:
    """Wrapper for Python models with persistent state"""
    def __init__(self, model_module):
        self.model_func = model_module.Model
        self.type = 'python'
        self.z = None  # persistent state

    def predict(self, inputs):
        # Call user model
        y, self.z = self.model_func(inputs, self.z)

        # Enforce scalar SOC
        return float(y)

def validate_submission(data, inputs, processing_folder):
    """
    Validate that submission can run without error and doesn't exceed computation time
    
    Parameters:
    -----------
    data : dict
        Test data
    inputs : list
        List of input variable names
    processing_folder : str
        Directory containing the extracted submission (Model.py lives here).
        
    Returns:
    --------
    (False, model_wrapper)   – validation passed
    True                     – validation failed  (details printed to stderr)
    """    
    print('Starting validation process...', file=sys.stderr)
    
    # Load model
    try:
        model_class = load_python_model(processing_folder)
        model = PythonModelWrapper(model_class)
    except Exception as e:
        print(f'ERROR: Could not load Model.py – {e}', file=sys.stderr)
        return True
    
    # Prepare test data
    try:
        cycle = data['m80']

        # Find UDDS cycle at 10C for m80
        cycle_names = [str(name) for name in cycle[:, 0]]
        temps = [float(t) for t in cycle[:, 1]]
        
        use_idx = None
        for i, (name, temp) in enumerate(zip(cycle_names, temps)):
            if 'UDDS' in name and temp == 10:
                use_idx = i
                break
        
        if use_idx is None:
            print("ERROR: Could not find UDDS at 10C in test data", file=sys.stderr)
            return True
        
        # Prepare input data with offset (worst case test)
        cycle_data = cycle[use_idx][3]
        
        # Preallocate X (same as MATLAB)
        num_samples = len(cycle_data.Current)
        X = np.zeros((num_samples + 3600, len(inputs)))
        
        for j, input_name in enumerate(inputs):
            data_array = np.asarray(getattr(cycle_data, input_name)).flatten()
            
            if input_name == 'Current':
                data_array = data_array + 0.3 # Use an offset to get a 'bad' case test of the model
            
            # Prepend one hour of constant data
            X[:, j] = np.concatenate([np.ones(3600) * data_array[0], data_array])
        
    except Exception as e:
        print(f"ERROR: Could not prepare test data: {str(e)}", file=sys.stderr)
        return True
    
    
    # Test the model with timeout
    try:
        start_time = time.time()
        soc_pred = np.zeros(len(X))
        
        for i in range(len(X)):
            # Soft timeout check
            if time.time() - start_time > 60:
                raise TimeoutException("Timed out!")
            
            soc_pred[i] = model.predict(X[i, :])
        
        if np.any(np.isnan(soc_pred)):
            raise ValueError("Model returned NaN values during validation.")
        
        print('Validation passed!', file=sys.stderr)
        return False, model
        
    except TimeoutException:
        print('TIME OUT ERROR: Model exceeded the 60-second runtime limit.', file=sys.stderr)
        return True
    
    except Exception as e:
        error_msg = str(e)
        if 'a>' in error_msg: # Remove location data from error message if present
            idx = error_msg.find('a>') + 3
            error_msg = error_msg[idx:]
        print(f'ERROR: Model raised an exception – {error_msg}',file=sys.stderr)
        return True