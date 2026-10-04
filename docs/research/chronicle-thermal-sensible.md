# 显热储能

资料日期2026-10-03。页面六栏：历史、材料、论文、企业、政策市场、储能适配。储热量统一MWh_th，电量MWh_e；功率相应MW_th、MW_e。企业财务和照片由独立素材批补充。

## 一 历史

### 1975｜太阳能住宅把夏季热量留下
**短重点：热水储存成为住宅能源系统的一部分。** DTU研究资料将1975年的Zero Energy House记为丹麦早期太阳能住宅实例，讨论集热、热储存与用热系统配合。此处作为现代系统研究起点，不宣称人类从这一年才使用显热。来源：https://orbit.dtu.dk/files/4715224/byg-r156.pdf

### 1996｜Solar Two验证高温熔盐链路
**短重点：接收、储存、产汽共用高温熔盐。** Sandia的Solar Two试验采用60% NaNO₃/40% KNO₃，接收器入口290°C、出口565°C；接收器额定42.2 MW_th，电站约10 MW_e，两个功率并非TES电量。它把白天集热与发电调度分开。来源：原始最终试验报告 https://www.osti.gov/servlets/purl/793226 ; 当年启用消息 https://newsreleases.sandia.gov/sandia-labs-shares-major-solar-success-with-industrial-consortium/

### 2001｜单罐温跃层减少熔盐用量
**短重点：用砂石填充料替代部分液态储热介质。** Sandia的2.3 MWh_th中试用石英岩和硅砂填充单罐，在热端与冷端之间保留温跃层。2004技术报告追溯该试验并验证填充材料选择；单罐成本思路同时引入温跃层扩散和循环机械应力问题。来源：https://www.osti.gov/servlets/purl/919178 ; https://inldigitallibrary.inl.gov/sites/sti/sti/sort_20500.pdf

### 2008｜商业熔盐与混凝土研究并进
**短重点：规模工程和低成本固体介质走向不同应用。** Andasol1数据库记录起始年2008，50 MW_e汽轮机、1010 MWh_th两罐间接储热、7.5小时配置；同年DLR的20 m³混凝土模块已在300—400°C运行约4个月，完成约50次40 K温差循环。前者是商业工程参数，后者是试验条件。来源：https://solarpaces.nlr.gov/project/andasol-1 ; https://elib.dlr.de/57976/

### 2015｜水坑储热扩大到区域供热
**短重点：低温水储热用规模换取季节调节。** Vojens建成大型季节水坑储热；IEA SHC资料记录200000 m³水坑与区域太阳能供热耦合。m³是水体容积，实际MWh_th还取决于可用温差与分层，不能把容积直接当能量。来源：https://pubs.iea-shc.org/article?NewsID=265 ; https://task45.iea-shc.org/publications

### 2018｜TESIS提供兆瓦时级熔盐试验平台
**短重点：把阀门、加热器与单罐储热放在系统工况中验证。** DLR说明TESIS:Store自2018年具备4 MWh单罐熔盐运行经验，并配套部件试验段。这里4 MWh为热容量，不是储能电站输出电量。来源：https://www.dlr.de/de/tt/forschung-transfer/expertise/forschungsbereich-waermespeicher/thermische-systeme-fuer-fluessigkeiten

### 2019｜火山岩中试连通电—热—电
**短重点：高温固体填充床进入电网示范。** Siemens Gamesa于2019-06-12启用Hamburg ETES，约1000 t火山岩由热空气加热到750°C，储热容量130 MWh_th，配置蒸汽循环回发电。130 MWh_th不是电端可交付130 MWh_e；企业稿未给本次可核的整站往返实测效率。来源：https://www.siemensgamesa.com/global/en/home/press-releases/190612-siemens-gamesa-inauguration-energy-system-thermal.html ; 政府研究项目说明 https://www.energieforschung.de/de/aktuelles/news/2019/windenergie-in-vulkangestein-speichern-weltpremiere-in-hamburg

### 2022｜高温砂储热开始提供区域热量
**短重点：电转热直接接供热网络。** 芬兰Kankaanpää装置从2022年夏季使用，当期环境部门资料记录100 kW_th、8 MWh_th。企业当前参考页已列200 kW供热功率，因此历史节点保留当期100 kW，不把两个规格拼成同年纪录。来源：https://kestavyysloikka.ymparisto.fi/kankaanpaan-pilottikohteessa-lampoa-varastoidaan-hiekka-akkuun/ ; 当前企业页 https://polarnightenergy.com/reference/worlds-first-sand-battery/

### 2025｜100 MWh热储存接入Pornainen
**短重点：固体储热从示范扩大到主供热设施。** 2025-06-11，Loviisan Lämpö启用1 MW_th/100 MWh_th装置，约2000 t皂石碎料作为介质。它给区域供热网供热，没有证明同容量电端回发电。来源：https://polarnightenergy.com/fi/news/maailman-suurin-hiekka-akku-kaynnistyi/

