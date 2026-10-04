# 锂离子 / 钠离子企业简介与规模底稿

核查日：2026-10-03。对象为正式主项目 frontend/lib/chronicle/lithium-sodium.ts 已有 8 个企业组。未修改实现代码。

## 六栏目最小接入方案

统一沿用 ChapterId：history、materials、papers、industry、market、storage，对应“历史、材料、论文、企业、政策市场、储能适配”。展厅和详解共用当前栏目状态，删除三幕 Act 到 Chapter 的映射及企业栏目下政策/市场的重复导航。历史、材料、企业保留各自二级选择；论文、储能适配各补一个摘要 Exhibit，不复制全文到首屏。

详解继承当前对象的背景图，正文层加稳定遮罩，正文建议 18px、辅助文字 14—15px。删除标题下方重复导读解释；图片来源和 AI 性质只在统一素材说明处标一次，不在标题、段首重复。保留证据数据字段；正文来源链接的移动/隐藏方式待用户回复后处理，不先删除。

企业字段只需简介、上市主体、财年规模、统计范围、市场信息入口、来源。CATL 两路线共用一份集团简介和财务数据，研究事件仍分别保留。无需新增接口、行情抓取服务或复杂企业模型。

## 数据边界

已补充五家上市主体带日期的 Yahoo Finance 历史市值快照，见文末新增表格。只使用数字与来源日期明确配对的值；没有适用独立上市市值的企业/项目仍留空，不以零表示。

股价不等于市值；A/H 股不同币种、类别股份和 ADR 不相加。以下营收均保留财年、货币和合并范围，不能做跨货币裸数字排名。2026-10-03 是资料核查日，不是行情日期。

## 1. lithium-sony｜Sony

