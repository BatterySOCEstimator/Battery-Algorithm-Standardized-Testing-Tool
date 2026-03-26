"""
Configuration module for the Standardized Evaluation Tool
Contains all constants and settings
"""

class Config:
    """Configuration class containing all test parameters"""
    
    def __init__(self):
        # Input variables for model
        self.inputs = ['Current', 'Voltage', 'Battery_Temp_degC']
        
        # Setup names for different vehicle masses
        self.setups = ['m80', 'm448', 'm448N', 'm1000']
        
        # Drive cycles
        self.normal_cycles = 4
        self.custom_cycles = 2
        
        # Test case names
        self.tests = [
            'Test 1: All Cells',
            'Test 2: Blinded Cell',
            'Test 3: Non-Blinded Cells',
            'Test 4: Charging',
            'Test 5: 80 kg Payload',
            'Test 5/6: 488 kg Payload HVAC On',
            'Test 5/6: 488 kg Payload HVAC Off',
            'Test 5: 1000 kg Payload',
            'Test 7: Standard Cycles (UDDS,LA92,HWEFT,US06)',
            'Test 8: Non-Standard Cycles (HWGRADE,HWCUST)'
        ]
        
        # Test cases with weights
        self.tests_weighted = [
            'Test 1: All Cells',
            'Test 2: Blinded Cell',
            'Test 3: Non-Blinded Cells',
            'Test 4: Charging',
            'Test 5: 80 kg Payload ',
            'Test 5/6: 488 kg Payload HVAC On',
            'Test 5/6: 488 kg Payload HVAC Off',
            'Test 5: 1000 kg Payload',
            'Test 7: Standard Cycles (UDDS,LA92,HWEFT,US06)',
            'Test 8: Non-Standard Cycles (HWGRADE,HWCUST)',
            'Test 9: -20C ambient temperature',
            'Test 9: -10C ambient temperature',
            'Test 9: 0C ambient temperature',
            'Test 9: 10C ambient temperature',
            'Test 9: 25C ambient temperature',
            'Test 9: 40C ambient temperature',
            'Test 10: Initial SOC Error',
            'Test 11: Sensor offset'
        ]
        
        # Temperature labels
        self.temperatures = ['-20°C', '-10°C', '0°C', '10°C', '25°C', '40°C']
        
        # Weights for scoring (equal distribution per test case) - Used in Process_Submission.py
        self.weights = [
            0,      # Test 1: Overall (not weighted separately)
            1/10,   # Test 2: Blinded Cell
            1/10,   # Test 3: Non-Blinded Cells
            1/10,   # Test 4: Charging
            1/30,   # Test 5: 80 kg
            2/30,   # Test 5/6: 488 kg HVAC On
            2/30,   # Test 5/6: 488 kg HVAC Off
            1/30,   # Test 5: 1000 kg
            1/10,   # Test 7: Standard Cycles
            1/10,   # Test 8: Custom Cycles
            1/60,   # Test 9: -20C
            1/60,   # Test 9: -10C
            1/60,   # Test 9: 0C
            1/60,   # Test 9: 10C
            1/60,   # Test 9: 25C
            1/60,   # Test 9: 40C
            1/10,   # Test 10: Initial SOC Error
            1/10    # Test 11: Sensor offset
        ]
        
        # Initial SOC values for robustness testing
        self.isoc_values = [0.90, 0.60, 0.30]
        
        # Current sensor offsets for robustness testing
        self.current_offsets = [-0.3, -0.1, -0.05, 0.05, 0.1, 0.3]
        
        # Maximum runtime for validation (seconds)
        self.max_runtime = 60
