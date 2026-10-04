import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
export const metadata: Metadata = { title: "储能科研学习平台", description: "储能科研学习平台 · Viyao" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body><WorkspaceShell>{children}</WorkspaceShell></body></html>; }
