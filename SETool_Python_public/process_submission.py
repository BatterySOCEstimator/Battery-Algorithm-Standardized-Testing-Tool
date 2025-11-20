"""
Process user submissions and generate results
"""

import os
import shutil
import zipfile
import numpy as np
import pandas as pd
from datetime import datetime

from email_utils import (send_submission_received, send_results, 
                        send_duplicate_notification, send_incorrect_submission)
from validate_submission import validate_submission
from obtain_output_data import obtain_output_data
from create_figures import create_figures

def process_submission(filename, filenum, data, output_folder, file_folder, 
                       rootfolder, config):
    """
    Process a model submission
    
    Parameters:
    -----------
    filename : str
        Path to the submitted .zip file
    filenum : int
        Submission ID number
    data : dict
        Test data for all vehicle masses
    output_folder : str
        Temporary folder for processing
    file_folder : str
        Main folder containing submissions
    rootfolder : str
        Root directory of the tool
    config : Config
        Configuration object with all settings
    """
    
    # Extract zip file
    try:
        with zipfile.ZipFile(filename, 'r') as zip_ref:
            zip_ref.extractall(output_folder)
        print('Folder detected and .zip extracted, now deleting .zip file.')
        os.remove(filename)
    except Exception as e:
        print(f'Error extracting zip file: {str(e)}')
        return
    
    # Create a copy in Models Saved
    saved_folder = os.path.join(rootfolder, 'Models Saved')
    data_filename = os.path.join(saved_folder, f'Model__{filenum}.zip')
    shutil.make_archive(data_filename.replace('.zip', ''), 'zip', output_folder)
    
    # Add output folder to path
    import sys
    sys.path.insert(0, output_folder)
    
    # Extract settings and model file information
    xlsx_files = [f for f in os.listdir(output_folder) if f.endswith('.xlsx')]
    
    if not xlsx_files:
        print("No .xlsx file found in folder, no e-mail could be sent!")
        os.remove(data_filename)
        return
    
    # Read settings
    settings_file = os.path.join(output_folder, xlsx_files[0])
    try:
        settings_data = pd.read_excel(settings_file, header=None)
        
        if settings_data.shape[0] < 4 or settings_data.shape[1] < 2:
            print(".xlsx file has the wrong format, no e-mail could be sent!")
            os.remove(data_filename)
            return
        
        author_name = settings_data.iloc[0, 1]
        author_affiliation = settings_data.iloc[1, 1]
        author_email = settings_data.iloc[2, 1]
        model_name = settings_data.iloc[3, 1]
        
    except Exception as e:
        print(f"Error reading settings file: {str(e)}")
        os.remove(data_filename)
        return
    
    # Check for Model file (Python or MATLAB)
    model_file_py = os.path.join(output_folder, 'Model.py')
    model_file_m = os.path.join(output_folder, 'Model.m')
    model_file_p = os.path.join(output_folder, 'Model.p')
    
    has_model = (os.path.exists(model_file_py) or 
                 os.path.exists(model_file_m) or 
                 os.path.exists(model_file_p))
    
    if not has_model:
        print("No Model file found in folder, email sent!")
        send_incorrect_submission(author_email, model_name)
        os.remove(data_filename)
        return
    
    # Determine model type
    if os.path.exists(model_file_py):
        model_type = "Python"
    else:
        model_type = "MATLAB"
    
    print(f"Model file found! Type: {model_type}")
    
    # Send confirmation email
    send_submission_received(author_email, model_name)
    print("Model file found! Email sent that model was received correctly.")
    
    # Validate whether submission can be run without error and doesn't exceed computation time
    fail = validate_submission(data, config.inputs, author_email, model_type)
    if fail:
        os.remove(data_filename)
        print("TESTING TESTING 1")
        return
    
    # Create all output data using Model
    output_data, rmse, maxe, mae, rmse_charge, file_data, complexity = \
        obtain_output_data(config.setups, data, config.inputs)
    
    # Check for possible exploitation
    if np.mean(rmse) > 15:
        exploit = True
        print("\033[91mWARNING: Possible exploitation detected, no data will be sent to user, please check output data!!!\033[0m")
        # Rename saved file to indicate exploit
        exploit_filename = data_filename.replace('.zip', '_EXPLOIT.zip')
        os.rename(data_filename, exploit_filename)
    else:
        exploit = False
    
    # Create all test figures and compute robustness errors
    mean_rmse_temp, rmse_soc_offset, rmse_sens_offset = \
        create_figures(output_data, config.inputs, data, file_data, 
                      output_folder, rmse, config.temperatures)
    
    # Calculate average RMSE for all specified test case results
    rmse_results = calculate_rmse_results(rmse, rmse_charge, config)
    
    # Weight SOC offset errors
    rmse_soc_weighted = weight_soc_offset_errors(rmse_soc_offset)
    
    # Get relevant sensor offset errors (ignoring 0.05A offsets since these are very small)
    rmse_sens_offset_relevant = [rmse_sens_offset[i] for i in [0, 5, 6, 11, 12, 17]]
    
    # Create bar plot figure for average RMSE per test case
    create_summary_barplot(rmse_results, config.tests, output_folder)
    
    # Determine ranking score and weightings
    scores = calculate_scores(rmse_results, mean_rmse_temp, rmse_soc_weighted, 
                             rmse_sens_offset_relevant)
    
    # Load table of ranking scores and weightings
    weighted_score = create_weighted_score_table(config.tests_weighted, 
                                                  config.weights, scores)
    final_score = np.sum(weighted_score['Weighted_Value'])
    
    # Save figures and error summary
    save_results(output_data, output_folder, saved_folder, filenum, config.email_size_limit)
    
    os.chdir(rootfolder)
    
    # Create leaderboard entry
    stats = create_leaderboard_entry(datetime.now(), author_name, author_affiliation,
                                     model_name, final_score, scores, rmse_results,
                                     mae, maxe, complexity, filenum)
    
    # Update leaderboard
    leaderboard_path = os.path.join(file_folder, 'Leaderboard.csv')
    rank, total, is_duplicate = update_leaderboard(leaderboard_path, stats)
    
    if is_duplicate:
        send_duplicate_notification(author_email, model_name)
        duplicate_filename = data_filename.replace('.zip', '_DUPLICATE.zip')
        os.rename(data_filename, duplicate_filename)
        print('\033[91mSubmission has identical test results to an existing entry. '
              'Ignoring duplicate submission!\033[0m')
        return
    
    # Send results to author
    data_files = get_result_files(saved_folder, filenum, config.email_size_limit)
    send_results(author_email, model_name, rank, total, leaderboard_path, 
                data_files, exploit)
    
    if not fail:
        print(f'The Model has been processed and ranks as #{rank} on the leaderboard.')
    
    # Cleanup
    sys.path.remove(output_folder)

