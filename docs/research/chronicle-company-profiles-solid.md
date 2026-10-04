# 固态电池企业档案（11家）

口径：财务规模使用最近可取得的公司年报/公告，说明财年边界和币种。动态市值仅作为注明日期的行情快照，ticker必须属于被介绍的上市主体；未上市子公司不以母公司市值代替。产能规划与已实际产量分开。当前已核11/11。

```json
{
  "asOf": "2026-10-03",
  "profiles": [
    {
      "id": "company:quantumscape",
      "name": "QuantumScape",
      "country": "美国",
      "listing": {
        "entity": "QuantumScape Corporation",
        "venue": "NASDAQ Global Select Market",
        "ticker": "QS"
      },
      "marketCap": {
        "value": 2811000000,
        "currency": "USD",
        "asOf": "2026-10-02 close (quote page)"
      },
      "scale": [
        "仍处于固态锂金属电池开发和产线验证阶段；公司2025年年报与2026年Q2业务更新跟踪Cobra工艺、QSE-5样品和Eagle Line，不应视作大规模量产。"
      ],
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
      ]
    },
    {
      "id": "company:solid-power",
      "name": "Solid Power",
      "country": "美国",
      "listing": {
        "entity": "Solid Power, Inc.",
        "venue": "NASDAQ",
        "ticker": "SLDP"
      },
      "marketCap": {
        "value": 531662000,
        "currency": "USD",
        "asOf": "2026-10-02 close (quote page)"
      },
      "scale": [
        "2026年上半年收入及补助收入合计2.8百万美元；2026Q2单季为-0.3百万美元（累计调整影响）。截至2026-06-30流动性4.193亿美元、无债务融资，显示其仍是开发/试产阶段技术公司。"
      ],
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
      ]
    },
    {
      "id": "company:powerco",
      "name": "PowerCo SE",
      "country": "德国（大众汽车集团子公司）",
      "listing": {
        "entity": "PowerCo SE",
        "status": "非独立上市；大众集团年报称其为集团子公司",
        "marketCap": "不适用；不以Volkswagen AG市值代替"
      },
      "scale": [
        "大众集团2025年报称Salzgitter首座电芯工厂于2025年开始运行并交付首批验证电芯；Valencia和加拿大St. Thomas仍建设中。",
        "公司招聘官网列示Salzgitter目标年产能40 GWh、三地规划合计最高200 GWh；这是设计/规划产能，不是实际年出货。"
      ],
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
    {
      "id": "company:bmw",
      "name": "BMW Group / BMW AG",
      "country": "德国",
      "listing": {
        "entity": "Bayerische Motoren Werke AG",
        "venue": "Xetra",
        "ticker": "BMW.DE"
      },
      "marketCap": {
        "value": 32515000000,
        "currency": "EUR",
        "asOf": "2026-10-02 close (quote page)"
      },
      "scale": [
        "2025财年集团收入€133.453bn，年末员工154,540人；2025年汽车交付约2.46m辆。这里的体量是BMW集团，不是固态电池业务收入。"
      ],
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
      ]
    },
    {
      "id": "company:sk-on",
      "name": "SK On",
      "country": "韩国",
      "listing": {
        "entity": "SK On（SK Innovation于2021年分拆设立的电池公司，后续与集团关联公司合并）；本身无独立股票代码",
        "parent": "SK Innovation Co., Ltd.",
        "parentTicker": "KRX 096770",
        "marketCap": "不以母公司市值冒充SK On市值"
      },
      "scale": [
        "SK Innovation 2025四季业绩材料所列Battery分部收入合计约KRW 6.978tn（四季值相加）；这是集团分部口径，材料明确合并财务与SK On merged entity实际业绩不同。",
        "该材料列2025年Battery分部各季营业亏损；不将SK Innovation全公司收入或市值写成SK On自身数据。"
      ],
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
    {
      "id": "company:toyota",
      "name": "Toyota Motor Corporation",
      "country": "日本",
      "listing": {
        "entity": "Toyota Motor Corporation",
        "venue": "Tokyo Stock Exchange",
        "ticker": "7203.T",
        "alsoListed": "NYSE TM (ADR)"
      },
      "marketCap": {
        "value": 35822000000000,
        "currency": "JPY",
        "asOf": "2026-09-18 close shown on quote page; not an Oct-02 quote"
      },
      "scale": [
        "FY2026（截至2026-03-31）合并销售收入¥48.0367tn。",
        "Toyota截至2026-06-30普通股发行数14,594,987,460股；此数为发行股数，非扣除库存股后的流通股数。"
      ],
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
      ]
    },
    {
      "id": "company:samsung-sdi",
      "name": "Samsung SDI Co., Ltd.",
      "country": "韩国",
      "listing": {
        "entity": "Samsung SDI Co., Ltd.",
        "venue": "KOSPI",
        "ticker": "006400.KS"
      },
      "marketCap": {
        "value": 40999000000000,
        "currency": "KRW",
        "asOf": "2026-09-23 close (quote-page intraday market cap)"
      },
      "scale": [
        "2025财年收入KRW 13.27tn、营业亏损KRW 1.72tn；2025Q4电池业务收入KRW 3.62tn、营业亏损KRW 338.5bn。公司披露与BMW合作推进全固态电池验证，整体财务规模不等于固态业务收入。"
      ],
      "sources": [
        {
          "label": "2025 Q4 and full-year results, 2026-02-02; revenue, operating loss and battery segment",
          "url": "https://www.samsungsdi.com/sdi-now/sdi-news/4702.html"
        },
        {
          "label": "Yahoo Finance 006400.KS quote; 2026-09-23 close, KOSPI-listed entity, market cap snapshot",
          "url": "https://finance.yahoo.com/quote/006400.KS/"
        }
      ]
    },
    {
      "id": "company:prologium",
      "name": "ProLogium Technology Co., Ltd.",
      "country": "中国台湾",
      "listing": {
        "entity": "ProLogium Technology Co., Ltd.",
        "status": "截至2026-10-03仍为拟通过与Translational Development Acquisition Corp.业务合并上市；公司标示预计2026年下半年交割并待监管及股东批准，无已完成挂牌股票代码",
        "marketCap": "未上市，无公开市场市值"
      },
      "scale": [
        "公司2026-05投资者材料称累计出货2.4M+电池单元、截至2025年底获批及申请专利1,000+；Taoyuan产能0.5 GWh/年为公司列示现有生产能力，Dunkirk 4 GWh/年仍在建设。",
        "2026-05交易材料提出约USD 3.8bn pre-money enterprise value，这是拟议合并交易估值，不是公开市场市值。"
      ],
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
    {
      "id": "company:welion",
      "name": "北京卫蓝新能源科技股份有限公司（WeLion）",
      "country": "中国",
      "listing": {
        "entity": "北京卫蓝新能源科技股份有限公司",
        "status": "未查询到独立公开挂牌股票代码；非上市公司，无公开市场市值"
      },
      "scale": [
        "公司官网称2016年成立，主营固态锂离子电池，属中科院物理所孵化企业；其自述360 Wh/kg动力电芯于2023年底量产并交付蔚来，280 Ah储能电芯于2023年下半年量产交付，供应三峡、海博思创及国电投项目。上述均为企业官网口径，未等同于第三方审计销量。"
      ],
      "sources": [
        {
          "label": "WeLion official company profile and typical cell products; company-reported deliveries",
          "url": "https://www.welion.tech/zh/about-us/"
        }
      ]
    },
    {
      "id": "company:qingtao",
      "name": "清陶能源（上汽清陶）",
      "country": "中国",
      "listing": {
        "entity": "清陶（昆山）能源发展集团股份有限公司及关联业务主体",
        "status": "未查询到独立公开挂牌股票代码；上汽为战略投资方，不以其市值代表清陶"
      },
      "scale": [
        "上汽官方披露2025年12月搭载清陶自研锰基复合半固态电池的MG4车型开启交付；这是有车型交付的产业化证据，不代表全固态电池或电站级成熟度。",
        "未在所引官方材料中找到清陶独立年营收、员工总数或独立市值披露，故不填数。"
      ],
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
    {
      "id": "company:ganfeng",
      "name": "赣锋锂业集团股份有限公司（Ganfeng Lithium）",
      "country": "中国",
      "listing": {
        "entity": "赣锋锂业集团股份有限公司",
        "venue": "深圳证券交易所及香港联合交易所",
        "ticker": "002460.SZ / 01772.HK"
      },
      "marketCap": {
        "value": 88610000000,
        "currency": "CNY",
        "asOf": "2026-09-22 (Yahoo Finance statistics snapshot for 002460.SZ)"
      },
      "scale": [
        "2025年报（2026-04-30发布）披露集团营业收入RMB 22.798bn；锂电池业务分部对外收入RMB 8.536bn。前者是上市集团整体，后者为其电池业务分部，不能据此推定为全固态电池收入。"
      ],
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
      ]
    }
  ]
}
```

## 目前已确认的口径

- QuantumScape和Solid Power是美国独立上市开发公司；两者的市值按Yahoo Finance行情页标注的2026-10-02收盘时点展示，后续价格变化不沿用此快照。
- PowerCo与SK On均无独立挂牌市值。PowerCo使用大众集团年报确认的子公司关系和工厂验证状态；SK On只引用SK Innovation披露的Battery分部数据，并指出该口径与合并后的SK On实体不同。
- BMW市值为BMW AG/Xetra主体；Toyota的市值快照目前只确认到2026-09-18，不冒充10月2日行情。年度收入数据取各自公司正式年报/IR原文。
- 以上企业介绍用于研究编年史背景，不构成财务投资分析；公司自报的计划产能与量产、出货数据严格分列。
