"""
Obtain output data from all drive cycles
"""
import numpy as np
import pandas as pd
from iterate_all import predict_soc
from flops_mem_counter import flops_mem_counter, calculate_complexity_score

def obtain_output_data(setups, data, inputs, user_model):
    # IMPORTANT: import inside function to successfully deserialize in Linux environment

    """
    Run model on all test cycles and collect results
    
    Parameters:
    -----------
    setups : list
        List of setup names (m80, m448, m448N, m1000)
    data : dict
        Dictionary containing test data for each setup
    inputs : list
        List of input variable names
        
    Returns:
    --------
    output_data : dict
        Dictionary of results for each setup
    rmse : numpy.ndarray
        RMSE values for all cycles
    maxe : numpy.ndarray
        Maximum error values
    mae : numpy.ndarray
        Mean absolute error values
    rmse_charge : numpy.ndarray
        RMSE values for charging cycles
    file_data : dict
        File data used for predictions
    complexity : str
        Complexity category string
    """
    c = 0  # Counter for charging cycles
    
    # Column labels for output tables
    column_labels = ['Temperature [C]', 'RMSE', 'MAE', 'MAXE', 
                     'Timeseries Actual SOC', 'Timeseries Estimate SOC']
    
    # Find maximum size for arrays
    sizes = [len(data[setup]) for setup in setups]
    max_size = max(sizes)
    max_idx = sizes.index(max_size)
    
    # Find size for array without charge and other cycles
    cycle_names = [str(name) for name in data[setups[max_idx]][:, 0]]
    valid_cycles = sum([name not in ['Other', 'CC_CV_charge'] for name in cycle_names])
    
    # Initialize arrays to max size
    rmse_temp = np.zeros((max_size, len(setups)))
    mae_temp = np.zeros((max_size, len(setups)))
    maxe_temp = np.zeros((max_size, len(setups)))
    
    rmse = np.zeros((valid_cycles, len(setups)))
    mae = np.zeros((valid_cycles, len(setups)))
    maxe = np.zeros((valid_cycles, len(setups)))
    
    rmse_charge = []
    
    # Time tracking arrays
    time_data = np.zeros((len(setups), max_size))
    n_samples = np.zeros((len(setups), max_size))
    
    # FLOPS/MOPS tracking
    flops_list = []
    mops_list = []
    m = 0
    
    output_data = {}
    
    # Process each setup
    for t, setup_name in enumerate(setups): # Repeat for all vehicle weight and settings
        k = 0  # Valid cycle counter, reset Data counter
        file_data = data[setup_name]
        
        # Get cycle information
        cycle_names_list = [str(name) for name in file_data[:, 0]]
        temps_list = [float(temp) for temp in file_data[:, 1]]
        
        # Create unique row/cycle names for table entries
        indices = [i for i, name in enumerate(cycle_names_list) 
                  if name not in ['Other', 'CC_CV_charge']]
        unique_row_names = [f"{cycle_names_list[i]}_{i}" for i in indices]
        
        # Initialize results table
        results = {col: [] for col in column_labels}
        row_names = []
        
        # Process each cycle, load for each first testcase one by one 
        for i in range(len(cycle_names_list)):
            cycle_name = cycle_names_list[i]
            temp = temps_list[i] # Create array for all temperatures
            
            # Get actual SOC
            cycle_data = file_data[i][3]   # column 3 holds the cycle data struct
            soc_act = np.array(cycle_data.SOC)
            
            # Predict SOC
            soc_pred, time_elapsed, n_samp = predict_soc(inputs, file_data, i, user_model)
            soc_act = soc_act[1:] # Trim soc_act to match soc_pred length (due to isoc_idx=1)
            
            # Measure FLOPS/MOPS periodically
            if i % 10 == 0:
                flop_val, mop_val = flops_mem_counter(1, 1)
                flops_list.append(flop_val)
                mops_list.append(mop_val)
                m += 1
            
            # Store timing data
            time_data[t, i] = time_elapsed
            n_samples[t, i] = n_samp
            
            # Calculate errors
            rmse_val = 100 * np.sqrt(np.mean((soc_act - soc_pred)**2))
            mae_val = 100 * np.mean(np.abs(soc_act - soc_pred))
            maxe_val = 100 * np.max(np.abs(soc_act - soc_pred))
            
            rmse_temp[i, t] = rmse_val
            mae_temp[i, t] = mae_val
            maxe_temp[i, t] = maxe_val
            
            # Categorize cycle
            if cycle_name in ['Other', 'CC_CV_charge']: # If cycle is Other or CC_CV_charge (not a testcase)
                if cycle_name == 'CC_CV_charge': # If it's a charge cycle
                    rmse_charge.append(rmse_val)
                    c += 1
            else:
                # Valid test cycle
                rmse[k, t] = rmse_val
                mae[k, t] = mae_val
                maxe[k, t] = maxe_val
                
                # Store in results table
                results['Temperature [C]'].append(int(temp))
                results['RMSE'].append(rmse_val)
                results['MAE'].append(mae_val)
                results['MAXE'].append(maxe_val)
                results['Timeseries Actual SOC'].append(soc_act)
                results['Timeseries Estimate SOC'].append(soc_pred)
                row_names.append(unique_row_names[k])
                
                k += 1
        
        # Create DataFrame for this setup
        df = pd.DataFrame(results, index=row_names)
        output_data[setup_name] = df
    
    # Calculate complexity
    time_flat = time_data.flatten()
    n_samples_flat = n_samples.flatten()
    
    if flops_list and mops_list:
        mean_flops = np.mean(flops_list)
        mean_mops = np.mean(mops_list)
        complexity, score_range = calculate_complexity_score(
            time_flat, n_samples_flat, mean_flops, mean_mops
        )
    else:
        complexity = "Unknown"
    
    rmse_charge = np.array(rmse_charge)
    file_data_dict = {setup: data[setup] for setup in setups}
    
    return output_data, rmse, maxe, mae, rmse_charge, file_data_dict, complexity