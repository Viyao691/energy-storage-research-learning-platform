export type CompanyProfile = { summary: string; country?: string; listing?: string; scale?: string; asOf?: string; marketCap?: { value: number; display: string; date: string; currency: string; issuer: string; source: string }; sources: readonly { label: string; url: string }[] };
const catl: CompanyProfile={summary:"中国动力与储能电池企业，A股300750、H股03750。",country:"中国",listing:"深交所300750 / 港交所03750",scale:"2025集团营收约4237亿元人民币",asOf:"2025自然年",sources:[{label:"CATL投资者关系",url:"https://www.catl.com/inverelations/"}]};
export const companyProfiles: Record<string, CompanyProfile> = {
 "lithium-catl":catl,"sodium-catl":{...catl,summary:catl.summary+"本项为CATL电池与长安整车合作。"},
 "lithium-sony":{summary:"日本Sony于1991年推动锂离子商业化；电池业务2017年转让村田，现集团主营游戏、内容、电子及影像传感。",country:"日本",listing:"东京6758 / 美国ADR SONY",scale:"FY2025持续经营集团销售额12.4796万亿日元，非电池营收",asOf:"截至2026-03-31财年",sources:[{label:"Sony电池业务转让",url:"https://www.sony.com/en/SonyInfo/News/Press/201709/17-077E/"},{label:"Sony FY2025财报",url:"https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/25q4_sonypre.pdf"}]},
 "lithium-byd":{summary:"中国新能源汽车与电池集团，业务还包括手机部件及组装、光伏等；A股002594、H股01211。",country:"中国",listing:"深交所002594 / 港交所01211",scale:"2025集团营收8039.65亿元人民币，非弗迪电池独立收入",asOf:"2025自然年",sources:[{label:"比亚迪2025年报",url:"https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0327/2026032702970_c.pdf"}]},
 "lithium-panasonic":{summary:"日本Panasonic Energy经营车用及储能电池；上市母公司为Panasonic Holdings（东京6752）。",country:"日本",listing:"母集团东京6752",scale:"母集团FY3/26销售额8.0487万亿日元，非电池业务收入",asOf:"截至2026-03-31财年",sources:[{label:"Panasonic集团业绩",url:"https://news.panasonic.com/global/stories/18722"}]},
 "sodium-hina":{summary:"中国中科海钠专注钠离子材料、电芯制造及系统应用，采用铜基层状氧化物与无定形碳路线。",country:"中国",scale:"GWh级电芯产线（2022年投产披露）",asOf:"2023-02-24公开回顾",sources:[{label:"HiNa公司与产品资料",url:"https://hinabattery.com/en/index.php?id=63"}]},
 "sodium-datang-hina":{summary:"中国大唐湖北能源开发与中科海钠的项目合作组：前者为应用方，HiNa供应电芯；合作组不单列股票市值。",country:"中国",scale:"潜江并网一期50MW/100MWh；总规划100MW/200MWh",asOf:"2024-06-30一期并网",sources:[{label:"HiNa并网公告",url:"https://www.hinabattery.com/en/index.php?id=67"}]},
 "sodium-faradion":{summary:"英国Faradion研发钠离子电池，印度Reliance通过新能源业务推进商业化；上市主体为多元化母集团Reliance。",country:"英国 / 印度",listing:"母集团NSE RELIANCE / BSE500325",scale:"母集团FY2025-26合并收入₹11,75,919 crore，非Faradion营收",asOf:"截至2026-03-31财年",sources:[{label:"Reliance年报",url:"https://www.ril.com/ar2025-26/financial-performance-and-review.html"}]}
};

const marketSnapshots: Record<string, NonNullable<CompanyProfile["marketCap"]>> = {
 "lithium-sony": { value: 21610000000000, display: "约21.61万亿日元", date: "2026-09-18", currency: "JPY", issuer: "Sony Group", source: "https://finance.yahoo.com/quote/6758.T/" },
 "lithium-byd": { value: 717450000000, display: "约7174.5亿元人民币", date: "2026-08-31", currency: "CNY", issuer: "BYD Company", source: "https://finance.yahoo.com/quote/002594.SZ/" },
 "lithium-catl": { value: 1420000000000, display: "约1.42万亿元人民币", date: "2026-09-23", currency: "CNY", issuer: "CATL上市主体", source: "https://finance.yahoo.com/quote/300750.SZ/" },
 "lithium-panasonic": { value: 10260000000000, display: "约10.26万亿日元", date: "2026-06-29", currency: "JPY", issuer: "Panasonic Holdings母集团", source: "https://sg.finance.yahoo.com/quote/6752.T/" },
 "sodium-faradion": { value: 16890000000000, display: "母集团约16.89万亿印度卢比", date: "2026-09-22", currency: "INR", issuer: "Reliance Industries母集团", source: "https://finance.yahoo.com/quote/RELIANCE.NS/" }
};
marketSnapshots["sodium-catl"] = marketSnapshots["lithium-catl"];
for (const [id, marketCap] of Object.entries(marketSnapshots)) companyProfiles[id].marketCap = marketCap;

