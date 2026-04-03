% Standardized Evaluation Tool - Atjen von Liebenstein, McMaster University
% in collaboration with University of Technology Eindhoven, 2024

%% latex figures
set(groot,'DefaultTextInterpreter', 'latex');
set(groot,'DefaultAxesTickLabelInterpreter','latex');
set(groot,'DefaultLegendInterpreter','latex');
set(groot,'DefaultLineLineWidth', 0.5);
set(groot,'DefaultLegendLocation', 'best');      
set(groot,'DefaultSurfaceDisplayName', 'latex');      
set(groot,'DefaultScatterDisplayName', 'latex');    

clear; close all; 
%% Setting email sender settings
setpref('Internet','E_mail','blindmodelstudy@gmail.com');       
setpref('Internet','SMTP_Server','smtp.gmail.com');
setpref('Internet','SMTP_Username','blindmodelstudy@gmail.com'); 
setpref('Internet','SMTP_Password','focnmrmqdxzgnljz');
props = java.lang.System.getProperties;
props.setProperty('mail.smtp.auth','true');
props.setProperty('mail.smtp.socketFactory.class', 'javax.net.ssl.SSLSocketFactory');
props.setProperty('mail.smtp.socketFactory.port','465');
%% Reading Files
rootfolder = dir().folder;
fileFolder = dir;                                       % Load current file directory
fileFolder = fileFolder.folder;                         % Select folder storage location (same for all files in directory)
fileFolder = strcat(fileFolder,"\Models");              % Select Models subfolder to be able to access new submissions
addpath(fileFolder);                                    % Add subfolder to file path
outputFolder = strcat(fileFolder,'\Blind Model');       % Create a path to temporary location where the model data will be unzipped
%% Remove files that have remained open from a previous session
figFiles = dir('*.fig');                                % Detect .fig files in folder
if ~isempty(figFiles)                                   % If .fig is detected                
    delete('*.fig')                                     % Delete left over figures
end
%% Track file number and saved models
if isfile(strcat(fileFolder,'\Leaderboard.csv'))        % Find if a leaderboard exists
    Ranking = readtable(strcat(fileFolder,'\Leaderboard.csv'), 'VariableNamingRule', 'preserve'); % Read excel
    filenum = size(Ranking,1) + 1;                      % Read highest rank number to find submission number
else
    filenum = 1;                                        % There is no leaderboard, so this is its first entry
