"use client";

import Link from "next/link";
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./BranchedMenu.css";

type Leaf = { value: string; label: string; icon?: React.ReactNode };
export type BranchedMenuItem = Leaf | { label: string; children: Leaf[] };
type Props = { items: BranchedMenuItem[]; activeValue: string; className?: string };

const PAD = 6;
const MARK = 16;
const ROW = 42;
const INDENT = 38;
const TRUNK = 12;
const RADIUS = 9;
const END = INDENT - 8;
const rowY = (index: number) => PAD + index * ROW + ROW / 2;
const branch = (index: number) => `M ${TRUNK} ${rowY(index) - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${TRUNK + RADIUS} ${rowY(index)} H ${END}`;
const reach = (index: number) => `M ${TRUNK} 0 V ${rowY(index) - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${TRUNK + RADIUS} ${rowY(index)} H ${END}`;
const length = (index: number) => rowY(index) - RADIUS + Math.PI * RADIUS / 2 + END - TRUNK - RADIUS;
const isGroup = (item: BranchedMenuItem): item is { label: string; children: Leaf[] } => "children" in item;

export default function BranchedMenu({ items, activeValue, className = "" }: Props) {
  const id = useId();
  const activeSection = items.findIndex(item => isGroup(item)
    ? item.children.some(child => child.value === activeValue)
    : item.value === activeValue);
  const [open, setOpen] = useState<Set<number>>(() => new Set(activeSection >= 0 && isGroup(items[activeSection]) ? [activeSection] : []));
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeSection < 0 || !isGroup(items[activeSection])) return;
    setOpen(previous => new Set(previous).add(activeSection));
  }, [activeValue, activeSection, items]);

  const markerShown = activeSection >= 0 && (!isGroup(items[activeSection]) || open.has(activeSection));
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const marker = markerRef.current;
      const head = heads.current[activeSection];
      if (!marker) return;
      if (!animate) marker.style.transition = "none";
      if (markerShown && head) marker.style.top = `${head.offsetTop + (head.offsetHeight - MARK) / 2}px`;
      marker.toggleAttribute("data-on", Boolean(markerShown && head));
      if (!animate) requestAnimationFrame(() => { marker.style.transition = ""; });
    };
    place(true);
    if (typeof ResizeObserver === "undefined" || !navRef.current) return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [activeSection, markerShown]);

  return (
    <nav ref={navRef} className={`branched-menu ${className}`} aria-label="主导航">
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, index) => {
        if (!isGroup(item)) {
          const active = item.value === activeValue;
          return <div className="branched-menu__section" key={item.value}>
            <Link ref={element => { heads.current[index] = element; }} href={item.value} className={`branched-menu__head branched-menu__leaf${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              {item.icon && <span className="branched-menu__icon" aria-hidden="true">{item.icon}</span>}{item.label}
            </Link>
          </div>;
        }
        const expanded = open.has(index);
        const current = index === activeSection;
        const bodyHeight = PAD * 2 + item.children.length * ROW;
        const bodyId = `${id}-section-${index}`;
        return <div className="branched-menu__section" data-open={expanded ? "" : undefined} data-current={current ? "" : undefined} key={item.label}>
          <button ref={element => { heads.current[index] = element; }} type="button" className="branched-menu__head" aria-expanded={expanded} aria-controls={bodyId}
            onClick={() => setOpen(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next; })}>
            {item.label}<span className="branched-menu__chevron" aria-hidden="true" />
          </button>
          <div className="branched-menu__body" id={bodyId} aria-hidden={!expanded} inert={!expanded}>
            <div className="branched-menu__fold"><div className="branched-menu__tree" style={{ height: bodyHeight }}>
              <svg className="branched-menu__lines" width={INDENT} height={bodyHeight} aria-hidden="true">
                <path className="branched-menu__base" d={`M ${TRUNK} 0 V ${rowY(item.children.length - 1) - RADIUS}`} />
                {item.children.map((child, childIndex) => <path className="branched-menu__base" key={child.value} d={branch(childIndex)} />)}
                {item.children.map((child, childIndex) => <path className="branched-menu__reach" key={child.value} d={reach(childIndex)} style={{ strokeDasharray: length(childIndex), strokeDashoffset: child.value === activeValue ? 0 : length(childIndex) }} />)}
              </svg>
              {item.children.map(child => {
                const active = child.value === activeValue;
                return <Link key={child.value} href={child.value} tabIndex={expanded ? 0 : -1} aria-current={active ? "page" : undefined}
                  className={`branched-menu__item${active ? " active" : ""}`}>
                  {child.icon && <span className="branched-menu__icon" aria-hidden="true">{child.icon}</span>}
                  <span className="branched-menu__label">{child.label}</span>
                </Link>;
              })}
            </div></div>
          </div>
        </div>;
      })}
    </nav>
  );
}
