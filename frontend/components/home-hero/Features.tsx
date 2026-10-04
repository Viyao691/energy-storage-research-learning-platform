import Link from 'next/link';
import { photographicFeatureLayout as featureLayout, type PhotographicFeatureId } from './feature-layout';
import './interactive.css';
function Symbol({ name }: { name: string }) {
 const shapes: Record<string, React.ReactNode> = {
  folder: <><path d="M4 10a3 3 0 0 1 3-3h8l3 4h11a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M4 13h28"/></>,
  cap: <><path d="m2 13 16-8 16 8-16 8Z"/><path d="M9 17v8c5 5 13 5 18 0v-8M34 13v13"/></>,
  chat: <><path d="M6 5h24a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H16l-9 6v-6H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="M11 17h2m5 0h2m5 0h2"/></>,
  trophy: <><path d="M11 4h14v11a7 7 0 0 1-14 0Z"/><path d="M11 7H5v4a6 6 0 0 0 6 6m14-10h6v4a6 6 0 0 1-6 6M18 22v8m-6 2h12"/></>,
  calendar: <><rect x="5" y="7" width="26" height="25" rx="3"/><path d="M11 3v8M25 3v8M5 15h26M11 21h6m-6 5h12"/></>,
  city: <><path d="M3 32V15h9v17M12 32V6h12v26M24 32V17h9v15M1 32h34"/><path d="M7 20h2m-2 5h2m8-13h2m-2 5h2m-2 5h2m9 0h2"/></>,
 };
 return <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

export default function Features({ hovered, onHover }: { hovered: PhotographicFeatureId | null; onHover: (feature: PhotographicFeatureId | null) => void }) {
 return <>
  <svg className="hi-photo-connectors" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">
   {featureLayout.map(card => <g key={card.id} data-feature={card.id} className={hovered === card.id ? 'is-active' : undefined}><path d={card.path}/><circle cx={card.target[0]} cy={card.target[1]} r="5"/></g>)}
  </svg>
  <nav className="hi-photo-features" aria-label="科研工作入口">
   {featureLayout.map(card => {
    return <Link key={card.id} href={card.href} data-feature={card.id} className={`hi-photo-feature hi-photo-feature-${card.id}${hovered === card.id ? ' is-active' : ''}`} style={{ left: `${card.x / 19.2}%`, top: `${card.y / 10.8}%` }} onPointerEnter={() => onHover(card.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(card.id)} onBlur={() => onHover(null)}><Symbol name={card.icon}/><span><strong>{card.title}</strong><small>{card.detail}</small></span></Link>;
   })}
  </nav>
 </>;
}
