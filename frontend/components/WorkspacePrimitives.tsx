import React, { type ReactNode } from "react";
import TitleMotion from "./workspace/TitleMotion";

type WorkspaceHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  artwork?: boolean;
};

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  action,
  artwork = false,
}: WorkspaceHeaderProps) {
  return (
    <header className={"workspace-header" + (artwork ? " workspace-header-artwork" : "")}>
      <div>
        {eyebrow && <p className="workspace-eyebrow">{eyebrow}</p>}
        <h1>{typeof title === "string" ? <TitleMotion text={title} variantKey={eyebrow} /> : title}</h1>
        {description && <p className="workspace-description">{description}</p>}
      </div>
      <span className="workspace-illustration-slot illustration-container" aria-hidden="true" />
      {action && <div className="workspace-header-action">{action}</div>}
    </header>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "ready" | "warning" | "neutral" | "quiet";
}) {
  return <span className={"workspace-status workspace-status-" + tone}>{children}</span>;
}

export function EditorialEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="editorial-empty-state">
      <span className="editorial-empty-mark" aria-hidden="true">✦</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {action && <div className="editorial-empty-action">{action}</div>}
      </div>
    </section>
  );
}
