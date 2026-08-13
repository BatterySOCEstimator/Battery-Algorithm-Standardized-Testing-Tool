import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#Components/ui/select";
import { Label } from "#Components/ui/label";

const LabeledSelect = ({ label, filter, value, options, onFilterChange }) => {
  const handleValueChange = (nextValue) => {
    onFilterChange(label, nextValue);
  };

  const isControlled = value !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}

      <Select
        {...(isControlled ? { value } : { defaultValue: options[0] })}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="max-w-75">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt, index) => (
            <SelectItem key={index} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LabeledSelect;
