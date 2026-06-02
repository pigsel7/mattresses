import type { InputHTMLAttributes } from "react";
import { className } from "./lib/class-name";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export function Input({ className: customClassName, fullWidth, ...props }: InputProps) {
  return (
    <input
      className={className("ui-input", fullWidth && "ui-input--full-width", customClassName)}
      {...props}
    />
  );
}
