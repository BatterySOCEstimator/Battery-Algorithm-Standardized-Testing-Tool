"""
Generate all test figures and perform robustness analysis
"""

import numpy as np
import matplotlib.pyplot as plt
import os
from iterate_all import predict_soc, iterate_all

def create_figures(output_data, inputs, data, file_data, output_folder, rmse, temperatures):
    """
    Generate all test figures and compute robustness errors
    
    Returns:
    --------
    mean_rmse_temp : list
        Mean RMSE for each temperature
    rmse_soc_offset : list
        RMSE values for initial SOC offset tests
    rmse_sens_offset : list
        RMSE values for current sensor offset tests
    """
    # Find dataset locations for output figures
    indices = find_dataset_indices(output_data, file_data)
    
    os.chdir(output_folder)
    
    # Create all test figures
    create_blind_vs_nonblind_figures(output_data, indices)
    create_charging_figures(output_data, indices, inputs, file_data)
    create_vehicle_mass_figures(output_data, indices)
    create_drive_cycle_figures(output_data, indices)
    
    # Temperature analysis
    mean_rmse_temp = create_temperature_figures(output_data, rmse, temperatures, indices)
    
    # Robustness tests
    rmse_soc_offset = create_initial_soc_figures(output_data, indices, inputs, data, file_data)
    rmse_sens_offset = create_sensor_offset_figures(output_data, indices, inputs, file_data)
    
    return mean_rmse_temp, rmse_soc_offset, rmse_sens_offset

def find_dataset_indices(output_data, file_data):
    """Find indices for specific test cases"""
    indices = {}
    
    # Helper function
    def find_index(df, cycle_name, temp):
        for idx, row_name in enumerate(df.index):
            if cycle_name in row_name and df.iloc[idx, 0] == temp:
                return idx
        return None
    
    # m448N LA92 at 10C
    indices['m448N_10C_LA92'] = find_index(output_data['m448N'], 'LA92', 10)
    
    # m448 LA92 at 10C
    indices['m448_10C_LA92'] = find_index(output_data['m448'], 'LA92', 10)
    
    # m80 US06 at 25C
    indices['m80_25C_US06'] = find_index(output_data['m80'], 'US06', 25)
    
    # m80 CC_CV at 25C (from file_data)
    indices['m80_25C_CC_CV'] = find_file_index(file_data, 'm80', 'CC_CV', 25)
    
    # Additional indices...
    indices['m80_10C_UDDS'] = find_index(output_data['m80'], 'UDDS', 10)
    indices['m448_10C_UDDS'] = find_index(output_data['m448'], 'UDDS', 10)
    indices['m1000_10C_UDDS'] = find_index(output_data['m1000'], 'UDDS', 10)
    indices['m1000_25C_HWFET'] = find_index(output_data['m1000'], 'HWFET', 25)
    indices['m1000_25C_HWCUST'] = find_index(output_data['m1000'], 'HWCUST', 25)
    indices['m1000_25C_HWGRADE'] = find_index(output_data['m1000'], 'HWGRADE', 25)
    indices['m80_n20C_UDDS'] = find_index(output_data['m80'], 'UDDS', -20)
    indices['m80_0C_UDDS'] = find_index(output_data['m80'], 'UDDS', 0)
    indices['m80_40C_UDDS'] = find_index(output_data['m80'], 'UDDS', 40)
    indices['m80_25C_LA92'] = find_index(output_data['m80'], 'LA92', 25)
    # m80_25C_LA92_D
    indices['m80_n10C_US06'] = find_index(output_data['m80'], 'US06', -10)
    # m80_n10C_US06_D
    indices['m80_10C_US06'] = find_index(output_data['m80'], 'US06', 10)
    # m80_10C_US06_D
    indices['m1000_n10C_US06'] = find_index(output_data['m1000'], 'US06', -10)
    # m1000_n10C_US06_D
    indices['m1000_10C_HWFET'] = find_index(output_data['m1000'], 'HWFET', 10)
    # m1000_10C_HWFET_D
    indices['m1000_40C_LA92'] = find_index(output_data['m1000'], 'LA92', 40)
    # m1000_40C_LA92_D
    
    return indices

def find_file_index(file_data, setup, cycle_substr, temp):
    """Find index in file_data"""
    df = file_data[setup]
    for i in range(len(df)):
        name = str(df.iloc[i, 0])
        cycle_temp = float(df.iloc[i, 1])
        if cycle_substr in name and cycle_temp == temp:
            return i
    return None