end
temp = dir().folder;
tempFolder = strcat(temp,"\Models Saved");
temp = dir(strcat(temp,"\Models Saved"));   
modelDirs = temp(startsWith({temp.name}, 'Model__')); % Find previous saved models
temp = char({modelDirs.name});
temp = erase(mat2str(temp), ["Model__", ".zip", "'", " ","_CRASH","_EXPLOIT","_DUPLICATE"]); % Obtain all model numbers
maxsavedfile = max(str2num(temp));                      % Find the highest value
if ~isempty(maxsavedfile)                               % Only if there are saved models
    openFolder = strcat(outputFolder,'\',num2str(maxsavedfile));
else
    openFolder = [];
end
%% Email if old submission is still open and was interrupted
if exist(openFolder, 'dir') == 7                        % Find out if there is still an open Model submission
    exactzip = fullfile(tempFolder, strcat('Model__', mat2str(maxsavedfile), '.zip'));
    if isfile(exactzip)                                 % If the exact file is found
        movefile(fullfile(tempFolder,strcat('Model__', mat2str(maxsavedfile), '.zip')), fullfile(tempFolder,strcat('Model__', mat2str(maxsavedfile), '_CRASH.zip'))); % Add indication this was a crashed model
    else                                                % If an alternate name with ID is found (e.g. _DUPLICATE or _EXPLOIT versions)
        openzip = dir(fullfile(tempFolder, strcat('Model__', mat2str(maxsavedfile), '_*.zip'))).name; % Find .zip name for open submission
        movefile(fullfile(tempFolder,openzip), fullfile(tempFolder,strcat('Model__', mat2str(maxsavedfile), '_CRASH.zip'))); % Add indication this was a crashed model
    end
    if filenum == maxsavedfile                          % Check to see if model is already on leaderboard
        filepath = outputFolder;                        % Access temporary folder location
        if ~isempty(dir(strcat(filepath,'\*.xlsx')))                    % If there exists a *.xlsx file
            filename = dir(strcat(filepath,'\*.xlsx')).name;            % Find information associated to the .xlsx
            Settings_Data = readcell(strcat(filepath,'\',filename));    % Save settings data for mail
            Author_Email = Settings_Data(3,2);
            Model_Name = Settings_Data(4,2);
            title1_temp = {'Submission of "',Model_Name{1},'" was interrupted'}; % Add email title
            Title1 = join(title1_temp);
            sendmail(Author_Email{1},Title1{1}, ...                 % Write and send email for submission confirmation
              ['Dear Author, an error occured when we tried to process your submission. Please resubmit your model so we can process it again.' ...
              ' If you keep receiving this mail, your model might be causing our system to crash. Please contact support. Thank you!']);
            fprintf("A model was left open last session and was not completed, a request for resubmission has been mailed to the sender.\n")
        filenum = maxsavedfile + 1;                         % Continue counting where the last error ended
        end
    elseif ~isempty(maxsavedfile) && maxsavedfile > filenum
        filenum = maxsavedfile + 1;                         % Find appropriate current file ID
    end
    rmpath(outputFolder);
    rmdir(outputFolder, 's')
    clearvars -except filenum fileFolder outputFolder props rootfolder
elseif maxsavedfile > filenum
    filenum = maxsavedfile;
end
%% Loading the testing files data 
load('Data_m80.mat')
Data(1) = Data_m80;
load('Data_m448.mat')
Data(2) = Data_m448;
load('Data_m448N.mat')
Data(3) = Data_m448N;
load('Data_m1000.mat')
Data(4) = Data_m1000;

%% Set variables and settings
detect = 0;
Inputs = {'Current', 'Voltage', 'Battery_Temp_degC'};
Setups = {'m80', 'm448','m448N','m1000'};
% Cycles = {'Other','UDDS','CC_CV_charge','HWFET','LA92','US06','HWCUST2','HWGRADE2'};
Normal_cycles = 4;
Custom_cycles = 2;
Tests = {'Test 1: All Cells','Test 2: Blinded Cell','Test 3: Non-Blinded Cells','Test 4: Charging','Test 5: 80 kg Payload','Test 5/6: 488 kg Payload HVAC On','Test 5/6: 488 kg Payload HVAC Off','Test 5: 1000 kg Payload', ...
                'Test 7: Standard Cycles (UDDS,LA92,HWEFT,US06)','Test 8: Non-Standard Cycles (HWGRADE,HWCUST)'}';
Tests_weighted = {'Test 1: All Cells','Test 2: Blinded Cell','Test 3: Non-Blinded Cells','Test 4: Charging','Test 5: 80 kg Payload ','Test 5/6: 488 kg Payload HVAC On','Test 5/6: 488 kg Payload HVAC Off','Test 5: 1000 kg Payload', ...
                'Test 7: Standard Cycles (UDDS,LA92,HWEFT,US06)','Test 8: Non-Standard Cycles (HWGRADE,HWCUST)', 'Test 9: -20C ambient temperature', 'Test 9: -10C ambient temperature', 'Test 9: 0C ambient temperature', 'Test 9: 10C ambient temperature',... 
                'Test 9: 25C ambient temperature', 'Test 9: 40C ambient temperature', 'Test 10: Initial SOC Error' , 'Test 11: Sensor offset'}';
Temperatures = {'-20$^o$C','-10$^o$C', '0$^o$C', '10$^o$C', '25$^o$C', '40$^o$C'};
set(groot, 'DefaultLegendFontSize', 7); 

%% Starting the loop
rundate = datestr(now, 'yyyy-mm-dd'); % Save current date as a string
uptime = 0;
fprintf('%s: Starting the blind modeling tool...\n',rundate)
while (1)                                                               % Start loop to indefinitely run script
    newDate = datestr(now, 'yyyy-mm-dd');
    if ~strcmp(rundate,newDate)
        rundate = newDate;
        uptime = uptime + 1;
        sendmail('kollmeyp@mcmaster.ca','Standardized Evaluation Tool Uptime',['The Standardized Evaluation Tool is still running. Uptime: ', num2str(uptime), ' days.']);
        fprintf('The tool has been running for %d days.\n', uptime)
    end
    %% Checking for .zip folders
    if ~isempty(dir(strcat(fileFolder,"\*.zip")))                       % Enter if there exists any *.zip file in folder
        if isempty(gcp('nocreate'))                                     % If a parallel pool is not yet running or was shut down due to idling
            parpool('local',2);                                         % Open a parallel pool
        end
        detect = 0;                                                     % Reset tracker for empty folder print
        MyFolderInfo = dir(fileFolder);                                 % Load directory of "Models" subfolder
        file = find(cellfun(@isempty,strfind(struct2table(MyFolderInfo).name,".zip"))==0); % Find .zip files
        Queue = length(file);
        fprintf('%i submissions waiting in queue, moving to buffer.\n', Queue)
        %% Process submission in temporary folder linked to ID
        for z = 1:Queue
            fprintf('Starting to process %i out of %i submissions in Buffer. Queue will be updated once this queue is fully processed.\n' , z, Queue)
            filename = strcat(fileFolder,'\',struct2table(MyFolderInfo).name{file(z)}); % Find location of first .zip
            ID = filenum + (z - 1);
            TempOutputFolder = strcat(outputFolder, '\',mat2str(ID));
            mkdir(TempOutputFolder);
            addpath(TempOutputFolder);
            Process_Submission(filename, ID, Data, TempOutputFolder, fileFolder, rootfolder, Inputs, Setups, Normal_cycles, Custom_cycles , Tests, Tests_weighted, Temperatures)  
            rmpath(TempOutputFolder);
            rmdir(TempOutputFolder, 's');
        end
    else                                                                % If no .zip was detected
        if mod(detect,120) == 0                                         % Print only once every 10 minutes (120*5=600sec)
            fprintf('No .zip folder detected, queue is empty. Waiting for a new model...\n')
        end
        pause(5)                                                        % Pause a bit before looking again
        detect = detect + 1;
    end
end                                                                     % Loop back to beginning of script