import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';

const MetricsTable = ({ headers, estimatedSOC = [] }) => {
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
          {estimatedSOC.length === 0 ? (
            // If no data exists, show empty row
            <tr>
              {headers.map((col) => (
                <td key={col}>--</td>
              ))}
            </tr>
          ) : (
            // Render each SOC submission as its own row
            estimatedSOC.map((entry, index) => (
              <tr key={index}>
                {headers.map((col) => (
                  <td key={col}>
                    {entry[col] !== undefined ? entry[col] : "--"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default MetricsTable;
