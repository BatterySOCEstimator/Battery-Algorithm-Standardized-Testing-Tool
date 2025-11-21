%% Functions
% The |padSequence| function pads or truncates the sequence in |data.X| to have 
% the specified sequence length and returns the result in a 1-by-1 cell.

function sequenceY = padSequenceY(data,sequenceLength)

    sequenceY = data.Y;
    [C,S] = size(sequenceY);

    if S < sequenceLength
        %     padding = zeros(C,sequenceLength-S);
        N=round((sequenceLength/S)*1);
        Pad=repmat(sequenceY,1,N);
        padding = Pad(:,1:sequenceLength-S);
        sequenceY = [sequenceY padding];
    else
        sequenceY = sequenceY(:,1:sequenceLength);
    end

    sequenceY = {sequenceY};

end