"""
Validate user submissions before full processing
Supports both Python (.py) and MATLAB (.m) models
"""

import numpy as np
import importlib.util
import sys
import signal
import os
import matlab.engine as matlab
from contextlib import contextmanager

class TimeoutException(Exception):
    pass

@contextmanager
def time_limit(seconds):
    """Context manager for timeout"""
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

def detect_model_type():
    """
    Detect whether submission is Python or MATLAB
    
    Returns:
    --------
    model_type : str
        'python', 'matlab', or None
    model_path : str
        Path to the model file
    """
    if os.path.exists('Model.py'):
        return 'python', 'Model.py'
    elif os.path.exists('Model.m'):
        return 'matlab', 'Model.m'
    elif os.path.exists('Model.p'):
        return 'matlab', 'Model.p'
    else:
        return None, None

def load_python_model():
    """Load Python model"""
    spec = importlib.util.spec_from_file_location("Model", "Model.py")
    if spec is None:
        raise ImportError("Could not load Model.py")
    
    model_module = importlib.util.module_from_spec(spec)
    sys.modules["Model"] = model_module
    spec.loader.exec_module(model_module)
    
    if not hasattr(model_module, 'Model'):
        raise AttributeError("Model.py must contain a Model class")
    
    return model_module.Model

def load_matlab_model():
    """Load MATLAB model using MATLAB Engine"""
    
    # Start MATLAB engine
    eng = matlab.start_matlab()
    
    # Add current directory to MATLAB path
    eng.addpath(os.getcwd(), nargout=0)
    
    return eng

class PythonModelWrapper:
    """Wrapper for Python models"""
    def __init__(self, model_class):
        self.model = model_class()
        self.type = 'python'
    
    def predict(self, inputs):
        return self.model.predict(inputs) # bru - Does same as iterate_all

class MatlabModelWrapper:
    """Wrapper for MATLAB models"""
    def __init__(self, eng):
        self.eng = eng
        self.type = 'matlab'
        # Initialize MATLAB model state if needed
        self.z = None
    
    def predict(self, inputs):
        # Convert numpy array to MATLAB array
        matlab_inputs = matlab.double(inputs.tolist())
        
        # Call MATLAB Model function
        if self.z is None:
            # First call - initialize
            result = self.eng.Model(matlab_inputs, nargout=2)
            soc = float(result[0])
            self.z = result[1]
        else:
            # Subsequent calls - use state
            result = self.eng.Model(matlab_inputs, self.z, nargout=2)
            soc = float(result[0])
            self.z = result[1]
        
        return soc # bru - Does same as iterate_all

def validate_submission(data, inputs, author_email, model_type):
    """
    Validate that submission can run without error and doesn't exceed computation time
    Supports both Python and MATLAB models
    
    Parameters:
    -----------
    data : dict
        Test data
    inputs : list
        List of input variable names
    author_email : str
        Email address for error notification
        
    Returns:
    --------
    fail : bool
        True if validation failed, False if passed
    """
    from email_utils import send_error_notification
    
    print('Starting validation process...')
    fail = False
    
    # Detect model type
    # model_type, model_path = detect_model_type()
    
    # if model_type is None:
    #     print("ERROR: Could not find Model.py, Model.m, or Model.p")
    #     send_error_notification(author_email, "Unknown", "1", 
    #                            "No Model file found. Please include Model.py (Python) or Model.m/Model.p (MATLAB)")
    #     return True
    
    # print(f"Detected {model_type.upper()} model: {model_path}")
    
    try:
        # Load the appropriate model
        if model_type == "Python":
            model_class = load_python_model()
            model = PythonModelWrapper(model_class)
        else:  # matlab
            eng = load_matlab_model()
            model = MatlabModelWrapper(eng)
        
    except Exception as e:
        error_msg = str(e)
        print(f'ERROR CODE 0: SOC estimator function file has returned the following error: \n"{error_msg}"')
        send_error_notification(author_email, "Unknown", "0", error_msg)
        return True
    
    # Prepare test data
    try:
        # Find UDDS cycle at 10C for m80
        cycle_names = [str(name) for name in data['m80'].cycle.iloc[:, 0]]
        temps = [float(t) for t in data['m80'].cycle.iloc[:, 1]]
        
        use_idx = None
        for i, (name, temp) in enumerate(zip(cycle_names, temps)):
            if 'UDDS' in name and temp == 10:
                use_idx = i
                break
        
        if use_idx is None:
            print("ERROR: Could not find UDDS at 10C in test data")
            return True
        
        # Prepare input data with offset (worst case test)
        cycle_data = data['m80'].cycle.Data[use_idx]
        X = np.zeros((len(cycle_data['Current']) + 3600, len(inputs)))
        
        for j, input_name in enumerate(inputs):
            if input_name == 'Current':
                data_array = np.array(cycle_data[input_name]) + 0.3  # Add offset
            else:
                data_array = np.array(cycle_data[input_name])
            
            # Prepend one hour of constant data
            X[:, j] = np.concatenate([np.ones(3600) * data_array[0], data_array])
        
    except Exception as e:
        print(f"ERROR: Could not prepare test data: {str(e)}")
        return True
    
    # bru - CHECK THIS BELOW !!!!
    
    # Test the model with timeout
    try:
        with time_limit(60):            
            # Run predictions
            soc_pred = np.zeros(len(X))
            for i in range(len(X)):
                if i == 0:
                    soc_pred[i] = model.predict(X[i, :])
                else:
                    soc_pred[i] = model.predict(X[i, :])
            
            # Check for NaN values
            if np.any(np.isnan(soc_pred)):
                # print("WARNING: Model returned NaN values")
                # Missing MATLAB code?
                return True
        
        print('Validation passed!')
        return False
        
    except TimeoutException:
        print('ERROR CODE 4: SOC estimator function file has taken longer than the maximum runtime!')
        send_error_notification(author_email, "Unknown", "4", 
                               "Model execution exceeded 60 second timeout")
        return True
    
    except Exception as e:
        error_msg = str(e)
        # Remove location data from error message if present
        if 'a>' in error_msg:
            idx = error_msg.find('a>') + 3
            error_msg = error_msg[idx:]
        
        print(f'ERROR CODE 0: SOC estimator function file has returned the following error: \n"{error_msg}"')
        send_error_notification(author_email, "Unknown", "0", error_msg)
        return True