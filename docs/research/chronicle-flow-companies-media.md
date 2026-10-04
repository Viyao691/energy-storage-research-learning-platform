# 液流电池路线企业与媒体证据（核查日期：2026-10-03）

本底稿为液流电池四路线准备公司档案、历史节点和官方图片。规模和项目进度按各来源口径转述；订单、规划、已安装、并网、投运分别处理。未核到有日期和币种的可靠独立市值就不录。普通公开可访问图片不等于开放许可；资产均记录权利人和来源，供本地归属式研究展示，未获得外部发布许可。

## 公司档案

按 chronicle_mockup 的 CompanyProfile 结构保存，ID均带路线前缀。资料核查日期为2026-10-03。

{
  "vanadium-sumitomo": {
    "summary": "日本电线、电力设备和储能企业；北海道南早来风电配储项目采用全钒液流电池。",
    "country": "日本",
    "listing": "住友电工集团上市主体：东京证券交易所5802",
    "scale": "FY2025集团净销售额5.1102万亿日元（集团全业务，非液流电池收入）；北海道项目17MW/51MWh，2022年4月投运。",
    "asOf": "FY2025截至2026-03-31；项目2022-04",
    "sources": [
      {"label":"FY2025集团业绩","url":"https://sumitomoelectric.com/president/2026/05/202607"},
      {"label":"北海道项目","url":"https://sumitomoelectric.com/products/flow-batteries/case-studies/hokkaido-wind-integration"}
    ]
  },
  "vanadium-invinity": {
    "summary": "英国长时储能企业，开发钒液流电池系统。",
    "country": "英国",
    "listing": "伦敦AIM上市主体 Invinity Energy Systems plc，代码IES",
    "scale": "企业称系统在近100个站点、17国运行；累计在现场交付超过8GWh能量（不是装机容量）；Copwood项目20.7MWh，2025年12月现场设备已安装，项目页称待2026年接网运行。",
    "asOf": "公司资料与Copwood进度截至2026-10-03",
    "sources": [
      {"label":"公司介绍及规模自述","url":"https://invinity.com/uk/"},
      {"label":"Copwood项目和状态","url":"https://invinity.com/case-study-invinity-copwood-vfb-energy-hub/"}
    ]
  },
  "vanadium-rongke": {
    "summary": "中国液流储能系统集成企业大连融科；不以项目规模推定公司营收或市值。",
    "country": "中国",
    "listing": "未核到独立公开挂牌主体或独立市值",
    "scale": "中科院大连化物所称大连液流储能站一期100MW/400MWh由大连融科建造和集成；2022年9月底并网，报道当时称计划10月中旬投运。",
    "asOf": "2022-10-09报道",
    "sources": [
      {"label":"中科院大连化物所项目报道","url":"https://www.english.dicp.cas.cn/nc/202210/t20221009_321157.html"}
    ]
  },
  "iron-chromium-cesc": {
    "summary": "中国铁铬液流储能企业中海储能；兰考示范项目有政府来源报道。",
    "country": "中国",
    "listing": "未核到独立公开挂牌代码或独立市值",
    "scale": "国家科技传播中心报道兰考离网算电示范为2.5MW/15MWh铁铬液流系统，并记录2026年投运；这是项目证据，不等于公司规模化出货。",
    "asOf": "2026-07-21",
    "sources": [
      {"label":"国家科技传播中心项目报道","url":"https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html"}
    ]
  },
  "iron-chromium-imabattery": {
    "summary": "美国Bellevue储能技术研发企业，官网称其开发第二代铁铬复合液流电池。",
    "country": "美国",
    "listing": "未核到公开挂牌代码或独立市值",
    "scale": "公司自述2018年完成铁铬液流技术设计、原型制造和运行测试；未在官方来源找到商业项目容量。官网原型图片直链访问返回404，本轮不提供图。",
    "asOf": "公司历史信息；页面核查2026-10-03",
    "sources": [
      {"label":"公司简介","url":"https://imabattery.com/about-us"},
      {"label":"技术路线","url":"https://imabattery.com/technology"}
    ]
  },
  "zinc-bromine-junan": {
    "summary": "中国武汉湖北君安储能专注锌溴液流储能系统。",
    "country": "中国",
    "listing": "未核到独立公开挂牌或市值",
    "scale": "公司自述研发团队100余人、技术开发超过10年，并有研发检测组装基地及制造基地；产品页列250kW/1000kWh大规模系统规格，未视作第三方验收结果。",
    "asOf": "官网资料核查2026-10-03",
    "sources": [
      {"label":"公司简介和研发规模","url":"https://en.junanes.com/about/"},
      {"label":"250kW/1000kWh规格","url":"https://en.junanes.com/product/zinc-bromine-flow-battery-large-scale-energy-storage-system/"}
    ]
  },
  "zinc-bromine-redflow-history": {
    "summary": "澳大利亚锌溴液流电池企业Redflow的历史条目；仅作路线历史，不作为当前供应商。",
    "country": "澳大利亚",
    "listing": "曾于ASX以RFX交易；2025-08-28收市后除牌，2025-08-29退市",
    "scale": "ASX 2025公告索引包含清算和出售进度；退市后不应展示为在营企业或填入当前市值。",
    "asOf": "退市日期2025-08-28",
    "sources": [
      {"label":"ASX公司公告与除牌说明","url":"https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025"}
    ]
  },
  "organic-quino": {
    "summary": "美国创业公司，开发水系有机醌液流电池；醌活性物质溶解在水系电解液中。",
    "country": "美国",
    "listing": "未核到公开挂牌代码或独立市值",
    "scale": "公司2024-06-20称10kW/100kWh原型已启用，采用连续制造蒽醌活性材料；公司另称正进行MW级试点，不把规划示范项目列为已投运。",
    "asOf": "2024-06-20试点公告",
    "sources": [
      {"label":"100kWh试点公告","url":"https://quinoenergy.com/quino-energy-announces-100kwh-pilot-and-plans-for-global-expansion/"},
      {"label":"公司技术与MW级试点招聘页","url":"https://quinoenergy.com/battery-engineer/"}
    ]
  },
  "organic-cmblu": {
    "summary": "德国私营公司开发Organic SolidFlow；与溶解态醌电解液路线区分，固体储能材料与水系流动系统结合；公司称流动系统收集并活化储能材料。",
    "country": "德国",
    "listing": "未核到公开挂牌代码或独立市值",
    "scale": "2026-04-30公司披露Series C首关€50m、融资估值超过€1bn（不是公开市值）、员工250+且科学工程人员150+；Uniper 5GWh为框架协议，不代表交付。官网称德国Alzenau工厂当前产能1GWh、最大4GWh；美国工厂计划2029投产、希腊项目建设中并计划2027投产。2024年Mercedes 11MWh订单原计划H2 2025实现，订单稿本身不证明后续已投运。",
    "asOf": "公司资料核查2026-10-03；订单公告2024-03-21",
    "sources": [
      {"label":"2026 Series C、融资估值与员工规模","url":"https://www.cmblu.com/press-media/cmblu-surpasses-eu1b-unicorn-threshold-with-eu50m-initial-close-of-series-c-defining-baseload-infrastructure-for-ai-and-data-centers"}, {"label":"制造基地与产能","url":"https://www.cmblu.com/manufacturing"}, {"label":"系统概述","url":"https://www.cmblu.com/battery-system"}, {"label":"Mercedes订单","url":"https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy"}
    ]
  }
}