def plot_soc_comparison(ax_top, ax_bottom, time_hours, soc_act, soc_pred, rmse_val, title):
    """Helper function to plot SOC comparison"""
    # Top subplot: SOC vs time
    ax_top.plot(time_hours, soc_act * 100, label='Actual')
    ax_top.plot(time_hours, soc_pred * 100, label='Estimated')
    ax_top.legend()
    ax_top.set_ylim([0, 100])
    ax_top.set_xlim([0, time_hours[-1]])
    ax_top.set_ylabel('SOC (%)')
    ax_top.set_xlabel('Time (Hour)')
    ax_top.grid(True, alpha=0.3)
    ax_top.set_title(title)
    
    # Bottom subplot: Error
    error = (soc_act - soc_pred) * 100
    ax_bottom.plot(time_hours, error, label=f'RMSE {rmse_val:.1f}%')
    ax_bottom.legend()
    ulim = max(error) + 1
    llim = -min(error) + 1
    ax_bottom.set_ylim([-llim, ulim])
    ax_bottom.set_xlim([0, time_hours[-1]])
    ax_bottom.set_ylabel('Estimation Error (%)')
    ax_bottom.set_xlabel('Time (Hour)')
    ax_bottom.grid(True, alpha=0.3)

def create_blind_vs_nonblind_figures(output_data, indices):
    """Test 02, 03, and 06: Blind vs Non-Blind Cells / HVAC vs no HVAC"""
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # m448N LA92 at 10C
    idx = indices['m448N_10C_LA92']
    soc_act = output_data['m448N'].iloc[idx, 4]
    soc_pred = output_data['m448N'].iloc[idx, 5]
    rmse_val = output_data['m448N'].iloc[idx, 1]
    time_hours = np.arange(len(soc_act)) / 3600
    
    plot_soc_comparison(axes[0, 0], axes[1, 0], time_hours, soc_act, soc_pred, 
                       rmse_val, 'Non-blinded (m448N) LA92 at 10°C')
    
    # m448 LA92 at 10C
    idx = indices['m448_10C_LA92']
    soc_act = output_data['m448'].iloc[idx, 4]
    soc_pred = output_data['m448'].iloc[idx, 5]
    rmse_val = output_data['m448'].iloc[idx, 1]
    time_hours = np.arange(len(soc_act)) / 3600
    
    plot_soc_comparison(axes[0, 1], axes[1, 1], time_hours, soc_act, soc_pred, 
                       rmse_val, 'Blinded (m448) LA92 at 10°C')
    
    plt.tight_layout()
    plt.savefig('Test_02_03_06_Blind_vs_NonBlind.png', dpi=150)
    plt.close()

def create_charging_figures(output_data, indices, inputs, file_data):
    """Test 04: Charging and Cycle Time Domain Plot"""
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # m80 US06 at 25C
    idx = indices['m80_25C_US06']
    soc_act = output_data['m80'].iloc[idx, 4]
    soc_pred = output_data['m80'].iloc[idx, 5]
    rmse_val = output_data['m80'].iloc[idx, 1]
    time_hours = np.arange(len(soc_act)) / 3600
    
    plot_soc_comparison(axes[0, 0], axes[1, 0], time_hours, soc_act, soc_pred, 
                       rmse_val, 'm80 US06 at 25°C')
    
    # m80 Charge at 25C
    charge_idx = indices['m80_25C_CC_CV']
    cycle_data = file_data['m80'].Data[charge_idx]
    soc_act = np.array(cycle_data['SOC'])
    
    # Predict for charging
    X1 = np.zeros((len(soc_act), len(inputs)))
    for j, input_name in enumerate(inputs):
        X1[:, j] = np.array(cycle_data[input_name])
    
    # Prepend initialization
    X = np.zeros((len(X1) + 3600, len(inputs)))
    for j in range(len(inputs)):
        X[:, j] = np.concatenate([np.ones(3600) * X1[0, j], X1[:, j]])
    
    soc_pred_full = iterate_all(X)
    soc_pred = soc_pred_full[3600:]
    rmse_val = 100 * np.sqrt(np.mean((soc_act - soc_pred)**2))
    
    time_hours = np.arange(len(soc_act)) / 3600
    plot_soc_comparison(axes[0, 1], axes[1, 1], time_hours, soc_act, soc_pred, 
                       rmse_val, 'm80 Charging at 25°C')
    
    plt.tight_layout()
    plt.savefig('Test_04_Charging.png', dpi=150)
    plt.close()

