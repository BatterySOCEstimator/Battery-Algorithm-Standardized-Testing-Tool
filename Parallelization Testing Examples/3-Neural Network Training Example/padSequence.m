%% Functions
% The |padSequence| function pads or truncates the sequence in |data.X| to have 
% the specified sequence length and returns the result in a 1-by-1 cell.

function sequence = padSequence(data,sequenceLength)

    sequence = data.X;
    [C,S] = size(sequence);

    if S < sequenceLength
        N=round((sequenceLength/S)*1);
        Pad=repmat(sequence,1,N);

        padding = Pad(:,1:sequenceLength-S);
        sequence = [sequence padding];
    else

        sequence = sequence(:,1:sequenceLength);
    end

    % sequence = sequence(3:7,:);%%05INPUTS_No_Current_Voltage
    %sequence = sequence(C,:);%% For LSTM

    sequence = {sequence};

end