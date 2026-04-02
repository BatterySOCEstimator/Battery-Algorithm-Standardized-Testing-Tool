function fail = Validate_Submission(Data,Inputs) 
fprintf('Starting validation process...\n')
fail = 0;
Use = intersect(find(contains(Data(1).cycle{:,1}, 'UDDS')), find([Data(1).cycle{:,2}{:}]==10));
for j = 2:length(Inputs)                        % Load V, I and T's data into X1
    temp  =  Inputs{j};
    X1(:,j) = Data(1).cycle.Data{Use,1}.(temp);              
    X(:,j) = [ones(3600,1).*X1(1,j);X1(:,j)];   % Add an hour of constant data in front
end
X1(:,1) = Data(1).cycle.Data{Use,1}.Current + 0.3; % Use an offset to get a 'bad' case test of the model
X(:,1) = [ones(3600,1).*X1(1,1);X1(:,1)];
F = parfeval(@IterateAll,1,X);                          
didFinish = wait(F, 'finished', 60);        % If 1 is returned it finished within 40 seconds
if ~didFinish                               % Execution didnt finish in time
    cancel(F);                              % Cancel this iteration
    fprintf('ERROR CODE 4: SOC estimator function file has taken longer than the maximum runtime!\n')
    fail = 1;
    return
else
    try                                     % Detect any potential errors
        SOC_Pred1 = IterateAll(X);          % Attempt to run model
        if SOC_Pred1                        % check if NaN
        end
        Temptest = fetchOutputs(F);         % See if any errors occur when obtaining outputs
    catch ERROR
        Err_idx = strfind(ERROR.message,'a>')+3; % Some errors have weird messages, so remove location data first
        if isempty(Err_idx)
            Err_idx = 1; 
        end
        fprintf(strcat('ERROR CODE 0: SOC estimator function file has returned the following error: \n"',ERROR.message(Err_idx:end),'"\n'))
        fail = 1; 
        return
    end
end
fprintf('Validation passed!\n')
end
