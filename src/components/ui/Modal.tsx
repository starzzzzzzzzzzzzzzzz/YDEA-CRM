"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalChildren = React.ReactNode | ((requestClose: () => void) => React.ReactNode);

export default function Modal({
  onClose,
  widthClass = "max-w-lg",
  children,
  closeOnBackdrop = true,
  labelledBy,
}: {
  onClose: () => void;
  widthClass?: string;
  children: ModalChildren;
  closeOnBackdrop?: boolean;
  labelledBy?: string;
}) {
  const [closing, setClosing] = useState(false);

  function requestClose() {
    setClosing(true);
    setTimeout(onClose, 150);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 bg-black/40 backdrop-blur-[2px] ${
        closing ? "" : "animate-overlay-in"
      }`}
      style={closing ? { opacity: 0, transition: "opacity 150ms ease-in" } : undefined}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className={`w-full ${widthClass} max-h-[90vh] bg-card-bg rounded-2xl shadow-2xl border border-border/60 flex flex-col ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        }`}
      >
        {typeof children === "function" ? children(requestClose) : children}
      </div>
    </div>,
    document.body
  );
}