// Solid company profiles from dated research sources.
Object.assign(companyProfiles, {
  "quantumscape": {
    "summary": "美国固态锂金属电池开发企业，研究固态分隔膜、电芯与制造工艺。",
    "country": "美国",
    "listing": "QuantumScape Corporation · NASDAQ Global Select Market QS",
    "scale": "仍处于固态锂金属电池开发和产线验证阶段；公司2025年年报与2026年Q2业务更新跟踪Cobra工艺、QSE-5样品和Eagle Line，不应视作大规模量产。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "2025 Form 10-K / FY2025 filing, 2026-02-25",
        "url": "https://ir.quantumscape.com/static-files/26bac171-b3b6-425d-8b9e-bf2c7d0d4040"
      },
      {
        "label": "Q2 2026 business and financial results, 2026-07-22",
        "url": "https://ir.quantumscape.com/news-releases/news-release-details/quantumscape-reports-second-quarter-2026-business-and-financial"
      },
      {
        "label": "行情：Yahoo Finance QS quote, 2026-10-02 close; USD 2.811B intraday market cap",
        "url": "https://finance.yahoo.com/quote/QS/"
      }
    ],
    "marketCap": {
      "value": 2811000000,
      "display": "约28.11亿美元",
      "date": "2026-10-02",
      "currency": "USD",
      "issuer": "QuantumScape Corporation",
      "source": "https://finance.yahoo.com/quote/QS/"
    }
  },
  "solid-power": {
    "summary": "美国固态电池技术与硫化物电解质企业，开展材料供给与中试开发。",
    "country": "美国",
    "listing": "Solid Power, Inc. · NASDAQ SLDP",
    "scale": "2026年上半年收入及补助收入合计2.8百万美元；2026Q2单季为-0.3百万美元（累计调整影响）。截至2026-06-30流动性4.193亿美元、无债务融资，显示其仍是开发/试产阶段技术公司。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "Q2 2026 results, 2026-08-04; revenue, liquidity and pilot-line status",
        "url": "https://ir.solidpowerbattery.com/investor-relations/financials/quarterly-results/default.aspx"
      },
      {
        "label": "NASDAQ-listed company stock information; quote page",
        "url": "https://ir.solidpowerbattery.com/investor-relations/stock-info/default.aspx"
      },
      {
        "label": "行情：Yahoo Finance SLDP quote, 2026-10-02 close; USD 531.662M intraday market cap",
        "url": "https://finance.yahoo.com/quote/SLDP/"
      }
    ],
    "marketCap": {
      "value": 531662000,
      "display": "约5.31662亿美元",
      "date": "2026-10-02",
      "currency": "USD",
      "issuer": "Solid Power, Inc.",
      "source": "https://finance.yahoo.com/quote/SLDP/"
    }
  },
  "powerco": {
    "summary": "德国大众汽车集团电池子公司，建设电芯工厂并推进制造与技术合作。",
    "country": "德国（大众汽车集团子公司）",
    "listing": "PowerCo SE · 非独立上市；大众集团年报称其为集团子公司",
    "scale": "大众集团2025年报称Salzgitter首座电芯工厂于2025年开始运行并交付首批验证电芯；Valencia和加拿大St. Thomas仍建设中。 公司招聘官网列示Salzgitter目标年产能40 GWh、三地规划合计最高200 GWh；这是设计/规划产能，不是实际年出货。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "Volkswagen Group Annual Report 2025, PowerCo subsidiary and plant status, published 2026-03-10",
        "url": "https://annualreport2025.volkswagen-group.com/sustainability-report/environmental-information/climate-change.html"
      },
      {
        "label": "PowerCo company/careers overview; factory target capacities",
        "url": "https://careers.powerco.de/content/Professionals/?locale=en_US"
      }
    ]
  },
  "bmw": {
    "summary": "德国汽车集团，经营汽车与摩托车业务，并开展固态电芯实车验证。",
    "country": "德国",
    "listing": "Bayerische Motoren Werke AG · Xetra BMW.DE",
    "scale": "2025财年集团收入€133.453bn，年末员工154,540人；2025年汽车交付约2.46m辆。这里的体量是BMW集团，不是固态电池业务收入。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "BMW Group Report 2025, released 2026-03-12",
        "url": "https://www.bmwgroup.com/en/report/2025/financial-statements/income-statement/index.html"
      },
      {
        "label": "BMW Group 2025 key facts, deliveries and workforce",
        "url": "https://www.bmwgroup.com/en/report/2025/management-report/index.html"
      },
      {
        "label": "行情：Yahoo Finance BMW.DE quote, XETRA EUR, 2026-10-02 close; intraday market cap EUR 32.515B",
        "url": "https://finance.yahoo.com/quote/BMW.DE/"
      }
    ],
    "marketCap": {
      "value": 32515000000,
      "display": "约325.15亿欧元",
      "date": "2026-10-02",
      "currency": "EUR",
      "issuer": "Bayerische Motoren Werke AG",
      "source": "https://finance.yahoo.com/quote/BMW.DE/"
    }
  },
  "sk-on": {
    "summary": "韩国电池企业，2021年由SK Innovation分拆设立，开发车用电池与固态技术。",
    "country": "韩国",
    "listing": "SK On（SK Innovation于2021年分拆设立的电池公司，后续与集团关联公司合并）；本身无独立股票代码 · 非独立上市",
    "scale": "SK Innovation 2025四季业绩材料所列Battery分部收入合计约KRW 6.978tn（四季值相加）；这是集团分部口径，材料明确合并财务与SK On merged entity实际业绩不同。 该材料列2025年Battery分部各季营业亏损；不将SK Innovation全公司收入或市值写成SK On自身数据。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "SK Innovation 2025 Q4 earnings presentation; battery segment quarterly data, KRW billion",
        "url": "https://www.skinnovation.com/ir/earning/272?fileType=callFile"
      },
      {
        "label": "SK Innovation official company history: SK On spun off in 2021 and later mergers",
        "url": "https://www.skinnovation.com/company/history.asp"
      },
      {
        "label": "SK Innovation consolidated income statement, FY2025; parent-company financials only",
        "url": "https://www.skinnovation.com/ir/income_statement"
      }
    ]
  },
  "toyota": {
    "summary": "日本汽车集团，开展全固态电池研发，并与合作方推进电解质供给和制造。",
    "country": "日本",
    "listing": "Toyota Motor Corporation · Tokyo Stock Exchange 7203.T",
    "scale": "FY2026（截至2026-03-31）合并销售收入¥48.0367tn。 Toyota截至2026-06-30普通股发行数14,594,987,460股；此数为发行股数，非扣除库存股后的流通股数。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "FY2026 financial summary, released 2026-05-08",
        "url": "https://global.toyota/pages/global_toyota/ir/financial-results/2026_4q_summary_en.pdf"
      },
      {
        "label": "Toyota official stock overview; share capital and listings, updated through 2026-06-30",
        "url": "https://global.toyota/en/ir/stock/outline/"
      },
      {
        "label": "行情：Yahoo Finance 7203.T, Tokyo JPY; page showed 2026-09-18 close and market cap JPY 35.822T",
        "url": "https://sg.finance.yahoo.com/quote/7203.T/"
      }
    ],
    "marketCap": {
      "value": 35822000000000,
      "display": "约35.822万亿日元",
      "date": "2026-09-18",
      "currency": "JPY",
      "issuer": "Toyota Motor Corporation",
      "source": "https://sg.finance.yahoo.com/quote/7203.T/"
    }
  },
  "samsung-sdi": {
    "summary": "韩国Samsung SDI经营二次电池与电子材料，开发车用、储能及固态电池技术。",
    "country": "韩国",
    "listing": "Samsung SDI Co., Ltd. · KOSPI 006400.KS",
    "scale": "2025财年收入KRW 13.27tn、营业亏损KRW 1.72tn；2025Q4电池业务收入KRW 3.62tn、营业亏损KRW 338.5bn。公司披露与BMW合作推进全固态电池验证，整体财务规模不等于固态业务收入。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "2025 Q4 and full-year results, 2026-02-02; revenue, operating loss and battery segment",
        "url": "https://www.samsungsdi.com/sdi-now/sdi-news/4702.html"
      },
      {
        "label": "Yahoo Finance 006400.KS quote; 2026-09-23 close, KOSPI-listed entity, market cap snapshot",
        "url": "https://finance.yahoo.com/quote/006400.KS/"
      }
    ],
    "marketCap": {
      "value": 40999000000000,
      "display": "约40.999万亿韩元",
      "date": "2026-09-23",
      "currency": "KRW",
      "issuer": "Samsung SDI Co., Ltd.",
      "source": "https://finance.yahoo.com/quote/006400.KS/"
    }
  },
  "prologium": {
    "summary": "中国台湾ProLogium开发固态电池，并推进电芯制造和法国工厂项目。",
    "country": "中国台湾",
    "listing": "ProLogium Technology Co., Ltd. · 截至2026-10-03仍为拟通过与Translational Development Acquisition Corp.业务合并上市；公司标示预计2026年下半年交割并待监管及股东批准，无已完成挂牌股票代码",
    "scale": "公司2026-05投资者材料称累计出货2.4M+电池单元、截至2025年底获批及申请专利1,000+；Taoyuan产能0.5 GWh/年为公司列示现有生产能力，Dunkirk 4 GWh/年仍在建设。 2026-05交易材料提出约USD 3.8bn pre-money enterprise value，这是拟议合并交易估值，不是公开市场市值。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "ProLogium investors page; transaction status and expected close subject to approval, checked 2026-10-03",
        "url": "https://prologium.com/investors/"
      },
      {
        "label": "Investor Presentation, 2026-05-27; shipments, capacities and proposed transaction valuation",
        "url": "https://prologium.com/wp-content/uploads/2026/05/ProLogium-Investor-Presentation-05.27.26-vFinal.pdf"
      },
      {
        "label": "SEC-filed business-combination materials, transaction valuation and conditions",
        "url": "https://www.sec.gov/Archives/edgar/data/2137754/000119312526344562/d11069df4a.htm"
      }
    ]
  },
  "welion": {
    "summary": "中国卫蓝新能源开展固态及混合固液电池研发，产品面向动力和储能应用。",
    "country": "中国",
    "listing": "北京卫蓝新能源科技股份有限公司 · 未查询到独立公开挂牌股票代码；非上市公司，无公开市场市值",
    "scale": "公司官网称2016年成立，主营固态锂离子电池，属中科院物理所孵化企业；其自述360 Wh/kg动力电芯于2023年底量产并交付蔚来，280 Ah储能电芯于2023年下半年量产交付，供应三峡、海博思创及国电投项目。上述均为企业官网口径，未等同于第三方审计销量。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "WeLion official company profile and typical cell products; company-reported deliveries",
        "url": "https://www.welion.tech/zh/about-us/"
      }
    ]
  },
  "qingtao": {
    "summary": "中国清陶能源开展固态电池技术与电芯制造，推进材料、电芯及车辆应用。",
    "country": "中国",
    "listing": "清陶（昆山）能源发展集团股份有限公司及关联业务主体 · 未查询到独立公开挂牌股票代码；上汽为战略投资方，不以其市值代表清陶",
    "scale": "上汽官方披露2025年12月搭载清陶自研锰基复合半固态电池的MG4车型开启交付；这是有车型交付的产业化证据，不代表全固态电池或电站级成熟度。 未在所引官方材料中找到清陶独立年营收、员工总数或独立市值披露，故不填数。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "SAIC strategic investment in Qingtao, 2023-05-31; ownership relationship described as strategic investment",
        "url": "https://www.saicmotor.com/chinese/xwzx/xwk/2023/58658.shtml"
      },
      {
        "label": "SAIC official report on MG4 Qingtao semi-solid cell deliveries, 2026-02-24",
        "url": "https://www.saicmotor.com/m/xwzx/mtbd/2026/63842.shtml"
      }
    ]
  },
  "ganfeng": {
    "summary": "中国赣锋锂业经营锂资源、材料及电池业务；固态研究由相关电池业务主体开展。",
    "country": "中国",
    "listing": "赣锋锂业集团股份有限公司 · 深圳证券交易所及香港联合交易所 002460.SZ / 01772.HK",
    "scale": "2025年报（2026-04-30发布）披露集团营业收入RMB 22.798bn；锂电池业务分部对外收入RMB 8.536bn。前者是上市集团整体，后者为其电池业务分部，不能据此推定为全固态电池收入。",
    "asOf": "资料核查 2026-10-03",
    "sources": [
      {
        "label": "Ganfeng Lithium 2025 Annual Report, released 2026-04-30",
        "url": "https://www.ganfenglithium.com/ir_detail_en/id/2867.html"
      },
      {
        "label": "Official listing identifiers: A-share 002460 and H-share 01772",
        "url": "https://www.ganfenglithium.com/ir.html"
      },
      {
        "label": "Yahoo Finance 002460.SZ quote and statistics; CNY market cap snapshot as of 2026-09-22",
        "url": "https://finance.yahoo.com/quote/002460.SZ/"
      }
    ],
    "marketCap": {
      "value": 88610000000,
      "display": "约886.1亿元人民币",
      "date": "2026-09-22",
      "currency": "CNY",
      "issuer": "赣锋锂业集团股份有限公司",
      "source": "https://finance.yahoo.com/quote/002460.SZ/"
    }
  }
});

