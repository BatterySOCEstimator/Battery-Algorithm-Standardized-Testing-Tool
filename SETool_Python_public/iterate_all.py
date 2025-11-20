"""
Functions for running SOC prediction iteratively
Supports both Python and MATLAB models
"""

import numpy as np
import time
import importlib
import os

def get_model_wrapper():
    """
    Get the appropriate model wrapper based on what's available
    
    Returns:
    --------
    model : ModelWrapper
        Wrapped model ready for prediction
    """
    from validate_submission import (detect_model_type, load_python_model, 
                                     load_matlab_model, PythonModelWrapper, 
                                     MatlabModelWrapper)
    
    model_type, model_path = detect_model_type()
    
    if model_type == 'python':
        model_class = load_python_model()
        return PythonModelWrapper(model_class)
    elif model_type == 'matlab':
        eng = load_matlab_model()
        return MatlabModelWrapper(eng)
    else:
        raise FileNotFoundError("No Model.py, Model.m, or Model.p found")

def iterate_all(X):
    """
    Run the Model prediction iteratively for all samples, run each sample in a cycle one by one.
    Works with both Python and MATLAB models
    
    Parameters:
    -----------
    X : numpy.ndarray
        Input data matrix (n_samples, n_features)
        
    Returns:
    --------
    soc_pred : numpy.ndarray
        Predicted SOC values for each sample
    """
    # Get model wrapper
    model = get_model_wrapper()
    
    # Initialize
    soc_pred = np.zeros(len(X))
    
    # Iterative prediction
    for i in range(len(X)):
        soc_pred[i] = model.predict(X[i, :])
    
    return soc_pred

def predict_soc(inputs, file_data, cycle_idx, offset=0, isoc_idx=1):
    """
    Load and then simulate a drive cycle using the model
    
    Parameters:
    -----------
    inputs : list
        List of input variable names
    file_data : pandas.DataFrame or dict
        File containing cycle data
    cycle_idx : int
        Index of cycle to predict
    offset : float, optional
        Current sensor offset to apply
    isoc_idx : int, optional
        Starting index (for initial SOC error testing)
        
    Returns:
    --------
    soc_pred : numpy.ndarray
        Predicted SOC values
    time_elapsed : float
        Computation time in seconds
    n_samples : int
        Number of samples processed
    """
    # Get cycle data
    if hasattr(file_data, 'Data'):
        cycle_data = file_data.Data[cycle_idx]
    else:
        cycle_data = file_data[cycle_idx]
    
    # Prepare input data
    X1 = np.zeros((len(cycle_data['Current']) - isoc_idx + 1, len(inputs)))
    
    for j, input_name in enumerate(inputs):
        if input_name == 'Current':
            data_array = np.array(cycle_data[input_name][isoc_idx:]) + offset
        else:
            data_array = np.array(cycle_data[input_name][isoc_idx:])
        
        X1[:, j] = data_array
    
    # Prepend initialization period
    if isoc_idx == 1:
        # Standard case: prepend one hour of constant data
        X = np.zeros((len(X1) + 3600, len(inputs)))
        for j in range(len(inputs)):
            X[:, j] = np.concatenate([np.ones(3600) * X1[0, j], X1[:, j]])
    else:
        # iSOC offset case: prepend zeros
        X = np.zeros((len(X1) + 3600, len(inputs)))
        for j in range(len(inputs)):
            if j == 0:  # Current
                X[:, j] = np.concatenate([np.zeros(3600), X1[:, j]])
            else:
                X[:, j] = np.concatenate([np.ones(3600) * X1[0, j], X1[:, j]])
    
    # Time the prediction
    start_time = time.time()
    soc_pred_full = iterate_all(X)
    time_elapsed = time.time() - start_time
    
    # Remove initialization period
    soc_pred = soc_pred_full[3600:]
    
    # Replace NaN with 0
    soc_pred[np.isnan(soc_pred)] = 0
    
    n_samples = len(X)
    
    # Users will see this reflected in their scores or will likely be marked as exploitative
    return soc_pred, time_elapsed, n_samples