import type { SelectHTMLAttributes } from "react";
import { className } from "./lib/class-name";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  fullWidth?: boolean;
  variant?: "default" | "soft";
};

export function Select({
  className: customClassName,
  fullWidth,
  variant = "default",
  ...props
}: SelectProps) {
  return (
    <span
      className={className(
        "ui-select-control",
        `ui-select-control--${variant}`,
        fullWidth && "ui-select-control--full-width"
      )}
    >
      <select className={className("ui-select", customClassName)} {...props} />
      <span aria-hidden="true" className="ui-select-control__arrow" />
    </span>
  );
}