// Flow-route company records with original disclosure scope.
Object.assign(companyProfiles, {
  "vanadium-sumitomo": {
    "summary": "日本电线、电力设备和储能企业；北海道南早来风电配储项目采用全钒液流电池。",
    "country": "日本",
    "listing": "住友电工集团上市主体：东京证券交易所5802",
    "scale": "FY2025集团净销售额5.1102万亿日元（截至2026-03-31，集团全业务）；北海道17MW/51MWh项目2022年4月投运。",
    "asOf": "FY2025截至2026-03-31；项目2022-04",
    "sources": [
      {
        "label": "FY2025集团业绩",
        "url": "https://sumitomoelectric.com/president/2026/05/202607"
      },
      {
        "label": "北海道项目",
        "url": "https://sumitomoelectric.com/products/flow-batteries/case-studies/hokkaido-wind-integration"
      }
    ]
  },
  "vanadium-invinity": {
    "summary": "英国长时储能企业，开发钒液流电池系统。",
    "country": "英国",
    "listing": "伦敦AIM上市主体 Invinity Energy Systems plc，代码IES",
    "scale": "近100运行站点、17国；累计现场输出能量超过8GWh（公司自报，非装机容量）；Copwood20.7MWh设备2025年末安装，待2026接网。",
    "asOf": "公司资料与Copwood进度截至2026-10-03",
    "sources": [
      {
        "label": "公司介绍及规模自述",
        "url": "https://invinity.com/uk/"
      },
      {
        "label": "Copwood项目和状态",
        "url": "https://invinity.com/case-study-invinity-copwood-vfb-energy-hub/"
      }
    ]
  },
  "vanadium-rongke": {
    "summary": "中国全钒液流储能系统集成企业大连融科，大连一期项目建造与集成方。",
    "country": "中国",
    "listing": "独立上市主体信息未公开。",
    "scale": "大连一期100MW/400MWh，2022年9月底并网；2022年10月9日报道当时列随后投运计划。",
    "asOf": "2022-10-09报道",
    "sources": [
      {
        "label": "中科院大连化物所项目报道",
        "url": "https://www.english.dicp.cas.cn/nc/202210/t20221009_321157.html"
      }
    ]
  },
  "iron-chromium-cesc": {
    "summary": "中国铁铬液流储能企业中海储能；兰考示范项目有政府来源报道。",
    "country": "中国",
    "listing": "独立上市主体信息未公开。",
    "scale": "兰考2.5MW/15MWh铁铬液流离网算电示范；政府2026年7月报道投运成功。",
    "asOf": "2026-07-21",
    "sources": [
      {
        "label": "国家科技传播中心项目报道",
        "url": "https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html"
      }
    ]
  },
  "iron-chromium-imabattery": {
    "summary": "美国Bellevue储能技术研发企业，官网称其开发第二代铁铬复合液流电池。",
    "country": "美国",
    "listing": "独立上市主体信息未公开。",
    "scale": "2018年完成铁铬原型设计、制造与运行测试（公司披露）。",
    "asOf": "公司历史信息；页面核查2026-10-03",
    "sources": [
      {
        "label": "公司简介",
        "url": "https://imabattery.com/about-us"
      },
      {
        "label": "技术路线",
        "url": "https://imabattery.com/technology"
      }
    ]
  },
  "zinc-bromine-junan": {
    "summary": "中国武汉湖北君安储能专注锌溴液流储能系统。",
    "country": "中国",
    "listing": "独立上市主体信息未公开。",
    "scale": "研发团队100余人、研发超过10年（公司自报）；产品规格250kW/1000kWh。",
    "asOf": "官网资料核查2026-10-03",
    "sources": [
      {
        "label": "公司简介和研发规模",
        "url": "https://en.junanes.com/about/"
      },
      {
        "label": "250kW/1000kWh规格",
        "url": "https://en.junanes.com/product/zinc-bromine-flow-battery-large-scale-energy-storage-system/"
      }
    ]
  },
  "zinc-bromine-redflow-history": {
    "summary": "澳大利亚锌溴液流企业Redflow的历史档案。",
    "country": "澳大利亚",
    "listing": "原ASX:RFX；2025-08-28收市后除牌，2025-08-29退市。",
    "scale": "2024申报材料披露2MWh长期运行系统与20MWh供货计划；2025公告记录清算及出售进度。",
    "asOf": "退市日期2025-08-28",
    "sources": [
      {
        "label": "ASX公司公告与除牌说明",
        "url": "https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025"
      }
    ]
  },
  "organic-quino": {
    "summary": "美国创业公司，开发水系有机醌液流电池；醌活性物质溶解在水系电解液中。",
    "country": "美国",
    "listing": "独立上市主体信息未公开。",
    "scale": "公司2024-06-20公告10kW/100kWh水系醌原型启用；MW级试点按后续建设阶段记录。",
    "asOf": "2024-06-20试点公告",
    "sources": [
      {
        "label": "100kWh试点公告",
        "url": "https://quinoenergy.com/quino-energy-announces-100kwh-pilot-and-plans-for-global-expansion/"
      },
      {
        "label": "公司技术与MW级试点招聘页",
        "url": "https://quinoenergy.com/battery-engineer/"
      }
    ]
  },
  "organic-cmblu": {
    "summary": "德国Organic SolidFlow开发企业，采用固体储能材料与水系流动系统。",
    "country": "德国",
    "listing": "独立上市主体信息未公开。",
    "scale": "2026-04首关融资€50m、估值>€1bn（私人融资）；员工250余人；Alzenau自报现有产能1GWh；Uniper至少5GWh条件框架。",
    "asOf": "公司资料核查2026-10-03；订单公告2024-03-21",
    "sources": [
      {
        "label": "2026 Series C、融资估值与员工规模",
        "url": "https://www.cmblu.com/press-media/cmblu-surpasses-eu1b-unicorn-threshold-with-eu50m-initial-close-of-series-c-defining-baseload-infrastructure-for-ai-and-data-centers"
      },
      {
        "label": "制造基地与产能",
        "url": "https://www.cmblu.com/manufacturing"
      },
      {
        "label": "系统概述",
        "url": "https://www.cmblu.com/battery-system"
      },
      {
        "label": "Mercedes订单",
        "url": "https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy"
      }
    ]
  }
});

