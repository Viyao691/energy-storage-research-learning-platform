import type { ChronicleResearch } from "./researchRoutes";

export const gasHydrogenResearch: ChronicleResearch = {
  "name": "高压气态储氢",
  "timeline": [
    {
      "id": "hydrogen-gas-1972",
      "yearNumber": 1972,
      "year": "1972",
      "label": "工业氢进入地下盐穴",
      "title": "工业氢进入地下盐穴",
      "copy": "Teesside盐穴服务工业氢供需缓冲。地下空间扩大库存，工作气、井筒与地质共同决定设计。",
      "facts": [
        [
          "1972",
          "英国政府报告记载Teesside工业储氢启用"
        ]
      ],
      "detail": "气态储氢不只依靠单个压力瓶，也可以利用地下空间扩大库存。 英国政府发布的 Bay Hydrogen Hub 可行性报告记载 Teesside 盐穴储氢设施于1972年启用。其历史作用是服务工业氢供需缓冲，不是当时已经建成可再生电力往返储能电站。地下盐穴与地面复合罐都保存气态氢，但围岩约束、井筒、垫底气与有效工作气决定不同的设计边界。",
      "source": "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1161490/iha-22-edf-final-feasibility-report.pdf",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2002",
      "yearNumber": 2002,
      "year": "2002",
      "label": "35MPa复合罐进入车辆使用",
      "title": "35MPa复合罐进入车辆使用",
      "copy": "Toyota FCHV在日本和美国有限投放。聚合物内衬、碳纤维缠绕和整车供氢系统共同接受道路应用。",
      "facts": [
        [
          "四个Type IV罐 / 约35MPa",
          "2002年有限销售/租赁车型资料"
        ]
      ],
      "detail": "复合罐开始在实际车辆上承受反复加注与道路环境。 丰田于2002年12月在日本和美国有限销售/租赁 FCHV；其官方应急资料记载四个 Type IV 储罐，采用聚合物内衬和碳纤维缠绕，最高约35 MPa。改变的是从单个罐体性能转向整车阀门、密封和供氢系统的协同，有限投放不等于当年普及。",
      "source": "https://techinfo.toyota.com/techInfoPortal/staticcontent/en/techinfo/html/prelogin/docs/fchverg.pdf",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2005",
      "yearNumber": 2005,
      "year": "2005",
      "label": "内衬与70MPa罐体共同优化",
      "title": "内衬与70MPa罐体共同优化",
      "copy": "丰田同时改进内衬、缠绕结构与压力设计。罐体外形、材料占用和渗透影响可储氢量。",
      "facts": [
        [
          "35 / 70MPa",
          "2005年自研罐技术发布"
        ],
        [
          "增加约10%储量",
          "35MPa罐相同外形与前代比较"
        ]
      ],
      "detail": "增加储氢量需要同时解决轻量化、强度与渗透。 丰田2005-05-16发布自研35和70 MPa罐技术，采用尼龙系树脂内衬与碳纤维全缠绕；35 MPa罐在相同外形尺寸下比前代增加约10%储氢量，70 MPa罐于当年1月获得相关认证。提高压力并非唯一改进，减少内衬占用体积同样影响储量；这两项比较属于各自的车型/罐体设计，不能视为压力翻倍就使气体密度严格翻倍。",
      "source": "https://global.toyota/jp/detail/1500575",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2010",
      "yearNumber": 2010,
      "year": "2010",
      "label": "整套系统质量与氢疲劳分开评价",
      "title": "整套系统质量与氢疲劳分开评价",
      "copy": "Argonne按相同可用氢量比较350/700bar设计。Sandia另测钢材在氢环境的裂纹扩展。",
      "facts": [
        [
          "可用5.6kg H₂",
          "两设计相同可用氢量"
        ],
        [
          "5.5 / 4.2wt%",
          "350/700bar含附属设备系统质量比"
        ],
        [
          "17.6 / 26.3kg H₂/m³",
          "相同顺序的系统体积储氢密度，工程评估"
        ]
      ],
      "detail": "罐内氢密度与整套系统储氢能力开始分开衡量。 DOE/Argonne 的 ANL-10/24 比较可用氢量同为5.6 kg的350/700 bar方案，系统质量储氢比为5.5/4.2 wt%，体积储氢密度为17.6/26.3 kg H₂/m³。这是报告给定设计与成本假设下的工程评估，不是所有当代产品通用规格。700 bar提升体积利用率，却可能增加增强层和附件质量。\n\n同年Sandia在45 MPa氢气中测量4130X钢疲劳裂纹扩展，发现加载频率、应力比改变结果。设计因此不能只用空气中的强度或一次爆破压力代表长期服役。",
      "source": "https://www.energy.gov/eere/fuelcells/articles/technical-assessment-compressed-hydrogen-storage-tank-systems-automotive",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "Lincoln Composites高压容器资格测试",
      "title": "Lincoln Composites高压容器资格测试",
      "copy": "DOE年度审查记载3,600 psi压力容器完成多项安全资格测试。",
      "facts": [
        [
          "3,600 psi",
          "2011年压力容器资格测试"
        ],
        [
          "约8,500 L",
          "2012年开发设计水容积"
        ]
      ],
      "detail": "DOE年度审查记载3,600 psi压力容器完成多项安全资格测试；该页照片是历史研发设备，不能据此推断当前量产或电站部署。\n\n完成静水爆破、压力循环、泄漏先兆破坏、环境、缺陷容限等资格测试。 DOE后续报告中的约8,500 L是设计容积指标，不是氢气质量或电站储能量。",
      "source": "https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/review11/pd021_baldwin_2011_o.pdf",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "车辆储氢形成国际性能要求",
      "title": "车辆储氢形成国际性能要求",
      "copy": "UN GTR No.13协调车辆储氢和燃料系统安全性能。储罐与整车一同进入评价。",
      "facts": [
        [
          "UN GTR No.13",
          "2013-06-27建立，车辆性能范围"
        ]
      ],
      "detail": "储罐、供氢系统与整车共同进入标准评价。 UN GTR No.13于2013-06-27建立，规定氢燃料车辆安全性能要求，覆盖车载储氢和燃料系统等。它代表跨地区技术要求协调，不是对某一特定罐型的商业背书，也不是今天所有地区法规完全相同。",
      "source": "https://unece.org/transport/press/unece-adopts-global-technical-regulation-safety-hydrogen-and-fuel-cell-vehicles",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2014",
      "yearNumber": 2014,
      "year": "2014",
      "label": "Mirai采用70MPa双复合罐",
      "title": "Mirai采用70MPa双复合罐",
      "copy": "Mirai罐体服从量产车空间和重量约束。质量比以氢质量相对罐质量计量。",
      "facts": [
        [
          "70MPa / 122.4L",
          "两罐合计内部容积"
        ],
        [
          "5.7wt%",
          "储存氢质量/罐质量，丰田发布脚注"
        ]
      ],
      "detail": "储氢系统开始服从量产车的空间与重量约束。 丰田Mirai采用两个70 MPa罐，内部容积合计122.4 L；发布口径为5.7 wt%，脚注明确是储存氢质量相对于罐质量的比值。该分母不同于DOE的包含附属部件系统质量，不能直接画成同口径领先对比。相同压力下，加注后的温度和气体质量仍会随初始状态与加注协议变化。",
      "source": "https://global.toyota/en/newsroom/toyota/22740159.html",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "衬里岩洞连接连续炼铁用氢",
      "title": "衬里岩洞连接连续炼铁用氢",
      "copy": "HYBRIT在Luleå运行地下衬里岩洞试验。衬里气密与围岩承载配合，库存解耦制氢和用氢时序。",
      "facts": [
        [
          "100m³ / 250bar",
          "HYBRIT衬里岩洞，地表下约30m"
        ]
      ],
      "detail": "HYBRIT把储氢与连续炼铁用氢需求连接起来。 瑞典Luleå试验设施于2022年夏后运行，容积100 m³，位于地表下约30 m，氢压达到250 bar（25 MPa）。地下衬里承担气密，围岩结构参与承载；这是衬里岩洞，不能标作天然盐穴。储氢允许电解槽根据电力条件调节，而工业还原过程保持用氢。",
      "source": "https://www.hybritdevelopment.se/hybrit-milstolpe-nadd-pilotanlaggningen-for-vatgaslagring-i-drift/",
      "subject": "route:hydrogen-gas:history"
    },
    {
      "id": "hydrogen-gas-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "地下试验给出运行与调度证据",
      "title": "地下试验给出运行与调度证据",
      "copy": "HYBRIT公布间歇储氢测试与调度模型。工业制氢可根据电力市场条件调整，而连续工艺保持用氢。",
      "facts": [
        [
          "约3800h",
          "自2022年以来间歇试验累计运行"
        ],
        [
          "可变成本降25—40%",
          "未来电力情景经济模拟，非储氢效率"
        ]
      ],
      "detail": "储氢的价值从“装得下”扩展到“何时制氢更经济”。 SSAB于2025-02-27发布HYBRIT结果，报告自2022年以来进行间歇测试，累计运行约3800 h；针对未来电力市场情景的模拟显示，工业制氢可变运行成本可能降低25–40%。成本降低来自生产与用氢时序解耦，不是罐体效率；试验延长至2026是继续测试计划，不等于大规模商业设施已投运。\n\n30MPa氢气管束批量出货与松原储氢装备交付。2025年第二代30MPa高压氢气管束集装箱批量出货。 松原项目交付15台氢气球罐与8套压缩机缓冲罐。 集团2025年营收为人民币263.26亿元，不能视作氢业务收入。",
      "source": "https://www.ssab.com/en/news/2025/02/hybrit-largescale-storage-of-fossilfree-hydrogen-gas-successfully-proven",
      "subject": "route:hydrogen-gas:history"
    }
  ],
  "materials": [
    {
      "id": "hydrogen-gas-liner",
      "label": "金属与聚合物内衬",
      "title": "金属与聚合物内衬",
      "year": "部件",
      "copy": "内衬提供气密边界，金属与聚合物分别考虑氢疲劳和渗透。阀口连接还包含金属与密封界面。",
      "facts": [
        [
          "Type I—IV",
          "全金属、环向缠绕、金属/非金属内衬全缠绕各自结构"
        ]
      ],
      "subject": "material:hydrogen-gas-liner"
    },
    {
      "id": "hydrogen-gas-fiber",
      "label": "碳纤维复合增强层",
      "title": "碳纤维复合增强层",
      "year": "部件",
      "copy": "纤维与树脂承担压力载荷，缠绕和罐口结构分配应力。结构质量与外形约束共同影响储氢。",
      "facts": [
        [
          "5.7wt%",
          "Mirai2014氢质量/罐质量"
        ],
        [
          "5.5 / 4.2wt%",
          "ANL2010含附件系统，350/700bar，不同分母"
        ]
      ],
      "subject": "material:hydrogen-gas-fiber"
    },
    {
      "id": "hydrogen-gas-controls",
      "label": "压缩、预冷与供氢控制",
      "title": "压缩、预冷与供氢控制",
      "year": "部件",
      "copy": "压缩机提供压力，阀门和调压器提供所需流量。充装升温使预冷和热管理成为系统耗能的一部分。",
      "facts": [
        [
          "1.35kWh/kg H₂",
          "20bar/300K至700bar，等温理论最小"
        ],
        [
          "约3.0+0.2kWh/kg H₂",
          "至880bar站点模型压缩约3.0，预冷另约0.2"
        ]
      ],
      "subject": "material:hydrogen-gas-controls"
    },
    {
      "id": "hydrogen-gas-cavern",
      "label": "盐穴与衬里岩洞",
      "title": "盐穴与衬里岩洞",
      "year": "部件",
      "copy": "盐穴依赖地质和井筒密封，衬里岩洞以人工气密层与围岩配合。工作气和保留气体分别计量。",
      "facts": [
        [
          "100m³ / 250bar",
          "HYBRIT衬里岩洞试验，非盐穴"
        ]
      ],
      "subject": "material:hydrogen-gas-cavern"
    }
  ],
  "companies": [
    {
      "id": "hydrogen-gas-nrel-hitrf",
      "label": "NREL HITRF",
      "year": "设施",
      "title": "压缩与加注基础设施验证",
      "copy": "设施把压缩、缓冲储气与加注集成在一起。两种压缩机分别验证不同的压力与输送工况。",
      "facts": [
        [
          "480 kg/day",
          "活塞压缩机415→900 bar"
        ],
        [
          "60 kg/h",
          "隔膜压缩机20→930 bar"
        ]
      ],
      "subject": "company:hydrogen-gas-nrel-hitrf"
    },
    {
      "id": "hydrogen-gas-hexagon-lincoln",
      "label": "Lincoln Composites",
      "year": "2011",
      "title": "Lincoln Composites高压容器资格测试",
      "copy": "DOE年度审查记载3,600 psi压力容器完成多项安全资格测试。",
      "facts": [
        [
          "3,600 psi",
          "2011年压力容器资格测试"
        ],
        [
          "约8,500 L",
          "2012年开发设计水容积"
        ]
      ],
      "subject": "company:hydrogen-gas-hexagon-lincoln"
    },
    {
      "id": "hydrogen-gas-enric",
      "label": "中集安瑞科",
      "year": "2025",
      "title": "30MPa氢气管束批量出货与松原储氢装备交付",
      "copy": "中集安瑞科披露其第二代30MPa管束式集装箱实现批量出货，并向松原项目交付15台氢气球罐及8套压缩机缓冲罐，表明企业具备储运装备和项目交付活动。",
      "facts": [
        [
          "30 MPa",
          "2025管束集装箱批量出货"
        ],
        [
          "15台 / 8套",
          "松原氢气球罐 / 压缩机缓冲罐交付"
        ]
      ],
      "subject": "company:hydrogen-gas-enric"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "从工业盐穴到复合罐和岩洞",
      "title": "从工业盐穴到复合罐和岩洞",
      "content": "### 1972｜工业氢进入地下盐穴\n\n**气态储氢不只依靠单个压力瓶，也可以利用地下空间扩大库存。** 英国政府发布的 Bay Hydrogen Hub 可行性报告记载 Teesside 盐穴储氢设施于1972年启用。其历史作用是服务工业氢供需缓冲，不是当时已经建成可再生电力往返储能电站。地下盐穴与地面复合罐都保存气态氢，但围岩约束、井筒、垫底气与有效工作气决定不同的设计边界。\n\n来源：[英国政府公开项目报告](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1161490/iha-22-edf-final-feasibility-report.pdf)。此处作为可核工业规模节点，不宣称高压气瓶的起源年份。\n\n### 2002｜35 MPa 车载储氢进入有限商业使用\n\n**复合罐开始在实际车辆上承受反复加注与道路环境。** 丰田于2002年12月在日本和美国有限销售/租赁 FCHV；其官方应急资料记载四个 Type IV 储罐，采用聚合物内衬和碳纤维缠绕，最高约35 MPa。改变的是从单个罐体性能转向整车阀门、密封和供氢系统的协同，有限投放不等于当年普及。\n\n来源：[Toyota FCHV 应急技术资料](https://techinfo.toyota.com/techInfoPortal/staticcontent/en/techinfo/html/prelogin/docs/fchverg.pdf)；[Toyota 对2002年有限投放的官方记载](https://global.toyota/en/detail/249522)。\n\n### 2005｜聚合物内衬与70 MPa罐体共同优化\n\n**增加储氢量需要同时解决轻量化、强度与渗透。** 丰田2005-05-16发布自研35和70 MPa罐技术，采用尼龙系树脂内衬与碳纤维全缠绕；35 MPa罐在相同外形尺寸下比前代增加约10%储氢量，70 MPa罐于当年1月获得相关认证。提高压力并非唯一改进，减少内衬占用体积同样影响储量；这两项比较属于各自的车型/罐体设计，不能视为压力翻倍就使气体密度严格翻倍。\n\n来源：[Toyota 2005 原始技术发布](https://global.toyota/jp/detail/1500575)。\n\n### 2010｜系统评估与氢环境疲劳研究同时深入\n\n**罐内氢密度与整套系统储氢能力开始分开衡量。** DOE/Argonne 的 ANL-10/24 比较可用氢量同为5.6 kg的350/700 bar方案，系统质量储氢比为5.5/4.2 wt%，体积储氢密度为17.6/26.3 kg H₂/m³。这是报告给定设计与成本假设下的工程评估，不是所有当代产品通用规格。700 bar提升体积利用率，却可能增加增强层和附件质量。\n\n同年Sandia在45 MPa氢气中测量4130X钢疲劳裂纹扩展，发现加载频率、应力比改变结果。设计因此不能只用空气中的强度或一次爆破压力代表长期服役。\n\n来源：[DOE/Argonne 原始评估](https://www.energy.gov/eere/fuelcells/articles/technical-assessment-compressed-hydrogen-storage-tank-systems-automotive)；[Sandia，DOI 10.1115/PVP2010-25827](https://www.sandia.gov/research/publications/details/fracture-and-fatigue-tolerant-steel-pressure-vessels-for-gaseous-hydrogen-2010-12-01/)。\n\n### 2013｜车辆储氢形成国际性能要求\n\n**储罐、供氢系统与整车共同进入标准评价。** UN GTR No.13于2013-06-27建立，规定氢燃料车辆安全性能要求，覆盖车载储氢和燃料系统等。它代表跨地区技术要求协调，不是对某一特定罐型的商业背书，也不是今天所有地区法规完全相同。\n\n来源：[UNECE 官方发布](https://unece.org/transport/press/unece-adopts-global-technical-regulation-safety-hydrogen-and-fuel-cell-vehicles)。\n\n### 2014｜Mirai将70 MPa复合罐带入量产车型\n\n**储氢系统开始服从量产车的空间与重量约束。** 丰田Mirai采用两个70 MPa罐，内部容积合计122.4 L；发布口径为5.7 wt%，脚注明确是储存氢质量相对于罐质量的比值。该分母不同于DOE的包含附属部件系统质量，不能直接画成同口径领先对比。相同压力下，加注后的温度和气体质量仍会随初始状态与加注协议变化。\n\n来源：[Toyota 2014 发布与规格](https://global.toyota/en/newsroom/toyota/22740159.html)；[日文原文脚注7的分母定义](https://global.toyota/jp/newsroom/toyota/21797834.html)。\n\n### 2022｜100 m³衬里岩洞开始储氢运行\n\n**HYBRIT把储氢与连续炼铁用氢需求连接起来。** 瑞典Luleå试验设施于2022年夏后运行，容积100 m³，位于地表下约30 m，氢压达到250 bar（25 MPa）。地下衬里承担气密，围岩结构参与承载；这是衬里岩洞，不能标作天然盐穴。储氢允许电解槽根据电力条件调节，而工业还原过程保持用氢。\n\n来源：[HYBRIT 2022-09-23 投运发布](https://www.hybritdevelopment.se/hybrit-milstolpe-nadd-pilotanlaggningen-for-vatgaslagring-i-drift/)；[项目原始技术报告](https://www.hybritdevelopment.se/wp-content/uploads/2024/08/hybrit-broschure-fossil-free-steel-production-ready-for-industrialisation.pdf)。\n\n### 2025｜地下试验开始给出运行与调度证据\n\n**储氢的价值从“装得下”扩展到“何时制氢更经济”。** SSAB于2025-02-27发布HYBRIT结果，报告自2022年以来进行间歇测试，累计运行约3800 h；针对未来电力市场情景的模拟显示，工业制氢可变运行成本可能降低25–40%。成本降低来自生产与用氢时序解耦，不是罐体效率；试验延长至2026是继续测试计划，不等于大规模商业设施已投运。\n\n来源：[SSAB 原始发布](https://www.ssab.com/en/news/2025/02/hybrit-largescale-storage-of-fossilfree-hydrogen-gas-successfully-proven)；[HYBRIT 2025 报告](https://www.hybritdevelopment.se/wp-content/uploads/2025/04/broschyr-hybrit-p3-eng-web-1.pdf)。\n\n\n\n原始来源：[中集安瑞科](https://tc.enricgroup.com/companyupdate/97)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "气密、增强与压力系统",
      "title": "气密、增强与压力系统",
      "content": "### 金属与聚合物内衬\n\n内衬主要提供气密边界。Type I为全金属罐；Type II采用承载金属内衬与环向缠绕；Type III为金属内衬全缠绕；Type IV为非金属内衬全缠绕。DOE的分类描述不能简化成“型号越大就全面更好”。金属要考虑氢环境疲劳、焊接和缺陷；聚合物则需关注渗透、温度与压力循环下的变形，且阀口连接仍有金属和密封界面。\n\n来源：[DOE 储罐分类](https://www.energy.gov/cmei/fuels/site-and-bulk-hydrogen-storage)；[Sandia 材料相容性](https://energy.sandia.gov/programs/sustainable-transportation/hydrogen/materials-compatibility/)。\n\n### 碳纤维复合增强层\n\n纤维与树脂增强层承担压力载荷，缠绕角度、局部厚度和罐口结构决定载荷分配。其价值是减轻结构质量，但加压密度收益会受到增强层质量、制造成本和罐体外形制约。Toyota的罐质量比和DOE的系统质量比应并列标注分母，不能直接组成同一排名。\n\n来源：[Toyota 2005](https://global.toyota/jp/detail/1500575)；[ANL-10/24](https://www.energy.gov/eere/fuelcells/articles/technical-assessment-compressed-hydrogen-storage-tank-systems-automotive)。\n\n### 阀门、密封、压缩与预冷\n\n压缩机提供压力，阀门和调压器把库存变为符合用户要求的流量。快速充装时气体升温，使目标充装量受到温度限制；预冷因此也是系统耗能的一部分。DOE Record 9013以20 bar、300 K进气为基础，给出压至700 bar的等温理论最小功1.35 kWh/kg H₂；加氢站模型压至880 bar约3.0 kWh/kg H₂，另有约0.2 kWh/kg预冷能耗。理论最小值、模型和站点实测不能合并成一个效率。\n\n来源：[DOE Record 9013 原始报告](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/9013_energy_requirements_for_hydrogen_gas_compression.pdf)。\n\n### 盐穴、衬里与地下结构\n\n大库存可通过地下储存减少大量独立压力罐的结构材料需求。盐穴依赖合适地质和井筒密封；HYBRIT的衬里岩洞则通过衬里和围岩共同工作。可用工作气必须与最低运行压力下保留的气体分开，洞室几何容积也不能直接换算成可输出电量；压缩机、纯化与抽采速度限制实际服务能力。\n\n来源：[英国氢战略](https://www.gov.uk/government/publications/uk-hydrogen-strategy/uk-hydrogen-strategy-accessible-html-version)；[HYBRIT 技术报告](https://www.hybritdevelopment.se/wp-content/uploads/2024/08/hybrit-broschure-fossil-free-steel-production-ready-for-industrialisation.pdf)。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "系统评估与氢环境试验",
      "title": "系统评估与氢环境试验",
      "content": "### 原始报告与试验条件\n\n| 原始证据 | 条件与数值 | 实际回答的问题 | 范围 |\n|---|---|---|---|\n| Argonne ANL-10/24，2010 | 可用5.6 kg H₂；350/700 bar；系统5.5/4.2 wt%，17.6/26.3 kg/m³ | 压力提升如何改变重量和体积 | 工程模型，附属设备纳入系统；不是现售产品统一参数 |\n| Sandia，2010，10.1115/PVP2010-25827 | 4130X钢；45 MPa氢气；0.1与1 Hz、不同应力比 | 氢环境下循环裂纹如何增长 | 材料试验与设计计算，不外推所有钢材 |\n| DOE Record 9013 | 20 bar、300 K起点；700 bar等温最小1.35 kWh/kg；880 bar模型约3.0 kWh/kg，预冷另计 | 高压储氢的压缩功从哪里来 | 非电解耗电；非电热电往返效率 |\n| HYBRIT 2025试验报告 | 100 m³、250 bar中试；约3800 h运行；调度模拟降可变成本25–40% | 地下库存与连续工业用氢如何协调 | 试验运行与经济模拟分列，不是商业盐穴统计 |\n\n来源：](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1161490/iha-22-edf-final-feasibility-report.pdf) · ](https://techinfo.toyota.com/techInfoPortal/staticcontent/en/techinfo/html/prelogin/docs/fchverg.pdf) · ](https://global.toyota/en/detail/249522) · ](https://global.toyota/jp/detail/1500575) · ](https://www.energy.gov/eere/fuelcells/articles/technical-assessment-compressed-hydrogen-storage-tank-systems-automotive) · ](https://www.sandia.gov/research/publications/details/fracture-and-fatigue-tolerant-steel-pressure-vessels-for-gaseous-hydrogen-2010-12-01/) · ](https://unece.org/transport/press/unece-adopts-global-technical-regulation-safety-hydrogen-and-fuel-cell-vehicles) · ](https://global.toyota/en/newsroom/toyota/22740159.html) · ](https://global.toyota/jp/newsroom/toyota/21797834.html) · ](https://www.hybritdevelopment.se/hybrit-milstolpe-nadd-pilotanlaggningen-for-vatgaslagring-i-drift/) · ](https://www.hybritdevelopment.se/wp-content/uploads/2024/08/hybrit-broschure-fossil-free-steel-production-ready-for-industrialisation.pdf) · ](https://www.ssab.com/en/news/2025/02/hybrit-largescale-storage-of-fossilfree-hydrogen-gas-successfully-proven) · ](https://www.hybritdevelopment.se/wp-content/uploads/2025/04/broschyr-hybrit-p3-eng-web-1.pdf) · ](https://www.iea.org/reports/global-hydrogen-review-2026/executive-summary) · ](https://www.energy.gov/cmei/fuels/site-and-bulk-hydrogen-storage) · ](https://energy.sandia.gov/programs/sustainable-transportation/hydrogen/materials-compatibility/) · ](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/9013_energy_requirements_for_hydrogen_gas_compression.pdf) · ](https://www.gov.uk/government/publications/uk-hydrogen-strategy/uk-hydrogen-strategy-accessible-html-version) · ](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/P020220323314396580505.pdf) · ](https://www.iea.org/reports/global-hydrogen-review-2026/demand) · ](https://www.energy.gov/cmei/fuels/hydrogen-storage)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "复合罐与地下储氢主体",
      "title": "复合罐与地下储氢主体",
      "content": "### 复合罐与地下储氢主体\n\n本路线企业按车载复合罐、工业储运装备、地下储氢项目三类关联独立企业底稿。Toyota可作为罐体与整车协同的技术节点；HYBRIT是SSAB、LKAB、Vattenfall联合开发项目，项目规模不能当作任一母公司的储能销售额。车辆燃料罐的压力和质量优化与固定式长期库存的地质、工作气成本是不同竞争维度。\n\n### NREL HITRF\n\nNREL研究设施，集成制氢、压缩、缓冲储气与加注设备，用于基础设施性能验证。\n\n\n\n### Lincoln Composites\n\nLincoln Composites是DOE历史项目承研方，当时为Hexagon Composites集团成员，本项记录2011年前后的压力容器开发。\n\n2011年：Lincoln Composites高压容器资格测试。完成静水爆破、压力循环、泄漏先兆破坏、环境、缺陷容限等资格测试。 DOE后续报告中的约8,500 L是设计容积指标，不是氢气质量或电站储能量。\n\n原始来源：[Lincoln Composites](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/review11/pd021_baldwin_2011_o.pdf)\n\n### 中集安瑞科\n\n中集安瑞科控股有限公司制造高压氢气储运装备，也经营液氢储运设备；其披露覆盖管束集装箱、球罐及车载IV型瓶。\n\n2025年：30MPa氢气管束批量出货与松原储氢装备交付。2025年第二代30MPa高压氢气管束集装箱批量出货。 松原项目交付15台氢气球罐与8套压缩机缓冲罐。 集团2025年营收为人民币263.26亿元，不能视作氢业务收入。\n\n原始来源：[中集安瑞科](https://tc.enricgroup.com/companyupdate/97)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "氢储运政策及工业需求",
      "title": "氢储运政策及工业需求",
      "content": "### 政策与需求范围\n\n中国2022年发布《氢能产业发展中长期规划（2021–2035年）》，覆盖制储输用，并部署储运技术研发和示范。UN GTR No.13则针对车辆性能，不适用于把所有地下储氢设施一并认证。IEA2026年记录的2025年超过100 Mt全球氢需求主要为工业消费，应用图应展示需求类别或具体储存项目，不套用中国新型储能GW/GWh曲线。\n\n来源：[国家发改委规划原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/P020220323314396580505.pdf)；[UNECE](https://unece.org/transport/press/unece-adopts-global-technical-regulation-safety-hydrogen-and-fuel-cell-vehicles)；[IEA](https://www.iea.org/reports/global-hydrogen-review-2026/demand)。\n\n### 2026行业观察\n\nIEA记录2025全球氢需求超过100Mt、低排放氢产量接近1Mt，属于年度工业生产/消费口径。\n\n来源：[IEA2026执行摘要](https://www.iea.org/reports/global-hydrogen-review-2026/executive-summary)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "按氢库存与净电输出评价",
      "title": "按氢库存与净电输出评价",
      "content": "### 库存、输出与系统损失\n\n| 场景 | 适配价值 | 主要制约 | 应展示指标 |\n|---|---|---|---|\n| 车载和短程运输 | 成熟的350/700 bar装备与快速供气 | 罐重、外形、压缩预冷、加氢设施 | kg H₂、压力、含罐/系统质量、加注条件 |\n| 电解制氢缓冲 | 把波动生产与连续工业用氢解耦 | 压缩功、调压损失、库存周转 | 工作气kg、流量、压缩kWh/kg |\n| 地下长时库存 | 容量可与地面制氢/用氢功率分开扩大 | 地质、衬里、井筒、垫底气、抽采速度 | 工作气/垫底气、压力窗、项目状态 |\n| 电—氢—电 | 可通过燃料电池或透平恢复电力 | 电解、压缩和发电各有损失，长时价值与效率需同时评价 | 电输入与净电输出实测边界，氢库存另列 |\n\nDOE给出的氢低位热值约120 MJ/kg，即约33.3 kWh/kg，是燃料的化学能；高位热值包含生成水冷凝热，数值更高。用氢量乘热值得到的是氢能库存，不能直接等于送入电网的电量。高压储存不会自行产生电能，它提供的是可按需提取的氢。\n\n来源：[DOE Hydrogen Storage](https://www.energy.gov/cmei/fuels/hydrogen-storage)。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "hydrogen-gas-policy",
    "label": "储运研发与车辆安全要求",
    "title": "储运研发与车辆安全要求",
    "year": "2022",
    "copy": "中国氢能规划覆盖制储输用并部署储运技术研发。车辆GTR性能要求与地下设施各有适用范围。",
    "facts": [
      [
        "2021—2035规划",
        "中国2022发布，储运研发与示范"
      ],
      [
        "UN GTR No.13",
        "车辆储氢与燃料系统性能要求"
      ]
    ],
    "subject": "scene:hydrogen-policy"
  },
  "market": {
    "id": "hydrogen-gas-market",
    "label": "工业氢需求与库存周转",
    "title": "工业氢需求与库存周转",
    "year": "2026观察",
    "copy": "IEA公布全球氢年度需求与低排放产量。工业消费流量和储氢设施库存采用不同尺度。",
    "facts": [
      [
        ">100Mt",
        "2025全球年度氢需求，IEA2026"
      ],
      [
        "接近1Mt",
        "2025低排放氢年度产量"
      ]
    ],
    "subject": "route:hydrogen-gas:history"
  },
  "historySubject": "route:hydrogen-gas:history",
  "note": "独立气态储氢研究",
  "papers": {
    "id": "hydrogen-gas-papers",
    "label": "罐体、系统与压缩功分母",
    "title": "罐体、系统与压缩功分母",
    "year": "工程评估",
    "copy": "按相同可用氢量比较系统重量和体积，再分开看压缩理论功、站点模型与钢材试验。",
    "facts": [
      [
        "5.6kg H₂",
        "ANL350/700bar系统评估共同可用量"
      ],
      [
        "45MPa氢气",
        "Sandia4130X钢疲劳试验，频率/应力比影响结果"
      ]
    ],
    "subject": "material:hydrogen-gas-fiber"
  },
  "storage": {
    "id": "hydrogen-gas-storage",
    "label": "氢库存支持生产与用能解耦",
    "title": "氢库存支持生产与用能解耦",
    "year": "应用",
    "copy": "气态储存按需提供氢。回发电还要经过燃料电池或透平，并计入制氢与压缩损失。",
    "facts": [
      [
        "约33.3kWh/kg H₂",
        "氢低位热值LHV约120MJ/kg，化学能"
      ],
      [
        "电—氢—电",
        "电解、储运和回发电全链，净电量另计"
      ]
    ],
    "subject": "route:hydrogen-gas:history"
  },
  "showMarketChart": false
};

export const liquidHydrogenResearch: ChronicleResearch = {
  "name": "液氢储能",
  "timeline": [
    {
      "id": "hydrogen-liquid-1898",
      "yearNumber": 1898,
      "year": "1898",
      "label": "Dewar实现氢液化",
      "title": "Dewar实现氢液化",
      "copy": "氢液化提高体积储氢密度，极低温使持续漏热成为容器设计重点。",
      "facts": [
        [
          "约20K / −253°C",
          "接近常压沸点；1898实验液化节点"
        ]
      ],
      "detail": "把氢冷却到极低温，打开了提高体积储氢密度的另一条路。 NASA的液氢技术史记录James Dewar于1898年首次液化氢。此节点是物态控制的实验突破，不是当年已经具备工业液氢运输。接近常压沸点约20 K（约−253 °C）意味着容器不仅要装得住，还必须隔绝持续进入的热量。",
      "source": "https://www.nasa.gov/wp-content/uploads/2023/04/sp-4230.pdf",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-1963",
      "yearNumber": 1963,
      "year": "1963",
      "label": "Centaur验证液氢上面级",
      "title": "Centaur验证液氢上面级",
      "copy": "液氢进入发动机、储罐和地面供液设施的完整系统。NASA记录Atlas/Centaur成功发射。",
      "facts": [
        [
          "1963-11-27",
          "Atlas/Centaur成功飞行，航天任务"
        ]
      ],
      "detail": "液氢从低温实验推进到发动机、储罐和地面设施的完整系统。 NASA记载1963-11-27 Atlas/Centaur成功发射。此前1962年首次试飞失败，后续围绕绝热、加注、增压与排气改进。航天推进证明液氢可被工程化管理，但火箭的一次性飞行任务与地面长期库存的经济要求不同。",
      "source": "https://www.nasa.gov/history/centaur-americas-workhorse-in-space/",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "文昌300m³液氢储罐交付",
      "title": "文昌300m³液氢储罐交付",
      "copy": "公司2025年度业绩披露称，向国家重点专项交付国内首台液氢球罐并通过专家评审验收。专项示范完成评审验收。",
      "facts": [
        [
          "300 m³",
          "2013文昌液氢储罐交付"
        ],
        [
          "2025专项验收",
          "液氢球罐示范成果"
        ]
      ],
      "detail": "中集安瑞科官网记载2013年向海南文昌交付300m³液氢储罐。该数字是储罐容积，不是氢质量、发电量或电力储能时长。\n\n公司产品页记载该项交付发生于2013年。 2025年度公司披露另有国家重点专项液氢球罐通过专家评审验收；未据此推断批量商业投运。",
      "source": "https://www.enricgroup.com/zhongyouchucun",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "玻璃微球绝热完成对照",
      "title": "玻璃微球绝热完成对照",
      "copy": "NASA以玻璃微球替代珍珠岩绝热，比较现场蒸发损失。不同绝热方案影响库存保持。",
      "facts": [
        [
          "最多降低约46%",
          "特定对照的相对蒸发损耗降幅，非效率"
        ]
      ],
      "detail": "储罐损耗不仅由液氢决定，也由绝热层决定。 NASA后续官方技术发布总结2015年在Kennedy和Stennis完成的现场示范：以玻璃微球替代珍珠岩粉末，在相关对照条件下蒸发损失最多降低约46%。这是相对于原绝热方案的蒸发损失降幅，既不是46%的系统效率，也不是任何储罐固定的日蒸发率。",
      "source": "https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2017",
      "yearNumber": 2017,
      "year": "2017",
      "label": "主动制冷控制125m³罐蒸发",
      "title": "主动制冷控制125m³罐蒸发",
      "copy": "内换热器与闭式氦制冷机移走漏热。三种控制策略在大型试验罐实现零蒸发。",
      "facts": [
        [
          "125000L",
          "真空夹层、多层绝热液氢罐"
        ],
        [
          "20K / 390W",
          "低温端制冷量，电网输入功率另计"
        ]
      ],
      "detail": "用制冷移走漏热，可以把“慢慢蒸发”改为受控存储。 NASA原始会议论文报告125,000 L真空夹层、多层绝热液氢罐，与内部换热器及闭式氦制冷机耦合；制冷机在20 K具有390 W冷量，不使用液氮预冷。团队试验温度控制、压力反馈和启停制冷三种控制方式实现零蒸发。390 W是低温端制冷量，不是电网输入功率；零蒸发以持续制冷耗电为代价。",
      "source": "https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "澳日完成液氢海运示范",
      "title": "澳日完成液氢海运示范",
      "copy": "Suiso Frontier把储罐、装卸与航运放进同一供应链。示范船返回神户，货罐按容积记录。",
      "facts": [
        [
          "1250m³ / 约−253°C",
          "船用液氢货罐，非每航次实装质量"
        ]
      ],
      "detail": "储罐、装卸和航运开始被放到同一供应链验证。 Kawasaki记载Suiso Frontier使用1,250 m³液氢罐，以约−253 °C保存液氢，2022年2月底完成示范航程返回神户。该数字是货罐容积，不是船上每次实装液氢质量，更不是可输出电量；示范运输也不能直接等同商业贸易已达规模。",
      "source": "https://answers.khi.co.jp/en/energy-environment/20220513e-01/",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "80kg液氢支持重载道路试验",
      "title": "80kg液氢支持重载道路试验",
      "copy": "GenH2原型车完成单次加注长距离行驶。载荷与路线条件随续航结果记录。",
      "facts": [
        [
          "1047km / 约80kg H₂",
          "2023指定道路试验，组合总质量约40t"
        ]
      ],
      "detail": "更紧凑的燃料库存开始用于重载长距离任务。 Daimler Truck于2023年9月以GenH2原型车完成单次加注1,047 km道路试验，车载约80 kg液氢、总组合质量约40 t。该结果证明指定路线和车辆条件下的续航能力，不能替代不同货重、气候或道路条件下的平均能耗，也不是电网储能往返测试。",
      "source": "https://media.be.daimlertruck.com/fr/sur-rapide-et-simple--daimler-truck-et-linde-lancent-une-nouvelle-norme-pour-le-ravitaillement-en-hydrogene-liquide/",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "加注设施连接客户试用",
      "title": "加注设施连接客户试用",
      "copy": "Daimler与Linde公布过冷液氢补能并开设公共站。五辆GenH2开始日常客户测试。",
      "facts": [
        [
          "五辆原型车",
          "2024-07客户试用，非大规模销售"
        ]
      ],
      "detail": "从一次续航纪录转向重复补能和日常物流。 Daimler Truck与Linde公布过冷液氢加注技术，并在Wörth开设公共sLH₂站；五辆GenH2于2024年7月开始客户测试。液氢技术的工程问题从罐体本身扩展到站端转运、预冷、加注连接与停车蒸发管理。该批车辆仍为试验原型，不能标成大规模量产销售。",
      "source": "https://www.daimlertruck.com/fileadmin/user_upload/documents/investors/reports/annual-reports/2024/daimler-truck-ir-annual-report-2024-incl-combined-management-report-dth-ag.pdf",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "大型供液设施与车队给出结果",
      "title": "大型供液设施与车队给出结果",
      "copy": "NASA完成地面球罐供液测试，Daimler公布车队客户运行。航天与道路数据分别计量。",
      "facts": [
        [
          ">225000km / 五辆",
          "车队累计，285次加注约15t H₂"
        ],
        [
          "5.6—8kg H₂/100km",
          "不同应用平均总质量16—34t"
        ],
        [
          "2025-07-25",
          "NASA地面供液测试完成"
        ]
      ],
      "detail": "验证对象扩大到真实供液链和客户车队。 NASA于2025-07-25公布新液氢球罐地面系统流动测试完成，检验两座储罐向移动发射平台供液的能力。Daimler Truck于同年9月报告五辆试验车累计超过225,000 km，285次加注约15 t液氢；不同应用平均总质量16–34 t，耗氢5.6–8 kg/100 km。两个场景分别验证航天地面供液与物流运行，不合并为液氢发电装机。\n\nNASA LC-39B液氢球罐供液测试。新球罐1.25百万美制加仑可用LH₂。 液氢温度约−423°F；参考指南列出新隔热方案降低46%蒸发损失。\n\n\n大型液氢储罐概念设计完成。设计研究覆盖最高100,000 m³的储罐概念。 采用较小示范罐进行材料、隔热与运行周期验证。\n\n\n国家重点专项液氢球罐通过评审验收。交付对象为国家重点专项；通过专家评审验收。 报道未披露储罐容积、静态蒸发率或液氢全链条运行数据。",
      "source": "https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/",
      "subject": "route:hydrogen-liquid:history"
    },
    {
      "id": "hydrogen-liquid-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "NextGenH2公布小批量计划",
      "title": "NextGenH2公布小批量计划",
      "copy": "NextGenH2发布双液氢罐与补能规格。百辆客户投放安排在年末，当前属于计划。",
      "facts": [
        [
          "最多85kg H₂",
          "双罐合计规格"
        ],
        [
          "约10—15min",
          "企业sLH₂加注流程"
        ],
        [
          "100辆 / 2026年底",
          "小批量客户投放计划"
        ]
      ],
      "detail": "下一步重点是把试验经验转成可重复制造和服务的产品。 2026-01-26发布的NextGenH2规格为双液氢罐合计最多85 kg，按企业发布的sLH₂流程约10–15 min加注；计划2026年底开始100辆小批量客户投放。截至本底稿日期，年末投放仍属于计划，不能提前写为已交付。其101 kWh缓冲电池是另一储能部件，不与85 kg液氢合并为同一个“电池容量”。",
      "source": "https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597",
      "subject": "route:hydrogen-liquid:history"
    }
  ],
  "materials": [
    {
      "id": "hydrogen-liquid-vessel",
      "label": "低温内胆与真空外壳",
      "title": "低温内胆与真空外壳",
      "copy": "双层罐隔离承液内胆与环境，支撑兼顾承重和低导热。低温韧性、焊缝与热收缩决定耐久。",
      "facts": [
        [
          "双层真空结构",
          "承液内胆、外壳与低导热支撑"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-liquid-vessel"
    },
    {
      "id": "hydrogen-liquid-insulation",
      "label": "多层绝热与玻璃微球",
      "title": "多层绝热与玻璃微球",
      "copy": "真空降低气体导热，反射层减少辐射。穿壁管道、支撑和装卸仍带入热量。",
      "facts": [
        [
          "蒸发损耗降最多46%",
          "NASA2015特定玻璃微球/传统方案对照"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-liquid-insulation"
    },
    {
      "id": "hydrogen-liquid-conversion",
      "label": "液化与正仲氢转化",
      "title": "液化与正仲氢转化",
      "copy": "降温同时调节正氢/仲氢组成，避免后续转化放热。液化能耗取决于循环与换热条件。",
      "facts": [
        [
          "约3.9kWh/kg H₂",
          "300K/1.01bar起点，含正仲转化理论最小"
        ],
        [
          "约10—13kWh/kg H₂",
          "DOE旧报告当时典型实际值，非2026保证值"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-liquid-conversion"
    },
    {
      "id": "hydrogen-liquid-transfer",
      "label": "低温泵与蒸发气管理",
      "title": "低温泵与蒸发气管理",
      "copy": "低温管线和阀门需预冷，蒸发气可回收、利用或再液化。主动制冷和移动周转采用不同策略。",
      "facts": [
        [
          "390W@20K",
          "NASA2017低温端冷量，维冷需外部供能"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-liquid-transfer"
    }
  ],
  "companies": [
    {
      "id": "hydrogen-liquid-nasa-ksc",
      "label": "NASA KSC",
      "year": "2025",
      "title": "NASA LC-39B液氢球罐供液测试",
      "copy": "NASA验证Pad 39B新旧球罐向移动发射台供液；这是航天推进剂设施的运行与测试案例。",
      "facts": [
        [
          "1.25百万美制加仑",
          "新球罐可用液氢容积"
        ],
        [
          "2025供液测试",
          "NASA LC-39B发射设施"
        ]
      ],
      "subject": "company:hydrogen-liquid-nasa-ksc"
    },
    {
      "id": "hydrogen-liquid-genh2-doe",
      "label": "GenH2 / CB&I",
      "year": "2025",
      "title": "大型液氢储罐概念设计完成",
      "copy": "CB&I、Shell、GenH2、NASA和休斯敦大学报告完成大储罐概念设计；研究中的最大设计值并非实际建成罐体容量。",
      "facts": [
        [
          "最高100,000 m³",
          "大型储罐概念设计"
        ],
        [
          "小型示范罐",
          "用于材料与隔热验证"
        ]
      ],
      "subject": "company:hydrogen-liquid-genh2-doe"
    },
    {
      "id": "hydrogen-liquid-enric",
      "label": "中集安瑞科",
      "year": "2025",
      "title": "国家重点专项液氢球罐通过评审验收",
      "copy": "公司2025年度业绩披露称，向国家重点专项交付国内首台液氢球罐并通过专家评审验收。专项示范完成评审验收。",
      "facts": [
        [
          "300 m³",
          "2013文昌液氢储罐交付"
        ],
        [
          "2025专项验收",
          "液氢球罐示范成果"
        ]
      ],
      "subject": "company:hydrogen-liquid-enric"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "从液化实验到供液与物流",
      "title": "从液化实验到供液与物流",
      "content": "### 1898｜Dewar实现氢液化\n\n**把氢冷却到极低温，打开了提高体积储氢密度的另一条路。** NASA的液氢技术史记录James Dewar于1898年首次液化氢。此节点是物态控制的实验突破，不是当年已经具备工业液氢运输。接近常压沸点约20 K（约−253 °C）意味着容器不仅要装得住，还必须隔绝持续进入的热量。\n\n来源：[NASA，Taming Liquid Hydrogen，技术史](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4230.pdf)；[DOE Physical Hydrogen Storage](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage)。\n\n### 1963｜Centaur首次成功飞行验证液氢上面级\n\n**液氢从低温实验推进到发动机、储罐和地面设施的完整系统。** NASA记载1963-11-27 Atlas/Centaur成功发射。此前1962年首次试飞失败，后续围绕绝热、加注、增压与排气改进。航天推进证明液氢可被工程化管理，但火箭的一次性飞行任务与地面长期库存的经济要求不同。\n\n来源：[NASA Centaur官方历史](https://www.nasa.gov/history/centaur-americas-workhorse-in-space/)。\n\n### 2015｜玻璃微球绝热完成现场对照\n\n**储罐损耗不仅由液氢决定，也由绝热层决定。** NASA后续官方技术发布总结2015年在Kennedy和Stennis完成的现场示范：以玻璃微球替代珍珠岩粉末，在相关对照条件下蒸发损失最多降低约46%。这是相对于原绝热方案的蒸发损失降幅，既不是46%的系统效率，也不是任何储罐固定的日蒸发率。\n\n来源：[NASA Innovative Liquid Hydrogen Storage，含2015现场结果](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/)。\n\n### 2017｜125 m³储罐试验实现主动零蒸发\n\n**用制冷移走漏热，可以把“慢慢蒸发”改为受控存储。** NASA原始会议论文报告125,000 L真空夹层、多层绝热液氢罐，与内部换热器及闭式氦制冷机耦合；制冷机在20 K具有390 W冷量，不使用液氮预冷。团队试验温度控制、压力反馈和启停制冷三种控制方式实现零蒸发。390 W是低温端制冷量，不是电网输入功率；零蒸发以持续制冷耗电为代价。\n\n来源：[Notardonato等，2017原始论文，NASA NTRS 20170006481](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)。\n\n### 2022｜澳日液氢海运链完成示范运输\n\n**储罐、装卸和航运开始被放到同一供应链验证。** Kawasaki记载Suiso Frontier使用1,250 m³液氢罐，以约−253 °C保存液氢，2022年2月底完成示范航程返回神户。该数字是货罐容积，不是船上每次实装液氢质量，更不是可输出电量；示范运输也不能直接等同商业贸易已达规模。\n\n来源：[Kawasaki 官方技术报道](https://answers.khi.co.jp/en/energy-environment/20220513e-01/)。\n\n### 2023｜80 kg液氢支撑长途卡车试验\n\n**更紧凑的燃料库存开始用于重载长距离任务。** Daimler Truck于2023年9月以GenH2原型车完成单次加注1,047 km道路试验，车载约80 kg液氢、总组合质量约40 t。该结果证明指定路线和车辆条件下的续航能力，不能替代不同货重、气候或道路条件下的平均能耗，也不是电网储能往返测试。\n\n来源：[Daimler Truck 2024技术发布回述2023试验](https://media.be.daimlertruck.com/fr/sur-rapide-et-simple--daimler-truck-et-linde-lancent-une-nouvelle-norme-pour-le-ravitaillement-en-hydrogene-liquide/)。\n\n### 2024｜sLH₂加注与客户试用衔接\n\n**从一次续航纪录转向重复补能和日常物流。** Daimler Truck与Linde公布过冷液氢加注技术，并在Wörth开设公共sLH₂站；五辆GenH2于2024年7月开始客户测试。液氢技术的工程问题从罐体本身扩展到站端转运、预冷、加注连接与停车蒸发管理。该批车辆仍为试验原型，不能标成大规模量产销售。\n\n来源：[Daimler Truck 2024年报](https://www.daimlertruck.com/fileadmin/user_upload/documents/investors/reports/annual-reports/2024/daimler-truck-ir-annual-report-2024-incl-combined-management-report-dth-ag.pdf)；[2025试验总结确认启动月份](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162)。\n\n### 2025｜大型地面设施与车队给出运行结果\n\n**验证对象扩大到真实供液链和客户车队。** NASA于2025-07-25公布新液氢球罐地面系统流动测试完成，检验两座储罐向移动发射平台供液的能力。Daimler Truck于同年9月报告五辆试验车累计超过225,000 km，285次加注约15 t液氢；不同应用平均总质量16–34 t，耗氢5.6–8 kg/100 km。两个场景分别验证航天地面供液与物流运行，不合并为液氢发电装机。\n\n来源：[NASA 2025测试公告](https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/)；[Daimler Truck原始测试总结](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162)。\n\n### 2026｜85 kg新车型公布，小批量交付仍是计划\n\n**下一步重点是把试验经验转成可重复制造和服务的产品。** 2026-01-26发布的NextGenH2规格为双液氢罐合计最多85 kg，按企业发布的sLH₂流程约10–15 min加注；计划2026年底开始100辆小批量客户投放。截至本底稿日期，年末投放仍属于计划，不能提前写为已交付。其101 kWh缓冲电池是另一储能部件，不与85 kg液氢合并为同一个“电池容量”。\n\n来源：[Daimler Truck 2026原始发布](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597)。\n\n原始来源：[NASA KSC](https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/) · [GenH2 / CB&I](https://genh2.com/press-release/liquid-hydrogen-storage-tank-first-commercial-scale-design-demonstrated-by-cbi-and-shell/) · [中集安瑞科](https://tc.enricgroup.com/companyupdate/97)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "罐体、绝热与低温控制",
      "title": "罐体、绝热与低温控制",
      "content": "### 低温内胆与真空外壳\n\n液氢罐通过双层结构把承液内胆与环境分离，支撑件既要承重又要减少导热。低温韧性、焊缝、热收缩与连接结构决定反复冷却和加热的耐久。低压液氢的压力水平不等于完全没有压力管理，蒸发造成的增压仍需阀门、控制和气体去向。\n\n来源：[DOE 固定式和散装储氢](https://www.energy.gov/cmei/fuels/site-and-bulk-hydrogen-storage)；[NASA 2017储罐论文](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)。\n\n### 多层绝热、珍珠岩与玻璃微球\n\n真空减少气体导热，多层反射结构抑制辐射，填充绝热适用于不同规模与结构。2015年玻璃微球试验给出的46%是特定替代方案相对原先的蒸发损失减少，不能转成统一日蒸发率。容器越大，表面积/体积关系越有利，但穿壁管道、支撑和装卸热输入仍可能重要。\n\n来源：[NASA 绝热与主动制冷说明](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/)。\n\n### 液化循环与正仲氢转化\n\n氢在降温过程中的正氢—仲氢组成需要调整；若留下大量室温平衡正氢，后续转化释放的热会促进蒸发。DOE Record 9013给出的历史评估：从300 K、1.01 bar开始，包含仲氢转化的液化理论最小功约3.9 kWh/kg，报告当时典型实际液化耗电约10–13 kWh/kg。两者差距来自压缩、换热和制冷不可逆性；该旧报告不能当成2026年每座新工厂实测规格。\n\n来源：[DOE Record 9013](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/9013_energy_requirements_for_hydrogen_gas_compression.pdf)。\n\n### 低温泵、换热器与蒸发气管理\n\n转运管线与阀门必须预冷，加注过程中进入的热量会形成额外气体。蒸发气可以回收、使用、再液化或受控排放，具体策略取决于用氢频率和规模。主动零蒸发方案以外部冷源抵消漏热；运输车辆则需兼顾停车时间、可用库存和站点周转，不能把航天地面罐方案直接视为移动产品。\n\n来源：[NASA IRAS试验](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf)；[Daimler Truck 2026蒸发气管理说明](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597)。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "低温试验及液化投入",
      "title": "低温试验及液化投入",
      "content": "### 原始研究与工况\n\n| 原始研究/技术报告 | 核心数值和条件 | 贡献 | 不能外推的范围 |\n|---|---|---|---|\n| DOE Record 9013，历史液化能耗评估 | 300 K、1.01 bar起点；含正仲转化理论约3.9 kWh/kg；当时典型实际10–13 kWh/kg | 把燃料能量与液化投入分开 | 不是2026年新建装置保证值，不含全部制氢及发电链 |\n| NASA IRAS，2017 | 125,000 L；20 K制冷量390 W；三种控制策略 | 大型液氢罐主动抑制蒸发 | 390 W为冷量而非电耗；零蒸发不等于零能源输入 |\n| NASA现场绝热试验，2015结果/2018技术发布 | 玻璃微球相对传统方案减少蒸发损失最多46% | 证明绝热材料对损耗的影响 | 相对降幅，不是46%往返效率或统一蒸发率 |\n| Daimler Truck客户试验，2025 | 五原型车、>225,000 km、16–34 t平均总质量、5.6–8 kg/100 km | 检验车、站与物流的协同 | 整车工况，不是储罐材料性质和电站效率 |\n\n来源：[NASA，Taming Liquid Hydrogen，技术史](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4230.pdf) · [DOE Physical Hydrogen Storage](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage) · [NASA Centaur官方历史](https://www.nasa.gov/history/centaur-americas-workhorse-in-space/) · [NASA Innovative Liquid Hydrogen Storage，含2015现场结果](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/) · [Notardonato等，2017原始论文，NASA NTRS 20170006481](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf) · [Kawasaki 官方技术报道](https://answers.khi.co.jp/en/energy-environment/20220513e-01/) · [Daimler Truck 2024技术发布回述2023试验](https://media.be.daimlertruck.com/fr/sur-rapide-et-simple--daimler-truck-et-linde-lancent-une-nouvelle-norme-pour-le-ravitaillement-en-hydrogene-liquide/) · [Daimler Truck 2024年报](https://www.daimlertruck.com/fileadmin/user_upload/documents/investors/reports/annual-reports/2024/daimler-truck-ir-annual-report-2024-incl-combined-management-report-dth-ag.pdf) · [2025试验总结确认启动月份](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162) · [NASA 2025测试公告](https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/) · [Daimler Truck原始测试总结](https://www.daimlertruck.com/en/newsroom/pressrelease/five-and-a-half-times-around-the-world-daimler-truck-fuel-cell-trucks-successfully-complete-more-than-225000-kilometers-in-real-world-customer-operations-53182162) · [Daimler Truck 2026原始发布](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597) · [DOE 固定式和散装储氢](https://www.energy.gov/cmei/fuels/site-and-bulk-hydrogen-storage) · [NASA 2017储罐论文](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf) · [NASA 绝热与主动制冷说明](https://www.nasa.gov/missions/artemis/innovative-liquid-hydrogen-storage-to-support-space-launch-system/) · [DOE Record 9013](https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/9013_energy_requirements_for_hydrogen_gas_compression.pdf) · [NASA IRAS试验](https://ntrs.nasa.gov/api/citations/20170006481/downloads/20170006481.pdf) · [Daimler Truck 2026蒸发气管理说明](https://www.daimlertruck.com/en/newsroom/pressrelease/daimler-truck-presents-mercedes-benz-nextgenh2-truck-with-small-series-production-planned-from-end-of-2026-53330597) · [国家氢能规划原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/P020220323314396580505.pdf) · [DOE物理储氢](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "液化设施与供液主体",
      "title": "液化设施与供液主体",
      "content": "### 液化设施与供液主体\n\n液化设备、真空绝热储罐、液氢海运和移动加注是不同产业环节。Kawasaki的示范船体现海运链，Daimler Truck/Linde体现车站协同，NASA是研究和航天运行机构。独立企业资料展示集团规模时应和液氢业务分开，订单、原型、试用与小批量计划分别保留。\n\n### NASA KSC\n\nNASA肯尼迪航天中心为Artemis发射系统管理低温推进剂基础设施；LC-39B球罐是航天推进剂储罐案例。\n\n2025年：NASA LC-39B液氢球罐供液测试。新球罐1.25百万美制加仑可用LH₂。 液氢温度约−423°F；参考指南列出新隔热方案降低46%蒸发损失。\n\n原始来源：[NASA KSC](https://www.nasa.gov/blogs/missions/2025/07/25/nasa-tests-new-liquid-hydrogen-tank-for-crewed-artemis-missions/)\n\n### GenH2 / CB&I\n\nCB&I、Shell、GenH2、NASA Marshall及休斯敦大学合作研究大型液氢储罐；GenH2为项目技术参与方。\n\n2025年：大型液氢储罐概念设计完成。设计研究覆盖最高100,000 m³的储罐概念。 采用较小示范罐进行材料、隔热与运行周期验证。\n\n原始来源：[GenH2 / CB&I](https://genh2.com/press-release/liquid-hydrogen-storage-tank-first-commercial-scale-design-demonstrated-by-cbi-and-shell/)\n\n### 中集安瑞科\n\n中集安瑞科提供液氢储罐等低温装备；公司称2013年曾向海南文昌交付300m³液氢储罐。2025年披露的国内首台液氢球罐通过国家重点专项评审验收。\n\n2013年：文昌300m³液氢储罐交付。公司产品页记载该项交付发生于2013年。 2025年度公司披露另有国家重点专项液氢球罐通过专家评审验收；未据此推断批量商业投运。\n\n原始来源：[中集安瑞科](https://www.enricgroup.com/zhongyouchucun)\n\n2025年：国家重点专项液氢球罐通过评审验收。交付对象为国家重点专项；通过专家评审验收。 报道未披露储罐容积、静态蒸发率或液氢全链条运行数据。\n\n原始来源：[中集安瑞科](https://tc.enricgroup.com/companyupdate/97)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "液氢储运政策与应用",
      "title": "液氢储运政策与应用",
      "content": "### 政策与应用范围\n\n中国2022年氢能中长期规划将低温液氢列入储运技术发展方向，不能据此宣布已形成全国液氢储能装机。液氢的需求包括航天、工业配送和交通燃料；只有含制氢、库存调度和用氢发电的明确边界，才构成电—氢—电储能系统。国际海运示范的货罐m³与液化工厂t/day也不是同一类产能。\n\n来源：[国家氢能规划原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/P020220323314396580505.pdf)；[DOE物理储氢](https://www.energy.gov/cmei/fuels/physical-hydrogen-storage)。",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "氢库存、液化功与净电量",
      "title": "氢库存、液化功与净电量",
      "content": "### 交付任务与系统约束\n\n| 场景 | 价值 | 代价 | 必需指标 |\n|---|---|---|---|\n| 大宗氢配送与航运 | 提高体积密度，降低对极高储存压力的依赖 | 液化耗电、装卸漏热、蒸发气 | 实装kg、罐m³、损耗时间窗、液化kWh/kg |\n| 长距离重载交通 | 容量与补能时间可满足部分高强度任务 | 站点、低温设备、停车持液管理 | 载荷、耗氢、加注流程、停车条件 |\n| 航天地面设施 | 可集中储存并在短时间提供大量推进剂 | 大流量供液、发射周转、持续漏热 | 有效罐容、供液能力、验证状态 |\n| 长时电储能 | 氢库存可与发电装置功率分开配置 | 液化和维冷进一步增加链条耗能 | 电解+液化+储存+发电的全链净电效率 |\n\n液氢的低位热值仍是约33.3 kWh/kg；液化改变体积密度，不提高每千克氢的化学热值。库存保持能力与能量效率是两个问题：即使主动零蒸发保持住全部氢，也必须计算制冷用电。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "hydrogen-liquid-policy",
    "label": "储运关键技术与示范",
    "title": "储运关键技术与示范",
    "year": "2022",
    "copy": "国家氢能规划支持储运关键材料装备和示范应用。工程需求按实际氢质量、工况与终端用途计量。",
    "facts": [
      [
        "2021—2035规划",
        "2022发布，储运研发和示范"
      ],
      [
        "kg H₂ / 温压 / 用途",
        "项目边界独立，非电储总容量"
      ]
    ],
    "subject": "scene:hydrogen-policy"
  },
  "market": {
    "id": "hydrogen-liquid-market",
    "label": "供氢设施与应用需求",
    "title": "供氢设施与应用需求",
    "year": "应用",
    "copy": "生产、库存、运输和消费各有独立尺度。按具体项目区分氢流量、装置设计能力与已运行状态。",
    "facts": [
      [
        "最多85kg H₂",
        "双罐合计规格"
      ],
      [
        "约10—15min",
        "企业sLH₂加注流程"
      ],
      [
        "100辆 / 2026年底",
        "小批量客户投放计划"
      ]
    ],
    "subject": "route:hydrogen-liquid:history"
  },
  "historySubject": "route:hydrogen-liquid:history",
  "note": "独立氢储运原始研究",
  "papers": {
    "id": "hydrogen-liquid-papers",
    "label": "低温试验及液化投入",
    "title": "低温试验及液化投入",
    "year": "原始证据",
    "copy": "原始研究分别评价材料、设备和具体应用，数值连同温压、分母与尺度阅读。",
    "facts": [
      [
        "390W@20K",
        "NASA2017制冷量，非电耗"
      ],
      [
        "10—13kWh/kg H₂",
        "DOE旧报告典型液化耗电，含当时工况"
      ]
    ],
    "subject": "material:hydrogen-liquid-vessel"
  },
  "storage": {
    "id": "hydrogen-liquid-storage",
    "label": "氢库存、液化功与净电量",
    "title": "氢库存、液化功与净电量",
    "year": "应用",
    "copy": "液化提高体积密度，氢的每kg化学热值保持不变。净电输出还要计液化、维冷和发电损失。",
    "facts": [
      [
        "约33.3kWh/kg H₂",
        "低位热值LHV，液化不改变每kg化学热值"
      ],
      [
        "电解+液化+维冷+发电",
        "电—氢—电完整净电量边界"
      ]
    ],
    "subject": "route:hydrogen-liquid:history"
  },
  "showMarketChart": false
};

export const solidHydrogenResearch: ChronicleResearch = {
  "name": "固态储氢",
  "timeline": [
    {
      "id": "hydrogen-solid-1970",
      "yearNumber": 1970,
      "year": "1970",
      "label": "金属间化合物研究室温吸氢",
      "title": "金属间化合物研究室温吸氢",
      "copy": "合金组成与平衡压力成为可逆吸放氢设计变量。早期Philips材料节点建立气固平衡研究。",
      "facts": [
        [
          "室温可逆吸氢",
          "Philips1970机构原始出版物目录"
        ]
      ],
      "detail": "Philips 的 van Vucht、Kuijpers 与 Bruning 报告金属间化合物在室温下可逆吸收大量氢，储氢研究开始围绕合金组成与平衡压力展开。\n\n原文为 Philips Research Reports 25，133–140；机构原始出版物目录保存论文。这里不将文章年份说成所有金属吸氢现象的起源，也不从目录推算储量。\n\n储氢容器中的材料开始直接参与气固平衡；关键问题从单纯提高气体压力，转向吸放氢平台、滞后和活化。早期材料结果仍不能代表含容器的系统质量容量。",
      "source": "https://www.philips.com/c-dam/corporate/research/downloads-publications/Philips-Research-100-years-of-patents-and-publications-june2014.pdf",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-1974",
      "yearNumber": 1974,
      "year": "1974",
      "label": "FeTi成为可逆氢化物体系",
      "title": "FeTi成为可逆氢化物体系",
      "copy": "铁钛氢化物研究提供后续固定式合金材料基础。表面氧化、活化与杂质影响实际使用。",
      "facts": [
        [
          "FeTi体系",
          "1974纸刊；2002网页上线日期另计"
        ]
      ],
      "detail": "Reilly 与 Wiswall 的铁钛氢化物论文系统讨论合金与氢化物形成，为后来低成本 TiFe 系储氢材料提供基础。\n\nInorganic Chemistry 13(1)，218–222，纸刊日期 1974-01-01；网页 2002 年上线日期不是发现年份。此节点引用出版商书目信息，不补未读取全文的实验性能。\n\n铁、钛构成的储氢合金为后续固定式装置提供候选体系。实际工作仍须解决表面氧化、首次活化、杂质气体和粉化造成的性能变化。",
      "source": "https://pubs.acs.org/doi/abs/10.1021/ic50131a042",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-1997",
      "yearNumber": 1997,
      "year": "1997",
      "label": "钛催化改善铝氢化钠循环",
      "title": "钛催化改善铝氢化钠循环",
      "copy": "钛组分促进NaAlH₄再氢化，复杂氢化物进入可逆研究。分步反应与供热条件仍决定可用量。",
      "facts": [
        [
          "约4.2—3.1wt% H₂",
          "NaAlH₄材料循环容量"
        ],
        [
          "约>150°C / 60—150bar",
          "原论文讨论工作条件，不与Na₃AlH₆相加"
        ]
      ],
      "detail": "Bogdanović 与 Schwickardi 将少量钛组分引入 NaAlH₄，证明复杂氢化物可以通过催化改善再氢化。\n\n论文报告 NaAlH₄ 系循环可逆容量约 4.2–3.1 wt% H₂；讨论的工作条件为约 150°C 以上、氢压 60–150 bar。另一组 Na₃AlH₆ 数据不能与它相加。\n\n研究从传统金属间化合物拓展到轻元素复杂氢化物。质量容量提高的同时，放氢需要供热、反应分步进行，循环稳定性与装置热管理仍是约束。",
      "source": "https://doi.org/10.1016/S0925-8388(96)03049-6",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2003",
      "yearNumber": 2003,
      "year": "2003",
      "label": "MOF以孔结构调节吸附",
      "title": "MOF以孔结构调节吸附",
      "copy": "可设计微孔与内表面形成物理吸附方向。温度、压力与成型密度共同决定可交付氢量。",
      "facts": [
        [
          "78K测量",
          "原研究含低温/室温，非同等常温容量"
        ]
      ],
      "detail": "Rosi 等在 Science 报告金属有机框架储氢，提出用可设计微孔与大内表面调节氢吸附。\n\n原始研究同时讨论低温与室温吸附；78 K 测量不能等同常温储存。早期论文的材料吸附量不在此作为当前工程性能排名。\n\n物理吸附成为独立于化学氢化物的材料方向；孔容、吸附热、温度、充放压力和成型密度共同决定可交付氢量。粉末吸附量高，不等于成型床和容器密度高。",
      "source": "https://yaghi.berkeley.edu/pdfPublications/1127.pdf",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "TiFe材料检验工业放大",
      "title": "TiFe材料检验工业放大",
      "copy": "工业制备合金按可用压力窗口测试。批次质量、氧化和杂相改变活化与储氢平台。",
      "facts": [
        [
          "5kg合金 / 约1.0wt% H₂",
          "合金质量分母，55°C、25→1bar"
        ],
        [
          "250次",
          "原论文循环稳定性"
        ]
      ],
      "detail": "Barale 等研究工业规模制备的 TiFe 基合金，把储氢评价推进到材料放大后的成分、氧化和循环表现。\n\n工业合金批次为 5 kg；在 55°C、25→1 bar 压力窗口下，可用容量约 1.0 wt% H₂，报告 250 次循环稳定性。5 kg 是合金质量，不是所储氢质量。\n\n容量必须按应用可用压力窗口计算；工业原料、杂相和表面状态会改变活化与平台行为，单个实验室最佳样品不能替代批次制造验证。",
      "source": "https://air.uniud.it/retrieve/d4fab98a-07c9-4ed2-b500-d96d12b279c8/2022%20Barale%20-%20IJHE.pdf",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "HyCARE耦合氢化物与相变热",
      "title": "HyCARE耦合氢化物与相变热",
      "copy": "TiFe系统用相变蓄热回收吸氢热并支持放氢。氢库存与热库存分别设计。",
      "facts": [
        [
          "最高46kg H₂",
          "20ft箱、12储氢罐，2023-04展示"
        ],
        [
          "<50barg / <100°C",
          "项目运行范围，未宣称电到电效率"
        ]
      ],
      "detail": "HyCARE 在巴黎展示 TiFe 氢化物储氢系统，利用相变蓄热回收吸氢热并支持后续放氢。\n\n2023-04-21 展示；项目报告为 20 英尺集装箱、12 个储氢罐、最高 46 kg H₂，压力低于 50 barg、温度低于 100°C。连接 PEM 电解槽和燃料电池，是示范系统。\n\n热源、换热回路和储氢材料成为一个整体。项目报告的 91.5%“roundtrip”缺少可在同页确认的完整电解—发电边界，不作为电到电效率展示。",
      "source": "https://cordis.europa.eu/project/id/826352/reporting",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "Flatirons金属氢化物系统commissioned",
      "title": "Flatirons金属氢化物系统commissioned",
      "copy": "NREL与GKN Hydrogen、SoCalGas推进500 kg级金属氢化物系统集成示范，当前用途是性能与系统耦合验证。",
      "facts": [
        [
          "最多500 kg H₂",
          "两个20英尺箱体的集成示范"
        ],
        [
          "1.25 MW / 1 MW",
          "PEM电解槽 / 燃料电池"
        ]
      ],
      "detail": "NREL与GKN Hydrogen、SoCalGas推进500 kg级金属氢化物系统集成示范，当前用途是性能与系统耦合验证。\n\n最多500 kg H₂，两个20英尺ISO箱。 与1.25 MW电解槽、1 MW燃料电池形成电—氢—电研究链；完整往返效率未在报道中给出。",
      "source": "https://www.nrel.gov/news/program/2024/heavy-metal-debut-a-world-class-metal-hydride-system.html",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "镁基催化改善多个反应步骤",
      "title": "镁基催化改善多个反应步骤",
      "copy": "Ti—Ni双位点同时影响解离、扩散和成核。低温与快速释氢各有自己的可释放量。",
      "facts": [
        [
          "280°C / 2min / 5.28wt% H₂",
          "一组材料释放结果"
        ],
        [
          "180°C / 60min / 1.96wt% H₂",
          "另一组材料结果，释放背压摘要未全列"
        ]
      ],
      "detail": "Ti–Ni 双活性位点研究同时改善氢分子解离、扩散和成核，降低镁基材料放氢的动力学障碍。\n\n2025-04-21 论文摘要报告：280°C 下 2 min 释放 5.28 wt% H₂；180°C 下 60 min 释放 1.96 wt% H₂。两组工况不可拼成“180°C、2 min、5.28%”。\n\n较低温度下能放氢不等于全部容量都能快速释放。摘要还报告超过 1000 次循环，但并未在摘要列出该循环测试全部温压条件，不能把它套在 180°C 结果上。",
      "source": "https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202500178",
      "subject": "route:hydrogen-solid:history"
    },
    {
      "id": "hydrogen-solid-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "催化界面稳定支持长循环",
      "title": "催化界面稳定支持长循环",
      "copy": "NdH₂选择性暴露与抑制团聚帮助维持镁基材料循环。研究关注反复结构变化后的有效催化位置。",
      "facts": [
        [
          ">3700次",
          "论文长循环机制节点，完整温压程序未齐，不拼低温容量"
        ]
      ],
      "detail": "Sun 等研究 NdH₂ 在 Mg–Mg₂Ni 复合材料表面的选择性暴露，利用催化与抑制颗粒团聚共同维持循环。\n\nNature Communications 于 2026-05-20 发表；题名明确超过 3700 次循环。当前可读原文摘要与正文片段未完整核齐该长循环温压程序，因此此节点展示机制与实验尺度，不将容量、低温放氢及最长循环拼成单一工况。\n\n研究从“加入催化剂”推进到催化剂在反复粉化、氧化和相变后如何留在有效位置。它仍是材料实验，不是储氢站超过 3700 次运行的证明。",
      "source": "https://www.nature.com/articles/s41467-026-73346-z",
      "subject": "route:hydrogen-solid:history"
    }
  ],
  "materials": [
    {
      "id": "hydrogen-solid-intermetallic",
      "label": "金属间化合物与压力平台",
      "title": "金属间化合物与压力平台",
      "copy": "氢进入合金晶格，吸氢放热、放氢吸热。平台压力需匹配供氢压力与可用热源。",
      "facts": [
        [
          "约1.0wt% H₂",
          "工业TiFe合金，55°C、25→1bar，材料分母"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-solid-intermetallic"
    },
    {
      "id": "hydrogen-solid-magnesium",
      "label": "镁基氢化物与供热速率",
      "title": "镁基氢化物与供热速率",
      "copy": "镁基体系提供较高材料含氢量，反应热、扩散与颗粒变化制约供氢。催化作用和供热需求分别处理。",
      "facts": [
        [
          "280°C/2min：5.28wt%",
          "2025Ti—Ni材料样品"
        ],
        [
          "180°C/60min：1.96wt%",
          "另一工况，不拼接纪录"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-solid-magnesium"
    },
    {
      "id": "hydrogen-solid-complex",
      "label": "复杂氢化物多步反应",
      "title": "复杂氢化物多步反应",
      "copy": "轻元素复杂氢化物以多步反应吸放氢。钛催化改善动力学和再氢化，温压与循环容量仍按各体系计。",
      "facts": [
        [
          "约4.2—3.1wt% H₂",
          "1997NaAlH₄材料循环容量"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-solid-complex"
    },
    {
      "id": "hydrogen-solid-adsorbent",
      "label": "多孔吸附剂与成型床",
      "title": "多孔吸附剂与成型床",
      "copy": "氢在孔表面物理吸附，温度与压力摆动改变工作容量。成型、罐体和低温辅助能耗进入系统。",
      "facts": [
        [
          "吸附/吸收分开",
          "MOF/碳孔表面，与合金晶格机制不同"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-solid-adsorbent"
    }
  ],
  "companies": [
    {
      "id": "hydrogen-solid-gkn-nrel",
      "label": "GKN / NREL",
      "year": "2024",
      "title": "Flatirons金属氢化物系统commissioned",
      "copy": "NREL与GKN Hydrogen、SoCalGas推进500 kg级金属氢化物系统集成示范，当前用途是性能与系统耦合验证。",
      "facts": [
        [
          "最多500 kg H₂",
          "两个20英尺箱体的集成示范"
        ],
        [
          "1.25 MW / 1 MW",
          "PEM电解槽 / 燃料电池"
        ]
      ],
      "subject": "company:hydrogen-solid-gkn-nrel"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "合金、复杂氢化物与系统验证",
      "title": "合金、复杂氢化物与系统验证",
      "content": "### 1970｜室温可逆吸氢进入金属间化合物研究\n\nPhilips 的 van Vucht、Kuijpers 与 Bruning 报告金属间化合物在室温下可逆吸收大量氢，储氢研究开始围绕合金组成与平衡压力展开。\n\n原文为 Philips Research Reports 25，133–140；机构原始出版物目录保存论文。这里不将文章年份说成所有金属吸氢现象的起源，也不从目录推算储量。\n\n储氢容器中的材料开始直接参与气固平衡；关键问题从单纯提高气体压力，转向吸放氢平台、滞后和活化。早期材料结果仍不能代表含容器的系统质量容量。\n\n来源：[原文](https://www.philips.com/c-dam/corporate/research/downloads-publications/Philips-Research-100-years-of-patents-and-publications-june2014.pdf)\n\n### 1974｜FeTi 成为可研究的可逆氢化物体系\n\nReilly 与 Wiswall 的铁钛氢化物论文系统讨论合金与氢化物形成，为后来低成本 TiFe 系储氢材料提供基础。\n\nInorganic Chemistry 13(1)，218–222，纸刊日期 1974-01-01；网页 2002 年上线日期不是发现年份。此节点引用出版商书目信息，不补未读取全文的实验性能。\n\n铁、钛构成的储氢合金为后续固定式装置提供候选体系。实际工作仍须解决表面氧化、首次活化、杂质气体和粉化造成的性能变化。\n\n来源：[原文](https://pubs.acs.org/doi/abs/10.1021/ic50131a042)\n\n### 1997｜钛催化让铝氢化钠具备可逆循环\n\nBogdanović 与 Schwickardi 将少量钛组分引入 NaAlH₄，证明复杂氢化物可以通过催化改善再氢化。\n\n论文报告 NaAlH₄ 系循环可逆容量约 4.2–3.1 wt% H₂；讨论的工作条件为约 150°C 以上、氢压 60–150 bar。另一组 Na₃AlH₆ 数据不能与它相加。\n\n研究从传统金属间化合物拓展到轻元素复杂氢化物。质量容量提高的同时，放氢需要供热、反应分步进行，循环稳定性与装置热管理仍是约束。\n\n来源：[原文](https://doi.org/10.1016/S0925-8388%2896%2903049-6)\n\n### 2003｜MOF 将孔结构设计带入储氢\n\nRosi 等在 Science 报告金属有机框架储氢，提出用可设计微孔与大内表面调节氢吸附。\n\n原始研究同时讨论低温与室温吸附；78 K 测量不能等同常温储存。早期论文的材料吸附量不在此作为当前工程性能排名。\n\n物理吸附成为独立于化学氢化物的材料方向；孔容、吸附热、温度、充放压力和成型密度共同决定可交付氢量。粉末吸附量高，不等于成型床和容器密度高。\n\n来源：[原文](https://yaghi.berkeley.edu/pdfPublications/1127.pdf) ；DOI：[原文](https://doi.org/10.1126/science.1083440)\n\n### 2022｜工业制备 TiFe 与实验室样品出现真实差距\n\nBarale 等研究工业规模制备的 TiFe 基合金，把储氢评价推进到材料放大后的成分、氧化和循环表现。\n\n工业合金批次为 5 kg；在 55°C、25→1 bar 压力窗口下，可用容量约 1.0 wt% H₂，报告 250 次循环稳定性。5 kg 是合金质量，不是所储氢质量。\n\n容量必须按应用可用压力窗口计算；工业原料、杂相和表面状态会改变活化与平台行为，单个实验室最佳样品不能替代批次制造验证。\n\n来源：[原文](https://air.uniud.it/retrieve/d4fab98a-07c9-4ed2-b500-d96d12b279c8/2022%20Barale%20-%20IJHE.pdf) ；DOI：[原文](https://doi.org/10.1016/j.ijhydene.2022.06.295)\n\n### 2023｜HyCARE 把氢化物和相变蓄热装入集装箱\n\nHyCARE 在巴黎展示 TiFe 氢化物储氢系统，利用相变蓄热回收吸氢热并支持后续放氢。\n\n2023-04-21 展示；项目报告为 20 英尺集装箱、12 个储氢罐、最高 46 kg H₂，压力低于 50 barg、温度低于 100°C。连接 PEM 电解槽和燃料电池，是示范系统。\n\n热源、换热回路和储氢材料成为一个整体。项目报告的 91.5%“roundtrip”缺少可在同页确认的完整电解—发电边界，不作为电到电效率展示。\n\n来源：[原文](https://cordis.europa.eu/project/id/826352/reporting)\n\n### 2025｜镁基材料的催化同时针对多个反应步骤\n\nTi–Ni 双活性位点研究同时改善氢分子解离、扩散和成核，降低镁基材料放氢的动力学障碍。\n\n2025-04-21 论文摘要报告：280°C 下 2 min 释放 5.28 wt% H₂；180°C 下 60 min 释放 1.96 wt% H₂。两组工况不可拼成“180°C、2 min、5.28%”。\n\n较低温度下能放氢不等于全部容量都能快速释放。摘要还报告超过 1000 次循环，但并未在摘要列出该循环测试全部温压条件，不能把它套在 180°C 结果上。\n\n来源：[原文](https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202500178)\n\n### 2026｜催化界面稳定成为长循环研究重点\n\nSun 等研究 NdH₂ 在 Mg–Mg₂Ni 复合材料表面的选择性暴露，利用催化与抑制颗粒团聚共同维持循环。\n\nNature Communications 于 2026-05-20 发表；题名明确超过 3700 次循环。当前可读原文摘要与正文片段未完整核齐该长循环温压程序，因此此节点展示机制与实验尺度，不将容量、低温放氢及最长循环拼成单一工况。\n\n研究从“加入催化剂”推进到催化剂在反复粉化、氧化和相变后如何留在有效位置。它仍是材料实验，不是储氢站超过 3700 次运行的证明。\n\n来源：[原文](https://www.nature.com/articles/s41467-026-73346-z) ；出版日期：[原文](https://www.nature.com/nature-index/article/10.1038/s41467-026-73346-z)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "晶格吸收和孔表面吸附",
      "title": "晶格吸收和孔表面吸附",
      "content": "### 金属间化合物｜LaNi₅、TiFe 与工作压力平台\n\n氢进入合金晶格形成氢化物，吸氢放热、放氢吸热。选材要同时匹配入口压力、使用端最低压力和可用热源；过低的平台压力会使储入的氢难以直接交付。\n\nTiFe 工业实验提供明确窗口：55°C、25→1 bar 的可用容量约 1.0 wt%。这个数值比“完全氢化的理论含氢量”更接近应用，但仍只以合金为分母。容器、换热器、流体和支架增加后，系统质量容量进一步降低。\n\n来源：[原文](https://doi.org/10.1016/j.ijhydene.2022.06.295) ；[原文](https://www.energy.gov/cmei/fuels/metal-hydride-storage-materials)\n\n### 镁基氢化物｜高含氢量与供热速率\n\nMg/MgH₂ 的价值在于轻金属体系的质量容量；制约来自反应热、氢扩散、颗粒长大与氧化。催化剂降低动力学障碍，并不自动消除反应所需热量。\n\n2025 年双位点论文清楚显示温度—时间—容量之间的取舍。放氢模块应展示温度与可用余热匹配，并将加热功率、预热时间和稳态氢流率独立考虑。材料温度不是环境温度。\n\n来源：[原文](https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202500178)\n\n### 复杂氢化物｜NaAlH₄ 的多步反应与催化\n\n复杂氢化物以轻元素组成获得较高质量含氢量，但不同反应步骤有不同平衡条件。钛掺杂的作用是促进动力学与可逆再氢化，不是将体系变为无需加热的常温储氢罐。\n\n原始研究中 NaAlH₄ 与 Na₃AlH₆ 分别评估；容量衰减、催化组分及载体质量都要计入实际床层。需要高温再生或离线再生的其他化学氢化物，不应因“固体”二字自动视作同等可逆装置。\n\n来源：[原文](https://doi.org/10.1016/S0925-8388%2896%2903049-6)\n\n### 多孔吸附剂｜MOF、碳孔道与成型换热\n\n氢主要在孔表面物理吸附，区别于进入合金晶格的吸收。吸附热较弱，使低温和压力摆动成为提升工作容量的重要手段；释氢可通过升温、降压或两者结合。\n\n实用指标是充放压力和温度之间的可交付容量。粉末比表面积、过量吸附量、绝对吸附量、成型床密度分别回答不同问题；需要将成型黏结剂、罐体和低温辅助功耗纳入系统。\n\n来源：[原文](https://yaghi.berkeley.edu/pdfPublications/1127.pdf) ；[原文](https://www.energy.gov/cmei/fuels/materials-based-hydrogen-storage)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "材料容量与系统供氢试验",
      "title": "材料容量与系统供氢试验",
      "content": "### 原始研究与工况\n\n| 年份／原始研究 | 已核结果 | 工况与分母 | 研究贡献与边界 |\n|---|---|---|---|\n| 1974 Reilly、Wiswall | FeTi 氢化物形成与性质 | 出版商书目核实；本次不提取全文性能 | 合金体系奠基；1974 纸刊日期与 2002 数字上线分开 |\n| 1997 Bogdanović、Schwickardi | NaAlH₄ 可逆循环约 4.2–3.1 wt% | 材料氢质量分数；约 >150°C、60–150 bar 的讨论条件 | 催化改善再氢化；不同反应体系不相加 |\n| 2003 Rosi 等 | MOF 储氢原始研究 | 包含低温与室温测量；不套用为系统容量 | 建立孔结构设计方向；保持温压和吸附定义 |\n| 2022 Barale 等 | 约 1.0 wt%，250 次循环 | 5 kg 工业合金批次；55°C、25→1 bar | 工业制造与可用容量窗口 |\n| 2025 Guan 等 | 5.28 wt%／2 min；1.96 wt%／60 min | 前者 280°C，后者 180°C；均为材料实验；摘要未列完整释放背压 | 多位点催化；1000 次循环不与前两工况自动合并 |\n\n来源：\n[原文](https://doi.org/10.1021/ic50131a042)\n[原文](https://doi.org/10.1016/S0925-8388%2896%2903049-6)\n[原文](https://doi.org/10.1126/science.1083440)\n[原文](https://doi.org/10.1016/j.ijhydene.2022.06.295)\n[原文](https://doi.org/10.1002/adma.202500178)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "合金与氢化物模块主体",
      "title": "合金与氢化物模块主体",
      "content": "### 材料供给与系统集成分工\n\n合金生产商负责成分、活化、杂质敏感性与批次一致性；储氢模块企业负责罐体、床层、换热及阀控；系统集成者把储氢模块与电解槽、用氢端和热源相连。三类交付物的容量和收入不能直接相加。\n\nHyCARE 的公开工程锚点是 ENGIE LAB CRIGEN 的系统安装与展示；都灵大学牵头、多方参与的科研项目不应整体写成一家公司的商业量产产品。企业简介与上市主体沿用独立企业档案，不从项目资助额推算企业规模。\n\n来源：[原文](https://cordis.europa.eu/project/id/826352/reporting)\n\n### GKN / NREL\n\nGKN Hydrogen、NREL和SoCalGas合作，在NREL Flatirons园区示范金属氢化物储氢系统；金属与氢反应形成氢化物，放氢需要供热。\n\n2024年：Flatirons金属氢化物系统commissioned。最多500 kg H₂，两个20英尺ISO箱。 与1.25 MW电解槽、1 MW燃料电池形成电—氢—电研究链；完整往返效率未在报道中给出。\n\n原始来源：[GKN / NREL](https://www.nrel.gov/news/program/2024/heavy-metal-debut-a-world-class-metal-hydride-system.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "材料装备研发及应用需求",
      "title": "材料装备研发及应用需求",
      "content": "### 政策落点是储运技术与应用验证\n\n中国《氢能产业发展中长期规划（2021—2035 年）》2022 年发布，将储运技术和关键材料装备纳入产业发展；它不是固态储氢已形成规模装机的统计。车载储氢目标也不能直接作为固定式合金模块的验收门槛。\n\n来源：[原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/t20220323_1320038.html)\n\n### 市场规模需要按应用拆分\n\n固态储氢可进入工业缓冲、固定式电解—储氢—燃料电池、分布式备用等场景。材料公斤数、系统可交付氢公斤数、制氢设备 MW、燃料电池 MW 和年氢吞吐量应独立显示；缺少独立固态路线总量时不画全国装机曲线。\n\nDOE 将材料储氢分为吸附和吸收等机制，有利于比较不同热管理需求。氢的热值属于燃料属性，不能代替完整模块或电到电循环指标。\n\n来源：[原文](https://www.energy.gov/cmei/fuels/materials-based-hydrogen-storage)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "热管理和可交付氢量",
      "title": "热管理和可交付氢量",
      "content": "### 交付任务与系统约束\n\n| 应用 | 适配理由 | 关键设计量 | 未解决的工程约束 |\n|---|---|---|---|\n| 固定式电解槽与燃料电池之间 | 可选较低压力运行并利用热耦合 | 可交付 kg H₂、出口压力、热源温度、持续氢流量 | 整机重、热响应与供热中断 |\n| 工业余热场景 | 释放所需热量可与工艺热源匹配 | 余热品位、时序、反应热与换热面积 | 余热不可用时的辅助能耗 |\n| 长时间备用 | 床层不依赖持续高压压缩维持存量 | 密封性、启动时间、备用热源 | 冷启动速度和实际待机损耗需系统试验 |\n| 交通或可移动模块 | 体积、压力与接口可能适合特定设备 | 全系统 wt%、碰撞/振动与热管理 | 不能拿粉末容量替代含罐整机质量 |\n\n### 热管理决定氢能否按时交付\n\n吸氢时及时排热可维持驱动力；放氢时供热不足会使温度与平衡压力下降，导致材料还有氢但流量不足。床层导热、颗粒粉化后的孔隙变化及换热器面积因此与材料容量同样重要。HyCARE 用相变储热耦合吸放过程，说明热储能与氢储能可以形成同一工程系统，但两类容量仍应分别计量。\n\n### 完整能量账\n\n电力输入包括电解、可能的压缩、循环泵、加热和控制；输出若是氢，按可交付质量与 LHV/HHV 表示，若是电，还须扣除燃料电池和电力电子损失。材料吸放氢回收率、储氢子系统效率和电到电效率是三个不同指标。\n\n来源：[原文](https://www.energy.gov/cmei/fuels/hydrogen-storage) ；[原文](https://cordis.europa.eu/project/id/826352/reporting)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "hydrogen-solid-policy",
    "label": "储运关键技术与示范",
    "title": "储运关键技术与示范",
    "year": "2022",
    "copy": "国家氢能规划支持储运关键材料装备和示范应用。工程需求按实际氢质量、工况与终端用途计量。",
    "facts": [
      [
        "2021—2035规划",
        "2022发布，储运研发和示范"
      ],
      [
        "kg H₂ / 温压 / 用途",
        "项目边界独立，非电储总容量"
      ]
    ],
    "subject": "scene:hydrogen-policy"
  },
  "market": {
    "id": "hydrogen-solid-market",
    "label": "供氢设施与应用需求",
    "title": "供氢设施与应用需求",
    "year": "应用",
    "copy": "生产、库存、运输和消费各有独立尺度。按具体项目区分氢流量、装置设计能力与已运行状态。",
    "facts": [
      [
        ">3700次",
        "论文长循环机制节点，完整温压程序未齐，不拼低温容量"
      ]
    ],
    "subject": "route:hydrogen-solid:history"
  },
  "historySubject": "route:hydrogen-solid:history",
  "note": "独立氢储运原始研究",
  "papers": {
    "id": "hydrogen-solid-papers",
    "label": "材料容量与系统供氢试验",
    "title": "材料容量与系统供氢试验",
    "year": "原始证据",
    "copy": "原始研究分别评价材料、设备和具体应用，数值连同温压、分母与尺度阅读。",
    "facts": [
      [
        "约1.0wt% / 250次",
        "工业TiFe，55°C、25→1bar，5kg合金批次"
      ],
      [
        "280°C / 180°C",
        "镁基不同温度的释放时间/容量分组"
      ]
    ],
    "subject": "material:hydrogen-solid-intermetallic"
  },
  "storage": {
    "id": "hydrogen-solid-storage",
    "label": "热管理和可交付氢量",
    "title": "热管理和可交付氢量",
    "year": "应用",
    "copy": "吸放氢热管理决定可交付氢流量。材料、罐体与电解及用氢端共同构成系统。",
    "facts": [
      [
        "吸氢排热 / 放氢供热",
        "温度与平台压力共同决定供氢流量"
      ],
      [
        "LHV/HHV与净电量",
        "氢输出用质量/热值，回发电计辅助及燃料电池损失"
      ]
    ],
    "subject": "route:hydrogen-solid:history"
  },
  "showMarketChart": false
};

export const carrierHydrogenResearch: ChronicleResearch = {
  "name": "化学载体储氢",
  "timeline": [
    {
      "id": "hydrogen-carrier-1913",
      "yearNumber": 1913,
      "year": "1913",
      "label": "工业合成氨建立载体基础",
      "title": "工业合成氨建立载体基础",
      "copy": "BASF Oppau以工业规模把氮与氢结合。早期装置服务肥料，现代燃料用途另看氢源和终端流程。",
      "facts": [
        [
          "1913工业合成氨",
          "BASF历史记载，原用途肥料"
        ]
      ],
      "detail": "BASF 在 Oppau 投运工业合成氨装置，使氮与氢的化学结合进入规模制造。\n\n1913 年投运来自 BASF 企业历史；当时主要服务肥料工业，不是可再生电力储能工程。\n\n后来氨作为能源载体可利用既有化工经验，但从化肥原料转为低排放燃料，还必须重构制氢来源、运输和终端利用。工业历史不能直接证明现代电到氨到电链条已成熟。",
      "source": "https://www.basf.com/hr/hr/who-we-are/History/chronology/1902-1924/1913",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2008",
      "yearNumber": 2008,
      "year": "2008",
      "label": "甲酸胺加合物室温供氢",
      "title": "甲酸胺加合物室温供氢",
      "copy": "钌膦体系在室温释放氢并连接燃料电池。载体再生还包含CO₂、胺和催化体系回收。",
      "facts": [
        [
          "室温催化",
          "甲酸胺加合物/H₂—O₂燃料电池实验"
        ]
      ],
      "detail": "Loges 等报告钌膦催化体系在室温从甲酸胺加合物产生氢，并连接 H₂/O₂ 燃料电池。\n\n论文在线发表于 2008-05-06；原始摘要确认室温与燃料电池应用，但没有在摘要公开完整循环与系统效率，不补填此类数值。\n\n液体前体可以按需求释放氢；不过反应剂包含胺及催化体系，不能将纯甲酸化学含氢量当作完整供氢装置比能量。CO₂ 回收与再氢化决定能否形成闭环。",
      "source": "https://onlinelibrary.wiley.com/doi/10.1002/anie.200705972",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "甲醇与DBT载体分别推进",
      "title": "甲醇与DBT载体分别推进",
      "copy": "水相甲醇降低放氢温度，DBT研究可循环工业液体。碳流、贫氢载体和供热需求各不相同。",
      "facts": [
        [
          "65—95°C / 常压",
          "Ru催化水相甲醇实验"
        ],
        [
          "TOF4700h⁻¹ / TON>350000",
          "催化周转指标，非装置循环次数"
        ],
        [
          "DBT约6.2wt% / >260°C",
          "载体材料与脱氢条件，2013在线/2014卷期"
        ]
      ],
      "detail": "甲醇水相催化降低放氢温度；DBT 研究则把可循环液体载体拓展到工业导热油体系。\n\nNielsen 等 2013-02-27 论文报告 Ru 配合物催化、65–95°C、常压产氢，催化 TOF 可达 4700 h⁻¹、TON 超过 350000；二者不是整套设备循环次数。Brückner 等 DBT 论文 2013-08-16 在线、2014 年纸刊：载氢约 6.2 wt%，催化脱氢温度高于 260°C。\n\n甲醇路径伴随 CO₂，DBT 路径保留贫氢有机载体；两者都能利用液体操作，但物质回收和供热需求不同。实验催化活性不等于商业连续寿命。",
      "source": "https://www.nature.com/articles/nature11891",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2014",
      "yearNumber": 2014,
      "year": "2014",
      "label": "MCH脱氢验证连续中试",
      "title": "MCH脱氢验证连续中试",
      "copy": "千代田把MCH脱氢推进到长时间连续运行。催化剂稳定性与分离、杂质和载体回运同时影响应用。",
      "facts": [
        [
          "10000h",
          "千代田披露连续中试时长"
        ]
      ],
      "detail": "千代田将甲基环己烷脱氢从实验室推进至长时间连续中试。\n\n企业技术页将 2011 年列为实验室成功、2014 年列为 10000 h 连续运行中试验证。该时长是企业披露的连续试验，不是整个国际供应链寿命。\n\n连续催化剂稳定性开始成为运输路线的关键指标；还需证明原料杂质、启停、分离以及贫氢甲苯回运下的长期表现。",
      "source": "https://www.chiyodacorp.com/en/service/lowcarbon/hydrogen/lohc-mch/",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2020",
      "yearNumber": 2020,
      "year": "2020",
      "label": "AHEAD完成跨海载体示范",
      "title": "AHEAD完成跨海载体示范",
      "copy": "文莱制氢、MCH合成、运输与日本释放端连接运行。原始示范使用天然气氢源。",
      "facts": [
        [
          "约210t H₂/年",
          "最大设施供给能力，非全年交付实绩"
        ],
        [
          "2020-12完成",
          "国际示范，初始氢源天然气"
        ]
      ],
      "detail": "AHEAD 把制氢、MCH 合成、跨海运输及日本端释放使用串成国际示范链。\n\nNEDO 发布国际示范启动，千代田确认示范于 2020 年 12 月完成。原文所述约 210 t H₂/年为设施最大供给能力，不是已交付全年实绩；文莱氢源为天然气，不能标为可再生绿氢。\n\n验证了跨地点载体循环和设备接口；它证明供应链可运行，并不意味着其初始氢源已经低排放，也不提供电到电效率。",
      "source": "https://www.nedo.go.jp/news/press/AA5_101322.html",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2022",
      "yearNumber": 2022,
      "year": "2022",
      "label": "化学品船运输MCH",
      "title": "化学品船运输MCH",
      "copy": "MCH利用既有液体化工储罐和承运设施。日本炼厂接收端完成运输示范。",
      "facts": [
        [
          "2022-02-04到港",
          "此前新加坡既有室外罐保存数月"
        ]
      ],
      "detail": "MCH 运输进一步验证与传统液体化工物流的衔接。\n\n千代田 2022-02-08 公告称首艘化学品船于 2 月 4 日到达日本炼厂接收设施；MCH 曾在新加坡既有室外储罐保存数月，再装船运输。\n\n储存和运输不必全程维持氢的高压或深冷状态，但仍需专用脱氢能力、产品分离及载体物流。此事件是运输示范，不是商业全年吞吐量认证。\n\nErlangen LOHC供氢站投运。释放能力9,000 kg H₂/year，地下储存1.5 t H₂。 30英尺ReleaseBox 10约1 kg/h，放氢后加压至45 bar并接入350/700 bar加注链。",
      "source": "https://www.chiyodacorp.com/media/20220208_E_R1.pdf",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "碧南机组完成氨替代试验",
      "title": "碧南机组完成氨替代试验",
      "copy": "JERA与IHI将氨直接用于大型机组燃烧。热量替代比例与机组总输出分别记录。",
      "facts": [
        [
          "20%按燃料热值",
          "氨替代比例，2024试验完成"
        ],
        [
          "1GW整机",
          "煤—氨机组额定输出，非氨单独功率"
        ]
      ],
      "detail": "JERA 与 IHI 在碧南 4 号机完成 20% 氨燃料替代示范，将载体直接作为燃料利用。\n\n2024-04-10 在额定输出 1 GW 时达到 20% 替代；比例按燃料热值计，6 月 26 日宣布试验结束。1 GW 为整个煤—氨机组输出，不是储氨容量或氨单独发电功率。\n\n氨可以不先分解成纯氢而进入发电端。试验关注燃烧与排放，无法单独推导制氨—储运—发电的电往返效率；原料碳足迹仍由上游决定。\n\nUlsan电驱氨裂解系统完成现场性能测试。新闻稿记录2024年12月完成现场测试。 最佳试验点为290 kg H₂/day、99%转化率、81%能效、11 kWh/kg-H₂。",
      "source": "https://www.jera.co.jp/en/news/notice/20240626_1954",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "Kassø电子甲醇投运交付",
      "title": "Kassø电子甲醇投运交付",
      "copy": "可再生电力制氢与生物源CO₂合成甲醇。产品进入航运和化工客户，终端为燃料/原料。",
      "facts": [
        [
          "42000t甲醇/年",
          "设计产能，非年度实产或氢库存"
        ],
        [
          ">99.85%工业纯度",
          "2025-04公告；5月开业，半年报记交付"
        ]
      ],
      "detail": "丹麦 Kassø 将可再生电力制氢与生物源 CO₂ 合成甲醇，面向航运和化工需求。\n\n3 月产出首批粗甲醇，4 月公告工业级纯度超过 99.85%，5 月 13 日正式开业；企业半年报称已运营并向船舶交付。42000 t/年为设计甲醇产能，不是氢库存或实测全年产量。\n\n化学载体开始以燃料和化工产品对接真实客户。此项目并非把所有甲醇重新裂解成氢或发回电网；应归入电转燃料/原料应用，不虚构电储能循环。\n\n有机液体储氢脱氢催化剂完成中试放大研究。完成有机液体储氢脱氢催化剂中试放大研究。 示范装置建设推进并实现开工，报告未披露规模和投运节点。",
      "source": "https://europeanenergy.com/2025/04/03/kasso-e-methanol-facility-produces-industry-grade-e-methanol-for-the-first-time/",
      "subject": "route:hydrogen-carrier:history"
    },
    {
      "id": "hydrogen-carrier-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "电子甲醇增加多年承购",
      "title": "电子甲醇增加多年承购",
      "copy": "Kassø与OMV签订多年承购，生产和需求进一步衔接。协议属于既有设施合同安排。",
      "facts": [
        [
          "2026-08承购协议",
          "沿用既有42000t/年设计能力，不新增同规模设施"
        ]
      ],
      "detail": "Kassø 企业时间线记载 2026 年 8 月与 OMV 的多年承购协议，低排放化学载体开始进一步连接燃料法规与市场合同。\n\n这是承购协议事件，不把合同写成新增装置投运或实际交付总量；沿用既有 42000 t/年设计产能，不增加一份同等规模。\n\n稳定需求可支持生产与库存组织，但长期合同并不能替代逐年产量、能源消耗及生命周期排放披露。",
      "source": "https://europeanenergy.com/kasso/",
      "subject": "route:hydrogen-carrier:history"
    }
  ],
  "materials": [
    {
      "id": "hydrogen-carrier-lohc",
      "label": "LOHC可逆液体载体",
      "title": "LOHC可逆液体载体",
      "copy": "富氢液体在接收端催化脱氢，贫氢载体回氢化端。返程物流、分离与供热进入完整成本。",
      "facts": [
        [
          "DBT约6.2wt% / >260°C",
          "材料载氢与催化释放条件"
        ],
        [
          "389 / 6.97mPa·s@20°C",
          "富氢DBT/BT黏度，2020研究"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-carrier-lohc"
    },
    {
      "id": "hydrogen-carrier-ammonia",
      "label": "氨合成与裂解净化",
      "title": "氨合成与裂解净化",
      "copy": "氨可直接燃烧，也可裂解并净化供氢。含氮排放、残余氨和气体分离随终端要求控制。",
      "facts": [
        [
          "约17.8wt%元素氢",
          "按NH₃化学式计算，非系统可交付分数"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-carrier-ammonia"
    },
    {
      "id": "hydrogen-carrier-methanol",
      "label": "甲醇水相重整与碳流",
      "title": "甲醇水相重整与碳流",
      "copy": "甲醇释放氢同时涉及水和CO₂，也可直接作燃料/原料。低排放性依赖氢源、碳源和电源。",
      "facts": [
        [
          "65—95°C / 常压",
          "2013特定Ru水相催化，不代表所有工业装置"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-carrier-methanol"
    },
    {
      "id": "hydrogen-carrier-formic",
      "label": "甲酸选择性与CO₂回收",
      "title": "甲酸选择性与CO₂回收",
      "copy": "甲酸脱氢与产生CO副反应竞争，催化选择性关系到燃料电池用气。形成闭环还需回收与再氢化。",
      "facts": [
        [
          "室温供氢",
          "2008甲酸胺加合物实验，非纯甲酸系统容量"
        ]
      ],
      "year": "机制",
      "subject": "material:hydrogen-carrier-formic"
    }
  ],
  "companies": [
    {
      "id": "hydrogen-carrier-hydrogenious",
      "label": "Hydrogenious",
      "year": "2022",
      "title": "Erlangen LOHC供氢站投运",
      "copy": "H₂Sektor在既有加氢站加入液态有机载体输送与放氢步骤，说明示范链条已运行；并非电网级储电项目。",
      "facts": [
        [
          "9,000 kg H₂/year",
          "释放能力，2022-07投运"
        ],
        [
          "1.5 t H₂",
          "地下载体储存库存"
        ],
        [
          "约1 kg/h",
          "ReleaseBox 10放氢能力"
        ]
      ],
      "subject": "company:hydrogen-carrier-hydrogenious"
    },
    {
      "id": "hydrogen-carrier-syzygy-lotte",
      "label": "Syzygy / Lotte",
      "year": "2024",
      "title": "Ulsan电驱氨裂解系统完成现场性能测试",
      "copy": "Syzygy与Lotte Chemical在Ulsan完成试验，验证氨裂解放氢设备；该测试不涵盖全链条储电往返效率。",
      "facts": [
        [
          "290 kg H₂/day",
          "2024-12现场最佳试验点"
        ],
        [
          "99%转化率",
          "氨裂解试验"
        ],
        [
          "11 kWh/kg-H₂",
          "裂解子系统，非电往返全过程"
        ]
      ],
      "subject": "company:hydrogen-carrier-syzygy-lotte"
    },
    {
      "id": "hydrogen-carrier-sinopec-lohc",
      "label": "中国石化",
      "year": "2025",
      "title": "有机液体储氢脱氢催化剂完成中试放大研究",
      "copy": "中国石化年度报告记录催化剂中试放大完成、示范装置开工建设。催化剂研究与装置建设分别推进。",
      "facts": [
        [
          "2025中试放大",
          "有机液体储氢脱氢催化剂"
        ],
        [
          "示范装置开工",
          "2025年度报告记录的建设阶段"
        ]
      ],
      "subject": "company:hydrogen-carrier-sinopec-lohc"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "从化工基础到载体供应链",
      "title": "从化工基础到载体供应链",
      "content": "### 1913｜工业合成氨建立大宗化学载体基础\n\nBASF 在 Oppau 投运工业合成氨装置，使氮与氢的化学结合进入规模制造。\n\n1913 年投运来自 BASF 企业历史；当时主要服务肥料工业，不是可再生电力储能工程。\n\n后来氨作为能源载体可利用既有化工经验，但从化肥原料转为低排放燃料，还必须重构制氢来源、运输和终端利用。工业历史不能直接证明现代电到氨到电链条已成熟。\n\n来源：[原文](https://www.basf.com/hr/hr/who-we-are/History/chronology/1902-1924/1913)\n\n### 2008｜甲酸胺加合物实现室温催化供氢\n\nLoges 等报告钌膦催化体系在室温从甲酸胺加合物产生氢，并连接 H₂/O₂ 燃料电池。\n\n论文在线发表于 2008-05-06；原始摘要确认室温与燃料电池应用，但没有在摘要公开完整循环与系统效率，不补填此类数值。\n\n液体前体可以按需求释放氢；不过反应剂包含胺及催化体系，不能将纯甲酸化学含氢量当作完整供氢装置比能量。CO₂ 回收与再氢化决定能否形成闭环。\n\n来源：[原文](https://onlinelibrary.wiley.com/doi/10.1002/anie.200705972)\n\n### 2013｜低温甲醇放氢与导热油型 LOHC 两条路线推进\n\n甲醇水相催化降低放氢温度；DBT 研究则把可循环液体载体拓展到工业导热油体系。\n\nNielsen 等 2013-02-27 论文报告 Ru 配合物催化、65–95°C、常压产氢，催化 TOF 可达 4700 h⁻¹、TON 超过 350000；二者不是整套设备循环次数。Brückner 等 DBT 论文 2013-08-16 在线、2014 年纸刊：载氢约 6.2 wt%，催化脱氢温度高于 260°C。\n\n甲醇路径伴随 CO₂，DBT 路径保留贫氢有机载体；两者都能利用液体操作，但物质回收和供热需求不同。实验催化活性不等于商业连续寿命。\n\n来源：[原文](https://www.nature.com/articles/nature11891) ；[原文](https://chemistry-europe.onlinelibrary.wiley.com/doi/10.1002/cssc.201300426)\n\n### 2014｜MCH 脱氢连续运行验证\n\n千代田将甲基环己烷脱氢从实验室推进至长时间连续中试。\n\n企业技术页将 2011 年列为实验室成功、2014 年列为 10000 h 连续运行中试验证。该时长是企业披露的连续试验，不是整个国际供应链寿命。\n\n连续催化剂稳定性开始成为运输路线的关键指标；还需证明原料杂质、启停、分离以及贫氢甲苯回运下的长期表现。\n\n来源：[原文](https://www.chiyodacorp.com/en/service/lowcarbon/hydrogen/lohc-mch/)\n\n### 2020｜文莱至日本 MCH 供应链示范\n\nAHEAD 把制氢、MCH 合成、跨海运输及日本端释放使用串成国际示范链。\n\nNEDO 发布国际示范启动，千代田确认示范于 2020 年 12 月完成。原文所述约 210 t H₂/年为设施最大供给能力，不是已交付全年实绩；文莱氢源为天然气，不能标为可再生绿氢。\n\n验证了跨地点载体循环和设备接口；它证明供应链可运行，并不意味着其初始氢源已经低排放，也不提供电到电效率。\n\n来源：[原文](https://www.nedo.go.jp/news/press/AA5_101322.html) ；[原文](https://www.chiyodacorp.com/media/20220208_E_R1.pdf) ；[原文](https://www.bn.emb-japan.go.jp/itpr_en/20191127.html)\n\n### 2022｜化学品船承运 MCH 并利用既有储罐\n\nMCH 运输进一步验证与传统液体化工物流的衔接。\n\n千代田 2022-02-08 公告称首艘化学品船于 2 月 4 日到达日本炼厂接收设施；MCH 曾在新加坡既有室外储罐保存数月，再装船运输。\n\n储存和运输不必全程维持氢的高压或深冷状态，但仍需专用脱氢能力、产品分离及载体物流。此事件是运输示范，不是商业全年吞吐量认证。\n\n来源：[原文](https://www.chiyodacorp.com/media/20220208_E_R1.pdf)\n\n### 2024｜氨进入大型机组燃料替代试验\n\nJERA 与 IHI 在碧南 4 号机完成 20% 氨燃料替代示范，将载体直接作为燃料利用。\n\n2024-04-10 在额定输出 1 GW 时达到 20% 替代；比例按燃料热值计，6 月 26 日宣布试验结束。1 GW 为整个煤—氨机组输出，不是储氨容量或氨单独发电功率。\n\n氨可以不先分解成纯氢而进入发电端。试验关注燃烧与排放，无法单独推导制氨—储运—发电的电往返效率；原料碳足迹仍由上游决定。\n\n来源：[原文](https://www.jera.co.jp/en/news/notice/20240626_1954)\n\n### 2025｜Kassø 电子甲醇从调试进入交付\n\n丹麦 Kassø 将可再生电力制氢与生物源 CO₂ 合成甲醇，面向航运和化工需求。\n\n3 月产出首批粗甲醇，4 月公告工业级纯度超过 99.85%，5 月 13 日正式开业；企业半年报称已运营并向船舶交付。42000 t/年为设计甲醇产能，不是氢库存或实测全年产量。\n\n化学载体开始以燃料和化工产品对接真实客户。此项目并非把所有甲醇重新裂解成氢或发回电网；应归入电转燃料/原料应用，不虚构电储能循环。\n\n来源：[原文](https://europeanenergy.com/2025/04/03/kasso-e-methanol-facility-produces-industry-grade-e-methanol-for-the-first-time/) ；[原文](https://europeanenergy.com/2025/08/29/european-energy-posts-solid-h1-2025-results-achieves-record-construction-activity-and-launches-landmark-e-methanol-facility/)\n\n### 2026｜电子甲醇增加长期承购安排\n\nKassø 企业时间线记载 2026 年 8 月与 OMV 的多年承购协议，低排放化学载体开始进一步连接燃料法规与市场合同。\n\n这是承购协议事件，不把合同写成新增装置投运或实际交付总量；沿用既有 42000 t/年设计产能，不增加一份同等规模。\n\n稳定需求可支持生产与库存组织，但长期合同并不能替代逐年产量、能源消耗及生命周期排放披露。\n\n来源：[原文](https://europeanenergy.com/kasso/)\n\n原始来源：[Hydrogenious](https://hydrogenious.net/how/hrs-erlangen/)\n\n原始来源：[Syzygy / Lotte](https://www.prnewswire.com/news-releases/syzygy-plasmonics-and-lotte-chemical-unlock-ammonia-as-a-hydrogen-carrier-in-asia-successfully-complete-trial-of-ammonia-e-cracking-unit-302360343.html)\n\n原始来源：[中国石化](https://www.sinopec.com/u/cms/gfzw/202603/22170726tr36.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "LOHC、氨与含碳载体",
      "title": "LOHC、氨与含碳载体",
      "content": "### LOHC｜甲苯/MCH 与 BT/DBT 可逆载体\n\n富氢液体运输后催化脱氢，贫氢载体回到氢化端；反应器的氢气与液体分离、催化剂稳定性、载体补充和返程物流决定完整成本。\n\nDBT 原始研究报告约 6.2 wt% 载氢，脱氢温度高于 260°C。这是载体体系材料指标；加上储罐、反应器、换热器后系统质量比下降。MCH 与 DBT 不共享同一温度、蒸气压和分离条件。\n\n2020 年原始混配研究把黏度作为工程问题：20°C 下 H₀-DBT/H₁₈-DBT 分别约 49/389 mPa·s，H₀-BT/H₁₂-BT 约 3.94/6.97 mPa·s。富氢与贫氢液体差别会影响冬季泵送及孔内扩散。\n\n来源：[原文](https://doi.org/10.1002/cssc.201300426) ；[原文](https://www.sciencedirect.com/science/article/abs/pii/S0360319920312428)\n\n### 氨｜合成、储罐与裂解净化\n\nNH₃ 可以直接作为燃料，也可以按 2NH₃→N₂+3H₂ 裂解后净化供氢。前者重点是燃烧稳定性与含氮排放，后者还要控制残余氨和氮气分离，以适应用氢设备。\n\n氨的理论元素氢质量分数约 17.8%（按化学式计算），不是设备可交付质量分数；若做能源比较，必须包括合成、压缩或制冷、裂解供热与净化。碧南 20% 是热量替代比例，不可转换成“20% 储能效率”。\n\n来源：[原文](https://www.jera.co.jp/en/news/notice/20240626_1954) ；[原文](https://www.basf.com/hr/hr/who-we-are/History/chronology/1902-1924/1913)\n\n### 甲醇｜含碳载体与水相重整\n\n理想水相重整可写为 CH₃OH+H₂O→CO₂+3H₂；放氢同时涉及水与碳流，不能只按甲醇质量计算后再与含水系统比较。它也能作为直接燃料或化工原料使用。\n\n2013 年均相 Ru 催化实验的 65–95°C、常压属于特定反应体系，不能作为所有工业甲醇重整器的工作条件。TOF 与 TON 衡量催化周转，不等于储氢循环寿命。甲醇的低排放性还依赖氢源、碳源和用电来源。\n\n来源：[原文](https://www.nature.com/articles/nature11891) ；[原文](https://europeanenergy.com/kasso/)\n\n### 甲酸｜选择性脱氢与 CO₂ 回收\n\n甲酸脱氢通道 HCOOH→H₂+CO₂ 与生成 CO 的副反应竞争；催化选择性关系到后端燃料电池能否直接使用气体。甲酸盐、胺加合物与纯甲酸的总质量和再生方式不同。\n\n2008 年实验展示室温供氢和燃料电池连接；要形成储能闭环还需 CO₂ 的收集、再氢化，以及溶剂、胺和催化剂回收。不能用一次释氢演示证明全流程可无限循环。\n\n来源：[原文](https://doi.org/10.1002/anie.200705972)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "催化与液体物性原始研究",
      "title": "催化与液体物性原始研究",
      "content": "### 原始研究与工况\n\n| 论文 | 关键结果 | 实际条件 | 尺度与未解决问题 |\n|---|---|---|---|\n| Loges 等，2008 | 室温催化产氢并供 H₂/O₂ 燃料电池 | 甲酸胺加合物、钌膦体系 | 实验验证；载体再生与全系统重量不由摘要给出 |\n| Nielsen 等，2013 | TOF 4700 h⁻¹；TON >350000 | Ru 配合物、水相甲醇、65–95°C、常压；不同最优催化数据不强行归一工况 | 催化周转指标；不是电到电效率或装置循环次数 |\n| Brückner 等，2013 在线／2014 纸刊 | DBT 约 6.2 wt% 载氢 | 催化脱氢 >260°C；材料体系分母 | 证明可逆液体载体；不包括储罐与反应器质量 |\n| BT/DBT 混配研究，2020 | 富氢 DBT 与 BT 在 20°C 下黏度约 389 与 6.97 mPa·s | 旋转流变测量；论文研究 1–80°C 和不同剪切速率 | 泵送与混配选择；黏度不是氢释放速率 |\n\n来源：\n[原文](https://doi.org/10.1002/anie.200705972)\n[原文](https://doi.org/10.1038/nature11891)\n[原文](https://doi.org/10.1002/cssc.201300426)\n[原文](https://www.sciencedirect.com/science/article/abs/pii/S0360319920312428)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "载体转换与供氢主体",
      "title": "载体转换与供氢主体",
      "content": "### 工艺、承运与消费端共同构成项目\n\n千代田的工程证据主要对应 MCH 脱氢和跨境示范；其技术不能自动套给 BT/DBT。European Energy/Mitsui 的 Kassø 对应电子甲醇制造；JERA/IHI 对应氨终端燃烧示范。企业各自所在环节不同，制氢 MW、合成 t/年、运输吨数与发电 MW 应保留原始口径。\n\n企业简介与图片采用独立档案。储运企业的化工设施可服务多种来源燃料，只有核实具体氢源和项目流程后，才标为可再生氢或电储能。\n\n来源：[原文](https://www.chiyodacorp.com/en/service/lowcarbon/hydrogen/lohc-mch/) ；[原文](https://europeanenergy.com/kasso/) ；[原文](https://www.jera.co.jp/en/news/notice/20240626_1954)\n\n### Hydrogenious\n\nHydrogenious LOHC Technologies开发以苄基甲苯为载体的液态有机储氢与放氢系统，成立于2013年。\n\n2022年：Erlangen LOHC供氢站投运。释放能力9,000 kg H₂/year，地下储存1.5 t H₂。 30英尺ReleaseBox 10约1 kg/h，放氢后加压至45 bar并接入350/700 bar加注链。\n\n原始来源：[Hydrogenious](https://hydrogenious.net/how/hrs-erlangen/)\n\n### Syzygy / Lotte\n\nSyzygy Plasmonics提供电驱氨裂解反应器，Lotte Chemical提供Ulsan测试现场，Sumitomo提供物流支持；氨作为氢载体后需裂解释放氢。\n\n2024年：Ulsan电驱氨裂解系统完成现场性能测试。新闻稿记录2024年12月完成现场测试。 最佳试验点为290 kg H₂/day、99%转化率、81%能效、11 kWh/kg-H₂。\n\n原始来源：[Syzygy / Lotte](https://www.prnewswire.com/news-releases/syzygy-plasmonics-and-lotte-chemical-unlock-ammonia-as-a-hydrogen-carrier-in-asia-successfully-complete-trial-of-ammonia-e-cracking-unit-302360343.html)\n\n### 中国石化\n\n中国石化2025年报告披露，已完成有机液体储氢脱氢催化剂中试放大研究，示范装置建设推进并开工。\n\n2025年：有机液体储氢脱氢催化剂完成中试放大研究。完成有机液体储氢脱氢催化剂中试放大研究。 示范装置建设推进并实现开工，报告未披露规模和投运节点。\n\n原始来源：[中国石化](https://www.sinopec.com/u/cms/gfzw/202603/22170726tr36.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "氢物流、燃料与原料市场",
      "title": "氢物流、燃料与原料市场",
      "content": "### 中国氢能规划与具体载体技术\n\n2022 年国家氢能中长期规划为制储输用体系发展提供政策框架，但不代表各化学载体已形成统一电储能装机统计。路线的市场应按氢物流、燃料、化工原料及回发电四类用途拆开。\n\n来源：[原文](https://www.ndrc.gov.cn/xxgk/zcfb/ghwb/202203/t20220323_1320038.html)\n\n### 工程指标如何落在同一张项目表\n\n| 项目 | 原始规模口径 | 已证实状态 | 不可替代的另一项指标 |\n|---|---|---|---|\n| AHEAD | 约 210 t H₂/年最大设施供给能力 | 2020 国际示范完成；2022 化学品船运输 | 不是单次氢库存或全年实交量 |\n| 碧南 4 号机 | 1 GW 整机输出、20% 燃料热量来自氨 | 2024 试验完成 | 不是储氨 GWh 或电往返效率 |\n| Kassø | 42000 t 甲醇/年设计能力 | 2025 投运与交付；2026 承购协议 | 不是全年实产、氢存量或电储能容量 |",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "载体闭环与全链能量",
      "title": "载体闭环与全链能量",
      "content": "### 交付任务与系统约束\n\n| 使用目的 | 路线优势 | 主要能耗与约束 | 应展示的结果 |\n|---|---|---|---|\n| 长距离氢运输 | 液体化工设施与较高体积载氢能力 | 氢化/脱氢、返程载体、热源、产品净化 | 到站可交付 kg H₂ 与纯度 |\n| 长期液体库存 | 储罐规模可与转换功率分开配置 | 载体质量、补充损耗和转换装置投资 | 库存质量、存放期和可交付比例 |\n| 航运/工业燃料 | 可绕过回转成电的环节 | 生命周期排放、燃烧适配与排放控制 | 燃料产量及单位产品碳足迹 |\n| 电网回发电 | 能量跨时段保存、功率设备按需求配置 | 电解、合成/释放及发电串联损耗 | 完整电输入与电输出，而非单步收率 |\n\n### 合成与释放的热量不能抵消后忽略\n\n载体形成常涉及放热，释放往往需要吸热；二者发生在不同时间和地点时，热量并不能直接自动回收。集成评价须说明是否有外部余热、是否燃烧部分氢供热以及热源温度。若以外部热量补足释放，电效率可能提高，但总能量和碳边界仍包含该热输入。\n\n### 载体闭环与碳闭环\n\nLOHC 的目标是贫氢分子循环返回；氨可裂解为氮与氢，也可能直接燃烧；甲醇、甲酸释放 CO₂，需要另一条碳回收路径。把所有化工产品都称作可充电储能会掩盖这些差别，展示应以实际项目终端为准。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "hydrogen-carrier-policy",
    "label": "储运关键技术与示范",
    "title": "储运关键技术与示范",
    "year": "2022",
    "copy": "国家氢能规划支持储运关键材料装备和示范应用。工程需求按实际氢质量、工况与终端用途计量。",
    "facts": [
      [
        "2021—2035规划",
        "2022发布，储运研发和示范"
      ],
      [
        "kg H₂ / 温压 / 用途",
        "项目边界独立，非电储总容量"
      ]
    ],
    "subject": "scene:hydrogen-policy"
  },
  "market": {
    "id": "hydrogen-carrier-market",
    "label": "氢物流、燃料与化工需求",
    "title": "氢物流、燃料与化工需求",
    "year": "应用",
    "copy": "生产、库存、运输和消费各有独立尺度。按具体项目区分氢流量、装置设计能力与已运行状态。",
    "facts": [
      [
        "2026-08承购协议",
        "沿用既有42000t/年设计能力，不新增同规模设施"
      ]
    ],
    "subject": "route:hydrogen-carrier:history"
  },
  "historySubject": "route:hydrogen-carrier:history",
  "note": "独立氢储运原始研究",
  "papers": {
    "id": "hydrogen-carrier-papers",
    "label": "催化与液体物性原始研究",
    "title": "催化与液体物性原始研究",
    "year": "原始证据",
    "copy": "原始研究分别评价材料、设备和具体应用，数值连同温压、分母与尺度阅读。",
    "facts": [
      [
        "DBT约6.2wt%",
        "材料分母；释放>260°C，2013在线"
      ],
      [
        "TOF4700h⁻¹ / TON>350000",
        "2013甲醇催化周转，非储氢循环"
      ]
    ],
    "subject": "material:hydrogen-carrier-lohc"
  },
  "storage": {
    "id": "hydrogen-carrier-storage",
    "label": "载体闭环与全链能量",
    "title": "载体闭环与全链能量",
    "year": "应用",
    "copy": "载体储存化学能，转换时还需热源与回收流程。终端燃料和回发电任务分别计量。",
    "facts": [
      [
        "氢化/释放+储运+发电",
        "电输入、热输入和净电输出全链"
      ],
      [
        "氢/碳/载体回收",
        "LOHC返回贫氢液体，甲醇/甲酸需碳回路"
      ]
    ],
    "subject": "route:hydrogen-carrier:history"
  },
  "showMarketChart": false
};