# Helper functions

def calculate_rmse_results(rmse, rmse_charge, config):
    """Calculate RMSE results for all test cases"""
    rmse_results = np.zeros(10)
    rmse_means = [np.mean(rmse[:, i]) for i in range(4)]
    
    rmse_results[0] = np.mean(rmse[rmse != 0])
    rmse_results[1] = rmse_means[1]
    rmse_results[2] = np.mean([rmse_means[0], rmse_means[2], rmse_means[3]])
    rmse_results[3] = np.mean(rmse_charge[rmse_charge != 0])
    rmse_results[4:8] = rmse_means
    
    # Separate standard and custom cycles
    standard_rmse = []
    custom_rmse = []
    total_cycles = config.normal_cycles + config.custom_cycles
    
    for i in range(0, len(rmse), total_cycles):
        standard_rmse.append(rmse[i:i+config.normal_cycles])
        custom_rmse.append(rmse[i+config.normal_cycles:i+total_cycles])
    
    standard_rmse = np.concatenate(standard_rmse)
    custom_rmse = np.concatenate(custom_rmse)
    
    rmse_results[8] = np.mean(standard_rmse[standard_rmse != 0])
    rmse_results[9] = np.mean(custom_rmse[custom_rmse != 0])
    
    return rmse_results

def weight_soc_offset_errors(rmse_soc_offset):
    """Weigh the values according to the datasize that produced it (90% iSOC >> 30% iSOC)"""
    rmse_soc_weighted = []
    
    for i in range(0, len(rmse_soc_offset), 3):
        for j in range(3):
            replication_factor = 3 - j  # Calculate the replication factor (3, 2, 1 for each j)
            rmse_soc_weighted.extend([rmse_soc_offset[i+j]] * replication_factor)
    
    return rmse_soc_weighted

def calculate_scores(rmse_results, mean_rmse_temp, rmse_soc_weighted, 
                     rmse_sens_offset_relevant):
    """Calculate all test scores"""
    scores = list(rmse_results)
    scores.extend(mean_rmse_temp)
    scores.append(np.mean(rmse_soc_weighted))
    scores.append(np.mean(rmse_sens_offset_relevant))
    return scores

def create_weighted_score_table(test_names, weights, scores):
    """Create a pandas DataFrame with weighted scores"""
    weighted_values = [w * s for w, s in zip(weights, scores)]
    
    df = pd.DataFrame({
        'Test_Case': test_names,
        'Weights': weights,
        'Scores': scores,
        'Weighted_Value': weighted_values
    })
    
    return df

