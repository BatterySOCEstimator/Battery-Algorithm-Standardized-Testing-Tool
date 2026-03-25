from standardized_evaluation_tool import load_test_data
from scipy.io import loadmat
import numpy as np
from config import Config

config = Config()

# data = loadmat(
#     "Data_m80_pyComp.mat",
#     squeeze_me=True,
#     struct_as_record=False
# )

data = load_test_data()

cycle = data['m80']

# Find UDDS cycle at 10C for m80
cycle_names = [str(name) for name in cycle[:, 0]]
temps = [float(t) for t in cycle[:, 1]]

for i, (name, temp) in enumerate(zip(cycle_names, temps)):
    if 'UDDS' in name and temp == 10:
        use_idx = i
        break
    
if use_idx is None:
    print("ERROR: Could not find UDDS at 10C in test data")
        
# Prepare input data with offset (worst case test)
cycle_data = cycle[use_idx][3] #  CONTINUE HERE TMRW
print(cycle_data.SOC)
print()

num_samples = len(cycle_data.Current)
X = np.zeros((num_samples + 3600, len(config.inputs)))

for j, input_name in enumerate(config.inputs):
    data_array = np.asarray(getattr(cycle_data, input_name)).flatten()
            
    if input_name == 'Current':
        data_array = data_array + 0.3 # Add offset
            
    # Prepend one hour of constant data
    X[:, j] = np.concatenate([np.ones(3600) * data_array[0], data_array])

print(X)
