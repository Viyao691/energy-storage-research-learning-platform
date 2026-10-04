import type { ChronicleResearch } from "./researchRoutes";

export const vanadiumResearch: ChronicleResearch = {
  "name": "全钒液流",
  "timeline": [
    {
      "id": "vanadium-1984",
      "label": "同一元素承担两侧反应",
      "year": "1984",
      "title": "同一元素承担两侧反应",
      "copy": "两侧用同一种金属的不同价态，跨膜钒可以通过电解液再平衡处理。自放电与荷电状态失衡仍需管理。",
      "facts": [
        [
          "V(II)/V(III)",
          "负极氧化还原电对"
        ],
        [
          "V(IV)/V(V)",
          "正极电对 · 两侧均采用钒"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 1984,
      "detail": "UNSW将1984年记为Maria Skyllas-Kazacos团队发明首个全钒液流电池的年份。负极用V(II)/V(III)，正极用V(IV)/V(V)，跨膜迁移不再引入另一种活性金属的永久交叉污染，但仍造成自放电与荷电状态失衡。创始人回顾把构想追溯至1983年末，1986年才申请首项专利；因此入口用“1984研究起点”，不能把构想、专利和商业化写成同一年。",
      "source": "https://www.unsw.edu.au/engineering/research-technology/is/meeting-the-demand-for-large-scale-energy-storage"
    },
    {
      "id": "vanadium-1985",
      "label": "正负半电池分别形成原始论文",
      "year": "1985",
      "title": "正负半电池分别形成原始论文",
      "copy": "先分别研究正负半反应的可逆性与电极动力学，再把两个电对组成完整电池。",
      "facts": [
        [
          "两侧半电池",
          "原始论文分别研究两种钒电对"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 1985,
      "detail": "Sum与Skyllas-Kazacos研究V(II)/V(III)，Sum、Rychcik与Skyllas-Kazacos研究V(V)/V(IV)。先分别考察电极动力学，再组成全电池，使“都用钒”从构想转为可实验比较的反应体系。该半电池论文的书目来源为作者大学出版物目录。",
      "source": "https://doi.org/10.1016/0378-7753%2885%2980071-9"
    },
    {
      "id": "vanadium-1986",
      "label": "全钒原型正式发表",
      "year": "1986",
      "title": "全钒原型正式发表",
      "copy": "原型论文把钒电对、隔膜、电极和循环液路放进同一器件，开启完整电池验证。",
      "facts": [
        [
          "1986",
          "全钒原型论文及专利阶段"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 1986,
      "detail": "《New All-Vanadium Redox Flow Cell》发表于JES 133:1057–1058，并进入专利保护阶段。研究重点从单个半反应走向膜、电极和两侧电解液的共同运行。不是兆瓦级示范，也不代表现代商业堆已经定型。",
      "source": "https://doi.org/10.1149/1.2108706"
    },
    {
      "id": "vanadium-1991",
      "label": "1 kW级原型性能论文",
      "year": "1991",
      "title": "1 kW级原型性能论文",
      "copy": "千瓦级原型放大了液流分配、连接电阻与旁路电流问题。功率放大需要同时处理系统损耗。",
      "facts": [
        [
          "1kW",
          "UNSW原型功率，非1kWh储能量"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 1991,
      "detail": "《Characteristics and performance of 1 kW UNSW vanadium redox battery》将研究推进到千瓦级。尺度增长开始放大液流分配、连接电阻和旁路电流等系统问题。这里1 kW为功率，不写为1 kWh储能量。",
      "source": "https://doi.org/10.1016/0378-7753%2891%2980058-6"
    },
    {
      "id": "vanadium-2011",
      "label": "硫酸—盐酸混酸改变溶解度与温度窗口",
      "year": "2011",
      "title": "硫酸—盐酸混酸改变溶解度与温度窗口",
      "copy": "混酸配位环境提高钒溶解度并改变析出行为。浓度与温度窗口对应这套研究配方。",
      "facts": [
        [
          ">2.5mol/L",
          "混酸配方钒浓度"
        ],
        [
          "−5～60°C",
          "研究电解液稳定范围，非系统额定温区"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2011,
      "detail": "PNNL原始论文报告混酸可溶解超过2.5 mol/L钒，相比当时硫酸体系储能容量提高约70%，报告电解液稳定范围−5～60°C。关键机制是配位环境改变，使提高浓度与稳定不同价态的钒同时成为可能；这里是研究配方的电解液稳定范围，不是所有商业电池的额定运行温区。",
      "source": "https://www.pnnl.gov/publications/stable-vanadium-redox-flow-battery-high-energy-density-large-scale-energy-storage"
    },
    {
      "id": "vanadium-2013",
      "label": "混酸从单电池走到千瓦堆",
      "year": "2013",
      "title": "混酸从单电池走到千瓦堆",
      "copy": "混酸优势进入带循环液路的千瓦原型，82%能效有明确电流密度和SOC范围。它属于论文原型指标。",
      "facts": [
        [
          "82%",
          "论文千瓦原型能效 · 80mA/cm² / 15–85%SOC"
        ],
        [
          ">1.1kW / 1.4kWh",
          "同一混酸原型的功率与能量"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2013,
      "detail": "原型在80 mA/cm²、15%～85% SOC运行范围内提供超过1.1 kW，论文报告能量效率82%、能量1.4 kWh；电解液温度超过45°C仍未出现沉淀，硫酸对照在80次循环后出现沉淀。混酸的意义既包括热稳定，也包括低黏度与泵耗潜力。82%是论文原型口径，不能直接标为电站交流往返效率。",
      "source": "https://doi.org/10.1016/j.jpowsour.2013.02.045"
    },
    {
      "id": "vanadium-2015",
      "label": "北海道大型电网示范",
      "year": "2015",
      "title": "北海道大型电网示范",
      "copy": "大型电网示范把评价扩展到风电接入、调频、输出平滑与运行控制。额定配置为四小时。",
      "facts": [
        [
          "15MW / 60MWh",
          "北海道南早来大型示范"
        ],
        [
          "4h",
          "额定能量与功率之比"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2015,
      "detail": "住友电工与北海道电力在南早来开展为期三年的大型示范，资料列功率15 MW、容量60 MWh，即额定4小时配置。研究对象从单堆效率扩大到大规模可再生能源接入下的调频、输出平滑和运行控制。",
      "source": "https://sumitomoelectric.com/sites/default/files/2025-09/download_documents/RFB_Catalog_EN.pdf"
    },
    {
      "id": "vanadium-2021",
      "label": "真实配电网的孤岛运行",
      "year": "2021",
      "title": "真实配电网的孤岛运行",
      "copy": "液流项目在实际配电区域实现孤岛供电。服务对象与停电韧性进入运行评价。",
      "facts": [
        [
          "66户",
          "加州真实配电区域孤岛供电"
        ],
        [
          "2021年10月",
          "示范运行；2022年4月发布结果"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2021,
      "detail": "NEDO与住友在加州项目追加微电网示范，2021年10月成功运行，2022年4月发布结果，覆盖66个用电客户。正常时参与电力市场、紧急时为实际配电区域供电，使价值评估从电价套利扩展到韧性。须区分2021试运行与2022发布，不将66户理解为能量容量。",
      "source": "https://sumitomoelectric.com/press/2022/04/prs012"
    },
    {
      "id": "vanadium-2022",
      "label": "从示范到持续电网服务",
      "year": "2022",
      "title": "从示范到持续电网服务",
      "copy": "北海道新增系统开始持续电网服务。三小时项目与此前四小时示范分别归档。",
      "facts": [
        [
          "17MW / 51MWh",
          "北海道新增项目，2022年4月运行"
        ],
        [
          "3h",
          "额定配置时长，与2015项目分列"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2022,
      "detail": "北海道南早来新增17 MW/51 MWh项目于2022年4月开始运行，额定3小时，用于新增风电接入条件下的电网控制。它与2015年的15 MW/60 MWh不是同一个容量数字。中科院2022-10-09原文报道：大连一期100MW/400MWh由融科建造集成，9月底并网；报道当时列10月中旬投入运行计划。4h是额定配置比值，原文未报告实测交流效率。",
      "source": "https://sumitomoelectric.com/sites/default/files/2025-09/download_documents/RFB_Catalog_EN.pdf"
    },
    {
      "id": "vanadium-2024",
      "label": "膜结构把选择性与导电性一起设计",
      "year": "2024",
      "title": "膜结构把选择性与导电性一起设计",
      "copy": "支化膜结构同时影响导电、选择性与稳定性。膜电导率和整电池效率分别评价。",
      "facts": [
        [
          ">60mS/cm",
          "膜氯离子电导率 · 30°C"
        ],
        [
          "120mS/cm",
          "同研究膜 · 80°C，非整站温度"
        ],
        [
          "400mA/cm²",
          "实验液流电池测试电流密度"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2024,
      "detail": "中科大研究螺环支化聚合物阴离子交换膜；机构说明氯离子电导率在30°C超过60 mS/cm，在80°C达到120 mS/cm，并报告400 mA/cm²液流电池测试及全钒体系化学稳定性。膜测试电导率与整电池效率不是同一指标，不能把80°C写成全钒系统运行温度。",
      "source": "https://doi.org/10.1038/s41893-024-01364-0"
    },
    {
      "id": "vanadium-2025",
      "label": "70 kW电堆与电网采购并行",
      "year": "2025",
      "title": "70 kW电堆与电网采购并行",
      "copy": "电堆放大与工程采购并行推进。70kW成果评价、项目开工和未来完工计划分别记录。",
      "facts": [
        [
          "70kW",
          "DICP高功率密度堆 · 1月成果评价"
        ],
        [
          "2MW / 8MWh",
          "熊本长洲项目 · 3月开工"
        ],
        [
          "2026年10月",
          "公告计划完工日期，非已投运事实"
        ]
      ],
      "subject": "route:vanadium:history",
      "yearNumber": 2025,
      "detail": "1月14日，大连化物所70 kW高功率密度堆通过成果评价；研究所披露采用可焊接复合多孔离子传导膜、高导电双极板、短流程及超薄电极，体积功率密度提升一倍、成本降低40%。这是该技术对其比较基线的披露，不能写成整个行业降本40%。3月住友宣布熊本长洲2 MW/8 MWh项目开工、预计2026年10月完成；该项目2025年为开工阶段，完工日期为2026年10月的计划。 Invinity Copwood20.7MWh设备于2025年12月已现场安装，项目页称待2026年接网。安装规模不写成当时已运行容量。",
      "source": "https://energystorage.dicp.ac.cn/info/1133/7681.htm"
    }
  ],
  "materials": [
    {
      "id": "vanadium-sulfate",
      "label": "硫酸钒电解液",
      "title": "同元素反应与析出控制",
      "copy": "V(II)/V(III)与V(IV)/V(V)构成两侧反应。温度、浓度、黏度与再平衡维护共同决定运行边界.",
      "facts": [
        [
          "两侧同元素",
          "交叉渗透仍产生自放电与SOC失衡"
        ]
      ],
      "year": "材料",
      "subject": "material:vanadium-sulfate"
    },
    {
      "id": "vanadium-mixed-acid",
      "label": "硫酸—盐酸混酸",
      "title": "配位环境改变溶解度",
      "copy": "混酸研究同时考察高浓度与温度稳定；密封、腐蚀及氯相关副反应仍需系统评价。",
      "facts": [
        [
          ">2.5mol/L",
          "2011研究钒浓度"
        ],
        [
          "−5～60°C",
          "对应研究配方的电解液稳定范围"
        ]
      ],
      "year": "材料",
      "subject": "material:vanadium-mixed-acid"
    },
    {
      "id": "vanadium-membrane",
      "label": "离子交换与复合膜",
      "title": "导电、选择性与寿命协同",
      "copy": "膜既传导离子也抑制活性物质迁移。厚度、强度、选择性和加工成本共同决定材料价值。",
      "facts": [
        [
          ">60mS/cm",
          "2024支化膜 · 氯离子 / 30°C"
        ],
        [
          "400mA/cm²",
          "该研究实验液流电池测试"
        ]
      ],
      "year": "材料",
      "subject": "material:vanadium-membrane"
    },
    {
      "id": "vanadium-carbon",
      "label": "碳电极与双极板",
      "title": "反应界面与电堆功率密度",
      "copy": "润湿性、活性表面、压缩比及流场共同影响电极反应。导电连接和辅机消耗仍需一起测量。",
      "facts": [
        [
          "70kW",
          "2025DICP堆成果评价，非全行业规格"
        ]
      ],
      "year": "材料",
      "subject": "material:vanadium-carbon"
    }
  ],
  "companies": [
    {
      "id": "vanadium-sumitomo",
      "label": "住友电工",
      "year": "2022",
      "title": "北海道风电配储与电网运行",
      "copy": "住友电工参与北海道南早来全钒液流系统，2022年4月投运。电网项目规模与集团财务分开呈现。",
      "facts": [
        [
          "17MW / 51MWh",
          "北海道2022项目 · 3h额定配置"
        ]
      ],
      "subject": "company:vanadium-sumitomo"
    },
    {
      "id": "vanadium-invinity",
      "label": "Invinity",
      "year": "2025",
      "title": "Copwood现场安装与接网阶段",
      "copy": "Copwood现场设备安装于2025年末完成，项目页称待2026年接网。累计输出能量不当作装机容量。",
      "facts": [
        [
          "20.7MWh",
          "Copwood已现场安装，待2026接网"
        ],
        [
          "近100站点 / 17国",
          "企业自报运行系统范围"
        ],
        [
          ">8GWh",
          "企业自报累计现场交付能量，非装机容量"
        ]
      ],
      "subject": "company:vanadium-invinity"
    },
    {
      "id": "vanadium-rongke",
      "label": "大连融科",
      "year": "2022",
      "title": "100MW级系统建造与集成",
      "copy": "中科院报道大连融科建造集成一期系统，2022年9月底并网。2022年10月9日报道仍列随后投运计划。",
      "facts": [
        [
          "100MW / 400MWh",
          "大连一期并网规模 · 4h额定配置"
        ]
      ],
      "subject": "company:vanadium-rongke"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "全钒：从同元素反应到电网运行",
      "content": "### 1984：同一元素承担两侧反应\n\nUNSW将1984年记为Maria Skyllas-Kazacos团队发明首个全钒液流电池的年份。负极用V(II)/V(III)，正极用V(IV)/V(V)，跨膜迁移不再引入另一种活性金属的永久交叉污染，但仍造成自放电与荷电状态失衡。创始人回顾把构想追溯至1983年末，1986年才申请首项专利；因此入口用“1984研究起点”，不能把构想、专利和商业化写成同一年。\n\n### 1985：正负半电池分别形成原始论文\n\nSum与Skyllas-Kazacos研究V(II)/V(III)，Sum、Rychcik与Skyllas-Kazacos研究V(V)/V(IV)。先分别考察电极动力学，再组成全电池，使“都用钒”从构想转为可实验比较的反应体系。该半电池论文的书目来源为作者大学出版物目录。\n\n### 1986：全钒原型正式发表\n\n《New All-Vanadium Redox Flow Cell》发表于JES 133:1057–1058，并进入专利保护阶段。研究重点从单个半反应走向膜、电极和两侧电解液的共同运行。不是兆瓦级示范，也不代表现代商业堆已经定型。\n\n### 1991：1 kW级原型性能论文\n\n《Characteristics and performance of 1 kW UNSW vanadium redox battery》将研究推进到千瓦级。尺度增长开始放大液流分配、连接电阻和旁路电流等系统问题。这里1 kW为功率，不写为1 kWh储能量。\n\n### 2011：硫酸—盐酸混酸改变溶解度与温度窗口\n\nPNNL原始论文报告混酸可溶解超过2.5 mol/L钒，相比当时硫酸体系储能容量提高约70%，报告电解液稳定范围−5～60°C。关键机制是配位环境改变，使提高浓度与稳定不同价态的钒同时成为可能；这里是研究配方的电解液稳定范围，不是所有商业电池的额定运行温区。\n\n### 2013：混酸从单电池走到千瓦堆\n\n原型在80 mA/cm²、15%～85% SOC运行范围内提供超过1.1 kW，论文报告能量效率82%、能量1.4 kWh；电解液温度超过45°C仍未出现沉淀，硫酸对照在80次循环后出现沉淀。混酸的意义既包括热稳定，也包括低黏度与泵耗潜力。82%是论文原型口径，不能直接标为电站交流往返效率。\n\n### 2015：北海道大型电网示范\n\n住友电工与北海道电力在南早来开展为期三年的大型示范，资料列功率15 MW、容量60 MWh，即额定4小时配置。研究对象从单堆效率扩大到大规模可再生能源接入下的调频、输出平滑和运行控制。\n\n### 2021：真实配电网的孤岛运行\n\nNEDO与住友在加州项目追加微电网示范，2021年10月成功运行，2022年4月发布结果，覆盖66个用电客户。正常时参与电力市场、紧急时为实际配电区域供电，使价值评估从电价套利扩展到韧性。须区分2021试运行与2022发布，不将66户理解为能量容量。\n\n### 2022：从示范到持续电网服务\n\n北海道南早来新增17 MW/51 MWh项目于2022年4月开始运行，额定3小时，用于新增风电接入条件下的电网控制。它与2015年的15 MW/60 MWh不是同一个容量数字。中科院2022-10-09原文报道：大连一期100MW/400MWh由融科建造集成，9月底并网；报道当时列10月中旬投入运行计划。4h是额定配置比值，原文未报告实测交流效率。\n\n### 2024：膜结构把选择性与导电性一起设计\n\n中科大研究螺环支化聚合物阴离子交换膜；机构说明氯离子电导率在30°C超过60 mS/cm，在80°C达到120 mS/cm，并报告400 mA/cm²液流电池测试及全钒体系化学稳定性。膜测试电导率与整电池效率不是同一指标，不能把80°C写成全钒系统运行温度。\n\n### 2025：70 kW电堆与电网采购并行\n\n1月14日，大连化物所70 kW高功率密度堆通过成果评价；研究所披露采用可焊接复合多孔离子传导膜、高导电双极板、短流程及超薄电极，体积功率密度提升一倍、成本降低40%。这是该技术对其比较基线的披露，不能写成整个行业降本40%。3月住友宣布熊本长洲2 MW/8 MWh项目开工、预计2026年10月完成；该项目2025年为开工阶段，完工日期为2026年10月的计划。 Invinity Copwood20.7MWh设备于2025年12月已现场安装，项目页称待2026年接网。安装规模不写成当时已运行容量。\n\n原始来源 · [UNSW机构史](https://www.unsw.edu.au/engineering/research-technology/is/meeting-the-demand-for-large-scale-energy-storage) · [创始人历史章节](https://onlinelibrary.wiley.com/doi/abs/10.1002/9783527832767.ch22) · [10.1016/0378-7753(85)80071-9](https://doi.org/10.1016/0378-7753%2885%2980071-9) · [10.1016/0378-7753(85)80082-3](https://doi.org/10.1016/0378-7753%2885%2980082-3) · [UNSW目录](https://research.unsw.edu.au/people/emeritus-professor-maria-skyllas-kazacos/publications?page=4&type=journalarticles) · [10.1149/1.2108706](https://doi.org/10.1149/1.2108706) · [10.1016/0378-7753(91)80058-6](https://doi.org/10.1016/0378-7753%2891%2980058-6) · [作者机构目录](https://www.unsw.edu.au/staff/maria-skyllas-kazacos) · [PNNL论文摘要](https://www.pnnl.gov/publications/stable-vanadium-redox-flow-battery-high-energy-density-large-scale-energy-storage) · [10.1016/j.jpowsour.2013.02.045](https://doi.org/10.1016/j.jpowsour.2013.02.045) · [PNNL原始摘要](https://www.pnnl.gov/publications/1-kw-1kwh-advanced-vanadium-redox-flow-battery-utilizing-mixed-acid-electrolytes) · [住友项目册](https://sumitomoelectric.com/sites/default/files/2025-09/download_documents/RFB_Catalog_EN.pdf) · [官方项目回顾](https://sumitomoelectric.com/sites/default/files/2023-03/download_documents/sei_id019E.pdf) · [住友/NEDO结果](https://sumitomoelectric.com/press/2022/04/prs012) · [DICP新闻目录](https://energystorage.dicp.ac.cn/Home/News.htm) · [10.1038/s41893-024-01364-0](https://doi.org/10.1038/s41893-024-01364-0) · [研究机构说明](https://english.cas.cn/newsroom/news--archives/2024/research-news/202406/t20240626_1129640.shtml) · [DICP成果](https://energystorage.dicp.ac.cn/info/1133/7681.htm) · [住友项目](https://sumitomoelectric.com/press/2025/03/prs024) · [大连一期原文](https://www.english.dicp.cas.cn/nc/202210/t20221009_321157.html) · [Copwood项目原文](https://invinity.com/case-study-invinity-copwood-vfb-energy-hub/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "电解液、电极与膜的共同约束",
      "content": "|方向|解决什么|机制与实际代价|\n|---|---|---|\n|硫酸钒电解液|成熟两侧氧化还原体系|同元素跨膜较易通过混液、再平衡恢复；高低温析出、浓度与黏度约束仍在，不能把“活性物质可恢复”写成整站零衰减。|\n|硫酸—盐酸混酸|提高溶解度、拓宽稳定窗口|2011与2013研究给出了电解液及千瓦原型两级证据；还需评估氯体系腐蚀、逸出副反应、密封与材料相容性。|\n|离子交换/多孔复合膜|降低欧姆损耗和交叉渗透|选择性高有利库仑效率，薄膜低阻有利电压效率，但机械强度、寿命和成本必须共同满足；2024支化膜与2025可焊接膜是不同研究。|\n|碳电极与双极板|提高反应速率及堆功率密度|表面活性、润湿性、压缩比、流场和导电连接共同决定性能；提高电流密度会缩小同功率堆，但不自动降低泵耗或提高可用能量。|\n\n原始来源 · [PNNL论文摘要](https://www.pnnl.gov/publications/stable-vanadium-redox-flow-battery-high-energy-density-large-scale-energy-storage) · [10.1016/j.jpowsour.2013.02.045](https://doi.org/10.1016/j.jpowsour.2013.02.045) · [PNNL原始摘要](https://www.pnnl.gov/publications/1-kw-1kwh-advanced-vanadium-redox-flow-battery-utilizing-mixed-acid-electrolytes) · [10.1038/s41893-024-01364-0](https://doi.org/10.1038/s41893-024-01364-0) · [研究机构说明](https://english.cas.cn/newsroom/news--archives/2024/research-news/202406/t20240626_1129640.shtml) · [DICP成果](https://energystorage.dicp.ac.cn/info/1133/7681.htm) · [住友项目](https://sumitomoelectric.com/press/2025/03/prs024)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "把混酸与膜研究放回测试条件",
      "content": "|论文|研究层级|可展示参数|学术问题|\n|---|---|---|---|\n|1985两篇半电池论文|半反应|V(II)/V(III)、V(IV)/V(V)；DOI见历史|同一金属的两个可逆电对能否协同工作。|\n|1986全钒原型|实验电池|完整全钒原型与两侧反应机制|从半反应证明转向完整电池。|\n|2011混酸，AEM|电解液|>2.5 mol/L、−5～60°C稳定性|配位化学如何改变溶解度及析出。|\n|2013千瓦堆，JPS|原型电堆/系统|80 mA/cm²、15%～85% SOC、>1.1 kW、1.4 kWh、82%|材料优势能否在多电池与泵循环中保留。|\n|2024支化膜，Nature Sustainability|膜与实验电池|60 mS/cm@30°C、120 mS/cm@80°C；测试400 mA/cm²|如何同时处理导电、选择性及化学稳定。|\n\n原始来源 · [10.1016/0378-7753(85)80071-9](https://doi.org/10.1016/0378-7753%2885%2980071-9) · [10.1016/0378-7753(85)80082-3](https://doi.org/10.1016/0378-7753%2885%2980082-3) · [UNSW目录](https://research.unsw.edu.au/people/emeritus-professor-maria-skyllas-kazacos/publications?page=4&type=journalarticles) · [10.1149/1.2108706](https://doi.org/10.1149/1.2108706) · [PNNL论文摘要](https://www.pnnl.gov/publications/stable-vanadium-redox-flow-battery-high-energy-density-large-scale-energy-storage) · [10.1016/j.jpowsour.2013.02.045](https://doi.org/10.1016/j.jpowsour.2013.02.045) · [PNNL原始摘要](https://www.pnnl.gov/publications/1-kw-1kwh-advanced-vanadium-redox-flow-battery-utilizing-mixed-acid-electrolytes) · [10.1038/s41893-024-01364-0](https://doi.org/10.1038/s41893-024-01364-0) · [研究机构说明](https://english.cas.cn/newsroom/news--archives/2024/research-news/202406/t20240626_1129640.shtml)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "研发、材料、电堆与电网集成",
      "content": "### 住友电工\n\n日本电线、电力设备和储能企业；北海道南早来风电配储项目采用全钒液流电池。\n\n上市关系：住友电工集团上市主体：东京证券交易所5802\n\nFY2025集团净销售额5.1102万亿日元（集团全业务，非液流电池收入）；北海道项目17MW/51MWh，2022年4月投运。\n\n住友电工参与北海道南早来全钒液流系统，2022年4月投运。电网项目规模与集团财务分开呈现。\n\n- **17MW / 51MWh** · 北海道2022项目 · 3h额定配置\n\n原始来源 · [FY2025集团业绩](https://sumitomoelectric.com/president/2026/05/202607) · [北海道项目](https://sumitomoelectric.com/products/flow-batteries/case-studies/hokkaido-wind-integration)\n\n### Invinity\n\n英国长时储能企业，开发钒液流电池系统。\n\n上市关系：伦敦AIM上市主体 Invinity Energy Systems plc，代码IES\n\n企业称系统在近100个站点、17国运行；累计在现场交付超过8GWh能量（不是装机容量）；Copwood项目20.7MWh，2025年12月现场设备已安装，项目页称待2026年接网运行。\n\nCopwood现场设备安装于2025年末完成，项目页称待2026年接网。累计输出能量不当作装机容量。\n\n- **20.7MWh** · Copwood已现场安装，待2026接网\n- **近100站点 / 17国** · 企业自报运行系统范围\n- **>8GWh** · 企业自报累计现场交付能量，非装机容量\n\n原始来源 · [公司介绍及规模自述](https://invinity.com/uk/) · [Copwood项目和状态](https://invinity.com/case-study-invinity-copwood-vfb-energy-hub/)\n\n### 大连融科\n\n中国全钒液流储能系统集成企业大连融科，大连一期项目建造与集成方。\n\n上市关系：独立上市主体信息未公开。\n\n中科院大连化物所称大连液流储能站一期100MW/400MWh由大连融科建造和集成；2022年9月底并网，报道当时称计划10月中旬投运。\n\n中科院报道大连融科建造集成一期系统，2022年9月底并网。2022年10月9日报道仍列随后投运计划。\n\n- **100MW / 400MWh** · 大连一期并网规模 · 4h额定配置\n\n原始来源 · [中科院大连化物所项目报道](https://www.english.dicp.cas.cn/nc/202210/t20221009_321157.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "项目支持与实际电网需求",
      "content": "### 中国：液流商业化技术方向\n\n国家发展改革委、国家能源局2025-09-12发布的发改能源〔2025〕1144号提及液流电池储能进一步商业化，是一般液流技术方向。\n\n### 区域项目与研究目标\n\n日本熊本2 MW/8 MWh项目的2025公告明确列入经产省/资源能源厅电网侧蓄电池补贴，展示为一个获得支持的项目，不能外推成全钒行业统一补贴。北海道案例说明电网接纳新增风电与长期运营合同可以形成需求；加州示范说明储能收入还取决于市场交易和停电韧性。国内全钒规模增长需按项目投运、在建和规划分别统计，本底稿未取得同口径全国全钒装机总量，市场栏应以已证实工程呈现而不是编份额。\n\n原始来源 · [2025液流商业化政策原文](https://www.ndrc.gov.cn/xwdt/tzgg/202509/t20250912_1400427_ext.html) · [熊本电网侧项目公告](https://sumitomoelectric.com/press/2025/03/prs024)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "额定时长、运行损耗与维护",
      "content": "### 结构、运行与系统计量\n\n全钒主要面向有场地、频繁循环、数小时持续放电的固定式场景。增加电解液罐通常比增加电堆更直接地扩展能量，电堆规模主要决定功率；辅助设备、流量和场地仍随系统扩展。北海道的3小时与4小时项目说明“液流”不等于全部达到10小时以上；长时能力需要具体罐容与额定输出共同定义。\n\n评价工程至少同时读：额定功率、可用能量、SOC窗口、运行温度、交流计量边界、泵及热管理消耗、容量再平衡维护、计划寿命与实际累计运行。更耐深循环、非易燃水系电解液和活性钒可再利用是技术吸引力；钒价格、膜成本、低体积能量密度与辅机损耗决定经济边界。把电解液回收残值纳入模型时必须明示合同或估值假设，不拿实验室82%直接计算项目收益。\n\n原始来源 · [10.1016/j.jpowsour.2013.02.045](https://doi.org/10.1016/j.jpowsour.2013.02.045) · [PNNL原始摘要](https://www.pnnl.gov/publications/1-kw-1kwh-advanced-vanadium-redox-flow-battery-utilizing-mixed-acid-electrolytes) · [住友项目册](https://sumitomoelectric.com/sites/default/files/2025-09/download_documents/RFB_Catalog_EN.pdf) · [官方项目回顾](https://sumitomoelectric.com/sites/default/files/2023-03/download_documents/sei_id019E.pdf) · [DICP新闻目录](https://energystorage.dicp.ac.cn/Home/News.htm)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "vanadium-policy",
    "label": "项目支持",
    "title": "补贴项目与电网需求",
    "copy": "2025中国政策提及液流储能进一步商业化。熊本长洲2MW/8MWh项目公告列明日本电网侧蓄电池补贴支持。项目开工与计划完工按不同阶段记录。",
    "facts": [
      [
        "2MW / 8MWh",
        "2025年3月开工项目"
      ],
      [
        "2026年10月",
        "公告计划完成，尚无竣工证据"
      ]
    ],
    "subject": "scene:flow-policy",
    "year": "2025"
  },
  "market": {
    "id": "flow-market",
    "label": "中国新型储能（全部技术）",
    "title": "新型储能的应用背景",
    "copy": "中国全部新型储能统计提供应用背景，包含多种技术。它不是全钒或其他单一路线的市场规模。",
    "year": "2025",
    "facts": [
      [
        "136GW",
        "2025年底 · 全部新型储能功率"
      ],
      [
        "351GWh",
        "同范围累计容量，非本路线装机"
      ],
      [
        "2.58h",
        "平均单次配置时长，非年度利用小时"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "vanadium-papers",
    "label": "论文",
    "title": "混酸优势怎样进入千瓦原型",
    "copy": "2013论文把高浓度混酸放入千瓦堆，给出功率、能量与效率的同时测量。温度稳定和电流密度保留在同一试验条件中。",
    "facts": [
      [
        "82%",
        "论文千瓦原型能效 · 80mA/cm² / 15–85%SOC"
      ],
      [
        ">1.1kW / 1.4kWh",
        "同一混酸原型的功率与能量"
      ]
    ],
    "subject": "route:vanadium:history",
    "year": "2013"
  },
  "storage": {
    "id": "vanadium-storage",
    "label": "储能适配",
    "title": "功率由电堆、能量由电解液共同组织",
    "copy": "北海道三个与四个小时项目给出实际配置。扩展储液罐与电堆需要同步评估场地、泵耗与维护。",
    "facts": [
      [
        "15MW / 60MWh",
        "2015北海道示范 · 4h配置"
      ],
      [
        "17MW / 51MWh",
        "2022北海道新增系统 · 3h配置"
      ]
    ],
    "subject": "route:vanadium:history",
    "year": "应用"
  },
  "historySubject": "route:vanadium:history",
  "note": "11个有来源年份与实际项目条件"
};

export const ironChromiumResearch: ChronicleResearch = {
  "name": "铁铬液流",
  "timeline": [
    {
      "id": "iron-chromium-1974",
      "label": "NASA提出可充电液流储能框架",
      "year": "1974",
      "title": "NASA提出可充电液流储能框架",
      "copy": "把电解液储罐与能量转换部件连接起来，形成可充电液流储能框架。铁铬研发由NASA历史资料归档。",
      "facts": [
        [
          "1974",
          "NASA液流系统概念 · 会议8月26–30日"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 1974,
      "detail": "Lawrence H. Thaller在NASA-TM-X-71540中提出将氧化还原电对泵送经过能量转换部件的储能概念，会议时间为1974年8月26–30日。原始条目强调大容量电力储存及深放电，这是现代液流的系统概念节点；不能把条目中前景判断当成已证实无限循环寿命。铁铬研发归属由NASA机构回顾确认，首篇概念摘要本身不作为铁铬定量性能证据。",
      "source": "https://ntrs.nasa.gov/citations/19740013575"
    },
    {
      "id": "iron-chromium-1981",
      "label": "铬电极成为放大的关键",
      "year": "1981",
      "title": "铬电极成为放大的关键",
      "copy": "铬电极的催化、清洗与放大一致性成为研发重点。杂质与碳毡处理会改变副反应及活性。",
      "facts": [
        [
          "930cm²",
          "金—铅催化碳毡最大试验电极面积"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 1981,
      "detail": "NASA-TM-82724研究金—铅催化碳毡，电极面积放大到930 cm²，测试析氢、库仑效率、催化剂稳定与电化学活性。清洗方式、碳毡批次及金负载过程均影响表现，说明“便宜电解液”不等于低难度电堆。该报告出版日期是1981-11-01，文件编号19820004701与2013入库日期不能替代真实年份。",
      "source": "https://ntrs.nasa.gov/citations/19820004701"
    },
    {
      "id": "iron-chromium-1982",
      "label": "功率与能量分开配置成为明确设计方法",
      "year": "1982",
      "title": "功率与能量分开配置成为明确设计方法",
      "copy": "可溶性铁铬反应不依赖金属沉积；储罐与电堆分别组织能量和功率。流量与再平衡仍是系统条件。",
      "facts": [
        [
          "电堆 / 储罐",
          "功率和能量分开配置 · 可溶性反应体系"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 1982,
      "detail": "NASA-TM-82854解释可溶性反应体系没有活性金属沉积/剥离，电堆与储罐分别承担功率和能量，电解液共用使再平衡可在系统级处理。这是铁铬与锌溴混合液流的重要结构差别。增加储罐并不能消除泵耗或电解液浓差，设计仍需同时校核流量和电堆负载。",
      "source": "https://ntrs.nasa.gov/citations/19820023583"
    },
    {
      "id": "iron-chromium-1983",
      "label": "提高温度、混合反应物与四罐运行",
      "year": "1983",
      "title": "提高温度、混合反应物与四罐运行",
      "copy": "升温改善铬充电动力学，四罐与混合反应物改变系统运行方式。效率收益需要连同热管理评估。",
      "facts": [
        [
          "25→65°C",
          "NASA研究提高温度改善铬动力学"
        ],
        [
          "最多5个百分点",
          "四罐相对双罐初步能效增益"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 1983,
      "detail": "NASA-TM-83087报告将运行温度从25°C提高到65°C来改善铬电极充电动力学；四罐模式的初步测试相对传统双罐能效可提高最多5个百分点，并探索两侧混合铁铬盐以减轻物质迁移影响。注意是“百分点”，不是相对提高5%。代价是热管理、管路和操作复杂性；65°C不是后来所有铁铬电池的统一标准。",
      "source": "https://ntrs.nasa.gov/citations/19830017981"
    },
    {
      "id": "iron-chromium-1985",
      "label": "相同条件下验证小电池与电堆差距",
      "year": "1985",
      "title": "相同条件下验证小电池与电堆差距",
      "copy": "相同温度和SOC范围内，单电池与四节堆出现效率差距。新增电阻损失说明器件放大不是直接复制面积。",
      "facts": [
        [
          "81% / 75%",
          "单电池 / 4节堆Wh效率 · 同一NASA试验"
        ],
        [
          "65°C / 80mA/cm²",
          "5–85%SOC循环 · 1mol/L铁+1mol/L铬"
        ],
        [
          "14.5 / 867cm²",
          "单电池 / 堆电极面积，非现代交流效率"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 1985,
      "detail": "NASA-TM-87034在65°C测试14.5 cm²单电池与4节、867 cm²双极电堆。正负两侧均含1 mol/L铁盐和1 mol/L铬盐的盐酸溶液，采用低选择性阳离子交换膜；在80 mA/cm²、5%～85% SOC循环，极化测试最高140 mA/cm²。报告Wh效率单电池81%、电堆75%，指出放大后的额外电阻型损失。完全放电能够恢复部分循环损失，但不是永久零衰减。",
      "source": "https://ntrs.nasa.gov/citations/19850019076"
    },
    {
      "id": "iron-chromium-2018",
      "label": "IMA铁铬原型研发披露",
      "title": "IMA铁铬原型研发披露",
      "year": "2018",
      "yearNumber": 2018,
      "copy": "IMA Battery官网称2018年完成铁铬液流技术设计、原型制造及运行测试。属于公司自述研发事件，未披露商业工程容量。",
      "facts": [
        [
          "2018",
          "原型设计、制造和运行测试 · 公司自述"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "detail": "IMA Battery官网称2018年完成铁铬液流技术设计、原型制造及运行测试。属于公司自述研发事件，未披露商业工程容量。",
      "source": "https://imabattery.com/about-us"
    },
    {
      "id": "iron-chromium-2023",
      "label": "兆瓦级、6小时工程验证",
      "year": "2023",
      "title": "兆瓦级、6小时工程验证",
      "copy": "霍林河铁铬系统完成建设调试，额定六小时配置。三技术示范的总投资不分摊成铁铬单站成本。",
      "facts": [
        [
          "1MW / 6MWh",
          "霍林河铁铬系统建成调试"
        ],
        [
          "34堆 / 4组罐",
          "与同项目锂电、飞轮系统分别统计"
        ],
        [
          "6h",
          "额定能量与功率之比"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 2023,
      "detail": "国家发改委2023-01-31发布霍林河铁铬系统建成调试消息：1 MW/6 MWh、34台“容和一号”电堆、4组储罐。它与同项目1 MW/2 MWh液冷锂电、1 MW/0.2 MWh飞轮属于三套不同系统；4600余万元是储能部分合计投资，不能除以6 MWh当成铁铬单站造价。额定6小时由6 MWh÷1 MW得出；网页没有提供实测交流往返效率。",
      "source": "https://www.ndrc.gov.cn/fggz/jjyxtj/202301/t20230131_1366080.html"
    },
    {
      "id": "iron-chromium-2024",
      "label": "催化剂研究从“更快”进入副反应权衡",
      "year": "2024",
      "title": "催化剂研究从“更快”进入副反应权衡",
      "copy": "两篇铋研究得到不同副反应表现，催化效果取决于配方和操作条件。效率与析氢需要一同观察。",
      "facts": [
        [
          "85.8%",
          "Bi/N=2改性毡 · 60mA/cm²能量效率"
        ],
        [
          "析氢权衡",
          "另一篇Mans研究条件下Bi促进析氢"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 2024,
      "detail": "Che等在New Carbon Materials报告N掺杂石墨毡固定Bi纳米颗粒；Bi/N比为2时，60 mA/cm²下能量效率85.8%，并研究析氢抑制。另一篇Mans等的开放论文通过开路停留和循环测试发现，在其配方与操作条件下，Bi反而促进氢气产生并损害性能。这不是互相抵消的“记录”，而是说明催化剂效果取决于负载形态、配位、温度、SOC及深放电后的析出/脱附。前篇摘要还给出容量单位mAh/L，该摘要容量单位为mAh/L，保留原文计量单位。",
      "source": "https://www.sciencedirect.com/science/article/pii/S1872580524608371"
    },
    {
      "id": "iron-chromium-2025",
      "label": "梯度电极将催化位点与电流分布匹配",
      "year": "2025",
      "title": "梯度电极将催化位点与电流分布匹配",
      "copy": "梯度电极按电流和传输分布安排催化位点。催化剂朝向与负载空间分布成为新的设计变量。",
      "facts": [
        [
          "梯度Bi/C",
          "催化位点与电流分布共同优化"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "yearNumber": 2025,
      "detail": "《Anisotropy Engineering for Constructing Gradient Electrodes with High-Efficiency Bi/C Catalyst In Situ for Iron-Chromium Flow Battery》用PVP辅助制备Bi/C，并设计梯度电极，研究催化剂较多一面朝向膜时的性能。重点是空间分布与传输的共同优化，不再只比较总负载量。本次核实原始摘要的机制与发表信息，未核实完整测试条件，不添加效率纪录。",
      "source": "https://doi.org/10.1002/adma.202502094"
    },
    {
      "id": "iron-chromium-2026",
      "label": "兰考铁铬离网算电示范投运",
      "title": "兰考铁铬离网算电示范投运",
      "year": "2026",
      "yearNumber": 2026,
      "copy": "国家科技传播中心2026-07-21报道兰考2.5MW/15MWh铁铬液流离网算电协同示范项目投运成功。6h为额定配置比值，政府报道没有提供实测交流往返效率。",
      "facts": [
        [
          "2.5MW / 15MWh",
          "政府2026年项目投运报道"
        ],
        [
          "6h",
          "额定配置时长，非效率"
        ]
      ],
      "subject": "route:iron-chromium:history",
      "detail": "国家科技传播中心2026-07-21报道兰考2.5MW/15MWh铁铬液流离网算电协同示范项目投运成功。6h为额定配置比值，政府报道没有提供实测交流往返效率。",
      "source": "https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html"
    }
  ],
  "materials": [
    {
      "id": "iron-chromium-electrolyte",
      "label": "酸性铁铬氯化物",
      "title": "配位、温度与荷电平衡",
      "copy": "Fe³⁺/Fe²⁺与Cr³⁺/Cr²⁺为两侧可溶性反应。混合铁铬盐可缓和跨膜污染，酸度与SOC仍需共同管理。",
      "facts": [
        [
          "Fe³⁺/Fe²⁺",
          "正极电对"
        ],
        [
          "Cr³⁺/Cr²⁺",
          "负极电对，非六价铬体系"
        ]
      ],
      "subject": "material:iron-chromium-electrolyte",
      "year": "材料"
    },
    {
      "id": "iron-chromium-electrode",
      "label": "碳毡与催化剂",
      "title": "铬动力学与析氢竞争",
      "copy": "碳毡表面和催化剂形态影响铬反应，也改变析氢。铋的作用必须结合具体配方、温度、负载和放电窗口。",
      "facts": [
        [
          "85.8%",
          "Bi/N=2改性毡 · 60mA/cm²能量效率"
        ],
        [
          "析氢权衡",
          "另一篇Mans研究条件下Bi促进析氢"
        ]
      ],
      "subject": "material:iron-chromium-electrode",
      "year": "材料"
    },
    {
      "id": "iron-chromium-membrane",
      "label": "离子交换膜",
      "title": "导电与活性物质阻隔",
      "copy": "降低膜电阻有利电压效率，抑制迁移有利电量保持。腐蚀、成本和混液策略共同决定选型。",
      "facts": [
        [
          "离子交换",
          "维持电中性与隔离活性物质"
        ]
      ],
      "subject": "material:iron-chromium-membrane",
      "year": "材料"
    }
  ],
  "companies": [
    {
      "id": "iron-chromium-cesc",
      "label": "中海储能",
      "year": "2026",
      "title": "兰考离网算电协同示范投运",
      "copy": "政府2026年7月报道兰考铁铬液流项目投运，场景是离网算电协同。项目容量与公司出货量分别记录。",
      "facts": [
        [
          "2.5MW / 15MWh",
          "政府2026-07-21报道投运成功"
        ],
        [
          "6h",
          "额定能量与功率之比"
        ]
      ],
      "subject": "company:iron-chromium-cesc"
    },
    {
      "id": "iron-chromium-imabattery",
      "label": "IMA Battery",
      "year": "2018",
      "title": "铁铬原型设计与运行测试",
      "copy": "美国IMA Battery官网自述2018年完成铁铬液流设计、原型制造和运行测试。该节点属于公司研发披露。",
      "facts": [
        [
          "2018",
          "原型设计、制造与运行测试 · 公司自述"
        ]
      ],
      "subject": "company:iron-chromium-imabattery"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "NASA概念、催化电极与六小时工程",
      "content": "### 1974：NASA提出可充电液流储能框架\n\nLawrence H. Thaller在NASA-TM-X-71540中提出将氧化还原电对泵送经过能量转换部件的储能概念，会议时间为1974年8月26–30日。原始条目强调大容量电力储存及深放电，这是现代液流的系统概念节点；不能把条目中前景判断当成已证实无限循环寿命。铁铬研发归属由NASA机构回顾确认，首篇概念摘要本身不作为铁铬定量性能证据。\n\n### 1981：铬电极成为放大的关键\n\nNASA-TM-82724研究金—铅催化碳毡，电极面积放大到930 cm²，测试析氢、库仑效率、催化剂稳定与电化学活性。清洗方式、碳毡批次及金负载过程均影响表现，说明“便宜电解液”不等于低难度电堆。该报告出版日期是1981-11-01，文件编号19820004701与2013入库日期不能替代真实年份。\n\n### 1982：功率与能量分开配置成为明确设计方法\n\nNASA-TM-82854解释可溶性反应体系没有活性金属沉积/剥离，电堆与储罐分别承担功率和能量，电解液共用使再平衡可在系统级处理。这是铁铬与锌溴混合液流的重要结构差别。增加储罐并不能消除泵耗或电解液浓差，设计仍需同时校核流量和电堆负载。\n\n### 1983：提高温度、混合反应物与四罐运行\n\nNASA-TM-83087报告将运行温度从25°C提高到65°C来改善铬电极充电动力学；四罐模式的初步测试相对传统双罐能效可提高最多5个百分点，并探索两侧混合铁铬盐以减轻物质迁移影响。注意是“百分点”，不是相对提高5%。代价是热管理、管路和操作复杂性；65°C不是后来所有铁铬电池的统一标准。\n\n### 1985：相同条件下验证小电池与电堆差距\n\nNASA-TM-87034在65°C测试14.5 cm²单电池与4节、867 cm²双极电堆。正负两侧均含1 mol/L铁盐和1 mol/L铬盐的盐酸溶液，采用低选择性阳离子交换膜；在80 mA/cm²、5%～85% SOC循环，极化测试最高140 mA/cm²。报告Wh效率单电池81%、电堆75%，指出放大后的额外电阻型损失。完全放电能够恢复部分循环损失，但不是永久零衰减。\n\n### 2018：IMA铁铬原型研发披露\n\nIMA Battery官网称2018年完成铁铬液流技术设计、原型制造及运行测试。属于公司自述研发事件，未披露商业工程容量。\n\n### 2023：兆瓦级、6小时工程验证\n\n国家发改委2023-01-31发布霍林河铁铬系统建成调试消息：1 MW/6 MWh、34台“容和一号”电堆、4组储罐。它与同项目1 MW/2 MWh液冷锂电、1 MW/0.2 MWh飞轮属于三套不同系统；4600余万元是储能部分合计投资，不能除以6 MWh当成铁铬单站造价。额定6小时由6 MWh÷1 MW得出；网页没有提供实测交流往返效率。\n\n### 2024：催化剂研究从“更快”进入副反应权衡\n\nChe等在New Carbon Materials报告N掺杂石墨毡固定Bi纳米颗粒；Bi/N比为2时，60 mA/cm²下能量效率85.8%，并研究析氢抑制。另一篇Mans等的开放论文通过开路停留和循环测试发现，在其配方与操作条件下，Bi反而促进氢气产生并损害性能。这不是互相抵消的“记录”，而是说明催化剂效果取决于负载形态、配位、温度、SOC及深放电后的析出/脱附。前篇摘要还给出容量单位mAh/L，该摘要容量单位为mAh/L，保留原文计量单位。\n\n### 2025：梯度电极将催化位点与电流分布匹配\n\n《Anisotropy Engineering for Constructing Gradient Electrodes with High-Efficiency Bi/C Catalyst In Situ for Iron-Chromium Flow Battery》用PVP辅助制备Bi/C，并设计梯度电极，研究催化剂较多一面朝向膜时的性能。重点是空间分布与传输的共同优化，不再只比较总负载量。本次核实原始摘要的机制与发表信息，未核实完整测试条件，不添加效率纪录。\n\n### 2026：兰考铁铬离网算电示范投运\n\n国家科技传播中心2026-07-21报道兰考2.5MW/15MWh铁铬液流离网算电协同示范项目投运成功。6h为额定配置比值，政府报道没有提供实测交流往返效率。\n\n原始来源 · [NASA原始报告](https://ntrs.nasa.gov/citations/19740013575) · [NASA技术回顾](https://spinoff.nasa.gov/node/10542) · [NASA原始记录](https://ntrs.nasa.gov/citations/19820004701) · [NASA Design Flexibility](https://ntrs.nasa.gov/citations/19820023583) · [NASA原始报告](https://ntrs.nasa.gov/citations/19830017981) · [NASA记录与摘要](https://ntrs.nasa.gov/citations/19850019076) · [国家发改委项目公告](https://www.ndrc.gov.cn/fggz/jjyxtj/202301/t20230131_1366080.html) · [原始论文一](https://www.sciencedirect.com/science/article/pii/S1872580524608371) · [原始论文二](https://advanced.onlinelibrary.wiley.com/doi/10.1002/aesr.202400113) · [10.1002/adma.202502094](https://doi.org/10.1002/adma.202502094) · [PubMed原始摘要索引](https://pubmed.ncbi.nlm.nih.gov/40376865/) · [IMA原型研发](https://imabattery.com/about-us) · [兰考投运政府报道](https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "电解液、电极与膜的耦合设计",
      "content": "|方向|材料与反应|需要解决的具体问题|\n|---|---|---|\n|酸性铁铬氯化物电解液|Fe³⁺/Fe²⁺与Cr³⁺/Cr²⁺；常用盐酸介质|铬的配位状态和反应速度受酸度、温度影响；两侧混合铁铬可缓和跨膜物质污染，但不消除SOC失衡。|\n|碳毡与Bi等催化剂|提供反应面积、改善铬反应动力学|析氢竞争消耗充电电量、改变酸度；Bi是否有利必须回到具体配方、负载、温度和放电窗口判断。|\n|离子交换膜|允许离子迁移维持电中性，隔离活性物质|更低电阻有利电压效率，更强阻隔有利库仑效率；长期腐蚀、价格与电解液混合策略共同决定选型。|\n|再平衡单元与流体/热管理|纠正正负电解液荷电差异，维持温度与流量|副反应会累积失衡，简单补充活性盐无法代替电子/质子平衡；加热改善动力学可能增加整站耗电。|\n\n原始来源 · [NASA Design Flexibility](https://ntrs.nasa.gov/citations/19820023583) · [NASA记录与摘要](https://ntrs.nasa.gov/citations/19850019076) · [原始论文一](https://www.sciencedirect.com/science/article/pii/S1872580524608371) · [原始论文二](https://advanced.onlinelibrary.wiley.com/doi/10.1002/aesr.202400113) · [10.1002/adma.202502094](https://doi.org/10.1002/adma.202502094) · [PubMed原始摘要索引](https://pubmed.ncbi.nlm.nih.gov/40376865/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "同条件比较效率、尺度与副反应",
      "content": "|研究|条件与结论|读者应比较什么|\n|---|---|---|\n|1981 NASA铬电极|最大930 cm²金—铅催化毡|放大一致性、杂质与处理工艺，不只看一片最佳电极。|\n|1983 NASA系统设计|25→65°C；四罐初测最多增加5个百分点能效|动力学收益与热管理、辅机投入之间的交换。|\n|1985 NASA循环|65°C；80 mA/cm²；5–85% SOC；81%单电池/75%堆|同一实验内才可直接比较尺度损失，不能拿75%当现代电站效率。|\n|2024 Bi/N改性毡|60 mA/cm²、85.8%能量效率|实验电极、配方和循环条件下的性能。|\n|2024 Mans铋作用|OCV停留、流动/静置对照与充放电|副反应和化学氧化导致容量损失，加入催化剂不是单向收益。|\n|2025梯度Bi/C|催化剂空间分布匹配各向异性电流|界面反应与传质耦合，不能只看催化剂含量。|\n\n原始来源 · [NASA原始记录](https://ntrs.nasa.gov/citations/19820004701) · [NASA原始报告](https://ntrs.nasa.gov/citations/19830017981) · [NASA记录与摘要](https://ntrs.nasa.gov/citations/19850019076) · [原始论文一](https://www.sciencedirect.com/science/article/pii/S1872580524608371) · [原始论文二](https://advanced.onlinelibrary.wiley.com/doi/10.1002/aesr.202400113) · [10.1002/adma.202502094](https://doi.org/10.1002/adma.202502094) · [PubMed原始摘要索引](https://pubmed.ncbi.nlm.nih.gov/40376865/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "研发方、供应方与项目业主",
      "content": "### 中海储能\n\n中国铁铬液流储能企业中海储能；兰考示范项目有政府来源报道。\n\n上市关系：独立上市主体信息未公开。\n\n国家科技传播中心报道兰考离网算电示范为2.5MW/15MWh铁铬液流系统，并记录2026年投运；这是项目证据，不等于公司规模化出货。\n\n政府2026年7月报道兰考铁铬液流项目投运，场景是离网算电协同。项目容量与公司出货量分别记录。\n\n- **2.5MW / 15MWh** · 政府2026-07-21报道投运成功\n- **6h** · 额定能量与功率之比\n\n原始来源 · [国家科技传播中心项目报道](https://www.ncsti.gov.cn/kjdt/scyq/wlkxc/wldt/202607/t20260721_251616.html)\n\n### IMA Battery\n\n美国Bellevue储能技术研发企业，官网称其开发第二代铁铬复合液流电池。\n\n上市关系：独立上市主体信息未公开。\n\n公司自述2018年完成铁铬液流技术设计、原型制造和运行测试；未在官方来源找到商业项目容量。\n\n美国IMA Battery官网自述2018年完成铁铬液流设计、原型制造和运行测试。该节点属于公司研发披露。\n\n- **2018** · 原型设计、制造与运行测试 · 公司自述\n\n原始来源 · [公司简介](https://imabattery.com/about-us) · [技术路线](https://imabattery.com/technology)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "霍林河示范的实际规模与任务",
      "content": "### 中国：液流商业化技术方向\n\n国家发展改革委、国家能源局2025-09-12发布的发改能源〔2025〕1144号提及液流电池储能进一步商业化，是一般液流技术方向。\n\n### 区域项目与研究目标\n\n霍林河属于源网荷储用多能互补研发示范，提供相同区域环境下比较铁铬、锂电与飞轮的工程机会。它证明兆瓦级系统可以建设和调试，不证明全国铁铬已经形成大份额或价格优势。市场栏可以展示“1 MW/6 MWh示范、34堆、4组罐、2023建成调试”，并解释评价目标是新能源消纳和削峰填谷。当前核实材料不足以给出全国铁铬装机份额、2026新增装机或独立系统成本，故本批不填虚数。\n\n原始来源 · [2025液流商业化政策原文](https://www.ndrc.gov.cn/xwdt/tzgg/202509/t20250912_1400427_ext.html) · [霍林河示范工程原文](https://www.ndrc.gov.cn/fggz/jjyxtj/202301/t20230131_1366080.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "从活性盐到整站循环与维护",
      "content": "### 结构、运行与系统计量\n\n铁铬的吸引力是铁与铬活性盐来源和液流式功率/能量配置，适合有场地的固定式长时、日循环场景。真正的经济比较须把电解液、膜、电极催化、加热、循环泵、再平衡、维护和可用SOC窗口全部纳入。资源便宜不能直接推出每度电便宜。\n\n效率的三个量需要保持清楚：库仑效率比较放出/充入电量；电压效率反映极化损失；能量效率近似两者乘积。实验堆以直流计量所得效率还没有包含全部交流变换与辅机耗电。铬处于二价/三价反应体系，不应将其写成六价铬电池；与此同时，酸性含铬电解液仍需要密闭、泄漏收集和规范回收。这里的材料形态说明服务于真实工程理解，不以“水系”代替运行维护设计。\n\n原始来源 · [NASA记录与摘要](https://ntrs.nasa.gov/citations/19850019076) · [国家发改委项目公告](https://www.ndrc.gov.cn/fggz/jjyxtj/202301/t20230131_1366080.html)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "iron-chromium-policy",
    "label": "示范工程",
    "title": "源网荷储用多能互补示范",
    "copy": "2025中国政策提及液流储能进一步商业化。2023霍林河在同一地区配置铁铬、锂电与飞轮三套系统，用于新能源消纳和削峰填谷评价。三技术储能部分合计投资与铁铬规模分别记录。",
    "facts": [
      [
        "1MW / 6MWh",
        "霍林河铁铬系统建成调试"
      ],
      [
        "34堆 / 4组罐",
        "与同项目锂电、飞轮系统分别统计"
      ],
      [
        "6h",
        "额定能量与功率之比"
      ]
    ],
    "subject": "scene:flow-policy",
    "year": "2025"
  },
  "market": {
    "id": "flow-market",
    "label": "中国新型储能（全部技术）",
    "title": "新型储能的应用背景",
    "copy": "中国全部新型储能统计包含多种技术，作为固定储能背景。铁铬的独立工程规模按已建成、在建和计划逐项记录。",
    "year": "2025",
    "facts": [
      [
        "136GW",
        "2025年底 · 全部新型储能功率"
      ],
      [
        "351GWh",
        "同范围累计容量，非铁铬装机"
      ],
      [
        "2.58h",
        "平均单次配置时长，非年度利用小时"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "iron-chromium-papers",
    "label": "论文",
    "title": "同一试验中的器件放大损失",
    "copy": "NASA在相同电解液、温度和SOC窗口下比较单电池与四节堆。额外电阻损失随规模出现，效率比较因此需要一致的试验条件。",
    "facts": [
      [
        "81% / 75%",
        "单电池 / 4节堆Wh效率 · 同一NASA试验"
      ],
      [
        "65°C / 80mA/cm²",
        "5–85%SOC循环 · 1mol/L铁+1mol/L铬"
      ],
      [
        "14.5 / 867cm²",
        "单电池 / 堆电极面积，非现代交流效率"
      ]
    ],
    "subject": "route:iron-chromium:history",
    "year": "1985"
  },
  "storage": {
    "id": "iron-chromium-storage",
    "label": "储能适配",
    "title": "六小时配置与系统持续运行",
    "copy": "霍林河1MW/6MWh给出真实工程配置；实际交流效率、辅机和维护仍按运行数据评价。铁铬与全铁沉积、铁空气属于不同路线。",
    "facts": [
      [
        "1MW / 6MWh",
        "霍林河铁铬系统建成调试"
      ],
      [
        "34堆 / 4组罐",
        "与同项目锂电、飞轮系统分别统计"
      ],
      [
        "6h",
        "额定能量与功率之比"
      ]
    ],
    "subject": "route:iron-chromium:history",
    "year": "2023"
  },
  "historySubject": "route:iron-chromium:history",
  "note": "10个有来源年份 · NASA研究、原型与工程投运分列"
};

export const zincBromineResearch: ChronicleResearch = {
  "name": "锌溴液流",
  "timeline": [
    {
      "id": "zinc-bromine-1981",
      "label": "8 kWh子模块验证双极结构",
      "year": "1981",
      "title": "8 kWh子模块验证双极结构",
      "copy": "深放电模块验证推动结构从单极转向双极。已测试容量、循环结果与更大设计目标分别记录。",
      "facts": [
        [
          "8kWh",
          "Gould双极子模块测试"
        ],
        [
          ">160次",
          "另一单极8kWh子模块深放电测试"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 1981,
      "detail": "Gould的EPRI-EM-1717于1981年发布，实验期为1978年9月至1979年8月。两台单极8 kWh子模块中，一台完成超过160次深放电自动循环，但电化学效率较差；团队改用双极结构，并制成8 kWh双极子模块测试。80 kWh在该报告中是由10个子模块组成的设计目标，不是报告已交付量。",
      "source": "https://www.osti.gov/biblio/6577207"
    },
    {
      "id": "zinc-bromine-1983",
      "label": "从活性材料转向密封、板形和停机损失",
      "year": "1983",
      "title": "从活性材料转向密封、板形和停机损失",
      "copy": "密封、极板形变与停机残留溴进入工程测试。循环表现依赖堆体结构和溴迁移控制。",
      "facts": [
        [
          "堆体与密封",
          "电极平面度、残留溴与停机损失研究"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 1983,
      "detail": "Exxon工程报告明确讨论电极厚度与支撑控制平面度、正极活化层、停机时残留溴导致的容量损失、密封改进。意义在于确认循环寿命并非只由锌/溴的可逆性决定，还取决于堆体长期形变和溴迁移。资料中的预计工厂成本是历史预测，本批不折算成现代报价。",
      "source": "https://www.osti.gov/biblio/5053938"
    },
    {
      "id": "zinc-bromine-1985",
      "label": "20–30 kWh系统进入多种工况测试",
      "year": "1985",
      "title": "20–30 kWh系统进入多种工况测试",
      "copy": "循环液路的20与30kWh系统进入不同运行模式测试。系统规程成为研发对象。",
      "facts": [
        [
          "20 / 30kWh",
          "历史循环电解液系统测试容量"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 1985,
      "detail": "美国商务部NTIS收录的Exxon测试程序报告说明多套20 kWh和30 kWh循环电解液系统已成功开展不同模式测试。其价值是从单个组件转向系统运行规程；这里是历史系统容量，未给出长期商用寿命或统一效率。",
      "source": "https://ntrl.ntis.gov/NTRL/dashboard/searchResults/titleDetail/DE85016996.xhtml"
    },
    {
      "id": "zinc-bromine-1991",
      "label": "同一论文展示流动与静态两条分支",
      "year": "1991",
      "title": "同一论文展示流动与静态两条分支",
      "copy": "同一论文同时研究流动与静态锌溴，两套结构分别报告效率和循环。沉积电极与循环液路不能省略。",
      "facts": [
        [
          "2kW / 10kWh",
          "流动锌溴电池"
        ],
        [
          "65–70%",
          "上述流动系统往返效率"
        ],
        [
          "25Ah",
          "另组静态单电池 · 100%DOD / >400次 / >75%"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 1991,
      "detail": "Singh与Jonshagen报告2 kW/10 kWh锌溴液流电池，使用碳/PVDF双极电极、循环多溴/水系锌溴电解液，往返效率65%～70%。同一论文另列静态电解液25 Ah单电池，100%放电深度下超过400循环、能量返回效率超过75%。两个结果属于不同结构，不能将静态75%贴给2 kW流动系统。",
      "source": "https://doi.org/10.1016/0378-7753%2891%2980059-7"
    },
    {
      "id": "zinc-bromine-2021",
      "label": "材料成本与环境影响进入同口径比较",
      "year": "2021",
      "title": "材料成本与环境影响进入同口径比较",
      "copy": "生命周期模型把材料成本和环境影响放在同一假设下比较。模型价格层级与交钥匙系统价格分别阅读。",
      "facts": [
        [
          "153美元/kWh",
          "CEC2021模型材料成本，非整站报价"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 2021,
      "detail": "加州能源委员会CEC-500-2021-051比较全钒、全铁和锌溴液流的生命周期生产影响。模型中锌溴材料成本153美元/kWh，而全钒491美元/kWh、全铁196美元/kWh；仅是报告假设下的材料成本，不是交钥匙报价、LCOS或2026市场价格。此节点用于解释资源价格不能单独替代制造、寿命和系统效率评价。",
      "source": "https://www.energy.ca.gov/publications/2021/life-cycle-assessment-environmental-and-human-health-impacts-flow-battery-energy"
    },
    {
      "id": "zinc-bromine-2023",
      "label": "部落微电网获得大型项目资金支持",
      "year": "2023",
      "title": "部落微电网获得大型项目资金支持",
      "copy": "部落光储项目获得资金支持并形成供货计划。资金、订单、交付与投运属于不同工程阶段。",
      "facts": [
        [
          "20MWh",
          "CEC支持的供货计划，非已投运规模"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 2023,
      "detail": "Redflow于2023-06-01原始公告称CEC批准支持Paskenta部落太阳能与储能项目，计划使用20 MWh锌溴系统。这是项目资金与供货计划节点，不作为已投运20 MWh计算。厂商2024年2月向CEC提交的意见仍把该项目称为未来12–18个月交付的firm order，同时明确当时最大长期连续运行系统是Rialto Anaergia的2 MWh。",
      "source": "https://www.globenewswire.com/news-release/2023/06/01/2680355/0/en/Redflow-to-supply-transformative-20-MWh-flow-battery-system-for-project-in-California.html"
    },
    {
      "id": "zinc-bromine-2024",
      "label": "示范用途细化，材料研究继续处理溴络合",
      "year": "2024",
      "title": "示范用途细化，材料研究继续处理溴络合",
      "copy": "关键负载需求与额定项目配置分别定义。分子添加剂研究另按2025勘误修正的单位与图示阅读。",
      "facts": [
        [
          "1.5MW / 6.6MWh",
          "Barona拟示范项目 · 2024报告"
        ],
        [
          "100kW / 24h",
          "关键负载支持要求，非1.5MW放电24h"
        ],
        [
          "Ah/L",
          "2025勘误修订2024论文容量轴单位"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 2024,
      "detail": "CEC 2023年度报告（2024发布）将Barona拟示范规模列为1.5 MW/6.6 MWh，另规定至少100 kW关键负载支撑24小时。6.6 MWh÷1.5 MW为4.4小时额定比值，关键负载24小时不能改写成“1.5 MW持续24小时”。同年Nature论文研究软—硬两性离子添加剂，目标是同时保持多卤阴离子的络合与水相相容性；2025勘误修正图1电荷正负及容量轴由mAh/L改为Ah/L。量纲必须按修订版本引用。",
      "source": "https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf"
    },
    {
      "id": "zinc-bromine-2025",
      "label": "Redflow退市与历史供应链状态",
      "year": "2025",
      "title": "Redflow退市与历史供应链状态",
      "copy": "ASX公告记录Redflow2025年退市及清算出售进度。2MWh运行陈述与20MWh供货计划只作为历史资料。",
      "facts": [
        [
          "2025-08-28",
          "收市后除牌 · ASX原始公告"
        ],
        [
          "2MWh / 20MWh",
          "2024历史运行陈述 / 供货计划，分开统计"
        ]
      ],
      "subject": "company:zinc-bromine-redflow-history",
      "yearNumber": 2025,
      "detail": "ASX公告记录Redflow2025年退市及清算出售进度。2MWh运行陈述与20MWh供货计划只作为历史资料。 2025-08-28收市后除牌，退市后不作为当前供应商，也不填当前市值。",
      "source": "https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025"
    },
    {
      "id": "zinc-bromine-2026",
      "label": "低温设计从防冻转向动态配方与传输",
      "year": "2026",
      "title": "低温设计从防冻转向动态配方与传输",
      "copy": "支持盐配方同时处理SOC变化、盐析和传输。室温长循环、室温高倍率与低温组保持各自条件。",
      "facts": [
        [
          ">2300次",
          "室温 · 40mA/cm² / 40mAh/cm²"
        ],
        [
          ">3300h",
          "室温 · 充200 / 放80mA/cm²"
        ],
        [
          ">1600次",
          "−20°C · 40mA/cm²独立试验组"
        ]
      ],
      "subject": "route:zinc-bromine:history",
      "yearNumber": 2026,
      "detail": "4月16日Nature Communications论文研究NH₄⁺支持电解质：充电时ZnBr₂浓度下降，原有KCl支持盐可能先析出；更换阳离子需兼顾防相变和离子扩散。论文分别报告：室温40 mA/cm²、40 mAh/cm²下超过2300循环；室温充电200/放电80 mA/cm²下超过3300小时；−20°C、40 mA/cm²下超过1600循环。三组条件必须分行，不写成“−20°C、200 mA/cm²循环2300次”。",
      "source": "https://doi.org/10.1038/s41467-026-71846-6"
    }
  ],
  "materials": [
    {
      "id": "zinc-bromine-zinc",
      "label": "锌沉积电极",
      "title": "混合液流的沉积与剥离",
      "copy": "负极Zn²⁺还原为金属锌，沉积面积和厚度参与决定能量。流量及局部电流分布影响枝晶、死锌与残留锌。",
      "facts": [
        [
          "Zn²⁺ / Zn",
          "金属沉积反应 · 混合液流，非全可溶性体系"
        ]
      ],
      "subject": "material:zinc-bromine-zinc",
      "year": "材料"
    },
    {
      "id": "zinc-bromine-bromine",
      "label": "溴正极与络合剂",
      "title": "游离溴、络合与水相行为",
      "copy": "络合降低游离溴迁移，过强络合、相分离或低温凝固又会影响流动和反应。2024软硬两性离子研究按修订版本读取。",
      "facts": [
        [
          "Br⁻ / Br₂",
          "正极反应与多溴络合"
        ],
        [
          "Ah/L",
          "2025勘误修订容量轴，非原mAh/L"
        ]
      ],
      "subject": "material:zinc-bromine-bromine",
      "year": "材料"
    },
    {
      "id": "zinc-bromine-electrolyte",
      "label": "ZnBr₂与支持盐",
      "title": "浓度随SOC改变的动态配方",
      "copy": "2026 NH₄⁺配方处理充电过程中ZnBr₂减少与支持盐先析出的问题。防相变、溶剂化和扩散共同决定低温表现。",
      "facts": [
        [
          ">2300次",
          "室温 · 40mA/cm² / 40mAh/cm²"
        ],
        [
          ">3300h",
          "室温 · 充200 / 放80mA/cm²"
        ],
        [
          ">1600次",
          "−20°C · 40mA/cm²独立试验组"
        ]
      ],
      "subject": "material:zinc-bromine-electrolyte",
      "year": "材料"
    },
    {
      "id": "zinc-bromine-membrane",
      "label": "隔膜与耐溴密封",
      "title": "选择性与循环回路相容",
      "copy": "隔膜电阻、溴阻隔、密封与停机规程共同决定自放电、维护和系统效率。",
      "facts": [
        [
          "耐溴 / 阻隔",
          "对应隔膜、密封与循环液路材料"
        ]
      ],
      "subject": "material:zinc-bromine-membrane",
      "year": "材料"
    }
  ],
  "companies": [
    {
      "id": "zinc-bromine-junan",
      "label": "湖北君安储能",
      "year": "产品",
      "title": "模块化锌溴液流规格",
      "copy": "公司公开锌溴液流系统产品资料，并披露研发及制造组织。产品页功率与容量属于企业规格。",
      "facts": [
        [
          "250kW / 1000kWh",
          "现行产品规格 · 非第三方验收"
        ],
        [
          "100余人",
          "公司自报研发团队规模"
        ]
      ],
      "subject": "company:zinc-bromine-junan"
    },
    {
      "id": "zinc-bromine-redflow-history",
      "label": "Redflow（历史）",
      "year": "2025",
      "title": "退市及历史项目归档",
      "copy": "ASX公告记录Redflow2025年退市及清算出售进度。2MWh运行陈述与20MWh供货计划只作为历史资料。",
      "facts": [
        [
          "2025-08-28",
          "收市后除牌 · ASX原始公告"
        ],
        [
          "2MWh / 20MWh",
          "2024历史运行陈述 / 供货计划，分开统计"
        ]
      ],
      "subject": "company:zinc-bromine-redflow-history"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "沉积型液流的模块与工程发展",
      "content": "### 1970年代：现代工程路线开始成形\n\nDOE/Sandia储能手册追溯Exxon与Gould从1970年代中期开展锌溴研发；双极电堆、两侧循环电解液、外部多溴络合物储存成为工程路线。此处用“1970年代”背景，不凭二手说法挑一个绝对发明年。相比全可溶性液流，锌沉积从开始就使电极形貌与储能量相互关联。来源：Sandia/EPRI手册第9章。\n\n### 1981：8 kWh子模块验证双极结构\n\nGould的EPRI-EM-1717于1981年发布，实验期为1978年9月至1979年8月。两台单极8 kWh子模块中，一台完成超过160次深放电自动循环，但电化学效率较差；团队改用双极结构，并制成8 kWh双极子模块测试。80 kWh在该报告中是由10个子模块组成的设计目标，不是报告已交付量。\n\n### 1983：从活性材料转向密封、板形和停机损失\n\nExxon工程报告明确讨论电极厚度与支撑控制平面度、正极活化层、停机时残留溴导致的容量损失、密封改进。意义在于确认循环寿命并非只由锌/溴的可逆性决定，还取决于堆体长期形变和溴迁移。资料中的预计工厂成本是历史预测，本批不折算成现代报价。\n\n### 1985：20–30 kWh系统进入多种工况测试\n\n美国商务部NTIS收录的Exxon测试程序报告说明多套20 kWh和30 kWh循环电解液系统已成功开展不同模式测试。其价值是从单个组件转向系统运行规程；这里是历史系统容量，未给出长期商用寿命或统一效率。\n\n### 1991：同一论文展示流动与静态两条分支\n\nSingh与Jonshagen报告2 kW/10 kWh锌溴液流电池，使用碳/PVDF双极电极、循环多溴/水系锌溴电解液，往返效率65%～70%。同一论文另列静态电解液25 Ah单电池，100%放电深度下超过400循环、能量返回效率超过75%。两个结果属于不同结构，不能将静态75%贴给2 kW流动系统。\n\n### 2021：材料成本与环境影响进入同口径比较\n\n加州能源委员会CEC-500-2021-051比较全钒、全铁和锌溴液流的生命周期生产影响。模型中锌溴材料成本153美元/kWh，而全钒491美元/kWh、全铁196美元/kWh；仅是报告假设下的材料成本，不是交钥匙报价、LCOS或2026市场价格。此节点用于解释资源价格不能单独替代制造、寿命和系统效率评价。\n\n### 2023：部落微电网获得大型项目资金支持\n\nRedflow于2023-06-01原始公告称CEC批准支持Paskenta部落太阳能与储能项目，计划使用20 MWh锌溴系统。这是项目资金与供货计划节点，不作为已投运20 MWh计算。厂商2024年2月向CEC提交的意见仍把该项目称为未来12–18个月交付的firm order，同时明确当时最大长期连续运行系统是Rialto Anaergia的2 MWh。\n\n### 2024：示范用途细化，材料研究继续处理溴络合\n\nCEC 2023年度报告（2024发布）将Barona拟示范规模列为1.5 MW/6.6 MWh，另规定至少100 kW关键负载支撑24小时。6.6 MWh÷1.5 MW为4.4小时额定比值，关键负载24小时不能改写成“1.5 MW持续24小时”。同年Nature论文研究软—硬两性离子添加剂，目标是同时保持多卤阴离子的络合与水相相容性；2025勘误修正图1电荷正负及容量轴由mAh/L改为Ah/L。量纲必须按修订版本引用。\n\n### 2025：Redflow退市与历史供应链状态\n\nASX公告记录Redflow2025年退市及清算出售进度。2MWh运行陈述与20MWh供货计划只作为历史资料。 2025-08-28收市后除牌，退市后不作为当前供应商，也不填当前市值。\n\n### 2026：低温设计从防冻转向动态配方与传输\n\n4月16日Nature Communications论文研究NH₄⁺支持电解质：充电时ZnBr₂浓度下降，原有KCl支持盐可能先析出；更换阳离子需兼顾防相变和离子扩散。论文分别报告：室温40 mA/cm²、40 mAh/cm²下超过2300循环；室温充电200/放电80 mA/cm²下超过3300小时；−20°C、40 mA/cm²下超过1600循环。三组条件必须分行，不写成“−20°C、200 mA/cm²循环2300次”。\n\n原始来源 · [Sandia/EPRI手册第9章](https://sandia.gov/ess-ssl/publications/ESHB%201001834%20reduced%20size.pdf) · [DOE OSTI原始报告摘要](https://www.osti.gov/biblio/6577207) · [DOE OSTI会议原始记录](https://www.osti.gov/biblio/5053938) · [NTIS原始技术报告记录DE85016996](https://ntrl.ntis.gov/NTRL/dashboard/searchResults/titleDetail/DE85016996.xhtml) · [10.1016/0378-7753(91)80059-7](https://doi.org/10.1016/0378-7753%2891%2980059-7) · [作者机构摘要](https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Zinc-bromine-battery-for-energy-storage/991005542544307891) · [CEC报告与摘要](https://www.energy.ca.gov/publications/2021/life-cycle-assessment-environmental-and-human-health-impacts-flow-battery-energy) · [厂商原始公告](https://www.globenewswire.com/news-release/2023/06/01/2680355/0/en/Redflow-to-supply-transformative-20-MWh-flow-battery-system-for-project-in-California.html) · [CEC正式收件](https://efiling.energy.ca.gov/GetDocument.aspx?tn=254309) · [CEC年度报告p49附近](https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf) · [2024原论文](https://www.nature.com/articles/s41586-024-08079-4) · [2025勘误](https://www.nature.com/articles/s41586-025-09145-1) · [10.1038/s41467-026-71846-6](https://doi.org/10.1038/s41467-026-71846-6) · [ASX退市公告](https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "锌沉积、溴络合与隔膜密封",
      "content": "|方向|作用|机制与边界|\n|---|---|---|\n|锌沉积电极与双极板|承载Zn²⁺/Zn沉积、剥离|局部电流和流量不均会促使枝晶、死锌或残留锌；能量受可容纳沉积量影响，不能只增大罐体无限延时。|\n|溴正极及络合剂|Br⁻/Br₂氧化还原，多溴络合|减少游离溴、抑制跨膜自放电；络合太强或相分离/低温凝固又影响反应和流动。|\n|ZnBr₂与支持盐|提供活性离子与电导|SOC改变时溶液组分浓度在变；2026 NH₄⁺设计同时处理盐析、溶剂化与动力学，不能只测未充电电解液冰点。|\n|隔膜、密封与循环回路|限制溴迁移并维持流量|隔膜电阻与选择性、耐溴材料和停机程序共同影响自放电、维护及系统效率。|\n\n原始来源 · [DOE OSTI会议原始记录](https://www.osti.gov/biblio/5053938) · [10.1016/0378-7753(91)80059-7](https://doi.org/10.1016/0378-7753%2891%2980059-7) · [作者机构摘要](https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Zinc-bromine-battery-for-energy-storage/991005542544307891) · [CEC年度报告p49附近](https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf) · [2024原论文](https://www.nature.com/articles/s41586-024-08079-4) · [2025勘误](https://www.nature.com/articles/s41586-025-09145-1) · [10.1038/s41467-026-71846-6](https://doi.org/10.1038/s41467-026-71846-6)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "室温与低温试验分别拆解",
      "content": "|研究|数据|不能混用的条件|\n|---|---|---|\n|Gould报告，1981|8 kWh模块；>160次深放电|80 kWh是设计目标，非已完成实验。|\n|Singh/Jonshagen，1991|流动2 kW/10 kWh，65%–70%往返效率|25 Ah静态单电池>75%是另一个结构。|\n|软硬两性离子，Nature 2024|用分子结构同时调节络合和水相行为|2025勘误更正图示极性和Ah/L单位；不照抄早期图。|\n|NH₄⁺配方，Nature Communications 2026|40 mA/cm²、40 mAh/cm²、>2300循环（室温）|不是电站年限试验，不是−20°C组。|\n|同一2026论文低温组|−20°C、40 mA/cm²、>1600循环|高倍率200/80 mA/cm²属于室温独立组。|\n\n原始来源 · [DOE OSTI原始报告摘要](https://www.osti.gov/biblio/6577207) · [10.1016/0378-7753(91)80059-7](https://doi.org/10.1016/0378-7753%2891%2980059-7) · [作者机构摘要](https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Zinc-bromine-battery-for-energy-storage/991005542544307891) · [CEC年度报告p49附近](https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf) · [2024原论文](https://www.nature.com/articles/s41586-024-08079-4) · [2025勘误](https://www.nature.com/articles/s41586-025-09145-1) · [10.1038/s41467-026-71846-6](https://doi.org/10.1038/s41467-026-71846-6)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "历史工程链与当前企业状态",
      "content": "### 湖北君安储能\n\n中国武汉湖北君安储能专注锌溴液流储能系统。\n\n上市关系：独立上市主体信息未公开。\n\n公司自述研发团队100余人、技术开发超过10年，并有研发检测组装基地及制造基地；产品页列250kW/1000kWh大规模系统规格，未视作第三方验收结果。\n\n公司公开锌溴液流系统产品资料，并披露研发及制造组织。产品页功率与容量属于企业规格。\n\n- **250kW / 1000kWh** · 现行产品规格 · 非第三方验收\n- **100余人** · 公司自报研发团队规模\n\n原始来源 · [公司简介和研发规模](https://en.junanes.com/about/) · [250kW/1000kWh规格](https://en.junanes.com/product/zinc-bromine-flow-battery-large-scale-energy-storage-system/)\n\n### Redflow（历史）\n\n澳大利亚锌溴液流企业Redflow的历史档案。\n\n上市关系：原ASX:RFX；2025-08-28收市后除牌，2025-08-29退市。\n\nASX 2025公告索引包含清算和出售进度；退市后不应展示为在营企业或填入当前市值。\n\nASX公告记录Redflow2025年退市及清算出售进度。2MWh运行陈述与20MWh供货计划只作为历史资料。\n\n- **2025-08-28** · 收市后除牌 · ASX原始公告\n- **2MWh / 20MWh** · 2024历史运行陈述 / 供货计划，分开统计\n\n原始来源 · [ASX公司公告与除牌说明](https://www.asx.com.au/asx/v2/statistics/announcements.do?asxCode=RFX&by=asxCode&timeframe=Y&year=2025)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "社区韧性、资助与交付阶段",
      "content": "### 中国：液流商业化技术方向\n\n国家发展改革委、国家能源局2025-09-12发布的发改能源〔2025〕1144号提及液流电池储能进一步商业化，是一般液流技术方向。\n\n### 区域项目与研究目标\n\nCEC案例显示需求围绕部落社区韧性、光伏协同和关键负载供电，而非仅靠峰谷套利。2023资金计划、2024订单与后续实际建成之间必须保留状态差异；本批仅2 MWh有厂商正式提交的长期运行陈述，不把20 MWh订单或6.6 MWh推荐资助规模叠加成已投运量。CEC生命周期比较提供材料与环境影响研究背景，不能当供应商报价排名。\n\n原始来源 · [2025液流商业化政策原文](https://www.ndrc.gov.cn/xwdt/tzgg/202509/t20250912_1400427_ext.html) · [CEC正式收件](https://efiling.energy.ca.gov/GetDocument.aspx?tn=254309) · [CEC年度报告p49附近](https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "混合液流的时长与再生操作",
      "content": "### 结构、运行与系统计量\n\n锌溴适合对体积、温度和循环频率有明确约束的固定式应用研究，包括偏远通信、微电网、光储与关键负载备用。相比纯液流，金属锌在堆内沉积意味着功率与能量只能部分解耦，扩大时长往往还需要增加沉积面积、厚度或模块数量。\n\n工程说明应直接解释一次完整循环：充电沉积锌并生成络合溴，放电锌溶解、溴还原；残留锌的清除与再生操作因产品而异，会影响持续可用性。读者比较系统时应关注可用容量、规定再生周期、待机自放电、泵耗、泄漏监测和温区，不将不燃电解液等同于没有腐蚀或维护要求。负载降低确实可以延长备用时间，但需同时给出负载功率，不能只把最长小时数标在额定功率旁。\n\n原始来源 · [10.1016/0378-7753(91)80059-7](https://doi.org/10.1016/0378-7753%2891%2980059-7) · [作者机构摘要](https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Zinc-bromine-battery-for-energy-storage/991005542544307891) · [CEC年度报告p49附近](https://www.energy.ca.gov/sites/default/files/2024-04/CEC-500-2024-028.pdf) · [2024原论文](https://www.nature.com/articles/s41586-024-08079-4) · [2025勘误](https://www.nature.com/articles/s41586-025-09145-1)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "zinc-bromine-policy",
    "label": "社区示范",
    "title": "CEC资助与关键负载要求",
    "copy": "2025中国政策提及液流储能进一步商业化。2024报告中的Barona拟示范项目把额定规模与关键负载支持时间分别规定。Paskenta20MWh属于获得支持的计划，交付与投运另行归档。",
    "facts": [
      [
        "1.5MW / 6.6MWh",
        "Barona拟示范项目 · 2024报告"
      ],
      [
        "100kW / 24h",
        "关键负载支持要求，非1.5MW放电24h"
      ]
    ],
    "subject": "scene:flow-policy",
    "year": "2025"
  },
  "market": {
    "id": "flow-market",
    "label": "中国新型储能（全部技术）",
    "title": "新型储能的应用背景",
    "copy": "中国全部新型储能统计是应用背景，非锌溴行业装机统计。流动、静态锌溴与其他锌基技术分别记录。",
    "year": "2025",
    "facts": [
      [
        "136GW",
        "2025年底 · 全部新型储能功率"
      ],
      [
        "351GWh",
        "同范围累计容量，非锌溴装机"
      ],
      [
        "2.58h",
        "平均单次配置时长，非年度利用小时"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "zinc-bromine-papers",
    "label": "论文",
    "title": "SOC变化下的支持盐与低温传输",
    "copy": "2026论文分别测试室温长循环、室温高倍率和−20°C组。各组的电流、面容量与运行时间在数据旁独立列出。",
    "facts": [
      [
        ">2300次",
        "室温 · 40mA/cm² / 40mAh/cm²"
      ],
      [
        ">3300h",
        "室温 · 充200 / 放80mA/cm²"
      ],
      [
        ">1600次",
        "−20°C · 40mA/cm²独立试验组"
      ]
    ],
    "subject": "material:zinc-bromine-electrolyte",
    "year": "2026"
  },
  "storage": {
    "id": "zinc-bromine-storage",
    "label": "储能适配",
    "title": "额定容量与关键负载时长",
    "copy": "锌沉积使功率和能量仅部分解耦，扩展时长还要匹配电极和模块。备用时间必须与负载功率一起给出。",
    "facts": [
      [
        "1.5MW / 6.6MWh",
        "Barona拟示范规模 · 4.4h额定比值"
      ],
      [
        "100kW / 24h",
        "同报告关键负载支持要求，非满额输出"
      ]
    ],
    "subject": "route:zinc-bromine:history",
    "year": "2024"
  },
  "historySubject": "route:zinc-bromine:history",
  "note": "9个确年节点与1970年代背景 · 公司存续状态独立归档"
};

export const organicResearch: ChronicleResearch = {
  "name": "有机液流",
  "timeline": [
    {
      "id": "organic-2011",
      "label": "非水全有机电对的早期确证论文",
      "year": "2011",
      "title": "非水全有机电对的早期确证论文",
      "copy": "TEMPO与另一有机活性分子组成非水全有机电对，提供可追溯的早期论文节点。研究年代与商业化阶段分别记录。",
      "facts": [
        [
          "TEMPO / N-甲基邻苯二甲酰亚胺",
          "非水全有机电对 · 原论文书目"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2011,
      "detail": "Li等《Electrochemical Properties of an All-Organic Redox Flow Battery Using 2,2,6,6-Tetramethyl-1-Piperidinyloxy and N-Methylphthalimide》把TEMPO与N-甲基邻苯二甲酰亚胺组成全有机电对。这是可追溯的非水全有机电对早期论文；书目来源为日本科学技术振兴机构索引。DOI：10.1149/2.012112esl；JST书目。",
      "source": "https://doi.org/10.1149/2.012112esl"
    },
    {
      "id": "organic-2014",
      "label": "AQDS把水系有机分子带入高功率液流研究",
      "year": "2014",
      "title": "AQDS把水系有机分子带入高功率液流研究",
      "copy": "醌分子的结构设计进入水系高功率研究。正极溴为无机物，这套体系属于混合液流。",
      "facts": [
        [
          ">0.6W/cm²",
          "峰值功率密度 · 1.3A/cm²"
        ],
        [
          "AQDS / 溴",
          "有机—无机混合，非全有机"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2014,
      "detail": "Huskinson等在Nature报告AQDS/溴体系：AQDS在硫酸中进行两电子、两质子反应，负极醌/氢醌配对正极Br₂/Br⁻，在1.3 A/cm²时峰值放电功率密度超过0.6 W/cm²。价值是用可设计有机分子代替一侧金属活性物质；“无金属”不等于“全有机”，正极溴仍是无机物。峰值功率也不等于持续高效率工况。DOI：10.1038/nature12909，2014-01-08在线。",
      "source": "https://www.nature.com/articles/nature12909"
    },
    {
      "id": "organic-2015",
      "label": "聚合物活性物质配合尺寸筛分",
      "year": "2015",
      "title": "聚合物活性物质配合尺寸筛分",
      "copy": "大分子由透析膜尺寸筛分保留，小离子承担电荷补偿。分子量、黏度与有效电子浓度需要共同设计。",
      "facts": [
        [
          "聚合物 / 透析膜",
          "尺寸筛分与小离子电荷补偿"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2015,
      "detail": "Janoschka等在Nature提出水系聚合物液流，使用有机聚合物储能材料、氯化钠水溶液及透析膜。较大活性聚合物由尺寸排阻保留，小离子通过膜完成电荷补偿，膜选型不必完全沿袭酸性金属液流。新问题是分子量、黏度、有效电子浓度和泵送传输的权衡。DOI：10.1038/nature15746，2015-10-21在线。",
      "source": "https://www.nature.com/articles/nature15746"
    },
    {
      "id": "organic-2016",
      "label": "MV/TEMPO全有机水系原型",
      "year": "2016",
      "title": "MV/TEMPO全有机水系原型",
      "copy": "紫精与TEMPO组成双侧有机水系原型。库仑效率、运行电流和容量循环分别列出。",
      "facts": [
        [
          "1.25V",
          "MV / 4-HO-TEMPO全有机水系"
        ],
        [
          "20–100mA/cm²",
          "原型运行电流密度范围"
        ],
        [
          "100次 / 近100%",
          "容量稳定循环 / 库仑效率，非能量效率"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2016,
      "detail": "PNNL采用甲基紫精MV负极、4-HO-TEMPO正极和NaCl支持电解质，电压1.25 V；在20～100 mA/cm²范围运行，报告100循环稳定容量、接近100%库仑效率。不能改成近100%能量效率。论文期刊年份2016；2015已有机构传播，不重复算独立发明。DOI：10.1002/aenm.201501449；PNNL原始摘要。",
      "source": "https://www.pnnl.gov/publications/total-organic-aqueous-redox-flow-battery-employing-low-cost-and-sustainable-methyl"
    },
    {
      "id": "organic-2018",
      "label": "日历衰减约束分子设计",
      "year": "2018",
      "title": "日历衰减约束分子设计",
      "copy": "分子寿命成为设计指标，日历衰减与循环衰减分别观察。改性醌搭配铁氰化物，仍属于混合体系。",
      "facts": [
        [
          "DBEAQ / 铁氰化物",
          "有机—无机混合研究"
        ],
        [
          "约4天 / 880次",
          "其中一组低浓度pH14 · E-620(K)膜测试"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2018,
      "detail": "Harvard改性醌研究把目标从能否循环移到分子能存在多久。机构报告实验衰减低于0.01%/天、低于0.001%/循环，并将低于3%/年明确作为外推。作者稿给出2,6-DBEAQ与铁氰化物组成的电池，因此不是全有机。低浓度pH14、E-620(K)膜约4天/880循环，是其中一项测试，不能与其他条件合成数十年实测。来源：Harvard说明、作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》。",
      "source": "https://seas.harvard.edu/news/organic-mega-flow-battery-transcends-lifetime-voltage-thresholds"
    },
    {
      "id": "organic-2021",
      "label": "可逆酮/醇转换扩展分子空间",
      "year": "2021",
      "title": "可逆酮/醇转换扩展分子空间",
      "copy": "芴酮结构调整使可逆酮与醇转换进入液流储能化学。溶解性、稳定性及对侧电对仍需匹配。",
      "facts": [
        [
          "室温可逆酮 / 醇",
          "芴酮分子工程 · 无需催化剂的研究体系"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2021,
      "detail": "PNNL在Science报告通过芴酮分子工程，使室温下无需催化剂即可实现液流所需的可逆酮加氢/醇脱氢。意义是把原先不常用的有机反应纳入可逆储能化学；仍需水溶性、分子稳定与适配正极共同成立。DOI：10.1126/science.abd9795；PNNL原始摘要。",
      "source": "https://www.pnnl.gov/publications/reversible-ketone-hydrogenation-and-dehydrogenation-aqueous-organic-redox-flow"
    },
    {
      "id": "organic-2022",
      "label": "分子再生与千瓦堆分别推进",
      "year": "2022",
      "title": "分子再生与千瓦堆分别推进",
      "copy": "分子再生与千瓦堆放大同年推进。V-MB电堆数据与70°C加速稳定测试保持独立条件。",
      "facts": [
        [
          "10节 × 1000cm²",
          "DICP V-MB有机—钒混合电堆"
        ],
        [
          ">1kW / 32天",
          "该电堆放电与稳定循环记录"
        ],
        [
          "70°C",
          "另组加速稳定试验，非32天堆温度"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2022,
      "detail": "Nature Chemistry研究用原位NMR/EPR确认DHAQ分解产物DHA/DHAL，通过分步电化学氧化重新生成DHAQ并调整两侧SOC：寿命策略开始包括再生维护。同年DICP亚甲基蓝MB体系组装10节、每节1000 cm²堆，放电超过1 kW，容量稳定循环32天。机构图注明确V-MB，属于有机—钒混合；70°C是另做加速稳定性评估，不是32天电堆运行温度。来源：Nature Chemistry、DICP堆研究，后者DOI 10.1039/D2EE03051A（2022在线、2023卷期）。",
      "source": "https://www.nature.com/articles/s41557-022-00967-4"
    },
    {
      "id": "organic-2023",
      "label": "均相催化把连续实验延长到一年以上",
      "year": "2023",
      "title": "均相催化把连续实验延长到一年以上",
      "copy": "催化添加剂延长连续实验，停机原因来自管路。工程试点计划另按功率、时长及交付阶段记录。",
      "facts": [
        [
          "连续超过一年",
          "芴酮 / β-环糊精实验，因塑料管失效停止"
        ],
        [
          "提高60%",
          "峰值功率对照增幅，非能量效率"
        ],
        [
          "5MW / 10h",
          "SRP SolidFlow试点计划，非已投运"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2023,
      "detail": "PNNL在芴酮体系加入β-环糊精，帮助醇氧化/中间自由基再生，机构报道峰值功率对照提高60%，连续充放电超过一年，最终因塑料管失效停止。60%不是能量效率；β-环糊精是催化添加剂，不是全部储能燃料。DOI：10.1016/j.joule.2023.06.013；PNNL说明。工程侧SRP/CMBlu宣布Desert Blume试点5 MW、10小时，按额定乘积为50 MWh；属计划项目，本批未证实投运。联合公告。",
      "source": "https://doi.org/10.1016/j.joule.2023.06.013"
    },
    {
      "id": "organic-2024",
      "label": "空气稳定性与工业用能场景",
      "year": "2024",
      "title": "空气稳定性与工业用能场景",
      "copy": "正极空气稳定性研究处理氧气暴露下的失活。工业订单提供需求信号，实际投运另需工程记录。",
      "facts": [
        [
          ">600次 / >20天",
          "特定萘衍生物正极 · 连续鼓空气"
        ],
        [
          "11MWh",
          "奔驰SolidFlow订单 · 公告计划2025下半年实施"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2024,
      "detail": "DICP萘衍生物正极在正极电解液连续鼓空气条件下仍循环600圈以上、超过20天。解决接触氧气后失活的运维问题，不代表所有有机分子无需惰性保护。DOI：10.1038/s41893-024-01415-6；机构说明。3月奔驰订购11 MWh SolidFlow，2024公告预计2025下半年实施，本批没有据此认定已竣工。订单公告。 Quino2024-06-20公告称10kW/100kWh水系有机醌原型启用。MW级试点进度属于另一阶段，不把计划容量计为已投运。",
      "source": "https://www.nature.com/articles/s41893-024-01415-6"
    },
    {
      "id": "organic-2025",
      "label": "正极稳定性出现可解释设计指标",
      "year": "2025",
      "title": "正极稳定性出现可解释设计指标",
      "copy": "分子电荷与副反应自由能关系成为正极设计依据。每循环和每时间衰减指标保留各自单位。",
      "facts": [
        [
          "约12Ah/L",
          "TPP-TEMPO / BTMAP-Vi全有机 · 非Wh/L"
        ],
        [
          "0.0018%/循环",
          "摘要衰减结果 · 电流温度等工况见原文"
        ],
        [
          "0.0067%/小时",
          "同论文时间衰减，非年度寿命实测"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2025,
      "detail": "1月2日Nature Communications通过Hirshfeld电荷与副反应自由能关联设计TPP-TEMPO；与BTMAP-Vi组成全有机电池。摘要报告约12 Ah/L容量密度，衰减0.0018%/循环或0.0067%/小时。Ah/L不是Wh/L；两种衰减表示依赖本文循环频率。该组数值为论文摘要结果，电流与温度条件见原文。DOI：10.1038/s41467-024-55244-4。DOI含2024但发表为2025。",
      "source": "https://www.nature.com/articles/s41467-024-55244-4"
    },
    {
      "id": "organic-2026",
      "label": "框架协议与技术验收分别理解",
      "year": "2026",
      "title": "框架协议与技术验收分别理解",
      "copy": "条件框架与一套现场验收属于不同规模的商业事件。潜在供应、批次调用和实际部署分开归档。",
      "facts": [
        [
          "至少5GWh",
          "Uniper有条件框架 · 至2037，非部署量"
        ],
        [
          "至少100MWh / 批",
          "2027起调用条件，非当前交付"
        ],
        [
          "一套SAT验收",
          "公司披露先前系统，非5GWh全部验收"
        ]
      ],
      "subject": "route:organic:history",
      "yearNumber": 2026,
      "detail": "CMBlu于2月3日发布与Uniper在1月20日签署的有条件协议：至少5 GWh长期框架，期限至2037年，2027年起可按至少100 MWh一批调用。公司同时称此前一套系统完成SAT现场验收；不能把一套验收写成5 GWh已部署。该节点代表商业导入与潜在供应规模，仍需订单与实际运行资料。厂商原始公告。",
      "source": "https://www.cmblu.com/press-media/cmblu-energy-and-uniper-sign-long-term-framework-agreement-for-5-gwh-of-solidflow-large-scale-battery-storage"
    }
  ],
  "materials": [
    {
      "id": "organic-quinone",
      "label": "醌、芴酮与萘小分子",
      "title": "分子结构、溶解性与分解通路",
      "copy": "取代基改变电位、溶解性和稳定性；对侧有机或无机电对决定完整体系的分类。合成、纯化与再生也进入成本评价。",
      "facts": [
        [
          "AQDS / 溴",
          "2014酸性有机—无机混合"
        ],
        [
          "DBEAQ / 铁氰化物",
          "2018碱性混合研究"
        ]
      ],
      "subject": "material:organic-quinone",
      "year": "材料"
    },
    {
      "id": "organic-viologen-tempo",
      "label": "紫精—TEMPO全有机电对",
      "title": "双侧有机分子的独立稳定问题",
      "copy": "还原态氧敏感、正极副反应与膜渗透分别影响循环。MV/TEMPO和TPP-TEMPO/BTMAP-Vi按不同论文工况比较。",
      "facts": [
        [
          "1.25V",
          "MV / 4-HO-TEMPO全有机水系"
        ],
        [
          "20–100mA/cm²",
          "原型运行电流密度范围"
        ],
        [
          "100次 / 近100%",
          "容量稳定循环 / 库仑效率，非能量效率"
        ]
      ],
      "subject": "material:organic-viologen-tempo",
      "year": "材料"
    },
    {
      "id": "organic-carbon",
      "label": "碳电极与流动界面",
      "title": "电解液在碳电极表面交换电子",
      "copy": "2014 AQDS/溴实验电池采用碳电极。电極提供反应界面，流量与电流密度共同影响活性物质的供给；论文功率属于完整实验电池表现。",
      "facts": [
        [
          ">0.6W/cm²",
          "AQDS/溴实验全电池峰值 · 1.3A/cm²"
        ],
        [
          "碳电极",
          "2014论文摘要明确的组成 · 非材料本征功率"
        ]
      ],
      "subject": "material:organic-carbon",
      "year": "材料"
    },
    {
      "id": "organic-polymer-membrane",
      "label": "可溶性聚合物与透析膜",
      "title": "用尺寸筛分保留活性分子",
      "copy": "2015聚合物液流由大分子承担储能，小离子通过透析膜补偿电荷。黏度、传质和非活性骨架共同构成材料代价。",
      "facts": [
        [
          "尺寸排阻",
          "聚合物储能与透析膜 · 非固态锂电聚合物电解质"
        ]
      ],
      "subject": "material:organic-polymer-membrane",
      "year": "材料"
    },
    {
      "id": "organic-solidflow",
      "label": "Organic SolidFlow",
      "title": "固体储能材料与水系流动介质",
      "copy": "CMBlu说明能量以固体形态存储，由水系流动系统收集和激活。其结构独立于全部活性物质溶解的双罐模型。",
      "facts": [
        [
          "10kW / 100kWh",
          "公司现行模块规格，非独立系统实测"
        ],
        [
          "固体 + 水系流动",
          "材料形态说明，不推断固体如何移动"
        ]
      ],
      "subject": "material:organic-solidflow",
      "year": "材料"
    }
  ],
  "companies": [
    {
      "id": "organic-quino",
      "label": "Quino Energy",
      "year": "2024",
      "title": "水系醌100kWh试点启用",
      "copy": "公司2024年6月宣布水系有机醌原型启用，活性材料溶于电解液。后续MW级试点进度按计划与实际运行分列。",
      "facts": [
        [
          "10kW / 100kWh",
          "公司2024-06-20试点启用公告"
        ]
      ],
      "subject": "company:organic-quino"
    },
    {
      "id": "organic-cmblu",
      "label": "CMBlu",
      "year": "2026",
      "title": "固体介质、制造与条件框架",
      "copy": "CMBlu把Organic SolidFlow、模块制造、融资与供货框架分别披露。私人融资估值与公开股票市值属于不同对象。",
      "facts": [
        [
          "€50m",
          "2026-04-30 Series C首关融资"
        ],
        [
          ">€1bn",
          "同轮私人融资估值，非市值"
        ],
        [
          "至少5GWh",
          "Uniper有条件框架，非已交付"
        ]
      ],
      "subject": "company:organic-cmblu"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "有机分子、再生与产业导入",
      "content": "### 2011：非水全有机电对的早期确证论文\n\nLi等《Electrochemical Properties of an All-Organic Redox Flow Battery Using 2,2,6,6-Tetramethyl-1-Piperidinyloxy and N-Methylphthalimide》把TEMPO与N-甲基邻苯二甲酰亚胺组成全有机电对。这是可追溯的非水全有机电对早期论文；书目来源为日本科学技术振兴机构索引。DOI：10.1149/2.012112esl；JST书目。\n\n### 2014：AQDS把水系有机分子带入高功率液流研究\n\nHuskinson等在Nature报告AQDS/溴体系：AQDS在硫酸中进行两电子、两质子反应，负极醌/氢醌配对正极Br₂/Br⁻，在1.3 A/cm²时峰值放电功率密度超过0.6 W/cm²。价值是用可设计有机分子代替一侧金属活性物质；“无金属”不等于“全有机”，正极溴仍是无机物。峰值功率也不等于持续高效率工况。DOI：10.1038/nature12909，2014-01-08在线。\n\n### 2015：聚合物活性物质配合尺寸筛分\n\nJanoschka等在Nature提出水系聚合物液流，使用有机聚合物储能材料、氯化钠水溶液及透析膜。较大活性聚合物由尺寸排阻保留，小离子通过膜完成电荷补偿，膜选型不必完全沿袭酸性金属液流。新问题是分子量、黏度、有效电子浓度和泵送传输的权衡。DOI：10.1038/nature15746，2015-10-21在线。\n\n### 2016：MV/TEMPO全有机水系原型\n\nPNNL采用甲基紫精MV负极、4-HO-TEMPO正极和NaCl支持电解质，电压1.25 V；在20～100 mA/cm²范围运行，报告100循环稳定容量、接近100%库仑效率。不能改成近100%能量效率。论文期刊年份2016；2015已有机构传播，不重复算独立发明。DOI：10.1002/aenm.201501449；PNNL原始摘要。\n\n### 2018：日历衰减约束分子设计\n\nHarvard改性醌研究把目标从能否循环移到分子能存在多久。机构报告实验衰减低于0.01%/天、低于0.001%/循环，并将低于3%/年明确作为外推。作者稿给出2,6-DBEAQ与铁氰化物组成的电池，因此不是全有机。低浓度pH14、E-620(K)膜约4天/880循环，是其中一项测试，不能与其他条件合成数十年实测。来源：Harvard说明、作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》。\n\n### 2021：可逆酮/醇转换扩展分子空间\n\nPNNL在Science报告通过芴酮分子工程，使室温下无需催化剂即可实现液流所需的可逆酮加氢/醇脱氢。意义是把原先不常用的有机反应纳入可逆储能化学；仍需水溶性、分子稳定与适配正极共同成立。DOI：10.1126/science.abd9795；PNNL原始摘要。\n\n### 2022：分子再生与千瓦堆分别推进\n\nNature Chemistry研究用原位NMR/EPR确认DHAQ分解产物DHA/DHAL，通过分步电化学氧化重新生成DHAQ并调整两侧SOC：寿命策略开始包括再生维护。同年DICP亚甲基蓝MB体系组装10节、每节1000 cm²堆，放电超过1 kW，容量稳定循环32天。机构图注明确V-MB，属于有机—钒混合；70°C是另做加速稳定性评估，不是32天电堆运行温度。来源：Nature Chemistry、DICP堆研究，后者DOI 10.1039/D2EE03051A（2022在线、2023卷期）。\n\n### 2023：均相催化把连续实验延长到一年以上\n\nPNNL在芴酮体系加入β-环糊精，帮助醇氧化/中间自由基再生，机构报道峰值功率对照提高60%，连续充放电超过一年，最终因塑料管失效停止。60%不是能量效率；β-环糊精是催化添加剂，不是全部储能燃料。DOI：10.1016/j.joule.2023.06.013；PNNL说明。工程侧SRP/CMBlu宣布Desert Blume试点5 MW、10小时，按额定乘积为50 MWh；属计划项目，本批未证实投运。联合公告。\n\n### 2024：空气稳定性与工业用能场景\n\nDICP萘衍生物正极在正极电解液连续鼓空气条件下仍循环600圈以上、超过20天。解决接触氧气后失活的运维问题，不代表所有有机分子无需惰性保护。DOI：10.1038/s41893-024-01415-6；机构说明。3月奔驰订购11 MWh SolidFlow，2024公告预计2025下半年实施，本批没有据此认定已竣工。订单公告。 Quino2024-06-20公告称10kW/100kWh水系有机醌原型启用。MW级试点进度属于另一阶段，不把计划容量计为已投运。\n\n### 2025：正极稳定性出现可解释设计指标\n\n1月2日Nature Communications通过Hirshfeld电荷与副反应自由能关联设计TPP-TEMPO；与BTMAP-Vi组成全有机电池。摘要报告约12 Ah/L容量密度，衰减0.0018%/循环或0.0067%/小时。Ah/L不是Wh/L；两种衰减表示依赖本文循环频率。该组数值为论文摘要结果，电流与温度条件见原文。DOI：10.1038/s41467-024-55244-4。DOI含2024但发表为2025。\n\n### 2026：框架协议与技术验收分别理解\n\nCMBlu于2月3日发布与Uniper在1月20日签署的有条件协议：至少5 GWh长期框架，期限至2037年，2027年起可按至少100 MWh一批调用。公司同时称此前一套系统完成SAT现场验收；不能把一套验收写成5 GWh已部署。该节点代表商业导入与潜在供应规模，仍需订单与实际运行资料。厂商原始公告。\n\n原始来源 · [10.1149/2.012112esl](https://doi.org/10.1149/2.012112esl) · [JST书目](https://jglobal.jst.go.jp/en/public/201202286574072571) · [10.1038/nature12909](https://www.nature.com/articles/nature12909) · [10.1038/nature15746](https://www.nature.com/articles/nature15746) · [PNNL原始摘要](https://www.pnnl.gov/publications/total-organic-aqueous-redox-flow-battery-employing-low-cost-and-sustainable-methyl) · [Harvard说明](https://seas.harvard.edu/news/organic-mega-flow-battery-transcends-lifetime-voltage-thresholds) · [作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》](https://aziz.seas.harvard.edu/resource/mja280pdf) · [PNNL原始摘要](https://www.pnnl.gov/publications/reversible-ketone-hydrogenation-and-dehydrogenation-aqueous-organic-redox-flow) · [Nature Chemistry](https://www.nature.com/articles/s41557-022-00967-4) · [DICP堆研究](https://energystorage.dicp.ac.cn/info/1133/5787.htm) · [10.1016/j.joule.2023.06.013](https://doi.org/10.1016/j.joule.2023.06.013) · [PNNL说明](https://www.pnnl.gov/news-media/next-generation-flow-battery-design-sets-records) · [联合公告](https://www.globenewswire.com/news-release/2023/08/31/2735489/0/en/Salt-River-Project-and-CMBlu-Energy-Announce-Launch-of-Innovative-Long-Duration-Energy-Storage-Project.html) · [10.1038/s41893-024-01415-6](https://www.nature.com/articles/s41893-024-01415-6) · [机构说明](https://www.dicp.cas.cn/xwdt/kyjz/202408/t20240827_7321976.html) · [订单公告](https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy) · [10.1038/s41467-024-55244-4](https://www.nature.com/articles/s41467-024-55244-4) · [厂商原始公告](https://www.cmblu.com/press-media/cmblu-energy-and-uniper-sign-long-term-framework-agreement-for-5-gwh-of-solidflow-large-scale-battery-storage) · [Quino原型启用](https://quinoenergy.com/quino-energy-announces-100kwh-pilot-and-plans-for-global-expansion/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "全有机、混合电对与SolidFlow介质",
      "content": "|方向|典型研究|机制及取舍|\n|---|---|---|\n|醌/芴酮/萘小分子|AQDS、DHAQ、DBEAQ、芴酮、空气稳定萘衍生物|取代基调整电位、水溶性和分解通路；增溶可能增加合成成本或降低单位质量电子数。对侧可能是无机物。|\n|紫精—TEMPO全有机电对|MV/4-HO-TEMPO、BTMAP-Vi/TPP-TEMPO|双侧活性物质均有机；还原态空气敏感、正极副反应和膜渗透各需解决。有机不等于无毒。|\n|可溶性氧化还原聚合物|2015聚合物+透析膜|尺寸筛分减少跨膜，代价是黏度、传质和非活性骨架；与固态锂电聚合物电解质不同。|\n|Organic SolidFlow|CMBlu固体储能材料+水系流动介质|官方说明能量以固体形态储存，通过水系流动系统收集和激活；不画成全部活性物质溶解的双罐模型，不归入全固态锂金属。|\n\n### 模块规格与计量边界\n\nCMBlu现行官网模块披露10 kW、100 kWh、75% efficiency、最长20年寿命。是2026-10-03所见产品资料，缺少效率测试边界，不能写“交流实测75%”或“已运行20年”；低至5美分/kWh LCOS也不是所有已投项目财务结果。厂商技术页。\n\n原始来源 · [10.1038/nature12909](https://www.nature.com/articles/nature12909) · [10.1038/nature15746](https://www.nature.com/articles/nature15746) · [PNNL原始摘要](https://www.pnnl.gov/publications/total-organic-aqueous-redox-flow-battery-employing-low-cost-and-sustainable-methyl) · [Harvard说明](https://seas.harvard.edu/news/organic-mega-flow-battery-transcends-lifetime-voltage-thresholds) · [作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》](https://aziz.seas.harvard.edu/resource/mja280pdf) · [10.1038/s41893-024-01415-6](https://www.nature.com/articles/s41893-024-01415-6) · [机构说明](https://www.dicp.cas.cn/xwdt/kyjz/202408/t20240827_7321976.html) · [订单公告](https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy) · [厂商技术页](https://www.cmblu.com/battery-system)\n\n### 碳电极与流动界面\n\n2014 AQDS/溴原始论文摘要明确采用碳电极。电极表面承担电子交换，流动电解液输送活性物质；电极界面和流路供给需要一起匹配。**峰值放电功率密度>0.6W/cm²**对应1.3A/cm²下的实验全电池结果，包含电解液、膜与电极的共同作用。\n\n2022 V-MB研究扩展至10节、每节1000cm²的电池构成，报告>1kW连续运行32天。面积放大带来流量分配和欧姆损失问题，这里的1000cm²是论文披露的电池尺度。\n\n原始来源 · [2014 Nature AQDS/溴](https://www.nature.com/articles/nature12909) · [2022 V-MB千瓦堆](https://energystorage.dicp.ac.cn/info/1133/5787.htm)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "分子寿命与器件工况的原始数据",
      "content": "|论文|确定数据|体系/条件|\n|---|---|---|\n|2014 Nature|>0.6 W/cm² @1.3 A/cm²|AQDS/溴，酸性、有机—无机混合，峰值点。|\n|2016 AEM|1.25 V；20–100 mA/cm²；100循环、近100%库仑效率|MV/4-HO-TEMPO全有机水系，非近100%能效。|\n|2018 Joule|机构报告<0.01%/天、<0.001%/循环|改性醌/铁氰化物；年度寿命是外推。|\n|2022在线EES|10节×1000 cm²；>1 kW；32天|V-MB混合；70°C加速测试另组。|\n|2023 Joule|连续一年以上、峰值功率对照提高60%|芴酮与β-环糊精添加剂，非整站寿命。|\n|2024 Nature Sustainability|正极连续鼓空气，>600循环、>20天|特定空气稳定性测试。|\n|2025 Nature Communications|~12 Ah/L；0.0018%/循环、0.0067%/小时|摘要结果；比较前须读电流、温度、浓度和计量体积。|\n\n原始来源 · [10.1038/nature12909](https://www.nature.com/articles/nature12909) · [PNNL原始摘要](https://www.pnnl.gov/publications/total-organic-aqueous-redox-flow-battery-employing-low-cost-and-sustainable-methyl) · [Harvard说明](https://seas.harvard.edu/news/organic-mega-flow-battery-transcends-lifetime-voltage-thresholds) · [作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》](https://aziz.seas.harvard.edu/resource/mja280pdf) · [Nature Chemistry](https://www.nature.com/articles/s41557-022-00967-4) · [DICP堆研究](https://energystorage.dicp.ac.cn/info/1133/5787.htm) · [10.1016/j.joule.2023.06.013](https://doi.org/10.1016/j.joule.2023.06.013) · [PNNL说明](https://www.pnnl.gov/news-media/next-generation-flow-battery-design-sets-records) · [10.1038/s41893-024-01415-6](https://www.nature.com/articles/s41893-024-01415-6) · [机构说明](https://www.dicp.cas.cn/xwdt/kyjz/202408/t20240827_7321976.html) · [10.1038/s41467-024-55244-4](https://www.nature.com/articles/s41467-024-55244-4)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "小分子与固体介质的不同转化线",
      "content": "### Quino Energy\n\n美国创业公司，开发水系有机醌液流电池；醌活性物质溶解在水系电解液中。\n\n上市关系：独立上市主体信息未公开。\n\n公司2024-06-20称10kW/100kWh原型已启用，采用连续制造蒽醌活性材料；公司另称正进行MW级试点，不把规划示范项目列为已投运。\n\n公司2024年6月宣布水系有机醌原型启用，活性材料溶于电解液。后续MW级试点进度按计划与实际运行分列。\n\n- **10kW / 100kWh** · 公司2024-06-20试点启用公告\n\n原始来源 · [100kWh试点公告](https://quinoenergy.com/quino-energy-announces-100kwh-pilot-and-plans-for-global-expansion/) · [公司技术与MW级试点招聘页](https://quinoenergy.com/battery-engineer/)\n\n### CMBlu\n\n德国Organic SolidFlow开发企业，采用固体储能材料与水系流动系统。\n\n上市关系：独立上市主体信息未公开。\n\n2026-04-30公司披露Series C首关€50m、融资估值超过€1bn（不是公开市值）、员工250+且科学工程人员150+；Uniper 5GWh为框架协议，不代表交付。官网称德国Alzenau工厂当前产能1GWh、最大4GWh；美国工厂计划2029投产、希腊项目建设中并计划2027投产。2024年Mercedes 11MWh订单原计划H2 2025实现，订单稿本身不证明后续已投运。\n\nCMBlu把Organic SolidFlow、模块制造、融资与供货框架分别披露。私人融资估值与公开股票市值属于不同对象。\n\n- **€50m** · 2026-04-30 Series C首关融资\n- **>€1bn** · 同轮私人融资估值，非市值\n- **至少5GWh** · Uniper有条件框架，非已交付\n\n原始来源 · [2026 Series C、融资估值与员工规模](https://www.cmblu.com/press-media/cmblu-surpasses-eu1b-unicorn-threshold-with-eu50m-initial-close-of-series-c-defining-baseload-infrastructure-for-ai-and-data-centers) · [制造基地与产能](https://www.cmblu.com/manufacturing) · [系统概述](https://www.cmblu.com/battery-system) · [Mercedes订单](https://www.cmblu.com/press-media/mercedes-benz-orders-first-sustainable-solidflow-energy-storage-system-by-cmblu-energy)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "研发目标、需求合同与实际交付",
      "content": "### 中国：液流商业化技术方向\n\n国家发展改革委、国家能源局2025-09-12发布的发改能源〔2025〕1144号提及液流电池储能进一步商业化，是一般液流技术方向。\n\n### 区域项目与研究目标\n\nDOE于2021年设立Long Duration Storage Shot，目标到2030年使10小时及以上储能成本下降90%；2022启动SI2030，2023发布技术路径评估，2024综合报告梳理降本。它是技术中性研发目标，不是有机液流已降本90%。DOE SI2030、2024正式报告。\n\n市场信号分层显示：论文证明分子机制，千瓦堆证明放大，兆瓦时合同证明需求，现场验收及长期运行证明交付。2026的5 GWh框架有产业意义，但不是已装机数据。本批没有四路线统一统计口径，不填全球份额。\n\n原始来源 · [2025液流商业化政策原文](https://www.ndrc.gov.cn/xwdt/tzgg/202509/t20250912_1400427_ext.html) · [DOE SI2030](https://www.energy.gov/oe/storage-innovations-2030) · [2024正式报告](https://www.energy.gov/sites/default/files/2024-08/Achieving%20the%20Promise%20of%20Low-Cost%20Long%20Duration%20Energy%20Storage_FINAL_08052024.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "合成、日历衰减与系统计量",
      "content": "### 结构、运行与系统计量\n\n分子的优势是结构可设计、原料体系可多样化，不等于天然低价：合成步骤、收率、纯化、稳定剂和批次一致性决定电解液成本。停放与频繁循环的衰减可能由不同机制主导，需同时报告每循环与每时间衰减，说明SOC、氧气暴露和温度。\n\n固定式长时储能研究应回答：材料能保留多久，能否再生，膜与辅机是否经济，大面积电极和真实流量下是否维持性能。水系纯液流主要用罐容扩能量；SolidFlow额外考虑固液传递与模块结构。论文Wh/L常按电解液或单侧活性材料计量，不能与包含泵、罐、通道、机柜的系统Wh/L直接排名。\n\n原始来源 · [Harvard说明](https://seas.harvard.edu/news/organic-mega-flow-battery-transcends-lifetime-voltage-thresholds) · [作者原稿《Alkaline Quinone Flow Battery with Long Lifetime》](https://aziz.seas.harvard.edu/resource/mja280pdf) · [Nature Chemistry](https://www.nature.com/articles/s41557-022-00967-4) · [DICP堆研究](https://energystorage.dicp.ac.cn/info/1133/5787.htm) · [厂商技术页](https://www.cmblu.com/battery-system)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "organic-policy",
    "label": "长时储能研发",
    "title": "技术中性的DOE长时降本目标",
    "copy": "2025中国政策提及液流储能进一步商业化。DOE2021设立的Long Duration Storage Shot面向10小时及以上储能提出2030研发目标。SI2030技术路径报告用于理解机制与降本方向，不当作有机路线已完成成果。",
    "facts": [
      [
        "2030 / 降90%",
        "DOE2021长时储能成本目标，非已实现"
      ],
      [
        "≥10h",
        "项目研发目标范围，非全部液流现有时长"
      ]
    ],
    "subject": "scene:flow-policy",
    "year": "2025"
  },
  "market": {
    "id": "flow-market",
    "label": "中国新型储能（全部技术）",
    "title": "新型储能的应用背景",
    "copy": "中国全部新型储能统计包含多种技术，提供应用背景。有机路线需求按论文、原型、合同、验收和长期运行分层记录。",
    "year": "2025",
    "facts": [
      [
        "136GW",
        "2025年底 · 全部新型储能功率"
      ],
      [
        "351GWh",
        "同范围累计容量，非有机液流装机"
      ],
      [
        "2.58h",
        "平均单次配置时长，非年度利用小时"
      ]
    ],
    "subject": "scene:market"
  },
  "papers": {
    "id": "organic-papers",
    "label": "论文",
    "title": "全有机水系的电量与电压表现",
    "copy": "2016 MV/TEMPO原型给出运行电流、容量循环与库仑效率。近100%电量效率不换算为近100%能量效率。",
    "facts": [
      [
        "1.25V",
        "MV / 4-HO-TEMPO全有机水系"
      ],
      [
        "20–100mA/cm²",
        "原型运行电流密度范围"
      ],
      [
        "100次 / 近100%",
        "容量稳定循环 / 库仑效率，非能量效率"
      ]
    ],
    "subject": "material:organic-viologen-tempo",
    "year": "2016"
  },
  "storage": {
    "id": "organic-storage",
    "label": "储能适配",
    "title": "分子寿命、再生与系统结构",
    "copy": "有机分子的可设计性与材料多样性需要连同合成、纯化、日历衰减和辅机评价。罐容、模块与固液传递按实际结构定义。",
    "facts": [
      [
        "每循环 / 每时间",
        "两类衰减需同时记录SOC、氧气与温度"
      ],
      [
        "固液结构",
        "SolidFlow额外评价材料界面与模块"
      ]
    ],
    "subject": "route:organic:history",
    "year": "应用"
  },
  "historySubject": "route:organic:history",
  "note": "11个有来源年份 · 全有机/混合/SolidFlow独立归档"
};
