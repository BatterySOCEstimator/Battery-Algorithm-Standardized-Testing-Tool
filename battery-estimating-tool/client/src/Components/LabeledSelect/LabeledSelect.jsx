import Form from "react-bootstrap/Form";
import { useState } from "react";
const LabeledSelect = ({ label, options, setFormattedData, originalData, onChange }) => {
  const [selected, setSelected] = useState(options[0]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    setSelected(selectedValue);

    if (onChange) onChange(e);


    if (!setFormattedData || !originalData) return;

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

