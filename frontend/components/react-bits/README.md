# React Bits adaptations

`SpotlightCard.tsx` and `Magnet.tsx` adapt the TypeScript source from [React Bits](https://github.com/DavidHDev/react-bits) (David Haz). The local versions retain the pointer spotlight and magnetic translation, scope pointer work to the component, and disable decorative motion for reduced-motion or coarse-pointer settings. `LatticeLoader.tsx` adapts the complete component source supplied for this task, including the original named patterns and 3×3/4×4 marks; its timer and accessibility labels are integrated with this application's Chinese workflow.

Upstream source: [SpotlightCard](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/SpotlightCard/SpotlightCard.tsx), [SpotlightCard CSS](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/SpotlightCard/SpotlightCard.css), [Magnet](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/Magnet/Magnet.tsx). License terms are reproduced in `LICENSE.md`.

## User-supplied components, 2026-09-26

- `BranchedMenu.tsx/css`: adapted from attachment `da6809fc-b31f-4ffb-a239-90d9146404fd/已粘贴的文本.txt` (the attachment heading incorrectly names the component `undefined`). Retains SVG branches, active-path drawing, marker and folding; uses this project's icons and Next links, with accessible disclosure controls.
- `GhostFibers.tsx/css`: adapted from attachment `75c1892d-35ae-4d9c-b0e8-e0a73deaf595/已粘贴的文本.txt`. Uses the supplied fiber shader with OGL `^1.0.11`, route-specific colors and bounded rendering.
- `TextLoop.tsx/css`: adapted from attachment `a0e0f58f-31d3-4293-97ad-4b3de9c4cdc7/已粘贴的文本.txt`. Uses the supplied SVG text-path/GSAP approach with GSAP `^3.15.0`, Chinese decorative phrases and motion pause handling.
- `GlideSelect.tsx/css`: adapted from attachment `1b3483d3-7dc3-4ab0-b0cd-20021452f459/已粘贴的文本.txt`. Used only for the selected 15 dropdowns; existing labels and controlled values stay with their forms.
- `TechText.tsx/css`: adapted from attachment `49ae3eac-bd5d-46a4-a743-f215a8e69313/已粘贴的文本.txt`. Learning heading retains Canvas per-glyph fill/outer-outline sprites, hover frame and a restrained idle sweep; drag is omitted. The containing `WorkspaceHeader` keeps the semantic h1.
- `ParticleText.tsx/css`: adapted from attachment `b979b353-1156-4478-8886-546a406fb9fc/已粘贴的文本.txt`. Uses Canvas glyph-pixel sampling, one initial gather and light pointer repulsion for two data-empty states.
- `SpecularInteractions.tsx/css`: adapted from attachment `7aef173f-0073-415f-a7b3-d57858031e39/已粘贴的文本.txt` (SpecularButton). Reuses its OGL rounded-rectangle SDF and opposed mirror highlights with one shared transparent context; native button, button-style link and upload file-label DOM remain intact. The effect excludes home, navigation, top bar, GlideSelect, disabled controls and ordinary text links; inputs remain unchanged.
- `WarpText.tsx/css`: adapted from attachment `49ec5c0c-a17f-491b-871c-dfb9bba0bd68/已粘贴的文本.txt`. Retains OGL shader distortion, Canvas text rasterization and pointer lens, with visible DOM text fallback, responsive rerasterization and motion pauses.
- `TechText.tsx/css`: the current title adaptation also follows attachment `67293c07-a183-4a52-b660-7302117a8da3/已粘贴的文本.txt`; its per-glyph Canvas and hover frame are reused for selected short page headings.
- `TrueFocus.tsx/css`: adapted from attachment `a066faec-1ea5-4929-b00e-4fa132bc8171/已粘贴的文本.txt`. Uses word-focused DOM spans and a four-corner focus frame; Chinese headings prefer common word segments and fall back to two-character groups.
- `ThemePillSwitch.tsx/css`: adapted from attachment `c3aa0093-71e7-417c-9fd5-cf3b645b4719/已粘贴的文本.txt` (PillNav). The two native buttons replace only the existing light/dark theme-switch slots in the workspace and homepage header.

`EnergyMaterialScene.tsx` in `components/workspace/` adapts the short scroll expansion idea from attachment `a797ae83-d7ae-47d7-80dc-4ff5374cac6e/已粘贴的文本.txt` (ScrollExpand) to the three layered material atlases. It follows native page scrolling without adding a scroll track.

The research-data empty-state `ParticleText` uses a local eight-character subset of Google Fonts [ZCOOL XiaoWei](https://github.com/google/fonts/tree/main/ofl/zcoolxiaowei), with its [SIL Open Font License](../../public/fonts/research-display/OFL.txt) in `frontend/public/fonts/research-display/`. The upload page still uses the existing Research Calligraphy (Ma Shan Zheng) font and its [license](../../public/fonts/research-calligraphy/OFL.txt).

Original attachments remain under the user's `.codex/attachments` folder. These references are source provenance, not executable installation instructions. Shared license attribution above is retained.

Chronicle opts into GlideSelect label-swap (160ms) and a scoped portal palette for its family/route/material/company controls, following attachment d3d246cb-b2dc-453d-a194-a48576d73674. Existing consumers retain default label behavior.
