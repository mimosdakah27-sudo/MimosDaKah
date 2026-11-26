import { Input } from "@/components/ui/input";
import { useId } from "react";

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  onMask?: (value: string) => string;
}

export function InputGroup({ label, error, onMask, onChange, value, id, ...props }: InputGroupProps) {
  const fieldId = useId();
  const inputId = id ?? fieldId;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onMask) {
      e.target.value = onMask(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-brand-ink">{label}</label>
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? inputId + "-error" : undefined}
        {...props}
        value={value}
        onChange={handleChange}
      />
      {error && <span id={inputId + "-error"} className="mt-1 block text-xs text-destructive">{error}</span>}
    </div>
  );
}