// Must match MODEL_NAME_MAX_LENGTH / MODEL_DESCRIPTION_MAX_LENGTH in the
// backend's model.controller.ts — enforced there too, these just let the
// upload and edit forms show/enforce the limit before submitting.
export const MODEL_NAME_MAX_LENGTH = 50;
export const MODEL_DESCRIPTION_MAX_LENGTH = 1000;

//Constants for model types filtering
export const modelTypes = [
  "All Model Types",
  "Machine Learning",
  "Kalman Filter",
  "Extended Kalman Filter",
  "Other Kalman Filter",
  "FNN",
  "LSTM",
  "GRU",
  "NARX",
  "Transformer",
  "Other Neural Network",
  "Coulomb Counter",
  "Hybrid Model",
  "Not Specified"
];
// Format complexity from "x,y,z" to  "y ±1"
// Cast to string, spliut by comma and make into list to get middle number (for display)
export function formatComplexity(value) {
  if (!value) return value;
  const parts = String(value).split(',').map((p) => p.trim());
  if (parts.length !== 3) return value;
  return `${parts[1]} ±1`;
}

// Format a size stored in KB (models.totalSizeKb) into a human-readable
// string, e.g. 512 -> "512 KB", 4300 -> "4.2 MB"
export function formatSizeKb(kb) {
  if (kb === null || kb === undefined || kb === "" || isNaN(kb)) return kb;
  const value = Number(kb);
  if (value < 1024) return `${value.toFixed(value < 10 ? 1 : 0)} KB`;
  return `${(value / 1024).toFixed(1)} MB`;
}

//Constants for table display on leaderboards
export const columns = [
  'Submission',
  'Author',
  'Affiliation',
  'Model Name',
  'Model Type',
  'Status',
  'Visibility',
  'Submitted at',
  'Completed at',
  'Weighted Error',
  'Complexity',
  'All Cells',
  'Blinded Cells',
  'Non-Blinded Cells',
  'Charging',
  '80kg Payload',
  '448kg Payload with HVAC',
  '448kg Payload no HVAC',
  '1000kg Payload',
  'Standard Cycles',
  'Custom Cycles',
  '-20°C',
  '-10°C',
  '0°C',
  '10°C',
  '25°C',
  '40°C',
  'Unknown Initial SOC',
  'Current Sensor Offset Error',
  'All Drive Cycles Average RMSE',
  'All Drive Cycles Average MAE',
  'All Drive Cycles Average MAXE',
  'Total Size',
  'Description'
];
//Constants for table display on submissions page
export const submissionsColumns = [
  'Submission',
  'Model Name',
  'Model Type',
  'Status',
  'Visibility',
  'Submitted at',
  'Completed at',
  'Weighted Error',
  'Complexity',
  'All Cells',
  'Blinded Cells',
  'Non-Blinded Cells',
  'Charging',
  '80kg Payload',
  '448kg Payload with HVAC',
  '448kg Payload no HVAC',
  '1000kg Payload',
  'Standard Cycles',
  'Custom Cycles',
  '-20°C',
  '-10°C',
  '0°C',
  '10°C',
  '25°C',
  '40°C',
  'Unknown Initial SOC',
  'Current Sensor Offset Error',
  'All Drive Cycles Average RMSE',
  'All Drive Cycles Average MAE',
  'All Drive Cycles Average MAXE',
  'Total Size',
  'Description'
];
//Maps raw JSON keys to readable column names
export const columnKeyMap = {
  'Submission': 'id',
  'Author': 'userName',
  'Affiliation': 'academicAffiliation',
  'Model Name': 'name',
  'Model Type': 'modelType',
  'Status': 'status',
  'Visibility': 'isPrivate',
  'Submitted at': 'createdAt',
  'Completed at': 'updatedAt',
  'Weighted Error': 'weightedError',
  'Complexity': 'complexity',
  'All Cells': 'allCells',
  'Blinded Cells': 'blindCells',
  'Non-Blinded Cells': 'nonBlindedCells',
  'Charging': 'charging',
  '80kg Payload': 'payload80kg',
  '448kg Payload with HVAC': 'payload448kgWithHvac',
  '448kg Payload no HVAC': 'payload448kgNoHvac',
  '1000kg Payload': 'payload1000kg',
  'Standard Cycles': 'standardCycles',
  'Custom Cycles': 'customCycles',
  '-20°C': 'nMinus20C',
  '-10°C': 'nMinus10C',
  '0°C': 'zeroC',
  '10°C': 'tenC',
  '25°C': 'twentyFiveC',
  '40°C': 'fortyC',
  'Unknown Initial SOC': 'isocError',
  'Current Sensor Offset Error': 'currentSensorError',
  'All Drive Cycles Average RMSE': 'allDriveCyclesAvgRmse',
  'All Drive Cycles Average MAE': 'allDriveCyclesAvgMae',
  'All Drive Cycles Average MAXE': 'allDriveCyclesAvgMaxe',
  'Total Size': 'totalSizeKb',
  'Description': 'description',
};