companyProfiles["vanadium-sumitomo"].marketCap = {value:7786969000000,display:"约7.787万亿日元",date:"2026-10-02",currency:"JPY",issuer:"住友电工集团（全业务）",source:"https://finance.yahoo.co.jp/quote/5802.T"};
companyProfiles["vanadium-invinity"].marketCap = {value:123870000,display:"1.2387亿英镑",date:"2026-09-11",currency:"GBP",issuer:"Invinity Energy Systems plc",source:"https://www.londonstockexchange.com/stock/IES/invinity-energy-systems-plc/company-page?lang=en"};

// Mechanical-route original company disclosures.
Object.assign(companyProfiles,{
  "pumped-hydro-edf": {
    "summary": "法国公营电力公司EDF运营抽水蓄能与水电资产；Grand’Maison为抽水-发电混合电站。",
    "country": "法国",
    "listing": "EDF自2023-06-08由法国政府持有全部股本并从Euronext Paris退市；无公开市场市值。",
    "scale": "Grand’Maison于1985–1987分批投运，装机1,800MW；上水库可存水1.4亿m³，下水库1,500万m³。数据为电站规模，不代表储能效率或可用MWh。",
    "asOf": "项目资料核查2026-10-03；股权状态自2023-06-08",
    "sources": [
      {
        "label": "EDF Grand’Maison电站资料",
        "url": "https://www.edf.fr/groupe-edf/agir-en-entreprise-responsable/fondation-et-mecenat-patrimoine-sport/site-edf-grand-maison-hydrelec/amenagement-de-grand-maison"
      },
      {
        "label": "EDF退市及法国政府持股公告",
        "url": "https://www.edf.fr/en/the-edf-group/dedicated-sections/journalists/all-press-releases/implementation-of-the-squeeze-out-procedure-in-respect-of-the-equity-securities-of-edf"
      }
    ]
  },
  "pumped-hydro-drax": {
    "summary": "英国Drax Group运营发电、能源供应及水电资产；苏格兰Cruachan为山体洞室内的可逆式抽水蓄能电站。",
    "country": "英国",
    "listing": "Drax Group plc，伦敦证券交易所上市。",
    "scale": "Cruachan现有机组装机440MW，4台可逆机组，约30秒可达满出力，最高可连续发电超过16小时（公司介绍）；2024年公布升级计划拟增至480MW、另有600MW Cruachan 2开发，不作为已投运容量。",
    "asOf": "Cruachan页面更新至2026-04；升级信息来自2024公告",
    "sources": [
      {
        "label": "Cruachan电站与现役规模",
        "url": "https://www.drax.com/uk/what-we-do/cruachan-power-station/"
      },
      {
        "label": "Drax Cruachan升级公告，2024-04-29",
        "url": "https://www.drax.com/press_release/draxs-iconic-cruachan-hollow-mountain-power-station-set-for-80-million-upgrade/"
      },
      {
        "label": "Drax网站使用条款",
        "url": "https://www.drax.com/terms-of-use/"
      }
    ]
  },
  "pumped-hydro-state-grid": {
    "summary": "国家电网旗下国网新源建设运营抽水蓄能电站；河北丰宁为大型纯抽水蓄能项目。",
    "country": "中国",
    "listing": "国网新源为国家电网体系项目开发运营主体，非独立公开上市公司。",
    "scale": "丰宁12台机组共3.6GW，最后一台变速机组于2024-12-31投入商业运行，完成全容量投产。当地政府报告的年设计发电量66.12亿kWh、年设计抽水耗电量87.16亿kWh为设计指标，非当年实测值。",
    "asOf": "全容量商业运行日期2024-12-31；运行统计发布2025-09-17",
    "sources": [
      {
        "label": "丰宁县政府全容量并网公告，运营主体及设计规模",
        "url": "https://www.fengning.gov.cn/art/2025/1/2/art_4511_1040263.html"
      },
      {
        "label": "丰宁县清洁能源发展中心项目运行信息，2025-09-17",
        "url": "https://www.fengning.gov.cn/art/2025/9/17/art_4511_1083354.html"
      }
    ]
  },
  "caes-adiabatic-hydrostor": {
    "summary": "加拿大长时储能开发商，开发和运营以压缩空气、水和热管理为核心的先进压缩空气储能（A-CAES）。",
    "country": "加拿大",
    "listing": "Hydrostor Inc.为非上市私营公司，由机构投资者支持，无独立公开市值。",
    "scale": "Goderich于2019年投运，放电1.75MW、充电2.2MW、容量超过10MWh；合同容量7MWh。Silver City 200MW/1,600MWh仍为开发项目。",
    "asOf": "2026-10-03",
    "sources": [
      {
        "label": "公司与投资者",
        "url": "https://hydrostor.ca/our-company/"
      },
      {
        "label": "Goderich状态与数据",
        "url": "https://hydrostor.ca/project/the-goderich-a-caes-facility/"
      },
      {
        "label": "Silver City项目公告",
        "url": "https://hydrostor.ca/hydrostor-acquires-100-ownership-of-the-silver-city-energy-storage-centre/"
      }
    ]
  },
  "caes-adiabatic-iet-cas": {
    "summary": "中国科学院工程热物理研究所研发张家口先进压缩空气储能示范项目；属于科研机构，不是上市公司。",
    "country": "中国",
    "listing": "中科院下属非上市研究机构，无独立市值。",
    "scale": "张家口项目于2022-09-30并网并具备商业运行条件，100MW/400MWh；采用人工储气装置并回收压缩热，降低常规CAES燃气复热依赖。",
    "asOf": "项目并网公告2022-09-30；网页收录2024-10-31",
    "sources": [
      {
        "label": "CAS项目说明",
        "url": "https://english.cas.cn/Special_Reports/rd/2022/202410/t20241031_693356.shtml"
      },
      {
        "label": "CAS中文报道",
        "url": "https://www.cas.cn/cm/202210/t20221001_4849738.shtml"
      }
    ]
  },
  "caes-conventional-uniper": {
    "summary": "德国Uniper运营Huntorf压缩空气储能电站；盐穴储气，放电时天然气复热，属于传统补燃CAES。",
    "country": "德国",
    "listing": "Uniper SE在法兰克福上市，德国联邦政府于2022年救助后成为控股股东。",
    "scale": "Huntorf自1978年投运；Uniper当前页面列321MW、两座盐穴，满功率启动约12分钟。",
    "asOf": "2026-10-03",
    "sources": [
      {
        "label": "Uniper Huntorf设施",
        "url": "https://www.uniper.energy/about-uniper/projects/energy-transformation-hub-northwest"
      },
      {
        "label": "Uniper储能与投运信息",
        "url": "https://www.uniper.energy/energy-storage-uniper"
      },
      {
        "label": "EWE与Uniper合作说明",
        "url": "https://www.ewe.com/en/media-center/press-releases/2021/04/ewe-and-uniper-plan-to-build-hydrogen-hub-at-huntorf-site-ewe-ag"
      }
    ]
  },
  "caes-conventional-powersouth": {
    "summary": "美国PowerSouth Energy Cooperative为成员制发电与输电合作社，拥有并运营阿拉巴马州McIntosh CAES机组。",
    "country": "美国",
    "listing": "非上市电力合作社，无公开股票市值。",
    "scale": "McIntosh CAES于1991年投运，发电功率110MW、设计最长放电约26小时；不与同址燃气机组总装机混为一谈。",
    "asOf": "2026-10-03",
    "sources": [
      {
        "label": "成员合作社McIntosh设施说明",
        "url": "https://www.gcec.com/about-us/our-cooperative/power-generation/"
      },
      {
        "label": "阿拉巴马州2025运行许可公告",
        "url": "https://adem.alabama.gov/sites/default/files/2025-06/06-25psmcintosh.html"
      }
    ]
  },
  "liquid-air-highview": {
    "summary": "英国Highview Power开发液态空气储能（LAES）：液化空气储存，放电时加压升温并膨胀驱动透平。",
    "country": "英国",
    "listing": "非上市公司；Carrington融资方包括英国国家财富基金与Centrica，不代表Highview公开市值。",
    "scale": "Carrington于2025-11-21开工，设计50MW/300MWh，仍在建设。Pilsworth 5MW/15MWh于2018年发布为电网级示范；旧公告不证明其今天仍运行。",
    "asOf": "Carrington公告2025-11-21；Pilsworth公告2018-06-05",
    "sources": [
      {
        "label": "Carrington项目状态",
        "url": "https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/"
      },
      {
        "label": "Pilsworth示范公告",
        "url": "https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/"
      },
      {
        "label": "融资方与项目容量",
        "url": "https://www.centrica.com/media-centre/news/2024/centrica-invests-in-renewable-energy-storage-capabilities/"
      }
    ]
  },
  "liquid-air-birmingham": {
    "summary": "伯明翰大学低温储能研究团队曾与Highview合作验证LAES试验系统；是科研平台而非商业电站。",
    "country": "英国",
    "listing": "公立研究型大学，无上市主体或市值。",
    "scale": "Highview 350kW/2.5MWh试验装置曾从Slough搬至伯明翰继续研究；不推断其目前仍持续运行。",
    "asOf": "搬迁计划公告2014-12-11",
    "sources": [
      {
        "label": "伯明翰大学搬迁与试验装置",
        "url": "https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage"
      },
      {
        "label": "LAES试验研究目录",
        "url": "https://research.birmingham.ac.uk/en/publications/performance-analysis-and-detailed-experimental-results-of-the-fir/"
      }
    ]
  },
  "flywheel-beacon": {
    "summary": "美国Beacon Power提供高速飞轮储能，Stephentown设施为NYISO提供频率调节。",
    "country": "美国",
    "listing": "Beacon Power, LLC为私营企业；RGA Investments于2018年收购，无独立公开市值。",
    "scale": "Stephentown20MW/5MWh、200台飞轮，2011商业运行；40MW为充放双向调节范围。",
    "asOf": "2026-10-03；收购公告2018-05-01",
    "sources": [
      {
        "label": "Stephentown设施数据",
        "url": "https://beaconpower.com/stephentown-new-york/"
      },
      {
        "label": "Beacon公司历史",
        "url": "https://beaconpower.com/history/"
      },
      {
        "label": "RGA收购公告",
        "url": "https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/"
      }
    ]
  },
  "flywheel-amber": {
    "summary": "美国Amber Kinetics设计制造钢制飞轮系统，在菲律宾设有制造厂，面向电网、微网和孤岛供电部署。",
    "country": "美国研发总部；菲律宾制造",
    "listing": "非上市公司，无可核实独立市值。",
    "scale": "公司披露两座菲律宾工厂年产能可达4,000台；2025年与Indian Energy完成美国首个地上集装箱式系统调试并获UL现场认证。年产能不是实际出货。",
    "asOf": "产能页面核查2026-10-03；调试公告2025-08-06",
    "sources": [
      {
        "label": "公司与工厂",
        "url": "https://amberkinetics.com/company/"
      },
      {
        "label": "安装组合",
        "url": "https://amberkinetics.com/installations/"
      },
      {
        "label": "美国系统调试公告",
        "url": "https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/"
      }
    ]
  },
  "gravity-energy-vault": {
    "summary": "美国Energy Vault为上市储能技术公司，业务含重力、电池和绿色氢能储能，项目按具体技术分类。",
    "country": "美国",
    "listing": "Energy Vault Holdings, Inc.在NYSE以NRGV交易。",
    "scale": "如东EVx设计25MW/100MWh；2023-12电网互联，2024-05首组充放电单元测试与系统调试。商业运行审批与长期性能另行核对。",
    "asOf": "测试公告2024-05-07；项目页核查2026-10-03",
    "sources": [
      {
        "label": "如东EVx项目数据与状态",
        "url": "https://www.energyvault.com/projects/rudong"
      },
      {
        "label": "测试及调试公告",
        "url": "https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx"
      }
    ]
  },
  "gravity-cnty": {
    "summary": "中国天楹（CNTY）为如东EVx重力项目本地投资和建设合作方之一，主营还包括环保与固废处理。",
    "country": "中国",
    "listing": "深交所上市，代码000035。",
    "scale": "如东EVx设计25MW/100MWh，2024-05首组充放电单元测试；与Energy Vault、Atlas Renewable合作。",
    "asOf": "项目测试公告2024-05-07",
    "sources": [
      {
        "label": "Energy Vault公告及项目合作方",
        "url": "https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx"
      }
    ]
  },
  "gravity-gravitricity": {
    "summary": "英国Gravitricity开发以深竖井升降重物储能的方案；商业矿井项目与地上概念演示分开记。",
    "country": "英国",
    "listing": "非上市公司，无公开市值。",
    "scale": "Leith于2021年完成250kW并网演示，使用两只各25吨重物和15米高试验架；4–8MW是公司当时规划的商业项目规模，不是已建容量。",
    "asOf": "演示公告2021-04-22",
    "sources": [
      {
        "label": "Leith演示数据",
        "url": "https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/"
      },
      {
        "label": "项目状态列表",
        "url": "https://gravitricity.com/projects/"
      }
    ]
  },
  "gravity-ares": {
    "summary": "美国ARES North America开发轨道式GravityLine，电机驱动质量车爬坡储能、下坡发电。",
    "country": "美国",
    "listing": "私营公司，无公开市场市值。",
    "scale": "Pahrump示范项目仍在开发，页面标示规划5MW、约20英亩；单组质量车720,000磅。",
    "asOf": "项目页面核查2026-10-03",
    "sources": [
      {
        "label": "ARES项目状态与运行方式",
        "url": "https://aresnorthamerica.com/nevada-project/"
      },
      {
        "label": "ARES主页",
        "url": "https://aresnorthamerica.com/"
      }
    ]
  }
});

