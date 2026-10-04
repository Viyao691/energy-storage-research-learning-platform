# 液氢储能

资料更新：2026-10-03。入口 `hydrogen-liquid`；`showMarketChart: false`。以下为研究六栏，公司独立资料另接。液氢容量用kg H₂或罐容积表示，液化与维持低温的耗电单独列出。

## 一 历史

### 1898｜Dewar实现氢液化

**把氢冷却到极低温，打开了提高体积储氢密度的另一条路。** NASA的液氢技术史记录James Dewar于1898年首次液化氢。此节点是物态控制的实验突破，不是当年已经具备工业液氢运输。接近常压沸点约20 K（约−253 °C）意味着容器不仅要装得住，还必须隔绝持续进入的热量。

来源：[NASA，Taming Liquid Hydrogen，技术史](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4230.pdf)；[DOE Physical Hydrogen Storage](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage)。

### 1963｜Centaur首次成功飞行验证液氢上面级

**液氢从低温实验推进到发动机、储罐和地面设施的完整系统。** NASA记载1963-11-27 Atlas/Centaur成功发射。此前1962年首次试飞失败，后续围绕绝热、加注、增压与排气改进。航天推进证明液氢可被工程化管理，但火箭的一次性飞行任务与地面长期库存的经济要求不同。

