import React from "react";
import type { CityIllustration } from "./storageCityScenes";

export default function EnergySceneIllustration({ kind, className }: { kind: CityIllustration; className?: string }) {
  return <svg className={className} data-illustration={kind} viewBox="0 0 96 78" aria-hidden="true">
    <ellipse cx="48" cy="70" rx="34" ry="4" fill="#d9e4e6" />
    {kind === "battery" && <>
      <path d="M27 15 37 10 72 18 62 23Z" fill="#dce8e9" stroke="#5b7685" strokeWidth="1.5" />
      <path d="M27 15 62 23V67L27 59Z" fill="#f7fbf8" stroke="#567382" strokeWidth="2" />
      <path d="M62 23 72 18V61L62 67Z" fill="#a8bdc5" stroke="#567382" strokeWidth="2" />
      <path d="M34 25 55 30V57L34 52Z" fill="#213f56" stroke="#4c6f7d" strokeWidth="1.5" />
      <path d="M38 29 44 30V49L38 48ZM47 31 52 32V51L47 50Z" fill="#7ca4a8" />
      <path d="M35 55 55 60" stroke="#8ca3aa" strokeWidth="2" /><circle cx="57" cy="29" r="2.5" fill="#62c797" /><path d="M67 29V55" stroke="#79949e" strokeWidth="1.4" />
    </>}
    {kind === "solar" && <>
      <path d="M12 34 58 31 48 57 5 58Z" fill="#216f95" stroke="#164b72" strokeWidth="2" />
      <path d="M21 33 14 58M34 32 29 57M47 31 42 57M9 46 53 45" stroke="#97dbdf" strokeWidth="1.5" />
      <path d="M24 58V65M43 57V65" stroke="#55727c" strokeWidth="2" />
      <path d="M70 21V65M70 21 59 17M70 21 81 10M70 21 78 34" fill="none" stroke="#315d75" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="70" cy="21" r="3" fill="#e7f4ef" stroke="#315d75" strokeWidth="1.5" />
      <circle cx="80" cy="10" r="3" fill="#e9bc59" />
    </>}
    {kind === "grid" && <>
      <path d="M20 65 35 15 50 65M28 41h15M24 54h22M16 28h38M21 22h28M35 15v-7" fill="none" stroke="#42677c" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M20 29 35 41 50 29M25 54 35 42 45 54" fill="none" stroke="#8aabb6" strokeWidth="1.4" />
      <path d="M53 30h31M57 31v34M81 31v34" stroke="#456c80" strokeWidth="2" />
      <rect x="58" y="40" width="22" height="23" rx="2" fill="#d3e2e5" stroke="#587a88" strokeWidth="1.5" />
      <path d="M62 47h14M62 53h14" stroke="#7ba5b1" strokeWidth="1.5" /><circle cx="69" cy="58" r="2" fill="#d8a648" />
    </>}
    {kind === "factory" && <>
      <path d="M11 37 28 29v9l16-9v9l16-9v9l20-8v34H11Z" fill="#bbd3dc" stroke="#537486" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 19h9v17l-9 4ZM61 15h9v19l-9 4Z" fill="#6b93a4" stroke="#537486" strokeWidth="1.5" />
      <path d="M18 46h10v9H18ZM36 46h10v9H36ZM54 46h10v9H54Z" fill="#377a9c" />
      <path d="M75 41v22M12 63h69" stroke="#527485" strokeWidth="2" />
      <path d="M21 14c-4-5 3-5 0-10M64 11c-4-5 3-5 0-10" fill="none" stroke="#9ab3bb" strokeWidth="2" strokeLinecap="round" />
    </>}
    {kind === "homes" && <>
      <path d="M9 37 27 21l19 16v28H9Z" fill="#dce9e7" stroke="#55788a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M47 33 66 16l21 17v32H47Z" fill="#e7f0ed" stroke="#55788a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 38 27 18l21 20M44 34 66 13l24 21" fill="none" stroke="#5b8293" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 45h10v10H17ZM58 41h11v10H58Z" fill="#6da7bd" /><path d="M33 49h8v16h-8ZM75 47h8v18h-8Z" fill="#7b9ca7" />
      <path d="M13 32h28M53 28h29" stroke="#277d9a" strokeWidth="2" />
    </>}
    {kind === "charging" && <>
      <path d="M9 29h75l-8-10H19Z" fill="#267799" stroke="#4d7080" strokeWidth="2" />
      <path d="M20 29v35M73 29v35" stroke="#6c8c99" strokeWidth="3" />
      <path d="M22 41h14l7 9h31l7 11H15l7-20Z" fill="#edf4f3" stroke="#4e7180" strokeWidth="2" strokeLinejoin="round" />
      <path d="M43 50 38 43h28l7 7" fill="#8ec2cf" stroke="#4e7180" strokeWidth="1.2" />
      <circle cx="30" cy="61" r="5" fill="#324f60" /><circle cx="66" cy="61" r="5" fill="#324f60" />
      <path d="M14 33v23m0-14h6M84 34v21m0-13h-5" stroke="#477a91" strokeWidth="2" /><path d="m82 44-3 5h4l-2 5" fill="none" stroke="#d6a344" strokeWidth="2" />
    </>}
    {kind === "hospital" && <>
      <path d="M10 24h41v41H10Z" fill="#edf5f4" stroke="#597a8a" strokeWidth="2" />
      <path d="M51 34h34v31H51Z" fill="#c6dce0" stroke="#597a8a" strokeWidth="2" />
      <path d="M23 21h16v16H23Z" fill="#f7fbf8" stroke="#628394" strokeWidth="1.5" />
      <path d="M31 24v10M26 29h10" stroke="#d45657" strokeWidth="3" />
      <path d="M17 43h7v6h-7ZM30 43h7v6h-7ZM17 53h7v6h-7ZM30 53h7v6h-7Z" fill="#72aabc" />
      <path d="M59 41h17M59 48h17M59 55h17" stroke="#5f90a1" strokeWidth="3" /><circle cx="79" cy="42" r="1.5" fill="#69bd86" /><circle cx="79" cy="49" r="1.5" fill="#69bd86" />
    </>}
    {kind === "thermal" && <>
      <path d="M12 62c8-18 7-33 4-43h21c-3 10-4 25 4 43ZM47 62c8-18 7-33 4-43h21c-3 10-4 25 4 43Z" fill="#b8ccd3" stroke="#627f8c" strokeWidth="2" />
      <path d="M14 19h24M49 19h24M10 62h70" stroke="#5c7784" strokeWidth="2" />
      <path d="M25 13c-4-5 4-6 0-11M59 13c-4-5 4-6 0-11" fill="none" stroke="#a8bbc2" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 12h8v50h-8Z" fill="#8d9da4" stroke="#617b86" strokeWidth="1.5" /><path d="M78 24h8M78 43h8" stroke="#c57566" strokeWidth="3" />
    </>}
    {(kind === "hydroLower" || kind === "hydroUpper") && <>
      <path d="M8 44 29 25 42 36 59 15 88 44" fill="#b4ced4" stroke="#6b929f" strokeWidth="2" />
      <path d="M7 50q10-5 20 0t20 0t20 0t20 0v14H7Z" fill={kind === "hydroUpper" ? "#408ba8" : "#75b0c4"} />
      <path d="M7 50q10-5 20 0t20 0t20 0t20 0M8 57q10-5 20 0t20 0t20 0t20 0" fill="none" stroke="#d5f1ed" strokeWidth="2" />
      <path d="M53 34 61 30v34h-8Z" fill="#dbe7e6" stroke="#5c7e89" strokeWidth="2" />
      {kind === "hydroLower" && <><circle cx="36" cy="43" r="9" fill="#e7efec" stroke="#5e8797" strokeWidth="2" /><path d="M36 36v14M29 43h14" stroke="#5e8797" strokeWidth="2" /></>}
    </>}
    {kind === "turbine" && <>
      <circle cx="47" cy="37" r="25" fill="#d5e5e7" stroke="#597e8d" strokeWidth="2" /><circle cx="47" cy="37" r="7" fill="#5c97a9" />
      <path d="M47 30 44 15Q61 18 54 34ZM54 39 73 42Q67 58 50 44ZM43 42 33 60Q20 45 41 35Z" fill="#6da8ba" stroke="#508596" strokeWidth="1.3" />
      <path d="M72 37h14M8 37h14" stroke="#4b8094" strokeWidth="3" strokeLinecap="round" />
    </>}
  </svg>;
}