// Thermal-route original company disclosures.
Object.assign(companyProfiles, {
  "thermal-sensible-rondo": {
    "summary": "美国工业热储能开发商，以电加热耐火砖并经电阻元件储热，向工厂连续供蒸汽。",
    "country": "美国",
    "listing": "私营企业；无公开股票代码",
    "scale": "100MWh_th商业运行；公司称储热>1000°C、连续供蒸汽",
    "asOf": "公司公告 2025-10-16",
    "sources": [
      {
        "label": "Rondo官方商业运行公告，2025-10-16",
        "url": "https://www.rondo.com/news-press/rondo-powers-up-worlds-largest-industrial-heat-battery"
      }
    ]
  },
  "thermal-sensible-antora": {
    "summary": "美国工业热与电力储能开发商，利用电加热固体碳块储热，热可直接供工业使用，也可通过热光伏模块转为电力。",
    "country": "美国",
    "listing": "私营企业；无公开股票代码",
    "scale": "Wellhead全尺度模块运行；碳块储热>1800°C，容量/功率未披露",
    "asOf": "公司公告 2023-09-12",
    "sources": [
      {
        "label": "Antora官方系统发布公告，2023-09-12",
        "url": "https://www.antora.com/insights/system-launch"
      }
    ]
  },
  "thermal-latent-mga": {
    "summary": "澳大利亚MGA Thermal开发Miscibility Gap Alloy热储能模块，利用合金材料相变储存潜热，并与蒸汽系统集成。",
    "country": "澳大利亚",
    "listing": "私营公司；无公开股票代码",
    "scale": "Tomago：5MWh_th，充0.5MW_e/放0.5MW_th，365°C蒸汽、设计10h",
    "asOf": "公司项目页核查 2026-10-03；项目开始运行 2025-04",
    "sources": [
      {
        "label": "MGA Thermal示范项目规格与状态",
        "url": "https://mgathermal.com/flagship-projects/mga-demonstration-plant"
      },
      {
        "label": "MGA Thermal关于潜热与约3700个MGA块的说明",
        "url": "https://mgathermal.com/newsroom-posts/mga-thermal-achieves-world-first-latent-heat-leap----unlocking-24-7-renewable-industrial-steam"
      }
    ]
  },
  "thermal-latent-sunamp": {
    "summary": "英国私营热储能企业Sunamp以Plentigrade相变材料为Thermino等建筑热水和供热产品储热。",
    "country": "英国",
    "listing": "私营企业；无公开股票代码",
    "scale": "P58约58°C相变；Latham峰值2198W对3107W，企业报降约29%",
    "asOf": "产品手册版本 2025-10-13；案例页核查 2026-10-03（案例日期未注明）",
    "sources": [
      {
        "label": "Thermino P58安装手册：相变原理、58°C转变点",
        "url": "https://installation.sunamp.com/thermino/north-america-us-ca/thermino/installation-user-manuals/d0063-thermino-p58-installation-and-user-instructions-manual~7615907194365528871?format=show_external_document"
      },
      {
        "label": "Sunamp Latham办公楼案例与监测数据",
        "url": "https://sunamp.com/en-ca/case-studies/sunamp-thermal-batteries-reduce-peak-load-in-a-new-york-office-building-a-nyserda-program/"
      }
    ]
  },
  "thermal-thermochemical-saltx": {
    "summary": "瑞典SaltX Technology Holding开发纳米涂层盐热化学储能，也经营石灰和水泥行业电气化技术；公司上市于Nasdaq First North Premier Growth Market。",
    "country": "瑞典",
    "listing": "Nasdaq First North Premier Growth Market（SaltX Technology Holding AB）",
    "scale": "Bollmora2021—2022试验；反应器换热系数为Berlin的3—5倍",
    "asOf": "公司试点总结 2022-10-26；上市关系核查 2026-10-03",
    "sources": [
      {
        "label": "SaltX Bollmora试点结项公告，2022-10-26",
        "url": "https://www.saltxtechnology.com/cision/final-report-for-the-pilot-plant-in-bollmora-completed-with-good-results/"
      },
      {
        "label": "SaltX官方Q1 2020报告：纳米涂层盐热化学储能原理",
        "url": "https://www.saltxtechnology.com/files/SALTX-Q1-2020-ENG-spreads.pdf"
      }
    ]
  },
  "thermal-thermochemical-cache": {
    "summary": "美国私营公司Cache Energy研发可运输模块化热化学储能，为工业过程提供高温热。",
    "country": "美国",
    "listing": "私营企业；无公开股票代码",
    "scale": "2026Duke循环演示/Whirlpool试点；最高1000°F（约538°C），MW/MWh未披露",
    "asOf": "公司公告 2026-03-05、2026-05-04",
    "sources": [
      {
        "label": "Duke Energy Mt. Holly示范公告，2026-03-05",
        "url": "https://www.cache-energy.com/insights/cache-energy-demonstrates-rapid-modular-thermochemical-storage-at-duke-energys-mt-holly-facility"
      },
      {
        "label": "Whirlpool工厂部署公告，2026-05-04",
        "url": "https://www.cache-energy.com/insights/cache-deploys-electrified-heat-and-thermal-energy-storage-unit-at-whirlpool-ohio-facility"
      }
    ]
  },
  "thermal-thermochemical-tempo": {
    "summary": "美国私营开发商Tempo与UC San Diego、EPRI等合作，计划示范混合金属氧化物热化学储能。",
    "country": "美国",
    "listing": "私营项目合作方；无公开股票代码",
    "scale": "UCSD2024—2028早期项目；目标20MWh_th、4h充热、100kW发电24h以上",
    "asOf": "UC San Diego项目页核查 2026-10-03",
    "sources": [
      {
        "label": "UC San Diego与Tempo热化学储能项目（CEC资助）",
        "url": "https://www.energystorage.ucsd.edu/projects/demonstrating-tempo-thermochemical-energy-storage-at-uc-san-diego"
      }
    ]
  }
});

