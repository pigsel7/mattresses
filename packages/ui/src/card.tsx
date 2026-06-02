import type { HTMLAttributes, PropsWithChildren } from "react";
import { className } from "./lib/class-name";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className: customClassName, ...props }: CardProps) {
  return (
    <div className={className("ui-card", customClassName)} {...props}>
      {children}
    </div>
  );
}
