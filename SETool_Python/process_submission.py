"""
Process a single user submission and generate results.

Returns a dict (to be serialised as JSON by the caller):
    Success: {"error": False, "results_path": "<absolute path to results.zip>"}
    Failure: {"error": True,  "message": "<description>"}
"""

import os
import sys
import zipfile
import numpy as np
import pandas as pd

from validate_submission import validate_submission
from obtain_output_data import obtain_output_data
from create_figures import create_figures


def _fail(message: str) -> dict:
    print(f"FAIL: {message}", file=sys.stderr)
    return {"error": True, "message": message}


def process_submission(zip_path, submission_dir, processing_folder,
                       data, rootfolder, config):
    """
    Process a model submission.

    Parameters
    ----------
    zip_path : str
        Absolute path to the submitted .zip file.
    submission_dir : str
        Directory that *contains* the zip (i.e. uploads/<userId>/<modelName>).
        The results zip will be written to
            <submission_dir>/results/results.zip
    processing_folder : str
        Scratch directory for extraction / figure generation.
    data : dict
        Pre-loaded test data for all vehicle masses.
    rootfolder : str
        Root directory of the evaluation tool (for os.chdir restoration).
    config : Config
        Configuration object with all settings.

    Returns
    -------
    dict
        {"error": False, "results_path": "..."}   on success
        {"error": True,  "message": "..."}         on failure
    """
    # Extract zip file into processing folder
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(processing_folder)
        print("Zip extracted successfully.", file=sys.stderr)
    except Exception as e:
        return _fail(f"Failed to extract zip file: {e}")
    
    sys.path.insert(0, processing_folder)
    
    try:
        result = run_evaluation(
            processing_folder=processing_folder,
            submission_dir=submission_dir,
            data=data,
            rootfolder=rootfolder,
            config=config,
        )
    finally:
        # Always remove the processing folder from sys.path
        if processing_folder in sys.path:
            sys.path.remove(processing_folder)
        # Restore working directory in case create_figures moved it
        os.chdir(rootfolder)

    return result
    

def run_evaluation(processing_folder, submission_dir, data, rootfolder, config):
    """ Core evaluation logic; returns result dict."""

    # Verify Model.py exists
    model_file_py = os.path.join(processing_folder, 'Model.py')
    if not os.path.exists(model_file_py):
        return _fail("No Model.py file found in submission zip.")
    print("Model file found!")
    
    
    # Validate if submission can run without error and doesn't exceed computation time
    print("Starting validation...", file=sys.stderr)
    validation_result = validate_submission(data, config.inputs, processing_folder)
    if validation_result is True or (isinstance(validation_result, tuple) and validation_result[0] is True):
        return _fail("Validation failed: model could not be loaded or timed out. "
                     "Check stderr for details.")
    _, user_model = validation_result
    
    
    # Run all test cycles
    print("Running test cycles...", file=sys.stderr)
    try:
        output_data, rmse, maxe, mae, rmse_charge, file_data, complexity = \
            obtain_output_data(config.setups, data, config.inputs, user_model)
    except Exception as e:
        return _fail(f"Error during test cycle evaluation: {e}")

    # # Check for possible exploitation   - BRU make sure to change exploit=False in line 191
    # if np.mean(rmse) > 15:
    #     exploit = True
    #     print("\033[91mWARNING: Possible exploitation detected, no data will be sent to user, please check output data!!!\033[0m")
    #     # Rename saved file to indicate exploit
    #     exploit_filename = data_filename.replace('.zip', '_EXPLOIT.zip')
    #     os.rename(data_filename, exploit_filename)
    # else:
    #     exploit = False
    
    
    # Generate figures + Robustness analysis
    print("Generating figures...", file=sys.stderr)
    try:
        mean_rmse_temp, rmse_soc_offset, rmse_sens_offset = create_figures(
            user_model, output_data, config.inputs, data,
            file_data, processing_folder, rmse, config.temperatures,
        )
    except Exception as e:
        return _fail(f"Error during figure generation: {e}")
    os.chdir(rootfolder) # create_figures calls os.chdir; restore now
    
    
    # ---- Score Calculations ----
    print("Calculating scores...", file=sys.stderr)
    rmse_results = calculate_rmse_results(rmse, rmse_charge, config) # Calculate average RMSE for all specified test case results
    rmse_soc_weighted = weight_soc_offset_errors(rmse_soc_offset) # Weight SOC offset errors
    rmse_sens_offset_relevant = [rmse_sens_offset[i] for i in [0, 5, 6, 11, 12, 17]] # Get relevant sensor offset errors (ignoring 0.05A offsets since these are very small)
    
    # Create bar plot figure for average RMSE per test case
    create_summary_barplot(rmse_results, config.tests, processing_folder)
    
    # Determine ranking score and weightings
    scores = calculate_scores(rmse_results, mean_rmse_temp, rmse_soc_weighted, # bru2: USE THIS FOR RANKING
                             rmse_sens_offset_relevant)
    
    # Load table of ranking scores and weightings
    weighted_score = create_weighted_score_table(config.tests_weighted, 
                                                  config.weights, scores)
    final_score = np.sum(weighted_score['Weighted_Value']) # - bru2: wrap in float()?
    
    print(f"Final weighted score: {final_score:.4f}", file=sys.stderr)
    
    
    # ---- Save Results ----
    # Bundle results into a zip and write to the canonical output path
    #    <submission_dir>/results/results.zip
    #    (submission_dir is already  uploads/<userId>/<modelName>)
    results_dir = os.path.join(submission_dir, "results")
    os.makedirs(results_dir, exist_ok=True)
    results_zip_path = os.path.join(results_dir, "results.zip")
    
    try:
        bundle_results(processing_folder, output_data, results_zip_path)
    except Exception as e:
        return _fail(f"Error bundling results zip: {e}")
    
    print(f"Results written to: {results_zip_path}", file=sys.stderr)
    
    return { # - bru2, prob need this for ranking
        "error": False,
        "results_path": os.path.abspath(results_zip_path),
        "final_score": round(final_score, 4),
        "complexity": complexity,
    }


def bundle_results(processing_folder, output_data, results_zip_path):
    """
    Write a single results.zip containing:
      - Error_Summary_Table.pkl  (serialised output_data dict)
      - all .png figures generated by create_figures
    """
    import pickle

    summary_file = os.path.join(processing_folder, 'Error_Summary_Table.pkl')
    with open(summary_file, 'wb') as f:
        pickle.dump(output_data, f)

    with zipfile.ZipFile(results_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(summary_file, 'Error_Summary_Table.pkl')
        for fname in os.listdir(processing_folder):
            if fname.endswith('.png'):
                zf.write(os.path.join(processing_folder, fname), fname)

    # Clean up intermediates from processing folder
    for fname in os.listdir(processing_folder):
        if fname.endswith('.png'):
            os.remove(os.path.join(processing_folder, fname))
    if os.path.exists(summary_file):
        os.remove(summary_file)

# ---- Scoring helper functions ----

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

def create_summary_barplot(rmse_results, tests, processing_folder):
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
    for bar, val in zip(bars, rmse_results):
        ax.text(bar.get_x() + bar.get_width()/2., bar.get_height(),
                f'{val:.2f}%', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(processing_folder, 'Test_01_to_08_RMSE.png'), dpi=150)
    plt.close()



