# 飞轮储能

核查日2026-10-03；路线 `flywheel`。主线是旋转动能与快速电力调节；大型功率不必然对应长持续时间。本批不虚构古代飞轮的电网储能起源，最早具体工程节点采用1950年电动公交试验。

## 一 历史

### 1950｜Gyrobus展示车载动能储能
ABB历史资料记录MFO在Yverdon开展Gyrobus试验，利用车载飞轮储存动力，减少对连续架空接触线的依赖。此节点代表早期电驱飞轮应用，不称飞轮机械本身于1950年发明。来源：https://new.abb.com/news/detail/3321/from-streetcars-to-race-cars-abbs-deep-experience-in-e-mobility

### 2002｜被动磁轴承试验跨过临界转速
NASA技术报告A Passive Magnetic Bearing Flywheel披露装置运行至5500 rpm，第一临界转速3336 rpm。径向采用永磁轴承、轴向仍为宝石轴承，因此不能描述成整机完全无接触。来源：https://ntrs.nasa.gov/citations/20020038851

### 2004｜NASA G2实际运行到41000 rpm
2004-09-02，G2试验模块运行至41000 rpm；NASA在2005年研究报告记录该事件。明确事件年2004与文献发布年2005，不能把设计60000 rpm当成本次达到转速。来源：https://ntrs.nasa.gov/citations/20050217267

### 2006｜模块设计给出转子与控制边界
NASA/CR-2006-213862公开G2模块设计：60000 rpm、525 Wh、1 kW设计规格；多层碳纤维轮缘、钛轮毂，面向实验室部件与系统验证。功率和储能密度仍受转子应力、轴承和动态稳定性约束。来源：https://ntrs.nasa.gov/citations/20060028492

### 2011｜20 MW调频电站商运
Stephentown于2011年1月开始商业运行，6月达到全部20 MW；纽约州NYSERDA数据库记录5 MWh。20 MW/5 MWh相当于额定功率约15分钟，充放双向40 MW调节范围不能写成40 MW发电容量。来源：https://beaconpower.com/stephentown-new-york/ ; https://der.nyserda.ny.gov/facilities/654/

### 2014｜Hazle第二座20 MW站全容量运行
2014年7月，200台飞轮组成的Hazle电站全面商业运行，为PJM提供调频。模块化规模扩展用于快速双向功率服务，而不是把电量扩展到数小时。来源：https://beaconpower.com/hazle-township-pennsylvania/

### 2015｜超导轴承结合大型复合材料转子
RTRI等完成300 kW/100 kWh设计能力的超导飞轮试验机并启动测试。2015-04-15公告给出直径2 m、质量4 t、最高6000 rpm、CFRP转子；并网光伏测试在公告时仍计划当年夏季开展。不能把设备规格与全部工况验收结果等同。来源：https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html

### 2018｜工程资产与制造业务分开流转
2018-05-01，Convergent收购Stephentown与Hazle共40 MW运行资产；Beacon制造业务的收购主体另为RGA Investments。区分资产运营和设备制造，避免沿用旧上市主体描述今日企业。来源：https://convergentep.com/news/convergent-energy-power-acquires-40-mw-of-flywheel-projects ; https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/

### 2024｜山西30 MW电网侧工程并网
山西省政府系统2024-09-24消息确认鼎轮30 MW飞轮调频项目在长治并网。该来源明确功率，未在本次核查正文获得可靠MWh，不由30 MW自行推算长时储能容量。来源：https://www.xr.gov.cn/xrqrmzfz/sxyw/202409/aa347b9e0722469bb0c7f20c23975c78.shtml

## 二 材料与关键部件

### 转子与轮毂
可用动能与转动惯量及最高、最低转速有关，E=½I(ω_max²−ω_min²)。提高转速可以增加能量，同时提高材料应力与对动态平衡的要求。NASA G2采用多层碳纤维轮缘和钛轮毂；RTRI试验机为CFRP转子。不能以某个复合材料转子图片代表所有钢制飞轮。来源：G2设计报告、RTRI2015公告。

### 磁轴承与支承
磁轴承降低接触损耗；转子稳定控制、备用着陆轴承和异常停机仍是系统设计内容。NASA2002被动试验仅径向永磁、轴向宝石支承；RTRI2015为高温超导线圈和超导块材组合。不同类型不能统称为无能耗悬浮。来源：对应两份原始技术资料。

### 真空容器与约束结构
降低气体阻力可减少旋转损耗，容器和结构同时承担设备环境及安全约束。RTRI2015技术分工明确Mirapro提供真空容器。低空气阻力不消除电机、控制、轴承与附属设备耗电；长期待机能量衰减仍应计入。来源：https://www.rtri.or.jp/eng/publish/newsletter/pdf/53/RTN-53.pdf

### 电机发电机与电力电子
同一转子通过电机吸收电力加速、通过发电制动减速；控制器把调频指令转换成双向功率。电站调节范围、单向额定功率、有效电量与可持续时间需分别显示。来源：Beacon两个工程页与NASA G2设计报告。

## 三 论文与报告

| 原始资料 | 数据 | 测量或设计边界 |
|---|---|---|
| NASA/TM-2002-211159，A Passive Magnetic Bearing Flywheel | 达到5500 rpm，第一临界转速3336 rpm | 试验台转速结果；径向永磁、轴向宝石支承，无并网效率指标 |
| NASA/CR-2006-213862，G2 Flywheel Module Design | 60000 rpm、525 Wh、1 kW | 实验室设计规格；2004实际41000 rpm由另份进展报告证明，不混为同次测试 |
| RTRI，2015，超导飞轮技术公告及研究报告 | 300 kW、100 kWh、4 t、2 m、最高6000 rpm | 当时公布设备能力与开始测试状态，非几十年寿命实证 |
| DOE，2017，Hazle Spindle项目报告入口 | 电网级20 MW调频示范 | 工程应用报告，适合展示调频服务与集成；https://www.energy.gov/oe/articles/arra-sgdp-hazle-spindle-20-mw-flywheel-frequency-regulation-plant-formerly-beacon-power |

## 四 企业与工程

Beacon Power—飞轮制造与系统技术；Convergent—2018收购两座运行站；RTRI/Kubotek/Furukawa/Mirapro—日本超导飞轮研发分工；中国能建山西院及山西电建—鼎轮工程总承包/参建。美国旧Beacon上市股票与重组后的私营公司不要混为同一当前上市主体。企业简介、财务和照片由Luna提供。

## 五 政策市场

FERC Order755（2011-10-20）推进按调频性能补偿，要求公平反映调节服务；这能解释快速响应设备的价值，但不是飞轮专属补贴，也不保证固定收益。原文：https://www.ferc.gov/sites/default/files/2020-06/OrderNo.755.pdf

本路线不以新型储能全部GW/GWh图表代表飞轮规模。可选已核工程比较：Stephentown20 MW/5 MWh（2011）、Hazle20 MW（2014）、鼎轮30 MW（2024，未填无依据MWh）。企业不同年份累计运行小时相互冲突或口径不清时，不拼成新的最新纪录。

## 六 储能适配

适合频繁双向调节、功率平滑、再生制动吸收及短时支撑；单次容量不大而循环频繁的需求更符合已有工程主线。额定功率高不等于供能时间长，转子静置于高转速也存在损耗。与电化学储能混合时，飞轮可承担快速波动、较大能量库承担慢变化，但具体分配由信号和成本决定。长时间待机、小时级移时需核实自耗、有效电量及机械约束，不直接拿调频站额定MW替代长时储能能力。
