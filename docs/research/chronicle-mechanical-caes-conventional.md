# 常规压缩空气储能

核查日2026-10-03；路线 `caes-conventional`。本页指压缩热主要排出、放电依靠燃烧补热的传统CAES。它同时接受充电电力与燃料能量；不与无燃料绝热CAES混写为相同往返效率边界。

## 一 历史

### 1978｜Huntorf开启商业CAES
德国Huntorf开始运行。Uniper将其确认为首座此类工程；现资产表列技术容量321 MW，不能倒填为1978年初始额定容量。地下储气把压缩与发电时段分离，但放电仍用燃料补热。来源：https://www.uniper.energy/energy-storage-uniper ; https://www.uniper.energy/system/files/2026-03/2026_03_11_FY_2025_Uniper_List_of_Assets_Edition_2025.pdf

### 1991｜McIntosh引入排气余热回收
美国McIntosh 110 MW工程投入运行，回热器利用排气预热高压空气，减少燃料需求。110 MW是CAES单元，不能把同站新增常规燃气轮机一并计作CAES规模。DOE资料与原始工程研究支持其1991年及110 MW信息。来源：https://www.hydrogen.energy.gov/pdfs/htac_feb_23_10_analysis.pdf ; https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004

### 2003｜Iowa启动含水层工程设计
Iowa Stored Energy Park开展概念设计，拟建设270 MW项目。不同于盐穴，该方案依赖含水层储气；这是项目开发史节点，并未建成。来源：Sandia SAND2012-0388参考文献及项目回顾 https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf

### 2010｜美国示范支持进入监管程序
2010-01-21加州公用事业委员会批准PG&E为DOE压气储能项目提供配套支持。政策支持推动地质与可行性研究，批准支持不等于项目运行。来源：https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/infrastructure/smart-grid-landing-page

### 2011｜Iowa因地质限制终止
2011-07-28项目终止，270 MW只是原拟规模。项目表明地层存在并不代表满足储气注采能力；前期地质风险可以改变整个商业可行性。来源：Sandia SAND2012-0388，第18页起项目史及终止记录，https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf

### 2012｜地质和市场教训成为公开报告
Sandia系统整理Iowa八年开发的经验，连接储气地质、设备规模、电力市场与融资。该年是研究报告出版，不是新电站投产。原报告题为Lessons from Iowa: Development of a 270 Megawatt Compressed Air Energy Storage Project…。来源同上。

### 2019｜洞室动态模型进入优化研究
原始论文An accurate bilinear cavern model for compressed air energy storage研究洞室动态描述。单一固定“电池SOC”难以完整表示温压变化；可用于规划调度的模型必须保留储气状态约束。来源：https://www.sciencedirect.com/science/article/pii/S0306261919305094

### 2020｜Huntorf改进方案接受热力评估
Assessment of Huntorf compressed air energy storage plant performance under enhanced modifications比较改造方案及回热路径。这是模型/改造研究，不能将算出的改进绩效写成电站已完成改造实测。来源：https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004

### 2025｜既有工程仍在资产组合中
Uniper FY2025资产表（2026年3月发布）继续列Huntorf 321 MW、投运1978年。这里只证明该报告中的既有资产记录，不新增一座321 MW工程，也不推断全年可用率。来源：https://www.uniper.energy/system/files/2026-03/2026_03_11_FY_2025_Uniper_List_of_Assets_Edition_2025.pdf

## 二 材料与关键部件

### 压缩空气与地层
空气在洞室形成压力势能；盐穴、含水层或衬砌岩洞的密封与注采条件不同。Iowa的终止使地质筛选成为具体经验，而非抽象风险。不能由地层体积直接算成可发电MWh，还需压力窗口、空气温度、机组及燃料条件。来源：Sandia 2012原始项目报告。

### 压缩机与冷却
常规路线在充电时压缩空气，并排出大量压缩热；冷却有利于降低后续压缩功和储气温度，却使释能前需要再次补热。与绝热路线的差别主要在热管理，不是有没有空气压缩机。来源：DOE/EPRI储能手册 https://www.energy.gov/sites/default/files/2013/08/f2/ElecStorageHndbk2013.pdf

### 燃烧室与膨胀机
燃烧给高压空气补热后膨胀发电。输出电量含充电电力和燃料共同贡献，不能仅用输出电量除以充电电量就称无条件往返效率，也不能由电站名称推断零排放。来源同手册及2020原始研究。

### 回热器与控制
McIntosh的回热器回收排气热，提高进入燃烧段空气温度，降低追加燃料需求；它与存储压缩热的独立蓄热系统不同。洞室压力变化影响流量与膨胀机工况，运行控制需共同管理电力输入、燃料和储气状态。来源：2020研究与2019洞室模型。

## 三 论文与技术报告

| 原始资料 | 研究贡献 | 可呈现的指标及边界 |
|---|---|---|
| Sandia，2012，SAND2012-0388 | 完整复盘Iowa开发、地质检验和终止 | 270 MW、4亿美元为拟议工程参数；2015为原计划投产年份，实际未建成 |
| An accurate bilinear cavern model…，2019 | 面向储气状态变化的可计算模型 | 模型研究，无本次核查支持的统一误差数字，不填空泛精度纪录；https://www.sciencedirect.com/science/article/pii/S0306261919305094 |
| Assessment of Huntorf…，2020 | 讨论Huntorf改造及回热器作用 | 原文背景比较常见42%与54%效率，但含燃料定义与设定不同；本页不做与电池AC效率的排行；https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004 |
| DOE/EPRI，2013，Electricity Storage Handbook | 给出工程配置、服务与成本分析边界 | 文献当年参数，非2026报价；https://www.energy.gov/sites/default/files/2013/08/f2/ElecStorageHndbk2013.pdf |

## 四 企业与工程

Uniper—Huntorf运行工程；PowerSouth—McIntosh CAES工程；Iowa Stored Energy Plant Agency—已终止开发案例；PG&E—受监管支持的示范研究。企业宣传中的同站燃机总容量必须与CAES机组分开。企业财务/图片由Luna批次提供，不能把矿洞照片当作已经投运压气储能项目。

## 五 政策市场

这一路线有长期商运工程，但不据两座历史标杆推断2026全球仅剩两座、也不把所有现代CAES装机计入燃烧补热路线。美国2010年示范支持、Iowa实际终止记录表明政策投入与商业落地之间仍需地质验证。中国新型储能总装机图只能表示行业背景，且中国近年300 MW先进CAES项目应归热回收路线，不能借来充当传统燃气补热工程规模。

## 六 储能适配

适合具备大型储气地质条件、需要大功率放电且能接受燃料供应与排放约束的系统。充电电力承担压缩过程，可减少发电时压缩机所需功；回热器改善燃料利用，但并不消除燃料。采购和研究比较至少同时列出发电MW、有效放电时长、充电耗电、燃料耗量及运行压力。只比较“单位放电电量成本”而忽略天然气价格，会掩盖核心敏感项。其历史价值还在于积累洞室注采及大型机组经验，后续绝热路线继承机械基础、重做热管理。
