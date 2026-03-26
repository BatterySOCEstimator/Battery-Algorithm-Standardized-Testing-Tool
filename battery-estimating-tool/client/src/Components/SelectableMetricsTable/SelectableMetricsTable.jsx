import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import { columnKeyMap } from "../../Helperfunc.js";

const SelectableMetricsTable = ({ headers, estimatedSOC, selectedModel, setSelectedModel }) => {
  return (
    <div
      style={{
        maxHeight: '400px',   
        overflowY: 'auto',
        overflowX: 'auto',
        width: '100%',
        border: '1px solid #ddd',
      }}
    >
      <Table style={{ textAlign: 'center', marginBottom: 0 }} striped bordered hover>
        <thead
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}
        >
          <tr style={{ verticalAlign: 'middle' }}>
            {headers.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {estimatedSOC.length === 0 ? (
            <tr>
              {headers.map((col) => (
                <td key={col}>--</td>
              ))}
            </tr>
          ) : (
            estimatedSOC.map((row) => (
              <tr key={row.id} >
                {headers.map((col) => {
                  const key = columnKeyMap[col];
                  let value = row[key];

                  if (key === 'isPrivate') {
                    value = value ? 'Private' : 'Public';
                  }

                  if (key === 'createdAt' || key === 'updatedAt') {
                    value = new Date(value).toLocaleString();
                  }

                  return <td onClick={() => setSelectedModel(row)} style={{ cursor: 'pointer', backgroundColor: selectedModel && selectedModel.id === row.id ? '#359daa' : 'transparent' }} key={col}>{value ?? '-'}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default SelectableMetricsTable;