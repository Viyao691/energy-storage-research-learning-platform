import type { ChronicleResearch } from "./researchRoutes";

export const sensibleResearch: ChronicleResearch = {
  "name": "显热储能",
  "timeline": [
    {
      "id": "thermal-sensible-1975",
      "yearNumber": 1975,
      "year": "1975",
      "label": "太阳能住宅把夏季热量留下",
      "title": "太阳能住宅把夏季热量留下",
      "copy": "热水储存与太阳能集热、住宅用热共同设计。DTU资料记录丹麦Zero Energy House。",
      "facts": [
        [
          "太阳能住宅",
          "1975年DTU研究实例，热水显热储存"
        ]
      ],
      "detail": "DTU研究资料将1975年的Zero Energy House记为丹麦早期太阳能住宅实例，讨论集热、热储存与用热系统配合。此处作为现代系统研究起点，不宣称人类从这一年才使用显热。",
      "source": "https://orbit.dtu.dk/files/4715224/byg-r156.pdf",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-1996",
      "yearNumber": 1996,
      "year": "1996",
      "label": "Solar Two验证高温熔盐链路",
      "title": "Solar Two验证高温熔盐链路",
      "copy": "Solar Two用同一熔盐链路连接接收、储热与产汽。接收器热功率与电站发电功率分别记录。",
      "facts": [
        [
          "290—565°C",
          "60% NaNO₃ / 40% KNO₃"
        ],
        [
          "42.2MW_th",
          "接收器额定热功率"
        ],
        [
          "约10MW_e",
          "电站发电功率"
        ]
      ],
      "detail": "Sandia的Solar Two试验采用60% NaNO₃/40% KNO₃，接收器入口290°C、出口565°C；接收器额定42.2 MW_th，电站约10 MW_e，两个功率并非TES电量。它把白天集热与发电调度分开。",
      "source": "https://www.osti.gov/servlets/purl/793226",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2001",
      "yearNumber": 2001,
      "year": "2001",
      "label": "单罐温跃层减少熔盐用量",
      "title": "单罐温跃层减少熔盐用量",
      "copy": "石英岩与硅砂替代部分熔盐，保留冷热温跃层。填料循环相容性和温跃层扩散成为工程问题。",
      "facts": [
        [
          "2.3MWh_th",
          "Sandia单罐中试，石英岩/硅砂填充"
        ]
      ],
      "detail": "Sandia的2.3 MWh_th中试用石英岩和硅砂填充单罐，在热端与冷端之间保留温跃层。2004技术报告追溯该试验并验证填充材料选择；单罐成本思路同时引入温跃层扩散和循环机械应力问题。",
      "source": "https://www.osti.gov/servlets/purl/919178",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2008",
      "yearNumber": 2008,
      "year": "2008",
      "label": "商业熔盐与混凝土研究并进",
      "title": "商业熔盐与混凝土研究并进",
      "copy": "Andasol1采用两罐间接储热。DLR同期测试混凝土模块，两类系统服务不同工况。",
      "facts": [
        [
          "50MW_e / 1010MWh_th",
          "Andasol1汽轮机/热储容量，7.5h配置"
        ],
        [
          "20m³ / 约50次",
          "DLR混凝土模块，300—400°C、ΔT40K、约4个月"
        ]
      ],
      "detail": "Andasol1数据库记录起始年2008，50 MW_e汽轮机、1010 MWh_th两罐间接储热、7.5小时配置；同年DLR的20 m³混凝土模块已在300—400°C运行约4个月，完成约50次40 K温差循环。前者是商业工程参数，后者是试验条件。",
      "source": "https://solarpaces.nlr.gov/project/andasol-1",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "水坑储热扩大到区域供热",
      "title": "水坑储热扩大到区域供热",
      "copy": "Vojens以大容积水坑实现季节热量调节。可交付能量取决于水量、温差和分层。",
      "facts": [
        [
          "200000m³",
          "Vojens水坑容积，热容量需结合温区"
        ]
      ],
      "detail": "Vojens建成大型季节水坑储热；IEA SHC资料记录200000 m³水坑与区域太阳能供热耦合。m³是水体容积，实际MWh_th还取决于可用温差与分层，不能把容积直接当能量。",
      "source": "https://pubs.iea-shc.org/article?NewsID=265",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "TESIS验证熔盐系统与部件",
      "title": "TESIS验证熔盐系统与部件",
      "copy": "DLR把熔盐储热、阀门和加热器放进系统工况。单罐容量属于热端。",
      "facts": [
        [
          "4MWh_th",
          "TESIS:Store单罐熔盐试验平台"
        ]
      ],
      "detail": "DLR说明TESIS:Store自2018年具备4 MWh单罐熔盐运行经验，并配套部件试验段。这里4 MWh为热容量，不是储能电站输出电量。",
      "source": "https://www.dlr.de/de/tt/forschung-transfer/expertise/forschungsbereich-waermespeicher/thermische-systeme-fuer-fluessigkeiten",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2019",
      "yearNumber": 2019,
      "year": "2019",
      "label": "火山岩中试连通电—热—电",
      "title": "火山岩中试连通电—热—电",
      "copy": "Hamburg ETES用热空气加热火山岩，接蒸汽循环回发电。储热量与电端可交付能量分别计算。",
      "facts": [
        [
          "130MWh_th",
          "ETES储热容量"
        ],
        [
          "约1000t / 750°C",
          "火山岩介质及加热温度"
        ]
      ],
      "detail": "Siemens Gamesa于2019-06-12启用Hamburg ETES，约1000 t火山岩由热空气加热到750°C，储热容量130 MWh_th，配置蒸汽循环回发电。130 MWh_th不是电端可交付130 MWh_e；企业稿未给本次可核的整站往返实测效率。",
      "source": "https://www.siemensgamesa.com/global/en/home/press-releases/190612-siemens-gamesa-inauguration-energy-system-thermal.html",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "砂储热直接接供热网络",
      "title": "砂储热直接接供热网络",
      "copy": "Kankaanpää从2022年夏季使用高温砂储热。历史功率采用当期环境部门披露。",
      "facts": [
        [
          "100kW_th / 8MWh_th",
          "2022年当期资料；现企业页功率另有更新"
        ]
      ],
      "detail": "芬兰Kankaanpää装置从2022年夏季使用，当期环境部门资料记录100 kW_th、8 MWh_th。企业当前参考页已列200 kW供热功率，因此历史节点保留当期100 kW，不把两个规格拼成同年纪录。",
      "source": "https://kestavyysloikka.ymparisto.fi/kankaanpaan-pilottikohteessa-lampoa-varastoidaan-hiekka-akkuun/",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2023",
      "label": "全尺度碳块热电池在加州运行",
      "title": "全尺度碳块热电池在加州运行",
      "year": "2023",
      "copy": "模块在Wellhead设施投入运行，电力加热固体碳块储热；热可供工业，也可通过热光伏模块发电。1800°C是储热温度，不是热输出温度或发电效率。",
      "facts": [
        [
          ">1800°C",
          "公司所述全尺度储热温度"
        ],
        [
          "已运行",
          "Antora于2023-09披露Wellhead现场状态"
        ],
        [
          "容量与额定功率未披露",
          "不推断MWhth或MWth"
        ]
      ],
      "subject": "company:thermal-sensible-antora",
      "yearNumber": 2023,
      "detail": "模块在Wellhead设施投入运行，电力加热固体碳块储热；热可供工业，也可通过热光伏模块发电。1800°C是储热温度，不是热输出温度或发电效率。 Wellhead全尺度模块运行；碳块储热>1800°C，容量/功率未披露",
      "source": "https://www.antora.com/insights/system-launch"
    },
    {
      "id": "thermal-sensible-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "100MWh热储存接入Pornainen",
      "title": "100MWh热储存接入Pornainen",
      "copy": "Pornainen固体储热装置于6月11日启用，向区域管网供热。皂石碎料作为储热介质。",
      "facts": [
        [
          "1MW_th / 100MWh_th",
          "供热功率/储热容量"
        ],
        [
          "约2000t",
          "皂石碎料介质"
        ]
      ],
      "detail": "2025-06-11，Loviisan Lämpö启用1 MW_th/100 MWh_th装置，约2000 t皂石碎料作为介质。它给区域供热网供热，没有证明同容量电端回发电。 Rondo Energy：加州燃料生产设施的装置开始每日自动运行，由现场光伏充电并连续提供工业蒸汽。容量为热能口径；官方公告未列出额定热功率。",
      "source": "https://polarnightenergy.com/fi/news/maailman-suurin-hiekka-akku-kaynnistyi/",
      "subject": "route:thermal-sensible:history"
    },
    {
      "id": "thermal-sensible-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "首个完整供热年公布结果",
      "title": "首个完整供热年公布结果",
      "copy": "Polar Night Energy披露Pornainen年度供热表现。减排量描述供热系统燃料替代，而非转换效率。",
      "facts": [
        [
          "降低70%",
          "企业披露供热网气候排放，2026-06-11"
        ]
      ],
      "detail": "Polar Night Energy于2026-06-11报告Pornainen运行一年，区域供热网气候排放降低70%。这是企业披露的供热系统减排结果，不是热效率70%，也不是电热电效率；归因边界包括被替代燃料和供电。",
      "source": "https://polarnightenergy.com/news/worlds-largest-sand-battery-achieves-its-targets-emissions-reduced-by-70/",
      "subject": "route:thermal-sensible:history"
    }
  ],
  "materials": [
    {
      "id": "thermal-sensible-water",
      "label": "热水与水坑",
      "title": "热水与水坑",
      "year": "介质",
      "copy": "水的比热与温度分层共同决定可用热量。保温盖、内衬与管网换热支持季节储热。",
      "facts": [
        [
          "200000m³",
          "Vojens水坑水体容积，能量取决于温区"
        ]
      ],
      "subject": "material:thermal-sensible-water"
    },
    {
      "id": "thermal-sensible-salt",
      "label": "硝酸盐熔盐",
      "title": "硝酸盐熔盐",
      "year": "介质",
      "copy": "Solar Salt在运行温区保持液态，以比热保存热量。凝固、腐蚀与高温稳定性约束冷热端。",
      "facts": [
        [
          "60% / 40%",
          "Solar Two硝酸钠/硝酸钾"
        ],
        [
          "290—565°C",
          "接收器入口/出口温度"
        ]
      ],
      "subject": "material:thermal-sensible-salt"
    },
    {
      "id": "thermal-sensible-solid",
      "label": "混凝土与固体填充床",
      "title": "混凝土与固体填充床",
      "year": "介质",
      "copy": "混凝土、岩石和砂通过升降温储热。空气或埋管把热量送入介质，换热面积决定交付功率。",
      "facts": [
        [
          "300—400°C",
          "DLR20m³混凝土模块"
        ],
        [
          "约50次循环",
          "ΔT40K、4个月早期试验"
        ]
      ],
      "subject": "material:thermal-sensible-solid"
    },
    {
      "id": "thermal-sensible-insulation",
      "label": "容器、换热与保温",
      "title": "容器、换热与保温",
      "year": "介质",
      "copy": "储热介质决定容量，容器与换热器决定温度和功率。保温及温跃层稳定性控制静置损失。",
      "facts": [
        [
          "冷热分区",
          "温跃层单罐或冷热双罐结构"
        ]
      ],
      "subject": "material:thermal-sensible-insulation"
    }
  ],
  "companies": [
    {
      "id": "thermal-sensible-rondo",
      "label": "Rondo Energy",
      "title": "100 MWh工业热储能装置进入商业运行",
      "year": "2025",
      "copy": "加州燃料生产设施的装置开始每日自动运行，由现场光伏充电并连续提供工业蒸汽。容量为热能口径；官方公告未列出额定热功率。",
      "facts": [
        [
          "100MWh_th",
          "Rondo公司公告标注储热量"
        ],
        [
          ">1000°C",
          "公司报告储热温度"
        ],
        [
          "24小时",
          "连续供高压热与蒸汽；运行十周后达成性能/可靠性里程碑"
        ]
      ],
      "subject": "company:thermal-sensible-rondo"
    },
    {
      "id": "thermal-sensible-antora",
      "label": "Antora Energy / Wellhead",
      "title": "全尺度碳块热电池在加州运行",
      "year": "2023",
      "copy": "模块在Wellhead设施投入运行，电力加热固体碳块储热；热可供工业，也可通过热光伏模块发电。1800°C是储热温度，不是热输出温度或发电效率。",
      "facts": [
        [
          ">1800°C",
          "公司所述全尺度储热温度"
        ],
        [
          "已运行",
          "Antora于2023-09披露Wellhead现场状态"
        ],
        [
          "容量与额定功率未披露",
          "不推断MWhth或MWth"
        ]
      ],
      "subject": "company:thermal-sensible-antora"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "从太阳能住宅到年度供热",
      "title": "从太阳能住宅到年度供热",
      "content": "### 1975｜太阳能住宅把夏季热量留下\n**热水储存成为住宅能源系统的一部分。** DTU研究资料将1975年的Zero Energy House记为丹麦早期太阳能住宅实例，讨论集热、热储存与用热系统配合。此处作为现代系统研究起点，不宣称人类从这一年才使用显热。来源：[原文](https://orbit.dtu.dk/files/4715224/byg-r156.pdf)\n\n### 1996｜Solar Two验证高温熔盐链路\n**接收、储存、产汽共用高温熔盐。** Sandia的Solar Two试验采用60% NaNO₃/40% KNO₃，接收器入口290°C、出口565°C；接收器额定42.2 MW_th，电站约10 MW_e，两个功率并非TES电量。它把白天集热与发电调度分开。来源：原始最终试验报告 [原文](https://www.osti.gov/servlets/purl/793226) ; 当年启用消息 [原文](https://newsreleases.sandia.gov/sandia-labs-shares-major-solar-success-with-industrial-consortium/)\n\n### 2001｜单罐温跃层减少熔盐用量\n**用砂石填充料替代部分液态储热介质。** Sandia的2.3 MWh_th中试用石英岩和硅砂填充单罐，在热端与冷端之间保留温跃层。2004技术报告追溯该试验并验证填充材料选择；单罐成本思路同时引入温跃层扩散和循环机械应力问题。来源：[原文](https://www.osti.gov/servlets/purl/919178) ; [原文](https://inldigitallibrary.inl.gov/sites/sti/sti/sort_20500.pdf)\n\n### 2008｜商业熔盐与混凝土研究并进\n**规模工程和低成本固体介质走向不同应用。** Andasol1数据库记录起始年2008，50 MW_e汽轮机、1010 MWh_th两罐间接储热、7.5小时配置；同年DLR的20 m³混凝土模块已在300—400°C运行约4个月，完成约50次40 K温差循环。前者是商业工程参数，后者是试验条件。来源：[原文](https://solarpaces.nlr.gov/project/andasol-1) ; [原文](https://elib.dlr.de/57976/)\n\n### 2015｜水坑储热扩大到区域供热\n**低温水储热用规模换取季节调节。** Vojens建成大型季节水坑储热；IEA SHC资料记录200000 m³水坑与区域太阳能供热耦合。m³是水体容积，实际MWh_th还取决于可用温差与分层，不能把容积直接当能量。来源：[原文](https://pubs.iea-shc.org/article?NewsID=265) ; [原文](https://task45.iea-shc.org/publications)\n\n### 2018｜TESIS提供兆瓦时级熔盐试验平台\n**把阀门、加热器与单罐储热放在系统工况中验证。** DLR说明TESIS:Store自2018年具备4 MWh单罐熔盐运行经验，并配套部件试验段。这里4 MWh为热容量，不是储能电站输出电量。来源：[原文](https://www.dlr.de/de/tt/forschung-transfer/expertise/forschungsbereich-waermespeicher/thermische-systeme-fuer-fluessigkeiten)\n\n### 2019｜火山岩中试连通电—热—电\n**高温固体填充床进入电网示范。** Siemens Gamesa于2019-06-12启用Hamburg ETES，约1000 t火山岩由热空气加热到750°C，储热容量130 MWh_th，配置蒸汽循环回发电。130 MWh_th不是电端可交付130 MWh_e；企业稿未给本次可核的整站往返实测效率。来源：[原文](https://www.siemensgamesa.com/global/en/home/press-releases/190612-siemens-gamesa-inauguration-energy-system-thermal.html) ; 政府研究项目说明 [原文](https://www.energieforschung.de/de/aktuelles/news/2019/windenergie-in-vulkangestein-speichern-weltpremiere-in-hamburg)\n\n### 2022｜高温砂储热开始提供区域热量\n**电转热直接接供热网络。** 芬兰Kankaanpää装置从2022年夏季使用，当期环境部门资料记录100 kW_th、8 MWh_th。企业当前参考页已列200 kW供热功率，因此历史节点保留当期100 kW，不把两个规格拼成同年纪录。来源：[原文](https://kestavyysloikka.ymparisto.fi/kankaanpaan-pilottikohteessa-lampoa-varastoidaan-hiekka-akkuun/) ; 当前企业页 [原文](https://polarnightenergy.com/reference/worlds-first-sand-battery/)\n\n### 2025｜100 MWh热储存接入Pornainen\n**固体储热从示范扩大到主供热设施。** 2025-06-11，Loviisan Lämpö启用1 MW_th/100 MWh_th装置，约2000 t皂石碎料作为介质。它给区域供热网供热，没有证明同容量电端回发电。来源：[原文](https://polarnightenergy.com/fi/news/maailman-suurin-hiekka-akku-kaynnistyi/)\n\n### 2026｜首个完整供热年公布运行结果\n**从设计参数转向年度供热表现。** Polar Night Energy于2026-06-11报告Pornainen运行一年，区域供热网气候排放降低70%。这是企业披露的供热系统减排结果，不是热效率70%，也不是电热电效率；归因边界包括被替代燃料和供电。来源：[原文](https://polarnightenergy.com/news/worlds-largest-sand-battery-achieves-its-targets-emissions-reduced-by-70/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "水、熔盐与固体介质",
      "title": "水、熔盐与固体介质",
      "content": "### 热水与水坑\n水通过温度变化存热，理想Q=m∫c_p(T)dT。材料易获得，适合热水、建筑与区域供热；分层使热端保持可用温度。工程关键是保温盖、内衬、补水、地基和与管网的换热。相同水量在不同供回水温度下有效储热量不同。Vojens证明大容积季节储存路径；升高温度还涉及压力和水的相态，不能无限扩大ΔT。\n\n### 硝酸盐熔盐\nSolar Salt实例为NaNO₃/KNO₃混合物；Solar Two在约290—565°C之间保持液态，利用比热储能。双罐分别容纳冷热盐；间接系统还通过导热油—盐换热器。盐的凝固点限制冷端，热稳定性和腐蚀限制热端，管道与阀门需要伴热防凝。名称中“熔盐”不代表靠熔化潜热工作。来源：Solar Two原始报告、Andasol配置。\n\n### 混凝土及固体填充床\n混凝土、岩石、砂/皂石在循环中升降温，导热路径和换热面积决定功率。混凝土内埋管可用导热油传热；岩石填充床可由空气直接换热。材料便宜不等于系统便宜，须计入换热器、风机、保温及结构循环应力。DLR50次循环是早期模块证据，不能写成所有固体介质万次无衰减。\n\n### 罐体、换热器与保温\n储热介质决定容量潜力，容器与换热决定是否能以所需温度和功率交付。单罐温跃层需要维持热冷分区；两罐需要更多容器和熔盐。长时间静置仍会向环境散热，保温设计影响待机损失。DOE概述：[原文](https://www.energy.gov/cmei/systems/solar-thermal-energy-storage-and-heat-transfer-media)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "系统试验与循环数据",
      "title": "系统试验与循环数据",
      "content": "### 原始研究与试验条件\n\n| 原始研究/报告 | 尺度与工况 | 结果与意义 |\n|---|---|---|\n| Sandia，Final Test and Evaluation Results from the Solar Two Project，2002，OSTI793226 | 硝酸盐60/40；290—565°C；接收器42.2 MW_th | 太阳能接收、熔盐储存与产汽系统试验，区分接收器热功率与发电功率；[原文](https://www.osti.gov/servlets/purl/793226) |\n| Sandia，Testing thermocline filler materials…，2004，SAND2004-3207 | 2.3 MWh_th温跃层中试背景、石英岩/硅砂、熔盐相容性及热循环测试 | 填充料可减少所需熔盐，选择需经材料与循环验证；[原文](https://www.osti.gov/servlets/purl/919178) |\n| Laing等，2008，Concrete Storage for Solar Thermal Power Plants and Industrial Process Heat | 第二代20 m³模块、300—400°C、约50次ΔT40 K循环、4个月 | 固体显热模块运行证据；早期试验时长不能充当整寿命保证；[原文](https://elib.dlr.de/57976/) |",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "显热储能工程与供应主体",
      "title": "显热储能工程与供应主体",
      "content": "### Rondo Energy\n\n美国工业热储能开发商，以电加热耐火砖并经电阻元件储热，向工厂连续供蒸汽。\n\n私营企业；无公开股票代码\n\n100MWh_th商业运行；公司称储热>1000°C、连续供蒸汽（公司公告 2025-10-16）\n\n加州燃料生产设施的装置开始每日自动运行，由现场光伏充电并连续提供工业蒸汽。容量为热能口径；官方公告未列出额定热功率。\n\n- **100MWh_th**：Rondo公司公告标注储热量\n- **>1000°C**：公司报告储热温度\n- **24小时**：连续供高压热与蒸汽；运行十周后达成性能/可靠性里程碑\n\n来源：[Rondo官方商业运行公告，2025-10-16](https://www.rondo.com/news-press/rondo-powers-up-worlds-largest-industrial-heat-battery)\n\n### Antora Energy / Wellhead\n\n美国工业热与电力储能开发商，利用电加热固体碳块储热，热可直接供工业使用，也可通过热光伏模块转为电力。\n\n私营企业；无公开股票代码\n\nWellhead全尺度模块运行；碳块储热>1800°C，容量/功率未披露（公司公告 2023-09-12）\n\n模块在Wellhead设施投入运行，电力加热固体碳块储热；热可供工业，也可通过热光伏模块发电。1800°C是储热温度，不是热输出温度或发电效率。\n\n- **>1800°C**：公司所述全尺度储热温度\n- **已运行**：Antora于2023-09披露Wellhead现场状态\n- **容量与额定功率未披露**：不推断MWhth或MWth\n\n来源：[Antora官方系统发布公告，2023-09-12](https://www.antora.com/insights/system-launch)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "储热研发政策与工程需求",
      "title": "储热研发政策与工程需求",
      "content": "### 研发评估与建筑应用\n\nDOE 2023 Thermal Energy Storage Technology Strategy Assessment把储热纳入Storage Innovations2030，讨论材料、系统、制造和应用成本；这是研发评估，不是已达成本或全球装机统计。原文：[原文](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Thermal%20Energy%20Storage_0.pdf)\n\n建筑侧另有DOE2024技术资料，强调TES与现场可再生能源及热泵集成。来源：[原文](https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings) 。展示市场时用“区域供热、工业过程热、CSP调度、电热电”四类用途；不把中国新型储能136 GW/351 GWh统计当成显热市场。工程项目分别列出Vojens容积、Andasol热容量和Pornainen热功率/容量的独立工程表，不作同单位排行。\n\n### 中国热（冷）储能研发与示范\n\n国家发展改革委、国家能源局2022年实施方案列出热（冷）储能长时间尺度攻关，提出拓展热（冷）储能应用与高效储热日到周、周到季示范。这是研发与示范安排，项目容量按各自热端边界记录。\n\n来源：[2022原始实施方案](https://www.ndrc.gov.cn/xxgk/zcfb/tz/202203/P020220321543703119995.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "按温度、功率与能量交付",
      "title": "按温度、功率与能量交付",
      "content": "### 交付任务与系统约束\n\n| 需求 | 匹配方式 | 主要约束 |\n|---|---|---|\n| 热水/区域供热 | 水罐、水坑或固体储热经换热供水 | 管网温度、散热、空间、季节负荷 |\n| 工业过程热 | 电阻加热固体或熔盐，再输出热空气/蒸汽 | 交付温度、连续功率、换热压降与材料稳定性 |\n| 光热发电 | 集热侧先储热，再向动力循环供热 | 发电效率、日照、盐冻结与启停 |\n| 电力移时 | 电—热—电完整链路 | 回发电引入热机损失；热端高效率不等于电端高效率 |\n\n显热的容量扩展主要增加介质与容器，功率扩展主要增加换热及加热设备。低温热水适合直接用热，高温介质拓展过程热和发电；比较时应同时给出储热温区、热端/电端输出与时间，避免只看单一MWh数字。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "thermal-sensible-policy",
    "label": "政策市场",
    "title": "储热研发与建筑用热",
    "year": "2023—2024",
    "copy": "DOE把储热材料、制造与应用成本纳入研发评估。建筑侧关注热泵、现场可再生能源和热储存协同。",
    "facts": [
      [
        "Storage Innovations 2030",
        "DOE2023技术策略评估，研发路线"
      ],
      [
        "建筑热储能",
        "DOE2024建筑侧资料"
      ]
    ],
    "subject": "scene:thermal-policy"
  },
  "market": {
    "id": "thermal-sensible-market",
    "label": "工程市场",
    "title": "热需求决定项目尺度",
    "year": "项目",
    "copy": "区域供热、工业过程热、光热发电与电热电服务不同需求。热容量、热功率与电功率并列记录。",
    "facts": [
      [
        "1010MWh_th",
        "Andasol1两罐热储容量"
      ],
      [
        "1MW_th / 100MWh_th",
        "Pornainen2025供热系统"
      ]
    ],
    "subject": "route:thermal-sensible:history"
  },
  "historySubject": "route:thermal-sensible:history",
  "note": "独立热储存系统研究",
  "papers": {
    "id": "thermal-sensible-papers",
    "label": "论文",
    "title": "从熔盐系统到固体模块试验",
    "year": "试验",
    "copy": "原始报告分别测试完整熔盐链路、填料相容性和混凝土循环。系统工况与样品尺度随结果一起阅读。",
    "facts": [
      [
        "2.3MWh_th",
        "Sandia温跃层中试背景"
      ],
      [
        "约50次",
        "DLR混凝土ΔT40K循环，300—400°C"
      ]
    ],
    "subject": "material:thermal-sensible-salt"
  },
  "storage": {
    "id": "thermal-sensible-storage",
    "label": "储能适配",
    "title": "先确定交付热量还是电量",
    "year": "应用",
    "copy": "直接用热可由热水、热空气或蒸汽交付。回发电还需动力循环，储热容量与电端能量分别计量。",
    "facts": [
      [
        "区域供热 / 过程热",
        "按管网及工艺交付温度设计"
      ],
      [
        "电—热—电",
        "包括回发电热机转换损失"
      ]
    ],
    "subject": "route:thermal-sensible:history"
  },
  "showMarketChart": false
};

export const latentResearch: ChronicleResearch = {
  "name": "潜热储能",
  "timeline": [
    {
      "id": "thermal-latent-1948",
      "yearNumber": 1948,
      "year": "1948",
      "label": "Dover住宅用相变盐保留太阳热",
      "title": "Dover住宅用相变盐保留太阳热",
      "copy": "Dover Sun House以芒硝储热，把白天太阳热留到夜间。相变温区与建筑集热、空气循环配合。",
      "facts": [
        [
          "芒硝相变盐",
          "1948年Dover住宅应用，USPTO历史档案"
        ]
      ],
      "detail": "太阳能住宅把白天收集的热留到夜间，潜热从材料性质走向建筑系统。 美国专利商标局对 Maria Telkes 的历史档案记载，1948 年建成的 Dover Sun House 使用 Glauber’s salt（芒硝）储热，由 Eleanor Raymond 设计、Amelia Peabody 资助。这是本时间线采用的早期建筑应用节点，不宣称它是人类首次利用潜热。盐的相变能够在相对集中的温区吸放热；建筑可用性还取决于集热器、空气循环与季节负荷，不能仅凭材料熔化焓判断全年供暖能力。",
      "source": "https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/solar-life",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "蒸汽相变与材料相变配对",
      "title": "蒸汽相变与材料相变配对",
      "copy": "DLR用硝酸钠凝固放热支持水的蒸发。铝翅片加强模块换热，蒸汽工况与盐的相变温度配对。",
      "facts": [
        [
          "约680kWh_th / 14t",
          "NaNO₃潜热模块，约306°C相变"
        ],
        [
          "约107bar / 320°C",
          "典型充热蒸汽工况"
        ]
      ],
      "detail": "DLR 将硝酸钠模块放进直接蒸汽发电试验系统，解决蒸发段的恒温供热。 ISES 2011 原始会议论文报告约 14 t NaNO₃ 的潜热模块、约 680 kWh_th 储热量及铝翅片。充热典型蒸汽条件约 107 bar、320 °C；NaNO₃ 相变点约 306 °C。蒸汽冷凝向 PCM 放热，放热阶段由盐凝固供给水汽化的热量。相比仅靠温度滑落的显热，潜热段更贴近沸腾温区；但必须保持换热温差，翅片和传热管的体积也会降低整机的单位体积有效容量。",
      "source": "https://proceedings.ises.org/conference/swc2011/papers/swc2011-0073-Laing.pdf",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "相变焓测量统一条件",
      "title": "相变焓测量统一条件",
      "copy": "IEA SHC整理DSC储热测量方法。扫描速度、热历史与积分区间随材料焓一起报告。",
      "facts": [
        [
          "热流型DSC",
          "恒定升降温速率测量方法，IEA SHC Task42"
        ]
      ],
      "detail": "跨实验室比较从“谁的潜热更高”转向“用什么条件测得”。 IEA SHC Task 42 在 2015 年总结材料与系统工作，并发布恒定升降温速率下热流型 DSC 测定 PCM 储热能力的统一方法，涉及样品量、坩埚预热和相变后继续测量的时间。该节点是研究方法进展：毫克样品的热历史、扫描速度和积分范围会改变相变峰与焓的结果，统一方法才能判断不同配方的提升是否可比。",
      "source": "https://m.iea-shc.org/article?NewsID=103",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2017",
      "yearNumber": 2017,
      "year": "2017",
      "label": "石蜡循环试验扩展到一万次",
      "title": "石蜡循环试验扩展到一万次",
      "copy": "自动冷热交替装置重复检验一种商业石蜡。材料熔化焓变化与换热器、封装寿命分别评价。",
      "facts": [
        [
          "10000次 / 下降9.1%",
          "特定商业石蜡混合物的熔化焓；摘要未列完整温度程序"
        ]
      ],
      "detail": "长期可靠性开始用大量重复相变检验。 Zhang、Dong 开发自动交替热源与冷源的加速循环装置，对一种商业石蜡混合物完成 10,000 次热循环；熔化焓下降 9.1%，熔点变化可忽略。结果支持该样品在频繁充放热场景继续研究，但没有证明所有石蜡配方都具有同一寿命，也没有直接验证封装件、换热器或整台热储能系统的一万次寿命。公开摘要未列完整温度程序，本底稿不补造上下限温度。",
      "source": "https://doi.org/10.1016/j.tsep.2017.02.005",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "金属PCM稳定高温出口",
      "title": "金属PCM稳定高温出口",
      "copy": "ALACAES把金属潜热段与显热床组合。短期循环同时暴露泄漏与相分离问题。",
      "facts": [
        [
          "171.5kWh_th",
          "铝铜硅合金潜热段，296根钢管"
        ],
        [
          "11.6MWh_th",
          "另一显热段，分开计量"
        ],
        [
          "4次约3h / 最高566°C",
          "原型循环次数、时长及空气进口温度"
        ]
      ],
      "detail": "高温潜热开始承担稳定出口温度的系统任务。 ALACAES 试验将铝铜硅合金装入 296 根钢管，潜热部分约 171.5 kWh_th，与约 11.6 MWh_th 显热床组合；论文报告 4 次、每次约 3 h 的循环，进口空气最高约 566 °C。试验同时暴露焊缝、测温接口泄漏以及非理想合金组成的相分离问题。它说明潜热可改善显热系统末端温度变化，也说明高温封装和循环冶金稳定性是工程核心，不能把短期试验写成长期商业运行。",
      "source": "https://doi.org/10.1016/j.est.2018.02.003",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "导热骨架与共晶设计并进",
      "title": "导热骨架与共晶设计并进",
      "copy": "石墨骨架改善水合盐传热，共晶组成调整相变温区。不同配方的数据随各自测量条件阅读。",
      "facts": [
        [
          "4±0.2W/(m·K)",
          "氯化钙/石墨复合体，导热测量15—20°C"
        ],
        [
          "11.2—32.7°C / 137—151J/g",
          "硝酸锌不同共晶配方，1°C/min量热"
        ],
        [
          "最多200次 / 超过100次",
          "前者复合体无潜热下降；后者毫升级共晶循环，非同样品"
        ]
      ],
      "detail": "研究同时解决“热进不去”和“相变温度不合用”。 Blackley 等将表面改性的压缩膨胀石墨与六水氯化钙结合，报告导热率 4 ± 0.2 W/(m·K)、过冷小于 1 °C，以及最多 200 次循环未观察到潜热下降；含盐复合体的导热测量在 15–20 °C 进行以避开相变。不同配方的最高潜热与最高导热率不拼成一个未定义的统一样品。\n\n同年 12 月 20 日在线发表的硝酸锌共晶论文，把 NaNO₃、KNO₃ 或 NH₄NO₃ 与六水硝酸锌配对，分别获得约 32.7、22.1、11.2 °C 的相变点及 151、140、137 J/g 相变焓。最终物性以 1 °C/min 微量量热条件测定；含滑石成核粒子的毫升级样品完成超过 100 次循环。该工作于 2024 年 3 月编入期刊，时间线按首次在线发表计为 2023 年。",
      "source": "https://www.nrel.gov/docs/fy23osti/85714.pdf",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "建筑储热服务负荷移时",
      "title": "建筑储热服务负荷移时",
      "copy": "DOE建筑资料把储热用于削峰与时段转移。PCM凝固和熔化温区需匹配冷水、热泵或热水回路。",
      "facts": [
        [
          "建筑负荷移时",
          "DOE2024技术资料，非潜热装机统计"
        ]
      ],
      "detail": "应用评价开始围绕建筑需要的供冷与供热时间展开。 美国能源部 2024 年商业建筑储热资料将储热作为转移用电时段、管理峰值需求的手段。对潜热系统而言，目标不是让 PCM 温度越高越好，而是让凝固/熔化温区与冷水、热泵或生活热水回路匹配。该节点代表政府面向建筑应用的技术推广，不代表当年新增潜热装机总量，也不说明建筑储热全部采用 PCM。",
      "source": "https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings",
      "subject": "route:thermal-latent:history"
    },
    {
      "id": "thermal-latent-2025",
      "label": "Tomago 5 MWhth潜热示范装置投运",
      "title": "Tomago 5 MWhth潜热示范装置投运",
      "year": "2025",
      "copy": "蒸汽集成示范系统以0.5 MWe充电、0.5 MWth输出365°C过热蒸汽，设计储热5 MWhth、10小时。约1800 MWhth/年为每日一循环估算，不是已经累计发出的年度计量。",
      "facts": [
        [
          "5MWh_th",
          "示范装置热容量"
        ],
        [
          "0.5MW_e / 0.5MW_th",
          "充电电功率 / 放热功率"
        ],
        [
          "365°C · 10h",
          "过热蒸汽温度与额定储热时长"
        ]
      ],
      "subject": "company:thermal-latent-mga",
      "yearNumber": 2025,
      "detail": "蒸汽集成示范系统以0.5 MWe充电、0.5 MWth输出365°C过热蒸汽，设计储热5 MWhth、10小时。约1800 MWhth/年为每日一循环估算，不是已经累计发出的年度计量。 Tomago：5MWh_th，充0.5MW_e/放0.5MW_th，365°C蒸汽、设计10h",
      "source": "https://mgathermal.com/flagship-projects/mga-demonstration-plant"
    },
    {
      "id": "thermal-latent-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "金属PCM采用两阶段封装",
      "title": "金属PCM采用两阶段封装",
      "copy": "Al—Si预封装与留空隙的金属微胶囊容纳熔化膨胀。材料试验记录循环后的潜热保持。",
      "facts": [
        [
          "300次 / 96.85%",
          "样品潜热保留率，公开摘要；非转换效率"
        ]
      ],
      "detail": "封装设计直接针对熔化膨胀与漏液失效。 2026 年原始研究提出两阶段封装：先将 Al–Si 与陶瓷预封装，再用含膨胀空隙的金属微胶囊形成外层。公开论文摘要报告 300 次热循环后潜热保留率 96.85%。这里的百分比是材料样品循环后的潜热保留率，不是往返能量效率；摘要未给出的完整温度程序和工业模块运行小时数不补写。进展在于为金属熔化的体积变化留出空间，并让外层阻止熔融金属泄漏和氧进入。",
      "source": "https://www.sciencedirect.com/science/article/pii/S1364032126001127",
      "subject": "route:thermal-latent:history"
    }
  ],
  "materials": [
    {
      "id": "thermal-latent-paraffin",
      "label": "石蜡与有机PCM",
      "title": "石蜡与有机PCM",
      "year": "介质",
      "copy": "石蜡以固液相变吸放热，配方决定工作温区。封装、导热和可燃性共同影响模块设计。",
      "facts": [
        [
          "10000次",
          "2017特定石蜡混合物材料试验，熔化焓下降9.1%"
        ]
      ],
      "subject": "material:thermal-latent-paraffin"
    },
    {
      "id": "thermal-latent-salt-hydrate",
      "label": "盐水合物与共晶",
      "title": "盐水合物与共晶",
      "year": "介质",
      "copy": "盐水合物的过冷、相分离与导热需要一起处理。共晶调温与成核粒子帮助把材料温区贴近建筑任务。",
      "facts": [
        [
          "11.2—32.7°C",
          "硝酸锌三种共晶相变温度，2023在线"
        ],
        [
          "137—151J/g",
          "对应配方焓范围，1°C/min量热"
        ]
      ],
      "subject": "material:thermal-latent-salt-hydrate"
    },
    {
      "id": "thermal-latent-metal",
      "label": "金属与高温无机PCM",
      "title": "金属与高温无机PCM",
      "year": "介质",
      "copy": "硝酸钠支持蒸汽温区，铝基合金用于更高温潜热缓冲。容器相容性、氧化和膨胀约束设计。",
      "facts": [
        [
          "约306°C",
          "NaNO₃相变点，2011DLR模块"
        ],
        [
          "171.5kWh_th",
          "2018ALACAES金属潜热段"
        ]
      ],
      "subject": "material:thermal-latent-metal"
    },
    {
      "id": "thermal-latent-encapsulation",
      "label": "封装、翅片与导热骨架",
      "title": "封装、翅片与导热骨架",
      "year": "介质",
      "copy": "翅片缩短传热路径，石墨改善热扩散，留空隙封装缓冲体积变化。三种结构承担不同任务。",
      "facts": [
        [
          "300次后96.85%",
          "2026两阶段Al—Si样品潜热保留率，摘要证据"
        ]
      ],
      "subject": "material:thermal-latent-encapsulation"
    }
  ],
  "companies": [
    {
      "id": "thermal-latent-mga",
      "label": "MGA Thermal",
      "title": "Tomago 5 MWhth潜热示范装置投运",
      "year": "2025",
      "copy": "蒸汽集成示范系统以0.5 MWe充电、0.5 MWth输出365°C过热蒸汽，设计储热5 MWhth、10小时。约1800 MWhth/年为每日一循环估算，不是已经累计发出的年度计量。",
      "facts": [
        [
          "5MWh_th",
          "示范装置热容量"
        ],
        [
          "0.5MW_e / 0.5MW_th",
          "充电电功率 / 放热功率"
        ],
        [
          "365°C · 10h",
          "过热蒸汽温度与额定储热时长"
        ]
      ],
      "subject": "company:thermal-latent-mga"
    },
    {
      "id": "thermal-latent-sunamp",
      "label": "Sunamp",
      "title": "P58相变模块接建筑热水回路",
      "year": "产品",
      "copy": "Thermino P58在约58°C固液转变，向水回路放热。Latham案例记录用电峰值，案例页未注明发生日期。",
      "facts": [
        [
          "约58°C",
          "P58相变点，2025-10-13手册"
        ],
        [
          "2198W / 3107W",
          "Latham模块/对照热水器峰值，企业案例报降约29%"
        ]
      ],
      "subject": "company:thermal-latent-sunamp"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "相变材料进入建筑与工业",
      "title": "相变材料进入建筑与工业",
      "content": "### 1948｜Dover 住宅用相变盐保留太阳热\n\n**太阳能住宅把白天收集的热留到夜间，潜热从材料性质走向建筑系统。** 美国专利商标局对 Maria Telkes 的历史档案记载，1948 年建成的 Dover Sun House 使用 Glauber’s salt（芒硝）储热，由 Eleanor Raymond 设计、Amelia Peabody 资助。这是本时间线采用的早期建筑应用节点，不宣称它是人类首次利用潜热。盐的相变能够在相对集中的温区吸放热；建筑可用性还取决于集热器、空气循环与季节负荷，不能仅凭材料熔化焓判断全年供暖能力。\n\n来源：[USPTO：A solar life](https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/solar-life)。\n\n### 2011｜蒸汽相变与储热材料相变配对\n\n**DLR 将硝酸钠模块放进直接蒸汽发电试验系统，解决蒸发段的恒温供热。** ISES 2011 原始会议论文报告约 14 t NaNO₃ 的潜热模块、约 680 kWh_th 储热量及铝翅片。充热典型蒸汽条件约 107 bar、320 °C；NaNO₃ 相变点约 306 °C。蒸汽冷凝向 PCM 放热，放热阶段由盐凝固供给水汽化的热量。相比仅靠温度滑落的显热，潜热段更贴近沸腾温区；但必须保持换热温差，翅片和传热管的体积也会降低整机的单位体积有效容量。\n\n来源：[Laing 等，Combined Storage System Developments for Direct Steam Generation，2011，原论文](https://proceedings.ises.org/conference/swc2011/papers/swc2011-0073-Laing.pdf)。680 kWh_th 是论文模块值，不写成 680 kWh_e，也不把其他介绍中的约 700 kWh 当作第二台装置。\n\n### 2015｜相变焓测量开始统一条件\n\n**跨实验室比较从“谁的潜热更高”转向“用什么条件测得”。** IEA SHC Task 42 在 2015 年总结材料与系统工作，并发布恒定升降温速率下热流型 DSC 测定 PCM 储热能力的统一方法，涉及样品量、坩埚预热和相变后继续测量的时间。该节点是研究方法进展：毫克样品的热历史、扫描速度和积分范围会改变相变峰与焓的结果，统一方法才能判断不同配方的提升是否可比。\n\n来源：[IEA SHC Task 42，2015-10-03，含 2015 年 1 月测量标准与 8 月立场报告](https://m.iea-shc.org/article?NewsID=103)。\n\n### 2017｜石蜡循环试验扩展到一万次\n\n**长期可靠性开始用大量重复相变检验。** Zhang、Dong 开发自动交替热源与冷源的加速循环装置，对一种商业石蜡混合物完成 10,000 次热循环；熔化焓下降 9.1%，熔点变化可忽略。结果支持该样品在频繁充放热场景继续研究，但没有证明所有石蜡配方都具有同一寿命，也没有直接验证封装件、换热器或整台热储能系统的一万次寿命。公开摘要未列完整温度程序，公开摘要未给完整温度程序。\n\n来源：[Zhang & Dong，Thermal Science and Engineering Progress 1 (2017) 78–87](https://doi.org/10.1016/j.tsep.2017.02.005)。\n\n### 2018｜金属 PCM 进入压缩空气储热试验\n\n**高温潜热开始承担稳定出口温度的系统任务。** ALACAES 试验将铝铜硅合金装入 296 根钢管，潜热部分约 171.5 kWh_th，与约 11.6 MWh_th 显热床组合；论文报告 4 次、每次约 3 h 的循环，进口空气最高约 566 °C。试验同时暴露焊缝、测温接口泄漏以及非理想合金组成的相分离问题。它说明潜热可改善显热系统末端温度变化，也说明高温封装和循环冶金稳定性是工程核心，不能把短期试验写成长期商业运行。\n\n来源：[Pilot-scale demonstration of advanced adiabatic compressed air energy storage, Part 2，2018](https://doi.org/10.1016/j.est.2018.02.003)。\n\n### 2023｜导热骨架与共晶设计同时推进\n\n**研究同时解决“热进不去”和“相变温度不合用”。** Blackley 等将表面改性的压缩膨胀石墨与六水氯化钙结合，报告导热率 4 ± 0.2 W/(m·K)、过冷小于 1 °C，以及最多 200 次循环未观察到潜热下降；含盐复合体的导热测量在 15–20 °C 进行以避开相变。不同配方的最高潜热与最高导热率不拼成一个未定义的统一样品。\n\n同年 12 月 20 日在线发表的硝酸锌共晶论文，把 NaNO₃、KNO₃ 或 NH₄NO₃ 与六水硝酸锌配对，分别获得约 32.7、22.1、11.2 °C 的相变点及 151、140、137 J/g 相变焓。最终物性以 1 °C/min 微量量热条件测定；含滑石成核粒子的毫升级样品完成超过 100 次循环。该工作于 2024 年 3 月编入期刊，时间线按首次在线发表计为 2023 年。\n\n来源：[Blackley 等，ACS Applied Energy Materials，2023，原论文](https://www.nrel.gov/docs/fy23osti/85714.pdf)；[Ahmed 等，DOI 10.1021/acsaenm.3c00444](https://pubs.acs.org/doi/10.1021/acsaenm.3c00444)。\n\n### 2024｜建筑储热成为明确的负荷调节工具\n\n**应用评价开始围绕建筑需要的供冷与供热时间展开。** 美国能源部 2024 年商业建筑储热资料将储热作为转移用电时段、管理峰值需求的手段。对潜热系统而言，目标不是让 PCM 温度越高越好，而是让凝固/熔化温区与冷水、热泵或生活热水回路匹配。该节点代表政府面向建筑应用的技术推广，不代表当年新增潜热装机总量，也不说明建筑储热全部采用 PCM。\n\n来源：[DOE，Thermal Energy Storage for Commercial Buildings，2024-05-31](https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings)。\n\n### 2026｜金属相变材料加强双层封装\n\n**封装设计直接针对熔化膨胀与漏液失效。** 2026 年原始研究提出两阶段封装：先将 Al–Si 与陶瓷预封装，再用含膨胀空隙的金属微胶囊形成外层。公开论文摘要报告 300 次热循环后潜热保留率 96.85%。这里的百分比是材料样品循环后的潜热保留率，不是往返能量效率；摘要未给出的完整温度程序和工业模块运行小时数不补写。进展在于为金属熔化的体积变化留出空间，并让外层阻止熔融金属泄漏和氧进入。\n\n来源：[Xu 等，Efficient two-stage encapsulation of metallic phase change materials，2026，DOI 10.1016/j.rser.2026.116813](https://www.sciencedirect.com/science/article/pii/S1364032126001127)。数据依据出版商公开摘要。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "从配方到封装结构",
      "title": "从配方到封装结构",
      "content": "### 石蜡与有机 PCM\n\n石蜡以固液相变吸放热，配方决定相变温区。优点是可针对建筑和热管理需求选温度；不足是传热速度、熔化后的密封和可燃性需要独立处理。2017 年 10,000 次循环结果体现特定商业混合物的材料耐久，不等于换热模块寿命。导热增强骨架占据空间后，复合材料的单位质量潜热可能低于纯 PCM，不能只展示导热率提升而省略有效 PCM 比例。\n\n来源：[石蜡循环原论文](https://doi.org/10.1016/j.tsep.2017.02.005)。\n\n### 盐水合物、共晶与成核\n\n盐水合物可在建筑温区提供较高体积储热密度，但过冷会使放热迟迟不触发，相分离会使后续循环无法完整恢复。2023 年硝酸锌共晶通过改变组成调温，再用滑石降低成核障碍；氯化钙/石墨研究则同时处理导热、过冷和相分离。这里利用的是熔化与凝固；如果利用脱水—水合反应并分离水蒸气，应归入热化学专题，同一种盐可因运行路径不同跨专题出现。\n\n来源：[硝酸锌共晶](https://doi.org/10.1021/acsaenm.3c00444)；[六水氯化钙复合体](https://doi.org/10.1021/acsaem.3c01223)。\n\n### 金属与高温无机 PCM\n\n硝酸钠约 306 °C 的相变适合与蒸汽换热段配合；铝基合金用于更高温区的潜热缓冲。金属的高温氧化、热膨胀、熔融态对容器的相容性和非共晶组分偏析必须共同考虑。2018 年 ALACAES 的 296 根钢管试验说明材料焓只是起点，焊接和接口也能决定能否稳定储热。已保持液态、仅通过温差储热的两罐熔盐则属于显热。\n\n来源：[DLR 2011](https://proceedings.ises.org/conference/swc2011/papers/swc2011-0073-Laing.pdf)；[ALACAES 2018](https://doi.org/10.1016/j.est.2018.02.003)。\n\n### 封装、翅片与导热骨架\n\n铝翅片缩短盐到换热管的传热路径；表面改性膨胀石墨改善水合盐浸润与热扩散；金属双层封装为体积变化留空间。三者承担不同任务，不能统称某一种“纳米增强”。模块有效容量应扣除管道、翅片、壳体和保温空间，功率由换热面积、流量及温差共同决定。材料潜热保留率、传热速率和系统热损失应分别列出。\n\n来源：[IEA 测量方法](https://m.iea-shc.org/article?NewsID=103)；[石墨复合原论文](https://www.nrel.gov/docs/fy23osti/85714.pdf)；[双层封装 2026](https://doi.org/10.1016/j.rser.2026.116813)。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "六组潜热原始研究",
      "title": "六组潜热原始研究",
      "content": "### 原始研究与试验条件\n\n| 原始研究 | 可直接展示的量与条件 | 研究回答了什么 | 尚未证明什么 |\n|---|---|---|---|\n| Laing 等，2011，直接蒸汽复合储热 | NaNO₃ 约 14 t；约 680 kWh_th；典型充热蒸汽约 107 bar / 320 °C；铝翅片 | 让潜热与蒸发/冷凝过程的温区匹配 | 没有把该热容量换算成同数值的电容量 |\n| Zhang & Dong，2017，DOI 10.1016/j.tsep.2017.02.005 | 商业石蜡混合物 10,000 次加速循环，熔化焓下降 9.1% | 大量重复相变下材料性质如何变化 | 不是整机寿命；公开摘要未列完整温度程序 |\n| ALACAES Part 2，2018，DOI 10.1016/j.est.2018.02.003 | 171.5 kWh_th 潜热 + 11.6 MWh_th 显热；4 次约 3 h 循环；空气最高约 566 °C | 高温金属 PCM 与显热床协同，暴露封装失效 | 不是成熟商业潜热电站 |\n| Blackley 等，2023，DOI 10.1021/acsaem.3c01223 | 复合材料导热率 4 ± 0.2 W/(m·K)，含盐导热测量 15–20 °C；过冷 <1 °C；最多 200 次循环无潜热下降 | 同时改善导热、成核与相稳定性 | 不把不同配方最优值拼成一个样品；不等于系统效率 |\n| Ahmed 等，2023 在线 / 2024 卷期，DOI 10.1021/acsaenm.3c00444 | 共晶 11.2–32.7 °C；137–151 J/g；最终量热扫描 1 °C/min；毫升级 >100 次循环 | 通过组成设计建筑所需的相变温度 | 不是吨级储罐循环验证 |\n| Xu 等，2026，DOI 10.1016/j.rser.2026.116813 | 两阶段 Al–Si 封装；300 次循环后潜热保留 96.85%；公开摘要证据 | 针对热膨胀、氧渗透与漏液强化封装 | 不是96.85%的电热电效率，未核工业模块规模 |\n\n来源：[USPTO：A solar life](https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/solar-life) · [Laing 等，Combined Storage System Developments for Direct Steam Generation，2011，原论文](https://proceedings.ises.org/conference/swc2011/papers/swc2011-0073-Laing.pdf) · [IEA SHC Task 42，2015-10-03，含 2015 年 1 月测量标准与 8 月立场报告](https://m.iea-shc.org/article?NewsID=103) · [Zhang & Dong，Thermal Science and Engineering Progress 1 (2017) 78–87](https://doi.org/10.1016/j.tsep.2017.02.005) · [Pilot-scale demonstration of advanced adiabatic compressed air energy storage, Part 2，2018](https://doi.org/10.1016/j.est.2018.02.003) · [Blackley 等，ACS Applied Energy Materials，2023，原论文](https://www.nrel.gov/docs/fy23osti/85714.pdf) · [Ahmed 等，DOI 10.1021/acsaenm.3c00444](https://pubs.acs.org/doi/10.1021/acsaenm.3c00444) · [DOE，Thermal Energy Storage for Commercial Buildings，2024-05-31](https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings) · [Xu 等，Efficient two-stage encapsulation of metallic phase change materials，2026，DOI 10.1016/j.rser.2026.116813](https://www.sciencedirect.com/science/article/pii/S1364032126001127)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "潜热模块的供应与工程",
      "title": "潜热模块的供应与工程",
      "content": "### MGA Thermal\n\n澳大利亚MGA Thermal开发Miscibility Gap Alloy热储能模块，利用合金材料相变储存潜热，并与蒸汽系统集成。\n\n私营公司；无公开股票代码\n\nTomago：5MWh_th，充0.5MW_e/放0.5MW_th，365°C蒸汽、设计10h（公司项目页核查 2026-10-03；项目开始运行 2025-04）\n\n蒸汽集成示范系统以0.5 MWe充电、0.5 MWth输出365°C过热蒸汽，设计储热5 MWhth、10小时。约1800 MWhth/年为每日一循环估算，不是已经累计发出的年度计量。\n\n- **5MWh_th**：示范装置热容量\n- **0.5MW_e / 0.5MW_th**：充电电功率 / 放热功率\n- **365°C · 10h**：过热蒸汽温度与额定储热时长\n\n来源：[MGA Thermal示范项目规格与状态](https://mgathermal.com/flagship-projects/mga-demonstration-plant) · [MGA Thermal关于潜热与约3700个MGA块的说明](https://mgathermal.com/newsroom-posts/mga-thermal-achieves-world-first-latent-heat-leap----unlocking-24-7-renewable-industrial-steam)\n\n### Sunamp\n\n英国私营热储能企业Sunamp以Plentigrade相变材料为Thermino等建筑热水和供热产品储热。\n\n私营企业；无公开股票代码\n\nP58约58°C相变；Latham峰值2198W对3107W，企业报降约29%（产品手册版本 2025-10-13；案例页核查 2026-10-03（案例日期未注明））\n\nThermino P58在约58°C固液转变，向水回路放热。Latham案例记录用电峰值，案例页未注明发生日期。\n\n- **约58°C**：P58相变点，2025-10-13手册\n- **2198W / 3107W**：Latham模块/对照热水器峰值，企业案例报降约29%\n\n来源：[Thermino P58安装手册：相变原理、58°C转变点](https://installation.sunamp.com/thermino/north-america-us-ca/thermino/installation-user-manuals/d0063-thermino-p58-installation-and-user-instructions-manual~7615907194365528871?format=show_external_document) · [Sunamp Latham办公楼案例与监测数据](https://sunamp.com/en-ca/case-studies/sunamp-thermal-batteries-reduce-peak-load-in-a-new-york-office-building-a-nyserda-program/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "建筑与过程热应用市场",
      "title": "建筑与过程热应用市场",
      "content": "### 应用场景与工程边界\n\n美国 DOE 的 2023 年 Thermal Energy Storage Technology Strategy Assessment 将储热用于长时能源系统讨论；2024 年商业建筑材料则落到削峰与用电时间转移。两者覆盖显热、潜热、热化学等多技术，不提供“潜热储能单独装机量”。中国新型储能电站累计 GW/GWh 也不能直接作为本路线市场总量。\n\n| 市场任务 | 潜热的实际价值 | 项目必须提供的边界 |\n|---|---|---|\n| 建筑供冷、热泵错峰 | 在接近所需供水温度的区间吸放热，转移压缩机运行时段 | PCM 相变温区、可用冷/热量、热泵 COP 所处工况；储热不凭空增加净电量 |\n| 热水与空间受限设备 | 用相变焓减少相同热服务所需体积 | 换热器和外壳都纳入整机体积，不能以材料密度代替成品密度 |\n| 工业蒸汽与过程热 | 减小输出温度波动，与蒸发潜热需求匹配 | 蒸汽压力、输出质量流量、传热温差、设计与实测容量 |\n| 热发电或压缩空气配套 | 作为热管理子系统改善放热过程 | 分列储热子系统、压缩机/汽轮机和全系统电热电效率 |\n\n来源：[DOE 2023 技术战略](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Thermal%20Energy%20Storage_0.pdf)；[DOE 2024 商业建筑储热](https://betterbuildingssolutioncenter.energy.gov/resources/thermal-energy-storage-commercial-buildings)。\n\n### 中国热（冷）储能研发与示范\n\n国家发展改革委、国家能源局2022年实施方案列出热（冷）储能长时间尺度攻关，提出拓展热（冷）储能应用与高效储热日到周、周到季示范。这是研发与示范安排，项目容量按各自热端边界记录。\n\n来源：[2022原始实施方案](https://www.ndrc.gov.cn/xxgk/zcfb/tz/202203/P020220321543703119995.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "按相变温区匹配任务",
      "title": "按相变温区匹配任务",
      "content": "### 交付任务与工况\n\n| 场景 | 为什么匹配 | 主要制约 | 展示尺度 |\n|---|---|---|---|\n| 低温建筑供冷供热 | 共晶和配方可调相变温区；热泵可在有利时段充热 | 过冷、相分离、低导热、与供水温度不匹配 | °C、kWh_th、kW_th，不直接给 kWh_e |\n| 频繁热循环 | 石蜡及复合配方可研究高循环寿命 | 样品循环不包含泵、阀门、密封和腐蚀寿命 | 同时报循环条件与保留率 |\n| 蒸汽蒸发与冷凝 | 近恒温吸放热贴合过程热需求 | 换热温差小会压低功率，翅片占据容量 | 压力、温度、流量、热容量一起列 |\n| 高温复合储热 | 潜热缓冲出口温度，显热承担大容量 | 金属封装膨胀、焊接泄漏、氧化与相分离 | 分开列潜热段和显热段容量 |\n\n相变平台不是无限恒温热源：随着固相/液相界面移动，热阻和有效换热面积会改变。评价应落在用户能接收到多少符合温度要求的热，以及多快能拿到这些热；“潜热高”无法单独替代功率、温度品质与整机耐久性。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "thermal-latent-policy",
    "label": "建筑储热与研发支持",
    "title": "建筑储热与研发支持",
    "year": "2022—2024",
    "copy": "中国实施方案列出热（冷）储能研发与示范。DOE建筑资料关注削峰和时段转移。",
    "facts": [
      [
        "热（冷）储能",
        "2022实施方案研发/示范方向"
      ],
      [
        "建筑储热",
        "DOE2024技术推广，非独立装机总量"
      ]
    ],
    "subject": "scene:thermal-policy"
  },
  "market": {
    "id": "thermal-latent-market",
    "label": "供冷、热水与过程蒸汽",
    "title": "供冷、热水与过程蒸汽",
    "year": "应用",
    "copy": "潜热温区匹配用户的冷水、热水与蒸汽需求。体积、温度和交付功率一起衡量。",
    "facts": [
      [
        "建筑供冷/热水",
        "相变温区配合水回路"
      ],
      [
        "工业蒸汽",
        "按压力、流量及热容量交付"
      ]
    ],
    "subject": "route:thermal-latent:history"
  },
  "historySubject": "route:thermal-latent:history",
  "note": "独立相变热储存研究",
  "papers": {
    "id": "thermal-latent-papers",
    "label": "循环、导热与封装证据",
    "title": "循环、导热与封装证据",
    "year": "试验",
    "copy": "从材料热循环到模块蒸汽换热，试验尺度各不相同。焓保持、导热率和热容量分别读。",
    "facts": [
      [
        "10000次 / 焓降9.1%",
        "2017特定石蜡混合物"
      ],
      [
        "300次 / 焓保留96.85%",
        "2026Al—Si封装样品，非同一材料"
      ]
    ],
    "subject": "material:thermal-latent-encapsulation"
  },
  "storage": {
    "id": "thermal-latent-storage",
    "label": "让相变温区贴近热需求",
    "title": "让相变温区贴近热需求",
    "year": "应用",
    "copy": "相变平台在有限温差下交付热量。凝固界面移动会改变热阻，容量与功率需一起设计。",
    "facts": [
      [
        "kWh_th / kW_th",
        "热容量与热功率，按应用温区计量"
      ],
      [
        "热泵与蒸汽回路",
        "分列PCM储热和全系统转换表现"
      ]
    ],
    "subject": "route:thermal-latent:history"
  },
  "showMarketChart": false
};

export const thermochemicalResearch: ChronicleResearch = {
  "name": "热化学储能",
  "timeline": [
    {
      "id": "thermal-thermochemical-1977",
      "yearNumber": 1977,
      "year": "1977",
      "label": "可逆反应保存太阳热",
      "title": "可逆反应保存太阳热",
      "copy": "充热使反应物分开保存，放热时再反应。早期论文讨论镁、钙氢氧化物等可逆储热体系。",
      "facts": [
        [
          "可逆反应",
          "Ervin1977原始太阳热储存研究"
        ]
      ],
      "detail": "把热变为可分开保存的反应物，再按需反应放热。 Ervin 在 Journal of Solid State Chemistry 的原始论文讨论可逆化学储热，涵盖氢氧化镁、氢氧化钙分解等工作。与必须保持高温的显热不同，分离后的反应物可以降到环境温度保存；储能时间因此不只由保温层决定。该文是本时间线可核的早期研究节点，不称整个领域的唯一起源。反应速率、气体供给、反应器传热与循环可逆性已是必须解决的问题。",
      "source": "https://doi.org/10.1016/0022-4596(77)90188-8",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2009",
      "yearNumber": 2009,
      "year": "2009",
      "label": "镁盐释热受水汽压力约束",
      "title": "镁盐释热受水汽压力约束",
      "copy": "七水硫酸镁可脱水储热，但释热温度受到水蒸气分压影响。材料热密度与用户收到的热量分别评价。",
      "facts": [
        [
          "2.2GJ/m³",
          "MgSO₄·7H₂O材料储热密度"
        ],
        [
          "大气压 / 水汽1.3kPa",
          "高于40°C释热困难"
        ],
        [
          "98mL / 初始盐25g",
          "低压试验，150°C预脱水、50°C下温升约4°C"
        ]
      ],
      "detail": "水蒸气压力决定盐水合物放热是否真正适合建筑。 van Essen 等研究 MgSO₄·7H₂O，发现可在低于 150 °C 脱水；材料储热密度报告为 2.2 GJ/m³。但在大气压、水蒸气分压 1.3 kPa、放热温度高于 40 °C 时，释热存在困难。低压实验使用 98 mL 反应器，将 25 g 初始七水盐在 150 °C 预脱水后装入，50 °C 条件下观察到约 4 °C 温升。材料储热密度不能代替整机有效供热量，低品位水蒸气的供应条件也不是免费且无限的。",
      "source": "https://pure.tue.nl/ws/files/2993376/Metis226570.pdf",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "石灰反应进入20kg床层",
      "title": "石灰反应进入20kg床层",
      "copy": "DLR间接换热床层验证水合与脱水循环。蒸汽压力调节反应温区，床层传热与传质成为重点。",
      "facts": [
        [
          "约20kg / 10kW_th",
          "Ca(OH)₂反应器级别"
        ],
        [
          "10次循环",
          "试验未观察材料降解；2013在线、2014卷期"
        ]
      ],
      "detail": "DLR 以 10 kW_th 级反应器检验高温水合/脱水过程。 Schmidt 等论文于 2013-09-30 在线、2014 年编入 Applied Thermal Engineering 62:553–559，采用约 20 kg Ca(OH)₂ 的间接换热反应器，进行了十次循环，未观察到材料降解。反应温度可通过水蒸气压力调节，论文讨论高于约 410 °C、蒸气压力高于 0.1 bar 的储热条件。研究意义是开始检验真实床层的传热与传质限制，而非仅用毫克级热分析判断可行性。",
      "source": "https://elib.dlr.de/85589/1/matthias_schmidt_-_experimental_results_of_a_10kW_high_temperature_thermochemical_storage_reactor_based_on_calcium_hydroxide_-_Published_.pdf",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "沸石把余热搬运七千米",
      "title": "沸石把余热搬运七千米",
      "copy": "示范装置用热空气使沸石脱水，再以工业湿排气放热。热源和用户分处两地，监测一年。",
      "facts": [
        [
          "约14t / 2.3MWh_th",
          "沸石装置，运输7km"
        ],
        [
          "130°C充热",
          "热空气输入"
        ],
        [
          "60°C / 含湿0.09kg/kg",
          "工业干燥排气放热工况"
        ]
      ],
      "detail": "移动吸附储热用真实用户验证热源与负荷可以分处两地。 Krönauer 等建成并监测一年的示范装置装载约 14 t 沸石，以 130 °C 热空气充热；放热端采用工业干燥排气，温度 60 °C、含湿量 0.09 kg/kg，得到约 2.3 MWh_th 储热容量。充放热站相距 7 km。研究同时指出床层气流分布不均限制预期功率，说明运输载体之外，布风与压降直接影响可用热量和供热速度。",
      "source": "https://doi.org/10.1016/j.egypro.2015.07.688",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2016",
      "yearNumber": 2016,
      "year": "2016",
      "label": "碳酸化连接CO₂动力循环",
      "title": "碳酸化连接CO₂动力循环",
      "copy": "钙循环模型把反应器、固体流与动力循环合并分析。整体发电表现取决于具体系统假设。",
      "facts": [
        [
          "约45—46%",
          "CaL—CO₂热发电系统模型整体效率，非往返实测"
        ]
      ],
      "detail": "CaCO₃ / CaO 的反应温区促使研究重新设计整座热发电系统。 Chacartegui 等提出太阳能钙循环与 CO₂ 闭式动力循环耦合模型，分析碳酸化反应器、固体流、储罐、换热器、透平与压缩机，模型的电站整体效率约 45–46%。这是特定系统构型和假设下的热发电评价，不是实测电热电往返效率。进展在于把化学储热同发电循环统一分析；尚需解决颗粒多循环失活、气体存储以及真实设备运行。",
      "source": "https://www.sciencedirect.com/science/article/pii/S0306261916305062",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2021",
      "yearNumber": 2021,
      "year": "2021",
      "label": "钙循环在相关环境完成中试",
      "title": "钙循环在相关环境完成中试",
      "copy": "SOCRATCES集成煅烧、碳酸化与循环单元。结题记录从部件可行性推进到相关环境验证。",
      "facts": [
        [
          "TRL4→TRL5",
          "欧盟SOCRATCES结题，2018—2021项目期"
        ]
      ],
      "detail": "碳酸化与煅烧由系统模型推进到集成试验。 欧盟 SOCRATCES 项目运行期为 2018-01-01 至 2021-12-31。最终报告记载单元建设、调试、集成，以及不同温度和材料下的煅烧、碳酸化和循环实验；技术成熟度由 TRL 4 提升到 TRL 5。它证明相关环境中的技术可行性，尚不等于商业太阳热发电站已长期采用该储热路线。公开结题摘要未提供可直接作为商业装机的 MW / MWh 数字，本节点不补造。",
      "source": "https://cordis.europa.eu/project/id/727348/reporting",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "多孔骨架改善镁盐水汽可达性",
      "title": "多孔骨架改善镁盐水汽可达性",
      "copy": "MgSO₄分散到活性炭，水汽条件改变可释放热量。比能量采用干复合材料质量作分母。",
      "facts": [
        [
          "859→1324J/g干材料",
          "30-MgSO₄/AC，RH30%→60%"
        ],
        [
          "8次循环",
          "水合/脱水后基本稳定；住宅应用另为模型"
        ]
      ],
      "detail": "材料设计开始同时处理储热量和水蒸气传输。 Bennici 等把 MgSO₄ 分散到活性炭上。对 30-MgSO₄/AC 样品，水合焓随相对湿度从 30% 提高至 60%，由 859 增至 1324 J/g 干材料；八次水合/脱水循环后基本稳定。随后进行的住宅供暖和热水分析是数值模型，不是住宅运行实测。该结果说明水汽条件改变会直接改变可释放热量，报告比能时必须保留“干复合材料质量”这个分母。 SaltX Technology：2021年以来的Bollmora试验期结束，公司提交项目总结。3–5倍指相对Berlin反应器的换热系数，不代表储热效率、循环保持率或商业运行规模。",
      "source": "https://www.sciencedirect.com/science/article/pii/S1364032122001204",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "住宅模拟按任务调度热电池",
      "title": "住宅模拟按任务调度热电池",
      "copy": "K₂CO₃闭环热电池被纳入荷兰住宅性能模拟。成本与移峰结果随热需求、价格和调度情景改变。",
      "facts": [
        [
          "建筑性能模拟",
          "住户、配电系统及热网不同目标，非运行实测"
        ]
      ],
      "detail": "研究不再只比较每千克材料储多少热，也评估在什么时间供给谁。 Wang 等针对荷兰住宅，以 K₂CO₃ 复合材料闭环热电池进行建筑性能模拟，分别分析住户、配电系统和热网运营者的目标。成本降低和负荷移峰是模型情景结果，受住宅热需求、能源价格、热源与调度约束。对实际产品的启示是先匹配热水、空间采暖或热网峰值任务，再决定反应器功率和材料量。",
      "source": "https://research.tue.nl/nl/publications/investigating-the-use-cases-of-a-novel-heat-battery-in-dutch-resi/",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "透汽封装抵抗钾盐结块",
      "title": "透汽封装抵抗钾盐结块",
      "copy": "PES多孔膜让水汽进出，并约束颗粒变化。热分析与严苛床层循环各有独立条件。",
      "facts": [
        [
          "约0.6GJ/m³ / 约200kW_th/m³",
          "材料/试验床归一化指标，功率在90%转化处"
        ],
        [
          "30°C / RH31%",
          "热分析水合；脱水100°C、300mL/min"
        ],
        [
          "10次 / 30mm床层",
          "另一循环试验，30°C、RH60%"
        ]
      ],
      "detail": "反应材料必须既让水汽进出，又在体积变化中保持颗粒形状。 Elahi 等用聚醚砜（PES）多孔膜封装 K₂CO₃。论文报告约 0.6 GJ/m³ 体积储热密度，以及在 90% 转化率处约 200 kW_th/m³ 的体积功率指标。热分析水合条件为 30 °C、RH 31%，脱水为 100 °C、气流 300 mL/min；另以 30 mm 床层、30 °C、RH 60% 完成十次严苛循环，考察超过潮解点时的结块与完整性。这两组试验目的和条件不同，不能拼写成同一整机运行工况。",
      "source": "https://ris.utwente.nl/ws/portalfiles/portal/480982204/1-s2.0-S1385894724085334-main.pdf",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "住宅示范与移动床同时推进",
      "title": "住宅示范与移动床同时推进",
      "copy": "HEAT-INSYDE完成三处地点系统验证。DLR移动床研究检验稳定化颗粒的循环与物料输运。",
      "facts": [
        [
          "三处示范地点",
          "HEAT-INSYDE2025-03-31结题，非25年实证"
        ],
        [
          "20次 / 10次",
          "DLR不同颗粒/反应器阶段，机构摘要证据"
        ]
      ],
      "detail": "热化学储热同时解决建筑接入和固体材料连续运行。 HEAT-INSYDE 于 2025-03-31 结束，欧盟结题报告记载系统在三处示范地点完成验证，并改进密封、阀门间隙、气流控制与喷嘴设计。项目设定的节能目标、25 年寿命验证目标不能改写成已经实测达到的年限或普遍节能率。\n\n同年 DLR 的移动床博士研究报告三类反应器开发，部分稳定化 Ca(OH)₂ 颗粒完成 20 次循环；后续移动床构型对 Al₂O₃ 稳定化颗粒完成 10 次循环并演示物料运动。意义在于尝试分开配置反应器功率与仓储容量；公开摘要仍以未来中试放大为下一步，不能标为商业投运。",
      "source": "https://cordis.europa.eu/project/id/869810/reporting/fr",
      "subject": "route:thermal-thermochemical:history"
    },
    {
      "id": "thermal-thermochemical-2026",
      "label": "模块化热化学系统完成现场循环演示",
      "title": "模块化热化学系统完成现场循环演示",
      "year": "2026",
      "copy": "Cache称Mt. Holly示范系统可在数日内运输、安装并开展完整充放热循环。公告未给出额定容量或功率。",
      "facts": [
        [
          "2026-03-05",
          "公司完成Duke测试设施示范"
        ],
        [
          "完整充放热循环",
          "现场工业工况，公司公告未提供定量性能"
        ],
        [
          "under one week",
          "抵达后不足一周产热"
        ]
      ],
      "subject": "company:thermal-thermochemical-cache",
      "yearNumber": 2026,
      "detail": "Cache称Mt. Holly示范系统可在数日内运输、安装并开展完整充放热循环。公告未给出额定容量或功率。 2026Duke循环演示/Whirlpool试点；最高1000°F（约538°C），MW/MWh未披露",
      "source": "https://www.cache-energy.com/insights/cache-energy-demonstrates-rapid-modular-thermochemical-storage-at-duke-energys-mt-holly-facility"
    }
  ],
  "materials": [
    {
      "id": "thermal-thermochemical-adsorption",
      "label": "沸石与水：吸附储热",
      "title": "沸石与水：吸附储热",
      "year": "机制",
      "copy": "沸石加热脱附水分，隔绝水汽保存，再吸附湿空气放热。多孔床与布风器决定可达性和供热速度。",
      "facts": [
        [
          "14t / 2.3MWh_th",
          "2015移动沸石示范，130°C充热/60°C湿排气放热"
        ]
      ],
      "subject": "material:thermal-thermochemical-adsorption"
    },
    {
      "id": "thermal-thermochemical-salt-hydration",
      "label": "盐水合物与复合骨架",
      "title": "盐水合物与复合骨架",
      "year": "机制",
      "copy": "钾盐、镁盐以脱水吸热和水合放热储能。蒸汽平衡、潮解与颗粒完整性影响可交付热量。",
      "facts": [
        [
          "859—1324J/g干材料",
          "2022镁盐/活性炭，RH30—60%"
        ]
      ],
      "subject": "material:thermal-thermochemical-salt-hydration"
    },
    {
      "id": "thermal-thermochemical-hydroxide",
      "label": "CaO / Ca(OH)₂水蒸气反应",
      "title": "CaO / Ca(OH)₂水蒸气反应",
      "year": "机制",
      "copy": "脱水后分离CaO与水，放热时水合。水蒸气分压控制平衡温度，稳定颗粒支持床层循环。",
      "facts": [
        [
          "约20kg / 10kW_th",
          "DLR间接换热床层，10循环，2013在线"
        ]
      ],
      "subject": "material:thermal-thermochemical-hydroxide"
    },
    {
      "id": "thermal-thermochemical-carbonation",
      "label": "CaCO₃ / CaO碳酸化循环",
      "title": "CaCO₃ / CaO碳酸化循环",
      "year": "机制",
      "copy": "煅烧充热、碳酸化放热，需要固体输运、CO₂储存和换热。它与CaO水合使用不同气体和设备。",
      "facts": [
        [
          "TRL4→5",
          "SOCRATCES相关环境中试结题，2021"
        ]
      ],
      "subject": "material:thermal-thermochemical-carbonation"
    }
  ],
  "companies": [
    {
      "id": "thermal-thermochemical-saltx",
      "label": "SaltX Technology",
      "title": "Bollmora大型热化学试验结项",
      "year": "2022",
      "copy": "2021年以来的Bollmora试验期结束，公司提交项目总结。3–5倍指相对Berlin反应器的换热系数，不代表储热效率、循环保持率或商业运行规模。",
      "facts": [
        [
          "2021–2022",
          "大规模TCES试验期"
        ],
        [
          "3–5倍",
          "公司报告的换热系数提升"
        ],
        [
          "下一阶段",
          "公司公告仍在寻找承诺终端客户推进商业成熟"
        ]
      ],
      "subject": "company:thermal-thermochemical-saltx"
    },
    {
      "id": "thermal-thermochemical-cache",
      "label": "Cache Energy / Duke Energy",
      "title": "模块化热化学系统完成现场循环演示",
      "year": "2026",
      "copy": "Cache称Mt. Holly示范系统可在数日内运输、安装并开展完整充放热循环。公告未给出额定容量或功率。",
      "facts": [
        [
          "2026-03-05",
          "公司完成Duke测试设施示范"
        ],
        [
          "完整充放热循环",
          "现场工业工况，公司公告未提供定量性能"
        ],
        [
          "under one week",
          "抵达后不足一周产热"
        ]
      ],
      "subject": "company:thermal-thermochemical-cache"
    },
    {
      "id": "thermal-thermochemical-tempo",
      "label": "Tempo / UC San Diego",
      "title": "混合金属氧化物TCES进入校园示范项目早期阶段",
      "year": "2024–2028",
      "copy": "CEC资助项目拟将系统接入UCSD 12 kV配电网。网页标注项目仍处早期阶段，20 MWhth和100 kW发电目标都属设计/验证目标。",
      "facts": [
        [
          "20MWh_th",
          "项目目标热容量"
        ],
        [
          "4 h",
          "计划充电窗口"
        ],
        [
          "100 kW × 24+h",
          "目标发电机供电时长，不是已测运行结果"
        ]
      ],
      "subject": "company:thermal-thermochemical-tempo"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "从可逆反应到系统示范",
      "title": "从可逆反应到系统示范",
      "content": "### 1977｜可逆反应成为太阳热储存的明确研究方案\n\n**把热变为可分开保存的反应物，再按需反应放热。** Ervin 在 Journal of Solid State Chemistry 的原始论文讨论可逆化学储热，涵盖氢氧化镁、氢氧化钙分解等工作。与必须保持高温的显热不同，分离后的反应物可以降到环境温度保存；储能时间因此不只由保温层决定。该文是本时间线可核的早期研究节点，不称整个领域的唯一起源。反应速率、气体供给、反应器传热与循环可逆性已是必须解决的问题。\n\n来源：[Ervin，Solar heat storage using chemical reactions，1977，22(1):51–61](https://doi.org/10.1016/0022-4596%2877%2990188-8)。\n\n### 2009｜镁盐研究揭示“能充进去”不等于“能供出所需温度”\n\n**水蒸气压力决定盐水合物放热是否真正适合建筑。** van Essen 等研究 MgSO₄·7H₂O，发现可在低于 150 °C 脱水；材料储热密度报告为 2.2 GJ/m³。但在大气压、水蒸气分压 1.3 kPa、放热温度高于 40 °C 时，释热存在困难。低压实验使用 98 mL 反应器，将 25 g 初始七水盐在 150 °C 预脱水后装入，50 °C 条件下观察到约 4 °C 温升。材料储热密度不能代替整机有效供热量，低品位水蒸气的供应条件也不是免费且无限的。\n\n来源：[原论文，DOI 10.1115/1.4000275，作者机构存档](https://pure.tue.nl/ws/files/2993376/Metis226570.pdf)。\n\n### 2013｜石灰反应从小样跨到约二十千克\n\n**DLR 以 10 kW_th 级反应器检验高温水合/脱水过程。** Schmidt 等论文于 2013-09-30 在线、2014 年编入 Applied Thermal Engineering 62:553–559，采用约 20 kg Ca(OH)₂ 的间接换热反应器，进行了十次循环，未观察到材料降解。反应温度可通过水蒸气压力调节，论文讨论高于约 410 °C、蒸气压力高于 0.1 bar 的储热条件。研究意义是开始检验真实床层的传热与传质限制，而非仅用毫克级热分析判断可行性。\n\n来源：[Schmidt 等，原论文](https://elib.dlr.de/85589/1/matthias_schmidt_-_experimental_results_of_a_10kW_high_temperature_thermochemical_storage_reactor_based_on_calcium_hydroxide_-_Published_.pdf)，[DOI 10.1016/j.applthermaleng.2013.09.020](https://doi.org/10.1016/j.applthermaleng.2013.09.020)。时间线采用首次在线年份 2013，论文栏保留 2014 卷期。\n\n### 2015｜沸石把工业余热搬运到七千米之外\n\n**移动吸附储热用真实用户验证热源与负荷可以分处两地。** Krönauer 等建成并监测一年的示范装置装载约 14 t 沸石，以 130 °C 热空气充热；放热端采用工业干燥排气，温度 60 °C、含湿量 0.09 kg/kg，得到约 2.3 MWh_th 储热容量。充放热站相距 7 km。研究同时指出床层气流分布不均限制预期功率，说明运输载体之外，布风与压降直接影响可用热量和供热速度。\n\n来源：[Mobile Sorption Heat Storage in Industrial Waste Heat Recovery，Energy Procedia 73 (2015) 272–280](https://doi.org/10.1016/j.egypro.2015.07.688)。\n\n### 2016｜碳酸化储热与二氧化碳动力循环耦合\n\n**CaCO₃ / CaO 的反应温区促使研究重新设计整座热发电系统。** Chacartegui 等提出太阳能钙循环与 CO₂ 闭式动力循环耦合模型，分析碳酸化反应器、固体流、储罐、换热器、透平与压缩机，模型的电站整体效率约 45–46%。这是特定系统构型和假设下的热发电评价，不是实测电热电往返效率。进展在于把化学储热同发电循环统一分析；尚需解决颗粒多循环失活、气体存储以及真实设备运行。\n\n来源：[Applied Energy 173 (2016) 589–605，DOI 10.1016/j.apenergy.2016.04.053](https://www.sciencedirect.com/science/article/pii/S0306261916305062)。\n\n### 2021｜SOCRATCES 完成相关环境中的钙循环中试\n\n**碳酸化与煅烧由系统模型推进到集成试验。** 欧盟 SOCRATCES 项目运行期为 2018-01-01 至 2021-12-31。最终报告记载单元建设、调试、集成，以及不同温度和材料下的煅烧、碳酸化和循环实验；技术成熟度由 TRL 4 提升到 TRL 5。它证明相关环境中的技术可行性，尚不等于商业太阳热发电站已长期采用该储热路线。公开结题摘要未提供可直接作为商业装机的 MW / MWh 数字，公开结题摘要未提供商业装机数值。\n\n来源：[欧盟 CORDIS，SOCRATCES 项目与结题报告](https://cordis.europa.eu/project/id/727348/reporting)。\n\n### 2022｜多孔骨架改善镁盐的水汽可达性\n\n**材料设计开始同时处理储热量和水蒸气传输。** Bennici 等把 MgSO₄ 分散到活性炭上。对 30-MgSO₄/AC 样品，水合焓随相对湿度从 30% 提高至 60%，由 859 增至 1324 J/g 干材料；八次水合/脱水循环后基本稳定。随后进行的住宅供暖和热水分析是数值模型，不是住宅运行实测。该结果说明水汽条件改变会直接改变可释放热量，报告比能时必须保留“干复合材料质量”这个分母。\n\n来源：[Bennici 等，2022，DOI 10.1016/j.rser.2022.112197](https://www.sciencedirect.com/science/article/pii/S1364032122001204)；[作者开放稿](https://hal.science/hal-03546176v1/preview/RSER-R2%20clean%20HAL.pdf)。公开摘要未列完整循环温度程序。\n\n### 2023｜住宅模拟把热电池放进真实用能任务\n\n**研究不再只比较每千克材料储多少热，也评估在什么时间供给谁。** Wang 等针对荷兰住宅，以 K₂CO₃ 复合材料闭环热电池进行建筑性能模拟，分别分析住户、配电系统和热网运营者的目标。成本降低和负荷移峰是模型情景结果，受住宅热需求、能源价格、热源与调度约束。对实际产品的启示是先匹配热水、空间采暖或热网峰值任务，再决定反应器功率和材料量。\n\n来源：[Building Simulation 16 (2023) 1675–1689，DOI 10.1007/s12273-023-1069-2](https://research.tue.nl/nl/publications/investigating-the-use-cases-of-a-novel-heat-battery-in-dutch-resi/)。\n\n### 2024｜透汽封装让钾盐颗粒抵抗结块\n\n**反应材料必须既让水汽进出，又在体积变化中保持颗粒形状。** Elahi 等用聚醚砜（PES）多孔膜封装 K₂CO₃。论文报告约 0.6 GJ/m³ 体积储热密度，以及在 90% 转化率处约 200 kW_th/m³ 的体积功率指标。热分析水合条件为 30 °C、RH 31%，脱水为 100 °C、气流 300 mL/min；另以 30 mm 床层、30 °C、RH 60% 完成十次严苛循环，考察超过潮解点时的结块与完整性。这两组试验目的和条件不同，不能拼写成同一整机运行工况。\n\n来源：[Elahi 等，Chemical Engineering Journal 500 (2024) 157042，原论文](https://ris.utwente.nl/ws/portalfiles/portal/480982204/1-s2.0-S1385894724085334-main.pdf)，[DOI 10.1016/j.cej.2024.157042](https://doi.org/10.1016/j.cej.2024.157042)。\n\n### 2025｜住宅示范与连续反应器各自迈向工程化\n\n**热化学储热同时解决建筑接入和固体材料连续运行。** HEAT-INSYDE 于 2025-03-31 结束，欧盟结题报告记载系统在三处示范地点完成验证，并改进密封、阀门间隙、气流控制与喷嘴设计。项目设定的节能目标、25 年寿命验证目标不能改写成已经实测达到的年限或普遍节能率。\n\n同年 DLR 的移动床博士研究报告三类反应器开发，部分稳定化 Ca(OH)₂ 颗粒完成 20 次循环；后续移动床构型对 Al₂O₃ 稳定化颗粒完成 10 次循环并演示物料运动。意义在于尝试分开配置反应器功率与仓储容量；公开摘要仍以未来中试放大为下一步，不能标为商业投运。\n\n来源：[HEAT-INSYDE 最终报告，欧盟 CORDIS](https://cordis.europa.eu/project/id/869810/reporting/fr)；[DLR，Development of a moving bed reactor for thermochemical heat storage with Ca(OH)₂，2025-09-18](https://elib.dlr.de/220004/)。后者依据机构公开摘要。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "吸附、水合与碳酸化机制",
      "title": "吸附、水合与碳酸化机制",
      "content": "### 沸石与水：利用表面吸附放热\n\n沸石经加热脱附水分后，可在与水汽隔绝状态下保存；湿空气或水蒸气重新进入孔道时放出吸附热。这里将吸附储热纳入广义热化学路线，但其机制是物理吸附，不把它写成生成新化合物的化学反应。2015 年 14 t 装置说明干燥工艺余热运输具有实际试验基础。关键部件是多孔床、布风器、风机与换热器；孔道可达性和空气分布会同时影响压降、供热功率与有效容量。\n\n来源：[沸石移动储热原论文](https://doi.org/10.1016/j.egypro.2015.07.688)；[40 kg 沸石 13X / 水反应器实验与模型，2016](https://doi.org/10.1016/j.enconman.2015.11.011)。后者报告放热 8 h、最大温升约 38 °C；温升不是绝对供热温度。\n\n### 钾盐、镁盐与复合骨架\n\n盐水合物通过脱水吸热、水合放热储存反应能。K₂CO₃、MgSO₄ 的平衡水汽压力、反应速率、潮解和结块行为不同，不能套用一个“盐电池”性能表。多孔碳、透汽膜和稳定化成型使水汽更容易到达材料，同时维持颗粒结构；代价是骨架与壳层占据质量和体积。系统还包括蒸发器/加湿器、冷凝器、气体循环与密封，材料 J/g 不等于整套设备 J/g。\n\n来源：[MgSO₄ 2009](https://doi.org/10.1115/1.4000275)；[MgSO₄ / 活性炭 2022](https://doi.org/10.1016/j.rser.2022.112197)；[K₂CO₃ 透汽封装 2024](https://doi.org/10.1016/j.cej.2024.157042)。\n\n### CaO / Ca(OH)₂：水蒸气控制的高温反应\n\nCa(OH)₂ + 热 ⇌ CaO + H₂O。充热脱水后，将 CaO 与水分开保存；放热时水合。水蒸气分压改变平衡温度，因此能否输出目标温度取决于反应器和蒸气供应，不是固定熔点式过程。低导热、团聚和颗粒循环破碎推动固定床向稳定化颗粒和移动床演进。2013 在线论文的约 20 kg / 10 kW_th 与 2025 移动床研究分别代表床层验证和输运验证，不合并成同一装置的规格。\n\n来源：[DLR 反应器原论文](https://doi.org/10.1016/j.applthermaleng.2013.09.020)；[DLR 2025 移动床研究](https://elib.dlr.de/220004/)。\n\n### CaCO₃ / CaO：高温碳酸化循环\n\nCaCO₃ + 热 ⇌ CaO + CO₂。充热端煅烧，放热端碳酸化；反应物的分离储存提供长时储能潜力。关键部件包括煅烧器、碳酸化器、固体输运与储仓、CO₂ 储存和回路换热器。此循环与 CaO / Ca(OH)₂ 共用 CaO，但气体、温压和设备不同，不能混作同一路反应。闭环使用 CO₂ 本身也不等于永久碳封存，减排取决于再生热源、气体损失与替代用能。\n\n来源：[钙循环—CO₂ 动力循环原模型，2016](https://doi.org/10.1016/j.apenergy.2016.04.053)；[SOCRATCES 中试](https://cordis.europa.eu/project/id/727348/reporting)。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "六组热化学原始研究",
      "title": "六组热化学原始研究",
      "content": "### 原始研究与试验条件\n\n| 原始研究 | 指标与试验/模型条件 | 研究贡献 | 规模或解释边界 |\n|---|---|---|---|\n| van Essen 等，2009，10.1115/1.4000275 | MgSO₄·7H₂O 脱水 <150 °C；材料 2.2 GJ/m³；大气压、pH₂O=1.3 kPa 时 >40 °C 释热困难 | 将高理论储热量与实际放热温度分开评价 | 低压装置 98 mL，初始盐25 g，不是住宅系统容量 |\n| Schmidt 等，2013 在线 / 2014 卷期，10.1016/j.applthermaleng.2013.09.020 | 约 20 kg Ca(OH)₂；10 kW_th 级；十次循环无观察到的降解；温度受水蒸气压力调节 | 从小样跨到间接换热床层 | 十次循环不外推为多年寿命；不能忽略反应气供应 |\n| Krönauer 等，2015，10.1016/j.egypro.2015.07.688 | 14 t 沸石；130 °C 充热；60 °C、0.09 kg/kg 湿排气放热；2.3 MWh_th；运输7 km，一年监测 | 工业热源和用户分离的移动储热验证 | 床层流动不均仍限制功率；不能把容量写成电量 |\n| Chacartegui 等，2016，10.1016/j.apenergy.2016.04.053 | CaL—CO₂ 动力循环模型；电站整体效率约45–46%，基于具体系统假设 | 把化学反应、固体输运与热发电统一分析 | 模型的整体效率，不是储热器实测效率或电热电效率 |\n| Bennici 等，2022，10.1016/j.rser.2022.112197 | 30-MgSO₄/AC；RH30%→60%，859→1324 J/g干材料；八循环 | 复合骨架与水汽条件共同控制释热 | 后续家庭应用为模型；公开摘要未列完整温度程序 |\n| Elahi 等，2024，10.1016/j.cej.2024.157042 | PES封装钾盐；约0.6 GJ/m³；90%转化处约200 kW_th/m³；另有30 mm床层、30 °C/RH60%的十循环试验 | 同时保留水汽通道和颗粒完整性 | 体积归一化材料/试验床指标，不是200 kW商业产品 |\n\n来源：](https://doi.org/10.1016/0022-4596%2877%2990188-8) · ](https://pure.tue.nl/ws/files/2993376/Metis226570.pdf) · ](https://elib.dlr.de/85589/1/matthias_schmidt_-_experimental_results_of_a_10kW_high_temperature_thermochemical_storage_reactor_based_on_calcium_hydroxide_-_Published_.pdf) · ](https://doi.org/10.1016/j.applthermaleng.2013.09.020) · ](https://doi.org/10.1016/j.egypro.2015.07.688) · ](https://www.sciencedirect.com/science/article/pii/S0306261916305062) · ](https://cordis.europa.eu/project/id/727348/reporting) · ](https://www.sciencedirect.com/science/article/pii/S1364032122001204) · ](https://hal.science/hal-03546176v1/preview/RSER-R2%20clean%20HAL.pdf) · ](https://research.tue.nl/nl/publications/investigating-the-use-cases-of-a-novel-heat-battery-in-dutch-resi/) · ](https://ris.utwente.nl/ws/portalfiles/portal/480982204/1-s2.0-S1385894724085334-main.pdf) · ](https://doi.org/10.1016/j.cej.2024.157042) · ](https://cordis.europa.eu/project/id/869810/reporting/fr) · ](https://elib.dlr.de/220004/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "反应储热机构与企业",
      "title": "反应储热机构与企业",
      "content": "### SaltX Technology\n\n瑞典SaltX Technology Holding开发纳米涂层盐热化学储能，也经营石灰和水泥行业电气化技术；公司上市于Nasdaq First North Premier Growth Market。\n\nNasdaq First North Premier Growth Market（SaltX Technology Holding AB）\n\nBollmora2021—2022试验；反应器换热系数为Berlin的3—5倍（公司试点总结 2022-10-26；上市关系核查 2026-10-03）\n\n2021年以来的Bollmora试验期结束，公司提交项目总结。3–5倍指相对Berlin反应器的换热系数，不代表储热效率、循环保持率或商业运行规模。\n\n- **2021–2022**：大规模TCES试验期\n- **3–5倍**：公司报告的换热系数提升\n- **下一阶段**：公司公告仍在寻找承诺终端客户推进商业成熟\n\n来源：[SaltX Bollmora试点结项公告，2022-10-26](https://www.saltxtechnology.com/cision/final-report-for-the-pilot-plant-in-bollmora-completed-with-good-results/) · [SaltX官方Q1 2020报告：纳米涂层盐热化学储能原理](https://www.saltxtechnology.com/files/SALTX-Q1-2020-ENG-spreads.pdf)\n\n### Cache Energy / Duke Energy\n\n美国私营公司Cache Energy研发可运输模块化热化学储能，为工业过程提供高温热。\n\n私营企业；无公开股票代码\n\n2026Duke循环演示/Whirlpool试点；最高1000°F（约538°C），MW/MWh未披露（公司公告 2026-03-05、2026-05-04）\n\nCache称Mt. Holly示范系统可在数日内运输、安装并开展完整充放热循环。公告未给出额定容量或功率。\n\n- **2026-03-05**：公司完成Duke测试设施示范\n- **完整充放热循环**：现场工业工况，公司公告未提供定量性能\n- **under one week**：抵达后不足一周产热\n\n来源：[Duke Energy Mt. Holly示范公告，2026-03-05](https://www.cache-energy.com/insights/cache-energy-demonstrates-rapid-modular-thermochemical-storage-at-duke-energys-mt-holly-facility) · [Whirlpool工厂部署公告，2026-05-04](https://www.cache-energy.com/insights/cache-deploys-electrified-heat-and-thermal-energy-storage-unit-at-whirlpool-ohio-facility)\n\n### Tempo / UC San Diego\n\n美国私营开发商Tempo与UC San Diego、EPRI等合作，计划示范混合金属氧化物热化学储能。\n\n私营项目合作方；无公开股票代码\n\nUCSD2024—2028早期项目；目标20MWh_th、4h充热、100kW发电24h以上（UC San Diego项目页核查 2026-10-03）\n\nCEC资助项目拟将系统接入UCSD 12 kV配电网。网页标注项目仍处早期阶段，20 MWhth和100 kW发电目标都属设计/验证目标。\n\n- **20MWh_th**：项目目标热容量\n- **4 h**：计划充电窗口\n- **100 kW × 24+h**：目标发电机供电时长，不是已测运行结果\n\n来源：[UC San Diego与Tempo热化学储能项目（CEC资助）](https://www.energystorage.ucsd.edu/projects/demonstrating-tempo-thermochemical-energy-storage-at-uc-san-diego)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "项目支持与具体热需求",
      "title": "项目支持与具体热需求",
      "content": "### 应用场景与工程边界\n\n| 已核项目或政策 | 对路线的实际支持 | 可展示的状态 |\n|---|---|---|\n| 欧盟 SOCRATCES，2018–2021 | 太阳热与碳酸化储能集成、试验单元及循环测试 | 结题报告：从TRL4到TRL5，相关环境中试 |\n| 欧盟 HEAT-INSYDE，2019–2025 | 盐水合材料、住宅系统集成和不同气候示范 | 结题报告：三处地点验证；项目目标与实测结果分开 |\n| DLR CALOGY，2024-05至2025-06 | 石灰储热与真实建筑供热场景衔接 | 机构项目页展示原型与示范目标，容量未披露 |\n| DOE 2023 储热技术战略 | 在长时储能研究中考虑热储能材料与系统 | 技术战略，不是热化学独立装机统计 |\n\n来源：[SOCRATCES](https://cordis.europa.eu/project/id/727348/reporting)；[HEAT-INSYDE](https://cordis.europa.eu/project/id/869810/reporting/fr)；[DLR CALOGY](https://www.dlr.de/de/tt/forschung-transfer/projekte/abgeschlossene-projekte/2025/copy_of_aquas)；[DOE 技术战略](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Thermal%20Energy%20Storage_0.pdf)。\n\n本路线最直接的市场是热服务：建筑热水与采暖、余热回收、工业过程热及热发电配套。材料和商业系统仍存在明显尺度差异，市场区展示具体项目与需求温区，不将全技术新型储能累计电容量当作热化学容量。\n\n### 中国热（冷）储能研发与示范\n\n国家发展改革委、国家能源局2022年实施方案列出热（冷）储能长时间尺度攻关，提出拓展热（冷）储能应用与高效储热日到周、周到季示范。这是研发与示范安排，项目容量按各自热端边界记录。\n\n来源：[2022原始实施方案](https://www.ndrc.gov.cn/xxgk/zcfb/tz/202203/P020220321543703119995.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储存状态与交付热量",
      "title": "储存状态与交付热量",
      "content": "### 交付任务与工况\n\n| 用能任务 | 适配价值 | 主要约束 | 评价重点 |\n|---|---|---|---|\n| 季节或长间隔供热 | 分离反应物可降温保存，降低长期高温保温需求 | 防止意外吸湿/反应；季节使用次数低时设备利用率不足 | 完整系统可用热量、再生温度、密封与辅助电耗 |\n| 工业余热跨地点利用 | 沸石/盐体系可将储热介质运送到热用户 | 运输距离、装卸时间、用户湿度、床层压降 | 每车次有效MWh_th、供热功率、全链成本 |\n| 建筑热水与采暖 | 低温盐水合能与太阳热、热泵、热网配合 | 水汽压力与需求温度匹配；结块及循环体积变化 | 输出温度、可用热容量、峰值持续时间 |\n| 中高温过程热 | 氢氧化物可调反应温区，材料仓与反应器可尝试分开扩容 | 固体流动、团聚、蒸气供应与传热限制 | 转化率、功率、床层规模和稳定循环次数 |\n| 太阳热发电 | 碳酸化循环有高温热源与长时间解耦潜力 | 高温设备、颗粒失活、气体储存及动力循环集成 | 单独列热输入、净电输出与系统边界 |\n\n热化学的优势来自反应物的储存状态，而非“任何条件下都无损”。放热时仍要加热固体、供应水汽或 CO₂、克服传热阻力并驱动风机/泵。把这些部件纳入后，材料反应焓、反应转化率、过程热效率和净电热电效率才各自有清晰含义。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "thermal-thermochemical-policy",
    "label": "反应储热研发与系统示范",
    "title": "反应储热研发与系统示范",
    "year": "2022—2025",
    "copy": "中国实施方案支持热（冷）储能技术和高效储热示范。欧盟项目分别验证钙循环中试与住宅盐水合系统。",
    "facts": [
      [
        "热（冷）储能",
        "2022中国实施方案研发及示范"
      ],
      [
        "TRL4→5 / 三处示范",
        "SOCRATCES2021与HEAT-INSYDE2025不同项目"
      ]
    ],
    "subject": "scene:thermal-policy"
  },
  "market": {
    "id": "thermal-thermochemical-market",
    "label": "建筑供热、余热运输与过程热",
    "title": "建筑供热、余热运输与过程热",
    "year": "应用",
    "copy": "热服务需求决定温度、再生条件和反应器功率。真实工程按热容量计量，热发电模型单列净电结果。",
    "facts": [
      [
        "2.3MWh_th / 7km",
        "2015沸石余热运输示范"
      ],
      [
        "高温过程热",
        "氢氧化物/碳酸化不同反应设备"
      ]
    ],
    "subject": "route:thermal-thermochemical:history"
  },
  "historySubject": "route:thermal-thermochemical:history",
  "note": "独立反应储热研究",
  "papers": {
    "id": "thermal-thermochemical-papers",
    "label": "水汽、反应器与材料分母",
    "title": "水汽、反应器与材料分母",
    "year": "试验",
    "copy": "水汽条件直接影响盐水合释热，床层影响供热功率。材料体积功率和系统效率使用各自测量边界。",
    "facts": [
      [
        "859→1324J/g干材料",
        "RH30%→60%，2022镁盐复合体"
      ],
      [
        "约200kW_th/m³",
        "2024封装钾盐90%转化处，材料/试验床指标"
      ]
    ],
    "subject": "material:thermal-thermochemical-salt-hydration"
  },
  "storage": {
    "id": "thermal-thermochemical-storage",
    "label": "把反应物与用热任务配对",
    "title": "把反应物与用热任务配对",
    "year": "应用",
    "copy": "隔绝反应气体后可降温保存，放热时再供应水汽或CO₂。用户温度、辅助耗能和物料循环共同决定交付。",
    "facts": [
      [
        "季节供热 / 工业余热",
        "按再生与放热温区匹配"
      ],
      [
        "热输入 / 净电输出",
        "热发电配套另列动力循环边界"
      ]
    ],
    "subject": "route:thermal-thermochemical:history"
  },
  "showMarketChart": false
};
