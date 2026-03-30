import Form from "react-bootstrap/Form";
import { useState, useEffect } from "react";
const LabeledSelect = ({ label, options, onChange, formattedData, setFormattedData, originalData, estimatedSOC, filteredSOC, setFilteredSOC }) => {
  const [selected, setSelected] = useState(options[0]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    setSelected(selectedValue);
    console.log(selectedValue)

     if (onChange) onChange(e);

    if (!originalData || !setFormattedData) return; // ← guard for selects that don't filter

    if (selectedValue === "All Model Types") {
      setFormattedData(originalData);
    } else {
      const filtered = originalData.filter((item) => item[label] === selectedValue);
      setFormattedData(filtered);
    }
  };
  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}</Form.Label>}

      <Form.Select
        style={{ maxWidth: "300px" }}
        value={selected}
        onChange={handleChange}
      >
        {options.map((opt, index) => (
          <option key={index} value={opt}>
            {opt}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default LabeledSelect;
