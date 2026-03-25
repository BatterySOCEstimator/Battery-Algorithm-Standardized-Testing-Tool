"""
FLOPS and Memory Operations Counter
Measure device speeds for complexity calculation
"""

import numpy as np
import time

def flops_mem_counter(repeats=1, runtime=1):
    """
    Estimate FLOPS and memory operations per second for the current system
    
    Parameters:
    -----------
    repeats : int
        Number of Monte Carlo iterations
    runtime : float
        Target runtime for each iteration in seconds
        
    Returns:
    --------
    mean_flop : float
        Mean floating point operations per second
    mean_memops : float
        Mean memory operations per second
    """
    flops = np.zeros(repeats)
    mem_count = np.zeros(repeats)
    mem_loads = np.zeros(repeats)
    
    N = 100000  # Array size for memory-bound operations
    array = np.random.rand(N)
    
    for i in range(repeats): # Monte Carlo iterations
        # FLOPS COUNT
        time_elapsed = 0
        result = 0
        flop_count = 0
        
        start_time = time.time()
        
        while time_elapsed < runtime: # Keep executing until runtime is exceeded
            # 2 FLOPs: multiplication and addition
            result = result + np.random.rand() * np.random.rand()
            
            # 2 FLOPs: sqrt
            result = result + np.sqrt(np.random.rand())
            
            # 2 FLOPs: log
            result = result + np.log(np.random.rand() + 1e-10)  # Add small value to avoid log(0)
            
            flop_count += 6
            time_elapsed = time.time() - start_time
        
        flops[i] = flop_count / time_elapsed
        
        # MEMORY COUNT
        time_elapsed = 0
        mem_ops = 0
        
        start_time = time.time()
        
        while time_elapsed < runtime:
            for j in range(100):
                result = array[np.random.randint(0, N)]
            
            mem_ops += 100
            time_elapsed = time.time() - start_time
        
        mem_loads[i] = mem_ops / time_elapsed
    
    # Calculate means
    mean_flop = np.mean(flops) # Mean FLOP count across iterations
    mean_memops = np.mean(mem_loads) # Average memory-proxy loads
    
    return mean_flop, mean_memops

def calculate_complexity_score(time_samples, n_samples, flops_per_sec, memops_per_sec):
    """
    Calculate complexity score based on timing data
    
    Parameters:
    -----------
    time_samples : numpy.ndarray
        Time taken for each cycle
    n_samples : numpy.ndarray
        Number of samples in each cycle
    flops_per_sec : float
        System FLOPS capability
    memops_per_sec : float
        System memory ops capability
        
    Returns:
    --------
    complexity_category : str
        Complexity category range
    score_range : tuple
        Score range boundaries
    """
    # Calculate time per sample
    t_sample = time_samples / n_samples
    
    # Calculate time per operation
    t_flop = 1 / flops_per_sec
    t_mop = 1 / memops_per_sec
    
    # Calculate weights
    alpha = t_flop / (t_flop + t_mop)
    beta = t_mop / (t_flop + t_mop)
    
    # Calculate complexity score
    complexity_score = t_sample / (t_flop * beta + t_mop * alpha)
    mean_complexity = np.mean(complexity_score)
    
    # Determine category
    category, score_range = get_complexity_category(mean_complexity)
    
    return category, score_range

def get_complexity_category(complexity_score):
    """
    Determine complexity category from score
    
    Parameters:
    -----------
    complexity_score : float
        Calculated complexity score
        
    Returns:
    --------
    category_str : str
        Category range string (e.g., "5,6,7")
    score_range : tuple
        Score range boundaries
    """
    # Generate tick marks on logarithmic scale
    ticks = []
    for exponent in range(0, 7):  # 10^0 to 10^6
        base = 10 ** exponent
        ticks.extend([base, base * 10**(1/3), base * 10**(2/3)])
    
    # Find category
    log_score = np.log10(complexity_score)
    category = 1
    
    temp_score = complexity_score
    while temp_score > 10**(1/3):
        temp_score /= 10**(1/3)
        category += 1
    
    # Create category string
    category_str = f"{category-1},{category},{category+1}"
    
    # Get score range
    if category - 1 < len(ticks) and category + 1 < len(ticks):
        score_range = (ticks[category-1], ticks[category+1])
    else:
        score_range = (1, 1000000)
    
    return category_str, score_range