Object.assign(companyProfiles, {
  "hydrogen-gas-nrel-hitrf": {
    "country": "美国",
    "summary": "NREL研究设施，集成制氢、压缩、缓冲储气与加注设备，用于基础设施性能验证。",
    "listing": "美国国家实验室项目；不适用上市/市值。",
    "scale": "线性活塞压缩机：415→900 bar，480 kg/day；隔膜压缩机：20→930 bar，60 kg/h。",
    "asOf": "NREL设备说明，页面当前访问于2026-10-03",
    "sources": [
      {
        "label": "NREL HITRF",
        "url": "https://www.nrel.gov/hydrogen/hitrf-animation?print="
      },
      {
        "label": "DOE Hydrogen Storage",
        "url": "https://www.energy.gov/cmei/fuels/hydrogen-storage"
      }
    ]
  },
  "hydrogen-gas-hexagon-lincoln": {
    "country": "美国",
    "summary": "Lincoln Composites是DOE历史项目承研方，当时为Hexagon Composites集团成员，本项记录2011年前后的压力容器开发。",
    "listing": "历史项目单位",
    "scale": "DOE报告记载3,600 psi压力容器完成资格测试；2012年项目报告描述约8,500 L水容积设计和ISO框架方案，属于当年开发目标。",
    "asOf": "DOE FY2011 / FY2012报告",
    "sources": [
      {
        "label": "DOE FY2011 review",
        "url": "https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/review11/pd021_baldwin_2011_o.pdf"
      },
      {
        "label": "DOE FY2012 report",
        "url": "https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/progress12/iii_6_knudsen_2012.pdf"
      }
    ]
  },
  "hydrogen-liquid-nasa-ksc": {
    "country": "美国",
    "summary": "NASA肯尼迪航天中心为Artemis发射系统管理低温推进剂基础设施；LC-39B球罐是航天推进剂储罐案例。",
    "listing": "美国联邦机构；不适用上市/市值。",
    "scale": "新球罐83英尺直径、1.25百万美制加仑可用LH₂；2025年完成供液验证测试。",
    "asOf": "测试报道2025-07-25；参考指南2026版",
    "sources": [
      {
        "label": "NASA LH2 tank testing",
        "url": "https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/"
      },
      {
        "label": "NASA Artemis II reference guide",
        "url": "https://www.nasa.gov/wp-content/uploads/2026/01/a2-reference-guide-012825.pdf"
      }
    ]
  },
  "hydrogen-liquid-genh2-doe": {
    "country": "美国",
    "summary": "CB&I、Shell、GenH2、NASA Marshall及休斯敦大学合作研究大型液氢储罐；GenH2为项目技术参与方。",
    "listing": "GenH2为私营技术企业；公司称其为Philomaxcap AG子公司。",
    "scale": "项目完成最高100,000 m³级大型LH₂储罐概念设计；实际验证采用NASA Marshall场地的小型示范罐。",
    "asOf": "项目公告2025-04-15",
    "sources": [
      {
        "label": "GenH2/CB&I/Shell announcement",
        "url": "https://genh2.com/press-release/liquid-hydrogen-storage-tank-first-commercial-scale-design-demonstrated-by-cbi-and-shell/"
      },
      {
        "label": "GenH2 DOE selection",
        "url": "https://genh2.com/press-release/shell-led-consortium-selected-by-doe/"
      }
    ]
  },
  "hydrogen-solid-gkn-nrel": {
    "country": "美国/德国合作项目",
    "summary": "GKN Hydrogen、NREL和SoCalGas合作，在NREL Flatirons园区示范金属氢化物储氢系统；金属与氢反应形成氢化物，放氢需要供热。",
    "listing": "GKN Hydrogen非上市项目合作方。",
    "scale": "最多500 kg H₂，两个20英尺ISO箱；与1.25 MW PEM电解槽和1 MW PEM燃料电池组成集成验证链。；2024年报道时已commissioned，正在验证性能与应用工况。",
    "asOf": "NREL报道2024-11-14",
    "sources": [
      {
        "label": "NREL HEVHY METAL",
        "url": "https://www.nrel.gov/news/program/2024/heavy-metal-debut-a-world-class-metal-hydride-system.html"
      },
      {
        "label": "DOE ARIES technical transcript",
        "url": "https://www.energy.gov/cmei/fuels/july-h2iq-hour-aries-flatirons-campus-mw-scale-hydrogen-system-research-text-version"
      }
    ]
  },
  "hydrogen-carrier-hydrogenious": {
    "country": "德国",
    "summary": "Hydrogenious LOHC Technologies开发以苄基甲苯为载体的液态有机储氢与放氢系统，成立于2013年。",
    "listing": "私营公司；公司2024资料称员工超过230人。",
    "scale": "Erlangen站自2022-07运行；释放能力9,000 kg H₂/year、地下储存1.5 t H₂；ReleaseBox 10约1 kg/h。",
    "asOf": "项目页当前数据；员工数据来自2024资料",
    "sources": [
      {
        "label": "Erlangen H2Sektor",
        "url": "https://hydrogenious.net/how/hrs-erlangen/"
      },
      {
        "label": "Hydrogenious 2024 company press information",
        "url": "https://hydrogenious.net/wp-content/uploads/240216_Press_Information_IPCEI_GHBD_Hydrogenious_LOHC_EN.pdf"
      }
    ]
  },
  "hydrogen-carrier-syzygy-lotte": {
    "country": "美国/韩国联合示范",
    "summary": "Syzygy Plasmonics提供电驱氨裂解反应器，Lotte Chemical提供Ulsan测试现场，Sumitomo提供物流支持；氨作为氢载体后需裂解释放氢。",
    "listing": "Syzygy为私营企业；LOTTE Chemical为韩国上市公司。",
    "scale": "2024-12现场性能测试；新闻稿披露最佳试验点为290 kg H₂/day、99%转化率、81%能效、11 kWh/kg-H₂。后续商业化计划。",
    "asOf": "公司新闻稿2025-01-27",
    "sources": [
      {
        "label": "Syzygy company-issued press release",
        "url": "https://www.prnewswire.com/news-releases/syzygy-plasmonics-and-lotte-chemical-unlock-ammonia-as-a-hydrogen-carrier-in-asia-successfully-complete-trial-of-ammonia-e-cracking-unit-302360343.html"
      },
      {
        "label": "LOTTE 2022 collaboration announcement",
        "url": "https://www.lottechem.com/en/media/news/609/view.do"
      }
    ]
  },
  "hydrogen-gas-enric": {
    "country": "中国",
    "summary": "中集安瑞科控股有限公司制造高压氢气储运装备，也经营液氢储运设备；其披露覆盖管束集装箱、球罐及车载IV型瓶。",
    "listing": "中集安瑞科控股有限公司，香港主板3899.HK；隶属中集集团。",
    "scale": "集团口径：2025年收入人民币263.26亿元、归母净利润11.35亿元；业务跨多个能源装备板块，不代表氢储运分部收入。；2025年第二代30MPa氢气管束集装箱批量出货；向松原项目交付15台氢气球罐和8套压缩机缓冲罐。；IV型储氢瓶合资公司当年出口超过800支，非全部由中集安瑞科独立制造。",
    "asOf": "财务数据披露于2026-03-25；装备/交付数据对应2025年度。",
    "sources": [
      {
        "label": "2025年度业绩及氢能业务披露",
        "url": "https://tc.enricgroup.com/companyupdate/97"
      },
      {
        "label": "公司概况（上市、员工与集团关系）",
        "url": "https://tc.enricgroup.com/about"
      },
      {
        "label": "储氢与运输产品页",
        "url": "https://www.enricgroup.com/zhongyouchucun"
      }
    ]
  },
  "hydrogen-liquid-enric": {
    "country": "中国",
    "summary": "中集安瑞科提供液氢储罐等低温装备；公司称2013年曾向海南文昌交付300m³液氢储罐。2025年披露的国内首台液氢球罐通过国家重点专项评审验收。",
    "listing": "中集安瑞科控股有限公司，香港主板3899.HK；集团财务规模不等于液氢业务规模。",
    "scale": "2013年交付文昌300m³液氢储罐（官网历史业务说明）。；2025年为国家重点专项交付国内首台液氢球罐并通过专家评审验收；来源称其助力民用液氢全产业链示范，专项示范。；集团口径：2025年收入人民币263.26亿元、归母净利润11.35亿元。",
    "asOf": "历史交付信息来自公司产品页；专项信息来自2025年度业绩披露（2026-03-25）。",
    "sources": [
      {
        "label": "储氢与运输产品页",
        "url": "https://www.enricgroup.com/zhongyouchucun"
      },
      {
        "label": "2025年度业绩及液氢储运业务披露",
        "url": "https://tc.enricgroup.com/companyupdate/97"
      },
      {
        "label": "公司概况（上市与集团关系）",
        "url": "https://tc.enricgroup.com/about"
      }
    ]
  },
  "hydrogen-carrier-sinopec-lohc": {
    "country": "中国",
    "summary": "中国石化2025年报告披露，已完成有机液体储氢脱氢催化剂中试放大研究，示范装置建设推进并开工。",
    "listing": "中国石油化工股份有限公司为上海、香港上市主体（600028.SH / 0386.HK）。",
    "scale": "公司2025年可持续发展报告仅披露催化剂中试放大和示范装置开工，未披露装置处理量、已投运日期或商业化交付规模。；",
    "asOf": "中国石化《2025年可持续发展报告》，2026年发布。",
    "sources": [
      {
        "label": "中国石化2025年可持续发展报告",
        "url": "https://www.sinopec.com/u/cms/gfzw/202603/22170726tr36.pdf"
      }
    ]
  }
});

