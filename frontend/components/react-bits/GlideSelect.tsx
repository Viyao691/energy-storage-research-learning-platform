"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import "./GlideSelect.css";

export type GlideOption = { value: string; label: ReactNode; tag?: string; disabled?: boolean };
type Props = {
  options: GlideOption[];
  value: string | number;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuLayout?: "list" | "grid";
  animateLabel?: boolean;
  menuClassName?: string;
};

const textOf = (option: GlideOption) => typeof option.label === "string" ? option.label : option.value;

export default function GlideSelect({ options, value, onChange, id, ariaLabel, placeholder = "请选择", disabled = false, className = "", menuLayout = "list", animateLabel = false, menuClassName = "" }: Props) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, side: "bottom" });
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = useRef({ value: "", time: 0 });
  const selected = options.findIndex(option => option.value === String(value));
  const name = ariaLabel ?? placeholder;

  function close(focus = false) {
    setOpen(false);
    setActive(null);
    setClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setClosing(false), 140);
    if (focus) triggerRef.current?.focus({ preventScroll: true });
  }

  function show() {
    if (disabled) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    const initial = selected >= 0 ? selected : options.findIndex(option => !option.disabled);
    setActive(initial >= 0 ? initial : null);
    setOpen(true);
  }

  function pick(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (option.value !== String(value)) onChange(option.value);
    close(true);
  }

  function move(to: number, direction: number) {
    if (!options.length) return;
    for (let count = 0; count < options.length; count++) {
      const index = (to + count * direction + options.length * 2) % options.length;
      if (!options[index].disabled) { setActive(index); return; }
    }
  }

  function gridColumns() {
    const list = menuRef.current?.querySelector<HTMLElement>(".glide-select__list");
    const template = list ? getComputedStyle(list).gridTemplateColumns : "";
    const rendered = template && !template.includes("repeat(") ? template.match(/\d+(?:\.\d+)?px/g)?.length : 0;
    return rendered || Math.max(1, Math.min(4, Math.floor((position.width || Math.min(820, window.innerWidth - 12) - 8) / 190)));
  }

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (disabled && open) close(); }, [disabled, open]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!open) return;
    if (active !== null && (active >= options.length || options[active]?.disabled)) setActive(null);
  }, [options, open, active]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = menuLayout === "grid" ? Math.min(820, window.innerWidth - 12) : Math.max(rect.width, 176);
      const height = menuRef.current?.offsetHeight ?? options.length * 44 + 8;
      const side = rect.bottom + height + 6 > window.innerHeight && rect.top > window.innerHeight - rect.bottom ? "top" : "bottom";
      const next = { top: side === "top" ? Math.max(6, rect.top - height - 6) : Math.min(window.innerHeight - height - 6, rect.bottom + 6), left: Math.max(6, Math.min(rect.left, window.innerWidth - menuWidth - 6)), width: menuWidth, side };
      setPosition(current => current.top === next.top && current.left === next.left && current.width === next.width && current.side === next.side ? current : next);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [open, options.length, menuLayout, position.width]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    if (active === null || active < 0) { pill.style.opacity = "0"; return; }
    if (menuLayout === "grid") pill.style.opacity = "0";
    else { pill.style.transform = `translateY(${active * 45}px)`; pill.style.opacity = "1"; }
    menuRef.current?.querySelectorAll<HTMLElement>("[role=option]")[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active, open, menuLayout]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open]);

  const styles = { "--gs-menu-width": `${Math.max(position.width, 176)}px` } as CSSProperties;
  return <span className={`glide-select ${className}`}>
    <button id={id} ref={triggerRef} type="button" role="combobox" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open && active !== null && active >= 0 ? `${listId}-${active}` : undefined} disabled={disabled} className="glide-select__trigger"
      onClick={() => open ? close() : show()}
      onKeyDown={event => {
        const key = event.key;
        if (key === "Escape") { if (open) { event.preventDefault(); close(true); } return; }
        if (key === "Tab") { if (open) close(); return; }
        if (!open) {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(key)) { event.preventDefault(); show(); }
          return;
        }
        const current = active ?? selected;
        if (key === "ArrowDown" || key === "ArrowUp" || (menuLayout === "grid" && (key === "ArrowLeft" || key === "ArrowRight"))) {
          event.preventDefault();
          const direction = key === "ArrowDown" || key === "ArrowRight" ? 1 : -1;
          const delta = menuLayout === "grid" && (key === "ArrowDown" || key === "ArrowUp") ? direction * gridColumns() : direction;
          const next = current + delta;
          if (menuLayout !== "grid" || (next >= 0 && next < options.length)) move(next, direction);
        }
        else if (key === "Home" || key === "End") { event.preventDefault(); move(key === "Home" ? 0 : options.length - 1, key === "Home" ? 1 : -1); }
        else if (key === "Enter" || key === " ") { event.preventDefault(); pick(current); }
        else if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey && options.length) {
          const now = Date.now();
          const query = (now - search.current.time < 650 ? search.current.value : "") + key.toLocaleLowerCase();
          search.current = { value: query, time: now };
          for (let step = 1; step <= options.length; step++) {
            const index = (current + step + options.length) % options.length;
            if (!options[index].disabled && textOf(options[index]).toLocaleLowerCase().startsWith(query)) { setActive(index); break; }
          }
        }
      }}>
      <span key={animateLabel ? String(value) : "label"} className={`glide-select__label ${animateLabel ? "glide-select__label--swap" : ""}`}>{selected >= 0 ? options[selected].label : placeholder}</span><span className="glide-select__chevron" aria-hidden="true">⌄</span>
    </button>
    {mounted && (open || closing) && createPortal(<div ref={menuRef} className={`glide-select__menu ${menuClassName}`} data-layout={menuLayout} data-state={open ? "open" : "closed"} data-side={position.side} aria-hidden={!open} style={{ ...styles, top: position.top, left: position.left }}>
      <div id={listId} role="listbox" aria-label={name} className="glide-select__list">
        <span ref={pillRef} className="glide-select__pill" aria-hidden="true" />
        {options.map((option, index) => <div key={`${option.value}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={index === selected} aria-disabled={option.disabled || undefined} data-active={index === active} className="glide-select__option" onPointerEnter={() => { if (!option.disabled) setActive(index); }} onPointerDown={event => event.preventDefault()} onClick={() => pick(index)}>
          <span className="glide-select__name">{option.label}</span>{option.tag && <span className="glide-select__tag">{option.tag}</span>}<span className="glide-select__check" aria-hidden="true">{index === selected ? "✓" : ""}</span>
        </div>)}
      </div>
    </div>, document.body)}
  </span>;
}
