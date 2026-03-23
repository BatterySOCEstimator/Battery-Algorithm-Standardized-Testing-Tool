import sys
import json
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler


# Function to load and preprocess test data
def load_test_data():
    
    try:
        test_df = pd.read_csv('val.csv')
        
        if 'Soc' not in test_df.columns:
            return None, None, 'Column "Soc" not found'
        
        if test_df.isnull().sum().sum() > 0:
            test_df = test_df.fillna(0)
        
        X_test = test_df.drop(columns=['Soc']).astype(float).values
        y_true = test_df['Soc'].astype(float).values
        
        scaler = StandardScaler()
        X_test_scaled = scaler.fit_transform(X_test)
        
        X_tensor = torch.tensor(X_test_scaled, dtype=torch.float32)
        y_tensor = torch.tensor(y_true, dtype=torch.float32)
        
        return X_tensor, y_tensor, None
    
    except Exception as e:
        return None, None, f'Failed to load test data: {str(e)}'

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No model path provided'}), flush=True)
        sys.exit(1)

    model_path = sys.argv[1]

    try:
        # Load checkpoint
        checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
        
        if not isinstance(checkpoint, dict):
            raise ValueError('Model must be saved as a dictionary with "state_dict" and "model_architecture"')
        
        # Dynamically execute the model class code
        exec(checkpoint['model_architecture'], globals())
        
        # Find the model class that was just defined
        model_class_name = None
        for name in globals():
            obj = globals()[name]
            if isinstance(obj, type) and issubclass(obj, nn.Module) and obj != nn.Module:
                model_class_name = name
                break
        
        if not model_class_name:
            raise ValueError('Could not find model class in saved architecture')
        
        # Instantiate model
        ModelClass = globals()[model_class_name]
        input_dim = checkpoint.get('input_dim')
        
        if input_dim:
            model = ModelClass(input_dim)
        else:
            model = ModelClass()
        
        model.load_state_dict(checkpoint['state_dict'])
        model.eval()
        
        # Load test data
        X_test, y_true, error = load_test_data()
        if error:
            print(json.dumps({'error': error}), flush=True)
            sys.exit(1)
        
        # Make predictions
        with torch.no_grad():
            y_pred_continuous = model(X_test).squeeze()
        
        # Use continuous values for regression (no classification)
        y_pred_np = y_pred_continuous.numpy()
        y_true_np = y_true.numpy()  
        
        metrics = {
            'mse': float(mean_squared_error(y_true_np, y_pred_np)),
            'mae': float(mean_absolute_error(y_true_np, y_pred_np)),
            'r2': float(r2_score(y_true_np, y_pred_np)),
            'rmse': float(np.sqrt(mean_squared_error(y_true_np, y_pred_np))),
            'samples_evaluated': int(len(y_true_np))
        }

        print(json.dumps(metrics), flush=True)

    except Exception as e:
        print(json.dumps({'error': f'Evaluation failed: {str(e)}'}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    main()