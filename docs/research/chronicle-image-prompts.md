# 编年史材料示意图生成记录

2026-10-03，使用内置 image_gen（非CLI、未调用项目模型API）。五图经一次目视检查，均为概念结构示意，不是实测照片、显微数据或某篇论文模型。

运行文件：`frontend/public/chronicle/material-{sulfide,oxide,polymer,halide,composite}-ai.png`。以下为最终提示词。

## Sulfide

Use case: scientific-educational. Asset type: wide background for a solid-state battery research exhibition material panel. Generate one polished 3D scientific illustration of sulfide solid electrolyte microstructure: many pale yellow granular solid particles, compacted porous grain contacts between two flat gray electrode layers, tiny lithium-ion spheres following understated cyan paths through the solid grains. Physical solid particles, no liquids. Wide landscape, subject concentrated on right two-thirds so website text can overlay left. Neutral pale blue laboratory lighting, detailed tactile texture, realistic rendering but clearly an educational visualization. No words, no numbers, no logos, no scale bar, no fabricated SEM image or experimental plot. This is an AI conceptual illustration, not evidence of a specific material sample.

## 其余四图

分别将以下subject和id代入同一最终提示词（各一次独立内置调用）：

- oxide：a dense off-white ceramic solid electrolyte membrane between two flat electrode layers, magnified cutaway garnet-like connected ceramic grain boundaries, subtle tiny cyan lithium spheres through solid ceramic, no liquid
- polymer：a translucent pale-blue solid polymer membrane, magnified entangled molecular chain ribbons with small cyan lithium spheres moving along the polymer segments, two clearly separated flat electrode layers, no liquid
- halide：an orderly pale lavender-gray halide solid electrolyte crystalline lattice, magnified connected polyhedral framework and tiny cyan lithium spheres, thin crystalline layer between gray electrode layers, no liquid
- composite：a translucent solid polymer membrane embedded with many discrete ivory ceramic nanoparticles, magnified cutaway showing ceramic particles dispersed within connected polymer chain network and tiny cyan lithium spheres, two flat gray electrode layers, no liquid

Use case: scientific-educational. Asset type: wide webpage background for solid-state battery {id} material research exhibition. Generate one polished 3D educational scientific illustration of {subject}. Wide landscape, main subject occupies right two-thirds for website overlay copy on left. Pale neutral laboratory lighting, detailed tactile surfaces, understated blue-gray palette, consistent clean scientific rendering. No text, logos, numbers, scale bars, SEM artifacts, fabricated plots, or real company branding. This is a conceptual AI illustration, not evidence of a sample.


## 锂离子与钠离子五材料补图

### lithium-layered

运行文件：frontend/public/chronicle/material-lithium-layered-ai.png

Use case: scientific-educational. Asset type: wide background for lithium-layered battery material exhibition. Create a polished 3D scientific conceptual illustration of a magnified layered cobalt-oxide cathode crystal: connected gray-blue cobalt-oxygen octahedral sheets with smaller cyan lithium spheres between sheets; ions move between planes, orderly cutaway. Wide landscape, main structure on the right two-thirds leaving left space for web copy, pale laboratory lighting and detailed tactile texture. Represent solid electrode material at abstract molecular/microstructure level. No text, labels, numbers, logos, artificial SEM microscopy, or performance plots. Visually educational, not a specific experimental sample or exact crystallographic evidence.

### lithium-graphite

运行文件：frontend/public/chronicle/material-lithium-graphite-ai.png

Use case: scientific-educational. Asset type: wide background for lithium-graphite battery material exhibition. Create a polished 3D scientific conceptual illustration of a magnified graphite anode: many stacked dark gray hexagonal carbon sheets with cyan lithium spheres in interlayer spaces, some layers cut away to show insertion. Wide landscape, main structure on the right two-thirds leaving left space for web copy, pale laboratory lighting and detailed tactile texture. Represent solid electrode material at abstract molecular/microstructure level. No text, labels, numbers, logos, artificial SEM microscopy, or performance plots. Visually educational, not a specific experimental sample or exact crystallographic evidence.

### sodium-layered

运行文件：frontend/public/chronicle/material-sodium-layered-ai.png

Use case: scientific-educational. Asset type: wide background for sodium-layered battery material exhibition. Create a polished 3D scientific conceptual illustration of a magnified iron-manganese layered oxide cathode: gray and warm muted bronze metal-oxygen polyhedral sheets with larger aqua sodium spheres in interlayer planes. Wide landscape, main structure on the right two-thirds leaving left space for web copy, pale laboratory lighting and detailed tactile texture. Represent solid electrode material at abstract molecular/microstructure level. No text, labels, numbers, logos, artificial SEM microscopy, or performance plots. Visually educational, not a specific experimental sample or exact crystallographic evidence.

### sodium-prussian

运行文件：frontend/public/chronicle/material-sodium-prussian-ai.png

Use case: scientific-educational. Asset type: wide background for sodium-prussian battery material exhibition. Create a polished 3D scientific conceptual illustration of a magnified Prussian white sodium-battery cathode framework: open cubic iron-cyanide coordination network, slender connecting rods and coordination nodes, sodium spheres occupying open framework cavities, subdued blue-gray color, cubic cages structurally clear. Wide landscape, main structure on the right two-thirds leaving left space for web copy, pale laboratory lighting and detailed tactile texture. Represent solid electrode material at abstract molecular/microstructure level. No text, labels, numbers, logos, artificial SEM microscopy, or performance plots. Visually educational, not a specific experimental sample or exact crystallographic evidence.

### sodium-hard-carbon

运行文件：frontend/public/chronicle/material-sodium-hard-carbon-ai.png

Use case: scientific-educational. Asset type: wide background for sodium-hard-carbon battery material exhibition. Create a polished 3D scientific conceptual illustration of a magnified sodium-battery hard-carbon anode: curved disordered short graphene stacks forming irregular closed micropore cavities, small aqua sodium spheres in pores and between stacks, dark charcoal texture. Wide landscape, main structure on the right two-thirds leaving left space for web copy, pale laboratory lighting and detailed tactile texture. Represent solid electrode material at abstract molecular/microstructure level. No text, labels, numbers, logos, artificial SEM microscopy, or performance plots. Visually educational, not a specific experimental sample or exact crystallographic evidence.


