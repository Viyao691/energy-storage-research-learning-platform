# 液态空气储能

核查日2026-10-03；路线 `liquid-air`。空气液化后在低压绝热罐保存，释能时泵升压、吸热气化并膨胀发电；属于热力储能，不是地下高压气体储存。

## 一 历史

### 1977｜液态空气用于电力储存的原始研究
E. M. Smith发表Storage of Electrical Energy Using Supercritical Liquid Air，1977年6月首次出版。作为本页可追溯起点，不把19世纪液化空气或液空发动机直接写成电网储能电站。来源：https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02

### 2008｜Slough试验按子系统开始建设
Morgan等原始论文记载项目2008年启动，先建放电部分、之后加入液化器；早期放电使用槽车运来的液氮，随后才用现场液化空气。这个顺序解释了为什么“成功发电”不一定已完成充放电闭环。来源：https://www.sciencedirect.com/science/article/pii/S0306261914008009 ，作者公开稿 https://cris.brighton.ac.uk/ws/portalfiles/portal/5530179/Liquid_air_energy_storage_Analysis_and_first_results_from_a_pilot_scale_demonstration_plant.pdf.pdf

### 2013｜实际膨胀损失进入循环比较
Ameel等比较液空朗肯循环与组合循环，在300 K废热边界下给出36.8%与43.3%的计算效率。关键在等温膨胀程度和真实膨胀机损失，结果是模型，不是商业站实测。来源：https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910 ，DOI https://doi.org/10.1016/j.applthermaleng.2012.11.037

### 2015｜试验结果发表，大学研究设施开放
Morgan等发表于Applied Energy 137卷，报告冷量回收及运行试验；伯明翰大学同期开放低温储能研究设施，迁入Highview的350 kW/2.5 MWh试验装置。前者是论文出版年，后者是研究设施节点，不强定为最初并网年。来源：Morgan上述论文；https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf

### 2018｜5 MW/15 MWh电网级示范启用
2018-06-05，Highview与Viridor在Pilsworth启用示范设施，英国政府支持超过800万英镑。厂站与垃圾填埋气场址关联，为余热耦合与电网服务提供平台；3小时来自容量/功率额定比，不是所有液空的固定时长。来源：https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/

### 2022｜Carrington获得新一轮支持
Highview 2026年1月FAQ回顾2022年获得1000万英镑政府拨款及增长资本。记录为融资支持，不是电站投产、营业收入或电量交付。来源：https://highviewpower.com/wp-content/uploads/2026/01/FAQ-updtd-3.pdf

### 2024｜商业规模项目融资落实
2024年融资3亿英镑支持Carrington，设计50 MW/300 MWh、6小时。新闻原文将输出写作“50 MW per hour”，量纲不当；页面应规范为输出功率50 MW、持续6小时。原文“early2026 operational”为当时目标。来源：https://highviewpower.com/news-announcements/uk-infrastructure-bank-centrica-partners-invest-300m-in-highview-power-clean-energy-storage-programme-to-boost-uks-energy-security-2/

### 2025｜Carrington举行正式破土仪式
2025-11-21官方破土消息重申50 MW/300 MWh，并增加电网稳定性设施说明。明确建设状态，不把融资及破土合称“商运”。来源：https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/

### 2026｜长时储能支持进入项目遴选
Ofgem 2026-06-26发布首轮cap-and-floor拟选择项目进展，属于支持机制程序。Highview现项目页仍称Carrington在建，2026起的一期是stability island；不能据旧工期宣称完整300 MWh液空部分已商业运行。来源：https://www.ofgem.gov.uk/press-release/ofgem-boosts-long-duration-storage-secure-more-homegrown-energy-customers ; https://highviewpower.com/projects/

## 二 材料与关键部件

### 液态空气与绝热罐
液空作为工质及储能介质，低压罐降低对特定地质条件的依赖。罐体保冷决定蒸发与待机损失；实际循环是热力系统，不能只把液体体积转换成固定MWh。空气组分、压力与运行条件改变液化行为。来源：Morgan2015原始论文。

### 空气液化器与低温换热器
充电阶段把电力投入压缩和制冷。Morgan研究采用Claude循环思路，把冷涡轮膨胀与节流结合；换热温差、压降和液化产率共同影响耗电。试验先放电后补液化器的过程说明，购买液氮进行放电测试不等于测过整站电到电效率。

### 冷量与热量储存
释能时液空气化释放冷量，可储存并回用于下一次液化；压缩热或外来余热可用于提高膨胀前温度。与LNG冷能、工业废热耦合时必须披露外部能量输入。带外源热冷的高效率不宜与独立系统直接排序。来源：Morgan2015及Ameel2013。

### 低温泵、膨胀机与发电系统
液态工质先泵升压再加热，可利用液相压缩特性；膨胀机把热力势转为电。Ameel研究显示理想等温过程与真实膨胀机的差距显著，不能引用理想循环效率描述商用设备。电网稳定模块和液空能量移时模块功能不同，Carrington现阶段尤其要分开标注。

## 三 论文

| 原始研究 | 明确结果与意义 | 条件 |
|---|---|---|
| Smith，1977；DOI 10.1243/PIME_PROC_1977_191_035_02 | 为电力储存提出超临界液空循环 | 历史概念论文，本次不推定实建装置 |
| Ameel等，2013；DOI 10.1016/j.applthermaleng.2012.11.037 | 朗肯36.8%、组合43.3% | 废热300 K、热力模型，循环及真实膨胀机假设相关 |
| Morgan等，2015；DOI 10.1016/j.apenergy.2014.07.109 | 原型验证冷回收并做模拟STOR服务试验；到达负荷设定值100 s | 10天试验中的表3响应值，非所有系统保证100 s；原文还区分模型与试验 |
| 2024，Evaluating economic feasibility… | 混合整数线性规划比较美国和欧洲市场配置 | 技术经济模拟；电价与服务假设决定收益，不给通用回本年限；https://www.sciencedirect.com/science/article/pii/S0360544224012970 |

## 四 企业与工程

Highview—Slough早期开发、Pilsworth示范与Carrington在建；Viridor—Pilsworth场址及开发合作；伯明翰大学—低温储能研究平台；Centrica及英国基础设施银行—2024融资参与者。融资参与者不等于液化设备制造商。Hunterston当前为分期开发，官网明确2027计划先提供稳定服务、之后发展储能；不能把最初2.5 GWh愿景视为当前已运行液空容量。企业资料/图片由Luna补齐。

## 五 政策市场

英国2024年决定引入长时储能cap-and-floor收入机制，2025年4月8日开启首轮申请，2026年6月进入拟选择阶段。资格通过、拟支持、最终授予及电站投运是不同状态。来源：https://www.gov.uk/government/publications/long-duration-electricity-storage-technical-details-of-the-scheme-and-its-operation ; https://www.ofgem.gov.uk/decision/long-duration-electricity-storage-ldes-window-1-eligibility-assessment-outcome ; 上述2026公告。

本批没有可靠的全球液空已投运总GWh统计。页面可显示Pilsworth5 MW/15 MWh与Carrington在建设计50 MW/300 MWh，但分别标注年份和状态。中国新型储能图为全技术行业背景。

## 六 储能适配

适合具备工业设备空间、需要小时级移时且有热冷集成条件的站点；液化器、罐容量和发电单元可分别配置，减少对盐穴或高差地形的依赖。代价是多次热力转换、低温换热与待机保冷。工业余热/废冷能改善特定项目表现，但资源温度、时段和供应稳定性必须匹配。快速调频可由配套稳定模块承担，不能把该模块响应时间自动赋予冷态液空发电全流程。
