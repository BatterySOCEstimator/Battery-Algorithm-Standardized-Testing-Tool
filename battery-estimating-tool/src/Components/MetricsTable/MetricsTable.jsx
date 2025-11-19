import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';

const MetricsTable = ({headers}) => {
  const columns = [
    'Submission',
    'Model Name',
    'Model Type',
    'Status',
    'Visibility',
    'Submitted at',
    'Completed at',
    'Weighted Error',
    'All Cells',
    'Blind Cells',
    'Non-Blinded Cells',
    'Charging',
    '80kg Payload',
    '448kg Payload with HVAC',
    '448kg Payload no HVAC',
    '1000kg Payload',
    'Standard Cycles',
    'Custom Cycles',
    'n20C',
    'n10C',
    '0C',
    '10C',
    '25C',
    '40C',
    'iSOC Error',
    'Current Sensor Error',
    'All Drive Cycles Average RMSE',
    'All Drive Cycles Average MAE',
    'All Drive Cycles Average MAXE'
  ];

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <Table style={{ textAlign: 'center' }} striped bordered hover>
        <thead>
          <tr style={{ verticalAlign: 'middle' }}>
            {headers.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {headers.map((col) => (
              <td key={col}>--</td>
            ))}
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default MetricsTable