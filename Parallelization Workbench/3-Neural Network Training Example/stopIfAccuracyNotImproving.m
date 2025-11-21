%% Define Output Function
% Define the output function |stopIfAccuracyNotImproving(info,N)|, which stops
% network training if the best classification accuracy on the validation data
% does not improve for |N| network validations in a row. This criterion is similar
% to the built-in stopping criterion using the validation loss, except that it
% applies to the RMSE

function stop  = stopIfAccuracyNotImproving(info,P,S,T,JobID,Path)

Min_V=2.0; %Volts (Tesla Model 3)
Max_V=4.5; %Volts

stop = false;


persistent bestValRMSE
persistent valLag
persistent bestIteration


% Clear the variables when training starts.

if info.State == "start"
    bestValRMSE = 10000;
    valLag = 0;
    
    
elseif ~isempty(info.ValidationRMSE)
    
    if round(info.ValidationRMSE*((Max_V-Min_V)+Min_V)*1000,3) <= round(bestValRMSE,3)
        
        valLag = 0;
        bestValRMSE = round(info.ValidationRMSE*((Max_V-Min_V)+Min_V)*1000,3);
        bestIteration = info.Iteration;
        
    else
        valLag = valLag + 1;
    end
    
    if valLag >= P
        
        stop = true;
        % FileName = sprintf('%s%s%d%s%d_%d',Path,'\BestIteration_LSTM_(#',S,')_LGA7_',JobID,T);
        FileName=[Path,'/BestIteration_LSTM_(',char(S),')_TM3_',num2str(JobID),'_',num2str(T)];
        save(FileName, 'info', 'bestValRMSE','bestIteration');
        %         save BestIteration(05)(#2959_FNN_05L)(PANASONIC)
    end
    
    if isempty(bestValRMSE)
        bestValRMSE=10000;
        valLag = 2000;
    end
    
end

end