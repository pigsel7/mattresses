import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { className } from "./lib/class-name";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    fullWidth?: boolean;
    loading?: boolean;
    size?: ButtonSize;
    variant?: ButtonVariant;
  }
>;

export function Button({
  children,
  className: customClassName,
  disabled,
  fullWidth,
  loading,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={className(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && "ui-button--full-width",
        customClassName
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Загрузка" : children}
    </button>
  );
}
