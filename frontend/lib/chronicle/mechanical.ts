import type { ChronicleResearch } from "./researchRoutes";

export const pumpedHydroResearch: ChronicleResearch = {
  "name": "抽水蓄能",
  "timeline": [
    {
      "id": "pumped-hydro-1890",
      "yearNumber": 1890,
      "year": "1890年代",
      "label": "先把水抬高，再把电移时",
      "title": "先把水抬高，再把电移时",
      "copy": "抽蓄以水位差保存重力势能，再通过水轮机把水流能量转回电力。DOE将欧洲早期应用追溯到1890年代。",
      "facts": [
        [
          "水的重力势能",
          "1890年代欧洲早期抽蓄应用"
        ]
      ],
      "detail": "美国能源部将欧洲早期应用追溯至意大利和瑞士的1890年代；该条机构资料以年代追溯早期应用。",
      "source": "https://www.energy.gov/cmei/water/pumped-storage-hydropower",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-1929",
      "yearNumber": 1929,
      "year": "1929",
      "label": "Rocky River形成大型早期工程",
      "title": "Rocky River形成大型早期工程",
      "copy": "Rocky River于1929年完成，抽水蓄能成为大型电力系统设施。该节点来自美国运营记录。",
      "facts": [
        [
          "Rocky River",
          "美国运营记录：1929年完成"
        ]
      ],
      "detail": "FirstLight运营记录称电站1929年完成；抽蓄开始成为大型电力系统设施。来源限定美国，不能写全球第一。",
      "source": "https://firstlight.energy/energy/rocky-river-generating-station/",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-1965",
      "yearNumber": 1965,
      "year": "1965",
      "label": "Cruachan把机组藏入山体",
      "title": "Cruachan把机组藏入山体",
      "copy": "Cruachan在山体内布置可逆机组，1965年正式开放。地下机房与水库共同构成抽蓄工程。",
      "facts": [
        [
          "1965-10-15",
          "Cruachan正式开放 · 后续机组1966/1967投入"
        ],
        [
          "地下厂房",
          "山体洞室与可逆机组工程"
        ]
      ],
      "detail": "1965-10-15正式开放，后两台机组1966和1967年投入。地下厂房与可逆机组形成成熟工程范式；今天440 MW不是1965年当日全部投产容量。",
      "source": "https://www.visitcruachan.co.uk/history/",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-1973",
      "yearNumber": 1973,
      "year": "1973",
      "label": "Ludington进入大型日循环运行",
      "title": "Ludington进入大型日循环运行",
      "copy": "Ludington利用密歇根湖和人工上库储能，1973年开始发电。水库水量与机组功率分别约束能量和输出。",
      "facts": [
        [
          "1973",
          "Ludington运营资料：开始发电"
        ],
        [
          "湖泊 + 人工上库",
          "密歇根湖作为下部水体"
        ]
      ],
      "detail": "运营商发电设施页明确1973年开始发电；利用密歇根湖与人工上库。事件年采用运营商发电设施记录。",
      "source": "https://www.consumersenergy.com/about-us/electric-generation/renewables/hydroelectric/pumped-storage-hydro-electricity",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-1985",
      "yearNumber": 1985,
      "year": "1985",
      "label": "Bath County商业运行",
      "title": "Bath County商业运行",
      "copy": "Bath County在1985年12月进入商业运行。水工资产和可更新的机电设备共同决定长期服务能力。",
      "facts": [
        [
          "1985年12月",
          "Bath County商业运行"
        ]
      ],
      "detail": "运营商记载1985年12月商业运行。长期水工资产与可改造机电设备共同决定寿命，当前升级容量不能倒填到初始投产年。",
      "source": "https://www.dominionenergy.com/about/making-energy/hydroelectric-power-facilities/bath-county-pumped-storage-station",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-1990",
      "yearNumber": 1990,
      "year": "1990",
      "label": "变速调节进入抽水工况",
      "title": "变速调节进入抽水工况",
      "copy": "矢木泽2号机采用变速抽蓄系统，抽水耗电可以连续调节。其作用是改善控制能力，而非扩大水库能量。",
      "facts": [
        [
          "抽水侧变速调节",
          "东芝：矢木泽2号机变速系统"
        ]
      ],
      "detail": "东芝向东京电力矢木泽2号机提供变速抽蓄系统；调速不再只作用于发电侧，为抽水耗电连续调节提供设备路径。",
      "source": "https://www.global.toshiba/ww/products-solutions/renewable-energy/products-technical-services/hydro-power.html",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-2021",
      "yearNumber": 2021,
      "year": "2021",
      "label": "从调峰工程进入综合价值规划",
      "title": "从调峰工程进入综合价值规划",
      "copy": "中国发布中长期规划，美国DOE发布项目估值工具。工程价值覆盖移峰、容量和电网服务。",
      "facts": [
        [
          "约120GW",
          "2030中国规划目标，非当年投运"
        ],
        [
          "62GW以上",
          "2025规划投产下限目标"
        ]
      ],
      "detail": "中国发布2021—2035年规划；同期美国能源部发布估值工具，把容量、能量及辅助服务放到共同评估边界。中国2030年1.2亿千瓦是规划目标。",
      "source": "https://www.nea.gov.cn/2021-09/09/c_1310177087.htm",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "闭式抽蓄纳入全生命周期比较",
      "title": "闭式抽蓄纳入全生命周期比较",
      "copy": "闭式抽蓄进入建设到退役的生命周期研究。80–100年是模型寿命假设，排放还受充电电源结构影响。",
      "facts": [
        [
          "80–100年",
          "闭式抽蓄生命周期模型寿命假设"
        ]
      ],
      "detail": "NREL牵头研究于2022年8月发表，评估从材料获取到退役的温室气体。模型寿命80—100年，不是所有电站已被实测运行百年。",
      "source": "https://www.energy.gov/cmei/water/articles/study-examines-sustainability-new-closed-loop-pumped-storage-hydropower",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "丰宁3600 MW全部并网",
      "title": "丰宁3600 MW全部并网",
      "copy": "丰宁12台机组实现3600MW全容量并网。变速机组投运与全站投产是同年的两个不同事件。",
      "facts": [
        [
          "3600MW",
          "丰宁12台机组 · 2024-12-31全容量"
        ],
        [
          "2024-08-11",
          "丰宁12号交流励磁变速机组投运"
        ]
      ],
      "detail": "8月11日12号交流励磁变速机组投运；12月31日最后一台并网，12台、总360万千瓦实现全容量。两事件可在同一年展开，不另造年份。",
      "source": "https://www.fengning.gov.cn/art/2025/1/7/art_4498_1039314.html",
      "subject": "route:pumped-hydro:history"
    },
    {
      "id": "pumped-hydro-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "中国投运总量达到65.94 GW",
      "title": "中国投运总量达到65.94 GW",
      "copy": "中国2025年底投运抽水蓄能功率达到65.94GW，当年新增7.48GW。统计发布日期为2026年2月12日。",
      "facts": [
        [
          "65.94GW",
          "中国2025年底累计投运功率"
        ],
        [
          "7.48GW",
          "中国2025年新增功率 · NEA2026-02-12发布"
        ]
      ],
      "detail": "国家能源局2026-02-12发布：2025年新增抽蓄748万千瓦，年底累计6594万千瓦。这是功率装机，不能换算成65.94 GWh。",
      "source": "https://www.nea.gov.cn/20260212/742b8c6a078347b0b39de676c05c5d58/c.html",
      "subject": "route:pumped-hydro:history"
    }
  ],
  "materials": [
    {
      "id": "pumped-hydro-reservoir",
      "label": "水与上下水库",
      "title": "库容和水头决定可转移电量",
      "copy": "能量来自水的重力势能，理想关系为E=mgh。可用水量、水位变化和损失决定实际输出，MW额定功率本身不能确定放电时长。",
      "facts": [
        [
          "E=mgh",
          "理想重力势能关系 · 工程另计可用水量与损失"
        ]
      ],
      "subject": "material:pumped-hydro-reservoir",
      "year": "部件"
    },
    {
      "id": "pumped-hydro-waterway",
      "label": "水道与地下厂房",
      "title": "流路、压力与山体洞室",
      "copy": "压力管道、隧洞和调压设施处理流量与水锤。Cruachan地下机房容纳可逆机组，上水库承担主要势能储存。",
      "facts": [
        [
          "水道与调压",
          "水力输送、压力波动及流量匹配"
        ]
      ],
      "subject": "material:pumped-hydro-waterway",
      "year": "部件"
    },
    {
      "id": "pumped-hydro-pump-turbine",
      "label": "可逆水泵水轮机",
      "title": "一套水力机械服务两种工况",
      "copy": "可逆机组在抽水与发电两种状态运行，设计兼顾变化水头和两种工况。单机水轮机效率与电站往返效率分别计量。",
      "facts": [
        [
          "抽水 / 发电",
          "同一可逆机械的两种工作状态"
        ]
      ],
      "subject": "material:pumped-hydro-turbine",
      "year": "部件"
    },
    {
      "id": "pumped-hydro-variable-speed",
      "label": "变速励磁与控制",
      "title": "连续调节抽水耗电",
      "copy": "1990年矢木泽与2024年丰宁提供变速系统节点。变速设备改善可调范围，水库规模仍决定可转移能量。",
      "facts": [
        [
          "1990 / 2024",
          "两次独立工程节点 · 非同一系统纪录"
        ]
      ],
      "subject": "material:pumped-hydro-control",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "pumped-hydro-edf",
      "label": "EDF",
      "title": "Grand’Maison混合抽水—发电工程",
      "year": "1987",
      "copy": "法国EDF运营Grand’Maison，机组在1985—1987分批投运。1800MW是电站装机功率，水库容积与可用储能量分别理解。",
      "facts": [
        [
          "1800MW",
          "Grand’Maison电站功率 · 分批投运1985–1987"
        ]
      ],
      "subject": "company:pumped-hydro-edf"
    },
    {
      "id": "pumped-hydro-drax",
      "label": "Drax",
      "title": "Cruachan现役机组与升级计划",
      "year": "工程",
      "copy": "Cruachan现役可逆机组装机440MW。升级至480MW和另建600MW Cruachan II属于分别披露的开发计划。",
      "facts": [
        [
          "440MW",
          "Cruachan现役装机 · 4台可逆机组"
        ],
        [
          "480MW / 600MW",
          "现役升级与Cruachan II分别规划，非已投产"
        ]
      ],
      "subject": "company:pumped-hydro-drax"
    },
    {
      "id": "pumped-hydro-state-grid",
      "label": "国网新源",
      "title": "丰宁12台机组实现全容量",
      "year": "2024",
      "copy": "丰宁2024年12月31日最后一台机组并网，12台共3.6GW。年设计发电量与抽水电耗属于设计指标，运行统计另行观察。",
      "facts": [
        [
          "3.6GW",
          "2024-12-31丰宁全容量商业运行"
        ]
      ],
      "subject": "company:pumped-hydro-state-grid"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "抽水蓄能 · 工程与变速技术的时间线",
      "content": "### 1890年代：先把水抬高，再把电移时\n\n美国能源部将欧洲早期应用追溯至意大利和瑞士的1890年代；该条机构资料以年代追溯早期应用。\n\n### 1929：Rocky River形成大型早期工程\n\nFirstLight运营记录称电站1929年完成；抽蓄开始成为大型电力系统设施。来源限定美国，不能写全球第一。\n\n### 1965：Cruachan把机组藏入山体\n\n1965-10-15正式开放，后两台机组1966和1967年投入。地下厂房与可逆机组形成成熟工程范式；今天440 MW不是1965年当日全部投产容量。\n\n### 1973：Ludington进入大型日循环运行\n\n运营商发电设施页明确1973年开始发电；利用密歇根湖与人工上库。事件年采用运营商发电设施记录。\n\n### 1985：Bath County商业运行\n\n运营商记载1985年12月商业运行。长期水工资产与可改造机电设备共同决定寿命，当前升级容量不能倒填到初始投产年。\n\n### 1990：变速调节进入抽水工况\n\n东芝向东京电力矢木泽2号机提供变速抽蓄系统；调速不再只作用于发电侧，为抽水耗电连续调节提供设备路径。\n\n### 2021：从调峰工程进入综合价值规划\n\n中国发布2021—2035年规划；同期美国能源部发布估值工具，把容量、能量及辅助服务放到共同评估边界。中国2030年1.2亿千瓦是规划目标。\n\n### 2022：闭式抽蓄纳入全生命周期比较\n\nNREL牵头研究于2022年8月发表，评估从材料获取到退役的温室气体。模型寿命80—100年，不是所有电站已被实测运行百年。\n\n### 2024：丰宁3600 MW全部并网\n\n8月11日12号交流励磁变速机组投运；12月31日最后一台并网，12台、总360万千瓦实现全容量。两事件可在同一年展开，不另造年份。\n\n### 2025：中国投运总量达到65.94 GW\n\n国家能源局2026-02-12发布：2025年新增抽蓄748万千瓦，年底累计6594万千瓦。这是功率装机，不能换算成65.94 GWh。\n\n原始来源 · [原始资料 1](https://www.energy.gov/cmei/water/pumped-storage-hydropower) · [原始资料 2](https://firstlight.energy/energy/rocky-river-generating-station/) · [原始资料 3](https://www.visitcruachan.co.uk/history/) · [原始资料 4](https://www.drax.com/uk/what-we-do/cruachan-power-station/) · [原始资料 5](https://www.consumersenergy.com/about-us/electric-generation/renewables/hydroelectric/pumped-storage-hydro-electricity) · [原始资料 6](https://www.dominionenergy.com/about/making-energy/hydroelectric-power-facilities/bath-county-pumped-storage-station) · [原始资料 7](https://www.global.toshiba/ww/products-solutions/renewable-energy/products-technical-services/hydro-power.html) · [原始资料 8](https://www.nea.gov.cn/2021-09/09/c_1310177087.htm) · [原始资料 9](https://www.energy.gov/cmei/water/articles/new-guidebook-and-tool-help-developers-calculate-value-potential-pumped-storage) · [原始资料 10](https://www.energy.gov/cmei/water/articles/study-examines-sustainability-new-closed-loop-pumped-storage-hydropower) · [原始资料 11](https://www.fengning.gov.cn/art/2025/1/7/art_4498_1039314.html) · [原始资料 12](https://www.nea.gov.cn/20260212/742b8c6a078347b0b39de676c05c5d58/c.html)",
      "details": "",
      "detailLabel": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "抽水蓄能 · 储能介质与关键部件",
      "content": "### 水与上下水库\n\n能量来自水的重力势能，理想表达式 E=mgh；工程有效能量还受可用水量、水位变化和损失影响。功率来自水头、流量和机组能力；只知道MW不能确定持续时间。开式系统与自然水系连接，闭式系统的两库不与天然流动水体直接连接。闭式减少部分河流连通性影响，但仍涉及土建、补水、占地与生态。\n### 水道与地下厂房\n\n压力管道、引水隧洞和调压设施共同处理流量及水锤；Cruachan提供地下厂房工程实例。洞室并不储存电荷，它容纳机组；上库才是主要势能载体。\n### 可逆水泵水轮机与电机\n\n一套水力机械在抽水和发电两种状态工作；设计需同时兼顾水头变化与两种工况效率。不能把单台水轮机峰值效率当成电站往返效率。\n### 变速励磁及控制\n\n矢木泽1990年与丰宁2024年提供具体设备进展；变速调节扩大抽水侧灵活性。水库规模决定可转移电量，变速设备改善可调能力，两者解决不同约束。\n\n原始来源 · [原始资料 1](https://www.energy.gov/cmei/water/pumped-storage-hydropower) · [原始资料 2](https://www.visitcruachan.co.uk/history/) · [原始资料 3](https://www.global.toshiba/ww/products-solutions/renewable-energy/products-technical-services/hydro-power.html) · [变速设备](https://www.global.toshiba/ww/products-solutions/renewable-energy/products-technical-services/hydro-power.html)",
      "details": "",
      "detailLabel": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "抽水蓄能 · 环境、生命周期与项目估值研究",
      "content": "| 研究 | 研究对象与可直接展示内容 | 口径 |\n|---|---|---|\n| DOE/国家实验室，2021，开式与闭式环境比较 | 闭式选址能够减少与天然河道直接连接带来的部分环境影响；不能概括成零生态影响。 | 环境研究，不是效率实测； |\n| NREL等，2022，闭式抽蓄生命周期研究 | 研究覆盖建设、运行、退役；80—100年寿命为模型假设，不同电网供电结构改变生命周期排放。 | 生命周期模型； |\n| Argonne/DOE，2021，抽蓄估值指南与工具 | 把电能移时、可靠容量及电网服务一并评估；只按峰谷差可能遗漏价值，也不能重复计入相互排斥时段的收益。 | 项目经济方法，无通用收益率； |\n\n原始来源 · [原始资料 1](https://www.energy.gov/cmei/water/articles/lower-environmental-impacts-closed-loop-pumped-storage-new-national-lab-study) · [原始资料 2](https://www.energy.gov/cmei/water/articles/study-examines-sustainability-new-closed-loop-pumped-storage-hydropower) · [原始资料 3](https://www.energy.gov/cmei/water/articles/new-guidebook-and-tool-help-developers-calculate-value-potential-pumped-storage)",
      "details": "",
      "detailLabel": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "抽水蓄能 · 运营企业与抽蓄工程",
      "content": "### EDF\n\n法国EDF运营Grand’Maison，机组在1985—1987分批投运。1800MW是电站装机功率，水库容积与可用储能量分别理解。\n\nGrand’Maison于1985–1987分批投运，装机1,800MW；上水库可存水1.4亿m³，下水库1,500万m³。数据为电站规模，不代表储能效率或可用MWh。\n\n原始来源 · [EDF Grand’Maison电站资料](https://www.edf.fr/groupe-edf/agir-en-entreprise-responsable/fondation-et-mecenat-patrimoine-sport/site-edf-grand-maison-hydrelec/amenagement-de-grand-maison) · [EDF退市及法国政府持股公告](https://www.edf.fr/en/the-edf-group/dedicated-sections/journalists/all-press-releases/implementation-of-the-squeeze-out-procedure-in-respect-of-the-equity-securities-of-edf)\n\n### Drax\n\nCruachan现役可逆机组装机440MW。升级至480MW和另建600MW Cruachan II属于分别披露的开发计划。\n\nCruachan现有机组装机440MW，4台可逆机组，约30秒可达满出力，最高可连续发电超过16小时（公司介绍）；2024年公布升级计划拟增至480MW、另有600MW Cruachan 2开发，不作为已投运容量。\n\n原始来源 · [Cruachan电站与现役规模](https://www.drax.com/uk/what-we-do/cruachan-power-station/) · [Drax Cruachan升级公告，2024-04-29](https://www.drax.com/press_release/draxs-iconic-cruachan-hollow-mountain-power-station-set-for-80-million-upgrade/) · [Drax网站使用条款](https://www.drax.com/terms-of-use/)\n\n### 国网新源\n\n丰宁2024年12月31日最后一台机组并网，12台共3.6GW。年设计发电量与抽水电耗属于设计指标，运行统计另行观察。\n\n丰宁12台机组共3.6GW，最后一台变速机组于2024-12-31投入商业运行，完成全容量投产。当地政府报告的年设计发电量66.12亿kWh、年设计抽水耗电量87.16亿kWh为设计指标，非当年实测值。\n\n原始来源 · [丰宁县政府全容量并网公告，运营主体及设计规模](https://www.fengning.gov.cn/art/2025/1/2/art_4511_1040263.html) · [丰宁县清洁能源发展中心项目运行信息，2025-09-17](https://www.fengning.gov.cn/art/2025/9/17/art_4511_1083354.html)",
      "details": "",
      "detailLabel": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "抽水蓄能 · 中国投运功率与中长期规划",
      "content": "### 投运功率与规划目标\n\n**2025年底65.94GW**为中国抽蓄实际累计投运功率，**当年新增7.48GW**；国家能源局于2026-02-12发布。该来源统计功率装机，未给全国GWh能量容量。\n\n2021中长期规划提出2025投产62GW以上、2030约120GW。2025实际与规划下限可以对照，2030目标保留为规划。\n\n原始来源 · [2025抽蓄投运统计，NEA2026-02-12](https://www.nea.gov.cn/20260212/742b8c6a078347b0b39de676c05c5d58/c.html) · [2021—2035规划](https://www.nea.gov.cn/2021-09/09/c_1310177087.htm)",
      "details": "",
      "detailLabel": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "抽水蓄能 · 水力储能的系统能力与选址",
      "content": "### 水库、机组与运行条件\n\n适合有地形、水源和建设条件的电网级容量、日内移时及系统调节，水库能量与机组功率可分别设计。大坝、库区和水道建设长周期，选址与生态约束强；新增蓄能库容并非可随地复制的集装箱扩容。已建电站可通过机电更新延寿或改善调节，但库容和水道能力仍形成边界。变速技术提升抽水侧控制，不能消除地理限制。闭式与开式应在工程卡显式区分；比较往返效率时，至少同时给出抽水耗电、发电输出、辅助设备及水位工况，不把水轮机效率作为整站效率。\n\n原始来源 · [DOE抽水蓄能机制](https://www.energy.gov/cmei/water/pumped-storage-hydropower) · [闭式生命周期](https://www.energy.gov/cmei/water/articles/study-examines-sustainability-new-closed-loop-pumped-storage-hydropower) · [东芝变速系统](https://www.global.toshiba/ww/products-solutions/renewable-energy/products-technical-services/hydro-power.html)",
      "details": "",
      "detailLabel": ""
    }
  ],
  "policy": {
    "id": "pumped-hydro-policy",
    "label": "中国抽水蓄能（独立统计）",
    "title": "2025实际装机与2030规划分别呈现",
    "year": "2025",
    "copy": "中国2025年底投运抽水蓄能功率达到65.94GW，当年新增7.48GW。统计发布日期为2026年2月12日。",
    "facts": [
      [
        "65.94GW",
        "中国2025年底累计投运功率"
      ],
      [
        "7.48GW",
        "中国2025年新增功率 · NEA2026-02-12发布"
      ],
      [
        "约120GW",
        "2030规划目标 · NEA2021原文"
      ]
    ],
    "subject": "scene:pumped-hydro-policy"
  },
  "market": {
    "id": "pumped-hydro-market",
    "label": "中国抽水蓄能（独立统计）",
    "title": "2025实际装机与2030规划分别呈现",
    "year": "2025",
    "copy": "中国抽水蓄能功率按国家能源局独立统计。它不属于此页其他路线使用的新型储能全技术容量统计。",
    "facts": [
      [
        "65.94GW",
        "中国2025年底累计投运功率"
      ],
      [
        "7.48GW",
        "中国2025年新增功率 · NEA2026-02-12发布"
      ],
      [
        "约120GW",
        "2030规划目标 · NEA2021原文"
      ]
    ],
    "subject": "scene:pumped-hydro-policy"
  },
  "papers": {
    "id": "pumped-hydro-papers",
    "label": "论文",
    "year": "研究",
    "title": "闭式环境、生命周期与项目估值",
    "copy": "闭式抽蓄减少部分河流直接连通影响，但土建与生态仍需评价。生命周期与经济模型分别保留假设和计量边界。",
    "facts": [
      [
        "80–100年",
        "2022闭式抽蓄生命周期模型寿命假设"
      ],
      [
        "容量 + 电能 + 服务",
        "DOE2021项目估值方法 · 非通用收益率"
      ]
    ],
    "subject": "route:pumped-hydro:history"
  },
  "storage": {
    "id": "pumped-hydro-storage",
    "label": "储能适配",
    "year": "工程",
    "title": "用水库移时，用机组调节输出",
    "copy": "库容和可用水头约束能量，机组约束功率与调节。工程适配还取决于地形、水源、生态和水道施工条件。",
    "facts": [
      [
        "水库 / 机组",
        "可转移能量与额定功率分别设计"
      ],
      [
        "开式 / 闭式",
        "与自然水系连通关系不同"
      ]
    ],
    "subject": "material:pumped-hydro-reservoir"
  },
  "historySubject": "route:pumped-hydro:history",
  "note": "抽水蓄能独立统计与工程史",
  "showMarketChart": false
};

