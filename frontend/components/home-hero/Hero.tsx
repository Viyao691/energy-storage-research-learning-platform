"use client";

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import Features from './Features';
import HomeDock from './HomeDock';
import Particles from './Particles';
import type { PhotographicFeatureId } from './feature-layout';
import ThemePillSwitch from '../react-bits/ThemePillSwitch';
import './hero.css';

type Theme = 'light' | 'dark';
type IconName = 'search' | 'bell';
type Props = { theme: Theme; onTheme: (theme: Theme) => void; papers?: number | null; subscriptions?: number | null; model?: string; unread?: number | null; previewHoverAll?: boolean; calibrated?: boolean; sceneOnly?: boolean; environmentOnly?: boolean };

function Icon({ name }: { name: IconName }) {
 const shapes: Record<IconName, ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 6-2 8-3 10h18c-1-2-3-4-3-10M10 21h4"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

export default function Hero({ theme, onTheme, papers, subscriptions, model, unread, sceneOnly = false, environmentOnly = false }: Props) {
 const [hovered, setHovered] = useState<PhotographicFeatureId | null>(null);
 useEffect(() => { setHovered(null); }, [theme]);
 return <section className={`integrated-hero hi-photo hi-${theme}${sceneOnly || environmentOnly ? ' hi-photo-scene-only' : ''}`} data-theme={theme} aria-label="储能科研工作台">
  <div className="hi-photo-frame">
   <img className="hi-photo-scene" src={`/home-hero/scene-${theme}.webp`} alt="" aria-hidden="true" width="1672" height="941" fetchPriority="high"/>
   <Particles theme={theme}/>
   <header className="hi-photo-header">
    <Link href="/dashboard" className="hi-photo-brand" aria-label="储能科研学习智慧平台 首页"><svg viewBox="0 0 60 64" aria-hidden="true"><g fill="currentColor"><circle cx="30" cy="8" r="5"/><circle cx="10" cy="28" r="5"/><circle cx="50" cy="28" r="5"/><circle cx="30" cy="48" r="5"/></g><circle cx="30" cy="28" r="5" fill="#b68c46"/></svg><span>Energy Storage<br/>Research &amp; Learning<br/>Smart Platform<small>储能科研学习智慧平台</small></span></Link>
    <Link className="hi-photo-search" href="/search"><Icon name="search"/><span>搜索论文、主题或作者…</span></Link>
    <div className="hi-photo-account"><Link href="/research-daily" aria-label="科研通知" className="hi-photo-notice"><Icon name="bell"/>{typeof unread === 'number' && unread > 0 && <i/>}</Link><ThemePillSwitch theme={theme} onChange={onTheme}/><Link href="/settings" className="hi-photo-avatar" aria-label="个人设置">席</Link></div>
   </header>
   <div className="hi-photo-copy"><h1><img src={`/home-hero/title-${theme}.svg`} alt="储能科研，洞见未来" width="610" height="291"/></h1><p className="hi-photo-description">整合论文、检索、订阅、日报与智能工具，<br/>打造专注高效的一站式储能科研工作空间，<br/>助力每一次洞见与突破。</p><p className="hi-photo-motto">更清洁的能源 · 更美好的未来</p></div>
   <Features hovered={hovered} onHover={setHovered}/>
   <HomeDock papers={papers} subscriptions={subscriptions} model={model} unread={unread}/>
  </div>
 </section>;
}
