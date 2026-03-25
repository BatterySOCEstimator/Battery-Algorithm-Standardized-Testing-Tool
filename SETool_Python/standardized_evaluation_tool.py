"""
Standardized Evaluation Tool
CLI entry point for processing a single battery SOC estimation model submission.

Usage:
    python standardized_evaluation_tool.py "uploads/user1/TestModel"

The path argument points to a directory that contains the submitted .zip file
(and nothing else, or at least one .zip).  The tool will:
  1. Validate and evaluate the model.
  2. On success – write results.zip to
         <submission_path>/results/results.zip
     and print a JSON object to stdout:
         {"error": false, "results_path": "<absolute path to results.zip>"}
  3. On failure – print a JSON object to stdout:
         {"error": true, "message": "<human-readable error description>"}

All intermediate/diagnostic prints go to stderr so they do not pollute the
JSON output on stdout.
"""

import sys
import json
import os
import glob
import scipy.io as sio
import shutil

from process_submission import process_submission
from config import Config

def _print_result(payload: dict):
    """Write the final JSON result to stdout."""
    print(json.dumps(payload))

def _fail(message: str):
    """Print a failure JSON and exit with a non-zero code."""
    _print_result({"error": True, "message": message})
    sys.exit(1)

def setup_matplotlib():
    """Configure matplotlib for LaTeX-style rendering"""
    import matplotlib
    matplotlib.use("Agg") # Use non-interactive backend for server environments
    import matplotlib.pyplot as plt
    plt.rcParams['text.usetex'] = False  # Set to True if LaTeX is installed
    plt.rcParams['font.family'] = 'serif'
    plt.rcParams['axes.labelsize'] = 10
    plt.rcParams['legend.fontsize'] = 7
    plt.rcParams['lines.linewidth'] = 0.5
    
def load_test_data():
    """Load the MATLAB .mat test data files"""
    data = {}
    data_files = [
        ('Data_m80_pyComp.mat', 'm80'),
        ('Data_m448_pyComp.mat', 'm448'),
        ('Data_m448N_pyComp.mat', 'm448N'),
        ('Data_m1000_pyComp.mat', 'm1000')
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
            print(f"Warning: {filename} not found!", file=sys.stderr)
    
    return data

def main():
    # ---- Parse CLI argument ----
    if len(sys.argv) < 2:
        _fail("No submission path provided."
              "Usage: python standardized_evaluation_tool.py <path_to_submission_dir>")
    
    submission_path = sys.argv[1]
    if not os.path.isdir(submission_path):
        _fail(f"Submission path does not exist or is not a directory: {submission_path}")
        
    # Locate the zip file
    zip_files = glob.glob(os.path.join(submission_path, "*.zip"))
    if not zip_files:
        _fail(f"No .zip file found in submission directory: {submission_path}")
    if len(zip_files) > 1:
        _fail(f"Multiple .zip files found in submission directory – expected exactly one: {submission_path}")
    
    zip_path = zip_files[0]
    
    # ---- Setup ----
    setup_matplotlib()
        
    # Initialize paths
    rootfolder = os.path.dirname(os.path.abspath(__file__))
    processing_folder = os.path.join(submission_path, "_processing")
    os.makedirs(processing_folder, exist_ok=True)  # Temporary working folder for extraction / figures

    config = Config() # Set variables and settings configuration
    
    print("Loading test data...", file=sys.stderr)
    data = load_test_data() # Load testing data
    if not data:
        _fail("Test data could not be loaded (.mat files).")
    
    # ---- Run Blind Evaluation Tool ----
    print("Starting the blind modeling tool...", file=sys.stderr)
    try:
        result = process_submission(
            zip_path=zip_path,
            submission_dir=submission_path,
            processing_folder=processing_folder,
            data=data,
            rootfolder=rootfolder,
            config=config,
        )
    finally:
        # Always clean up the temp processing folder
        if os.path.exists(processing_folder):
            shutil.rmtree(processing_folder)
    
    # Emit result JSON to stdout
    _print_result(result)
    if result.get("error"):
        sys.exit(1)

if __name__ == '__main__':
    main()