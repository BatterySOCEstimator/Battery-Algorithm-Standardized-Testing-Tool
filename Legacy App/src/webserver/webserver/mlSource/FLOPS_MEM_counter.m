function [mean_FLOP, mean_MEMOPS] = FLOPS_MEM_counter(repeats, runtime)
    % Initialize variables
    FLOPS = zeros(1, repeats);          
    mem_count = zeros(1, repeats);          
    mem_loads = zeros(1, repeats);      
    N = 100000;                         % Array size for memory-bound operations
    array = rand(1, N);                 
    
    for i = 1:repeats                   % Monte Carlo iterations
        time = 0;
        result = 0;
        tic;                           
        % FLOPS COUNT
        while (time < runtime)          % Keep executing until runtime is exceeded
            result = result + rand() * rand();   % 2 FLOPs
            result = result + sqrt(rand());      % 2 FLOPs
            result = result + log(rand());       % 2 FLOPs
            FLOPS(i) = FLOPS(i) + 6; 
            time = toc;                   
        end
        FLOPS(i) = FLOPS(i) / time;      % FLOPs per second for this run
        % MEMORY COUNT
        time = 0;
        tic;                            
        while (time < runtime)          % Keep executing until runtime is exceeded
            for j = 1:100               
                result = array(randi(N)); 
            end
            mem_count(i) = mem_count(i) + 100;
            time = toc;                   
        end
        mem_loads(i) = mem_count(i) / time; 
    end
    
    % FINAL OUTPUTS
    mean_FLOP = mean(FLOPS); % Mean FLOP count across iterations
    mean_MEMOPS = mean(mem_loads); % Average memory-proxy loads
end