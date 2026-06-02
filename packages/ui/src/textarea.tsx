import type { TextareaHTMLAttributes } from "react";
import { className } from "./lib/class-name";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean;
};

export function Textarea({
  className: customClassName,
  fullWidth,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={className(
        "ui-textarea",
        fullWidth && "ui-textarea--full-width",
        customClassName
      )}
      {...props}
    />
  );
}
