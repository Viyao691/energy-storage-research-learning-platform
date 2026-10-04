"use client";

import React, { useEffect, useId, useRef, type ReactNode } from "react";
import "./drawer.css";

export type WorkspaceDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function WorkspaceDrawer({ open, title, onClose, children }: WorkspaceDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [open]);

  function containTabFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog ref={dialogRef} className="workspace-drawer" aria-labelledby={titleId} onCancel={onClose} onKeyDown={containTabFocus}>
    <div className="workspace-drawer-panel">
      <header className="workspace-drawer-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="workspace-drawer-close" aria-label="关闭面板" onClick={onClose}>×</button>
      </header>
      <div className="workspace-drawer-content">{children}</div>
    </div>
  </dialog>;
}
