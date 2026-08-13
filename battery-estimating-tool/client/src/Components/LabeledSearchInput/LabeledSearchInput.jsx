import { Input } from "#Components/ui/input";
import { Label } from "#Components/ui/label";

const LabeledSearchInput = ({ label, value, onChange, placeholder }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <Input
        type="text"
        className="max-w-75"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default LabeledSearchInput;