Object.assign(companyProfiles, {
  "supercapacitor-skeleton": {
    "country": "爱沙尼亚/德国",
    "summary": "Skeleton Technologies为私营高功率超级电容企业，覆盖材料、电芯、模组与系统。产品页列出D60单体规格；公司将其作为秒级功率支撑设备，不能将电芯参数解释为电站性能。",
    "listing": "私营企业。",
    "scale": "D60单体：3.0 V、3400–5000 F、DC ESR 0.12–0.20 mΩ；厂商标称比功率28.4–36.48 kW/kg、比能量8.27–11.1 Wh/kg。；公司称2025年启用莱比锡工厂，投资€220m，设计年产能最高1200万只电芯、规划创造420个岗位；这些是设计产能/岗位，不是已实现产量或出货。",
    "asOf": "产品规格与工厂信息据公司页面，访问/发布截至2026-10-03。",
    "sources": [
      {
        "label": "SkelCap D60产品规格",
        "url": "https://www.skeletontech.com/en/skelcap-supercapacitors"
      },
      {
        "label": "莱比锡工厂启用公告",
        "url": "https://www.skeletontech.com/news/skeleton-opens-220-million-leipzig-factory-to-stabilise-europes-electrical-grid-and-ai-infrastructure"
      }
    ]
  },
  "supercapacitor-jianghai": {
    "country": "中国",
    "summary": "南通江海电容器股份有限公司生产铝电解、薄膜和超级电容器，官网列出EDLC与锂离子电容器单体及模组，应用包括电网后备、风电和轨道交通。",
    "listing": "深圳证券交易所上市，002484.SZ。",
    "scale": "2025年营业收入人民币54.84亿元，其中超级电容产品收入人民币3.52亿元、同比增长17.32%（公司年报）。；公司披露超级电容器在电网调频/SVG等方向有批量订单，并获“兆瓦级超级电容复合储能系统关键技术及工程应用”省科技进步奖；这不等同于兆瓦级独立超级电容电站已经部署。",
    "asOf": "2025年度报告于2026-04-10披露。",
    "sources": [
      {
        "label": "2025年年报（深交所PDF）",
        "url": "https://disc.static.szse.cn/disc/disk03/finalpage/2026-04-10/226419ee-9a1c-4425-b3b4-e7da33cfff25.PDF"
      },
      {
        "label": "江海超级电容器产品与模组页",
        "url": "https://www.jianghai.com/product_aluElecapacitor_17"
      }
    ]
  },
  "supercapacitor-inl-idaho-falls": {
    "country": "美国",
    "summary": "DOE资助的INL、Idaho Falls Power与NREL联合现场试验，将超容接入小水电系统验证孤岛运行和黑启动支持；这是社区微电网韧性研究，不是独立大型储能站。",
    "listing": "国家实验室与公用事业合作项目，不适用上市市值。",
    "scale": "2021年4月现场试验持续一周；试验负载由两台各6 MW负载箱模拟。DOE没有在该报道披露超容储能设备的额定功率、能量或持续时间。",
    "asOf": "试验2021-04；DOE报道2022-03-09。",
    "sources": [
      {
        "label": "DOE现场试验报道",
        "url": "https://www.energy.gov/cmei/water/articles/first-kind-tests-demonstrate-how-small-hydropower-plants-and-energy-storage-can"
      }
    ]
  },
  "smes-zhongshan-project": {
    "country": "中国",
    "summary": "中山市高性能高温超导材料及磁储能应用示范工程由南方凯能（广东）电力集团旗下中山市农村电力工程有限公司承接，地点在翠亨新区110 kV滨海变电站旁。",
    "listing": "项目与承建单位为地方国资体系，不把母集团规模或市值归作项目公司。",
    "scale": "2025年动工公告给出设计5 MVA/10 MJ、投资人民币2.08亿元、最大输出功率不低于5 MW。10 MJ约2.78 kWh；若以5 MW持续输出，理想能量约2秒，未计转换和冷却损耗。；中山市2026年计划执行报告确认工程已投入运行；其运行状态不扩展为大规模长时储能成熟证明。",
    "asOf": "开工消息2025-05-19；投入运行由中山市2026-03-13报告确认。",
    "sources": [
      {
        "label": "中山市国资委项目开工公告",
        "url": "https://www.zs.gov.cn/gzw/zdxm/content/post_2515267.html"
      },
      {
        "label": "中山市2025年计划执行情况报告",
        "url": "https://www.zs.gov.cn/zwgk/ghzj/fzghjh/gmjjshfzghgy/content/post_2597701.html"
      }
    ]
  },
  "smes-kyuden": {
    "country": "日本",
    "summary": "九州电力参与超导电力网络控制技术研发，曾与中部电力、ISTEC及古河电工合作开发并验证电网控制用SMES。",
    "listing": "九州电力为日本上市公用事业企业。",
    "scale": "2007年度起，在古河日光发电细尾电站进行约半年实系连系试验；10 MW/20 MJ级系统用于验证光伏出力波动补偿、平滑和时段转移控制。；不要与九州电力1994年度开始开发的1 MW/1 kWh模块混为一谈；20 MJ折合约5.56 kWh，说明它面向快速控制而非长时放电。",
    "asOf": "九州电力官方企业史，回顾2007年度起的现场试验。",
    "sources": [
      {
        "label": "九州电力SMES历史与实证说明",
        "url": "https://www.kyuden.co.jp/company/history/energy/technology/technology-1.html"
      }
    ]
  }
});