### 2026｜首个完整供热年公布运行结果
**短重点：从设计参数转向年度供热表现。** Polar Night Energy于2026-06-11报告Pornainen运行一年，区域供热网气候排放降低70%。这是企业披露的供热系统减排结果，不是热效率70%，也不是电热电效率；归因边界包括被替代燃料和供电。来源：https://polarnightenergy.com/news/worlds-largest-sand-battery-achieves-its-targets-emissions-reduced-by-70/

## 二 材料

### 热水与水坑
水通过温度变化存热，理想Q=m∫c_p(T)dT。材料易获得，适合热水、建筑与区域供热；分层使热端保持可用温度。工程关键是保温盖、内衬、补水、地基和与管网的换热。相同水量在不同供回水温度下有效储热量不同。Vojens证明大容积季节储存路径；升高温度还涉及压力和水的相态，不能无限扩大ΔT。

### 硝酸盐熔盐
Solar Salt实例为NaNO₃/KNO₃混合物；Solar Two在约290—565°C之间保持液态，利用比热储能。双罐分别容纳冷热盐；间接系统还通过导热油—盐换热器。盐的凝固点限制冷端，热稳定性和腐蚀限制热端，管道与阀门需要伴热防凝。名称中“熔盐”不代表靠熔化潜热工作。来源：Solar Two原始报告、Andasol配置。

### 混凝土及固体填充床
混凝土、岩石、砂/皂石在循环中升降温，导热路径和换热面积决定功率。混凝土内埋管可用导热油传热；岩石填充床可由空气直接换热。材料便宜不等于系统便宜，须计入换热器、风机、保温及结构循环应力。DLR50次循环是早期模块证据，不能写成所有固体介质万次无衰减。

### 罐体、换热器与保温
储热介质决定容量潜力，容器与换热决定是否能以所需温度和功率交付。单罐温跃层需要维持热冷分区；两罐需要更多容器和熔盐。长时间静置仍会向环境散热，保温设计影响待机损失。DOE概述：https://www.energy.gov/cmei/systems/solar-thermal-energy-storage-and-heat-transfer-media

## 三 论文

| 原始研究/报告 | 尺度与工况 | 结果与意义 |
|---|---|---|
| Sandia，Final Test and Evaluation Results from the Solar Two Project，2002，OSTI793226 | 硝酸盐60/40；290—565°C；接收器42.2 MW_th | 太阳能接收、熔盐储存与产汽系统试验，区分接收器热功率与发电功率；https://www.osti.gov/servlets/purl/793226 |
| Sandia，Testing thermocline filler materials…，2004，SAND2004-3207 | 2.3 MWh_th温跃层中试背景、石英岩/硅砂、熔盐相容性及热循环测试 | 填充料可减少所需熔盐，选择需经材料与循环验证；https://www.osti.gov/servlets/purl/919178 |
| Laing等，2008，Concrete Storage for Solar Thermal Power Plants and Industrial Process Heat | 第二代20 m³模块、300—400°C、约50次ΔT40 K循环、4个月 | 固体显热模块运行证据；早期试验时长不能充当整寿命保证；https://elib.dlr.de/57976/ |

## 四 企业

工程关联可直接用于企业详情：Polar Night Energy提供高温固体储热，Vatajankoski/Loviisan Lämpö分别关联Kankaanpää/Pornainen；Siemens Gamesa、Hamburg Energie与TUHH关联2019 ETES示范；DLR/Züblin关联混凝土研发；Andasol1为太阳能发电与两罐间接储热工程。Luna提供最新主体简介和图片。工业热电池公司不得因产品叫battery被标成电化学电池；业主、技术供应商与研究机构分别标清。

## 五 政策市场

DOE 2023 Thermal Energy Storage Technology Strategy Assessment把储热纳入Storage Innovations2030，讨论材料、系统、制造和应用成本；这是研发评估，不是已达成本或全球装机统计。原文：https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Thermal%20Energy%20Storage_0.pdf

建筑侧另有DOE2024技术资料，强调TES与现场可再生能源及热泵集成。来源：https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings 。展示市场时用“区域供热、工业过程热、CSP调度、电热电”四类用途；不把中国新型储能136 GW/351 GWh统计当成显热市场。建议关闭通用市场图，展示Vojens容积、Andasol热容量和Pornainen热功率/容量的独立工程表，不作同单位排行。

## 六 储能适配

| 需求 | 匹配方式 | 主要约束 |
|---|---|---|
| 热水/区域供热 | 水罐、水坑或固体储热经换热供水 | 管网温度、散热、空间、季节负荷 |
| 工业过程热 | 电阻加热固体或熔盐，再输出热空气/蒸汽 | 交付温度、连续功率、换热压降与材料稳定性 |
| 光热发电 | 集热侧先储热，再向动力循环供热 | 发电效率、日照、盐冻结与启停 |
| 电力移时 | 电—热—电完整链路 | 回发电引入热机损失；热端高效率不等于电端高效率 |

显热的容量扩展主要增加介质与容器，功率扩展主要增加换热及加热设备。低温热水适合直接用热，高温介质拓展过程热和发电；比较时应同时给出储热温区、热端/电端输出与时间，避免只看单一MWh数字。
