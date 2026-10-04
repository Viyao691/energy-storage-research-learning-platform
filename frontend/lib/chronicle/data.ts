export type Fact = readonly [value: string, condition: string];
export type Exhibit = { id: string; label: string; year: string; title: string; copy: string; facts: readonly Fact[]; subject: string };
export type TimelineNode = Exhibit & { yearNumber: number; detail: string; source: string };
export const families: readonly (readonly [string, readonly string[]])[] = [
  [
    "电化学储能",
    [
      "锂离子",
      "固态电池",
      "钠离子",
      "全钒液流",
      "铁铬液流",
      "锌溴液流",
      "有机液流",
      "铅酸",
      "锌基电池",
      "金属空气"
    ]
  ],
  [
    "机械储能",
    [
      "抽水蓄能",
      "绝热压缩空气",
      "常规压缩空气",
      "液态空气",
      "飞轮",
      "重力储能"
    ]
  ],
  [
    "电磁储能",
    [
      "超级电容",
      "超导磁储能"
    ]
  ],
  [
    "热储能",
    [
      "显热储能",
      "潜热储能",
      "热化学储能"
    ]
  ],
  [
    "氢储能",
    [
      "高压气态储氢",
      "液氢储能",
      "固态储氢",
      "化学载体储氢"
    ]
  ]
];
export const timeline: readonly TimelineNode[] = [
  {
    "id": "1967",
    "label": "固态电解质器件前史：Ford钠硫",
    "year": "1967",
    "yearNumber": 1967,
    "title": "固态陶瓷，连接高温钠硫",
    "copy": "固态陶瓷承担离子输运，连接约300°C下的液态反应物，形成钠硫器件前史。",
    "facts": [
      [
        "300°C",
        "钠硫器件运行温度"
      ],
      [
        "液态反应物",
        "固态陶瓷承担离子输运"
      ],
      [
        "器件前史",
        "非全固态锂电池"
      ]
    ],
    "detail": "Ford钠硫二次电池使用固态陶瓷电解质，约300°C运行，反应物为液态。这是固态电解质器件前史，不是全固态锂电池；仅确认出版社摘要，以年份归档，不补未读全文的数据。",
    "source": "https://saemobilus.sae.org/papers/a-sodium-sulfur-secondary-battery-670179",
    "subject": "scene:history"
  },
  {
    "id": "1973",
    "label": "PEO盐络合物的早期书目",
    "year": "1973",
    "yearNumber": 1973,
    "title": "聚合物盐络合物的早期节点",
    "copy": "PEO与碱金属盐络合物，为聚合物承担离子输运建立早期材料节点。",
    "facts": [
      [
        "PEO盐络合物",
        "聚合物材料支线"
      ],
      [
        "1973",
        "机构书目节点"
      ]
    ],
    "detail": "1973年11月论文记录聚环氧乙烷与碱金属盐络合物。PEO盐络合物的早期材料节点，来源为机构书目。",
    "source": "https://doi.org/10.1016/0032-3861(73)90146-8",
    "subject": "scene:history"
  },
  {
    "id": "1975",
    "label": "聚合物导电与温度关系",
    "year": "1975",
    "yearNumber": 1975,
    "title": "材料转变，影响离子输运",
    "copy": "不同盐的材料转变与导电变化，揭示聚合物结构和离子输运的联系。",
    "facts": [
      [
        "约55°C",
        "钠盐材料转变，非推荐运行温度"
      ],
      [
        "PEO盐络合物",
        "结构变化影响离子输运"
      ]
    ],
    "detail": "1975年9月Wright研究PEO盐络合物的直流导电。钠盐体系约55°C的转变是材料现象，不是电池推荐工作温度；原摘要支持温度与输运的联系。",
    "source": "https://doi.org/10.1002/pi.4980070505",
    "subject": "scene:history"
  },
  {
    "id": "1992",
    "label": "LiPON薄膜电解质",
    "year": "1992",
    "yearNumber": 1992,
    "title": "LiPON让薄膜器件形成支线",
    "copy": "LiPON结合室温输运与锂接触稳定，形成独立的薄膜器件路径。",
    "facts": [
      [
        "2×10⁻⁶S/cm",
        "25°C · LiPON电导率"
      ],
      [
        "N₂溅射",
        "Li₃PO₄制备薄膜"
      ],
      [
        "锂接触稳定",
        "出版社摘要证据"
      ]
    ],
    "detail": "Li₃.₃PO₃.₉N₀.₁₇以氮气中溅射Li₃PO₄制备，25°C电导率2×10⁻⁶S/cm，并报告与锂接触稳定。出版社摘要支持薄膜支线，不能直接等同大容量电芯量产。",
    "source": "https://www.sciencedirect.com/science/article/pii/016727389290442R",
    "subject": "scene:history"
  },
  {
    "id": "1998",
    "label": "纳米填料调控聚合物结晶",
    "year": "1998",
    "yearNumber": 1998,
    "title": "纳米填料改变聚合物结晶",
    "copy": "纳米填料抑制聚合物结晶，改善输运；温度仍明显影响电导率。",
    "facts": [
      [
        "10⁻⁴S/cm",
        "50°C · 聚合物复合材料"
      ],
      [
        "10⁻⁵S/cm",
        "30°C · 同材料体系"
      ],
      [
        "10wt%",
        "纳米填料比例"
      ]
    ],
    "detail": "1998-07-30，PEO–LiClO₄加入10wt%纳米TiO₂或Al₂O₃，约50°C为10⁻⁴S/cm、30°C为10⁻⁵S/cm。填料促进输运，温度依赖仍须保留。",
    "source": "https://www.nature.com/articles/28818",
    "subject": "scene:history"
  },
  {
    "id": "2007",
    "label": "LLZO氧化物材料节点",
    "year": "2007",
    "yearNumber": 2007,
    "title": "石榴石氧化物，进入电解质研究",
    "copy": "LLZO拓展陶瓷电解质方向，把输运、烧结和电极接触连成研究问题。",
    "facts": [
      [
        "LLZO",
        "石榴石型氧化物"
      ],
      [
        "2007-10-04",
        "原论文首次发表"
      ],
      [
        "接触工程",
        "烧结、晶界与电极接触"
      ]
    ],
    "detail": "2007-10-04，石榴石型LLZO原论文首次发表。陶瓷电解质路线由此形成重要节点，推动离子输运、烧结与电极接触的共同研究。",
    "source": "https://doi.org/10.1002/anie.200701144",
    "subject": "scene:history"
  },
  {
    "id": "2011",
    "label": "LGPS室温高离子输运",
    "year": "2011",
    "yearNumber": 2011,
    "title": "硫化物把室温输运推向新阶段",
    "copy": "LGPS降低室温输运阻力，推动硫化物研究进一步转向电极界面。",
    "facts": [
      [
        "12mS/cm",
        "室温 · LGPS材料电导率"
      ],
      [
        "LiCoO₂ / 铟",
        "原论文示范电芯结构"
      ]
    ],
    "detail": "2011-07-31，LGPS报告室温12mS/cm。展示结构为LiCoO₂/LGPS/铟，不是锂金属电池；材料电导率与负极兼容性属于不同问题。",
    "source": "https://www.nature.com/articles/nmat3066",
    "subject": "scene:history"
  },
  {
    "id": "2016",
    "label": "硫化物组成与高速输运",
    "year": "2016",
    "yearNumber": 2016,
    "title": "组成调控，继续提高硫化物输运",
    "copy": "硫化物组成调控继续提高电导率，具体组成决定低电位与倍率表现。",
    "facts": [
      [
        "25mS/cm",
        "27°C · 硫化物材料电导率"
      ],
      [
        "组成调控",
        "Li₉.₅₄Si₁.₇₄P₁.₄₄S₁₁.₇Cl₀.₃"
      ],
      [
        "低电位表现",
        "另一组成的结果分列"
      ]
    ],
    "detail": "2016-03-21，Li₉.₅₄Si₁.₇₄P₁.₄₄S₁₁.₇Cl₀.₃在27°C达25mS/cm。另一组成的低电位稳定与高温倍率结果不能拼接到同一种材料。",
    "source": "https://www.nature.com/articles/nenergy201630",
    "subject": "scene:history"
  },
  {
    "id": "2018",
    "label": "卤化物成为独立材料方向",
    "year": "2018",
    "yearNumber": 2018,
    "title": "卤化物拓展正极配合路径",
    "copy": "卤化物为高电位正极配合提供新材料，正负极两侧的界面任务进一步分开。",
    "facts": [
      [
        ">1mS/cm",
        "室温 · 卤化物材料"
      ],
      [
        "约94%",
        "库仑效率，非容量保持率"
      ],
      [
        "Li₃YCl₆ / Li₃YBr₆",
        "卤化物独立材料方向"
      ]
    ],
    "detail": "2018-09-14，Li₃YCl₆和Li₃YBr₆冷压粉体室温电导率超过1mS/cm，4V级未包覆LiCoO₂电池库仑效率最高约94%；这不是长期容量保持率。",
    "source": "https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.201803075",
    "subject": "scene:history"
  },
  {
    "id": "2020",
    "label": "银碳中间层与软包验证",
    "year": "2020",
    "yearNumber": 2020,
    "title": "银碳界面，走向软包验证",
    "copy": "银碳中间层连接锂沉积与薄负极，完整软包让压力和封装进入验证。",
    "facts": [
      [
        "0.6Ah",
        "软包样品 · 高镍正极"
      ],
      [
        ">6.8mAh/cm²",
        "正极面容量"
      ],
      [
        "490 / 2MPa",
        "约490MPa制造 / 约2MPa运行"
      ]
    ],
    "detail": "2020-03-09，硫化物高镍正极0.6Ah软包、面容量超过6.8mAh/cm²。制造约490MPa，运行约2MPa；补充表中0.64Ah配置为703Wh/L，不能直接套用摘要超过900Wh/L。",
    "source": "https://www.nature.com/articles/s41560-020-0575-z",
    "subject": "scene:history"
  },
  {
    "id": "2021",
    "label": "多层电解质约束界面反应",
    "year": "2021",
    "yearNumber": 2021,
    "title": "约束界面反应，支持长循环",
    "copy": "多层电解质借助受约束的界面反应支持长循环，测试层级与条件决定结果边界。",
    "facts": [
      [
        "10000次 / 约82%",
        "20C · 8.6mA/cm²对应试验"
      ],
      [
        "条件待补齐",
        "温度与压力尚未完整核对"
      ]
    ],
    "detail": "2021-05-12，20C、8.6mA/cm²下10000次约82%，另一1.5C试验2000次约81.3%。631.1Wh/kg基于微米级正极材料，不是完整电芯；温度与压力条件尚待补齐。",
    "source": "https://www.nature.com/articles/s41586-021-03486-3",
    "subject": "scene:history"
  },
  {
    "id": "2022",
    "label": "聚合物拓扑设计与软包实验",
    "year": "2022",
    "yearNumber": 2022,
    "title": "聚合物拓扑设计进入单层软包",
    "copy": "聚合物拓扑设计进入单层软包，升温与压力帮助维持输运和接触。",
    "facts": [
      [
        "70°C / 0.28MPa",
        "单层软包运行条件"
      ],
      [
        "42mA/g",
        "该试验倍率条件"
      ],
      [
        "200次 / 约2.5mAh",
        "样品循环与容量"
      ]
    ],
    "detail": "2022-07-19，LMFP/锂单层软包在70°C、0.28MPa、42mA/g下循环200次，容量约2.5mAh。展示聚合物设计进展，同时保留温度和样品规模。",
    "source": "https://www.nature.com/articles/s41467-022-31792-5",
    "subject": "scene:history"
  },
  {
    "id": "2023",
    "label": "氯化物组成与锂界面",
    "year": "2023",
    "yearNumber": 2023,
    "title": "氯化物组成回应锂界面问题",
    "copy": "新的氯化物组成推进锂界面研究，对称电池与全电池分别验证不同任务。",
    "facts": [
      [
        "3.02mS/cm",
        "30°C · 氯化物电导率"
      ],
      [
        "0.197eV",
        "离子输运活化能"
      ],
      [
        ">5000h",
        "锂对称电池，非全电芯寿命"
      ]
    ],
    "detail": "2023-04-05，Li₀.₃₈₈Ta₀.₂₃₈La₀.₄₇₅Cl₃在30°C为3.02mS/cm，活化能0.197eV。锂对称电池超过5000h与NCM523全电池超过100次属于不同证据，不混写寿命。",
    "source": "https://www.nature.com/articles/s41586-023-05899-8",
    "subject": "scene:history"
  },
  {
    "id": "2024",
    "label": "高载量循环、B样与标准预研",
    "year": "2024",
    "yearNumber": 2024,
    "title": "界面验证走向真实载量",
    "copy": "硅颗粒约束锂沉积，让高载量正极实现长循环；温度与压力共同支撑结果。",
    "facts": [
      [
        "6000次",
        "至约80%容量 · 55°C / 25MPa"
      ],
      [
        "15mg/cm²",
        "同试验正极载量 · 5C充电 / 5C放电"
      ]
    ],
    "detail": "2024-01-08硅约束锂沉积论文在55°C、25MPa、15mg/cm²、5C充放电下约6000次至80%；35°C另一试验约1400次。10月QSE-5 B样进入低量生产和客户测试；当年标准工作仍为预研。",
    "source": "https://www.nature.com/articles/s41563-023-01722-x",
    "subject": "scene:history"
  },
  {
    "id": "2025",
    "label": "降低运行外压与车辆测试",
    "year": "2025",
    "yearNumber": 2025,
    "title": "降低运行外压，保留制造边界",
    "copy": "双层锂硅负极减少运行外压，制造冷压、温度与锂库存仍进入工程评价。",
    "facts": [
      [
        "无运行外压",
        "45°C · 双层锂硅负极试验"
      ],
      [
        "600MPa",
        "制造冷压，非运行压力"
      ],
      [
        "183次",
        "至80%容量 · N/P6.7"
      ]
    ],
    "detail": "2025-01-25锂硅双层负极研究运行无外压，但制造600MPa、测试45°C、N/P6.7；183次至80%，1000次54.9%。5月BMW i7搭载硫化物全固态样品测试；MG4半固态批量交付归入2025。",
    "source": "https://www.nature.com/articles/s41467-025-56366-z",
    "subject": "scene:history"
  },
  {
    "id": "2026",
    "label": "中试、分类标准与条件性税收",
    "year": "2026",
    "yearNumber": 2026,
    "title": "中试与分类，让评价语言逐步统一",
    "copy": "中试线检验连续制造，术语标准明确分类；政策按各自适用条件记录。",
    "facts": [
      [
        "2026-02",
        "Eagle中试线启用"
      ],
      [
        "2026-08-28",
        "国家标准发布"
      ],
      [
        "2028-01-01",
        "该标准实施日期"
      ]
    ],
    "detail": "2月Eagle中试线启用；8月28日GB/T 48093.1-2026发布，2028-01-01才实施。9月1日起符合要求的固态电池免消费税，半固态不包含；9月28日新型电池十五五规划发布。",
    "source": "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=0DDCACACCCCB7818FBB76F0C42E022D3",
    "subject": "scene:history"
  }
];
export const materials: readonly Exhibit[] = [
  {
    "id": "sulfide",
    "label": "硫化物",
    "title": "输运快，界面决定电芯表现",
    "year": "硫化物",
    "copy": "LGPS让室温输运达到重要水平。柔顺粉体利于冷压接触，循环中的界面反应、空气稳定与密封仍决定工程表现。",
    "facts": [
      [
        "12mS/cm",
        "室温 · LGPS，2011"
      ],
      [
        "LiCoO₂ / 铟",
        "原论文示范电芯结构"
      ]
    ],
    "subject": "material:sulfide"
  },
  {
    "id": "oxide",
    "label": "氧化物",
    "title": "陶瓷输运，需要接触工程",
    "year": "氧化物",
    "copy": "LLZO形成石榴石型电解质的重要支线。烧结、晶界和电极接触共同影响总阻抗，材料稳定与电芯可制造性需要一起研究。",
    "facts": [
      [
        "LLZO",
        "2007 · 石榴石氧化物"
      ],
      [
        "晶界与接触",
        "烧结和锂界面按具体组成验证"
      ]
    ],
    "subject": "material:oxide"
  },
  {
    "id": "halide",
    "label": "卤化物",
    "title": "让正负极各有合适的界面",
    "year": "卤化物",
    "copy": "Li₃InCl₆展示高电位正极配合的可能性。正极复合层与锂接触层承担不同任务，分层或保护设计由此成为研究重点。",
    "facts": [
      [
        "1.49×10⁻³S/cm",
        "25°C · Li₃InCl₆总电导率"
      ],
      [
        "分层界面",
        "正极复合层与锂接触层分别设计"
      ]
    ],
    "subject": "material:halide"
  },
  {
    "id": "polymer",
    "label": "聚合物",
    "title": "链段运动，把温度带入设计",
    "year": "聚合物",
    "copy": "PEO的结晶与链段运动影响离子输运。增塑可以改善电导率，也改变体系组成；电站应用还要计入加热与待机能耗。",
    "facts": [
      [
        "5.64×10⁻⁶S/cm",
        "25°C · PEO₁₈LiTFSI"
      ],
      [
        "6.08×10⁻⁵S/cm",
        "25°C · 加入34wt% G4的增塑体系"
      ]
    ],
    "subject": "material:polymer"
  },
  {
    "id": "composite",
    "label": "复合体系",
    "title": "用组合回应输运与机械要求",
    "year": "复合体系",
    "copy": "陶瓷与聚合物各相比例影响连续输运和形变。材料拉伸、扣式电池与大尺寸电芯是不同验证层级，数据按对象分别阅读。",
    "facts": [
      [
        ">10⁻³S/cm",
        "55°C · 复合电解质"
      ],
      [
        "16.1MPa",
        "材料拉伸强度，非电芯压力"
      ],
      [
        "143.2mAh/g",
        "正极活性材料 · 55°C / C/20 / 30次"
      ]
    ],
    "subject": "material:composite"
  }
];
export const companies: readonly Exhibit[] = [
  {
    "id": "quantumscape",
    "label": "QuantumScape",
    "title": "QSE-5完整B样进入客户验证",
    "year": "2024",
    "copy": "固态分隔膜锂金属路线，正极侧含有机catholyte。25°C数据与45°C快充试验分别记录，下一步关注制造一致性。",
    "facts": [
      [
        "301Wh/kg",
        "25°C / C/5 · 完整封装B样"
      ],
      [
        "844Wh/L",
        "同条件 · 100%SOC受压，不含极耳"
      ],
      [
        "<15min",
        "10–80%充电 · 45°C另项试验"
      ]
    ],
    "subject": "company:quantumscape"
  },
  {
    "id": "powerco",
    "label": "PowerCo",
    "title": "A样耐久测试与生产许可",
    "year": "2024",
    "copy": "A样测试公开超过1000次、保持率超过95%；温度、倍率、压力未完整披露。40GWh/年为有条件生产许可规模。",
    "facts": [
      [
        ">1000次",
        "A样耐久测试 · 条件未完整披露"
      ],
      [
        ">95%",
        "保持率 · 企业披露"
      ],
      [
        "40GWh/年",
        "有条件生产许可，非投产量"
      ]
    ],
    "subject": "company:powerco"
  },
  {
    "id": "solid-power",
    "label": "Solid Power",
    "title": "硫化物供给进入中试路径",
    "year": "2025",
    "copy": "两条电解质中试线合计30公吨/年。2025业绩在2026年发布；75公吨/年与韩国500公吨项目仍分属建设目标与探索。",
    "facts": [
      [
        "30公吨/年",
        "两条电解质中试线能力"
      ],
      [
        "0.2–60Ah",
        "研发电芯范围"
      ],
      [
        "75公吨/年",
        "2026年底产线目标"
      ]
    ],
    "subject": "company:solid-power"
  },
  {
    "id": "bmw",
    "label": "BMW",
    "title": "全固态样品装入i7测试",
    "year": "2025",
    "copy": "2025年5月在慕尼黑测试大尺寸硫化物电芯。车辆阶段使膨胀、温度与压力管理进入实车系统评价。",
    "facts": [
      [
        "2025-05-20",
        "BMW官方车辆测试披露"
      ],
      [
        "i7",
        "硫化物全固态样品测试"
      ],
      [
        "数据缺口",
        "Wh/kg与续航未官方披露"
      ]
    ],
    "subject": "company:bmw"
  },
  {
    "id": "sk-on",
    "label": "SK On",
    "title": "两条材料路线并行开发",
    "year": "2025",
    "copy": "聚合物氧化物复合与硫化物研究分别规划商业原型。研发许可和设备验收连接工艺转移，原型目标仍按未来日期记录。",
    "facts": [
      [
        "2027",
        "复合路线商业原型目标"
      ],
      [
        "2029",
        "硫化物路线商业原型目标"
      ],
      [
        "研发许可",
        "阶段为研发合作，非量产交付"
      ]
    ],
    "subject": "company:sk-on"
  },
  {
    "id": "toyota",
    "label": "Toyota / Idemitsu",
    "title": "从小型验证到电解质供应",
    "year": "2026",
    "copy": "两座小型验证设施运行，大型中试建设目标2027年。合作先解决硫化物供给与制造，再推进更大规模商业化。",
    "facts": [
      [
        "2座",
        "运行中的小型验证设施"
      ],
      [
        "2027",
        "大型中试建设目标"
      ],
      [
        "2027–2028",
        "商业化目标"
      ]
    ],
    "subject": "company:toyota"
  },
  {
    "id": "samsung-sdi",
    "label": "Samsung SDI",
    "title": "中试样品与产品场景扩展",
    "year": "2026",
    "copy": "S-Line向客户提供样品，2026年展示机器人软包与车用方形研发方向。样品条件与封装口径仍需逐项对应。",
    "facts": [
      [
        "6500m²",
        "S-Line中试线"
      ],
      [
        "2023",
        "中试完成与送样"
      ],
      [
        "2027下半年",
        "量产目标"
      ]
    ],
    "subject": "company:samsung-sdi"
  },
  {
    "id": "prologium",
    "label": "ProLogium",
    "title": "敦刻尔克项目推进基础设施",
    "year": "2026",
    "copy": "2月奠基，9月继续基础设施与本地化。容量计划在公告中更新，按最新阶段阅读；2028年底生产仍为项目目标。",
    "facts": [
      [
        "4GWh",
        "2026年9月最新初期规划"
      ],
      [
        "44GWh",
        "同期最终规划，非当前产量"
      ],
      [
        "2028年底",
        "生产目标"
      ]
    ],
    "subject": "company:prologium"
  },
  {
    "id": "welion",
    "label": "卫蓝 / NIO",
    "title": "半固态电芯进入车辆交付",
    "year": "2023",
    "copy": "150kWh电池包完成超过1000km行程。360Wh/kg是车用电芯数据，280Ah储能电芯是另一产品规格。",
    "facts": [
      [
        "150kWh",
        "ET7电池包容量"
      ],
      [
        "360Wh/kg",
        "半固态车用电芯数据"
      ],
      [
        ">1000km",
        "2023-12-17整车行程"
      ]
    ],
    "subject": "company:welion"
  },
  {
    "id": "qingtao",
    "label": "上汽 / 清陶",
    "title": "MG4半固态批量交付",
    "year": "2025",
    "copy": "2025年报记录批量交付与中试线进度。5%液体占比尚缺质量/体积基准；全固态指标按2024路线图目标记录。",
    "facts": [
      [
        "2025",
        "MG4半固态批量交付"
      ],
      [
        "5%液体",
        "质量/体积占比基准未公开"
      ],
      [
        "400Wh/kg",
        "全固态路线图目标，非交付成绩"
      ]
    ],
    "subject": "company:qingtao"
  },
  {
    "id": "ganfeng",
    "label": "赣锋",
    "title": "工程验证与小批量试制",
    "year": "2025",
    "copy": "2025业绩披露两类验证结果，测试温度、倍率、压力和保持阈值尚待补齐。40GWh项目包含动力、储能及半固态方向。",
    "facts": [
      [
        "400Wh/kg",
        "工程验证 · 条件尚待补齐"
      ],
      [
        ">1100次",
        "容量阈值、温度、倍率未完整披露"
      ],
      [
        "500Wh/kg / 10Ah",
        "另一产品的小批量试制"
      ]
    ],
    "subject": "company:ganfeng"
  }
];
export const policy: Exhibit = {
  "id": "policy",
  "label": "政策观察",
  "year": "2026",
  "title": "术语、税收与产业规划",
  "copy": "汽车固态电池术语标准已发布，实施日为2028年。符合要求的固态电池享阶段性消费税政策，半固态不在其适用范围。",
  "facts": [
    [
      "08/28",
      "2026 · 术语分类标准发布"
    ],
    [
      "09/01起",
      "符合条件固态电池免消费税"
    ],
    [
      "09/28",
      "2026 · 十五五规划发布"
    ]
  ],
  "subject": "scene:market"
};
export const market: Exhibit = {
  "id": "market",
  "label": "中国新型储能（全部技术）",
  "year": "2025",
  "title": "新型储能的应用背景",
  "copy": "这里统计中国全部新型储能。功率、能量与平均时长分别描述供能能力、容量配置与单次持续时间，固态份额尚无独立统计。",
  "facts": [
    [
      "136GW",
      "2025年底 · 全部新型储能功率"
    ],
    [
      "351GWh",
      "同范围累计容量，非固态装机"
    ],
    [
      "2.58h",
      "平均单次时长，非年度利用小时"
    ]
  ],
  "subject": "scene:market"
};
export const marketSeries = [{year:2021,gw:4,gwh:8},{year:2022,gw:8.7,gwh:18.05},{year:2023,gw:31.39,gwh:66.87},{year:2024,gw:73.76,gwh:168.2},{year:2025,gw:136,gwh:351}] as const;
export function getTimeline(year: number) { return timeline.find(node => node.yearNumber === year) ?? timeline.find(node => node.yearNumber === 2024)!; }
