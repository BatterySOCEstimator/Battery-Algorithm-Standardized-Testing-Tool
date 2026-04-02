function Process_Submission(filename, filenum, Data, outputFolder, fileFolder, rootfolder, Inputs, Setups, Normal_cycles, Custom_cycles , Tests, Tests_weighted,Temperatures)  
    unzip(filename,outputFolder);                                   % Unzip .zip into temporary folder
    fprintf('Folder detected and .zip extracted, now deleting .zip file.\n');        
    delete(filename);                                               % Delete extracted .zip model folder 
    clear filename;
    DataFileName = fullfile(strcat(fileFolder,' Saved'), sprintf('Model__%d.zip',filenum)); % Create folder copy name
    zip(DataFileName,outputFolder);                                 % Zip copy into /Models Saved
    addpath(strcat(fileFolder,'\Blind Model'))                      % Add extracted folder to path
    %% Extracting settings and .m/.p file information
    filepath = outputFolder;                   % Access temporary folder location
    if ~isempty(dir(strcat(filepath,'\*.xlsx')))                    % If there exists a *.xlsx file with the correct format
        filename = dir(strcat(filepath,'\*.xlsx')).name;            % Find information associated to the .xlsx
        Settings_Data = readcell(strcat(filepath,'\',filename));    % Save settings data for mail
        if size(Settings_Data,1) == 4 && size(Settings_Data,2) == 2 % Check size of settings
        Author_Name = Settings_Data(1,2);
        Author_Affiliation = Settings_Data(2,2);
        Author_Email = Settings_Data(3,2);
        Model_Name = Settings_Data(4,2);
        if(isfile(strcat(filepath,'\Model.m')))||isfile(strcat(filepath,'\Model.p')) % Only continue if there is a Model.m or .p file
        title1_temp = {'Your model named "', Model_Name{1},'" has been received!'}; % Add email title
        Title1 = join(title1_temp);
        sendmail(Author_Email{1},Title1{1}, ...                 % Write and send email for submission confirmation
          ['Dear Author, Your data has been received and is being processed. An error summary of your results will be sent to you shortly, typically within ten minutes or less. If an error occurs, you will be notified. ' ...
          'If you have not received an email within 3h, please check your spam folder or contact us. Thank you for your submission!']);
        fprintf("Model.m or Model.p file found! Email sent that model was received correctly.\n")
        %% Validate whether submission can be run without error and doesn't exceed computation time, see "Validate_Submission.m"
        fail = Validate_Submission(Data, Author_Email);
        if fail == 1
            delete(DataFileName)
            return
        end
        %% Create all output data using Model
        [OutputData, RMSE, MAXE, MAE, RMSE_Charge, File, Complexity] = Obtain_Output_Data(Setups,Data,Inputs);
        
        %% Check for possible exploitation
        if mean(mean(RMSE)) > 15
            exploit = 1;
            fprintf(2,"WARNING: Possible exploitation detected, no data will be sent to user, please check output data!!!\n")
            temp = dir().folder;
            tempFolder = strcat(temp,"\Models Saved");
            movefile(fullfile(tempFolder,strcat('Model__',mat2str(filenum),'.zip')), ...
            fullfile(tempFolder,strcat('Model__',mat2str(filenum),'_EXPLOIT.zip')));
            clear temp; clear tempFolder;
        else
            exploit = 0;
        end
        %% Create all test figures and compute robustness errors
        [mean_RMSE_temp, RMSE_SOC_Offset, RMSE_Sens_Offset] = Create_Figures(OutputData,Inputs, Data, File, outputFolder,RMSE,Temperatures);

        %% Obtain average RMSE for all specified test case results
        RMSE_Results = zeros(10,1);
        RMSE_means = [mean(RMSE(:,1)),mean(RMSE(:,2)),mean(RMSE(:,3)),mean(RMSE(:,4))];
        RMSE_Results(1) = mean(nonzeros(RMSE));
        RMSE_Results(2) = RMSE_means(2);
        RMSE_Results(3) = mean([RMSE_means(1),RMSE_means(3),RMSE_means(4)]);
        RMSE_Results(4) = mean(nonzeros(RMSE_Charge));
        RMSE_Results(5:8) = RMSE_means(1:4);
        Standard_RMSE = [];
        Custom_RMSE = [];
        for i = 1:(Normal_cycles+Custom_cycles):length(RMSE)
            Standard_RMSE = [Standard_RMSE; RMSE(i:i+3,:)];
            Custom_RMSE = [Custom_RMSE; RMSE(i+4:i+5,:)];
        end
        Standard_RMSE_means = [mean(Standard_RMSE(:,1)),mean(Standard_RMSE(Standard_RMSE(:,2)~=0,2)),mean(Standard_RMSE(:,3)),mean(Standard_RMSE(:,4))];
        Custom_RMSE_means = [mean(Custom_RMSE(:,1)),mean(Custom_RMSE(Custom_RMSE(:,2)~=0,2)),mean(Custom_RMSE(:,3)),mean(Custom_RMSE(:,4))];
        RMSE_Results(9) = mean(Standard_RMSE_means);
        RMSE_Results(10) = mean(Custom_RMSE_means);
        RMSE_SOC_weighted = [];                                     % Weigh the values according to the datasize that produced it (90% iSOC >> 30% iSOC)
        for i = 0:3:length(RMSE_SOC_Offset)-3
            for j = 1:3
                replication_factor = 3 - (j - 1);                   % Calculate the replication factor (3, 2, 1 for each j)
                RMSE_SOC_weighted = [RMSE_SOC_weighted; repmat(RMSE_SOC_Offset(i+j), replication_factor, 1)];
            end
        end
        RMSE_Sens_Offset_relevant = RMSE_Sens_Offset([1 6 7 12 13 18]); % Ignore the 0.05A offsets since these are very small
        clear Standard_RMSE; clear Custom_RMSE;
        %% Create barplot figure for average RMSE per test case
        figure;
        b = bar(RMSE_Results);                                      % Create barplot
        set(gca, 'XTickLabel', Tests);                              % Name bars
        xtips1 = b(1).XEndPoints;
        ytips1 = b(1).YEndPoints;
        labels1 = strcat(compose("%.2f",b(1).YData),"\%");  
        text(xtips1,ytips1,labels1,'HorizontalAlignment','center','VerticalAlignment','bottom') % Add values on top of bars
        ylabel('SOC Estimation Average RMS Error (\%)', 'Interpreter','latex')
        grid on
        title('Test 1 to 8 RMS Error')

        savefig('Test 01 to 08 - RMSE (Bar plot)')                  % Save figure
        close
        %% Determine ranking score and weightings
        weightedScore = table('Size', [length(Tests_weighted),4], 'VariableTypes', {'string', 'single', 'single', 'single'},'VariableNames', {'Test_Case', 'Weights','Scores', 'Weighted_Value'});
        Weights = {0 1/10 1/10 1/10 1/30 2/30 2/30 1/30 1/10 1/10 1/60 1/60 1/60 1/60 1/60 1/60 1/10 1/10}'; % equal distribution per testcase
        Scores = {RMSE_Results(1),RMSE_Results(2),RMSE_Results(3),RMSE_Results(4),RMSE_Results(5),RMSE_Results(6),RMSE_Results(7),...
            RMSE_Results(8),RMSE_Results(9),RMSE_Results(10),mean_RMSE_temp(1),mean_RMSE_temp(2),mean_RMSE_temp(3),mean_RMSE_temp(4),mean_RMSE_temp(5),mean_RMSE_temp(6),mean(RMSE_SOC_weighted),mean(RMSE_Sens_Offset_relevant)}';
        weightedScore(:,1) = Tests_weighted;                        % Load test names to table
        weightedScore(:,2) = Weights;                               % Load weights to table
        weightedScore(:,3) = Scores;                                % Load scores to table
        for j = 1:length(Tests_weighted)
            weightedScore(j,4) = {cell2mat(Weights(j)).*cell2mat(Scores(j))};% Load weighted scores to table            
        end
        summary = weightedScore;
        Final_Score = sum(weightedScore{:,4});

        %% Delete any failed figures from folder
        clear Cycle_Name; clear Amb_Name; clear File
        if fail == 1                                            
            delete('*.fig')
            clearvars -except rootfolder detect Inputs Data filenum fileFolder outputFolder Tests Tests_weighted Setups Temperatures Normal_cycles Custom_cycles
            return
        end
        %% Save figures and Error summary
        save('Error_Summary_Table','OutputData')                        % Create a copy to also .zip with figures
        DataFileName = fullfile(strcat(fileFolder,' Saved'), sprintf('Model_%d Error Summary.zip',filenum)); % Create name for new zip where figures will be stored
        zip(DataFileName,{'Error_Summary_Table.mat','*.fig', '*.svg'}); % Load the copy and all figures to the zip
        fileInfo = dir(DataFileName);
        MB_Size = fileInfo.bytes/1024/1024;
        if MB_Size > 25                                                 % If everything together is too large to email, split up the data and the figures
            DataFileName1 = fullfile(strcat(fileFolder,' Saved'), sprintf('Model_%d Error Summary 1 of 2.zip',filenum)); % Create name for new zip where figures will be stored
            DataFileName2 = fullfile(strcat(fileFolder,' Saved'), sprintf('Model_%d Error Summary 2 of 2.zip',filenum)); % Create name for new zip where figures will be stored
            zip(DataFileName1,{'Error_Summary_Table.mat'});             % Load the copy and all data to the zip
            zip(DataFileName2,{'*.fig', '*.svg'});                      % Load the copy and all figures to the zip
            delete(DataFileName)                                        % Delete big zip file
            fprintf('Figures were too large to send a single mail, the data was split up instead!\n')
        end
        delete('*.fig')                                                 % Delete the generated pictures
        delete('*.svg')                                                 % Delete the generated pictures
        delete('Error_Summary_Table.mat')                               % Delete the error summary copy
        cd(rootfolder)
        %% Create leaderboard entry
        dt = datetime('now');                                           % Find current date and time
        dt.Format = 'yyyy-MM-dd HH:mm:ss';                              % Reshape the format
        stats{1,1} = cellstr(dt);                                       % Save the necessary information                                                    
        stats{1,2} = Author_Name;
        stats{1,3} = Author_Affiliation;
        stats{1,4} = Model_Name;
        stats{1,5} = round(Final_Score,3);
        for j = 1:18
            stats{1,j+5} = round(cell2mat(Scores(j)),3);
        end
        stats{1,24} = round(RMSE_Results(1),3);
        stats{1,25} = round(mean(nonzeros(MAE)),3);
        stats{1,26} = round(mean(nonzeros(MAXE)),3);
        stats{1,27} = Complexity;
        stats{1,28} = filenum;

        %% Emailing Author With for Results
        fprintf('Updating the leaderboard...\n')                        
        if isfile(strcat(fileFolder,'\Leaderboard.csv'))
            stats2 = readtable(strcat(fileFolder,'\Leaderboard.csv'), 'VariableNamingRule', 'preserve');  % Read leaderboard file
            stats2 = removevars(stats2,{'Position'});                       % Remove old ranking numbers
            existingScores = single(stats2{:, 5:26});                       % Columns 6 to 26 correspond to the test scores
            Duplicate = any(ismember(existingScores, [stats{(5:26)}] , 'rows')); % Detect any identical scoring leaderboard entries
            if Duplicate
                title2_temp = {Model_Name{1},'is already on the leaderboard!'};
                Title2 = join(title2_temp);
                sendmail(Author_Email{1},Title2{1}, ...
                    'Dear Author, your submission has identical results to an existing entry. For this reason your submission is not added to the leaderboard. If you think this is a mistake, please contact us. Thank you!')
                temp = dir().folder;
                tempFolder = strcat(temp,"\Models Saved");
                movefile(fullfile(tempFolder,strcat('Model__',mat2str(filenum),'.zip')), ...
                fullfile(tempFolder,strcat('Model__',mat2str(filenum),'_DUPLICATE.zip')));
                clear temp; clear tempFolder;
                fprintf(2,'Submission has identical test results to an existing entry. Ignoring duplicate submission!\n');
                return
            else
                stats2 = vertcat(stats,stats2);                             % Add new stats to leaderboard as a new row
                stats2 = sortrows(stats2,[5,1]);                            % Sorts leaderboard by weighted error
                stats2.Position = (1:height(stats2))';                      % Add new ranking numbers
                check = fopen(strcat(fileFolder,'\Leaderboard.csv'), 'a');
                while check == -1
                    fprintf(2,'The file is open in Excel. Please close it! Trying again in 60 seconds.\n');
                    pause(60);
                    check = fopen(strcat(fileFolder,'\Leaderboard.csv'), 'a');
                end
                fclose(check);
                writetable(stats2,strcat(fileFolder,'\Leaderboard.csv'))    % Write to leaderboard.csv file
                for F = 1:height(stats2)                                    % Find the same submission time to find the rank
                    if dateshift(dt, 'start', 'second')==dateshift(stats2.Submission_Time(F), 'start', 'second') % If same date has been found
                        f = F;                                              % Set rank to row found
                    end
                end
            end
        else                                                            % If leaderboard does not yet exist
            stats = cell2table(stats);                                  % Create a table form stats
            stats.Position = 1;                                         % Give only entry ranking 1
            stats.Properties.VariableNames = {'Submission_Time','Author','Affiliation','Model_Name','Weighted_Error','Test_1: All_Cells','Test_2: Blind_Cells','Test_3: Non-Blinded_Cells','Test_4: Charging','Test_5: 80kg_Payload','Test_5-6: 448kg_Payload_with_HVAC', ...
                                        'Test_5-6: 448kg_Payload_no_HVAC','Test_5: 1000kg_Payload','Test_7: Standard_Cycles','Test_8: Custom_Cycles','Test_9: n20C','Test_9: n10C','Test_9: 0C','Test_9: 10C','Test_9: 25C','Test_9: 40C','Test_10: iSOC_Error',...
                                        'Test_11: Current_Sensor_Error','All_Drive_Cycles_Average_RMSE', 'All_Drive_Cycles_Average_MAE','All_Drive_Cycles_Average_MAXE','Complexity','Submission_ID' 'Position'};
            writetable(stats,strcat(fileFolder,'\Leaderboard.csv'));    % Write to leaderboard.csv file
            f = 1;
            stats2 = stats;
        end
        
        title2_temp = {Model_Name{1},'model results are ready!'};
        Title2 = join(title2_temp);
        lbpath = strcat(fileFolder,'\Leaderboard.csv');
        
        if exploit == 0                                     % If submission seems valid, send results and timedata
            if MB_Size < 25                                 % If full zip is small enough, send in one go
                emailMessage = sprintf(['Dear Author, Thank you for submitting your model. The Model currently ranks %d out of %d total submissions. ' ...
                    'The leaderboard,error results for all drive cycles and test result figures are attached to this email. Thank you!'], f, height(stats2));
                sendmail(Author_Email{1},Title2{1}, emailMessage, {DataFileName{1}, lbpath{1}});
            else                                            % If full zip is too big, send in parts
                emailMessage1 = sprintf(['Dear Author, Thank you for submitting your model. The Model currently ranks %d out of %d total submissions. ' ...
                    'The leaderboard and error results for all drive cycles are attached to this email. Due to the size of the data the test result figures are sent in another mail. Thank you!'], f, height(stats2));
                sendmail(Author_Email{1},Title2{1}, emailMessage1, {DataFileName1{1}, lbpath{1}});
                emailMessage2 = sprintf('Dear Author, Attached are the test result figures. Thank you!');
                sendmail(Author_Email{1},Title2{1}, emailMessage2, DataFileName2{1});
            end
        else                                                % If submission seems exploitatitve, send ranking but no data
            emailMessage = sprintf(['Dear Author, Thank you for submitting your model. The Model currently ranks %d out of %d total submissions. ' ...
                'Due to large deviations, no error data will be sent to you, try to improve your estimation results using the open data before submitting your model. ' ...
                'A possible reason for unexpected deviation could be that NaN values are returned for some drive cycles. ' ...
                ' If you think this is a mistake, please contact us. Thank you!'], f, height(stats2));
            sendmail(Author_Email{1},Title2{1}, emailMessage, lbpath{1});
        end
        else                                                % If there is no *.xlsx file in the correct location   
            title1_temp = {'Your model named "',Model_Name{1},'" has been submitted incorrectly!'}; % Add email title
            Title1 = join(title1_temp);
            sendmail(Author_Email{1},Title1{1}, ...         % Write and send email for submission failure
              'Dear Author, Your submission has been submitted incorrectly. No Model.m or Model.p file was found. Please resubmit your .zip with the correct names in the right format. Thank you!');
            fprintf("No Model.m or Model.p file found in folder, email sent!\n")
            delete(DataFileName)
            return
        end
        else
            fprintf(".xlsx file has the wrong format, no e-mail could be sent!\n")
            delete(DataFileName)
            return
        end
    else                                                            % If there is no *.xlsx file in the correct location   
        fprintf("No .xlsx file found in folder, no e-mail could be sent!\n")
        delete(DataFileName)
        return
    end                                                             % End for each model uploaded
    if fail == 0
        fprintf('The Model has been processed and ranks as #%d on the leaderboard.\n',f)
        close all; clearvars -except rootfolder detect Inputs Data filenum fileFolder outputFolder Tests Tests_weighted Setups Temperatures Normal_cycles Custom_cycles
    end
end