def create_vehicle_mass_figures(output_data, indices):
    """Test 05: Range of Vehicle Masses"""
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    
    tests = [
        ('m80_10C_UDDS', 'm80', 'm80 UDDS at 10°C'),
        ('m448_10C_UDDS', 'm448', 'm448 UDDS at 10°C'),
        ('m1000_10C_UDDS', 'm1000', 'm1000 UDDS at 10°C')
    ]
    
    for col, (idx_key, setup, title) in enumerate(tests):
        idx = indices[idx_key]
        soc_act = output_data[setup].iloc[idx, 4]
        soc_pred = output_data[setup].iloc[idx, 5]
        rmse_val = output_data[setup].iloc[idx, 1]
        time_hours = np.arange(len(soc_act)) / 3600
        
        plot_soc_comparison(axes[0, col], axes[1, col], time_hours, soc_act, 
                           soc_pred, rmse_val, title)
    
    plt.tight_layout()
    plt.savefig('Test_05_Vehicle_Masses.png', dpi=150)
    plt.close()

def create_drive_cycle_figures(output_data, indices):
    """Test 07 & 08: Non-Standard Drive Cycles"""
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    
    tests = [
        ('m1000_25C_HWFET', 'm1000', 'm1000 HWFET at 25°C'),
        ('m1000_25C_HWCUST', 'm1000', 'm1000 HWCUST at 25°C'),
        ('m1000_25C_HWGRADE', 'm1000', 'm1000 HWGRADE at 25°C')
    ]
    
    for col, (idx_key, setup, title) in enumerate(tests):
        idx = indices[idx_key]
        soc_act = output_data[setup].iloc[idx, 4]
        soc_pred = output_data[setup].iloc[idx, 5]
        rmse_val = output_data[setup].iloc[idx, 1]
        time_hours = np.arange(len(soc_act)) / 3600
        
        plot_soc_comparison(axes[0, col], axes[1, col], time_hours, soc_act, 
                           soc_pred, rmse_val, title)
    
    plt.tight_layout()
    plt.savefig('Test_07_08_Drive_Cycles.png', dpi=150)
    plt.close()

def create_temperature_figures(output_data, rmse, temperatures, indices):
    """Test 09: RMSE vs Temperature"""
    # Bar plot
    nr_cycles = 6
    nr_temps = 6
    mean_rmse_temp = []
    
    for cycle in range(nr_cycles):
        index_range = slice(cycle * nr_temps, (cycle + 1) * nr_temps)
        mean_rmse_temp.append(np.mean(rmse[index_range, 0]))
    
    # Swap -10 and -20 to be in order
    mean_rmse_temp[0], mean_rmse_temp[1] = mean_rmse_temp[1], mean_rmse_temp[0]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(range(len(temperatures)), mean_rmse_temp)
    ax.set_xticks(range(len(temperatures)))
    ax.set_xticklabels(temperatures)
    ax.set_ylabel('SOC Estimation Average RMS Error (%)')
    ax.set_xlabel('Ambient Temperature (°C)')
    ax.set_title('Test 09 - Error vs Temperature')
    ax.grid(True, alpha=0.3)
    
    # Add value labels
    for bar, val in zip(bars, mean_rmse_temp):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{val:.1f}%', ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig('Test_09_Temperature_Bar.png', dpi=150)
    plt.close()
    
    # RMSE vs Temperature on m80 UDDS
    # Time domain plots for different temperatures
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    
    temp_tests = [
        ('m80_n20C_UDDS', 'm80 UDDS at -20°C'),
        ('m80_0C_UDDS', 'm80 UDDS at 0°C'),
        ('m80_40C_UDDS', 'm80 UDDS at 40°C')
    ]
    
    for col, (idx_key, title) in enumerate(temp_tests):
        idx = indices[idx_key]
        soc_act = output_data['m80'].iloc[idx, 4]
        soc_pred = output_data['m80'].iloc[idx, 5]
        rmse_val = output_data['m80'].iloc[idx, 1]
        time_hours = np.arange(len(soc_act)) / 3600
        
        plot_soc_comparison(axes[0, col], axes[1, col], time_hours, soc_act, 
                           soc_pred, rmse_val, title)
    
    plt.tight_layout()
    plt.savefig('Test_09_Temperature_Time.png', dpi=150)
    plt.close()
    
    return mean_rmse_temp

