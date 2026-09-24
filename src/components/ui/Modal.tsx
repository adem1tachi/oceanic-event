import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl bg-bg-surface border border-border p-6 shadow-xl text-start focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="modal-title" className="text-lg font-bold text-token-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-token-muted hover:text-token-primary hover:bg-bg-surface-raised focus-visible:outline-2 focus-visible:outline-highlight"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {description && (
          <p id="modal-description" className="mt-3 text-sm text-token-secondary">
            {description}
          </p>
        )}

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