- **简介正文：**Sony 是锂离子商业化历史的重要企业。其 1991 年商业化节点保留，但有关电池业务已于 2017-09-01 完成向村田转让。当前 Sony Group 是涵盖游戏、音乐、影视、电子与影像传感等业务的集团，不能将其当前规模描述成现有电池生产规模。
- **上市主体：**Sony Group Corporation；东京证券交易所 6758，日元（JPY）；美国 ADR 代码 SONY，美元（USD）。ADR 与日本普通股代表关联权益，不能重复计市值。
- **规模：**FY2025，截至 2026-03-31，持续经营业务销售额 **12,479.6 billion JPY，即 12.4796 万亿日元**。这是排除金融服务终止经营业务后的集团口径，不是电池营收。
- **推荐上屏：**“1991 商业化先驱”“FY2025 持续经营销售额 12.48 万亿日元”。在详情紧邻注明电池业务 2017 年转让。
- **市场入口：**[Sony 官方投资者关系（含 Stock Price）](https://www.sony.com/en/SonyInfo/IR/)；[官方证券代码 FAQ](https://www.sony.com/en/SonyInfo/IR/faq/stock_general.html)。
- **来源：**[FY2025 财报演示，2026-05-08](https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/25q4_sonypre.pdf)，第 2 页业绩概要及第 5 页分部表；[电池业务转让完成公告](https://www.sony.com/en/SonyInfo/News/Press/201709/17-077E/)。
- **证据状态：**官方财务报告、官方交易完成公告。不是当期电池产能证明。

## 2. lithium-byd｜BYD

- **简介正文：**比亚迪业务覆盖新能源汽车、手机部件及组装、二次充电电池与光伏等。编年史聚焦刀片电池和 LFP 结构工程；企业规模应与电池技术事件分开呈现。
- **上市主体：**比亚迪股份有限公司；深交所 002594.SZ，人民币（CNY）；港交所 01211.HK，港元（HKD），另有 81211.HK 人民币柜台。港币/人民币柜台不是两家企业。
- **规模：**2025 自然年，集团营业收入 **人民币 803,965 百万元，即 8039.65 亿元**。年报将汽车及相关产品与手机部件等业务分别列示；此总额不是弗迪电池独立营收。
- **推荐上屏：**“新能源汽车与电池集团”“2025 集团营收 8039.65 亿元”。
- **市场入口：**[官方投资者关系及 A/H 股信息](https://www.bydglobal.com/cn/investor-relations)。
- **来源：**[2025 年报，港交所披露 2026-03-27](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0327/2026032702970_c.pdf)；[公司简介](https://www.bydglobal.com/cn/about)。数字来自年报管理层讨论的叙述，不依赖财报宣传图片的未识别文字。
- **证据状态：**交易所披露年报及公司资料。不能将集团市值冠为“刀片电池市值”。

## 3. lithium-catl｜CATL / 神行

- **简介正文：**宁德时代面向动力与储能提供电池及相关技术服务。锂离子专题保留神行快充和制造节点；集团规模只作为产业背景。
- **上市主体：**宁德时代新能源科技股份有限公司；深交所 300750.SZ，人民币；港交所 **03750.HK**，港元。
- **规模：**2025 自然年集团营收约 **4237 亿元人民币**；全年锂离子电池销量 **661 GWh**。公司同时披露 2025 年产能 772 GWh、在建产能 321 GWh；首屏建议只取销量，避免产能与出货混用。
- **推荐上屏：**“动力与储能电池企业”“2025 锂电销量 661 GWh / 集团营收约 4237 亿元”。上述销量不属于神行单一产品。
- **市场入口：**[官方投资者关系](https://www.catl.com/inverelations/)；[港交所 CATL 公告入口](https://www1.hkexnews.hk/search/titlesearch.xhtml?category=0&lang=EN&market=SEHK&stockId=1000259940)。
- **来源：**[公司 2025 年报摘要，2026-03-10](https://www.catl.com/en/news/6773.html)；[官方香港上市公告](https://www.catl.com/en/news/6451.html)；[港交所股票代码 3750 文件](https://www.hkexnews.hk/listedco/listconews/sehk/2025/0804/2025080400805.pdf)。
- **证据注意：**公司英文年报新闻稿一处括号写成 0750.HK，与官方上市公告和交易所文件不一致；实现使用 **03750.HK**。营收来自企业正式年报摘要，销量是公司披露，不作独立审计之外的性能认证。

## 4. lithium-panasonic｜Panasonic

- **简介正文：**本路线的 4680 工厂事件主体是 Panasonic Energy；上市公司则是 Panasonic Holdings。介绍应区分电池经营公司与控股集团。
- **上市主体：**Panasonic Holdings Corporation；东京证券交易所 6752，日元。Panasonic Energy 不应单独填写公开股票市值。
- **规模：**FY3/26，即截至 2026-03-31 财年，Panasonic Group 销售额 **8.0487 万亿日元**。这是集团合并规模，不是 Panasonic Energy 电池收入。
- **推荐上屏：**“Panasonic Energy：车用及储能电池业务”“母集团 FY3/26 销售额 8.05 万亿日元”。展示 4680 时注明 2024-09-09 公告为量产准备节点。
- **市场入口：**[Panasonic Holdings 官方 IR，含 Stock Price / Ratings](https://holdings.panasonic/global/corporate/investors.html)。
- **来源：**[集团 FY3/26 业绩与战略概要](https://news.panasonic.com/global/stories/18722)，对应 2026-05-12 业绩说明；[交易所披露财报，确认 TSE:6752 及财年](https://links.sgx.com/FileOpen/260512%20FY326%20financial%20results.ashx?App=Announcement&FileID=889332)；[Panasonic Energy 4680 公告](https://news.panasonic.com/global/press/en240909-7)。
- **证据状态：**集团官方业绩说明；子公司技术事件。不可把母集团营收当作 4680 电芯业务营收。

## 5. sodium-hina｜中科海钠

- **简介正文：**中科海钠科技有限责任公司专注钠离子电池研发、材料和电芯制造及系统应用。已公开技术路线包括铜基层状氧化物正极与煤基无定形碳负极。
- **上市/市值：**本批官方来源未提供独立上市证券或可核验公开市值。前端不填股票代码与市值，也不借关联科研机构估值。
- **规模证据：**2023-02-24 官方回顾披露，2022 年布局千吨级正负极材料产线与 GWh 级电芯产线；这是带历史日期的产线级别，不是 2025/2026 年实际出货量。当前未获得公开、可比的最近财年合并营收。
- **推荐上屏：**“钠离子材料、电芯与系统企业”“GWh 级电芯产线（2022 年投产披露）”。若嫌历史口径复杂，可改用“潜江一期电芯供应方”并保留项目事实。
- **企业入口：**[官网](https://hinabattery.com/)。
- **来源：**[2023 产品发布及公司历史](https://hinabattery.com/en/index.php?id=63)；[2024 潜江一期项目](https://www.hinabattery.com/en/index.php?id=67)。
- **证据状态：**企业披露。成立于 2017 不等于当年量产；产线规模不等于年度营收或有效交付。

## 6. sodium-catl｜CATL / 长安

- **简介/上市/规模：**共用 lithium-catl 的 CATL 集团资料，不能建立第二份“钠离子 CATL 市值”。661 GWh 为集团锂电销量，**不得作为此钠离子产品销量**；此处建议只展示集团营收及“2026 车型合作发布”。
- **合作关系：**2026-02-05 CATL 与长安发布钠离子乘用车方案。现有栏目标签含长安，但本批规模字段主体为 CATL，不能让 UI 读成两家企业合并营收。
- **推荐上屏：**“CATL：钠离子电池；长安：整车合作”“2025 CATL 集团营收约 4237 亿元”。
- **进度边界：**2 月原文写预计年中上市；4 月 CATL 稿写 Naxtra 全面量产目标为 2026 年底。这些来源不能单独证明计划已全部完成。
- **来源：**[CATL / 长安发布](https://www.catl.com/en/news/6720.html)；[2026 技术日](https://www.catl.com/en/news/6811.html)；财务与上市来源共用上节。

## 7. sodium-datang-hina｜大唐 / HiNa

- **简介正文：**此项是潜江钠离子储能项目的业主/应用方与电芯供应方合作组，不是一家可直接估值的上市企业。大唐官方稿明确项目主体为大唐湖北能源开发有限公司；HiNa 提供钠离子电芯。
- **上市/市值：**该合作组及项目没有独立股票市值。本批未证明项目资产属于某个“大唐国际”“大唐新能源”等上市主体，不能把这些股票的市值挪用到项目。
- **规模：**2024-06-30 并网一期 **50 MW / 100 MWh**；总项目规划 **100 MW / 200 MWh**。用项目规模回答“体量”，不套用集团财务公司营收，也不拼接其他大唐上市公司的总收入。
- **推荐上屏：**“大唐湖北能源开发 / HiNa”“已并网一期 50 MW / 100 MWh（2024-06-30）”。
- **企业/项目入口：**[大唐官方项目报道](https://yn.china-cdt.com/dtwz/xwzx/jcdt/2025/1/I1331259414841131008.html)。
- **来源：**上述大唐 2025 年项目入选报道；[HiNa 并网公告](https://www.hinabattery.com/en/index.php?id=67)。
- **证据状态：**项目当事方官方披露；规模不等于年发电量或长期实际可用容量。

## 8. sodium-faradion｜Faradion / Reliance

- **简介正文：**Faradion 是英国钠离子电池技术企业，Reliance 通过新能源业务推进相关商业化；应分别标明技术子公司与印度多元化上市母集团。
- **上市主体：**Faradion 不单列公开市值；母公司资料入口为 Reliance Industries Limited，印度 NSE:RELIANCE / BSE:500325，印度卢比（INR）。不是美国金属服务企业 Reliance, Inc.（RS）。
- **规模：**Reliance FY2025-26，截至 2026-03-31，合并收入 **₹11,75,919 crore**，约 **11.75919 万亿印度卢比**。采用原年报 Value of Sales and Services / consolidated revenue 口径，不写成 Faradion 或电池业务收入。
- **历史交易：**2021-12-31 收购协议披露 Faradion 企业价值 £100 million，另拟投入 £25 million 成长资本。**收购企业价值不是当前股票市值**，也不是当前公司营收。
- **推荐上屏：**“英国钠离子技术 / 印度产业集团”“母集团 FY2025-26 收入 ₹11,75,919 crore”。详情再给历史收购资料，不把两种币种放在同一市值栏。
- **市场入口：**[Reliance 官方股票行情入口](https://www.ril.com/investors/shares)；[财报入口](https://www.ril.com/investors/financial-reporting)。
- **来源：**[2025-26 年报经营与财务回顾](https://www.ril.com/ar2025-26/financial-performance-and-review.html)；[官方股票信息文件](https://www.ril.com/sites/default/files/2024-08/shareholdersreferencer.pdf)；[Faradion 原始收购公告](https://www.ril.com/news-media/press-releases/reliance-new-energy-solar-acquire-faradion-limited)。
- **证据状态：**母集团年报与交易公告；没有本批核实的 Faradion 独立最近财年营收。

## 实现交接与一次验证范围

只在本页数据中映射以上八个 ID；CATL 财务配置复用，两路线文案分别注明锂电与钠电。所有规模必须带期间、货币、主体；没有市值快照就不显示数值市值卡，不从股价临时推算。历史交易的数值仍放历史事件里。

定向检查栏目切换与“进入详解/返回”状态同步、8 个企业 ID 能找到资料、CATL 两路线不误用 661 GWh、非上市/项目没有市值数值。由主任务统一执行一次既定构建/运行态检查，本资料整理不再启动测试、构建或重复审查。


## 市值数值补充：带日期的 Yahoo Finance 历史估值快照

更新核查日：2026-10-03。本节取代前版“全部没有可靠市值数值”的结论。行情提供方是 Yahoo Finance，数据性质为市场估值，不是技术论文证据或公司业绩。下面采用报价页 Statistics → Valuation Measures 中**紧邻 As of 日期的 Market Cap**，不把该日期套用给页顶另一个 Market Cap (intraday)。

本轮直接 open 美国站和地区站均返回 HTTP 429；日期与数字来自搜索工具实际返回的 Yahoo 原页面索引正文。故证据状态为“行情提供方页面索引中的有日期历史快照”，**未完成直连实时页面确认，不宣称为最新/今日/实时市值**。页面可以展示这些历史数值，须始终带 snapshotDate 和来源；如用户要求同日最新行情，应继续由运行态或可用报价接口核实，不能悄悄换成当前日期。

| 现有 companyId | 上市主体 / 报价代码 | 快照日期（来源 As of） | 原文值 | 可用中文显示 | 规范化原币数值 | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
| lithium-sony | Sony Group / 6758.T | 2026-09-18 | 21.61T JPY | 约 21.61 万亿日元 | 21610000000000 JPY | [Yahoo Sony](https://finance.yahoo.com/quote/6758.T/) |
| lithium-byd | BYD Company / 002594.SZ | 2026-08-31 | 717.45B CNY | 约 7174.5 亿元人民币 | 717450000000 CNY | [Yahoo BYD](https://finance.yahoo.com/quote/002594.SZ/) |
| lithium-catl、sodium-catl | CATL / 300750.SZ | 2026-09-23 | 1.42T CNY | 约 1.42 万亿元人民币 | 1420000000000 CNY | [Yahoo CATL](https://finance.yahoo.com/quote/300750.SZ/) |
| lithium-panasonic | Panasonic Holdings / 6752.T | 2026-06-29 | 10.26T JPY | 约 10.26 万亿日元 | 10260000000000 JPY | [Yahoo Panasonic 新加坡站](https://sg.finance.yahoo.com/quote/6752.T/) |
| sodium-faradion（仅母集团字段） | Reliance Industries / RELIANCE.NS | 2026-09-22 | 16.89T INR | 母集团约 16.89 万亿印度卢比 | 16890000000000 INR | [Yahoo Reliance](https://finance.yahoo.com/quote/RELIANCE.NS/) |

### 展示与计算边界

- 建议固定文案“市值快照 · 2026-09-23”，数字下紧邻“Yahoo Finance · CATL 上市主体”。不同日期、币种的市值不用于企业排行榜。
- BYD 与 CATL 使用各自 A 股报价页所给的**公司市值口径**。这是提供方计算值，本批未独立重算其多类别股份处理方式；不写成纯 A 股流通市值，不与 H 股页面的公司市值再相加。
- Sony 采用东京 6758.T 的 JPY 口径即可。另一个已检索候选是 SONY ADR 页面 2026-10-02 收盘所在快照的 139.236B USD（页面收盘价 23.82 USD，时间 16:00:02 EDT）；这是另一证券报价口径，**不能与本表的 JPY 数字合计**。[ADR 原页面](https://finance.yahoo.com/quote/SONY/?.tsrc=fin-srch&p=SONY)。若主任务决定统一采用该更近日期，替换显示而非增加第二份市值。
- Reliance 顶部 2026-10-01 行情的 Market Cap (intraday) 实际显示“--”；因此选用明确标注 2026-09-22 的 16.89T，而不是利用股价临时算一个“当前”值。
- Panasonic 当前检索可得日期较早，仍须显示 2026-06-29，不换成资料核查日期。Panasonic Energy 不单独拥有上述上市市值。
- HiNa、潜江项目合作组仍无适用的独立证券市值；Faradion 只在“母集团 Reliance”字段显示数值。£100 million 收购企业价值仍留在 2021 历史事件，不移入市值栏。
- CATL 页顶检索出现 1.347T CNY，但正文未明示该字段的完整交易日期，所以本表选 2026-09-23 / 1.42T 的明确配对。不得把搜索抓取日、假期推测的最后交易日与 1.347T 自动绑定。

本批只补研究资料，未修改源码、运行测试或构建。