def create_initial_soc_figures(output_data, indices, inputs, data, file_data):
    """Test 10: Computing data for Initial SOC Error"""
    isoc_values = [0.90, 0.60, 0.30]
    rmse_soc_offset = []
    
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    
    test_cases = [
        ('m80_25C_LA92', 'm80', 'm80 LA92 at 25°C'),
        ('m80_n10C_US06', 'm80', 'm80 US06 at -10°C'),
        ('m80_10C_US06', 'm80', 'm80 US06 at 10°C')
    ]
    
    for col, (idx_key, setup, title) in enumerate(test_cases):
        idx = indices[idx_key]
        soc_act = output_data[setup].iloc[idx, 4]
        time_hours = np.arange(len(soc_act)) / 3600
        
        axes[0, col].plot(time_hours, soc_act * 100, 'k', label='Actual')
        
        for isoc in isoc_values:
            # Find starting index
            isoc_idx = np.where(soc_act < isoc)[0][0] if np.any(soc_act < isoc) else 1
            
            # Predict with offset
            file_idx = find_file_index(file_data, setup, idx_key.split('_')[2], 
                                      output_data[setup].iloc[idx, 0])
            soc_pred, _, _ = predict_soc(inputs, file_data[setup], file_idx, 0, isoc_idx)
            
            # Calculate RMSE from offset point
            rmse_val = 100 * np.sqrt(np.mean((soc_act[isoc_idx:] - soc_pred)**2))
            rmse_soc_offset.append(rmse_val)
            
            # Plot
            time_offset = time_hours[isoc_idx:]
            axes[0, col].plot(time_offset, soc_pred * 100, 
                            label=f'{int(isoc*100)}%')
            axes[0, col].axvline(time_hours[isoc_idx], linestyle='--', 
                               label=f'iSOC\n{int(isoc*100)}%', alpha=0.5)
        
        axes[0, col].legend()
        axes[0, col].set_ylim([0, 100])
        axes[0, col].set_xlim([0, time_hours[-1]])
        axes[0, col].set_ylabel('SOC (%)')
        axes[0, col].set_xlabel('Time (Hour)')
        axes[0, col].grid(True, alpha=0.3)
        axes[0, col].set_title(title)
        
        # Error subplot
        # (simplified - would need full implementation)
        axes[1, col].set_ylabel('Estimation Error (%)')
        axes[1, col].set_xlabel('Time (Hour)')
        axes[1, col].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('Test_10_Initial_SOC.png', dpi=150)
    plt.close()
    
    return rmse_soc_offset

def create_sensor_offset_figures(output_data, indices, inputs, file_data):
    """Test 11: Computing data for current sensor error on m1000 (-10C US06, 10C HWFET and 40C LA92)"""
    offsets = [-0.3, -0.1, -0.05, 0.05, 0.1, 0.3]
    rmse_sens_offset = []
    
    fig1, axes1 = plt.subplots(2, 3, figsize=(15, 10))
    fig2, ax2 = plt.subplots(figsize=(10, 6))
    
    test_cases = [
        ('m1000_n10C_US06', 'm1000', 'm1000 US06 at -10°C'),
        ('m1000_10C_HWFET', 'm1000', 'm1000 HWFET at 10°C'),
        ('m1000_40C_LA92', 'm1000', 'm1000 LA92 at 40°C')
    ]
    
    for col, (idx_key, setup, title) in enumerate(test_cases):
        idx = indices[idx_key]
        soc_act = output_data[setup].iloc[idx, 4]
        time_hours = np.arange(len(soc_act)) / 3600
        
        axes1[0, col].plot(time_hours, soc_act * 100, 'k', label='Actual')
        
        offset_rmse = []
        for offset in offsets:
            file_idx = find_file_index(file_data, setup, idx_key.split('_')[2], 
                                      output_data[setup].iloc[idx, 0])
            soc_pred, _, _ = predict_soc(inputs, file_data[setup], file_idx, offset)
            
            rmse_val = 100 * np.sqrt(np.mean((soc_act - soc_pred)**2))
            rmse_sens_offset.append(rmse_val)
            offset_rmse.append(rmse_val)
            
            axes1[0, col].plot(time_hours, soc_pred * 100, 
                             label=f'{offset:.2f}A')
        
        axes1[0, col].legend()
        axes1[0, col].set_ylim([0, 100])
        axes1[0, col].set_xlabel('Time (Hour)')
        axes1[0, col].set_ylabel('SOC (%)')
        axes1[0, col].set_title(title)
        axes1[0, col].grid(True, alpha=0.3)
        
        # Plot on combined figure
        baseline_rmse = output_data[setup].iloc[idx, 1]
        full_offsets = offsets[:3] + [0] + offsets[3:]
        full_rmse = offset_rmse[:3] + [baseline_rmse] + offset_rmse[3:]
        ax2.plot(full_offsets, full_rmse, '-o', label=title)
    
    ax2.set_xlabel('Offset (Ampere)')
    ax2.set_ylabel('Estimation Error (%)')
    ax2.set_title('RMSE with Current Sensor Offsets')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    plt.figure(fig1.number)
    plt.tight_layout()
    plt.savefig('Test_11_Sensor_Offset.png', dpi=150)
    plt.close()
    
    plt.figure(fig2.number)
    plt.tight_layout()
    plt.savefig('Test_11_Sensor_Offset_vs_Error.png', dpi=150)
    plt.close()
    
    return rmse_sens_offset