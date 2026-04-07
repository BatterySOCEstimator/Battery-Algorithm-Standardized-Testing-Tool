import numpy as np

# this is currently propegated with dummy values
# temp is currently not used with dummy values
def ocv_to_soc_lookup(voltage, temp):
    """
    Translates voltage to SOC percentage (0.0 to 1.0)
    Example for a 1S Lithium-Ion Battery
    """
    # Reference data: [Voltage, SOC]
    table = np.array([
        [4.20, 1.00],
        [4.05, 0.90],
        [3.95, 0.80],
        [3.85, 0.70],
        [3.75, 0.50],
        [3.70, 0.30],
        [3.60, 0.15],
        [3.20, 0.00]
    ])
    
    # Extract columns
    v_ref = table[:, 0]
    soc_ref = table[:, 1]
    
    # Use linear interpolation to find the SOC for the measured voltage
    return float(np.interp(voltage, v_ref[::-1], soc_ref[::-1]))


# age adjusted model with Periodic Reset, Efficiency, and aging
def Model(X, z=None, SOH=1.0):
    """
    Coulomb Counting SOC Estimator - Python version

    Parameters
    ----------
    X : array-like
        Measured [Current, Voltage, Temperature]
    z : float, optional
        Previous SOC state
    SOC: float, optional
        State of health from 0 to 1

    Returns
    -------
    Y_est : float
        Estimated SOC
    z : float
        Updated SOC state
    """
    Current, Voltage, Temp = X
    Nominal_Capacity = 4.55
    Actual_Capacity = Nominal_Capacity * SOH # Adjust for aging
    
    # Coulombic Efficiency
    eta = 0.98 if Current > 0 else 1.0 
    
    if z is None:
        # Use Voltage to find initial SOC instead of guessing 0.995
        z = ocv_to_soc_lookup(Voltage, Temp)
    
    # Calculate SOC
    dt = 1.0 # Assuming 1 second sample rate
    z = z + (eta * Current * dt) / (Actual_Capacity * 3600)
    
    # Periodic Reset: If current is zero for a long time, 
    # snap SOC to Voltage-based OCV to kill the drift.
    if abs(Current) < 0.01:
        z = 0.8 * z + 0.2 * ocv_to_soc_lookup(Voltage, Temp)

    return float(z), z