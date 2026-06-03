"use client";

import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Toast } from "@mattress/ui";

type ToastVariant = "error" | "info" | "success";
type ToastMessage = string | string[];

type ToastApi = Record<ToastVariant, (message: ToastMessage) => void>;

type ToastItem = {
  id: string;
  message: ToastMessage;
  variant: ToastVariant;
};

const ToastContext = createContext<ToastApi | null>(null);

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, message: ToastMessage) => {
      const id = createToastId();

      setToasts((current) => [...current, { id, message, variant }]);
      timers.current[id] = window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast]
  );

  const toast = useMemo<ToastApi>(
    () => ({
      error: (message) => addToast("error", message),
      info: (message) => addToast("info", message),
      success: (message) => addToast("success", message)
    }),
    [addToast]
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      Object.values(activeTimers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="toast-viewport">
        {toasts.map((item) => (
          <Toast key={item.id} variant={item.variant}>
            <div className="toast-content">
              {Array.isArray(item.message) ? (
                <ul className="toast-content__list">
                  {item.message.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <span>{item.message}</span>
              )}
              <button
                aria-label="Закрыть уведомление"
                className="toast-content__close"
                onClick={() => removeToast(item.id)}
                type="button"
              >
                ×
              </button>
            </div>
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);

  if (!toast) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return toast;
}