来源：[NASA Centaur官方历史](https://www.nasa.gov/history/centaur-americas-workhorse-in-space/)。

### 2015｜玻璃微球绝热完成现场对照

**储罐损耗不仅由液氢决定，也由绝热层决定。** NASA后续官方技术发布总结2015年在Kennedy和Stennis完成的现场示范：以玻璃微球替代珍珠岩粉末，在相关对照条件下蒸发损失最多降低约46%。这是相对于原绝热方案的蒸发损失降幅，既不是46%的系统效率，也不是任何储罐固定的日蒸发率。

来源：[NASA Innovative Liquid Hydrogen Storage，含2015现场结果](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/)。

### 2017｜125 m³储罐试验实现主动零蒸发

**用制冷移走漏热，可以把“慢慢蒸发”改为受控存储。** NASA原始会议论文报告125,000 L真空夹层、多层绝热液氢罐，与内部换热器及闭式氦制冷机耦合；制冷机在20 K具有390 W冷量，不使用液氮预冷。团队试验温度控制、压力反馈和启停制冷三种控制方式实现零蒸发。390 W是低温端制冷量，不是电网输入功率；零蒸发以持续制冷耗电为代价。

来源：[Notardonato等，2017原始论文，NASA NTRS 20170006481](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)。

### 2022｜澳日液氢海运链完成示范运输

**储罐、装卸和航运开始被放到同一供应链验证。** Kawasaki记载Suiso Frontier使用1,250 m³液氢罐，以约−253 °C保存液氢，2022年2月底完成示范航程返回神户。该数字是货罐容积，不是船上每次实装液氢质量，更不是可输出电量；示范运输也不能直接等同商业贸易已达规模。

来源：[Kawasaki 官方技术报道](https://answers.khi.co.jp/en/energy-environment/20220513e-01/)。

### 2023｜80 kg液氢支撑长途卡车试验

**更紧凑的燃料库存开始用于重载长距离任务。** Daimler Truck于2023年9月以GenH2原型车完成单次加注1,047 km道路试验，车载约80 kg液氢、总组合质量约40 t。该结果证明指定路线和车辆条件下的续航能力，不能替代不同货重、气候或道路条件下的平均能耗，也不是电网储能往返测试。

来源：[Daimler Truck 2024技术发布回述2023试验](https://media.be.daimlertruck.com/fr/sur-rapide-et-simple--daimler-truck-et-linde-lancent-une-nouvelle-norme-pour-le-ravitaillement-en-hydrogene-liquide/)。

### 2024｜sLH₂加注与客户试用衔接

**从一次续航纪录转向重复补能和日常物流。** Daimler Truck与Linde公布过冷液氢加注技术，并在Wörth开设公共sLH₂站；五辆GenH2于2024年7月开始客户测试。液氢技术的工程问题从罐体本身扩展到站端转运、预冷、加注连接与停车蒸发管理。该批车辆仍为试验原型，不能标成大规模量产销售。

来源：[Daimler Truck 2024年报](https://www.daimlertruck.com/fileadmin/user_upload/documents/investors/reports/annual-reports/2024/daimler-truck-ir-annual-report-2024-incl-combined-management-report-dth-ag.pdf)；[2025试验总结确认启动月份](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162)。

### 2025｜大型地面设施与车队给出运行结果

**验证对象扩大到真实供液链和客户车队。** NASA于2025-07-25公布新液氢球罐地面系统流动测试完成，检验两座储罐向移动发射平台供液的能力。Daimler Truck于同年9月报告五辆试验车累计超过225,000 km，285次加注约15 t液氢；不同应用平均总质量16–34 t，耗氢5.6–8 kg/100 km。两个场景分别验证航天地面供液与物流运行，不合并为液氢发电装机。

来源：[NASA 2025测试公告](https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/)；[Daimler Truck原始测试总结](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162)。

### 2026｜85 kg新车型公布，小批量交付仍是计划

**下一步重点是把试验经验转成可重复制造和服务的产品。** 2026-01-26发布的NextGenH2规格为双液氢罐合计最多85 kg，按企业发布的sLH₂流程约10–15 min加注；计划2026年底开始100辆小批量客户投放。截至本底稿日期，年末投放仍属于计划，不能提前写为已交付。其101 kWh缓冲电池是另一储能部件，不与85 kg液氢合并为同一个“电池容量”。

来源：[Daimler Truck 2026原始发布](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597)。

## 二 材料

### hydrogen-liquid-vessel｜低温内胆与真空外壳

液氢罐通过双层结构把承液内胆与环境分离，支撑件既要承重又要减少导热。低温韧性、焊缝、热收缩与连接结构决定反复冷却和加热的耐久。低压液氢的压力水平不等于完全没有压力管理，蒸发造成的增压仍需阀门、控制和气体去向。

来源：[DOE 固定式和散装储氢](https://www.energy.gov/cmei/fuels/site-and-bulk-hydrogen-storage)；[NASA 2017储罐论文](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)。

### hydrogen-liquid-insulation｜多层绝热、珍珠岩与玻璃微球

真空减少气体导热，多层反射结构抑制辐射，填充绝热适用于不同规模与结构。2015年玻璃微球试验给出的46%是特定替代方案相对原先的蒸发损失减少，不能转成统一日蒸发率。容器越大，表面积/体积关系越有利，但穿壁管道、支撑和装卸热输入仍可能重要。

来源：[NASA 绝热与主动制冷说明](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/)。

### hydrogen-liquid-conversion｜液化循环与正仲氢转化

氢在降温过程中的正氢—仲氢组成需要调整；若留下大量室温平衡正氢，后续转化释放的热会促进蒸发。DOE Record 9013给出的历史评估：从300 K、1.01 bar开始，包含仲氢转化的液化理论最小功约3.9 kWh/kg，报告当时典型实际液化耗电约10–13 kWh/kg。两者差距来自压缩、换热和制冷不可逆性；该旧报告不能当成2026年每座新工厂实测规格。

来源：[DOE Record 9013](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/9013_energy_requirements_for_hydrogen_gas_compression.pdf)。

### hydrogen-liquid-transfer｜低温泵、换热器与蒸发气管理

转运管线与阀门必须预冷，加注过程中进入的热量会形成额外气体。蒸发气可以回收、使用、再液化或受控排放，具体策略取决于用氢频率和规模。主动零蒸发方案以外部冷源抵消漏热；运输车辆则需兼顾停车时间、可用库存和站点周转，不能把航天地面罐方案直接视为移动产品。

来源：[NASA IRAS试验](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)；[Daimler Truck 2026蒸发气管理说明](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597)。

## 三 论文

| 原始研究/技术报告 | 核心数值和条件 | 贡献 | 不能外推的范围 |
|---|---|---|---|
| DOE Record 9013，历史液化能耗评估 | 300 K、1.01 bar起点；含正仲转化理论约3.9 kWh/kg；当时典型实际10–13 kWh/kg | 把燃料能量与液化投入分开 | 不是2026年新建装置保证值，不含全部制氢及发电链 |
| NASA IRAS，2017 | 125,000 L；20 K制冷量390 W；三种控制策略 | 大型液氢罐主动抑制蒸发 | 390 W为冷量而非电耗；零蒸发不等于零能源输入 |
| NASA现场绝热试验，2015结果/2018技术发布 | 玻璃微球相对传统方案减少蒸发损失最多46% | 证明绝热材料对损耗的影响 | 相对降幅，不是46%往返效率或统一蒸发率 |
| Daimler Truck客户试验，2025 | 五原型车、>225,000 km、16–34 t平均总质量、5.6–8 kg/100 km | 检验车、站与物流的协同 | 整车工况，不是储罐材料性质和电站效率 |

来源见各历史节点；前两项为原始技术报告/论文，后两项为机构及制造商试验披露。

## 四 企业

液化设备、真空绝热储罐、液氢海运和移动加注是不同产业环节。Kawasaki的示范船体现海运链，Daimler Truck/Linde体现车站协同，NASA是研究和航天运行机构。独立企业资料展示集团规模时应和液氢业务分开，订单、原型、试用与小批量计划分别保留。

## 五 政策市场

中国2022年氢能中长期规划将低温液氢列入储运技术发展方向，不能据此宣布已形成全国液氢储能装机。液氢的需求包括航天、工业配送和交通燃料；只有含制氢、库存调度和用氢发电的明确边界，才构成电—氢—电储能系统。国际海运示范的货罐m³与液化工厂t/day也不是同一类产能。

来源：[国家氢能规划原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/P020220323314396580505.pdf)；[DOE物理储氢](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage)。

## 六 储能适配

| 场景 | 价值 | 代价 | 必需指标 |
|---|---|---|---|
| 大宗氢配送与航运 | 提高体积密度，降低对极高储存压力的依赖 | 液化耗电、装卸漏热、蒸发气 | 实装kg、罐m³、损耗时间窗、液化kWh/kg |
| 长距离重载交通 | 容量与补能时间可满足部分高强度任务 | 站点、低温设备、停车持液管理 | 载荷、耗氢、加注流程、停车条件 |
| 航天地面设施 | 可集中储存并在短时间提供大量推进剂 | 大流量供液、发射周转、持续漏热 | 有效罐容、供液能力、验证状态 |
| 长时电储能 | 氢库存可与发电装置功率分开配置 | 液化和维冷进一步增加链条耗能 | 电解+液化+储存+发电的全链净电效率 |

液氢的低位热值仍是约33.3 kWh/kg；液化改变体积密度，不提高每千克氢的化学热值。库存保持能力与能量效率是两个问题：即使主动零蒸发保持住全部氢，也必须计算制冷用电。
