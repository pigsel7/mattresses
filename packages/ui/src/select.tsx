"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from "react";
import { className } from "./lib/class-name";

type SelectOptionElement = ReactElement<{
  children?: ReactNode;
  disabled?: boolean;
  value?: string | number;
}>;

type SelectProps = {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

function getOptionLabel(children: ReactNode) {
  return Children.toArray(children).join("");
}

export function Select({
  "aria-label": ariaLabel,
  children,
  className: customClassName,
  disabled,
  fullWidth,
  name,
  onValueChange,
  value
}: SelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter(isValidElement)
        .map((child) => {
          const option = child as SelectOptionElement;
          const optionValue = String(option.props.value ?? "");

          return {
            disabled: Boolean(option.props.disabled),
            label: getOptionLabel(option.props.children),
            value: optionValue
          };
        }),
    [children]
  );

  const selectedOption =
    options.find((option) => option.value === value) ??
    options.find((option) => !option.disabled) ??
    options[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function commitValue(nextValue: string) {
    const option = options.find((item) => item.value === nextValue);

    if (!option || option.disabled) {
      return;
    }

    onValueChange?.(nextValue);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((current) => !current);
    }
  }

  return (
    <span
      className={className(
        "ui-select-control",
        fullWidth && "ui-select-control--full-width"
      )}
      ref={rootRef}
    >
      {name ? (
        <input
          disabled={disabled}
          name={name}
          type="hidden"
          value={selectedOption?.value ?? ""}
        />
      ) : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={className("ui-select", customClassName)}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="ui-select__value">{selectedOption?.label ?? ""}</span>
        <span aria-hidden="true" className="ui-select-control__arrow" />
      </button>
      {isOpen ? (
        <span className="ui-select-control__list" id={listboxId} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedOption?.value}
              className="ui-select-control__option"
              disabled={option.disabled}
              key={option.value}
              onClick={() => commitValue(option.value)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
