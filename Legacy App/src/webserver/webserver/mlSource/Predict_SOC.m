function [SOC_Pred, time, Nsamples] = Predict_SOC(Inputs, File, Cycle, Offset, ISOC_idx)
% Inputs = the selection of inputs used for estimation (Voltage, Current, Temperature)
% Model = submitted model (Can still call any other files from thisfunction)
% File = Contains all Blind Data
% Cycle = Selected cycle to predict on
% OPTIONAL Offset = Add current offset
% OPTIONAL ISOC_idx = Add alternate index to start somewhere during cycle

if nargin < 4                                       % Standard setup, no current offset, no iSOC change
    Offset = 0;
    ISOC_idx = 1;
elseif nargin == 4                                  % Current offset
    ISOC_idx = 1;
elseif nargin == 5                                  % iSOC change

end
    for j = 2:length(Inputs)                        % Load V, I and T's data into X1
        temp  =  Inputs{j};
        X1(:,j) = File.Data{Cycle,1}.(temp)(ISOC_idx:end);              
        X(:,j) = [ones(3600,1).*X1(1,j);X1(:,j)];   % Add an hour of constant data in front
    end
    X1(:,1) = File.Data{Cycle,1}.Current(ISOC_idx:end) + Offset;
    if nargin < 5                                   % Current offset
        X(:,1) = [ones(3600,1).*X1(1,1);X1(:,1)];
        elseif nargin == 5  
        X(:,1) = [zeros(3600,1).*X1(1,1);X1(:,1)];
    end
    tic                                             % Start timer for model
    % profile on -memory
    SOC_Pred1 = IterateAll(X);                      % Run model for entire cycle   
    time = toc;                                  % End timer for model
    % profileData = profile('info'); % Fetch profiling information
    % profile off
    % func = profileData.FunctionTable;
    % MEM = max([func.PeakMem]); % memory in MB
    Nsamples = length(X);            % Divide total time by cycletime
    SOC_Pred = SOC_Pred1(3601:end);                 % Cut off appended initialization data
    SOC_Pred(isnan(SOC_Pred)) = 0;                  % Remove any NaN entries and set to zero
    % Users will see this reflected in their scores or will likely be marked as exploitative
end