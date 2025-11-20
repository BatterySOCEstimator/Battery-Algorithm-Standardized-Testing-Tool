# Standardized Evaluation Tool - Python Version

This is the Python version of the MATLAB-based Standardized Evaluation Tool for battery State of Charge (SOC) estimation models.

## Overview

This tool processes user-submitted SOC estimation models, runs comprehensive tests, and returns detailed performance results via email.

## File Structure

```
├── standardized_evaluation_tool.py  # Main script
├── config.py                        # Configuration and constants
├── email_utils.py                   # Email sending functionality
├── process_submission.py            # Submission processing logic
├── validate_submission.py           # Validation of submissions
├── obtain_output_data.py           # Run all test cycles
├── create_figures.py               # Generate result figures
├── iterate_all.py                  # Model iteration functions
├── flops_mem_counter.py            # Complexity measurement
├── Data_m80.mat                    # Test data (80kg load)
├── Data_m448.mat                   # Test data (448kg load)
├── Data_m448N.mat                  # Test data (448kg, no HVAC)
└── Data_m1000.mat                  # Test data (1000kg load)
```

## Requirements

```bash
pip install numpy pandas scipy matplotlib openpyxl
```

### For MATLAB Model Support (Optional)

If you want to accept MATLAB `.m` files in addition to Python models:

```bash
# Install MATLAB Engine API for Python
# (Requires MATLAB installation)
cd "matlabroot/extern/engines/python"
python setup.py install

# Or use pip (MATLAB R2022b and later)
python -m pip install matlabengine
```

**Note**: Without MATLAB Engine, the tool will only accept Python models.

## Key Differences from MATLAB Version

### 1. **Model Format - DUAL SUPPORT**
The tool now supports **both** MATLAB and Python models!

#### Python Model Format:
```python
# Model.py
class Model:
    def __init__(self):
        # Initialize your model
        self.state = None
    
    def predict(self, inputs):
        """
        Predict SOC from current inputs
        
        Parameters:
        -----------
        inputs : numpy.ndarray
            [Current, Voltage, Temperature]
        
        Returns:
        --------
        soc : float
            Predicted State of Charge (0-1)
        """
        # Your prediction logic here
        return soc
```

#### MATLAB Model Format (Original):
```matlab
% Model.m
function [SOC_Pred, z] = Model(X, z)
    % Initialize state on first call
    if nargin < 2
        z = initialize_state();
    end
    
    % Your prediction logic here
    SOC_Pred = predict_soc(X, z);
    
    % Update state
    z = update_state(X, z);
end
```

The tool **automatically detects** which format is used!

### 2. **Figure Format**
- **MATLAB**: Saves as `.fig` files
- **Python**: Saves as `.png` files

### 3. **Data Storage**
- **MATLAB**: Uses `.mat` files for error summary
- **Python**: Uses `.pkl` (pickle) files for error summary

### 4. **Parallel Processing**
- **MATLAB**: Uses `parpool` and `parfeval`
- **Python**: Uses `signal` module for timeout handling

### 5. **Email Configuration**
Update `email_utils.py` with your credentials:
```python
EMAIL_CONFIG = {
    'sender': 'your_email@gmail.com',
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 465,
    'username': 'your_email@gmail.com',
    'password': 'your_app_password'  # Use Gmail App Password
}
```

## Setup

1. **Install dependencies**:
   ```bash
   pip install numpy pandas scipy matplotlib openpyxl
   ```

2. **Configure email** in `email_utils.py`

3. **Place test data** (.mat files) in the same directory

4. **Create folder structure**:
   ```
   Models/           # For new submissions
   Models Saved/     # For processed submissions
   ```

5. **Run the tool**:
   ```bash
   python standardized_evaluation_tool.py
   ```

## Submission Format

Users can submit a `.zip` file containing **either** a Python or MATLAB model:

### Option 1: Python Submission
```
submission.zip
├── Model.py          # Python model class
└── Settings.xlsx     # Submission information
```

### Option 2: MATLAB Submission  
```
submission.zip
├── Model.m           # MATLAB function (or Model.p for protected code)
└── Settings.xlsx     # Submission information
```

**Settings.xlsx format:**
```
Row 1, Column B: Author Name
Row 2, Column B: Affiliation  
Row 3, Column B: Email
Row 4, Column B: Model Name
```

The tool automatically detects and processes both formats!

## Test Cases

The tool evaluates models across 11 test cases:

1. **Test 1**: Overall performance across all cells
2. **Test 2**: Blinded cell performance
3. **Test 3**: Non-blinded cell performance
4. **Test 4**: Charging cycle performance
5. **Test 5**: Different vehicle masses (80kg, 448kg, 1000kg)
6. **Test 6**: HVAC on/off comparison
7. **Test 7**: Standard drive cycles
8. **Test 8**: Custom drive cycles
9. **Test 9**: Temperature robustness (-20°C to 40°C)
10. **Test 10**: Initial SOC error tolerance
11. **Test 11**: Current sensor offset tolerance

## Scoring

Models are scored using weighted RMSE across all test cases. Lower scores indicate better performance.

## Output

For each submission, users receive:
- Leaderboard ranking
- Detailed RMSE, MAE, and MAXE for all test cycles
- Visualization figures showing:
  - SOC estimation vs actual
  - Error over time
  - Robustness to perturbations
- Complexity category

## Notes

### Platform Compatibility
- **Linux/Mac**: Full timeout functionality using `signal.alarm()`
- **Windows**: Timeout may not work; consider using `multiprocessing` module instead

### Memory Profiling
The MATLAB version uses `profile on -memory`. In Python, this is not directly included but can be added using:
```python
import tracemalloc
tracemalloc.start()
# ... code ...
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
```

### Performance
Python may be slower than MATLAB for numerical operations. Consider using:
- NumPy vectorization
- Numba JIT compilation
- Cython for critical sections

## Troubleshooting

**MATLAB models not working:**
- Ensure MATLAB Engine for Python is installed: `python -m pip install matlabengine`
- Verify MATLAB is in your system PATH
- Check that Model.m follows the expected function signature: `[SOC_Pred, z] = Model(X, z)`

**Email not sending:**
- Check Gmail settings for "Less secure app access" or use App Password
- Verify SMTP settings

**Timeout not working (Windows):**
- Replace `signal.alarm()` with `multiprocessing.Process` with timeout

**MATLAB data loading issues:**
- Ensure scipy version supports your .mat file format
- Use `scipy.io.loadmat()` with `struct_as_record=False`

**Performance with MATLAB models:**
- MATLAB Engine has some overhead for Python↔MATLAB communication
- For best performance, consider vectorizing operations where possible
- Each `predict()` call involves IPC (inter-process communication)

## Authors

Original MATLAB version: Atjen von Liebenstein, McMaster University