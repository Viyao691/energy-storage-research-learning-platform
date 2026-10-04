"use client";

import Link from "next/link";
import Hero from "../../components/home-hero/Hero";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Settings } from "../../lib/api";
import { nextOnboardingPath } from "../../lib/presentation";

function configuredModelLabel(settings: Settings | null): string {
  if (!settings?.api_key?.configured) return "等待配置";
  const names: Record<string, string> = { openai: "OpenAI", deepseek: "DeepSeek", zhipu: "智谱", ollama: "Ollama", mock: "Mock", openai_compatible: "兼容接口" };
  const provider = names[settings.model_provider || ""] || settings.model_provider || "当前模型";
  return settings.model_name ? `${provider} · ${settings.model_name}` : provider;
}

export default function Dashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [paperCount, setPaperCount] = useState<number | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.settings(), api.papers()]).then(([nextSettings, result]) => { setSettings(nextSettings); setPaperCount(result.total); }).catch(reason => setError(reason instanceof Error ? reason.message : "加载失败"));
    api.listResearchSubscriptions().then(result => setSubscriptionCount(result.total)).catch(() => setSubscriptionCount(null));
    Promise.all([api.listResearchRuns(), api.listResearchNotifications()]).then(([, notifications]) => setUnread(notifications.items.filter(notification => !notification.read_at).length)).catch(() => setUnread(null));
  }, []);

  useEffect(() => { setDarkMode(window.localStorage.getItem("energy-copilot-theme") === "dark"); }, []);
  useEffect(() => {
    if (darkMode === null) return;
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("energy-copilot-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); router.push("/search"); }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [router]);

  if (settings && settings.onboarding_completed === false) return <section className="empty"><h1>欢迎使用能源论文副驾驶</h1><p>先配置模型，再上传论文并建立本地知识库。</p><Link href={nextOnboardingPath(settings.onboarding_completed)}>开始配置</Link></section>;

  return <section className={darkMode ? "dashboard dashboard-dark" : "dashboard"}>
    <Hero theme={darkMode ? "dark" : "light"} onTheme={theme => setDarkMode(theme === "dark")} papers={paperCount} subscriptions={subscriptionCount} model={settings ? configuredModelLabel(settings) : undefined} unread={unread}/>
    {error && <p className="dashboard-error">{error}</p>}
  </section>;
}
