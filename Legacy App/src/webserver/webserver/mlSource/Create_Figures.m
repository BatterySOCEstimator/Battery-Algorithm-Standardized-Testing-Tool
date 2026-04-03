function [mean_RMSE_temp, RMSE_SOC_Offset, RMSE_Sens_Offset] = Create_Figures(OutputData,Inputs, Data, File, outputFolder,RMSE,Temperatures)
    %% Finding dataset locations for output figures
    m448N_10C_LA92 = intersect(find(contains(OutputData.m448N.Properties.RowNames, 'LA92')), find(OutputData.m448N{:,1}==10));
    m448_10C_LA92 = intersect(find(contains(OutputData.m448.Properties.RowNames, 'LA92')), find(OutputData.m448{:,1}==10));
    m80_25C_US06 = intersect(find(contains(OutputData.m80.Properties.RowNames, 'US06')), find(OutputData.m80{:,1}==25));
    m80_25C_CC_CV = intersect(find(contains(File{:,1}, 'CC_CV')), find([File{:,2}{:}]==25));
    m80_10C_UDDS = intersect(find(contains(OutputData.m80.Properties.RowNames, 'UDDS')), find(OutputData.m80{:,1}==10));
    m448_10C_UDDS = intersect(find(contains(OutputData.m448.Properties.RowNames, 'UDDS')), find(OutputData.m448{:,1}==10));
    m1000_10C_UDDS = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'UDDS')), find(OutputData.m1000{:,1}==10));
    m1000_25C_HWFET = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'HWFET')), find(OutputData.m1000{:,1}==25));
    m1000_25C_HWCUST = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'HWCUST')), find(OutputData.m1000{:,1}==25));
    m1000_25C_HWGRADE = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'HWGRADE')), find(OutputData.m1000{:,1}==25));
    m80_n20C_UDDS = intersect(find(contains(OutputData.m80.Properties.RowNames, 'UDDS')), find(OutputData.m80{:,1}==-20));
    m80_0C_UDDS = intersect(find(contains(OutputData.m80.Properties.RowNames, 'UDDS')), find(OutputData.m80{:,1}==0));
    m80_40C_UDDS = intersect(find(contains(OutputData.m80.Properties.RowNames, 'UDDS')), find(OutputData.m80{:,1}==40));
    m80_25C_LA92 = intersect(find(contains(OutputData.m80.Properties.RowNames, 'LA92')), find(OutputData.m80{:,1}==25));
    m80_25C_LA92_D = intersect(find(contains(Data(1).cycle{:,1}, 'LA92')), find([Data(1).cycle{:,2}{:}]==25));
    m80_n10C_US06 = intersect(find(contains(OutputData.m80.Properties.RowNames, 'US06')), find(OutputData.m80{:,1}==-10));
    m80_n10C_US06_D = intersect(find(contains(Data(1).cycle{:,1}, 'US06')), find([Data(1).cycle{:,2}{:}]==-10));
    m80_10C_US06 = intersect(find(contains(OutputData.m80.Properties.RowNames, 'US06')), find(OutputData.m80{:,1}==10));
    m80_10C_US06_D =  intersect(find(contains(Data(1).cycle{:,1}, 'US06')), find([Data(1).cycle{:,2}{:}]==10));
    m1000_n10C_US06 = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'US06')), find(OutputData.m1000{:,1}==-10));
    m1000_10C_HWFET = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'HWFET')), find(OutputData.m1000{:,1}==10));
    m1000_40C_LA92 = intersect(find(contains(OutputData.m1000.Properties.RowNames, 'LA92')), find(OutputData.m1000{:,1}==40));
    m1000_n10C_US06_D = intersect(find(contains(File{:,1}, 'US06')), find([File{:,2}{:}]==-10));
    m1000_10C_HWFET_D = intersect(find(contains(File{:,1}, 'HWFET')), find([File{:,2}{:}]==10));
    m1000_40C_LA92_D = intersect(find(contains(File{:,1}, 'LA92')), find([File{:,2}{:}]==40));
    
    oldfolder = cd(outputFolder);
    addpath(oldfolder);