export const adiabaticCaesResearch: ChronicleResearch = {
  "name": "绝热压缩空气",
  "timeline": [
    {
      "id": "caes-adiabatic-2010",
      "yearNumber": 2010,
      "year": "2010",
      "label": "ADELE把热管理放到系统中心",
      "title": "ADELE把热管理放到系统中心",
      "copy": "DLR、RWE、GE、Züblin启动绝热压气储能合作，提出最大200 MW、1 GWh示范目标。关键转变是保留压缩热以替代传统燃烧补热；这是研发目标，不是2010年已建成200 MW电站。",
      "facts": [
        [
          "200MW / 1GWh",
          "ADELE当时示范目标 · 非已建成"
        ]
      ],
      "detail": "DLR、RWE、GE、Züblin启动绝热压气储能合作，提出最大200 MW、1 GWh示范目标。关键转变是保留压缩热以替代传统燃烧补热；这是研发目标，不是2010年已建成200 MW电站。原始日期2010-01-20。",
      "source": "https://www.dlr.de/de/aktuelles/nachrichten/2010/20100120_adele-liefert-strom-wenn-er-dringend-gebraucht-wird_22107/%40%40download/file",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "兆瓦级先进系统与ADELE工程研究",
      "title": "兆瓦级先进系统与ADELE工程研究",
      "copy": "中国科学院工程热物理所官方回顾列出2013年1.5 MW先进压缩空气系统；同年DLR的ADELE-ING进入工程研究阶段。设备放大和热储存可靠性成为独立研发任务，不能把早期ADELE建设计划写成已投产。",
      "facts": [
        [
          "1.5MW",
          "CAS先进系统研发节点"
        ]
      ],
      "detail": "中国科学院工程热物理所官方回顾列出2013年1.5 MW先进压缩空气系统；同年DLR的ADELE-ING进入工程研究阶段。设备放大和热储存可靠性成为独立研发任务，不能把早期ADELE建设计划写成已投产。",
      "source": "https://english.iet.cas.cn/research_22384/researchprogress/202308/t20230821_335137.html",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2016",
      "yearNumber": 2016,
      "year": "2016",
      "label": "瑞士洞室与蓄热联合试验",
      "title": "瑞士洞室与蓄热联合试验",
      "copy": "ALACAES在2016年建成并测试试验设施，把热储存置于加压洞室区域。其主要证据是储气及热储存试验，不应写为完整商业电站已测得72%电到电效率。",
      "facts": [
        [
          "岩洞 + 蓄热",
          "ALACAES储气/热储存试验"
        ],
        [
          "10MW",
          "CAS同年系统研发回顾，独立装置"
        ]
      ],
      "detail": "ALACAES在2016年建成并测试试验设施，把热储存置于加压洞室区域。其主要证据是储气及热储存试验，不应写为完整商业电站已测得72%电到电效率。同年工程热物理所官方回顾列出10 MW系统。",
      "source": "https://alacaes.com/technology/pilot-plant/",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2017",
      "yearNumber": 2017,
      "year": "2017",
      "label": "动态模型揭示部件效率的连锁影响",
      "title": "动态模型揭示部件效率的连锁影响",
      "copy": "Applied Energy第185卷（2017-01-01）研究填充床蓄热与系统动态性能；计算中蓄热效率95%时，往返效率约70%。这是特定模型条件，不能作为全部绝热CAES的保证值。",
      "facts": [
        [
          "约70%",
          "动态模型往返效率 · 蓄热效率95%"
        ]
      ],
      "detail": "Applied Energy第185卷（2017-01-01）研究填充床蓄热与系统动态性能；计算中蓄热效率95%时，往返效率约70%。这是特定模型条件，不能作为全部绝热CAES的保证值。",
      "source": "https://www.sciencedirect.com/science/article/pii/S0306261916315021",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "显热和相变蓄热给出试验细节",
      "title": "显热和相变蓄热给出试验细节",
      "copy": "Geissbühler等Part 1及配套Part 2发表。Part 2显热容量11.6 MWh_th、相变部分171.5 kWh_th，测试4次约3小时充放热循环、入口最高566°C；相变单元改善出口温度下降，但出现封装焊缝/测温孔泄漏与相变材料变化。",
      "facts": [
        [
          "11.6MWhₜₕ",
          "显热试验储热容量"
        ],
        [
          "171.5kWhₜₕ",
          "相变试验储热容量"
        ],
        [
          "最高566°C",
          "4次约3h充放热循环 · 非电容量"
        ]
      ],
      "detail": "Geissbühler等Part 1及配套Part 2发表。Part 2显热容量11.6 MWh_th、相变部分171.5 kWh_th，测试4次约3小时充放热循环、入口最高566°C；相变单元改善出口温度下降，但出现封装焊缝/测温孔泄漏与相变材料变化。热容量不能写成电站电容量。",
      "source": "https://www.sciencedirect.com/science/article/pii/S2352152X17305571",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2019",
      "yearNumber": 2019,
      "year": "2019",
      "label": "Goderich先进CAES运行",
      "title": "Goderich先进CAES运行",
      "copy": "Goderich参考站2019年运行，放电1.75MW、充电2.2MW。公司列储能量超过10MWh，合同容量另为7MWh。",
      "facts": [
        [
          "1.75MW / 2.2MW",
          "放电/充电功率分别计量"
        ],
        [
          ">10MWh / 7MWh",
          "储能量/合同容量，不同边界"
        ]
      ],
      "detail": "Goderich参考站2019年运行，放电1.75MW、充电2.2MW。公司列储能量超过10MWh，合同容量另为7MWh。",
      "source": "https://hydrostor.ca/hydrostor-nrstor-complete-a-caes-plant-in-canada/",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "张家口100 MW系统并网",
      "title": "张家口100 MW系统并网",
      "copy": "中国科学院2022-09-30发布100 MW先进CAES并网发电消息；同年7月研究所已完成额定100 MW、多级再热膨胀机动态调试。区分部件调试与电站并网；这里不拼接未经同页确认的年发电量或效率。",
      "facts": [
        [
          "100MW",
          "张家口先进系统并网 · 2022-09-30"
        ]
      ],
      "detail": "中国科学院2022-09-30发布100 MW先进CAES并网发电消息；同年7月研究所已完成额定100 MW、多级再热膨胀机动态调试。区分部件调试与电站并网；这里不拼接未经同页确认的年发电量或效率。",
      "source": "https://english.cas.ac.cn/special-reports/Dual_Carbon_CAS_in_Action/cpcn/202603/t20260305_1151694.shtml",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "300 MW膨胀机完成集成测试",
      "title": "300 MW膨胀机完成集成测试",
      "copy": "工程热物理所宣布300 MW先进压气储能膨胀机集成测试完成，说明关键旋转设备向更大功率放大；不能据此认定相应电站当年已商业运行。",
      "facts": [
        [
          "300MW",
          "膨胀机集成测试 · 部件阶段"
        ]
      ],
      "detail": "工程热物理所宣布300 MW先进压气储能膨胀机集成测试完成，说明关键旋转设备向更大功率放大；不能据此认定相应电站当年已商业运行。",
      "source": "https://english.iet.cas.cn/research_22384/researchprogress/202308/t20230821_335137.html",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "应城首次并网",
      "title": "应城首次并网",
      "copy": "应城300 MW示范工程2024-04-09并网。该日期对应首次并网；全功率商业运行发生于次年。",
      "facts": [
        [
          "2024-04-09",
          "应城首次并网 · 非次年全功率商运"
        ]
      ],
      "detail": "应城300 MW示范工程2024-04-09并网。该日期对应首次并网；全功率商业运行发生于次年。",
      "source": "https://www.cas.cn/syky/202501/t20250110_5044720.shtml",
      "subject": "route:caes-adiabatic:history"
    },
    {
      "id": "caes-adiabatic-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "应城进入全功率商业运行",
      "title": "应城进入全功率商业运行",
      "copy": "2025-01-09，应城正式启动两座地下盐穴注采气并全功率并网。公布300 MW/1500 MWh、约70%系统转换效率、储能8小时/释能5小时；来源未给出约70%的完整测试边界，因此标为工程披露值，不标独立第三方实测。",
      "facts": [
        [
          "300MW / 1500MWh",
          "应城2025-01-09全功率商运"
        ],
        [
          "约70%",
          "系统转换效率：工程披露，测试边界未完整给出"
        ],
        [
          "储8h / 释5h",
          "两种运行阶段时长，非同一充放电时间"
        ]
      ],
      "detail": "2025-01-09，应城正式启动两座地下盐穴注采气并全功率并网。公布300 MW/1500 MWh、约70%系统转换效率、储能8小时/释能5小时；来源未给出约70%的完整测试边界，因此标为工程披露值，不标独立第三方实测。",
      "source": "https://www.cas.cn/syky/202501/t20250110_5044720.shtml",
      "subject": "route:caes-adiabatic:history"
    }
  ],
  "materials": [
    {
      "id": "caes-adiabatic-air",
      "label": "空气与储气洞室",
      "title": "空气与储气洞室",
      "copy": "空气压力承载可释放能量；洞室围岩、密封、注采井和运行压力窗口决定可用气量。盐穴与人工岩洞是不同工程方案，不能把盐穴指标通用于任何地下空间。",
      "facts": [
        [
          "盐穴 / 岩洞",
          "应城/ALACAES不同储气空间，条件不互换"
        ]
      ],
      "subject": "material:caes-adiabatic-air",
      "year": "部件"
    },
    {
      "id": "caes-adiabatic-thermal",
      "label": "蓄热填充床与相变封装",
      "title": "蓄热填充床与相变封装",
      "copy": "显热床靠温度变化存热；相变材料靠相变潜热调节放热温度。2018研究的Al–Cu–Si合金装在296根不锈钢管中，解决热释放温度变化，也新增封装与材料稳定性问题。",
      "facts": [
        [
          "296根不锈钢管",
          "2018试验的Al–Cu–Si相变合金封装"
        ],
        [
          "11.6MWhₜₕ / 171.5kWhₜₕ",
          "该试验显热/相变热容量，非电容量"
        ]
      ],
      "subject": "material:caes-adiabatic-thermal",
      "year": "部件"
    },
    {
      "id": "caes-adiabatic-machinery",
      "label": "多级压缩与多级再热膨胀机",
      "title": "多级压缩与多级再热膨胀机",
      "copy": "压缩把电转为高压空气及热；释能前分级加热，降低单级运行偏离设计点的损失。中国科学院100 MW膨胀机采用多级再热结构，2023年进一步测试300 MW设备。",
      "facts": [
        [
          "100MW",
          "2022多级再热膨胀机动态调试"
        ],
        [
          "300MW",
          "2023膨胀机集成测试，独立设备阶段"
        ]
      ],
      "subject": "material:caes-adiabatic-machinery",
      "year": "部件"
    },
    {
      "id": "caes-adiabatic-heat-exchanger",
      "label": "换热器与热管理",
      "title": "换热器与热管理",
      "copy": "储气与蓄热必须配合：热回收不足会降低膨胀前温度，换热压降增加压缩需求，温度前沿移动改变充放电末段性能。2017动态模型提供“95%蓄热效率→约70%往返效率”的条件关系；不要将95%显示为电到电效率。",
      "facts": [
        [
          "95%",
          "2017动态模型蓄热效率"
        ],
        [
          "约70%",
          "同条件模型往返效率，非实测"
        ]
      ],
      "subject": "material:caes-adiabatic-heat-exchanger",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "caes-adiabatic-hydrostor",
      "label": "Hydrostor",
      "year": "2019",
      "title": "Goderich先进CAES运行站",
      "copy": "加拿大长时储能开发商，开发和运营以压缩空气、水和热管理为核心的先进压缩空气储能（A-CAES）。",
      "facts": [
        [
          "1.75MW / >10MWh",
          "放电功率/储能量 · 合同容量另为7MWh"
        ],
        [
          "2.2MW",
          "充电功率，与放电功率分开"
        ]
      ],
      "subject": "company:caes-adiabatic-hydrostor"
    },
    {
      "id": "caes-adiabatic-iet-cas",
      "label": "中科院工程热物理所",
      "year": "2022",
      "title": "张家口先进CAES示范",
      "copy": "中国科学院工程热物理研究所研发张家口先进压缩空气储能示范项目；属于科研机构，不是上市公司。",
      "facts": [
        [
          "100MW / 400MWh",
          "2022-09-30并网 · 4h额定配置"
        ]
      ],
      "subject": "company:caes-adiabatic-iet-cas"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "绝热压缩空气 · 发展与工程时间线",
      "content": "### 2010：ADELE把热管理放到系统中心\n\nDLR、RWE、GE、Züblin启动绝热压气储能合作，提出最大200 MW、1 GWh示范目标。关键转变是保留压缩热以替代传统燃烧补热；这是研发目标，不是2010年已建成200 MW电站。原始日期2010-01-20。\n\n### 2013：兆瓦级先进系统与ADELE工程研究\n\n中国科学院工程热物理所官方回顾列出2013年1.5 MW先进压缩空气系统；同年DLR的ADELE-ING进入工程研究阶段。设备放大和热储存可靠性成为独立研发任务，不能把早期ADELE建设计划写成已投产。\n\n### 2016：瑞士洞室与蓄热联合试验\n\nALACAES在2016年建成并测试试验设施，把热储存置于加压洞室区域。其主要证据是储气及热储存试验，不应写为完整商业电站已测得72%电到电效率。同年工程热物理所官方回顾列出10 MW系统。\n\n### 2017：动态模型揭示部件效率的连锁影响\n\nApplied Energy第185卷（2017-01-01）研究填充床蓄热与系统动态性能；计算中蓄热效率95%时，往返效率约70%。这是特定模型条件，不能作为全部绝热CAES的保证值。\n\n### 2018：显热和相变蓄热给出试验细节\n\nGeissbühler等Part 1及配套Part 2发表。Part 2显热容量11.6 MWh_th、相变部分171.5 kWh_th，测试4次约3小时充放热循环、入口最高566°C；相变单元改善出口温度下降，但出现封装焊缝/测温孔泄漏与相变材料变化。热容量不能写成电站电容量。\n\n### 2022：张家口100 MW系统并网\n\n中国科学院2022-09-30发布100 MW先进CAES并网发电消息；同年7月研究所已完成额定100 MW、多级再热膨胀机动态调试。区分部件调试与电站并网；这里不拼接未经同页确认的年发电量或效率。\n\n### 2023：300 MW膨胀机完成集成测试\n\n工程热物理所宣布300 MW先进压气储能膨胀机集成测试完成，说明关键旋转设备向更大功率放大；不能据此认定相应电站当年已商业运行。\n\n### 2024：应城首次并网\n\n应城300 MW示范工程2024-04-09并网。该日期对应首次并网；全功率商业运行发生于次年。\n\n### 2025：应城进入全功率商业运行\n\n2025-01-09，应城正式启动两座地下盐穴注采气并全功率并网。公布300 MW/1500 MWh、约70%系统转换效率、储能8小时/释能5小时；来源未给出约70%的完整测试边界，因此标为工程披露值，不标独立第三方实测。\n\n原始来源 · [原始资料 1](https://www.dlr.de/de/aktuelles/nachrichten/2010/20100120_adele-liefert-strom-wenn-er-dringend-gebraucht-wird_22107/%40%40download/file) · [原始资料 2](https://english.iet.cas.cn/research_22384/researchprogress/202308/t20230821_335137.html) · [原始资料 3](https://www.dlr.de/de/aktuelles/nachrichten/2013/20130110_start-von-adele-ing-entwicklung-des-adiabaten-druckluftspeichers-erreicht-die-naechste-phase_6034/%40%40download/file) · [原始资料 4](https://alacaes.com/technology/pilot-plant/) · [原始资料 5](https://www.sciencedirect.com/science/article/pii/S0306261916315021) · [原始资料 6](https://doi.org/10.1016/j.apenergy.2016.10.058) · [原始资料 7](https://www.sciencedirect.com/science/article/pii/S2352152X17305571) · [原始资料 8](https://doi.org/10.1016/j.est.2018.02.003) · [原始资料 9](https://english.cas.ac.cn/special-reports/Dual_Carbon_CAS_in_Action/cpcn/202603/t20260305_1151694.shtml) · [原始资料 10](https://www.iet.cas.cn/news/zh/202207/t20220722_6490811.html) · [原始资料 11](https://www.cas.cn/syky/202501/t20250110_5044720.shtml)\n\n### 2019：Goderich先进CAES运行\n\nGoderich参考站2019年运行，放电1.75MW、充电2.2MW。公司列储能量超过10MWh，合同容量另为7MWh。\n\n原始来源 · [Goderich先进CAES运行](https://hydrostor.ca/hydrostor-nrstor-complete-a-caes-plant-in-canada/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "绝热压缩空气 · 储能介质与关键部件",
      "content": "### 空气与储气洞室\n空气压力承载可释放能量；洞室围岩、密封、注采井和运行压力窗口决定可用气量。盐穴与人工岩洞是不同工程方案，不能把盐穴指标通用于任何地下空间。应城采用废弃盐矿洞穴，瑞士试验采用岩洞。\n\n### 蓄热填充床与相变封装\n显热床靠温度变化存热；相变材料靠相变潜热调节放热温度。2018研究的Al–Cu–Si合金装在296根不锈钢管中，解决热释放温度变化，也新增封装与材料稳定性问题。这里只对应该试验，不将合金指定为所有商业项目材料。\n\n### 多级压缩与多级再热膨胀机\n压缩把电转为高压空气及热；释能前分级加热，降低单级运行偏离设计点的损失。中国科学院100 MW膨胀机采用多级再热结构，2023年进一步测试300 MW设备。额定功率是部件/机组规格，不能直接证明完整电站每次都按额定工作。\n\n### 换热器与热管理\n储气与蓄热必须配合：热回收不足会降低膨胀前温度，换热压降增加压缩需求，温度前沿移动改变充放电末段性能。2017动态模型提供“95%蓄热效率→约70%往返效率”的条件关系；不要将95%显示为电到电效率。\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S0306261916315021) · [原始资料 2](https://doi.org/10.1016/j.apenergy.2016.10.058) · [原始资料 3](https://www.sciencedirect.com/science/article/pii/S2352152X17305571) · [原始资料 4](https://doi.org/10.1016/j.est.2018.02.003) · [原始资料 5](https://english.iet.cas.cn/research_22384/researchprogress/202308/t20230821_335137.html) · [原始资料 6](https://alacaes.com/technology/pilot-plant/) · [原始资料 7](https://www.iet.cas.cn/news/zh/202207/t20220722_6490811.html) · [原始资料 8](https://www.cas.cn/syky/202501/t20250110_5044720.shtml)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "绝热压缩空气 · 原始研究与条件对照",
      "content": "| 原始论文 | 核心结果 | 条件与未解决问题 |\n|---|---|---|\n| Sciacovelli等，2017，Dynamic simulation…；DOI 10.1016/j.apenergy.2016.10.058 | 填充床热储存与系统动态相耦合；模型约70%往返效率 | 对应蓄热效率95%的模型条件，非运营年均值 |\n| Geissbühler等，2018，Pilot-scale…Part 1；DOI 10.1016/j.est.2018.02.004； | 洞室和显热储存的试验验证 | 完整系统效率采用实测热储存加其他部件性能估算；不能称完整商业机组实测 |\n| Pilot-scale…Part 2，2018；DOI 10.1016/j.est.2018.02.003 | 11.6 MWh_th显热+171.5 kWh_th潜热，4次约3 h循环，最高566°C | 相变段减缓出口温降，同时观察到泄漏及材料降解/相分离；短试验不证明多年寿命 |\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S2352152X17305546) · [原始资料 2](https://doi.org/10.1016/j.apenergy.2016.10.058) · [原始资料 3](https://doi.org/10.1016/j.est.2018.02.004) · [原始资料 4](https://doi.org/10.1016/j.est.2018.02.003) · [原始资料 5](https://www.sciencedirect.com/science/article/pii/S0306261916315021) · [原始资料 6](https://www.sciencedirect.com/science/article/pii/S2352152X17305571)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "绝热压缩空气 · 企业、研究机构与工程",
      "content": "### Hydrostor\n\n加拿大长时储能开发商，开发和运营以压缩空气、水和热管理为核心的先进压缩空气储能（A-CAES）。\n\nGoderich于2019年投运，放电1.75MW、充电2.2MW、容量超过10MWh；合同容量7MWh。Silver City 200MW/1,600MWh仍为开发项目。\n\n- **1.75MW / >10MWh** · 放电功率/储能量 · 合同容量另为7MWh\n- **2.2MW** · 充电功率，与放电功率分开\n\n原始来源 · [公司与投资者](https://hydrostor.ca/our-company/) · [Goderich状态与数据](https://hydrostor.ca/project/the-goderich-a-caes-facility/) · [Silver City项目公告](https://hydrostor.ca/hydrostor-acquires-100-ownership-of-the-silver-city-energy-storage-centre/)\n\n### 中科院工程热物理所\n\n中国科学院工程热物理研究所研发张家口先进压缩空气储能示范项目；属于科研机构，不是上市公司。\n\n张家口项目于2022-09-30并网并具备商业运行条件，100MW/400MWh；采用人工储气装置并回收压缩热，降低常规CAES燃气复热依赖。\n\n- **100MW / 400MWh** · 2022-09-30并网 · 4h额定配置\n\n原始来源 · [CAS项目说明](https://english.cas.cn/Special_Reports/rd/2022/202410/t20241031_693356.shtml) · [CAS中文报道](https://www.cas.cn/cm/202210/t20221001_4849738.shtml)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "绝热压缩空气 · 政策机制与市场背景",
      "content": "### 适用机制与工程阶段\n\n中国国家能源局2026-01-30总结2025年新型储能，30万千瓦级压缩空气已进入商业运行；市场全技术总量仅作新型储能背景，不能当作绝热CAES装机。\n\n工程放大并不消除选址约束：洞室建设、热储存、旋转设备与并网服务需共同形成收益。对外部热源辅助或其他先进CAES变体，应在工程卡写清热源，避免全部归为同一热力循环。\n\n原始来源 · [原始资料 1](https://www.nea.gov.cn/20260130/50f657ce87f848e1a9a1861d1fd9aa23/c.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "绝热压缩空气 · 系统能力与应用条件",
      "content": "### 介质、功率与运行条件\n\n适合具备储气空间的小时级、百兆瓦级能量移时；与常规CAES相比，压缩热回收可减少或替代放电燃烧补热。较长待机时热损失及温度分层影响下一次释放，不能仅以地下空气“不自放电”推断整站无损待机。比较应城的1500 MWh电容量与瑞士11.6 MWh_th热容量时，必须分两列。用于系统配置时需要洞室可用气量、热储存可用温度、机组部分负荷效率三者联合约束。\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S0306261916315021) · [原始资料 2](https://doi.org/10.1016/j.apenergy.2016.10.058) · [原始资料 3](https://www.sciencedirect.com/science/article/pii/S2352152X17305571) · [原始资料 4](https://doi.org/10.1016/j.est.2018.02.003) · [原始资料 5](https://hydrostor.ca/our-company/) · [原始资料 6](https://hydrostor.ca/project/the-goderich-a-caes-facility/) · [原始资料 7](https://hydrostor.ca/hydrostor-acquires-100-ownership-of-the-silver-city-energy-storage-centre/) · [原始资料 8](https://english.cas.cn/Special_Reports/rd/2022/202410/t20241031_693356.shtml) · [原始资料 9](https://www.cas.cn/cm/202210/t20221001_4849738.shtml)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "caes-adiabatic-policy",
    "label": "政策市场",
    "title": "压缩空气商运进入国家能源局年度总结",
    "year": "2025",
    "copy": "2025年中国30万千瓦级压缩空气工程进入商业运行，国家能源局于2026年1月公布进展。图中的全国新型储能总量覆盖全部技术。",
    "facts": [
      [
        "300MW级",
        "NEA年度总结中的先进压气工程 · 非全行业CAES总装机"
      ]
    ],
    "subject": "scene:caes-adiabatic-policy"
  },
  "market": {
    "id": "caes-adiabatic-market",
    "label": "中国新型储能（全部技术）",
    "title": "全国行业背景",
    "copy": "2025年底中国新型储能累计功率136GW、能量351GWh。统计覆盖全部新型储能技术，平均时长2.58h，不表示当前机械路线的装机或时长。",
    "year": "2025",
    "facts": [
      [
        "136GW / 351GWh",
        "中国2025年底全部新型储能累计功率/能量"
      ],
      [
        "2.58h",
        "全部技术平均配置时长 · 非当前路线指标"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "caes-adiabatic-papers",
    "label": "论文",
    "title": "蓄热试验和动态模型分别阅读",
    "year": "证据",
    "copy": "填充床动态模型与洞室蓄热试验展示热管理作用。热容量、模型往返效率和工程披露按各自口径阅读。",
    "facts": [
      [
        "11.6MWhₜₕ / 171.5kWhₜₕ",
        "2018显热/相变试验热容量，非电容量"
      ],
      [
        "约70%",
        "2017模型结果 · 蓄热效率95%"
      ]
    ],
    "subject": "route:caes-adiabatic:history"
  },
  "storage": {
    "id": "caes-adiabatic-storage",
    "label": "储能适配",
    "title": "压缩热回收与地下储气共同约束释能",
    "year": "应用",
    "copy": "适合具备储气空间的小时级、百兆瓦级能量移时；与常规CAES相比，压缩热回收可减少或替代放电燃烧补热。较长待机时热损失及温度分层影响下一次释放，不能仅以地下空气“不自放电”推断整站无损待机。",
    "facts": [
      [
        "300MW / 1500MWh",
        "应城2025全功率商运工程披露"
      ],
      [
        "储8h / 释5h",
        "工程披露的储能/释能阶段时长"
      ]
    ],
    "subject": "route:caes-adiabatic:history"
  },
  "historySubject": "route:caes-adiabatic:history",
  "note": "10个确证年份 · 机械介质与工程条件"
};

export const conventionalCaesResearch: ChronicleResearch = {
  "name": "常规压缩空气",
  "timeline": [
    {
      "id": "caes-conventional-1978",
      "yearNumber": 1978,
      "year": "1978",
      "label": "Huntorf开启商业CAES",
      "title": "Huntorf开启商业CAES",
      "copy": "德国Huntorf开始运行。Uniper将其确认为首座此类工程；现资产表列技术容量321 MW，不能倒填为1978年初始额定容量。",
      "facts": [
        [
          "1978",
          "Huntorf开始运行 · 现役容量另行观察"
        ],
        [
          "压缩电力 + 燃料",
          "两种能量输入，放电含燃烧补热"
        ]
      ],
      "detail": "德国Huntorf开始运行。Uniper将其确认为首座此类工程；现资产表列技术容量321 MW，不能倒填为1978年初始额定容量。地下储气把压缩与发电时段分离，但放电仍用燃料补热。",
      "source": "https://www.uniper.energy/energy-storage-uniper",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-1991",
      "yearNumber": 1991,
      "year": "1991",
      "label": "McIntosh引入排气余热回收",
      "title": "McIntosh引入排气余热回收",
      "copy": "美国McIntosh 110 MW工程投入运行，回热器利用排气预热高压空气，减少燃料需求。110 MW是CAES单元，不能把同站新增常规燃气轮机一并计作CAES规模。",
      "facts": [
        [
          "110MW",
          "McIntosh CAES单元 · 排气余热回收"
        ]
      ],
      "detail": "美国McIntosh 110 MW工程投入运行，回热器利用排气预热高压空气，减少燃料需求。110 MW是CAES单元，不能把同站新增常规燃气轮机一并计作CAES规模。DOE资料与原始工程研究支持其1991年及110 MW信息。",
      "source": "https://www.hydrogen.energy.gov/pdfs/htac_feb_23_10_analysis.pdf",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2003",
      "yearNumber": 2003,
      "year": "2003",
      "label": "Iowa启动含水层工程设计",
      "title": "Iowa启动含水层工程设计",
      "copy": "Iowa Stored Energy Park开展概念设计，拟建设270 MW项目。不同于盐穴，该方案依赖含水层储气；这是项目开发史节点，并未建成。",
      "facts": [
        [
          "270MW",
          "Iowa原拟工程规模，未建成"
        ]
      ],
      "detail": "Iowa Stored Energy Park开展概念设计，拟建设270 MW项目。不同于盐穴，该方案依赖含水层储气；这是项目开发史节点，并未建成。",
      "source": "https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2010",
      "yearNumber": 2010,
      "year": "2010",
      "label": "美国示范支持进入监管程序",
      "title": "美国示范支持进入监管程序",
      "copy": "2010-01-21加州公用事业委员会批准PG&E为DOE压气储能项目提供配套支持。政策支持推动地质与可行性研究，批准支持不等于项目运行。",
      "facts": [
        [
          "2010-01-21",
          "CPUC示范研究配套支持，非投运"
        ]
      ],
      "detail": "2010-01-21加州公用事业委员会批准PG&E为DOE压气储能项目提供配套支持。政策支持推动地质与可行性研究，批准支持不等于项目运行。",
      "source": "https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/infrastructure/smart-grid-landing-page",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "Iowa因地质限制终止",
      "title": "Iowa因地质限制终止",
      "copy": "2011-07-28项目终止，270 MW只是原拟规模。项目表明地层存在并不代表满足储气注采能力；前期地质风险可以改变整个商业可行性。",
      "facts": [
        [
          "2011-07-28",
          "Iowa开发终止 · 地质约束"
        ]
      ],
      "detail": "2011-07-28项目终止，270 MW只是原拟规模。项目表明地层存在并不代表满足储气注采能力；前期地质风险可以改变整个商业可行性。",
      "source": "https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2012",
      "yearNumber": 2012,
      "year": "2012",
      "label": "地质和市场教训成为公开报告",
      "title": "地质和市场教训成为公开报告",
      "copy": "Sandia系统整理Iowa八年开发的经验，连接储气地质、设备规模、电力市场与融资。该年是研究报告出版，不是新电站投产。",
      "facts": [
        [
          "270MW / 4亿美元",
          "Sandia复盘中的拟议工程参数，非投运/报价"
        ]
      ],
      "detail": "Sandia系统整理Iowa八年开发的经验，连接储气地质、设备规模、电力市场与融资。该年是研究报告出版，不是新电站投产。原报告题为Lessons from Iowa: Development of a 270 Megawatt Compressed Air Energy Storage Project…。",
      "source": "https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2019",
      "yearNumber": 2019,
      "year": "2019",
      "label": "洞室动态模型进入优化研究",
      "title": "洞室动态模型进入优化研究",
      "copy": "原始论文An accurate bilinear cavern model for compressed air energy storage研究洞室动态描述。单一固定“电池SOC”难以完整表示温压变化；可用于规划调度的模型必须保留储气状态约束。",
      "facts": [
        [
          "温度 + 压力",
          "洞室动态状态模型，非固定SOC假设"
        ]
      ],
      "detail": "原始论文An accurate bilinear cavern model for compressed air energy storage研究洞室动态描述。单一固定“电池SOC”难以完整表示温压变化；可用于规划调度的模型必须保留储气状态约束。",
      "source": "https://www.sciencedirect.com/science/article/pii/S0306261919305094",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2020",
      "yearNumber": 2020,
      "year": "2020",
      "label": "Huntorf改进方案接受热力评估",
      "title": "Huntorf改进方案接受热力评估",
      "copy": "Assessment of Huntorf compressed air energy storage plant performance under enhanced modifications比较改造方案及回热路径。这是模型/改造研究，不能将算出的改进绩效写成电站已完成改造实测。",
      "facts": [
        [
          "回热改造评估",
          "Huntorf热力模型研究 · 含燃料边界"
        ]
      ],
      "detail": "Assessment of Huntorf compressed air energy storage plant performance under enhanced modifications比较改造方案及回热路径。这是模型/改造研究，不能将算出的改进绩效写成电站已完成改造实测。",
      "source": "https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004",
      "subject": "route:caes-conventional:history"
    },
    {
      "id": "caes-conventional-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "既有工程仍在资产组合中",
      "title": "既有工程仍在资产组合中",
      "copy": "Uniper FY2025资产表（2026年3月发布）继续列Huntorf 321 MW、投运1978年。这里只证明该报告中的既有资产记录，不新增一座321 MW工程，也不推断全年可用率。",
      "facts": [
        [
          "321MW",
          "FY2025资产表：Huntorf既有资产"
        ],
        [
          "2026年3月发布",
          "报告年度与发布年份分别保留"
        ]
      ],
      "detail": "Uniper FY2025资产表（2026年3月发布）继续列Huntorf 321 MW、投运1978年。这里只证明该报告中的既有资产记录，不新增一座321 MW工程，也不推断全年可用率。",
      "source": "https://www.uniper.energy/system/files/2026-03/2026_03_11_FY_2025_Uniper_List_of_Assets_Edition_2025.pdf",
      "subject": "route:caes-conventional:history"
    }
  ],
  "materials": [
    {
      "id": "caes-conventional-air",
      "label": "压缩空气与地层",
      "title": "压缩空气与地层",
      "copy": "空气在洞室形成压力势能；盐穴、含水层或衬砌岩洞的密封与注采条件不同。Iowa的终止使地质筛选成为具体经验，而非抽象风险。",
      "facts": [
        [
          "盐穴 / 含水层",
          "Huntorf运行方案/Iowa终止开发案例"
        ]
      ],
      "subject": "material:caes-conventional-air",
      "year": "部件"
    },
    {
      "id": "caes-conventional-compressor",
      "label": "压缩机与冷却",
      "title": "压缩机与冷却",
      "copy": "常规路线在充电时压缩空气，并排出大量压缩热；冷却有利于降低后续压缩功和储气温度，却使释能前需要再次补热。与绝热路线的差别主要在热管理，不是有没有空气压缩机。",
      "facts": [
        [
          "排出压缩热",
          "常规充电压缩与冷却，释能另需补热"
        ]
      ],
      "subject": "material:caes-conventional-compressor",
      "year": "部件"
    },
    {
      "id": "caes-conventional-combustor",
      "label": "燃烧室与膨胀机",
      "title": "燃烧室与膨胀机",
      "copy": "燃烧给高压空气补热后膨胀发电。输出电量含充电电力和燃料共同贡献，不能仅用输出电量除以充电电量就称无条件往返效率，也不能由电站名称推断零排放。",
      "facts": [
        [
          "天然气复热",
          "放电含燃料能量输入"
        ]
      ],
      "subject": "material:caes-conventional-combustor",
      "year": "部件"
    },
    {
      "id": "caes-conventional-recuperator",
      "label": "回热器与控制",
      "title": "回热器与控制",
      "copy": "McIntosh的回热器回收排气热，提高进入燃烧段空气温度，降低追加燃料需求；它与存储压缩热的独立蓄热系统不同。洞室压力变化影响流量与膨胀机工况，运行控制需共同管理电力输入、燃料和储气状态。",
      "facts": [
        [
          "排气余热回收",
          "McIntosh预热路径，与压缩热蓄热不同"
        ]
      ],
      "subject": "material:caes-conventional-recuperator",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "caes-conventional-uniper",
      "label": "Uniper",
      "year": "工程",
      "title": "Huntorf燃料补热CAES",
      "copy": "德国Uniper运营Huntorf压缩空气储能电站；盐穴储气，放电时天然气复热，属于传统补燃CAES。",
      "facts": [
        [
          "321MW",
          "FY2025现役资产表 · 非1978初始容量"
        ]
      ],
      "subject": "company:caes-conventional-uniper"
    },
    {
      "id": "caes-conventional-powersouth",
      "label": "PowerSouth",
      "year": "1991",
      "title": "McIntosh CAES与排气回热",
      "copy": "美国PowerSouth Energy Cooperative为成员制发电与输电合作社，拥有并运营阿拉巴马州McIntosh CAES机组。",
      "facts": [
        [
          "110MW",
          "CAES单元，不含同址常规燃气机组"
        ]
      ],
      "subject": "company:caes-conventional-powersouth"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "常规压缩空气 · 发展与工程时间线",
      "content": "### 1978：Huntorf开启商业CAES\n\n德国Huntorf开始运行。Uniper将其确认为首座此类工程；现资产表列技术容量321 MW，不能倒填为1978年初始额定容量。地下储气把压缩与发电时段分离，但放电仍用燃料补热。\n\n### 1991：McIntosh引入排气余热回收\n\n美国McIntosh 110 MW工程投入运行，回热器利用排气预热高压空气，减少燃料需求。110 MW是CAES单元，不能把同站新增常规燃气轮机一并计作CAES规模。DOE资料与原始工程研究支持其1991年及110 MW信息。\n\n### 2003：Iowa启动含水层工程设计\n\nIowa Stored Energy Park开展概念设计，拟建设270 MW项目。不同于盐穴，该方案依赖含水层储气；这是项目开发史节点，并未建成。\n\n### 2010：美国示范支持进入监管程序\n\n2010-01-21加州公用事业委员会批准PG&E为DOE压气储能项目提供配套支持。政策支持推动地质与可行性研究，批准支持不等于项目运行。\n\n### 2011：Iowa因地质限制终止\n\n2011-07-28项目终止，270 MW只是原拟规模。项目表明地层存在并不代表满足储气注采能力；前期地质风险可以改变整个商业可行性。\n\n### 2012：地质和市场教训成为公开报告\n\nSandia系统整理Iowa八年开发的经验，连接储气地质、设备规模、电力市场与融资。该年是研究报告出版，不是新电站投产。原报告题为Lessons from Iowa: Development of a 270 Megawatt Compressed Air Energy Storage Project…。\n\n### 2019：洞室动态模型进入优化研究\n\n原始论文An accurate bilinear cavern model for compressed air energy storage研究洞室动态描述。单一固定“电池SOC”难以完整表示温压变化；可用于规划调度的模型必须保留储气状态约束。\n\n### 2020：Huntorf改进方案接受热力评估\n\nAssessment of Huntorf compressed air energy storage plant performance under enhanced modifications比较改造方案及回热路径。这是模型/改造研究，不能将算出的改进绩效写成电站已完成改造实测。\n\n### 2025：既有工程仍在资产组合中\n\nUniper FY2025资产表（2026年3月发布）继续列Huntorf 321 MW、投运1978年。这里只证明该报告中的既有资产记录，不新增一座321 MW工程，也不推断全年可用率。\n\n原始来源 · [原始资料 1](https://www.uniper.energy/energy-storage-uniper) · [原始资料 2](https://www.uniper.energy/system/files/2026-03/2026_03_11_FY_2025_Uniper_List_of_Assets_Edition_2025.pdf) · [原始资料 3](https://www.hydrogen.energy.gov/pdfs/htac_feb_23_10_analysis.pdf) · [原始资料 4](https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004) · [原始资料 5](https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf) · [原始资料 6](https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/infrastructure/smart-grid-landing-page) · [原始资料 7](https://www.sciencedirect.com/science/article/pii/S0306261919305094)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "常规压缩空气 · 储能介质与关键部件",
      "content": "### 压缩空气与地层\n空气在洞室形成压力势能；盐穴、含水层或衬砌岩洞的密封与注采条件不同。Iowa的终止使地质筛选成为具体经验，而非抽象风险。不能由地层体积直接算成可发电MWh，还需压力窗口、空气温度、机组及燃料条件。\n\n### 压缩机与冷却\n常规路线在充电时压缩空气，并排出大量压缩热；冷却有利于降低后续压缩功和储气温度，却使释能前需要再次补热。与绝热路线的差别主要在热管理，不是有没有空气压缩机。\n\n### 燃烧室与膨胀机\n燃烧给高压空气补热后膨胀发电。输出电量含充电电力和燃料共同贡献，不能仅用输出电量除以充电电量就称无条件往返效率，也不能由电站名称推断零排放。来源同手册及2020原始研究。\n\n### 回热器与控制\nMcIntosh的回热器回收排气热，提高进入燃烧段空气温度，降低追加燃料需求；它与存储压缩热的独立蓄热系统不同。洞室压力变化影响流量与膨胀机工况，运行控制需共同管理电力输入、燃料和储气状态。\n\n原始来源 · [原始资料 1](https://www.energy.gov/sites/default/files/2013/08/f2/ElecStorageHndbk2013.pdf) · [原始资料 2](https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004) · [原始资料 3](https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf) · [原始资料 4](https://www.sciencedirect.com/science/article/pii/S0306261919305094)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "常规压缩空气 · 原始研究与条件对照",
      "content": "| 原始资料 | 研究贡献 | 可呈现的指标及边界 |\n|---|---|---|\n| Sandia，2012，SAND2012-0388 | 完整复盘Iowa开发、地质检验和终止 | 270 MW、4亿美元为拟议工程参数；2015为原计划投产年份，实际未建成 |\n| An accurate bilinear cavern model…，2019 | 面向储气状态变化的可计算模型 | 模型研究，误差依原文工况判断； |\n| Assessment of Huntorf…，2020 | 讨论Huntorf改造及回热器作用 | 原文背景比较常见42%与54%效率，但含燃料定义与设定不同；本页不做与电池AC效率的排行； |\n| DOE/EPRI，2013，Electricity Storage Handbook | 给出工程配置、服务与成本分析边界 | 文献当年参数，非2026报价； |\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S0306261919305094) · [原始资料 2](https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004) · [原始资料 3](https://www.energy.gov/sites/default/files/2013/08/f2/ElecStorageHndbk2013.pdf) · [原始资料 4](https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "常规压缩空气 · 企业、研究机构与工程",
      "content": "### Uniper\n\n德国Uniper运营Huntorf压缩空气储能电站；盐穴储气，放电时天然气复热，属于传统补燃CAES。\n\nHuntorf自1978年投运；Uniper当前页面列321MW、两座盐穴，满功率启动约12分钟。\n\n- **321MW** · FY2025现役资产表 · 非1978初始容量\n\n原始来源 · [Uniper Huntorf设施](https://www.uniper.energy/about-uniper/projects/energy-transformation-hub-northwest) · [Uniper储能与投运信息](https://www.uniper.energy/energy-storage-uniper) · [EWE与Uniper合作说明](https://www.ewe.com/en/media-center/press-releases/2021/04/ewe-and-uniper-plan-to-build-hydrogen-hub-at-huntorf-site-ewe-ag)\n\n### PowerSouth\n\n美国PowerSouth Energy Cooperative为成员制发电与输电合作社，拥有并运营阿拉巴马州McIntosh CAES机组。\n\nMcIntosh CAES于1991年投运，发电功率110MW、设计最长放电约26小时；不与同址燃气机组总装机混为一谈。\n\n- **110MW** · CAES单元，不含同址常规燃气机组\n\n原始来源 · [成员合作社McIntosh设施说明](https://www.gcec.com/about-us/our-cooperative/power-generation/) · [阿拉巴马州2025运行许可公告](https://adem.alabama.gov/sites/default/files/2025-06/06-25psmcintosh.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "常规压缩空气 · 政策机制与市场背景",
      "content": "### 适用机制与工程阶段\n\n这一路线有长期商运工程，但不据两座历史标杆推断2026全球仅剩两座、也不把所有现代CAES装机计入燃烧补热路线。美国2010年示范支持、Iowa实际终止记录表明政策投入与商业落地之间仍需地质验证。中国新型储能总装机图只能表示行业背景，且中国近年300 MW先进CAES项目应归热回收路线，不能借来充当传统燃气补热工程规模。\n\n原始来源 · [原始资料 1](https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/infrastructure/smart-grid-landing-page)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "常规压缩空气 · 系统能力与应用条件",
      "content": "### 介质、功率与运行条件\n\n适合具备大型储气地质条件、需要大功率放电且能接受燃料供应与排放约束的系统。充电电力承担压缩过程，可减少发电时压缩机所需功；回热器改善燃料利用，但并不消除燃料。采购和研究比较至少同时列出发电MW、有效放电时长、充电耗电、燃料耗量及运行压力。只比较“单位放电电量成本”而忽略天然气价格，会掩盖核心敏感项。其历史价值还在于积累洞室注采及大型机组经验，后续绝热路线继承机械基础、重做热管理。\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/abs/pii/S0196890420302004) · [原始资料 2](https://www.sandia.gov/app/uploads/sites/163/2021/09/120388.pdf) · [原始资料 3](https://www.sciencedirect.com/science/article/pii/S0306261919305094) · [原始资料 4](https://www.uniper.energy/about-uniper/projects/energy-transformation-hub-northwest) · [原始资料 5](https://www.uniper.energy/energy-storage-uniper) · [原始资料 6](https://www.ewe.com/en/media-center/press-releases/2021/04/ewe-and-uniper-plan-to-build-hydrogen-hub-at-huntorf-site-ewe-ag) · [原始资料 7](https://www.gcec.com/about-us/our-cooperative/power-generation/) · [原始资料 8](https://adem.alabama.gov/sites/default/files/2025-06/06-25psmcintosh.html)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "caes-conventional-policy",
    "label": "政策市场",
    "title": "示范支持、地质验证与燃料约束",
    "year": "政策",
    "copy": "美国示范支持推进了地质和可行性研究，Iowa最终因地质条件终止。Huntorf与McIntosh仍须分别计入充电电力和燃料。",
    "facts": [
      [
        "2010支持 / 2011终止",
        "两个不同项目阶段，支持不代表商运"
      ]
    ],
    "subject": "scene:caes-conventional-policy"
  },
  "market": {
    "id": "caes-conventional-market",
    "label": "中国新型储能（全部技术）",
    "title": "全国行业背景",
    "copy": "2025年底中国新型储能累计功率136GW、能量351GWh。统计覆盖全部新型储能技术，平均时长2.58h，不表示当前机械路线的装机或时长。",
    "year": "2025",
    "facts": [
      [
        "136GW / 351GWh",
        "中国2025年底全部新型储能累计功率/能量"
      ],
      [
        "2.58h",
        "全部技术平均配置时长 · 非当前路线指标"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "caes-conventional-papers",
    "label": "论文",
    "title": "洞室动态、项目复盘与燃料热力边界",
    "year": "证据",
    "copy": "洞室热力模型与完整项目复盘解释传统CAES的约束。输出电量同时来自充电电力和燃料，比较效率须保留两种输入。",
    "facts": [
      [
        "温压状态",
        "2019洞室模型 · 保留储气状态约束"
      ],
      [
        "充电电力 + 燃料",
        "传统CAES输出电量的两个能量来源"
      ]
    ],
    "subject": "route:caes-conventional:history"
  },
  "storage": {
    "id": "caes-conventional-storage",
    "label": "储能适配",
    "title": "燃料、电力与储气状态联合配置",
    "year": "应用",
    "copy": "适合具备大型储气地质条件、需要大功率放电且能接受燃料供应与排放约束的系统。充电电力承担压缩过程，可减少发电时压缩机所需功；回热器改善燃料利用，但并不消除燃料。",
    "facts": [
      [
        "110MW",
        "McIntosh CAES单元功率"
      ],
      [
        "燃料耗量需单列",
        "与无燃料电到电效率分别计量"
      ]
    ],
    "subject": "route:caes-conventional:history"
  },
  "historySubject": "route:caes-conventional:history",
  "note": "9个确证年份 · 机械介质与工程条件"
};

export const liquidAirResearch: ChronicleResearch = {
  "name": "液态空气",
  "timeline": [
    {
      "id": "liquid-air-1977",
      "yearNumber": 1977,
      "year": "1977",
      "label": "液态空气用于电力储存的原始研究",
      "title": "液态空气用于电力储存的原始研究",
      "copy": "E. M. Smith发表Storage of Electrical Energy Using Supercritical Liquid Air，1977年6月首次出版。作为本页可追溯起点，不把19世纪液化空气或液空发动机直接写成电网储能电站。",
      "facts": [
        [
          "1977年6月",
          "Smith超临界液空电力储存原始论文"
        ]
      ],
      "detail": "E. M. Smith发表Storage of Electrical Energy Using Supercritical Liquid Air，1977年6月首次出版。作为本页可追溯起点，不把19世纪液化空气或液空发动机直接写成电网储能电站。",
      "source": "https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2008",
      "yearNumber": 2008,
      "year": "2008",
      "label": "Slough试验按子系统开始建设",
      "title": "Slough试验按子系统开始建设",
      "copy": "Morgan等原始论文记载项目2008年启动，先建放电部分、之后加入液化器；早期放电使用槽车运来的液氮，随后才用现场液化空气。这个顺序解释了为什么“成功发电”不一定已完成充放电闭环。",
      "facts": [
        [
          "先放电 / 后液化",
          "Slough按子系统建设 · 早期使用外购液氮"
        ]
      ],
      "detail": "Morgan等原始论文记载项目2008年启动，先建放电部分、之后加入液化器；早期放电使用槽车运来的液氮，随后才用现场液化空气。这个顺序解释了为什么“成功发电”不一定已完成充放电闭环。",
      "source": "https://www.sciencedirect.com/science/article/pii/S0306261914008009",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2010",
      "yearNumber": 2010,
      "year": "2010",
      "label": "低温储能试验装置运行",
      "title": "低温储能试验装置运行",
      "copy": "伯明翰大学2014搬迁公告回顾Highview原型自2010年运行。350kW/2.5MWh是试验装置，后迁入大学研究。",
      "facts": [
        [
          "350kW / 2.5MWh",
          "原型研究装置，非商业站"
        ]
      ],
      "detail": "伯明翰大学2014搬迁公告回顾Highview原型自2010年运行。350kW/2.5MWh是试验装置，后迁入大学研究。",
      "source": "https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "实际膨胀损失进入循环比较",
      "title": "实际膨胀损失进入循环比较",
      "copy": "Ameel等比较液空朗肯循环与组合循环，在300 K废热边界下给出36.8%与43.3%的计算效率。关键在等温膨胀程度和真实膨胀机损失，结果是模型，不是商业站实测。",
      "facts": [
        [
          "36.8% / 43.3%",
          "300K废热边界 · 两种热力循环模型"
        ]
      ],
      "detail": "Ameel等比较液空朗肯循环与组合循环，在300 K废热边界下给出36.8%与43.3%的计算效率。关键在等温膨胀程度和真实膨胀机损失，结果是模型，不是商业站实测。",
      "source": "https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "试验结果发表，大学研究设施开放",
      "title": "试验结果发表，大学研究设施开放",
      "copy": "Morgan等发表于Applied Energy 137卷，报告冷量回收及运行试验；伯明翰大学同期开放低温储能研究设施，迁入Highview的350 kW/2.5 MWh试验装置。前者是论文出版年，后者是研究设施节点，不强定为最初并网年。",
      "facts": [
        [
          "350kW / 2.5MWh",
          "伯明翰大学研究设施原型"
        ],
        [
          "100s",
          "Morgan论文10天试验表3响应值，非通用保证"
        ]
      ],
      "detail": "Morgan等发表于Applied Energy 137卷，报告冷量回收及运行试验；伯明翰大学同期开放低温储能研究设施，迁入Highview的350 kW/2.5 MWh试验装置。前者是论文出版年，后者是研究设施节点，不强定为最初并网年。",
      "source": "https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "5 MW/15 MWh电网级示范启用",
      "title": "5 MW/15 MWh电网级示范启用",
      "copy": "2018-06-05，Highview与Viridor在Pilsworth启用示范设施，英国政府支持超过800万英镑。厂站与垃圾填埋气场址关联，为余热耦合与电网服务提供平台；3小时来自容量/功率额定比，不是所有液空的固定时长。",
      "facts": [
        [
          "5MW / 15MWh",
          "Pilsworth2018-06-05示范启用"
        ],
        [
          "3h",
          "额定容量/功率比值"
        ]
      ],
      "detail": "2018-06-05，Highview与Viridor在Pilsworth启用示范设施，英国政府支持超过800万英镑。厂站与垃圾填埋气场址关联，为余热耦合与电网服务提供平台；3小时来自容量/功率额定比，不是所有液空的固定时长。",
      "source": "https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "Carrington获得新一轮支持",
      "title": "Carrington获得新一轮支持",
      "copy": "Highview 2026年1月FAQ回顾2022年获得1000万英镑政府拨款及增长资本。记录为融资支持，不是电站投产、营业收入或电量交付。",
      "facts": [
        [
          "1000万英镑",
          "Carrington当年政府拨款 · 非电站收入"
        ]
      ],
      "detail": "Highview 2026年1月FAQ回顾2022年获得1000万英镑政府拨款及增长资本。记录为融资支持，不是电站投产、营业收入或电量交付。",
      "source": "https://highviewpower.com/wp-content/uploads/2026/01/FAQ-updtd-3.pdf",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "商业规模项目融资落实",
      "title": "商业规模项目融资落实",
      "copy": "2024年融资3亿英镑支持Carrington，设计50 MW/300 MWh、6小时。新闻原文将输出写作“50 MW per hour”，量纲不当；页面应规范为输出功率50 MW、持续6小时。",
      "facts": [
        [
          "3亿英镑",
          "Carrington融资支持，非投运"
        ],
        [
          "50MW / 300MWh",
          "设计功率/能量 · 6h配置"
        ]
      ],
      "detail": "2024年融资3亿英镑支持Carrington，设计50 MW/300 MWh、6小时。新闻原文将输出写作“50 MW per hour”，量纲不当；页面应规范为输出功率50 MW、持续6小时。原文“early2026 operational”为当时目标。",
      "source": "https://highviewpower.com/news-announcements/uk-infrastructure-bank-centrica-partners-invest-300m-in-highview-power-clean-energy-storage-programme-to-boost-uks-energy-security-2/",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "Carrington举行正式破土仪式",
      "title": "Carrington举行正式破土仪式",
      "copy": "2025-11-21官方破土消息重申50 MW/300 MWh，并增加电网稳定性设施说明。明确建设状态，不把融资及破土合称“商运”。",
      "facts": [
        [
          "2025-11-21",
          "Carrington正式破土"
        ],
        [
          "50MW / 300MWh",
          "在建设计规模，不是已交付容量"
        ]
      ],
      "detail": "2025-11-21官方破土消息重申50 MW/300 MWh，并增加电网稳定性设施说明。明确建设状态，不把融资及破土合称“商运”。",
      "source": "https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/",
      "subject": "route:liquid-air:history"
    },
    {
      "id": "liquid-air-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "长时储能支持进入项目遴选",
      "title": "长时储能支持进入项目遴选",
      "copy": "Ofgem 2026-06-26发布首轮cap-and-floor拟选择项目进展，属于支持机制程序。Highview现项目页仍称Carrington在建，2026起的一期是stability island；不能据旧工期宣称完整300 MWh液空部分已商业运行。",
      "facts": [
        [
          "2026-06-26",
          "Ofgem首轮cap-and-floor拟选择进展"
        ],
        [
          "仍在建设",
          "Carrington稳定模块与300MWh液空模块分开"
        ]
      ],
      "detail": "Ofgem 2026-06-26发布首轮cap-and-floor拟选择项目进展，属于支持机制程序。Highview现项目页仍称Carrington在建，2026起的一期是stability island；不能据旧工期宣称完整300 MWh液空部分已商业运行。",
      "source": "https://www.ofgem.gov.uk/press-release/ofgem-boosts-long-duration-storage-secure-more-homegrown-energy-customers",
      "subject": "route:liquid-air:history"
    }
  ],
  "materials": [
    {
      "id": "liquid-air-liquid",
      "label": "液态空气与绝热罐",
      "title": "液态空气与绝热罐",
      "copy": "液空作为工质及储能介质，低压罐降低对特定地质条件的依赖。罐体保冷决定蒸发与待机损失；实际循环是热力系统，不能只把液体体积转换成固定MWh。",
      "facts": [
        [
          "低压绝热罐",
          "液化空气保存，蒸发与保冷影响待机"
        ]
      ],
      "subject": "material:liquid-air-liquid",
      "year": "部件"
    },
    {
      "id": "liquid-air-liquefier",
      "label": "空气液化器与低温换热器",
      "title": "空气液化器与低温换热器",
      "copy": "充电阶段把电力投入压缩和制冷。Morgan研究采用Claude循环思路，把冷涡轮膨胀与节流结合；换热温差、压降和液化产率共同影响耗电。",
      "facts": [
        [
          "Claude循环",
          "Morgan原型的膨胀制冷/节流组合"
        ]
      ],
      "subject": "material:liquid-air-liquefier",
      "year": "部件"
    },
    {
      "id": "liquid-air-thermal",
      "label": "冷量与热量储存",
      "title": "冷量与热量储存",
      "copy": "释能时液空气化释放冷量，可储存并回用于下一次液化；压缩热或外来余热可用于提高膨胀前温度。与LNG冷能、工业废热耦合时必须披露外部能量输入。",
      "facts": [
        [
          "冷量回收 / 热量利用",
          "耦合外部废热/冷能时单列输入"
        ]
      ],
      "subject": "material:liquid-air-thermal",
      "year": "部件"
    },
    {
      "id": "liquid-air-expander",
      "label": "低温泵、膨胀机与发电系统",
      "title": "低温泵、膨胀机与发电系统",
      "copy": "液态工质先泵升压再加热，可利用液相压缩特性；膨胀机把热力势转为电。Ameel研究显示理想等温过程与真实膨胀机的差距显著，不能引用理想循环效率描述商用设备。",
      "facts": [
        [
          "液相升压 → 气化膨胀",
          "低温泵与膨胀机分工"
        ]
      ],
      "subject": "material:liquid-air-expander",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "liquid-air-highview",
      "label": "Highview Power",
      "year": "2025",
      "title": "Carrington开工与设计容量",
      "copy": "英国Highview Power开发液态空气储能（LAES）：液化空气储存，放电时加压升温并膨胀驱动透平。",
      "facts": [
        [
          "50MW / 300MWh",
          "2025-11-21正式破土 · 仍在建"
        ],
        [
          "6h",
          "额定配置比值，非已验证全站运行"
        ]
      ],
      "subject": "company:liquid-air-highview"
    },
    {
      "id": "liquid-air-birmingham",
      "label": "伯明翰大学",
      "year": "研究",
      "title": "低温储能原型研究平台",
      "copy": "伯明翰大学低温储能研究团队曾与Highview合作验证LAES试验系统；是科研平台而非商业电站。",
      "facts": [
        [
          "350kW / 2.5MWh",
          "迁入大学继续研究的试验装置"
        ]
      ],
      "subject": "company:liquid-air-birmingham"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "液态空气 · 发展与工程时间线",
      "content": "### 1977：液态空气用于电力储存的原始研究\n\nE. M. Smith发表Storage of Electrical Energy Using Supercritical Liquid Air，1977年6月首次出版。作为本页可追溯起点，不把19世纪液化空气或液空发动机直接写成电网储能电站。\n\n### 2008：Slough试验按子系统开始建设\n\nMorgan等原始论文记载项目2008年启动，先建放电部分、之后加入液化器；早期放电使用槽车运来的液氮，随后才用现场液化空气。这个顺序解释了为什么“成功发电”不一定已完成充放电闭环。\n\n### 2013：实际膨胀损失进入循环比较\n\nAmeel等比较液空朗肯循环与组合循环，在300 K废热边界下给出36.8%与43.3%的计算效率。关键在等温膨胀程度和真实膨胀机损失，结果是模型，不是商业站实测。\n\n### 2015：试验结果发表，大学研究设施开放\n\nMorgan等发表于Applied Energy 137卷，报告冷量回收及运行试验；伯明翰大学同期开放低温储能研究设施，迁入Highview的350 kW/2.5 MWh试验装置。前者是论文出版年，后者是研究设施节点，不强定为最初并网年。\n\n### 2018：5 MW/15 MWh电网级示范启用\n\n2018-06-05，Highview与Viridor在Pilsworth启用示范设施，英国政府支持超过800万英镑。厂站与垃圾填埋气场址关联，为余热耦合与电网服务提供平台；3小时来自容量/功率额定比，不是所有液空的固定时长。\n\n### 2022：Carrington获得新一轮支持\n\nHighview 2026年1月FAQ回顾2022年获得1000万英镑政府拨款及增长资本。记录为融资支持，不是电站投产、营业收入或电量交付。\n\n### 2024：商业规模项目融资落实\n\n2024年融资3亿英镑支持Carrington，设计50 MW/300 MWh、6小时。新闻原文将输出写作“50 MW per hour”，量纲不当；页面应规范为输出功率50 MW、持续6小时。原文“early2026 operational”为当时目标。\n\n### 2025：Carrington举行正式破土仪式\n\n2025-11-21官方破土消息重申50 MW/300 MWh，并增加电网稳定性设施说明。明确建设状态，不把融资及破土合称“商运”。\n\n### 2026：长时储能支持进入项目遴选\n\nOfgem 2026-06-26发布首轮cap-and-floor拟选择项目进展，属于支持机制程序。Highview现项目页仍称Carrington在建，2026起的一期是stability island；不能据旧工期宣称完整300 MWh液空部分已商业运行。\n\n原始来源 · [原始资料 1](https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02) · [原始资料 2](https://www.sciencedirect.com/science/article/pii/S0306261914008009) · [原始资料 3](https://cris.brighton.ac.uk/ws/portalfiles/portal/5530179/Liquid_air_energy_storage_Analysis_and_first_results_from_a_pilot_scale_demonstration_plant.pdf.pdf) · [原始资料 4](https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910) · [原始资料 5](https://doi.org/10.1016/j.applthermaleng.2012.11.037) · [原始资料 6](https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf) · [原始资料 7](https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/) · [原始资料 8](https://highviewpower.com/wp-content/uploads/2026/01/FAQ-updtd-3.pdf) · [原始资料 9](https://highviewpower.com/news-announcements/uk-infrastructure-bank-centrica-partners-invest-300m-in-highview-power-clean-energy-storage-programme-to-boost-uks-energy-security-2/) · [原始资料 10](https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/) · [原始资料 11](https://www.ofgem.gov.uk/press-release/ofgem-boosts-long-duration-storage-secure-more-homegrown-energy-customers) · [原始资料 12](https://highviewpower.com/projects/)\n\n### 2010：低温储能试验装置运行\n\n伯明翰大学2014搬迁公告回顾Highview原型自2010年运行。350kW/2.5MWh是试验装置，后迁入大学研究。\n\n原始来源 · [低温储能试验装置运行](https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "液态空气 · 储能介质与关键部件",
      "content": "### 液态空气与绝热罐\n液空作为工质及储能介质，低压罐降低对特定地质条件的依赖。罐体保冷决定蒸发与待机损失；实际循环是热力系统，不能只把液体体积转换成固定MWh。空气组分、压力与运行条件改变液化行为。\n\n### 空气液化器与低温换热器\n充电阶段把电力投入压缩和制冷。Morgan研究采用Claude循环思路，把冷涡轮膨胀与节流结合；换热温差、压降和液化产率共同影响耗电。试验先放电后补液化器的过程说明，购买液氮进行放电测试不等于测过整站电到电效率。\n\n### 冷量与热量储存\n释能时液空气化释放冷量，可储存并回用于下一次液化；压缩热或外来余热可用于提高膨胀前温度。与LNG冷能、工业废热耦合时必须披露外部能量输入。带外源热冷的高效率不宜与独立系统直接排序。\n\n### 低温泵、膨胀机与发电系统\n液态工质先泵升压再加热，可利用液相压缩特性；膨胀机把热力势转为电。Ameel研究显示理想等温过程与真实膨胀机的差距显著，不能引用理想循环效率描述商用设备。电网稳定模块和液空能量移时模块功能不同，Carrington现阶段尤其要分开标注。\n\n原始来源 · [原始资料 1](https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02) · [原始资料 2](https://www.sciencedirect.com/science/article/pii/S0306261914008009) · [原始资料 3](https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910) · [原始资料 4](https://doi.org/10.1016/j.applthermaleng.2012.11.037) · [原始资料 5](https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "液态空气 · 原始研究与条件对照",
      "content": "| 原始研究 | 明确结果与意义 | 条件 |\n|---|---|---|\n| Smith，1977；DOI 10.1243/PIME_PROC_1977_191_035_02 | 为电力储存提出超临界液空循环 | 历史概念论文，历史概念论文 |\n| Ameel等，2013；DOI 10.1016/j.applthermaleng.2012.11.037 | 朗肯36.8%、组合43.3% | 废热300 K、热力模型，循环及真实膨胀机假设相关 |\n| Morgan等，2015；DOI 10.1016/j.apenergy.2014.07.109 | 原型验证冷回收并做模拟STOR服务试验；到达负荷设定值100 s | 10天试验中的表3响应值，非所有系统保证100 s；原文还区分模型与试验 |\n| 2024，Evaluating economic feasibility… | 混合整数线性规划比较美国和欧洲市场配置 | 技术经济模拟；电价与服务假设决定收益，不给通用回本年限； |\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S0360544224012970) · [原始资料 2](https://doi.org/10.1243/PIME_PROC_1977_191_035_02) · [原始资料 3](https://doi.org/10.1016/j.applthermaleng.2012.11.037) · [原始资料 4](https://doi.org/10.1016/j.apenergy.2014.07.109) · [原始资料 5](https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02) · [原始资料 6](https://www.sciencedirect.com/science/article/pii/S0306261914008009) · [原始资料 7](https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910) · [原始资料 8](https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "液态空气 · 企业、研究机构与工程",
      "content": "### Highview Power\n\n英国Highview Power开发液态空气储能（LAES）：液化空气储存，放电时加压升温并膨胀驱动透平。\n\nCarrington于2025-11-21开工，设计50MW/300MWh，仍在建设。Pilsworth 5MW/15MWh于2018年发布为电网级示范；旧公告不证明其今天仍运行。\n\n- **50MW / 300MWh** · 2025-11-21正式破土 · 仍在建\n- **6h** · 额定配置比值，非已验证全站运行\n\n原始来源 · [Carrington项目状态](https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/) · [Pilsworth示范公告](https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/) · [融资方与项目容量](https://www.centrica.com/media-centre/news/2024/centrica-invests-in-renewable-energy-storage-capabilities/)\n\n### 伯明翰大学\n\n伯明翰大学低温储能研究团队曾与Highview合作验证LAES试验系统；是科研平台而非商业电站。\n\nHighview 350kW/2.5MWh试验装置曾从Slough搬至伯明翰继续研究；不推断其目前仍持续运行。\n\n- **350kW / 2.5MWh** · 迁入大学继续研究的试验装置\n\n原始来源 · [伯明翰大学搬迁与试验装置](https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage) · [LAES试验研究目录](https://research.birmingham.ac.uk/en/publications/performance-analysis-and-detailed-experimental-results-of-the-fir/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "液态空气 · 政策机制与市场背景",
      "content": "### 适用机制与工程阶段\n\n英国2024年决定引入长时储能cap-and-floor收入机制，2025年4月8日开启首轮申请，2026年6月进入拟选择阶段。资格通过、拟支持、最终授予及电站投运是不同状态。\n\n页面可显示Pilsworth5 MW/15 MWh与Carrington在建设计50 MW/300 MWh，但分别标注年份和状态。中国新型储能图为全技术行业背景。\n\n原始来源 · [原始资料 1](https://www.gov.uk/government/publications/long-duration-electricity-storage-technical-details-of-the-scheme-and-its-operation) · [原始资料 2](https://www.ofgem.gov.uk/decision/long-duration-electricity-storage-ldes-window-1-eligibility-assessment-outcome) · [原始资料 3](https://www.ofgem.gov.uk/press-release/ofgem-boosts-long-duration-storage-secure-more-homegrown-energy-customers)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "液态空气 · 系统能力与应用条件",
      "content": "### 介质、功率与运行条件\n\n适合具备工业设备空间、需要小时级移时且有热冷集成条件的站点；液化器、罐容量和发电单元可分别配置，减少对盐穴或高差地形的依赖。代价是多次热力转换、低温换热与待机保冷。工业余热/废冷能改善特定项目表现，但资源温度、时段和供应稳定性必须匹配。快速调频可由配套稳定模块承担，不能把该模块响应时间自动赋予冷态液空发电全流程。\n\n原始来源 · [原始资料 1](https://journals.sagepub.com/doi/10.1243/PIME_PROC_1977_191_035_02) · [原始资料 2](https://www.sciencedirect.com/science/article/pii/S0306261914008009) · [原始资料 3](https://www.sciencedirect.com/science/article/abs/pii/S1359431112007910) · [原始资料 4](https://doi.org/10.1016/j.applthermaleng.2012.11.037) · [原始资料 5](https://www.birmingham.ac.uk/Documents/partners/t-era-brochure.pdf) · [原始资料 6](https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/) · [原始资料 7](https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/) · [原始资料 8](https://www.centrica.com/media-centre/news/2024/centrica-invests-in-renewable-energy-storage-capabilities/) · [原始资料 9](https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage) · [原始资料 10](https://research.birmingham.ac.uk/en/publications/performance-analysis-and-detailed-experimental-results-of-the-fir/)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "liquid-air-policy",
    "label": "政策市场",
    "title": "英国长时储能收入机制的项目遴选",
    "year": "2026",
    "copy": "英国长时储能cap-and-floor首轮在2025年开启申请，2026年进入拟选择阶段。机制资格与电站投运分别判断。",
    "facts": [
      [
        "2025-04-08",
        "首轮申请启动"
      ],
      [
        "2026-06-26",
        "拟选择阶段公告，非全站投运"
      ]
    ],
    "subject": "scene:liquid-air-policy"
  },
  "market": {
    "id": "liquid-air-market",
    "label": "中国新型储能（全部技术）",
    "title": "全国行业背景",
    "copy": "2025年底中国新型储能累计功率136GW、能量351GWh。统计覆盖全部新型储能技术，平均时长2.58h，不表示当前机械路线的装机或时长。",
    "year": "2025",
    "facts": [
      [
        "136GW / 351GWh",
        "中国2025年底全部新型储能累计功率/能量"
      ],
      [
        "2.58h",
        "全部技术平均配置时长 · 非当前路线指标"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "liquid-air-papers",
    "label": "论文",
    "title": "液化、冷回收与废热边界",
    "year": "证据",
    "copy": "液化、冷量回收与膨胀循环共同影响表现。300K废热模型、原型试验和在建项目分别保留条件。",
    "facts": [
      [
        "36.8% / 43.3%",
        "2013循环模型 · 300K废热条件"
      ],
      [
        "100s",
        "2015原型表3试验响应 · 非全行业指标"
      ]
    ],
    "subject": "route:liquid-air:history"
  },
  "storage": {
    "id": "liquid-air-storage",
    "label": "储能适配",
    "title": "罐容量、液化器和发电单元分别配置",
    "year": "应用",
    "copy": "适合具备工业设备空间、需要小时级移时且有热冷集成条件的站点；液化器、罐容量和发电单元可分别配置，减少对盐穴或高差地形的依赖。代价是多次热力转换、低温换热与待机保冷。",
    "facts": [
      [
        "5MW / 15MWh",
        "Pilsworth2018示范启用 · 3h配置"
      ],
      [
        "50MW / 300MWh",
        "Carrington在建设计规模 · 6h配置"
      ]
    ],
    "subject": "route:liquid-air:history"
  },
  "historySubject": "route:liquid-air:history",
  "note": "10个确证年份 · 机械介质与工程条件"
};

export const flywheelResearch: ChronicleResearch = {
  "name": "飞轮",
  "timeline": [
    {
      "id": "flywheel-1950",
      "yearNumber": 1950,
      "year": "1950",
      "label": "Gyrobus展示车载动能储能",
      "title": "Gyrobus展示车载动能储能",
      "copy": "ABB历史资料记录MFO在Yverdon开展Gyrobus试验，利用车载飞轮储存动力，减少对连续架空接触线的依赖。此节点代表早期电驱飞轮应用，不称飞轮机械本身于1950年发明。",
      "facts": [
        [
          "1950",
          "Yverdon Gyrobus试验 · 早期电驱飞轮应用"
        ]
      ],
      "detail": "ABB历史资料记录MFO在Yverdon开展Gyrobus试验，利用车载飞轮储存动力，减少对连续架空接触线的依赖。此节点代表早期电驱飞轮应用，不称飞轮机械本身于1950年发明。",
      "source": "https://new.abb.com/news/detail/3321/from-streetcars-to-race-cars-abbs-deep-experience-in-e-mobility",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2002",
      "yearNumber": 2002,
      "year": "2002",
      "label": "被动磁轴承试验跨过临界转速",
      "title": "被动磁轴承试验跨过临界转速",
      "copy": "NASA技术报告A Passive Magnetic Bearing Flywheel披露装置运行至5500 rpm，第一临界转速3336 rpm。径向采用永磁轴承、轴向仍为宝石轴承，因此不能描述成整机完全无接触。",
      "facts": [
        [
          "5500rpm",
          "NASA被动磁轴承试验实际转速"
        ],
        [
          "3336rpm",
          "第一临界转速 · 轴向仍用宝石支承"
        ]
      ],
      "detail": "NASA技术报告A Passive Magnetic Bearing Flywheel披露装置运行至5500 rpm，第一临界转速3336 rpm。径向采用永磁轴承、轴向仍为宝石轴承，因此不能描述成整机完全无接触。",
      "source": "https://ntrs.nasa.gov/citations/20020038851",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2004",
      "yearNumber": 2004,
      "year": "2004",
      "label": "NASA G2实际运行到41000 rpm",
      "title": "NASA G2实际运行到41000 rpm",
      "copy": "2004-09-02，G2试验模块运行至41000 rpm；NASA在2005年研究报告记录该事件。明确事件年2004与文献发布年2005，不能把设计60000 rpm当成本次达到转速。",
      "facts": [
        [
          "41000rpm",
          "G2于2004-09-02实际达到 · 报告2005发布"
        ]
      ],
      "detail": "2004-09-02，G2试验模块运行至41000 rpm；NASA在2005年研究报告记录该事件。明确事件年2004与文献发布年2005，不能把设计60000 rpm当成本次达到转速。",
      "source": "https://ntrs.nasa.gov/citations/20050217267",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2006",
      "yearNumber": 2006,
      "year": "2006",
      "label": "模块设计给出转子与控制边界",
      "title": "模块设计给出转子与控制边界",
      "copy": "NASA/CR-2006-213862公开G2模块设计：60000 rpm、525 Wh、1 kW设计规格；多层碳纤维轮缘、钛轮毂，面向实验室部件与系统验证。功率和储能密度仍受转子应力、轴承和动态稳定性约束。",
      "facts": [
        [
          "60000rpm / 525Wh / 1kW",
          "G2模块设计规格，非2004实测转速"
        ]
      ],
      "detail": "NASA/CR-2006-213862公开G2模块设计：60000 rpm、525 Wh、1 kW设计规格；多层碳纤维轮缘、钛轮毂，面向实验室部件与系统验证。功率和储能密度仍受转子应力、轴承和动态稳定性约束。",
      "source": "https://ntrs.nasa.gov/citations/20060028492",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "20 MW调频电站商运",
      "title": "20 MW调频电站商运",
      "copy": "Stephentown于2011年1月开始商业运行，6月达到全部20 MW；纽约州NYSERDA数据库记录5 MWh。20 MW/5 MWh相当于额定功率约15分钟，充放双向40 MW调节范围不能写成40 MW发电容量。",
      "facts": [
        [
          "20MW / 5MWh",
          "Stephentown运行站 · 15min额定配置"
        ],
        [
          "40MW",
          "充放双向调节范围，不是发电容量"
        ]
      ],
      "detail": "Stephentown于2011年1月开始商业运行，6月达到全部20 MW；纽约州NYSERDA数据库记录5 MWh。20 MW/5 MWh相当于额定功率约15分钟，充放双向40 MW调节范围不能写成40 MW发电容量。",
      "source": "https://beaconpower.com/stephentown-new-york/",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2014",
      "yearNumber": 2014,
      "year": "2014",
      "label": "Hazle第二座20 MW站全容量运行",
      "title": "Hazle第二座20 MW站全容量运行",
      "copy": "2014年7月，200台飞轮组成的Hazle电站全面商业运行，为PJM提供调频。模块化规模扩展用于快速双向功率服务，而不是把电量扩展到数小时。",
      "facts": [
        [
          "20MW / 200台",
          "Hazle全面商业运行 · 调频服务"
        ]
      ],
      "detail": "2014年7月，200台飞轮组成的Hazle电站全面商业运行，为PJM提供调频。模块化规模扩展用于快速双向功率服务，而不是把电量扩展到数小时。",
      "source": "https://beaconpower.com/hazle-township-pennsylvania/",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "超导轴承结合大型复合材料转子",
      "title": "超导轴承结合大型复合材料转子",
      "copy": "RTRI等完成300 kW/100 kWh设计能力的超导飞轮试验机并启动测试。2015-04-15公告给出直径2 m、质量4 t、最高6000 rpm、CFRP转子；并网光伏测试在公告时仍计划当年夏季开展。",
      "facts": [
        [
          "300kW / 100kWh",
          "RTRI试验机设计能力 · 开始测试"
        ],
        [
          "最高6000rpm",
          "4t、直径2m CFRP转子设备规格"
        ]
      ],
      "detail": "RTRI等完成300 kW/100 kWh设计能力的超导飞轮试验机并启动测试。2015-04-15公告给出直径2 m、质量4 t、最高6000 rpm、CFRP转子；并网光伏测试在公告时仍计划当年夏季开展。不能把设备规格与全部工况验收结果等同。",
      "source": "https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "工程资产与制造业务分开流转",
      "title": "工程资产与制造业务分开流转",
      "copy": "2018-05-01，Convergent收购Stephentown与Hazle共40 MW运行资产；Beacon制造业务的收购主体另为RGA Investments。区分资产运营和设备制造，避免沿用旧上市主体描述今日企业。",
      "facts": [
        [
          "40MW",
          "Convergent收购两座运行站，非Beacon制造业务"
        ]
      ],
      "detail": "2018-05-01，Convergent收购Stephentown与Hazle共40 MW运行资产；Beacon制造业务的收购主体另为RGA Investments。区分资产运营和设备制造，避免沿用旧上市主体描述今日企业。",
      "source": "https://convergentep.com/news/convergent-energy-power-acquires-40-mw-of-flywheel-projects",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "山西30 MW电网侧工程并网",
      "title": "山西30 MW电网侧工程并网",
      "copy": "山西省政府系统2024-09-24消息确认鼎轮30 MW飞轮调频项目在长治并网。该来源明确功率，原文公布功率，未公布该站MWh容量。",
      "facts": [
        [
          "30MW",
          "山西鼎轮调频工程并网 · 未推算MWh"
        ]
      ],
      "detail": "山西省政府系统2024-09-24消息确认鼎轮30 MW飞轮调频项目在长治并网。该来源明确功率，原文公布功率，未公布该站MWh容量。",
      "source": "https://www.xr.gov.cn/xrqrmzfz/sxyw/202409/aa347b9e0722469bb0c7f20c23975c78.shtml",
      "subject": "route:flywheel:history"
    },
    {
      "id": "flywheel-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "钢制飞轮集装箱系统完成调试",
      "title": "钢制飞轮集装箱系统完成调试",
      "copy": "Amber Kinetics与Indian Energy公告美国地上集装箱式系统完成调试并获UL现场认证。原公告未披露容量。",
      "facts": [
        [
          "2025-08-06",
          "系统调试与认证公告 · 未填未公布容量"
        ]
      ],
      "detail": "Amber Kinetics与Indian Energy公告美国地上集装箱式系统完成调试并获UL现场认证。原公告未披露容量。",
      "source": "https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/",
      "subject": "route:flywheel:history"
    }
  ],
  "materials": [
    {
      "id": "flywheel-rotor",
      "label": "转子与轮毂",
      "title": "转子与轮毂",
      "copy": "可用动能与转动惯量及最高、最低转速有关，E=½I(ω_max²−ω_min²)。提高转速可以增加能量，同时提高材料应力与对动态平衡的要求。",
      "facts": [
        [
          "碳纤维轮缘 / 钛轮毂",
          "NASA2006 G2设计"
        ],
        [
          "2m / 4t",
          "RTRI2015 CFRP转子，独立装置"
        ]
      ],
      "subject": "material:flywheel-rotor",
      "year": "部件"
    },
    {
      "id": "flywheel-bearing",
      "label": "磁轴承与支承",
      "title": "磁轴承与支承",
      "copy": "磁轴承降低接触损耗；转子稳定控制、备用着陆轴承和异常停机仍是系统设计内容。NASA2002被动试验仅径向永磁、轴向宝石支承；RTRI2015为高温超导线圈和超导块材组合。",
      "facts": [
        [
          "径向永磁 / 轴向宝石",
          "NASA2002支承方式，非完全无接触"
        ],
        [
          "高温超导支承",
          "RTRI2015线圈/块材组合"
        ]
      ],
      "subject": "material:flywheel-bearing",
      "year": "部件"
    },
    {
      "id": "flywheel-vacuum",
      "label": "真空容器与约束结构",
      "title": "真空容器与约束结构",
      "copy": "降低气体阻力可减少旋转损耗，容器和结构同时承担设备环境及安全约束。RTRI2015技术分工明确Mirapro提供真空容器。",
      "facts": [
        [
          "真空容器",
          "降低气阻，仍计轴承/控制/电机损耗"
        ]
      ],
      "subject": "material:flywheel-vacuum",
      "year": "部件"
    },
    {
      "id": "flywheel-electronics",
      "label": "电机发电机与电力电子",
      "title": "电机发电机与电力电子",
      "copy": "同一转子通过电机吸收电力加速、通过发电制动减速；控制器把调频指令转换成双向功率。电站调节范围、单向额定功率、有效电量与可持续时间需分别显示。",
      "facts": [
        [
          "20MW / 5MWh",
          "Stephentown双向功率控制 · 15min额定比值"
        ]
      ],
      "subject": "material:flywheel-electronics",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "flywheel-beacon",
      "label": "Beacon Power",
      "year": "工程",
      "title": "Stephentown飞轮调频",
      "copy": "美国Beacon Power提供高速飞轮储能，Stephentown设施为NYISO提供频率调节。",
      "facts": [
        [
          "20MW / 5MWh",
          "2011运行站 · 15min额定比值"
        ],
        [
          "40MW",
          "充放双向总体调节范围，非单向发电功率"
        ]
      ],
      "subject": "company:flywheel-beacon"
    },
    {
      "id": "flywheel-amber",
      "label": "Amber Kinetics",
      "year": "2025",
      "title": "钢制飞轮制造与集装箱系统",
      "copy": "美国Amber Kinetics设计制造钢制飞轮系统，在菲律宾设有制造厂，面向电网、微网和孤岛供电部署。",
      "facts": [
        [
          "4000台/年",
          "公司披露菲律宾工厂产能，非实际出货"
        ],
        [
          "2025-08-06",
          "美国地上集装箱式系统调试公告"
        ]
      ],
      "subject": "company:flywheel-amber"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "飞轮 · 发展与工程时间线",
      "content": "### 1950：Gyrobus展示车载动能储能\n\nABB历史资料记录MFO在Yverdon开展Gyrobus试验，利用车载飞轮储存动力，减少对连续架空接触线的依赖。此节点代表早期电驱飞轮应用，不称飞轮机械本身于1950年发明。\n\n### 2002：被动磁轴承试验跨过临界转速\n\nNASA技术报告A Passive Magnetic Bearing Flywheel披露装置运行至5500 rpm，第一临界转速3336 rpm。径向采用永磁轴承、轴向仍为宝石轴承，因此不能描述成整机完全无接触。\n\n### 2004：NASA G2实际运行到41000 rpm\n\n2004-09-02，G2试验模块运行至41000 rpm；NASA在2005年研究报告记录该事件。明确事件年2004与文献发布年2005，不能把设计60000 rpm当成本次达到转速。\n\n### 2006：模块设计给出转子与控制边界\n\nNASA/CR-2006-213862公开G2模块设计：60000 rpm、525 Wh、1 kW设计规格；多层碳纤维轮缘、钛轮毂，面向实验室部件与系统验证。功率和储能密度仍受转子应力、轴承和动态稳定性约束。\n\n### 2011：20 MW调频电站商运\n\nStephentown于2011年1月开始商业运行，6月达到全部20 MW；纽约州NYSERDA数据库记录5 MWh。20 MW/5 MWh相当于额定功率约15分钟，充放双向40 MW调节范围不能写成40 MW发电容量。\n\n### 2014：Hazle第二座20 MW站全容量运行\n\n2014年7月，200台飞轮组成的Hazle电站全面商业运行，为PJM提供调频。模块化规模扩展用于快速双向功率服务，而不是把电量扩展到数小时。\n\n### 2015：超导轴承结合大型复合材料转子\n\nRTRI等完成300 kW/100 kWh设计能力的超导飞轮试验机并启动测试。2015-04-15公告给出直径2 m、质量4 t、最高6000 rpm、CFRP转子；并网光伏测试在公告时仍计划当年夏季开展。不能把设备规格与全部工况验收结果等同。\n\n### 2018：工程资产与制造业务分开流转\n\n2018-05-01，Convergent收购Stephentown与Hazle共40 MW运行资产；Beacon制造业务的收购主体另为RGA Investments。区分资产运营和设备制造，避免沿用旧上市主体描述今日企业。\n\n### 2024：山西30 MW电网侧工程并网\n\n山西省政府系统2024-09-24消息确认鼎轮30 MW飞轮调频项目在长治并网。该来源明确功率，原文公布功率，未公布该站MWh容量。\n\n原始来源 · [原始资料 1](https://new.abb.com/news/detail/3321/from-streetcars-to-race-cars-abbs-deep-experience-in-e-mobility) · [原始资料 2](https://ntrs.nasa.gov/citations/20020038851) · [原始资料 3](https://ntrs.nasa.gov/citations/20050217267) · [原始资料 4](https://ntrs.nasa.gov/citations/20060028492) · [原始资料 5](https://beaconpower.com/stephentown-new-york/) · [原始资料 6](https://der.nyserda.ny.gov/facilities/654/) · [原始资料 7](https://beaconpower.com/hazle-township-pennsylvania/) · [原始资料 8](https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html) · [原始资料 9](https://convergentep.com/news/convergent-energy-power-acquires-40-mw-of-flywheel-projects) · [原始资料 10](https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/) · [原始资料 11](https://www.xr.gov.cn/xrqrmzfz/sxyw/202409/aa347b9e0722469bb0c7f20c23975c78.shtml)\n\n### 2025：钢制飞轮集装箱系统完成调试\n\nAmber Kinetics与Indian Energy公告美国地上集装箱式系统完成调试并获UL现场认证。原公告未披露容量。\n\n原始来源 · [钢制飞轮集装箱系统完成调试](https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "飞轮 · 储能介质与关键部件",
      "content": "### 转子与轮毂\n可用动能与转动惯量及最高、最低转速有关，E=½I(ω_max²−ω_min²)。提高转速可以增加能量，同时提高材料应力与对动态平衡的要求。NASA G2采用多层碳纤维轮缘和钛轮毂；RTRI试验机为CFRP转子。不能以某个复合材料转子图片代表所有钢制飞轮。\n\n### 磁轴承与支承\n磁轴承降低接触损耗；转子稳定控制、备用着陆轴承和异常停机仍是系统设计内容。NASA2002被动试验仅径向永磁、轴向宝石支承；RTRI2015为高温超导线圈和超导块材组合。不同类型不能统称为无能耗悬浮。\n\n### 真空容器与约束结构\n降低气体阻力可减少旋转损耗，容器和结构同时承担设备环境及安全约束。RTRI2015技术分工明确Mirapro提供真空容器。低空气阻力不消除电机、控制、轴承与附属设备耗电；长期待机能量衰减仍应计入。\n\n### 电机发电机与电力电子\n同一转子通过电机吸收电力加速、通过发电制动减速；控制器把调频指令转换成双向功率。电站调节范围、单向额定功率、有效电量与可持续时间需分别显示。\n\n原始来源 · [原始资料 1](https://www.rtri.or.jp/eng/publish/newsletter/pdf/53/RTN-53.pdf) · [原始资料 2](https://ntrs.nasa.gov/citations/20020038851) · [原始资料 3](https://ntrs.nasa.gov/citations/20050217267) · [原始资料 4](https://ntrs.nasa.gov/citations/20060028492) · [原始资料 5](https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html) · [原始资料 6](https://beaconpower.com/stephentown-new-york/) · [原始资料 7](https://beaconpower.com/hazle-township-pennsylvania/) · [原始资料 8](https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "飞轮 · 原始研究与条件对照",
      "content": "| 原始资料 | 数据 | 测量或设计边界 |\n|---|---|---|\n| NASA/TM-2002-211159，A Passive Magnetic Bearing Flywheel | 达到5500 rpm，第一临界转速3336 rpm | 试验台转速结果；径向永磁、轴向宝石支承，无并网效率指标 |\n| NASA/CR-2006-213862，G2 Flywheel Module Design | 60000 rpm、525 Wh、1 kW | 实验室设计规格；2004实际41000 rpm由另份进展报告证明，不混为同次测试 |\n| RTRI，2015，超导飞轮技术公告及研究报告 | 300 kW、100 kWh、4 t、2 m、最高6000 rpm | 当时公布设备能力与开始测试状态，非几十年寿命实证 |\n| DOE，2017，Hazle Spindle项目报告入口 | 电网级20 MW调频示范 | 工程应用报告，适合展示调频服务与集成； |\n\n原始来源 · [原始资料 1](https://www.energy.gov/oe/articles/arra-sgdp-hazle-spindle-20-mw-flywheel-frequency-regulation-plant-formerly-beacon-power) · [原始资料 2](https://ntrs.nasa.gov/citations/20020038851) · [原始资料 3](https://ntrs.nasa.gov/citations/20050217267) · [原始资料 4](https://ntrs.nasa.gov/citations/20060028492) · [原始资料 5](https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "飞轮 · 企业、研究机构与工程",
      "content": "### Beacon Power\n\n美国Beacon Power提供高速飞轮储能，Stephentown设施为NYISO提供频率调节。\n\nStephentown 20MW站含200台飞轮，2011年1月商业运行、6月达到满出力；公司称设施总体量程40MW。\n\n- **20MW / 5MWh** · 2011运行站 · 15min额定比值\n- **40MW** · 充放双向总体调节范围，非单向发电功率\n\n原始来源 · [Stephentown设施数据](https://beaconpower.com/stephentown-new-york/) · [Beacon公司历史](https://beaconpower.com/history/) · [RGA收购公告](https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/)\n\n### Amber Kinetics\n\n美国Amber Kinetics设计制造钢制飞轮系统，在菲律宾设有制造厂，面向电网、微网和孤岛供电部署。\n\n公司披露两座菲律宾工厂年产能可达4,000台；2025年与Indian Energy完成美国首个地上集装箱式系统调试并获UL现场认证。年产能不是实际出货。\n\n- **4000台/年** · 公司披露菲律宾工厂产能，非实际出货\n- **2025-08-06** · 美国地上集装箱式系统调试公告\n\n原始来源 · [公司与工厂](https://amberkinetics.com/company/) · [安装组合](https://amberkinetics.com/installations/) · [美国系统调试公告](https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "飞轮 · 政策机制与市场背景",
      "content": "### 适用机制与工程阶段\n\nFERC Order755（2011-10-20）推进按调频性能补偿，要求公平反映调节服务；这能解释快速响应设备的价值，但不是飞轮专属补贴，也不保证固定收益。原文：\n\n本路线不以新型储能全部GW/GWh图表代表飞轮规模。可选已核工程比较：Stephentown20 MW/5 MWh（2011）、Hazle20 MW（2014）、鼎轮30 MW（2024，未填无依据MWh）。企业不同年份累计运行小时相互冲突或口径不清时，不拼成新的最新纪录。\n\n### 中国试点项目选择\n\n国家能源局2024-04-29说明，56个新型储能试点中包括3个飞轮项目；该数字是获选项目数量，未表示已投运总数或飞轮市场份额。\n\n原始来源 · [原始资料 1](https://www.ferc.gov/sites/default/files/2020-06/OrderNo.755.pdf) · [原始资料 2](https://www.nea.gov.cn/2024-04/29/c_1212357869.htm)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "飞轮 · 系统能力与应用条件",
      "content": "### 介质、功率与运行条件\n\n适合频繁双向调节、功率平滑、再生制动吸收及短时支撑；单次容量不大而循环频繁的需求更符合已有工程主线。额定功率高不等于供能时间长，转子静置于高转速也存在损耗。与电化学储能混合时，飞轮可承担快速波动、较大能量库承担慢变化，但具体分配由信号和成本决定。长时间待机、小时级移时需核实自耗、有效电量及机械约束，不直接拿调频站额定MW替代长时储能能力。\n\n原始来源 · [原始资料 1](https://ntrs.nasa.gov/citations/20020038851) · [原始资料 2](https://ntrs.nasa.gov/citations/20050217267) · [原始资料 3](https://ntrs.nasa.gov/citations/20060028492) · [原始资料 4](https://www.rtri.or.jp/eng/press/2015/nr20150415_01_detail.html) · [原始资料 5](https://beaconpower.com/stephentown-new-york/) · [原始资料 6](https://beaconpower.com/history/) · [原始资料 7](https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/) · [原始资料 8](https://amberkinetics.com/company/) · [原始资料 9](https://amberkinetics.com/installations/) · [原始资料 10](https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "flywheel-policy",
    "label": "政策市场",
    "title": "按调频性能计酬与示范选择",
    "year": "政策",
    "copy": "FERC2011年Order755推动按调频性能补偿，反映快速调节价值。中国2024年公布的试点名单含3个飞轮项目，属于获选数量。",
    "facts": [
      [
        "Order755",
        "美国2011-10-20调频性能计酬规则"
      ],
      [
        "3个项目",
        "中国2024试点获选飞轮数量，非投运总数"
      ]
    ],
    "subject": "scene:flywheel-policy"
  },
  "market": {
    "id": "flywheel-market",
    "label": "中国新型储能（全部技术）",
    "title": "全国行业背景",
    "copy": "2025年底中国新型储能累计功率136GW、能量351GWh。统计覆盖全部新型储能技术，平均时长2.58h，不表示当前机械路线的装机或时长。",
    "year": "2025",
    "facts": [
      [
        "136GW / 351GWh",
        "中国2025年底全部新型储能累计功率/能量"
      ],
      [
        "2.58h",
        "全部技术平均配置时长 · 非当前路线指标"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "flywheel-papers",
    "label": "论文",
    "title": "转速、设计规格与整站能力分列",
    "year": "证据",
    "copy": "NASA试验转速与后续设计规格来自不同记录。电网调频站的额定功率、电量和双向调节范围分别呈现。",
    "facts": [
      [
        "41000rpm",
        "G2实际达到：2004事件、2005报告"
      ],
      [
        "60000rpm / 525Wh / 1kW",
        "2006 G2设计规格，独立证据层级"
      ]
    ],
    "subject": "route:flywheel:history"
  },
  "storage": {
    "id": "flywheel-storage",
    "label": "储能适配",
    "title": "短时能量服务频繁双向功率调节",
    "year": "应用",
    "copy": "适合频繁双向调节、功率平滑、再生制动吸收及短时支撑；单次容量不大而循环频繁的需求更符合已有工程主线。额定功率高不等于供能时间长，转子静置于高转速也存在损耗。",
    "facts": [
      [
        "20MW / 5MWh",
        "Stephentown配置 · 15min额定功率持续比值"
      ],
      [
        "30MW",
        "鼎轮2024并网功率 · 未填写MWh"
      ]
    ],
    "subject": "route:flywheel:history"
  },
  "historySubject": "route:flywheel:history",
  "note": "10个确证年份 · 机械介质与工程条件"
};

export const gravityResearch: ChronicleResearch = {
  "name": "重力储能",
  "timeline": [
    {
      "id": "gravity-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "矿井提升方案进入专门开发",
      "title": "矿井提升方案进入专门开发",
      "copy": "Gravitricity官方公司史记载2011年成立，围绕提升重物的储电技术开发。这是企业研发起点，不是重力势能首次被发现或全球首座储能电站。",
      "facts": [
        [
          "2011",
          "Gravitricity专门研发起点，非势能原理发明"
        ]
      ],
      "detail": "Gravitricity官方公司史记载2011年成立，围绕提升重物的储电技术开发。这是企业研发起点，不是重力势能首次被发现或全球首座储能电站。",
      "source": "https://gravitricity.com/about-gravitricity/",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2016",
      "yearNumber": 2016,
      "year": "2016",
      "label": "ARES获得联邦土地项目决策",
      "title": "ARES获得联邦土地项目决策",
      "copy": "美国BLM发布ARES Nevada决策文件，原拟50 MW轨道重力储能。许可节点证明进入工程开发程序，不证明已投产，不能把规划容量加入运行总量。",
      "facts": [
        [
          "50MW",
          "ARES Nevada当时拟议工程 · 联邦土地决策"
        ]
      ],
      "detail": "美国BLM发布ARES Nevada决策文件，原拟50 MW轨道重力储能。许可节点证明进入工程开发程序，不证明已投产，不能把规划容量加入运行总量。原文件日期2016年2月。",
      "source": "https://eplanning.blm.gov/public_projects/nepa/51794/71801/78820/ARES_DR_February_2016.pdf",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2017",
      "yearNumber": 2017,
      "year": "2017",
      "label": "液压重力模型得到实验校验",
      "title": "液压重力模型得到实验校验",
      "copy": "Experimental Validation of Gravity Energy Storage Hydraulic Modeling以实验验证Simulink模型，关注活塞位置、腔压、循环时间及功率。该构型为重物—液压耦合，不是塔式吊块；小型验证不能直接移植为塔式商业站效率。",
      "facts": [
        [
          "液压模型 + 实验",
          "活塞/腔压/循环时间验证，非塔式商运"
        ]
      ],
      "detail": "Experimental Validation of Gravity Energy Storage Hydraulic Modeling以实验验证Simulink模型，关注活塞位置、腔压、循环时间及功率。该构型为重物—液压耦合，不是塔式吊块；小型验证不能直接移植为塔式商业站效率。",
      "source": "https://www.sciencedirect.com/science/article/pii/S1876610217346702",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "Energy Vault概念样机测试机械与控制",
      "title": "Energy Vault概念样机测试机械与控制",
      "copy": "提交SEC的公司材料记载2018年在瑞士Biasca建概念装置，验证机械动作、效率和自动化编排。不能把概念机标为100 MWh商业站。",
      "facts": [
        [
          "概念样机",
          "Energy Vault Biasca机械与控制试验"
        ]
      ],
      "detail": "提交SEC的公司材料记载2018年在瑞士Biasca建概念装置，验证机械动作、效率和自动化编排。不能把概念机标为100 MWh商业站。",
      "source": "https://www.sec.gov/Archives/edgar/data/1828536/000110465921126855/nxu-20211015xs4.htm",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2020",
      "yearNumber": 2020,
      "year": "2020",
      "label": "5 MW示范与山地储能研究",
      "title": "5 MW示范与山地储能研究",
      "copy": "Energy Vault披露2020年7月完成瑞士5 MW EV1示范机机械建设，随后进行测试。同期Energy190卷正式出版MGES研究：搬运砂/砾石跨越高差，探索月度或季节性储能；论文DOI含2019，卷期为2020，避免将二者当成两篇。",
      "facts": [
        [
          "5MW",
          "EV1示范机械建设完成，后续测试"
        ],
        [
          "月 / 季储存",
          "MGES砂砾搬运模型研究，非已运行季节储能"
        ]
      ],
      "detail": "Energy Vault披露2020年7月完成瑞士5 MW EV1示范机机械建设，随后进行测试。同期Energy190卷正式出版MGES研究：搬运砂/砾石跨越高差，探索月度或季节性储能；论文DOI含2019，卷期为2020，避免将二者当成两篇。",
      "source": "https://investors.energyvault.com/files/doc_financials/2022/q3/a8cee5d7-eaa4-461f-ac48-06b53cdb5f30.pdf",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2021",
      "yearNumber": 2021,
      "year": "2021",
      "label": "250 kW升降重物试验并网",
      "title": "250 kW升降重物试验并网",
      "copy": "Gravitricity在Leith港250 kW试验设施升降两块25 t重物，企业报告从零到全功率小于1秒。它证明快速响应与控制能力；功率试验不证明数小时容量或商业收益。",
      "facts": [
        [
          "250kW / 2×25t",
          "Leith升降重物试验"
        ],
        [
          "小于1s",
          "企业报告零到全功率响应"
        ]
      ],
      "detail": "Gravitricity在Leith港250 kW试验设施升降两块25 t重物，企业报告从零到全功率小于1秒。它证明快速响应与控制能力；功率试验不证明数小时容量或商业收益。",
      "source": "https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "矿井潜力模型与如东并网",
      "title": "矿井潜力模型与如东并网",
      "copy": "UGES原始研究估算废矿利用潜力7—70 TWh，是基于空间和砂量假设的全球模型。另据Energy Vault后续公告，如东9月机械完成、12月电网互联；互联先于完整调试。",
      "facts": [
        [
          "7–70TWh",
          "UGES全球模型潜力，非已装机"
        ],
        [
          "2023年12月",
          "如东电网互联，先于完整调试"
        ]
      ],
      "detail": "UGES原始研究估算废矿利用潜力7—70 TWh，是基于空间和砂量假设的全球模型。另据Energy Vault后续公告，如东9月机械完成、12月电网互联；互联先于完整调试。",
      "source": "https://doi.org/10.3390/en16020825",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "如东充放电单元完成测试",
      "title": "如东充放电单元完成测试",
      "copy": "Energy Vault 2024-05-07公告报告5月4日测试与调试，设计25 MW/100 MWh；正文明确测试充放电单元，图片说明为第一组单元。页面采用“首组充放电单元测试、系统调试”而不扩写为全站100 MWh长期满容量商业运行。",
      "facts": [
        [
          "25MW / 100MWh",
          "如东设计规模 · 首组充放电单元测试"
        ],
        [
          "2024-05-04",
          "测试与调试 · 公告2024-05-07"
        ]
      ],
      "detail": "Energy Vault 2024-05-07公告报告5月4日测试与调试，设计25 MW/100 MWh；正文明确测试充放电单元，图片说明为第一组单元。页面采用“首组充放电单元测试、系统调试”而不扩写为全站100 MWh长期满容量商业运行。",
      "source": "https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "多种固体重力方案接受空间经济评估",
      "title": "多种固体重力方案接受空间经济评估",
      "copy": "The power of sand比较山地、电动卡车、矿井和电梯四种方案，估计全球潜力最高近231 TWh、特定情景季节储能平准化成本低至94 USD/MWh。两项均为模型结果，不是已装机规模或项目报价。",
      "facts": [
        [
          "近231TWh",
          "全球空间经济模型潜力"
        ],
        [
          "94美元/MWh",
          "特定季节储能情景LCOS，非商业报价"
        ]
      ],
      "detail": "The power of sand比较山地、电动卡车、矿井和电梯四种方案，估计全球潜力最高近231 TWh、特定情景季节储能平准化成本低至94 USD/MWh。两项均为模型结果，不是已装机规模或项目报价。",
      "source": "https://www.sciencedirect.com/science/article/pii/S2352152X2501552X",
      "subject": "route:gravity:history"
    },
    {
      "id": "gravity-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "南非合作从煤电场址寻找应用",
      "title": "南非合作从煤电场址寻找应用",
      "copy": "Eskom2026-05-13公告拟在Hendrina开发25 MW/100 MWh首项目，并表达2035年前在南部非洲合作部署最高4 GWh意向。协议、目标与投运分开；不把该4 GWh写成2026已交付。",
      "facts": [
        [
          "25MW / 100MWh",
          "Eskom Hendrina首拟开发项目"
        ],
        [
          "最高4GWh",
          "2035前合作意向，非2026交付"
        ],
        [
          "25–30t",
          "开发方案拟用煤灰重块，非所有装置配方"
        ]
      ],
      "detail": "Eskom2026-05-13公告拟在Hendrina开发25 MW/100 MWh首项目，并表达2035年前在南部非洲合作部署最高4 GWh意向。协议、目标与投运分开；不把该4 GWh写成2026已交付。",
      "source": "https://www.eskom.co.za/energy-vault-and-eskom-announce-strategic-development-agreement-to-deploy-grid-scale-gravity-energy-storage-systems-in-south-africa/",
      "subject": "route:gravity:history"
    }
  ],
  "materials": [
    {
      "id": "gravity-mass",
      "label": "重物、砂砾与复合块",
      "title": "重物、砂砾与复合块",
      "copy": "储能量由质量和有效高差决定，理想E=mgh。砂砾便于在上下储区批量搬运，成型块要求几何一致、强度和耐久性。",
      "facts": [
        [
          "25–30t",
          "Eskom2026开发方案拟用煤灰重块"
        ]
      ],
      "subject": "material:gravity-mass",
      "year": "部件"
    },
    {
      "id": "gravity-hoist",
      "label": "提升机、索具与导向机构",
      "title": "提升机、索具与导向机构",
      "copy": "电机提升重物吸收电力，下降通过发电制动回收。绳索、卷扬、轨道及制动的机械损失与维护构成整机表现；Gravitricity两块25 t试验验证其中一种竖直提升方案，不能当成塔式多块调度的全系统证据。",
      "facts": [
        [
          "2×25t",
          "Gravitricity2021升降试验的两块重物"
        ]
      ],
      "subject": "material:gravity-hoist",
      "year": "部件"
    },
    {
      "id": "gravity-structure",
      "label": "井筒、塔架与上下储区",
      "title": "井筒、塔架与上下储区",
      "copy": "既有矿井可提供高差，但井壁、基础、通行和地上地下储区容量约束仍需验证；地上结构则需新建承载体系与搬运空间。高差不是免费无限资源。",
      "facts": [
        [
          "矿井 / 塔架 / 山地",
          "不同高差和储区约束，非同一构型"
        ]
      ],
      "subject": "material:gravity-structure",
      "year": "部件"
    },
    {
      "id": "gravity-control",
      "label": "电机变流与协调控制",
      "title": "电机变流与协调控制",
      "copy": "连续电力输出需要控制重物加减速、交接及发电制动；大量重块并行会增加调度复杂性。2017液压活塞模型关注压力和阀系，塔式/索提升则关注运动和索力；页面可并列这些专题，但不要画成同一机械结构。",
      "facts": [
        [
          "运动 / 索力 / 阀系",
          "提升、索具和液压构型的不同控制量"
        ]
      ],
      "subject": "material:gravity-control",
      "year": "部件"
    }
  ],
  "companies": [
    {
      "id": "gravity-energy-vault",
      "label": "Energy Vault",
      "year": "2024",
      "title": "EVx首组单元测试与系统调试",
      "copy": "美国Energy Vault为上市储能技术公司，业务含重力、电池和绿色氢能储能，项目按具体技术分类。",
      "facts": [
        [
          "25MW / 100MWh",
          "如东企业设计规模 · 2024首组单元测试"
        ]
      ],
      "subject": "company:gravity-energy-vault"
    },
    {
      "id": "gravity-cnty",
      "label": "中国天楹",
      "year": "2024",
      "title": "如东投资建设与技术合作",
      "copy": "中国天楹（CNTY）为如东EVx重力项目本地投资和建设合作方之一，主营还包括环保与固废处理。",
      "facts": [
        [
          "25MW / 100MWh",
          "如东设计规模 · 项目合作口径"
        ]
      ],
      "subject": "company:gravity-cnty"
    },
    {
      "id": "gravity-gravitricity",
      "label": "Gravitricity",
      "year": "2021",
      "title": "Leith升降重物并网试验",
      "copy": "英国Gravitricity开发以深竖井升降重物储能的方案；商业矿井项目与地上概念演示分开记。",
      "facts": [
        [
          "250kW / 2×25t",
          "并网概念演示 · 非商业矿井容量"
        ],
        [
          "小于1s",
          "企业试验响应，非数小时容量验证"
        ]
      ],
      "subject": "company:gravity-gravitricity"
    },
    {
      "id": "gravity-ares",
      "label": "ARES",
      "year": "开发",
      "title": "轨道式重力储能开发",
      "copy": "美国ARES North America开发轨道式GravityLine，电机驱动质量车爬坡储能、下坡发电。",
      "facts": [
        [
          "5MW",
          "Pahrump当前开发项目规划功率"
        ]
      ],
      "subject": "company:gravity-ares"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "重力储能 · 发展与工程时间线",
      "content": "### 2011：矿井提升方案进入专门开发\n\nGravitricity官方公司史记载2011年成立，围绕提升重物的储电技术开发。这是企业研发起点，不是重力势能首次被发现或全球首座储能电站。\n\n### 2016：ARES获得联邦土地项目决策\n\n美国BLM发布ARES Nevada决策文件，原拟50 MW轨道重力储能。许可节点证明进入工程开发程序，不证明已投产，不能把规划容量加入运行总量。原文件日期2016年2月。\n\n### 2017：液压重力模型得到实验校验\n\nExperimental Validation of Gravity Energy Storage Hydraulic Modeling以实验验证Simulink模型，关注活塞位置、腔压、循环时间及功率。该构型为重物—液压耦合，不是塔式吊块；小型验证不能直接移植为塔式商业站效率。\n\n### 2018：Energy Vault概念样机测试机械与控制\n\n提交SEC的公司材料记载2018年在瑞士Biasca建概念装置，验证机械动作、效率和自动化编排。不能把概念机标为100 MWh商业站。\n\n### 2020：5 MW示范与山地储能研究\n\nEnergy Vault披露2020年7月完成瑞士5 MW EV1示范机机械建设，随后进行测试。同期Energy190卷正式出版MGES研究：搬运砂/砾石跨越高差，探索月度或季节性储能；论文DOI含2019，卷期为2020，避免将二者当成两篇。\n\n### 2021：250 kW升降重物试验并网\n\nGravitricity在Leith港250 kW试验设施升降两块25 t重物，企业报告从零到全功率小于1秒。它证明快速响应与控制能力；功率试验不证明数小时容量或商业收益。\n\n### 2023：矿井潜力模型与如东并网\n\nUGES原始研究估算废矿利用潜力7—70 TWh，是基于空间和砂量假设的全球模型。另据Energy Vault后续公告，如东9月机械完成、12月电网互联；互联先于完整调试。\n\n### 2024：如东充放电单元完成测试\n\nEnergy Vault 2024-05-07公告报告5月4日测试与调试，设计25 MW/100 MWh；正文明确测试充放电单元，图片说明为第一组单元。页面采用“首组充放电单元测试、系统调试”而不扩写为全站100 MWh长期满容量商业运行。\n\n### 2025：多种固体重力方案接受空间经济评估\n\nThe power of sand比较山地、电动卡车、矿井和电梯四种方案，估计全球潜力最高近231 TWh、特定情景季节储能平准化成本低至94 USD/MWh。两项均为模型结果，不是已装机规模或项目报价。\n\n### 2026：南非合作从煤电场址寻找应用\n\nEskom2026-05-13公告拟在Hendrina开发25 MW/100 MWh首项目，并表达2035年前在南部非洲合作部署最高4 GWh意向。协议、目标与投运分开；不把该4 GWh写成2026已交付。\n\n原始来源 · [原始资料 1](https://gravitricity.com/about-gravitricity/) · [原始资料 2](https://eplanning.blm.gov/public_projects/nepa/51794/71801/78820/ARES_DR_February_2016.pdf) · [原始资料 3](https://eplanning.blm.gov/Project-Home/?id=E0AA3889-A7F2-F011-8407-001DD806295A) · [原始资料 4](https://www.sciencedirect.com/science/article/pii/S1876610217346702) · [原始资料 5](https://doi.org/10.1016/j.egypro.2017.09.541) · [原始资料 6](https://www.sec.gov/Archives/edgar/data/1828536/000110465921126855/nxu-20211015xs4.htm) · [原始资料 7](https://investors.energyvault.com/files/doc_financials/2022/q3/a8cee5d7-eaa4-461f-ac48-06b53cdb5f30.pdf) · [原始资料 8](https://research.wu.ac.at/en/publications/mountain-gravity-energy-storage-a-new-solution-for-closing-the-ga/) · [原始资料 9](https://doi.org/10.1016/j.energy.2019.116419) · [原始资料 10](https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/) · [原始资料 11](https://doi.org/10.3390/en16020825) · [原始资料 12](https://www.mdpi.com/1996-1073/16/2/825) · [原始资料 13](https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx) · [原始资料 14](https://www.sciencedirect.com/science/article/pii/S2352152X2501552X) · [原始资料 15](https://doi.org/10.1016/j.est.2025.116839) · [原始资料 16](https://www.eskom.co.za/energy-vault-and-eskom-announce-strategic-development-agreement-to-deploy-grid-scale-gravity-energy-storage-systems-in-south-africa/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "重力储能 · 储能介质与关键部件",
      "content": "### 重物、砂砾与复合块\n储能量由质量和有效高差决定，理想E=mgh。砂砾便于在上下储区批量搬运，成型块要求几何一致、强度和耐久性。Eskom2026方案提出将煤灰用于25—30 t重块，是该开发方案材料方向，不可推定所有现有装置使用同配方。\n\n### 提升机、索具与导向机构\n电机提升重物吸收电力，下降通过发电制动回收。绳索、卷扬、轨道及制动的机械损失与维护构成整机表现；Gravitricity两块25 t试验验证其中一种竖直提升方案，不能当成塔式多块调度的全系统证据。\n\n### 井筒、塔架与上下储区\n既有矿井可提供高差，但井壁、基础、通行和地上地下储区容量约束仍需验证；地上结构则需新建承载体系与搬运空间。高差不是免费无限资源。MGES受地形限制，UGES受矿井和可容纳砂量限制，两者模型潜力不能直接相加为已可开发容量。\n\n### 电机变流与协调控制\n连续电力输出需要控制重物加减速、交接及发电制动；大量重块并行会增加调度复杂性。2017液压活塞模型关注压力和阀系，塔式/索提升则关注运动和索力；页面可并列这些专题，但不要画成同一机械结构。\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S1876610217346702) · [原始资料 2](https://doi.org/10.1016/j.egypro.2017.09.541) · [原始资料 3](https://research.wu.ac.at/en/publications/mountain-gravity-energy-storage-a-new-solution-for-closing-the-ga/) · [原始资料 4](https://doi.org/10.1016/j.energy.2019.116419) · [原始资料 5](https://doi.org/10.3390/en16020825) · [原始资料 6](https://www.mdpi.com/1996-1073/16/2/825) · [原始资料 7](https://www.sciencedirect.com/science/article/pii/S2352152X2501552X) · [原始资料 8](https://doi.org/10.1016/j.est.2025.116839) · [原始资料 9](https://gravitricity.com/about-gravitricity/) · [原始资料 10](https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/) · [原始资料 11](https://www.eskom.co.za/energy-vault-and-eskom-announce-strategic-development-agreement-to-deploy-grid-scale-gravity-energy-storage-systems-in-south-africa/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "重力储能 · 原始研究与条件对照",
      "content": "| 论文 | 研究结果 | 条件及用途 |\n|---|---|---|\n| 2017，Experimental Validation…；DOI 10.1016/j.egypro.2017.09.541 | 液压重力模型与实验进行对照 | 活塞位置、压力、循环时间的模型验证；模型与实验对照；误差量化见原文 |\n| 2020卷期，Mountain Gravity Energy Storage；DOI 10.1016/j.energy.2019.116419 | 砂砾跨高差搬运，讨论小于20 MW需求和月/季储存场景 | 概念及技术经济研究；不是已商业季节储能站 |\n| 2023，Underground Gravity Energy Storage；DOI 10.3390/en16020825 | 全球潜力估计7—70 TWh | 空间/可用砂量等假设敏感，不能称全球现有容量 |\n| 2025，The power of sand；DOI 10.1016/j.est.2025.116839 | 四构型潜力近231 TWh、特定情景LCOS最低94 USD/MWh | 地理经济模型，季节性方案并非所有塔式电站通用成本 |\n\n原始来源 · [原始资料 1](https://doi.org/10.1016/j.egypro.2017.09.541) · [原始资料 2](https://doi.org/10.1016/j.energy.2019.116419) · [原始资料 3](https://doi.org/10.3390/en16020825) · [原始资料 4](https://doi.org/10.1016/j.est.2025.116839) · [原始资料 5](https://www.sciencedirect.com/science/article/pii/S1876610217346702) · [原始资料 6](https://research.wu.ac.at/en/publications/mountain-gravity-energy-storage-a-new-solution-for-closing-the-ga/) · [原始资料 7](https://www.mdpi.com/1996-1073/16/2/825) · [原始资料 8](https://www.sciencedirect.com/science/article/pii/S2352152X2501552X)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "重力储能 · 企业、研究机构与工程",
      "content": "### Energy Vault\n\n美国Energy Vault为上市储能技术公司，业务含重力、电池和绿色氢能储能，项目按具体技术分类。\n\n江苏如东EVx为25MW/100MWh；2023-12完成并网，2024-05首组充放电单元测试与调试，项目页称已commission。最终商业运营以地方审批为准，不能把其电池项目计为重力储能。\n\n- **25MW / 100MWh** · 如东企业设计规模 · 2024首组单元测试\n\n原始来源 · [如东EVx项目数据与状态](https://www.energyvault.com/projects/rudong) · [测试及调试公告](https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx)\n\n### 中国天楹\n\n中国天楹（CNTY）为如东EVx重力项目本地投资和建设合作方之一，主营还包括环保与固废处理。\n\n如东25MW/100MWh EVx由CNTY与合作方投资建设，并与Energy Vault、Atlas Renewable协作；其他项目应逐站区分建设和投运状态。\n\n- **25MW / 100MWh** · 如东设计规模 · 项目合作口径\n\n原始来源 · [Energy Vault公告及项目合作方](https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx)\n\n### Gravitricity\n\n英国Gravitricity开发以深竖井升降重物储能的方案；商业矿井项目与地上概念演示分开记。\n\nLeith于2021年完成250kW并网演示，使用两只各25吨重物和15米高试验架；4–8MW是公司当时规划的商业项目规模，不是已建容量。\n\n- **250kW / 2×25t** · 并网概念演示 · 非商业矿井容量\n- **小于1s** · 企业试验响应，非数小时容量验证\n\n原始来源 · [Leith演示数据](https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/) · [项目状态列表](https://gravitricity.com/projects/)\n\n### ARES\n\n美国ARES North America开发轨道式GravityLine，电机驱动质量车爬坡储能、下坡发电。\n\nPahrump示范项目仍在开发，页面标示规划5MW、约20英亩；单组质量车720,000磅。\n\n- **5MW** · Pahrump当前开发项目规划功率\n\n原始来源 · [ARES项目状态与运行方式](https://aresnorthamerica.com/nevada-project/) · [ARES主页](https://aresnorthamerica.com/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "重力储能 · 政策机制与市场背景",
      "content": "### 适用机制与工程阶段\n\n国家能源局2024-04-29发布会说明：2024年初56个新型储能试点示范项目中包含3个重力、3个飞轮、11个压缩空气、1个液态空气。这里是获选项目数量，不是投运总数，也不是市场份额。\n\n2026南非项目显示煤电场址再利用与材料利用的开发方向；4 GWh合作意向是规划，不与如东100 MWh设计规模相加成已投运统计。\n\n原始来源 · [原始资料 1](https://www.nea.gov.cn/2024-04/29/c_1212357869.htm)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "重力储能 · 系统能力与应用条件",
      "content": "### 介质、功率与运行条件\n\n固体在高处静置可保留势能，适合研究较长储存间隔；实际电站仍有辅助设备、控制和机械维护成本。容量受质量×高差约束，功率受提升速度、驱动能力和并行单元约束；延长储存持续时间通常意味着更多搬运质量或储区。矿井/山地项目利用既有高差，塔式项目换来更可规划的结构但增加土建。快速响应试验与长时经济模型分别证明不同问题：小于1秒响应不等于已实现季节储能，潜力TWh也不等于可融资项目TWh。\n\n原始来源 · [原始资料 1](https://www.sciencedirect.com/science/article/pii/S1876610217346702) · [原始资料 2](https://doi.org/10.1016/j.egypro.2017.09.541) · [原始资料 3](https://research.wu.ac.at/en/publications/mountain-gravity-energy-storage-a-new-solution-for-closing-the-ga/) · [原始资料 4](https://doi.org/10.1016/j.energy.2019.116419) · [原始资料 5](https://doi.org/10.3390/en16020825) · [原始资料 6](https://www.mdpi.com/1996-1073/16/2/825) · [原始资料 7](https://www.sciencedirect.com/science/article/pii/S2352152X2501552X) · [原始资料 8](https://doi.org/10.1016/j.est.2025.116839) · [原始资料 9](https://www.energyvault.com/projects/rudong) · [原始资料 10](https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx) · [原始资料 11](https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/) · [原始资料 12](https://gravitricity.com/projects/) · [原始资料 13](https://aresnorthamerica.com/nevada-project/) · [原始资料 14](https://aresnorthamerica.com/)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "gravity-policy",
    "label": "政策市场",
    "title": "重力进入国家新型储能试点名单",
    "year": "2024",
    "copy": "2024年国家能源局公布的56个试点示范中有3个重力项目。获选项目数量与投运容量、市场份额分别统计。",
    "facts": [
      [
        "3 / 56个",
        "重力获选项目/全部试点 · 非投运统计"
      ]
    ],
    "subject": "scene:gravity-policy"
  },
  "market": {
    "id": "gravity-market",
    "label": "中国新型储能（全部技术）",
    "title": "全国行业背景",
    "copy": "2025年底中国新型储能累计功率136GW、能量351GWh。统计覆盖全部新型储能技术，平均时长2.58h，不表示当前机械路线的装机或时长。",
    "year": "2025",
    "facts": [
      [
        "136GW / 351GWh",
        "中国2025年底全部新型储能累计功率/能量"
      ],
      [
        "2.58h",
        "全部技术平均配置时长 · 非当前路线指标"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "gravity-papers",
    "label": "论文",
    "title": "势能构型试验与空间经济模型",
    "year": "证据",
    "copy": "液压实验、升降重物试验与全球模型潜力各有不同尺度。TWh潜力和情景成本用于模型分析，不当作已交付容量或报价。",
    "facts": [
      [
        "7–70TWh",
        "UGES2023全球模型潜力"
      ],
      [
        "近231TWh / 94美元/MWh",
        "2025模型潜力/特定季节情景LCOS，非装机与报价"
      ]
    ],
    "subject": "route:gravity:history"
  },
  "storage": {
    "id": "gravity-storage",
    "label": "储能适配",
    "title": "质量、高差与提升功率共同设计",
    "year": "应用",
    "copy": "固体在高处静置可保留势能，适合研究较长储存间隔；实际电站仍有辅助设备、控制和机械维护成本。容量受质量×高差约束，功率受提升速度、驱动能力和并行单元约束；延长储存持续时间通常意味着更多搬运质量或储区。",
    "facts": [
      [
        "250kW / 2×25t",
        "Leith试验构型 · 2021企业报告"
      ],
      [
        "25MW / 100MWh",
        "如东设计 · 2024首组单元测试，非长期满容量商运"
      ]
    ],
    "subject": "route:gravity:history"
  },
  "historySubject": "route:gravity:history",
  "note": "10个确证年份 · 机械介质与工程条件"
};