Object.assign(companyProfiles, {
  "electrochemical-lead-acid-tianneng": {
    "country": "中国",
    "summary": "天能电池集团经营铅蓄电池、铅炭储能等业务；集团规模不等于储能收入。",
    "listing": "天能电池集团：上交所688819；天能动力香港00819为关联上市主体。",
    "scale": "2025集团营收人民币457.92亿元、铅酸产品收入415.66亿元。和平共储一期2023年并网，官方披露全项目100MW/1000MWh，由国家电投与天能等共同建设。",
    "asOf": "2025年报2026-03-28披露；项目进展据2023年材料。",
    "sources": [
      {
        "label": "天能股份2025年报",
        "url": "https://static.cninfo.com.cn/finalpage/2026-03-28/1225042972.PDF"
      },
      {
        "label": "和平共储项目说明",
        "url": "https://www.tianneng.com/news/information/197"
      },
      {
        "label": "天能2023 ESG报告",
        "url": "https://www.tianneng.com/Public/Uploads/uploadfile/files/20240330/tiannengdianchijituangufenyouxianghuanjingshebaogao.pdf"
      }
    ]
  },
  "electrochemical-lead-acid-enersys": {
    "country": "美国",
    "summary": "EnerSys提供工业备用、牵引与动力电池；PowerSafe含固定式铅酸产品。",
    "listing": "NYSE: ENS；上市主体EnerSys, Inc.",
    "scale": "FY2025集团净销售额36.176亿美元，包含多类电源产品和服务，不是铅酸储能专属收入。PowerSafe DSG面向工业与公用事业备用。",
    "asOf": "FY2025截至2025-03-31，2025-05-21发布结果。",
    "sources": [
      {
        "label": "EnerSys FY2025结果",
        "url": "https://investor.enersys.com/news/news-details/2025/ENERSYS-REPORTS-FOURTH-QUARTER-FISCAL-YEAR-2025-RESULTS-05-21-2025/default.aspx"
      },
      {
        "label": "PowerSafe DSG资料",
        "url": "https://www.enersys.com/49c727/globalassets/documents/marketing-literature/esg/industrial/flyers/amer/amer-en-sellsheet-powersafedsg-2025.pdf"
      }
    ]
  },
  "electrochemical-zinc-eos": {
    "country": "美国",
    "summary": "Eos Energy Enterprises制造静态锌卤水系电池；Z3单元内封装电解质，不用外置储液罐和循环泵。",
    "listing": "NASDAQ: EOSE；上市主体Eos Energy Enterprises, Inc.",
    "scale": "FY2025收入1.142亿美元，年末订单积压7.015亿美元/2.8GWh，非已交付量。公司称2025年末年化制造产能达到2GWh，非全年出货。",
    "asOf": "FY2025结果于2026-02-26披露。",
    "sources": [
      {
        "label": "Eos FY2025结果",
        "url": "https://investors.eose.com/news-releases/news-release-details/eos-energy-enterprises-reports-fourth-quarter-and-full-year-2025"
      },
      {
        "label": "Z3技术说明",
        "url": "https://www.eose.com/technology/"
      }
    ]
  },
  "electrochemical-zinc-hfips": {
    "country": "中国",
    "summary": "中科院合肥物质科学研究院固体所团队研究水系准固态锌离子电池与凝胶电解质，属科研机构而非公司。",
    "listing": "中国科学院研究团队，不适用上市市值。",
    "scale": "2025年报道醋酸锌水凝胶与软包研究；557%延伸率、3.7MPa压缩强度为材料力学测试，不是电池/电站性能。",
    "asOf": "研究院报道2025-06-18与2025-06-24。",
    "sources": [
      {
        "label": "中文研究成果",
        "url": "https://www.hf.cas.cn/zhxw/jrtt/202506/t20250618_7871328.html"
      },
      {
        "label": "英文报道与参数",
        "url": "https://english.hf.cas.cn/nr/bth/202506/t20250624_1046068.html"
      },
      {
        "label": "原论文",
        "url": "https://doi.org/10.1002/anie.202508556"
      }
    ]
  },
  "electrochemical-metal-air-form": {
    "country": "美国",
    "summary": "Form Energy为私营储能企业，首个商业产品是可充铁空气系统，面向多日储能。",
    "listing": "私营企业，无公开股票市值。",
    "scale": "官网称员工超过1000人。公司称2025年与Great River Energy部署首套商业示范；2026公布的Xcel及爱尔兰项目仍为计划/协议。",
    "asOf": "公司信息截至2026年；项目状态按各公告日期。",
    "sources": [
      {
        "label": "Form Energy进展",
        "url": "https://formenergy.com/about/"
      },
      {
        "label": "技术说明",
        "url": "https://formenergy.com/technology/battery-technology/"
      },
      {
        "label": "Great River项目",
        "url": "https://formenergy.com/great-river-energy-and-form-energy-break-ground-on-first-of-its-kind-multi-day-energy-storage-project/"
      },
      {
        "label": "爱尔兰公告，2026-03-17",
        "url": "https://formenergy.com/form-energy-and-futurenergy-ireland-announce-agreement-to-deploy-first-iron-air-battery-storage-project-in-ireland/"
      }
    ]
  },
  "electrochemical-metal-air-sinap": {
    "country": "中国",
    "summary": "中科院上海应用物理研究所公开研究方向包含面向规模储能的高温金属空气电池；不是商业企业或已投运项目。",
    "listing": "国家科研院所课题，不适用上市市值。",
    "scale": "招生目录列出高温金属空气和水系铁电池研究方向，未给出已完成实验、样机容量或并网状态。",
    "asOf": "招生目录发表于2024-07。",
    "sources": [
      {
        "label": "硕士招生目录",
        "url": "https://sinap.cas.cn/yjsjynew/zsjz/sszs_177904/202407/W020240725722368110027.pdf"
      }
    ]
  }
});
