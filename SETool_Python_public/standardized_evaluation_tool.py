"""
Standardized Evaluation Tool
Main script for processing battery SOC estimation model submissions
"""

import os
import time
import glob
from datetime import datetime
import numpy as np
import scipy.io as sio
from pathlib import Path
import shutil

from email_utils import setup_email, send_email
from process_submission import process_submission
from config import Config

def setup_matplotlib():
    """Configure matplotlib for LaTeX-style rendering"""
    import matplotlib.pyplot as plt
    plt.rcParams['text.usetex'] = False  # Set to True if LaTeX is installed
    plt.rcParams['font.family'] = 'serif'
    plt.rcParams['axes.labelsize'] = 10
    plt.rcParams['legend.fontsize'] = 7
    plt.rcParams['lines.linewidth'] = 0.5

def main():
    # Setup
    setup_matplotlib()
    setup_email()
    
    # Initialize paths
    rootfolder = os.getcwd()
    file_folder = os.path.join(rootfolder, "Models")
    output_folder = os.path.join(file_folder, "Blind Model")
    saved_folder = os.path.join(rootfolder, "Models Saved")
    
    # Create directories if they don't exist
    os.makedirs(file_folder, exist_ok=True)
    os.makedirs(saved_folder, exist_ok=True)
    
    # Remove leftover .png files
    for png_file in glob.glob("*.png"):
        os.remove(png_file)
    
    # Track file number and saved models
    leaderboard_path = os.path.join(file_folder, 'Leaderboard.csv')
    if os.path.exists(leaderboard_path):
        import pandas as pd
        ranking = pd.read_csv(leaderboard_path)
        filenum = len(ranking) + 1
    else:
        filenum = 1 # There is no leaderboard, so this is its first entry
    
    # Check for saved models
    model_files = glob.glob(os.path.join(saved_folder, "Model__*.zip")) # Find previous saved models
    if model_files:
        # Extract model numbers
        model_nums = []
        for f in model_files:
            basename = os.path.basename(f)
            # Remove prefixes and suffixes
            num_str = basename.replace("Model__", "").replace(".zip", "")
            num_str = num_str.replace("_CRASH", "").replace("_EXPLOIT", "").replace("_DUPLICATE", "")
            try:
                model_nums.append(int(num_str))
            except ValueError:
                continue
        if model_nums:
            maxsavedfile = max(model_nums)
        else:
            maxsavedfile = None
    else:
        maxsavedfile = None
    
    # Handle interrupted submission
    if maxsavedfile:
        open_folder = os.path.join(output_folder, str(maxsavedfile))
        if os.path.exists(open_folder):
            handle_interrupted_submission(saved_folder, maxsavedfile, filenum, output_folder)
            if filenum == maxsavedfile:
                filenum = maxsavedfile + 1
            elif maxsavedfile > filenum:
                filenum = maxsavedfile + 1
            # Clean up
            if os.path.exists(output_folder):
                shutil.rmtree(output_folder)
        elif maxsavedfile > filenum:
            filenum = maxsavedfile
    
    # Load testing data
    print("Loading test data...")
    data = load_test_data()
    
    # Set variables and settings configuration
    config = Config()
    
    # Start main loop
    rundate = datetime.now().strftime('%Y-%m-%d')
    uptime = 0
    detect = 0
    
    print(f'{rundate}: Starting the blind modeling tool...')
    
    while True: # Start loop to indefinitely run script
        newdate = datetime.now().strftime('%Y-%m-%d')
        if rundate != newdate:
            rundate = newdate
            uptime += 1
            send_email(
                'kollmeyp@mcmaster.ca',
                'Standardized Evaluation Tool Uptime',
                f'The Standardized Evaluation Tool is still running. Uptime: {uptime} days.'
            )
            print(f'The tool has been running for {uptime} days.')
        
        # Check for .zip files
        zip_files = glob.glob(os.path.join(file_folder, "*.zip"))
        
        if zip_files:
            detect = 0
            queue_size = len(zip_files)
            print(f'{queue_size} submissions waiting in queue, moving to buffer.')
            
            # Process each submission
            for z, zip_file in enumerate(zip_files, 1):
                print(f'Starting to process {z} out of {queue_size} submissions in Buffer.')
                
                submission_id = filenum + (z - 1)
                temp_output_folder = os.path.join(output_folder, str(submission_id))
                os.makedirs(temp_output_folder, exist_ok=True)
                
                process_submission(
                    zip_file, submission_id, data, temp_output_folder,
                    file_folder, rootfolder, config
                )
                
                # Cleanup
                if os.path.exists(temp_output_folder):
                    shutil.rmtree(temp_output_folder)
            
            filenum += queue_size
        else:
            if detect % 120 == 0:  # Print every 10 minutes (120*5=600sec)
                print('No .zip folder detected, queue is empty. Waiting for a new model...')
            time.sleep(5)
            detect += 1

def load_test_data():
    """Load the MATLAB .mat test data files"""
    data = {}
    
    data_files = [
        ('Data_m80.mat', 'm80'),
        ('Data_m448.mat', 'm448'),
        ('Data_m448N.mat', 'm448N'),
        ('Data_m1000.mat', 'm1000')
    ]
    
    for filename, key in data_files:
        if os.path.exists(filename):
            mat_data = sio.loadmat(filename, squeeze_me=True, struct_as_record=False)
            # Extract the actual data structure
            for k in mat_data.keys():
                if not k.startswith('__'):
                    data[key] = mat_data[k]
                    break
        else:
            print(f"Warning: {filename} not found!")
    
    return data

def handle_interrupted_submission(saved_folder, maxsavedfile, filenum, output_folder):
    """Handle interrupted submissions from previous session"""
    exact_zip = os.path.join(saved_folder, f'Model__{maxsavedfile}.zip')
    
    if os.path.exists(exact_zip):
        # Rename to indicate crash
        crash_zip = os.path.join(saved_folder, f'Model__{maxsavedfile}_CRASH.zip')
        os.rename(exact_zip, crash_zip)
    else:
        # Find alternate name
        pattern = os.path.join(saved_folder, f'Model__{maxsavedfile}_*.zip')
        matches = glob.glob(pattern)
        if matches:
            crash_zip = os.path.join(saved_folder, f'Model__{maxsavedfile}_CRASH.zip')
            os.rename(matches[0], crash_zip)
    
    if filenum == maxsavedfile:
        # Try to find settings and email author
        filepath = output_folder
        xlsx_files = glob.glob(os.path.join(filepath, "*.xlsx"))
        
        if xlsx_files:
            import pandas as pd
            settings_data = pd.read_excel(xlsx_files[0], header=None)
            author_email = settings_data.iloc[2, 1]
            model_name = settings_data.iloc[3, 1]
            
            title = f'Submission of "{model_name}" was interrupted'
            message = (
                'Dear Author, an error occurred when we tried to process your submission. '
                'Please resubmit your model so we can process it again. '
                'If you keep receiving this mail, your model might be causing our system to crash. '
                'Please contact support. Thank you!'
            )
            send_email(author_email, title, message)
            print("A model was left open last session and was not completed, "
                  "a request for resubmission has been mailed to the sender.")

if __name__ == '__main__':
    main()