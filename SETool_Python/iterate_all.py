"""
Functions for running SOC prediction iteratively
"""

import numpy as np
import time
import importlib
import os

def iterate_all(X, user_model):
    """
    Run the Model prediction iteratively for all samples, run each sample in a cycle one by one.
    
    Parameters:
    -----------
    X : numpy.ndarray
        Input data matrix (n_samples, n_features)
        
    Returns:
    --------
    soc_pred : numpy.ndarray
        Predicted SOC values for each sample
    """  
    # Initialize
    soc_pred = np.zeros(len(X))
    
    # Iterative prediction
    for i in range(len(X)):
        soc_pred[i] = user_model.predict(X[i, :])
    
    return soc_pred

def predict_soc(inputs, file_data, cycle_idx, user_model, offset=0, isoc_idx=1):
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
    user_model : ModelWrapper
        The model wrapper to use for prediction
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
        cycle_data = file_data.Data[cycle_idx] # CONTINUE HERE TMRW
    else:
        cycle_data = file_data[cycle_idx][3]
    
    # Prepare input data
    X1 = np.zeros((len(cycle_data.Current) - isoc_idx, len(inputs))) # CONTINUE HERE TMRW
    
    for j, input_name in enumerate(inputs):
        if input_name == 'Current':
            data_array = np.array(getattr(cycle_data, input_name)[isoc_idx:]) + offset
        else:
            data_array = np.array(getattr(cycle_data, input_name)[isoc_idx:])
        
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
    soc_pred_full = iterate_all(X, user_model)
    time_elapsed = time.time() - start_time
    
    # Remove initialization period
    soc_pred = soc_pred_full[3600:]
    
    # Replace NaN with 0
    soc_pred[np.isnan(soc_pred)] = 0
    
    n_samples = len(X)
    
    # Users will see this reflected in their scores or will likely be marked as exploitative
    return soc_pred, time_elapsed, n_samples