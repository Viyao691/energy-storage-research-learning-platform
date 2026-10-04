"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import BranchedMenu, { type BranchedMenuItem } from "./react-bits/BranchedMenu";
import { groups } from "./navigation-groups";
import "./sidebar-landscape.css";



type IconName = (typeof groups)[number]["links"][number][2] | "home";

function NavIcon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const paths = {
    home: <><path {...common} d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path {...common} d="M9 21v-7h6v7" /></>,
    "file-plus": <><path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path {...common} d="M14 2v6h6M12 12v6m-3-3h6" /></>,
    search: <><circle {...common} cx="11" cy="11" r="6.5" /><path {...common} d="m16 16 4.5 4.5" /></>,
    library: <><path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path {...common} d="M4 5.5v16M8 7h8M8 11h8" /></>,
    "book-open": <><path {...common} d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11a3 3 0 0 1 3 3v16a3 3 0 0 0-3-3H6.5A3.5 3.5 0 0 0 3 21.5z" /><path {...common} d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13a3 3 0 0 0-3 3v16a3 3 0 0 1 3-3h4.5a3.5 3.5 0 0 1 3.5 3.5z" /></>,
    calendar: <><rect {...common} x="3" y="5" width="18" height="16" rx="2" /><path {...common} d="M16 3v4M8 3v4M3 10h18" /></>,
    globe: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    layers: <><path {...common} d="m12 3 8.5 4.5L12 12 3.5 7.5zM3.5 12 12 16.5 20.5 12M3.5 16.5 12 21l8.5-4.5" /></>,
    message: <><path {...common} d="M20 15a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-2-3.5v-5A4 4 0 0 1 6 2h10a4 4 0 0 1 4 4z" /><path {...common} d="M7 10h.01M12 10h.01M17 10h.01" /></>,
    settings: <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.6 2.6-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V21h-3.68v-.08A1.7 1.7 0 0 0 9.5 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.6-2.6.06-.06A1.7 1.7 0 0 0 5.36 15a1.7 1.7 0 0 0-1.56-1.04H3.7v-3.68h.1A1.7 1.7 0 0 0 5.36 9.24a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.6-2.6.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56V3.5h3.68v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.6 2.6-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.1v3.68h-.1A1.7 1.7 0 0 0 19.4 15z" /></>,
    pulse: <><path {...common} d="M3 12h3l2.2-6 4 12 2.2-6H21" /></>,
    help: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M9.6 9a2.5 2.5 0 1 1 4.2 1.82c-.95.84-1.8 1.32-1.8 2.68M12 17h.01" /></>,
  } satisfies Record<IconName, React.ReactNode>;

  return <svg aria-hidden="true" className="app-nav-icon" viewBox="0 0 24 24">{paths[name]}</svg>;
}

const menuItems: BranchedMenuItem[] = [
  { value: "/dashboard", label: "首页", icon: <NavIcon name="home" /> },
  ...groups.map(group => ({
    label: group.label,
    children: group.links.map(([value, label, icon]) => ({ value, label, icon: <NavIcon name={icon} /> })),
  })),
];

export function Nav({ workspace = false }: { workspace?: boolean }) {
  const pathname = usePathname();
  const activeValue = pathname === "/papers" || pathname.startsWith("/papers/")
    ? "/library"
    : menuItems.flatMap(item => "children" in item ? item.children : [item])
      .find(item => pathname === item.value || pathname.startsWith(`${item.value}/`))?.value ?? "";

  useEffect(() => {
    document.documentElement.dataset.theme = window.localStorage.getItem("energy-copilot-theme") === "dark" ? "dark" : "light";
  }, []);

  // On the paper reader page the whole body scroll is locked (independent
  // column scrolling). A wheel over the sidebar must first scroll the menu
  // itself when it overflows; otherwise forward to whichever reader column
  // can actually scroll (analysis panel first, PDF column second) so the
  // wheel never feels dead.
  useEffect(() => {
    const sidebar = document.querySelector(".app-sidebar");
    if (!sidebar) return;
    const onWheel = (event: WheelEvent) => {
      const workspace = document.querySelector(".reader-workspace");
      if (!workspace) return;
      const navigation = document.querySelector<HTMLElement>(".app-sidebar-navigation");
      if (navigation && navigation.scrollHeight > navigation.clientHeight + 1) {
        event.preventDefault();
        navigation.scrollTop += event.deltaY;
        return;
      }
      const candidates = [
        document.querySelector<HTMLElement>(".reader-workspace .analysis-panel"),
        document.querySelector<HTMLElement>(".reader-workspace .pdf-workspace"),
      ];
      const target = candidates.find(
        column => column && column.scrollHeight > column.clientHeight + 1
      );
      if (!target) return;
      event.preventDefault();
      target.scrollTop += event.deltaY;
    };
    const listener: EventListener = (event) => onWheel(event as WheelEvent);
    sidebar.addEventListener("wheel", listener, { passive: false });
    return () => sidebar.removeEventListener("wheel", listener);
  }, []);

  return (
    <aside className="app-sidebar app-sidebar--landscape" id={workspace ? "workspace-v2-navigation" : undefined}>
      <div className="app-sidebar-landscape" aria-hidden="true"><span /></div>
      <div className="app-sidebar-brand">
        <Link className="app-brand" href="/dashboard">
          <span className="app-brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span className="app-brand-copy"><strong>储能科研学习平台</strong><small>ENERGY RESEARCH</small></span>
        </Link>
      </div>
      <div className="app-sidebar-navigation">
        <BranchedMenu items={menuItems} activeValue={activeValue} />
      </div>
      <div className="app-sidebar-user">
        <span className="app-sidebar-avatar" aria-hidden="true">V</span>
        <span><strong className="app-sidebar-user-name">Viyao</strong><small>个人工作空间</small></span>
      </div>
      <div className="app-nav-footer">本地科研工作空间</div>
    </aside>
  );
}
