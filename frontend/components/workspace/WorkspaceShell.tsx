"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Nav } from "../Nav";
import { MaterialStackScene } from "./MaterialStackScene";
import { FullMaterialBackdrop, type FullMaterialKind } from "./FullMaterialBackdrop";
import { EnergyHeaderBackdrop, type EnergyHeaderKind } from "./EnergyHeaderBackdrop";
import { SpecularInteractions } from "../react-bits/SpecularInteractions";
import ThemePillSwitch from "../react-bits/ThemePillSwitch";
import "./energy-material-backdrop.css";
import "./workspace.css";
import "./page-atmosphere.css";
import "./navigation-motion.css";
import "./motion-skin.css";

const routeTitles: Record<string, string> = {
  "/upload": "上传论文", "/search": "论文搜索", "/library": "论文库",
  "/papers": "论文详情", "/subscriptions": "研究订阅", "/research-daily": "科研日报",
  "/learning": "学习中心", "/contests": "科研创新竞赛", "/research-data": "科研数据",
  "/campus": "校园资讯",
  "/ideas": "科研想法", "/compare": "多篇比较", "/knowledge": "论文库问答",
  "/settings": "系统设置", "/diagnostics": "连接诊断", "/maintenance": "存储与备份",
  "/help": "帮助", "/onboarding": "配置引导",
};

// Scene and motif atlases are separate 5×4 and 6×4 grids of square cells.
// Keep route selection here so detail pages have their own visual identity.
const routeArtwork: Record<string, [scene: number, motif: number, glow: string]> = {
  "/search": [0, 5, "95, 158, 197"],
  "/library": [1, 6, "179, 138, 85"],
  "/papers": [3, 0, "126, 163, 199"],
  "/subscriptions": [4, 7, "117, 160, 195"],
  "/research-daily": [5, 8, "219, 169, 88"],
  "/compare": [6, 4, "130, 159, 205"],
  "/knowledge": [7, 9, "112, 186, 177"],
  "/learning": [8, 16, "128, 179, 123"],
  "/learning/detail": [9, 17, "128, 160, 206"],
  "/contests": [10, 18, "211, 153, 95"],
  "/contests/detail": [11, 19, "112, 163, 200"],
  "/research-data": [12, 20, "113, 183, 204"],
  "/settings": [14, 22, "139, 164, 188"],
  "/diagnostics": [15, 2, "93, 190, 206"],
  "/maintenance": [16, 23, "173, 153, 102"],
  "/campus": [19, 7, "122, 172, 192"],
};

function artworkStyle(scene: number, motif: number, glow: string): CSSProperties {
  return {
    "--scene-x": `${(scene % 5) * 25}%`,
    "--scene-y": `${Math.floor(scene / 5) * (100 / 3)}%`,
    "--motif-x": `${(motif % 6) * 20}%`,
    "--motif-y": `${Math.floor(motif / 6) * (100 / 3)}%`,
    "--scene-glow": glow,
  } as CSSProperties;
}

function isLegacyRoute(pathname: string) {
  return pathname === "/" || pathname === "/dashboard";
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTheme(window.localStorage.getItem("energy-copilot-theme") === "dark" ? "dark" : "light");
  }, [pathname]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    // Wait until the sidebar is visible before moving keyboard focus into it.
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLAnchorElement>("#workspace-v2-navigation .branched-menu a")?.focus();
    }, 50);
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", close);
    return () => { window.clearTimeout(focusTimer); document.removeEventListener("keydown", close); };
  }, [menuOpen]);

  const footer = <footer className="app-footer">© 2026 储能科研学习平台 · Viyao</footer>;
  if (isLegacyRoute(pathname)) {
    return <div className="app-shell"><Nav /><main className="app-main">{children}{footer}</main></div>;
  }

  const section = "/" + pathname.split("/")[1];
  const title = pathname === "/research/chronicle" ? "储能编年史" : pathname === "/research/city-applications" ? "储能城市应用" : routeTitles[section] || "研究工作台";
  const materialRoute = section === "/research-data";
  const fullMaterialKind: FullMaterialKind | undefined = pathname === "/search" ? "carbon"
    : pathname === "/compare" ? "electrode"
    : pathname === "/knowledge" ? "crystal"
    : pathname === "/learning" ? "learning"
    : pathname === "/contests" ? "contest" : undefined;
  const headerKind: EnergyHeaderKind | undefined = pathname === "/library" ? "library"
    : pathname === "/research-daily" ? "digest"
    : pathname === "/learning" ? "learning"
    : pathname === "/settings" ? "system" : undefined;
  const artworkKey = (section === "/learning" || section === "/contests") && pathname.split("/").filter(Boolean).length > 1 ? `${section}/detail` : section;
  const artwork = materialRoute || fullMaterialKind || headerKind ? undefined : routeArtwork[artworkKey];
  const chooseTheme = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("energy-copilot-theme", next);
  };

  return <div className={"app-shell workspace-v2" + (menuOpen ? " workspace-v2-menu-open" : "") + (materialRoute ? " workspace-v2-material" : "") + (section === "/research-data" ? " workspace-v2-research-material" : "") + (fullMaterialKind ? " workspace-v2-full-material" : "") + (artwork ? " workspace-v2-atmospheric" : "") + (section === "/papers" ? " workspace-v2-reader-atmosphere" : "")} style={artwork ? artworkStyle(...artwork) : undefined}>
    <Nav workspace />
    <div className="workspace-v2-column">
      <div className="workspace-v2-topbar">
        <button ref={menuButton} type="button" className="workspace-v2-menu-button" aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-controls="workspace-v2-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>
          <span aria-hidden="true">☰</span>
        </button>
        <div className="workspace-v2-location"><small>储能科研学习平台 <span aria-hidden="true">/</span> 研究工作台</small><strong>{title}</strong></div>
        <div className="workspace-v2-topbar-actions">
          <Link href="/search" className="workspace-v2-search-link" aria-label="论文搜索"><span aria-hidden="true">⌕</span><span>论文搜索</span></Link>
          <ThemePillSwitch theme={theme} onChange={chooseTheme} />
        </div>
      </div>
      <main className="app-main" id="workspace-action-surface">{section === "/research-data" && <div className="energy-material-backdrop" aria-hidden="true" />}{materialRoute && <MaterialStackScene key={section} />}{fullMaterialKind && <FullMaterialBackdrop key={`full-${fullMaterialKind}`} kind={fullMaterialKind} theme={theme} />}{artwork && <div className="workspace-page-atmosphere" aria-hidden="true" />}{children}{headerKind && <EnergyHeaderBackdrop key={`header-${headerKind}`} kind={headerKind} theme={theme} />}<SpecularInteractions />{footer}</main>
    </div>
  </div>;
}
