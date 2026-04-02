This document describes the contents of the blind modeling tool 2024

Folders:
- "/Failure test submissions" This folder contains test folders that are used to test the robustness of the 
   tool. Additionally it contains submissions that mimic users trying to exploit the tool, these should not be
   run on the active tool, since their entries are still added to the leaderboard:
	- "FAILURE_##_XXXX.zip" where ## is an error number and XXXX is the associated error
	- "EXPLOIT_##.zip" where ## is an exploit method number
- "/Models" This folder contains:
	- "leaderboard.csv" containing the leaderboard 
	- Any submissions as .zip folders
	- "/Blind Model": All temporary files associated with processing the submissions
- "/Models Saved" This folder contains the history and outputs of all previously submitted models
	- "Model__##_XXXXX.zip", where ## is the submission ID and XXXXX is one of the following attachments:
		- "CRASH", attached when a submission was still unfinished and the tool crashed, users are 
		  notified to resubmit their models.
		- "DUPLICATE", attached when an identical leaderboard entry was found, users are notified.
		- "EXPLOIT", attached when a submissions has a suspiciously high value RMSE for all drivecycles,
		  when this happens the user does not receive any output data, but their results are still 
		  added to the leaderboard, users are notified to improve their models using open data first.
	   These allow us to more easily find the submitted models that are likely to be requested to be looked
	   at by users.
	- "Model_## Error Summary", "Model_## Error Summary 1 of 2", and "Model_## Error Summary 2 of 2"
	   where ## is the submission ID. These contain the leaderboard, the error results, timeseries data, 
	   and figures, either in one or two .zip folders depending on the total size being above or 25MB. 
	   When split all figures are presented in 2 of 2, whilst the rest is found in 1 of 2.

Files:
- "Standardized_Evaluation_Tool.m" This file contains the main script that runs the evaluation tool.
- "Create_Figures.m" This function is called to generate all the figures and run robustness tests.
- "Data_m80.mat" This file contains the Blind data for 80kg load.
- "Data_m448.mat" This file contains the Blind data for 448kg load.
- "Data_m448N.mat" This file contains the Blind data for 448kg load with no air conditioning.
- "Data_m1000.mat" This file contains the Blind data for 1000kg load.
- "IterateAll.m" This function is called to run each sample in a cycle one by one.
- "Obtain_Output_Data.m" This function is called to run all the drive cycles and obtain the outputs.
- "Predict_SOC.m" This function is used to load and then simulate a drive cycle using the model.
- "Process_Submission.m" This function is called to process a single submission.
- "Validate_Submission.m" This function is called to check the validity of a submission and avoid any errors.
- "FLOPS_MEM_counter.m" This function is called to measure device speeds for complexity calculation.
