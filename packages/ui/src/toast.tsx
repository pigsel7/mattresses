import type { PropsWithChildren } from "react";
import { className } from "./lib/class-name";

type ToastVariant = "error" | "info" | "success";

type ToastProps = PropsWithChildren<{
  className?: string;
  variant?: ToastVariant;
}>;

export function Toast({
  children,
  className: customClassName,
  variant = "info"
}: ToastProps) {
  return (
    <div className={className("ui-toast", `ui-toast--${variant}`, customClassName)}>
      {children}
    </div>
  );
}
