function SOC_Pred = IterateAll(X)
    SOC_Pred = zeros(size(X, 1), 1); % Initialize array for results
    [SOC_Pred(1), z] = Model(X(1, :)); % Initial call
    for i = 2:size(X, 1)
        [SOC_Pred(i), z] = Model(X(i, :), z); % Iterative call with updated state
    end
end