def create_summary_barplot(rmse_results, tests, output_folder):
    """Create bar plot summary of RMSE results"""
    import matplotlib.pyplot as plt
    
    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.bar(range(len(rmse_results)), rmse_results)
    ax.set_xticks(range(len(rmse_results)))
    ax.set_xticklabels(tests, rotation=45, ha='right')
    ax.set_ylabel('SOC Estimation Average RMS Error (%)')
    ax.grid(True, alpha=0.3)
    ax.set_title('Test 1 to 8 RMS Error')
    
    # Add value labels on bars
    for i, (bar, val) in enumerate(zip(bars, rmse_results)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{val:.2f}%', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_folder, 'Test_01_to_08_RMSE.png'), dpi=150)
    plt.close()

def save_results(output_data, output_folder, saved_folder, filenum, size_limit):
    """Save error summary and figures"""
    import pickle
    
    # Save output data
    summary_file = os.path.join(output_folder, 'Error_Summary_Table.pkl')
    with open(summary_file, 'wb') as f:
        pickle.dump(output_data, f)
    
    # Create zip file
    zip_filename = os.path.join(saved_folder, f'Model_{filenum} Error Summary.zip')
    
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        zipf.write(summary_file, 'Error_Summary_Table.pkl')
        for file in os.listdir(output_folder):
            if file.endswith('.png'):
                zipf.write(os.path.join(output_folder, file), file)
    
    # Check size and split if necessary
    file_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    
    if file_size_mb > size_limit:
        # Split into two files
        zip_filename1 = os.path.join(saved_folder, 
                                     f'Model_{filenum} Error Summary 1 of 2.zip')
        zip_filename2 = os.path.join(saved_folder, 
                                     f'Model_{filenum} Error Summary 2 of 2.zip')
        
        with zipfile.ZipFile(zip_filename1, 'w') as zipf:
            zipf.write(summary_file, 'Error_Summary_Table.pkl')
        
        with zipfile.ZipFile(zip_filename2, 'w') as zipf:
            for file in os.listdir(output_folder):
                if file.endswith('.png'):
                    zipf.write(os.path.join(output_folder, file), file)
        
        os.remove(zip_filename)
        print('Figures were too large to send a single mail, the data was split up instead!')
    
    # Cleanup
    for file in os.listdir(output_folder):
        if file.endswith('.png'):
            os.remove(os.path.join(output_folder, file))
    os.remove(summary_file)

def create_leaderboard_entry(dt, author_name, affiliation, model_name, 
                             final_score, scores, rmse_results, mae, maxe, 
                             complexity, filenum):
    """Create a new leaderboard entry"""
    stats = {
        'Submission_Time': dt.strftime('%Y-%m-%d %H:%M:%S'),
        'Author': author_name,
        'Affiliation': affiliation,
        'Model_Name': model_name,
        'Weighted_Error': round(final_score, 3)
    }
    
    # Add all test scores
    for i, score in enumerate(scores):
        stats[f'Score_{i+1}'] = round(score, 3)
    
    stats['All_Drive_Cycles_Average_RMSE'] = round(rmse_results[0], 3)
    stats['All_Drive_Cycles_Average_MAE'] = round(np.mean(mae[mae != 0]), 3)
    stats['All_Drive_Cycles_Average_MAXE'] = round(np.mean(maxe[maxe != 0]), 3)
    stats['Complexity'] = complexity
    stats['Submission_ID'] = filenum
    
    return stats

def update_leaderboard(leaderboard_path, stats):
    """Update the leaderboard with new entry"""
    if os.path.exists(leaderboard_path):
        df = pd.read_csv(leaderboard_path)
        
        # Check for duplicates
        score_cols = [col for col in df.columns if col.startswith('Score_')]
        new_scores = np.array([stats[col] for col in score_cols])
        existing_scores = df[score_cols].values
        
        is_duplicate = np.any(np.all(existing_scores == new_scores, axis=1))
        
        if is_duplicate:
            return None, len(df), True
        
        # Add new entry
        new_row = pd.DataFrame([stats])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Sort by weighted error
        df = df.sort_values(['Weighted_Error', 'Submission_Time'])
        df['Position'] = range(1, len(df) + 1)
        
        # Find rank of new entry
        rank = df[df['Submission_ID'] == stats['Submission_ID']]['Position'].values[0]
        
    else:
        df = pd.DataFrame([stats])
        df['Position'] = 1
        rank = 1
    
    df.to_csv(leaderboard_path, index=False)
    
    return rank, len(df), False

def get_result_files(saved_folder, filenum, size_limit):
    """Get list of result files to attach to email"""
    single_file = os.path.join(saved_folder, f'Model_{filenum} Error Summary.zip')
    
    if os.path.exists(single_file):
        return single_file
    else:
        file1 = os.path.join(saved_folder, f'Model_{filenum} Error Summary 1 of 2.zip')
        file2 = os.path.join(saved_folder, f'Model_{filenum} Error Summary 2 of 2.zip')
        return [file1, file2]