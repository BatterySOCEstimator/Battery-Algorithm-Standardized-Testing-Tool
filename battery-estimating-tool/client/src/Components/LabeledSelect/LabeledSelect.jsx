import Form from "react-bootstrap/Form";

const LabeledSelect = ({
  label,
  filter,
  value,
  options,
  onFilterChange,
}) => {
  const handleChange = (e) => {
    onFilterChange(label, e.target.value);
  };

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}</Form.Label>}

      <Form.Select
        style={{ maxWidth: "300px" }}
        value={value}
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