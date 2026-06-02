import type { HTMLAttributes, PropsWithChildren } from "react";
import { className } from "./lib/class-name";

type BadgeProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement>>;

export function Badge({ children, className: customClassName, ...props }: BadgeProps) {
  return (
    <span className={className("ui-badge", customClassName)} {...props}>
      {children}
    </span>
  );
}