%% Test 02 and 03, and 06 Blind vs Non-Blind Cells / HVAC vs no HVAC
    figure;
    % Figures for m448N LA92 at 10C 
    SOC_Act = OutputData.m448N.(5)(m448N_10C_LA92,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m448N.(6)(m448N_10C_LA92,1).Data; % Load Normal prediction
    subplot(2,2,1)                                  % Plot estimation results for LA92 at 10C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('Non-blinded (m448N) LA92 at 10$^o$C');
    subplot(2,2,3)                                  % Plot RMSE results for LA92 at 10C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m448N.(2)(m448N_10C_LA92),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m448 LA92 at 10C 
    SOC_Act = OutputData.m448.(5)(m448_10C_LA92,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m448.(6)(m448_10C_LA92,1).Data;% Load Normal prediction
    subplot(2,2,2)                                  % Plot estimation results for LA92 at 10C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('Blinded (m448) LA92 at 10$^o$C');
    subplot(2,2,4)                                  % Plot RMSE results for LA92 at 10C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m448.(2)(m448_10C_LA92),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    savefig('Test 02, 03 and 06 - Blind vs Non-Blind Cells HVAC vs no HVAC _Time')
    close
%% Test 04 - Charging and Cycle_Time Domain Plot
    figure;
    % Figures for m80 US06 at 25C
    SOC_Act = OutputData.m80.(5)(m80_25C_US06,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m80.(6)(m80_25C_US06,1).Data;% Load Normal prediction
    subplot(2,2,1)                                  % Plot estimation results for US06 at 25C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 US06 at 25$^o$C');
    subplot(2,2,3)                                  % Plot RMSE results for US06 at 25C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m80.(2)(m80_25C_US06),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m80 Charge at 25C 
    Charge_idx = m80_25C_CC_CV;
    SOC_Act = File.Data{Charge_idx,1}.('SOC');      % Select the specific data            
    for j = 1:length(Inputs)                        % Load V, I and T's data into X1
        temp = Inputs{j};
        X1(:,j) = File.Data{Charge_idx,1}.(temp);   % Select the specific data            
        X(:,j) = [ones(3600,1).*X1(1,j);X1(:,j)];   % Add an hour of constant data in front
    end
    SOC_Pred1 = IterateAll(X);
    SOC_Pred = SOC_Pred1(3601:end,1);
    clear SOC_Pred1; clear X; clear X1;

    subplot(2,2,2)                                  % Plot estimation results for CC Charge at 25C
    plot((1:length(SOC_Act))/3610,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 max([max(SOC_Pred),max(SOC_Act)])*100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 Charging at 25$^o$C');
    subplot(2,2,4)                                  % Plot RMSE results for CC Charge at 25C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(100*sqrt(mean((SOC_Act-SOC_Pred).^2)),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    savefig('Test 04 - Charging')
    close
%% Test 05 - Range of vehicle masses
    figure; 
    % Figures for m80 UDDS at 10C
    SOC_Act = OutputData.m80.(5)(m80_10C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m80.(6)(m80_10C_UDDS,1).Data; % Load Normal prediction
    subplot(2,3,1)                                    % Plot estimation results 
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 UDDS at 10$^o$C');
    subplot(2,3,4)                                    % Plot RMSE results 
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m80.(2)(m80_10C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;
    
    % Figures for m448 UDDS at 10C 
    SOC_Act = OutputData.m448.(5)(m448_10C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m448.(6)(m448_10C_UDDS,1).Data; % Load Normal prediction
    subplot(2,3,2)                                    % Plot estimation results 
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m488 UDDS at 10$^o$C');
    subplot(2,3,5)                                    % Plot RMSE results 
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m448.(2)(m448_10C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m1000 UDDS at 10C
    SOC_Act = OutputData.m1000.(5)(m1000_10C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m1000.(6)(m1000_10C_UDDS,1).Data;% Load Normal prediction
    subplot(2,3,3)                                    % Plot estimation results 
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 UDDS at 10$^o$C');
    subplot(2,3,6)                                    % Plot RMSE results 
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m1000.(2)(m1000_10C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    savefig('Test 05 - Range of Vehicle masses')
    close
%% Test 07 & 08 - Non-Standard Drive-Cycles
    figure;
    % Figures for m1000 HWFET at 25C
    SOC_Act = OutputData.m1000.(5)(m1000_25C_HWFET,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m1000.(6)(m1000_25C_HWFET,1).Data;% Load Normal prediction
    subplot(2,3,1)                                  % Plot estimation results for HWFET at 25C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 HWFET at 25$^o$C');
    subplot(2,3,4)                                  % Plot RMSE results for HWFET at 25C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m1000.(2)(m1000_25C_HWFET),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m1000 HWCUST at 25C
    SOC_Act = OutputData.m1000.(5)(m1000_25C_HWCUST,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m1000.(6)(m1000_25C_HWCUST,1).Data;% Load Normal prediction
    subplot(2,3,2)                                  % Plot estimation results for HWCUST at 25C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 HWCUST at 25$^o$C');
    subplot(2,3,5)                                  % Plot RMSE results for HWCUST at 25C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m1000.(2)(m1000_25C_HWCUST),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m1000 HWGRADE at 25C
    SOC_Act = OutputData.m1000.(5)(m1000_25C_HWGRADE,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m1000.(6)(m1000_25C_HWGRADE,1).Data;% Load Normal prediction
    subplot(2,3,3)                                  % Plot estimation results for HWGRADE at 25C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 HWGRADE at 25$^o$C');
    subplot(2,3,6)                                  % Plot RMSE results for HWGRADE at 25C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m1000.(2)(m1000_25C_HWGRADE),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    savefig('Test 07 and 08 - Standard vs Non-Standard Cycles') % Save figure
    close
%% Test 09 - RMSE vs Temperature barplot
    Nr_cycles = 6;
    Nr_temps = 6;
    mean_RMSE_temp = zeros(1,Nr_temps);
    for cycle = 1:Nr_cycles
        index_range = (cycle-1)*Nr_temps + (1:Nr_temps);
        mean_RMSE_temp(cycle) = mean(RMSE(index_range, 1)); % Mean for the current cycle
    end
    T = mean_RMSE_temp(1);
    mean_RMSE_temp(1) = mean_RMSE_temp(2);
    mean_RMSE_temp(2) = T;                              % Swap -10 and -20 to be in order low to high
    clear T;

    figure;
    b = bar(mean_RMSE_temp);
    set(gca, 'XTickLabel', Temperatures);
    xtips1 = b(1).XEndPoints;
    ytips1 = b(1).YEndPoints;
    labels1 = strcat(compose("%.1f",b(1).YData),"\%");
    text(xtips1,ytips1,labels1,'HorizontalAlignment','center','VerticalAlignment','bottom')
    ylabel('SOC Estimation Average RMS Error (\%)')
    xlabel('Ambient Temperature ($^o$C)')
    title('Test 09 - Error vs Temperature')

    savefig('Test 09 - RMS Error vs Temperature (Bar plot)') % Save figure
    close
%% Test 09 - RMSE vs Temperature on m80 UDDS
    figure;
    % Figures for m80 -20C UDDS
    SOC_Act = OutputData.m80.(5)(m80_n20C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m80.(6)(m80_n20C_UDDS,1).Data;% Load Normal prediction
    subplot(2,3,1)                                  % Plot estimation results for UDDS at -20C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 UDDS at -20$^o$C');
    subplot(2,3,4)                                  % Plot RMSE results for UDDS at -20C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m80.(2)(m80_n20C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    % Figures for m80 0C UDDS
    SOC_Act = OutputData.m80.(5)(m80_0C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m80.(6)(m80_0C_UDDS,1).Data;% Load Normal prediction
    subplot(2,3,2)                                  % Plot estimation results for UDDS at 0C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 UDDS at 0$^o$C');
    subplot(2,3,5)                                  % Plot RMSE results for UDDS at 0C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m80.(2)(m80_0C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
        
    % Figures for m80 40C UDDS
    SOC_Act = OutputData.m80.(5)(m80_40C_UDDS,1).Data;% Load Actual SOC
    SOC_Pred = OutputData.m80.(6)(m80_40C_UDDS,1).Data;% Load Normal prediction
    subplot(2,3,3)                                  % Plot estimation results for UDDS at 40C
    plot((1:length(SOC_Act))/3600,SOC_Act*100)            
    hold on
    plot((1:length(SOC_Act))/3600,SOC_Pred*100)            
    legend('Actual', 'Estimated', 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 UDDS at 40$^o$C');
    subplot(2,3,6)                                  % Plot RMSE results for UDDS at 40C
    plot((1:length(SOC_Act))/3600,(SOC_Act-SOC_Pred)*100)            
    legend(['RMSE ' num2str(OutputData.m80.(2)(m80_40C_UDDS),'%.1f') '$\%$'], 'IconColumnWidth', 5)
    ulim = 100*max(SOC_Act-SOC_Pred)+1;
    llim = 100*-min(SOC_Act-SOC_Pred)+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    clear SOC_Act; clear SOC_Pred;

    savefig('Test 09 - RMS Error vs Temperature (Time domain plot)') % Save figure
    close
%% Test 10 - Computing data for Initial SOC Error
    figure;
    ISOCs = [0.90, 0.60, 0.30];                     % Set initial SOC values to plot and compute
    ISOC_idx = zeros(1,length(ISOCs));              % save indexes for all the ISOCs options
    RMSE_SOC_Offset = zeros(1,9);                   % Initialize datasize for new errors 

    % Figures for m80 25C LA92
    SOC_Act = OutputData.m80.(5)(m80_25C_LA92,1).Data;% Load Actual SOC
    ErrorPlot = zeros(length(SOC_Act),length(ISOCs));% Initialize RMSE data as empty
    subplot(2,3,1)                                  % Plot estimation results for LA92
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for q = 1:length(ISOCs)
        ISOC_idx(q) = find(SOC_Act<ISOCs(q),1,'first');
        [SOC_Offset_Pred, ~] = Predict_SOC(Inputs, Data(1).cycle, m80_25C_LA92_D, 0, ISOC_idx(q));
        ErrorPlot(ISOC_idx(q):end,q) = (SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred)*100; 
        RMSE_SOC_Offset(0*length(ISOCs)+q) = 100*sqrt(mean((SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred).^2)); % Save RMSE values
        plot((ISOC_idx(q):length(SOC_Act))/3600,SOC_Offset_Pred*100)
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
        clear X1; clear X; clear SOC_Pred1; clear SOC_Offset_Pred;
    end
    legend('Actual','90\%','60\%', '30\%','NumColumns',1, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 LA92 at 25$^o$C');

    subplot(2,3,4) %Error
    hold on
    for q = 1:length(ISOCs)
        plot((ISOC_idx(q):length(SOC_Act))/3600,ErrorPlot(ISOC_idx(q):end,q))
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
    end
    legend(['90$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(1),'%.1f') '$\%$'], ...
        ['60$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(2),'%.1f') '$\%$'],['30$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(3),'%.1f') '$\%$'],'IconColumnWidth', 5)
    ulim = 1.2*max(max(ErrorPlot))+1;
    llim = 1.2*-min(min(ErrorPlot))+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    grid on
    clear ISOC_idx; clear ErrorPlot;

    % Figures for m80 n10C US06
    ISOC_idx = zeros(1,length(ISOCs));              % save indexes for all the ISOCs options
    SOC_Act = OutputData.m80.(5)(m80_n10C_US06,1).Data; % Load Actual SOC
    ErrorPlot = zeros(length(SOC_Act),length(ISOCs));% Initialize RMSE data as empty
    subplot(2,3,2)                                  % Plot estimation results for US06
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for q = 1:length(ISOCs)
        ISOC_idx(q) = find(SOC_Act<ISOCs(q),1,'first');
        [SOC_Offset_Pred, ~]= Predict_SOC(Inputs, Data(1).cycle, m80_n10C_US06_D, 0, ISOC_idx(q));
        ErrorPlot(ISOC_idx(q):end,q) = (SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred)*100; 
        RMSE_SOC_Offset(1*length(ISOCs)+q) = 100*sqrt(mean((SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred).^2)); % Save RMSE values
        plot((ISOC_idx(q):length(SOC_Act))/3600,SOC_Offset_Pred*100)
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
        clear X1; clear X; clear SOC_Pred1; clear SOC_Offset_Pred;
    end
    legend('Actual','90\%','60\%', '30\%','NumColumns',1, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 US06 at -10$^o$C');

    subplot(2,3,5) %Error
    hold on
    for q = 1:length(ISOCs)
        plot((ISOC_idx(q):length(SOC_Act))/3600,ErrorPlot(ISOC_idx(q):end,q))
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
    end
    legend(['90$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(4),'%.1f') '$\%$'], ...
        ['60$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(5),'%.1f') '$\%$'],['30$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(6),'%.1f') '$\%$'],'IconColumnWidth', 5)
    ulim = 1.2*max(max(ErrorPlot))+1;
    llim = 1.2*-min(min(ErrorPlot))+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    grid on
    clear ISOC_idx; clear ErrorPlot;

    % Figures for m80 10C US06
    ISOC_idx = zeros(1,length(ISOCs));              % save indexes for all the ISOCs options
    SOC_Act = OutputData.m80.(5)(m80_10C_US06,1).Data;% Load Actual SOC
    ErrorPlot = zeros(length(SOC_Act),length(ISOCs));% Initialize RMSE data as empty
    subplot(2,3,3)                                  % Plot estimation results for US06
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for q = 1:length(ISOCs)
        ISOC_idx(q) = find(SOC_Act<ISOCs(q),1,'first');
        [SOC_Offset_Pred, ~] =Predict_SOC(Inputs, Data(1).cycle, m80_10C_US06_D, 0, ISOC_idx(q));
        ErrorPlot(ISOC_idx(q):end,q) = (SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred)*100; 
        RMSE_SOC_Offset(2*length(ISOCs)+q) = 100*sqrt(mean((SOC_Act(ISOC_idx(q):end)-SOC_Offset_Pred).^2)); % Save RMSE values
        plot((ISOC_idx(q):length(SOC_Act))/3600,SOC_Offset_Pred*100)
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
        clear X1; clear X; clear SOC_Pred1; clear SOC_Offset_Pred;
    end
    legend('Actual','90\%','60\%', '30\%','NumColumns',1, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m80 US06 at 10$^o$C');

    subplot(2,3,6)%Error
    hold on
    for q = 1:length(ISOCs)
        plot((ISOC_idx(q):length(SOC_Act))/3600,ErrorPlot(ISOC_idx(q):end,q))
        xline(ISOC_idx(q)/3600, '-',{ 'iSOC',[num2str(ISOCs(q)*100,'%d') '\%']}, 'Interpreter', 'latex')
    end
    legend(['90$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(7),'%.1f') '$\%$'], ...
        ['60$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(8),'%.1f') '$\%$'],['30$\%$ iSOC RMSE ' num2str(RMSE_SOC_Offset(9),'%.1f') '$\%$'],'IconColumnWidth', 5)
    ulim = 1.2*max(max(ErrorPlot))+1;
    llim = 1.2*-min(min(ErrorPlot))+1;
    ylim([-llim ulim])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    grid on
    clear ISOC_idx; clear ErrorPlot;

    savefig('Test 10 - Initial SOC Error') % Save figure
    close
%% Test 11 - Computing data for current sensor error on m1000 (-10C US06, 10C HWFET and 40C LA92)
    figure(1);
    RMSE_Sens_Offset = zeros(1,18);                 % Initialize datasize for new errors
    % Figures for m1000 -10C US06
    SOC_Act = OutputData.m1000.(5)(m1000_n10C_US06,1).Data;       % Load Actual SOC
    SOC_Pred_Offset = zeros(length(SOC_Act),6);     % Initialize datasize for new results
    offsets = [-0.3,-0.1,-0.05, 0.05, 0.1, .3];
    for j = 1:length(offsets)                       % Compute all alternate results
        [SOC_Pred_Offset(:,j), ~] = Predict_SOC(Inputs, File, m1000_n10C_US06_D, offsets(j));
        RMSE_Sens_Offset(j) = 100*sqrt(mean((SOC_Act-SOC_Pred_Offset(:,j)).^2));
    end
    subplot(2,3,1)                                  % Plot estimation results for US06
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for j = 1:length(offsets)                       % Compute all alternate results
        plot((1:length(SOC_Act))./3600,SOC_Pred_Offset(:,j)*100)
    end
    legend('Actual','-0.3A ','-0.1A', '-0.05A','0.05A',  '0.1A','0.3A','NumColumns',2, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 US06 at -10$^o$C');
    subtitle('Estimation with Current Sensor Offsets');
    subplot(2,3,4)                                  % Plot RMSE results for US06
    hold on
    for j = 1:length(offsets)                       % Compute all alternate results
        plot((1:length(SOC_Act))./3600,(SOC_Act-SOC_Pred_Offset(:,j)).*100)
        ulim(j) = max((SOC_Act-SOC_Pred_Offset(:,j)).*100);
        llim(j) = min((SOC_Act-SOC_Pred_Offset(:,j)).*100);
    end
    legend(['-0.3A RMSE ' num2str(RMSE_Sens_Offset(1),'%.1f') '$\%$'],['-0.1A RMSE ' num2str(RMSE_Sens_Offset(2),'%.1f') '$\%$'], ...
    ['-0.05A RMSE ' num2str(RMSE_Sens_Offset(3),'%.1f') '$\%$'],['0.05A RMSE ' num2str(RMSE_Sens_Offset(4),'%.1f') '$\%$'], ...
    ['0.1A RMSE ' num2str(RMSE_Sens_Offset(5),'%.1f') '$\%$'],['0.3A RMSE ' num2str(RMSE_Sens_Offset(6),'%.1f') '$\%$'], 'NumColumns',2, 'IconColumnWidth', 5)
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    ylim([min(llim)-1 max(ulim)+1])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    grid on
    subtitle('RMSE with Current Sensor Offsets');
    % Create Offset vs RMSE figure
    figure(2)
    hold on
    plot([offsets(1:3), 0, offsets(4:6)],[RMSE_Sens_Offset(1:3), OutputData.m1000{4,2}, RMSE_Sens_Offset(4:6)],'-o') % ONLY SPECIFIC FOR THIS DATASET!!
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Offset (Ampere)')
    clear SOC_Act;clear SOC_Pred; clear X1; clear X; clear SOC_Pred1; clear ulim; clear llim;

    % Figures for m1000 10C HWFET
    figure(1)
    SOC_Act = OutputData.m1000.(5)(m1000_10C_HWFET,1).Data;      % Load Actual SOC
    SOC_Pred_Offset = zeros(length(SOC_Act),6);     % Initialize datasize for new results
    offsets = [-0.3,-0.1,-0.05, 0.05, 0.1, .3];
    for j = 1:length(offsets)                       % Compute all alternate results
        [SOC_Pred_Offset(:,j), ~] = Predict_SOC(Inputs, File, m1000_10C_HWFET_D, offsets(j));
        RMSE_Sens_Offset(j+length(offsets)) = 100*sqrt(mean((SOC_Act-SOC_Pred_Offset(:,j)).^2));
    end
    subplot(2,3,2)                                  % Plot estimation results for HWFET
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for j = 1:length(offsets)                       % Compute all alternate results
        plot((1:length(SOC_Act))./3600,SOC_Pred_Offset(:,j)*100)
    end
    legend('Actual','-0.3A','-0.1A', '-0.05A','0.05A', '0.1A','0.3A','NumColumns',2, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 HWFET at 10$^o$C');
    subtitle('Estimation with Current Sensor Offsets');
    subplot(2,3,5)                                  % Plot RMSE results for HWFET
    hold on
    for j = 1:length(offsets)                       % Compute all alternate results
        plot((1:length(SOC_Act))./3600,(SOC_Act-SOC_Pred_Offset(:,j)).*100)
        ulim(j) = max((SOC_Act-SOC_Pred_Offset(:,j)).*100);
        llim(j) = min((SOC_Act-SOC_Pred_Offset(:,j)).*100);
    end
    legend(['-0.3A RMSE ' num2str(RMSE_Sens_Offset(1+length(offsets)),'%.1f') '$\%$'],['-0.1A RMSE ' num2str(RMSE_Sens_Offset(2+length(offsets)),'%.1f') '$\%$'], ...
    ['-0.05A RMSE ' num2str(RMSE_Sens_Offset(3+length(offsets)),'%.1f') '$\%$'],['0.05A RMSE ' num2str(RMSE_Sens_Offset(4+length(offsets)),'%.1f') '$\%$'], ...
    ['0.1A RMSE ' num2str(RMSE_Sens_Offset(5+length(offsets)),'%.1f') '$\%$'],['0.3A RMSE ' num2str(RMSE_Sens_Offset(6+length(offsets)),'%.1f') '$\%$'], 'NumColumns',2, 'IconColumnWidth', 5)
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    ylim([min(llim)-1 max(ulim)+1])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    grid on
    subtitle('RMSE with Current Sensor Offsets');
    figure(2)
    plot([offsets(1:3), 0, offsets(4:6)],[RMSE_Sens_Offset(7:9), OutputData.m1000{20,2}, RMSE_Sens_Offset(10:12)],'-o') % ONLY SPECIFIC FOR THIS DATASET!!
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Offset (Ampere)')
    clear SOC_Act;clear SOC_Pred; clear X1; clear X; clear SOC_Pred1; clear ulim; clear llim;
    
    % Figures for m1000 40C LA92
    figure(1)
    SOC_Act = OutputData.m1000.(5)(m1000_40C_LA92,1).Data;  % Load Actual SOC
    SOC_Pred_Offset = zeros(length(SOC_Act),6);             % Initialize datasize for new results
    offsets = [-0.3,-0.1,-0.05, 0.05, 0.1, .3];
    for j = 1:length(offsets)                               % Compute all alternate results
        [SOC_Pred_Offset(:,j), ~] = Predict_SOC(Inputs, File, m1000_40C_LA92_D, offsets(j));
        RMSE_Sens_Offset(j+length(offsets)*2) = 100*sqrt(mean((SOC_Act-SOC_Pred_Offset(:,j)).^2));
    end
    subplot(2,3,3)                                          % Plot estimation results for LA92
    plot((1:length(SOC_Act))/3600,SOC_Act*100,'k')            
    hold on
    for j = 1:length(offsets)                               % Compute all alternate results
        plot((1:length(SOC_Act))./3600,SOC_Pred_Offset(:,j)*100)
    end
    legend('Actual','-0.3A ','-0.1A', '-0.05A','0.05A',  '0.1A','0.3A','NumColumns',2, 'IconColumnWidth', 5)
    ylim([0 100])
    xlim([0 length(SOC_Act)/3600])
    ylabel('SOC (\%)', 'Interpreter','latex')
    xlabel('Time (Hour)')
    grid on
    title('m1000 LA92 at 40$^o$C');
    subtitle('Estimation with Current Sensor Offsets');
    subplot(2,3,6)                                          % Plot RMSE results for LA92
    hold on
    for j = 1:length(offsets)                               % Compute all alternate results
        plot((1:length(SOC_Act))./3600,(SOC_Act-SOC_Pred_Offset(:,j)).*100)
        ulim(j) = max((SOC_Act-SOC_Pred_Offset(:,j)).*100);
        llim(j) = min((SOC_Act-SOC_Pred_Offset(:,j)).*100);
    end
    legend(['-0.3A RMSE ' num2str(RMSE_Sens_Offset(1+length(offsets)*2),'%.1f') '$\%$'],['-0.1A RMSE ' num2str(RMSE_Sens_Offset(2+length(offsets)*2),'%.1f') '$\%$'], ...
    ['-0.05A RMSE ' num2str(RMSE_Sens_Offset(3+length(offsets)*2),'%.1f') '$\%$'],['0.05A RMSE ' num2str(RMSE_Sens_Offset(4+length(offsets)*2),'%.1f') '$\%$'], ...
    ['0.1A RMSE ' num2str(RMSE_Sens_Offset(5+length(offsets)*2),'%.1f') '$\%$'],['0.3A RMSE ' num2str(RMSE_Sens_Offset(6+length(offsets)*2),'%.1f') '$\%$'], 'NumColumns',2, 'IconColumnWidth', 5)
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    ylim([min(llim)-1 max(ulim)+1])
    xlim([0 length(SOC_Act)/3600])
    xlabel('Time (Hour)')
    grid on
    subtitle('RMSE with Current Sensor Offsets');
    savefig('Test 11 - Current Sensor Offset'); % Save Figure

    figure(2)
    plot([offsets(1:3), 0, offsets(4:6)],[RMSE_Sens_Offset(13:15), OutputData.m1000{33,2}, RMSE_Sens_Offset(16:18)],'-o') % ONLY SPECIFIC FOR THIS DATASET!!
    ylabel('Estimation Error (\%)', 'Interpreter','latex')
    xlabel('Offset (Ampere)')
    title('RMSE with Current Sensor Offsets');
    legend('m1000 US06 at -10$^o$C','m1000 HWFET at 10$^o$C','m1000 LA92 at 40$^o$C')
    grid on
    clear SOC_Act;clear SOC_Pred; clear X1; clear X; clear SOC_Pred1; clear ulim; clear llim;
    savefig('Test 11 - Current Sensor Offset vs Error'); % Save Figure
    close all
end