### CMBlu公司资料更新（2026-10-03核查）

公司2026-04-30新闻稿称Series C首关€50m，融资估值超过€1bn（该估值是私人融资披露，不是上市市值）；员工250+，其中科学工程人员150+。德国Alzenau工厂页面自报Live since 2024、当前产能1GWh、最大产能4GWh；美国工厂计划2029生产，希腊项目在建并计划2027生产。Uniper的5GWh为框架协议，不能写成订单交付。公司系统页列10kW/100kWh/75%效率，但没有测试工况；此数字不作为可比实测指标。

来源：[2026融资、估值和员工数](https://www.cmblu.com/press-media/cmblu-surpasses-eu1b-unicorn-threshold-with-eu50m-initial-close-of-series-c-defining-baseload-infrastructure-for-ai-and-data-centers)、[制造基地状态与产能](https://www.cmblu.com/manufacturing)、[系统规格](https://www.cmblu.com/battery-system)。

## 年表节点建议

| route | year | title / copy | subjects | evidence |
|---|---:|---|---|---|
| vanadium | 2022 | 大连液流储能站一期100MW/400MWh系统并网，由大连融科建造集成；2022年报道当时仍称计划随后投入运行。 | company:vanadium-rongke, material:vanadium-electrolyte | https://www.english.dicp.cas.cn/nc/202210/t20221009_321157.html |
| vanadium | 2022 | 住友电工北海道南早来17MW/51MWh全钒液流项目于2022年4月投运，用于风电并网。 | company:vanadium-sumitomo, material:vanadium-electrolyte | https://sumitomoelectric.com/products/flow-batteries/case-studies/hokkaido-wind-integration |
| vanadium | 2025 | Invinity Copwood 20.7MWh设备于2025年末已现场安装，项目页称待2026年接网运行；这是建设进度节点。 | company:vanadium-invinity, material:vanadium-electrolyte | https://invinity.com/case-study-invinity-copwood-vfb-energy-hub/ |
| iron-chromium | 2018 | IMA Battery称完成铁铬液流技术设计、原型制造和运行测试，属于公司研发自述。 | company:iron-chromium-imabattery, material:iron-chromium-electrolyte | https://imabattery.com/about-us |
| iron-chromium | 2026 | 兰考2.5MW/15MWh铁铬液流离网算电协同示范项目投运。 | company:iron-chromium-cesc, material:iron-chromium-electrolyte | https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html |
| zinc-bromine | 2025 | JUNAN公布250kW/1000kWh模块化锌溴液流产品规格；非第三方容量验收。 | company:zinc-bromine-junan, material:zinc-bromine | https://en.junanes.com/product/zinc-bromine-flow-battery-large-scale-energy-storage-system/ |
| zinc-bromine | 2025 | ASX确认Redflow于2025-08-28收市后除牌，并列有清算和出售进度；仅作为退市历史记录。 | company:zinc-bromine-redflow-history | https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025 |
| organic | 2024 | Quino称水系有机醌液流10kW/100kWh试点原型启用；醌活性物质溶于电解液。 | company:organic-quino, material:organic-quinone | https://quinoenergy.com/quino-energy-announces-100kwh-pilot-and-plans-for-global-expansion/ |
| organic | 2024 | CMBlu宣布Mercedes工厂订购11MWh Organic SolidFlow，原计划2025年下半年实现；订单新闻不证明后续投运。 | company:organic-cmblu, material:organic-solidflow | https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy |

## 政策边界

可复用国家发展改革委、国家能源局2025年原文截图，并将主题设为scene:flow-policy。发改能源〔2025〕1144号提及液流电池储能进一步商业化，是一般液流政策背景，没有在该句区分全钒、铁铬、锌溴或有机液流，也不是任何单项工程的认证。[原文页面](https://www.ndrc.gov.cn/xwdt/tzgg/202509/t20250912_1400427_ext.html)，2025-09-12发布。

## 图像来源和适用范围

资产记录见同目录chronicle-flow-assets.json。原图均保留权利人、原网页及用途限制；本地展示不等于取得公开发布授权。

- Sumitomo北海道图：官方案例页中的项目实景，适用于全钒项目背景。
- Invinity Copwood图：项目文章中的现场装机照，文章标注图片由Gamesa Electric提供；照片表明设备安装，不代表接网运营。
- 兰考铁铬两图：国家科技传播中心转载项目报道图片。一张有项目横幅，另一张是场地鸟瞰，不描述为电池产品照。
- JUNAN图：公司参访报道中的光储充示范项目参观照，适用于企业/项目背景，不验证容量。
- Quino图：公司水系有机醌100kWh试点报道所用实验人员与测试台照片，适用于试点背景。
- CMBlu图：公司订单新闻宣传拼图含系统渲染，应标官方宣传图，不标现场实拍。
- 本轮没有取得对应电解液或活性物的真实显微/结构原图。AI示意材料图请清楚标注“AI结构示意 · 非实测图”。建议subject：vanadium-sulfate、vanadium-mixed-acid、vanadium-membrane、vanadium-carbon；iron-chromium-electrolyte、iron-chromium-electrode、iron-chromium-membrane；zinc-bromine-zinc、zinc-bromine-bromine、zinc-bromine-electrolyte、zinc-bromine-membrane；organic-quinone、organic-solidflow。不要将项目照片作为材料图。


