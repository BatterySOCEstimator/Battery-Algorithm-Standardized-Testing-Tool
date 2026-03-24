# Standardized Evaluation Tool - Python Version

This is the Python version of the MATLAB-based Standardized Evaluation Tool for battery State of Charge (SOC) estimation models.
Processes user-submitted SOC estimation models, runs comprehensive tests,
and returns results as a **JSON object printed to stdout** plus a **results zip**
written to a deterministic path on disk.

## Overview

This tool processes user-submitted SOC estimation models, runs comprehensive tests, and returns detailed performance results.

## File Structure

```
├── standardized_evaluation_tool.py  # CLI entry point
├── config.py                        # Configuration and constants
├── process_submission.py            # Evaluation pipeline
├── validate_submission.py           # Model loading & timed dry-run
├── obtain_output_data.py            # Run all test cycles
├── create_figures.py                # Generate result figures
├── iterate_all.py                   # Model iteration helpers
├── flops_mem_counter.py             # Complexity measurement
├── Data_m80_pyComp.mat              # Test data (80kg load)
├── Data_m448_pyComp.mat             # Test data (448kg load)
├── Data_m448N_pyComp.mat            # Test data (448kg, no HVAC)
└── Data_m1000_pyComp.mat            # Test data (1000kg load)
```

## CLI Interface

```bash
python standardized_evaluation_tool.py "uploads/user1/TestModel"
```

The single positional argument is the path to the submission directory.
That directory must contain exactly **one `.zip`** file (the user's submission).

### Output – stdout (JSON)

**Success**
```json
{
  "error": false,
  "results_path": "/absolute/path/to/uploads/user1/TestModel/results/results.zip",
  "final_score": 3.1416,
  "complexity": "5,6,7"
}
```

**Failure**
```json
{
  "error": true,
  "message": "Human-readable description of what went wrong."
}
```

The process exits with code `0` on success and `1` on failure.
All diagnostic / progress messages go to **stderr** so they do not
interfere with the JSON on stdout.

### Results zip location

```
<submission_path>/results/results.zip
```

For example, if you call:
```bash
python standardized_evaluation_tool.py uploads/user1/TestModel
```
the zip is written to:
```
uploads/user1/TestModel/results/results.zip
```

The zip contains:
- `Error_Summary_Table.pkl` – serialised results dict (all RMSE / MAE / MAXE time-series per setup)
- `Test_01_to_08_RMSE.png`
- `Test_02_03_06_Blind_vs_NonBlind.png`
- `Test_04_Charging.png`
- `Test_05_Vehicle_Masses.png`
- `Test_07_08_Drive_Cycles.png`
- `Test_09_Temperature_Bar.png`
- `Test_09_Temperature_Time.png`
- `Test_10_Initial_SOC.png`
- `Test_11_Sensor_Offset.png`
- `Test_11_Sensor_Offset_vs_Error.png`

Summary of returned zip file:
- Detailed RMSE, MAE, and MAXE for all test cycles
- Visualization figures showing:
  - SOC estimation vs actual
  - Error over time
  - Robustness to perturbations
- Complexity category

---

## Submission zip format

```
submission.zip
├── Model.py             # SOC estimator function
└── auxilliary_files.py  # Optional aux files needed for Model.py
```

**Python model format** (`Model.py` Example):
```python
# Model.py
def Model(X, z=None):
    X = np.asarray(X, dtype=float).reshape(-1)
    Current = X[0]
    Capacity = 4.55 
    if z is None:
        SOC = 0.995
        z = SOC
    else:
        previous_SOC = z
        SOC = previous_SOC + Current * (1.0 / 3600.0) / Capacity
        z = SOC

    Y_est = float(SOC)
    return Y_est, z
```

## Requirements

```bash
pip install numpy pandas scipy matplotlib
```

> **Note**: The timeout mechanism uses `signal.SIGALRM` and therefore
> only works on **Unix/Linux/macOS**.

---

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

---

## Credits

Original MATLAB version: Atjen von Liebenstein, McMaster University