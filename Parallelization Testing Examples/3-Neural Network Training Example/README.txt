
The following files are used for battery state of charge estimation using recurrent neural networks (RNN) with a long short-term memory cell (LSTM). 
Original work was completed by Carlos Vidal and updated by Fauzia Khanum. Scripts/code were updated using MATLAB version 2021b.

Files:
	LSTM_Training_Algorithm.mlx -- Sample SOC estimation training and testing live MATLAB file
	padSequence.m and padSequenceY.m -- used for LSTM to ensure dataset files are equal size for training.
	stopIfAccuracyNotImproving.m -- output function used to determine end of training based on Patience variable
	Results_SOC_Estimation_LSTM_TM3_Size_#571_1_1_08-Mar-2022 -- results and network from sample training, parameter details below

To run LSTM training:
1. Prepare your training, test, and validation data or use the ones provided (no modifications are needed)
2. Set current folder to "3-Neural Network Training Algorithm Example" in MATLAB
4. Make sure zipped dataset folders are in the same directory as the scripts or update script to where datasets are located
5. Run with command: LSTM_Training_Algorithm(100,50,0.01,20,0.85,1,1,1,1) --> example parameters
	--> see live script for parameters (Epochs, Patience, InitialLearnRate, LearnRateDropPeriod, LearnRateDropFactor, 	Repetitions, Computer, JobID, task)
6. The output data contains the network parameters in "NETS", these can be used to create your SOC estimation function as seen in the Recurrent Neural Network model example.

------------------------------------------------------------------------------------

Sample Network:
The sample network was trained on SHARCNET using the attached data, script, and the following parameters:
Number of hidden units = 10
Epochs = 100000
Patience = 4000
Repetitions = 5
Output = 1
Input = 3
Learn Rate Drop Period = 1000
Initial Learn Rate = 0.0100
Learn Rate Drop Factor = 0.8500
Validation Frequency = 3

It ran for 15174 epochs and 1255 min. 