import type { InputHTMLAttributes } from "react";
import { className } from "./lib/class-name";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Checkbox({ className: customClassName, label, ...props }: CheckboxProps) {
  const checkbox = (
    <input className={className("ui-checkbox", customClassName)} type="checkbox" {...props} />
  );

  if (!label) {
    return checkbox;
  }

  return (
    <label className="ui-checkbox__label">
      {checkbox}
      <span>{label}</span>
    </label>
  );
}
