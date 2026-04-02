function [OutputData,RMSE, MAXE, MAE, RMSE_Charge, File, Complexity] = Obtain_Output_Data(Setups,Data,Inputs)
c = 1;
columnLabels = {'Temperature [C]', 'RMSE', 'MAE', 'MAEX', 'Timeseries Actual SOC', 'Timeseries Estimate SOC'};  % Define column labels
[S, maxidx] = max([size(Data(1).cycle,1),size(Data(2).cycle,1),size(Data(3).cycle,1),size(Data(4).cycle,1)]); % Find predetermined size for arrays
S2 = S - sum(strcmp(table2array(Data(maxidx).cycle(:,1)), 'Other') + strcmp(table2array(Data(maxidx).cycle(:,1)), 'CC_CV_charge')); % Find size for array without charge and other cycles
RMSE_t = zeros(S,length(Setups));                       % Initialize arrays to max size
MAE_t = zeros(S,length(Setups));
MAXE_t = zeros(S,length(Setups));
RMSE = zeros(S2,length(Setups));
MAE = zeros(S2,length(Setups));
MAXE = zeros(S2,length(Setups));
RMSE_Charge = zeros((S-S2)*4,1);
time = zeros(4,S);                                      % Create empty array for time tracking
Nsamples = zeros(4,S);
t_F = zeros(4,S);
t_M = zeros(4,S);

m = 1;                                                  % Counter for saving FLOPS calculations
for t = 1:4                                             % Repeat for all vehicle weight and settings
    k = 1;                                              % Reset Data counter
    setupName = Setups{t};                              % Load setup name 
    File = Data(t).cycle;                               % Load data for one weight + setting
    Cycle_Name = table2array(File(:,1));                % Load Cycle names
    indices = find(~(strcmp(Cycle_Name, 'Other') | strcmp(Cycle_Name, 'CC_CV_charge')));
    uniqueRowNames = cell(length(indices),1);           % Create unique Cycle names for table entries
    for i = 1:length(indices)
        uniqueRowNames{i} = sprintf('%s_%d', Cycle_Name{indices(i)}, i);
    end
    Amb_Name = table2array(File(:,2));                  % Load temperatures
    cellData = table('Size', [length(indices),6],'RowNames', uniqueRowNames,'VariableTypes', {'int8', 'single', 'single', 'single', 'timeseries', 'timeseries'},'VariableNames', columnLabels);
    for i = 1:1:length(Cycle_Name)                      % Load for each first testcase one by one 
        tempName = cell2mat(Amb_Name(i));               % Create array for all temperatures
        SOC_Act = File.Data{i,1}.SOC;           
        [SOC_Pred, time(t,i), Nsamples(t,i)] = Predict_SOC(Inputs, File, i);
        if mod(i,10) == 1
            [FLOPs_temp(m), MOPs_temp(m)] =  FLOPS_MEM_counter(1,1);
            m = m + 1;
        end
        t_F(t,i) = 1/FLOPs_temp(m-1);
        t_M(t,i) = 1/MOPs_temp(m-1);
        FLOPS_model(t,i) = time(t,i)/Nsamples(t,i)/t_F(t,i);                   % Calculate estimate of the FLOPS of the model
        MOPS_model(t,i) = time(t,i)/Nsamples(t,i)/t_M(t,i);
        RMSE_t(i,t) = 100*sqrt(mean((SOC_Act-SOC_Pred).^2));              % RMSE in rows anf folders columns
        MAE_t(i,t) = 100*(mean(abs(SOC_Act-SOC_Pred)));
        MAXE_t(i,t) = 100*max(abs(SOC_Act-SOC_Pred));
        if strcmp(Cycle_Name(i),'Other') || strcmp(Cycle_Name(i),'CC_CV_charge')% If cycle is Other or CC_CV_charge (not a testcase)
            if strcmp(Cycle_Name(i),'CC_CV_charge')                             % If it's a charge cycle
                RMSE_Charge(c) = 100*sqrt(mean((SOC_Act-SOC_Pred).^2));   % Save error for charge test
                c = c+1;
            end
        else                                                                    % If useful
            RMSE(k,t) = 100*sqrt(mean((SOC_Act-SOC_Pred).^2));
            MAE(k,t) = 100*(mean(abs(SOC_Act-SOC_Pred)));
            MAXE(k,t) = 100*max(abs(SOC_Act-SOC_Pred));
            %% Save data in Structured Table
            cellData{k, 1} = tempName;                              % TEMP
            cellData{k, 2} = RMSE_t(i,t);                           % RMSE
            cellData{k, 3} = MAE_t(i,t);                            % MAE
            cellData{k, 4} = MAXE_t(i,t);                           % MAXE
            cellData{k, 5} = timeseries(single(SOC_Act));           % Timeseries for SOC_Act
            cellData{k, 6} = timeseries(single(SOC_Pred));          % Timeseries for SOC_Pred
            k = k+1;
        end
        clear SOC_Act; clear SOC_Pred
    end
    OutputData.(setupName) = cellData;                          % Fill data into output log
end
N_samples = [Nsamples(1,:),Nsamples(2,:),Nsamples(3,:),Nsamples(4,:)]';    % create single column                        
time_a = [time(1,:),time(2,:),time(3,:),time(4,:)]';  
t_FLOP = [t_F(1,:),t_F(2,:),t_F(3,:),t_F(4,:)]';                           % create single column
t_MOP = [t_M(1,:),t_M(2,:),t_M(3,:),t_M(4,:)]';
t_sample = time_a./N_samples;
% FLOPs = time_a./N_samples./t_FLOP;
% MOPs = time_a./N_samples./t_MOP;
alpha = t_FLOP./(t_FLOP+t_MOP);
beta = t_MOP./(t_FLOP+t_MOP);
complexity_score = t_sample./(t_FLOP.*beta+t_MOP.*alpha);
[Complexity,~] = scoring(mean(complexity_score));
end

function [final_cat, score_range] = scoring(complexity_score)
    ticks = [];
    lowerLimit = log10(1);
    upperLimit = log10(1000000);
    for exponent = lowerLimit:upperLimit
    ticks = [ticks, [1,10^(1/3),10^(2/3)] .* 10.^exponent]; %#ok<AGROW> % Add steps within the current range
    end

    log = mean(complexity_score);
    cat = 1;
    while log > 10^(1/3)
    log = log/(10^(1/3));
    cat = cat + 1;
    end
    final_cat = strcat(num2str(cat-1),',',strcat(num2str(cat),',',num2str(cat+1)));
    % fprintf(strcat('This score is category'," ", num2str(cat),' which belongs in categories range: '," ", final_cat,'\n'))
    % fprintf('corresponding to a score between %i and %i\n',ticks(cat-1),ticks(cat+1))
    score_range = [ticks(cat+1), ticks(cat+3)];
end
