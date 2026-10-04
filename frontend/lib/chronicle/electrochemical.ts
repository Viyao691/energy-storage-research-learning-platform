import type { ChronicleResearch } from "./researchRoutes";

export const leadAcidResearch: ChronicleResearch = {
  "name": "铅酸",
  "historySubject": "route:electrochemical-lead-acid:history",
  "note": "成熟铅酸、铅碳与固定储能工程分开比较；项目功率不代替电量、效率与寿命。",
  "showMarketChart": false,
  "timeline": [
    {
      "id": "electrochemical-lead-acid-1859",
      "yearNumber": 1859,
      "year": "1859",
      "label": "Planté 的可充电铅体系",
      "title": "Planté 的可充电铅体系",
      "copy": "Planté 对铅电极的研究使蓄电池成为可以反复充电的装置。",
      "facts": [
        [
          "1859",
          "研究起点，机构历史材料口径"
        ],
        [
          "1860",
          "向法国科学院展示，非实验论文发布日期"
        ]
      ],
      "detail": "Planté 对铅电极的研究使蓄电池成为可以反复充电的装置。\n\nICTP 保存的技术讲义将研究起点记为 1859 年、向法国科学院展示记为 1860 年。此节点依据机构历史材料，未取得 1859 年实验原稿，不补当时能量密度。\n\n电极能够通过外加电流恢复化学状态，改变了只消耗材料的一次电池使用方式。早期铅板需要漫长化成，实际可利用的活性物质仍少。",
      "source": "https://indico.ictp.it/event/a0229/session/15/contribution/15/material/0/0.pdf",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-1881",
      "yearNumber": 1881,
      "year": "1881",
      "label": "Faure 将活性物质涂到极板",
      "title": "Faure 将活性物质涂到极板",
      "copy": "Faure 的涂膏方法推动铅酸从铅板化成转向活性层制造。",
      "facts": [
        [
          "1881-05-19",
          "同期报道日期"
        ],
        [
          "铅氧化物涂层",
          "历史工艺，不含现代产品循环数据"
        ]
      ],
      "detail": "Faure 的涂膏方法推动铅酸从铅板化成转向活性层制造。\n\n1881 年 5 月 19 日《Nature》同期报道描述对 Planté 装置的改进，包括在铅板上使用铅氧化物涂层。该历史报道支持工艺变化，不提供可与现代产品比较的统一寿命测试。\n\n容量不再完全依赖铅板表面缓慢生成活性层，制造和活性物质利用成为核心议题。涂层黏结、孔隙和机械保持也随之重要。",
      "source": "https://www.nature.com/articles/024068b0",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-1957",
      "yearNumber": 1957,
      "year": "1957",
      "label": "胶体电解液形成产业路线",
      "title": "胶体电解液形成产业路线",
      "copy": "Sonnenschein 的 dryfit 胶体技术将硫酸固定在凝胶结构中。",
      "facts": [
        [
          "1957",
          "企业历史年份"
        ],
        [
          "胶体电解液",
          "产品结构节点"
        ]
      ],
      "detail": "Sonnenschein 的 dryfit 胶体技术将硫酸固定在凝胶结构中。\n\nExide 官方历史将 Sonnenschein dryfit Gel 技术节点列在 1957 年；以企业历史口径记录，不将研发年份写成已核专利授权日。\n\n减少自由流动电解液，为不同安装位置及低维护应用打开空间。凝胶不意味着没有水分管理、充电控制或压力释放需求。",
      "source": "https://www.exidegroup.com/en/about-us",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-1973",
      "yearNumber": 1973,
      "year": "1973",
      "label": "密封纯铅卷绕电芯",
      "title": "密封纯铅卷绕电芯",
      "copy": "Gates 的密封纯铅电芯成为后来 CYCLON 产品的技术基础。",
      "facts": [
        [
          "1973",
          "技术历史节点"
        ],
        [
          "纯铅薄板",
          "产品结构，容量依倍率和温度"
        ]
      ],
      "detail": "Gates 的密封纯铅电芯成为后来 CYCLON 产品的技术基础。\n\nEnerSys 产品选型手册将发明记为 1973 年。薄纯铅极板与吸液玻璃纤维隔板组合，强调较短电流路径和高倍率输出。\n\n同一种铅酸反应可以通过板栅、厚度和隔板设计获得不同功率特征。薄板的大功率优势不能直接转换成长时储能的最低成本。",
      "source": "https://www.enersys.com/493c0d/globalassets/documents/product-documentation/cyclon/emea/en-cyc-sg-004_0614.pdf",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2007",
      "yearNumber": 2007,
      "year": "2007",
      "label": "UltraBattery 针对部分荷电运行",
      "title": "UltraBattery 针对部分荷电运行",
      "copy": "原始论文将非对称超级电容与铅酸单元集成，缓冲高倍率部分荷电状态的充放电。",
      "facts": [
        [
          "HRPSoC",
          "高倍率部分荷电状态测试方向"
        ],
        [
          "复合结构",
          "不能泛化为全部铅碳电池"
        ]
      ],
      "detail": "原始论文将非对称超级电容与铅酸单元集成，缓冲高倍率部分荷电状态的充放电。\n\nLam 等发表于《Journal of Power Sources》174，16–29，论文针对 HRPSoC，而非全深度每日循环。\n\n研究从单纯提高额定 Ah 转到抑制部分荷电状态下的负极失效。复合结构与向铅膏加入碳材料有关联，但不是所有铅碳产品都采用同一结构。",
      "source": "https://doi.org/10.1016/j.jpowsour.2007.05.047",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2009",
      "yearNumber": 2009,
      "year": "2009",
      "label": "大尺寸铅碳进入实验室公用事业工况",
      "title": "大尺寸铅碳进入实验室公用事业工况",
      "copy": "Sandia 对大尺寸碳增强 VRLA 的测试展示浅循环耐久性，也发现恢复充电间隔缩短。",
      "facts": [
        [
          "1,048Ah",
          "8小时率电芯"
        ],
        [
          "8,529次",
          "10% DOD部分循环，非全深循环"
        ],
        [
          "200/400A",
          "脉冲电流，按条件恢复充电"
        ]
      ],
      "detail": "Sandia 对大尺寸碳增强 VRLA 的测试展示浅循环耐久性，也发现恢复充电间隔缩短。\n\n1,048 Ah（8 小时率）电芯；主要在约 40–50% SOC 运行，累计 8,529 次 10% DOD 部分循环。测试包含 200/400 A 脉冲及按条件触发的恢复充电。\n\n结果支持风光功率平滑用途；8,529 次不是同数量的完整深循环。恢复充电前可持续的循环次数下降，说明保持容量与保持动态充电能力并非同一指标。",
      "source": "https://www.sandia.gov/ess-ssl/EESAT/2009_papers/Large%20Format%20Carbon%20Enhanced%20VRLA%20Battery%20Test%20Results.pdf",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2011",
      "yearNumber": 2011,
      "year": "2011",
      "label": "碳添加量出现明确取舍",
      "title": "碳添加量出现明确取舍",
      "copy": "负极加碳的收益受含量和电极结构影响，并非越多越好。",
      "facts": [
        [
          "约1%",
          "该配方较优区域"
        ],
        [
          ">2%",
          "该试验电阻上升"
        ]
      ],
      "detail": "负极加碳的收益受含量和电极结构影响，并非越多越好。\n\n原始配方研究的加速 PSoC 循环最优区域约为 1% 碳；超过 2% 后活性物质电阻增加。比例结论仅对该研究配方、压紧和测试程序成立。\n\n需要同时考虑导电网络、孔隙、铅活性物质比例与化成行为。单独列“含碳百分比”不足以预测储能寿命。",
      "source": "https://doi.org/10.1016/j.jpowsour.2010.11.046",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2012",
      "yearNumber": 2012,
      "year": "2012",
      "label": "East Penn 3 MW 系统投入辅助服务",
      "title": "East Penn 3 MW 系统投入辅助服务",
      "copy": "UltraBattery 从电芯试验进入 PJM 电网辅助服务。",
      "facts": [
        [
          "3MW",
          "项目功率"
        ],
        [
          "2012-06",
          "开始运行；不代表长时移峰"
        ]
      ],
      "detail": "UltraBattery 从电芯试验进入 PJM 电网辅助服务。\n\nDOE/EPRI 2013 年储能手册附录记载 East Penn 项目于 2012 年 6 月运行，功率 3 MW。本节点不从 MW 反推储电量或持续时长。\n\n现场控制、荷电窗口和并网调度成为电池价值的一部分；调频项目不能直接作为十小时调峰电站实绩。",
      "source": "https://www.energy.gov/sites/prod/files/2013/08/f2/ElecStorageHndbk2013.pdf",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "DOE 将深循环寿命列为长时突破点",
      "title": "DOE 将深循环寿命列为长时突破点",
      "copy": "成熟的铅酸供应链需要重新适配长时储能工况。",
      "facts": [
        [
          "100MW/1000MWh",
          "项目披露规模"
        ],
        [
          "约300万个",
          "项目电池数量"
        ],
        [
          "一期并网",
          "非完整公开运行验证报告"
        ]
      ],
      "detail": "成熟的铅酸供应链需要重新适配长时储能工况。\n\nDOE SI 2030 评估覆盖铅酸，研究循环寿命、制造、集流体与系统管理。其 100 MW、10 h 对比模型采用 78% 往返效率、1,370 次循环等基准参数；这些是模型输入，不是已运行电站的统一实测值。\n\n低材料成本必须与可用放电深度及更换次数一起评价。启动和备用设计无法仅靠扩大容量就满足频繁深循环需求。",
      "source": "https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lead%20Batteries.pdf",
      "subject": "route:electrochemical-lead-acid:history"
    },
    {
      "id": "electrochemical-lead-acid-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "铅产业材料流与碳排放联合建模",
      "title": "铅产业材料流与碳排放联合建模",
      "copy": "中国铅产业研究把电池需求、回收和工艺减排放到同一个材料流框架中。",
      "facts": [
        [
          "材料流与排放",
          "2024中国铅产业情景模型"
        ]
      ],
      "detail": "中国铅产业研究把电池需求、回收和工艺减排放到同一个材料流框架中。\n\nZhou 等在 2024 年 11 月发表研究，结合 1990–2020 年历史与 2021–2060 年情景。未来减排量属于模型结果，不是 2024 年已经实现的减排。\n\n储能方案的环境表现也受铅回收和再生冶炼影响。循环利用可以降低原生资源需求，不能自动消除回收过程的排放与管理成本。",
      "source": "https://www.nature.com/articles/s43247-024-01743-7",
      "subject": "route:electrochemical-lead-acid:history"
    }
  ],
  "materials": [
    {
      "id": "lead-material-pbo2",
      "label": "PbO₂正极与板栅",
      "year": "材料",
      "title": "正极反应与腐蚀支撑共同决定循环",
      "copy": "PbO₂在放电中还原为PbSO₄；板栅腐蚀、活性物质软化和脱落限制长期循环。",
      "facts": [
        [
          "PbO₂ ↔ PbSO₄",
          "正极反应主线"
        ],
        [
          "板栅",
          "提供电子通路与机械支撑"
        ]
      ],
      "subject": "material:electrochemical-lead-acid-pbo2"
    },
    {
      "id": "lead-material-negative",
      "label": "海绵铅与碳增强负极",
      "year": "材料",
      "title": "部分荷电失效促使负极加碳",
      "copy": "高倍率部分荷电下，PbSO₄结晶和充电接受能力下降是关键问题。导电碳能改变电子网络与硫酸盐形貌，但含量过多也稀释活性铅并增加电阻。",
      "facts": [
        [
          "约1%碳",
          "某一加速PSoC配方的较优区域"
        ],
        [
          ">2%碳",
          "该研究配方电阻增大，不能套作通用阈值"
        ]
      ],
      "subject": "material:electrochemical-lead-acid-sponge-lead-carbon"
    },
    {
      "id": "lead-material-electrolyte",
      "label": "硫酸、AGM与凝胶",
      "year": "材料",
      "title": "固定电解液改善布置，不消除水管理",
      "copy": "AGM以玻璃纤维毡吸持硫酸；胶体通过凝胶约束电解液。两者仍需正确浮充、电压管理及寿命末期检查。",
      "facts": [
        [
          "硫酸水溶液",
          "参与Pb/PbO₂转换"
        ],
        [
          "AGM/凝胶",
          "改变电解液固定与维护要求"
        ]
      ],
      "subject": "material:electrochemical-lead-acid-sulfuric-acid-agm-gel"
    },
    {
      "id": "lead-material-thin-plate",
      "label": "薄板纯铅卷绕",
      "year": "材料",
      "title": "缩短离子路径，提高功率输出",
      "copy": "薄纯铅板与吸液玻璃纤维隔板缩短电流路径、适合较高倍率；薄板结构的功率优势不能直接转成低成本长时容量。",
      "facts": [
        [
          "1973",
          "密封纯铅卷绕电芯技术节点"
        ],
        [
          "高倍率",
          "功率特性，不等于长时储能优势"
        ]
      ],
      "subject": "material:electrochemical-lead-acid-thin-plate-pure-lead"
    }
  ],
  "companies": [
    {
      "id": "electrochemical-lead-acid-tianneng",
      "label": "天能",
      "year": "2023",
      "title": "和平共储铅炭储能一期并网",
      "copy": "和平共储一期于2023年并网。100MW/1000MWh为公司披露的全项目规模。",
      "facts": [
        [
          "100MW/1000MWh",
          "项目官方规模，不是完整运行曲线"
        ],
        [
          "约300万个",
          "项目电池数，公司披露口径"
        ]
      ],
      "subject": "company:electrochemical-lead-acid-tianneng"
    },
    {
      "id": "electrochemical-lead-acid-enersys",
      "label": "EnerSys",
      "year": "2025",
      "title": "PowerSafe DSG固定式铅酸电池",
      "copy": "PowerSafe DSG面向工业和公用事业固定式备用。EnerSys FY2025集团净销售额36.176亿美元，不能视为铅酸储能收入。",
      "facts": [
        [
          "36.176亿美元",
          "EnerSys FY2025集团净销售额"
        ],
        [
          "PowerSafe DSG",
          "富液铅酸固定式产品"
        ]
      ],
      "subject": "company:electrochemical-lead-acid-enersys"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史脉络",
      "title": "从铅板到铅碳电网工程",
      "content": "### 1859｜Planté 的可充电铅体系\n\nPlanté 对铅电极的研究使蓄电池成为可以反复充电的装置。\n\nICTP 保存的技术讲义将研究起点记为 1859 年、向法国科学院展示记为 1860 年。此节点依据机构历史材料，未取得 1859 年实验原稿，不补当时能量密度。\n\n电极能够通过外加电流恢复化学状态，改变了只消耗材料的一次电池使用方式。早期铅板需要漫长化成，实际可利用的活性物质仍少。\n\n来源：[原始资料](https://indico.ictp.it/event/a0229/session/15/contribution/15/material/0/0.pdf)\n\n### 1881｜Faure 将活性物质涂到极板\n\nFaure 的涂膏方法推动铅酸从铅板化成转向活性层制造。\n\n1881 年 5 月 19 日《Nature》同期报道描述对 Planté 装置的改进，包括在铅板上使用铅氧化物涂层。该历史报道支持工艺变化，不提供可与现代产品比较的统一寿命测试。\n\n容量不再完全依赖铅板表面缓慢生成活性层，制造和活性物质利用成为核心议题。涂层黏结、孔隙和机械保持也随之重要。\n\n来源：[原始资料](https://www.nature.com/articles/024068b0)\n\n### 1957｜胶体电解液形成产业路线\n\nSonnenschein 的 dryfit 胶体技术将硫酸固定在凝胶结构中。\n\nExide 官方历史将 Sonnenschein dryfit Gel 技术节点列在 1957 年；以企业历史口径记录，不将研发年份写成已核专利授权日。\n\n减少自由流动电解液，为不同安装位置及低维护应用打开空间。凝胶不意味着没有水分管理、充电控制或压力释放需求。\n\n来源：[原始资料](https://www.exidegroup.com/en/about-us)\n\n### 1973｜密封纯铅卷绕电芯\n\nGates 的密封纯铅电芯成为后来 CYCLON 产品的技术基础。\n\nEnerSys 产品选型手册将发明记为 1973 年。薄纯铅极板与吸液玻璃纤维隔板组合，强调较短电流路径和高倍率输出。\n\n同一种铅酸反应可以通过板栅、厚度和隔板设计获得不同功率特征。薄板的大功率优势不能直接转换成长时储能的最低成本。\n\n来源：[原始资料](https://www.enersys.com/493c0d/globalassets/documents/product-documentation/cyclon/emea/en-cyc-sg-004_0614.pdf)\n\n### 2007｜UltraBattery 针对部分荷电运行\n\n原始论文将非对称超级电容与铅酸单元集成，缓冲高倍率部分荷电状态的充放电。\n\nLam 等发表于《Journal of Power Sources》174，16–29，论文针对 HRPSoC，而非全深度每日循环。\n\n研究从单纯提高额定 Ah 转到抑制部分荷电状态下的负极失效。复合结构与向铅膏加入碳材料有关联，但不是所有铅碳产品都采用同一结构。\n\n来源：[原始资料](https://doi.org/10.1016/j.jpowsour.2007.05.047)\n\n### 2009｜大尺寸铅碳进入实验室公用事业工况\n\nSandia 对大尺寸碳增强 VRLA 的测试展示浅循环耐久性，也发现恢复充电间隔缩短。\n\n1,048 Ah（8 小时率）电芯；主要在约 40–50% SOC 运行，累计 8,529 次 10% DOD 部分循环。测试包含 200/400 A 脉冲及按条件触发的恢复充电。\n\n结果支持风光功率平滑用途；8,529 次不是同数量的完整深循环。恢复充电前可持续的循环次数下降，说明保持容量与保持动态充电能力并非同一指标。\n\n来源：[原始资料](https://www.sandia.gov/ess-ssl/EESAT/2009_papers/Large%20Format%20Carbon%20Enhanced%20VRLA%20Battery%20Test%20Results.pdf)\n\n### 2011｜碳添加量出现明确取舍\n\n负极加碳的收益受含量和电极结构影响，并非越多越好。\n\n原始配方研究的加速 PSoC 循环最优区域约为 1% 碳；超过 2% 后活性物质电阻增加。比例结论仅对该研究配方、压紧和测试程序成立。\n\n需要同时考虑导电网络、孔隙、铅活性物质比例与化成行为。单独列“含碳百分比”不足以预测储能寿命。\n\n来源：[原始资料](https://doi.org/10.1016/j.jpowsour.2010.11.046)\n\n### 2012｜East Penn 3 MW 系统投入辅助服务\n\nUltraBattery 从电芯试验进入 PJM 电网辅助服务。\n\nDOE/EPRI 2013 年储能手册附录记载 East Penn 项目于 2012 年 6 月运行，功率 3 MW。本节点不从 MW 反推储电量或持续时长。\n\n现场控制、荷电窗口和并网调度成为电池价值的一部分；调频项目不能直接作为十小时调峰电站实绩。\n\n来源：[原始资料](https://www.energy.gov/sites/prod/files/2013/08/f2/ElecStorageHndbk2013.pdf)\n\n### 2023｜DOE 将深循环寿命列为长时突破点\n\n成熟的铅酸供应链需要重新适配长时储能工况。\n\nDOE SI 2030 评估覆盖铅酸，研究循环寿命、制造、集流体与系统管理。其 100 MW、10 h 对比模型采用 78% 往返效率、1,370 次循环等基准参数；这些是模型输入，不是已运行电站的统一实测值。\n\n低材料成本必须与可用放电深度及更换次数一起评价。启动和备用设计无法仅靠扩大容量就满足频繁深循环需求。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lead%20Batteries.pdf)\n\n### 2024｜铅产业材料流与碳排放联合建模\n\n中国铅产业研究把电池需求、回收和工艺减排放到同一个材料流框架中。\n\nZhou 等在 2024 年 11 月发表研究，结合 1990–2020 年历史与 2021–2060 年情景。未来减排量属于模型结果，不是 2024 年已经实现的减排。\n\n储能方案的环境表现也受铅回收和再生冶炼影响。循环利用可以降低原生资源需求，不能自动消除回收过程的排放与管理成本。\n\n来源：[原始资料](https://www.nature.com/articles/s43247-024-01743-7)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料结构",
      "title": "活性物质、酸液与碳添加需要联动",
      "content": "### PbO₂ 正极与承载板栅\n\n充电态正极为二氧化铅，负极为金属铅；放电时两极转为硫酸铅。活性物质发生变化时，板栅需要维持电子通路和机械支撑。正极配方与集流体结构决定可以利用多少材料，也影响循环后的脱落与腐蚀。涂膏、管式和薄板设计服务的功率与寿命目标不同。\n\n来源：[原始资料](https://www.nature.com/articles/025221a0) ；[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lead%20Batteries.pdf)\n\n### 海绵铅负极与碳复合\n\n部分荷电运行会使难以恢复的硫酸铅累积，影响负极接受充电。碳可提供导电与电容作用，但加入碳也占用体积、改变孔隙和析气行为。2011 年配方试验说明最优含量依赖具体电极，不能把某论文的 1% 当成所有铅碳产品的最佳配方。UltraBattery 则进一步把电容功能纳入单体结构。\n\n来源：[原始资料](https://doi.org/10.1016/j.jpowsour.2010.11.046) ；[原始资料](https://doi.org/10.1016/j.jpowsour.2007.05.047)\n\n### 硫酸、AGM 与凝胶\n\n硫酸既承担离子传输，也参与反应。富液式保留自由液体；AGM 通过玻璃纤维隔板吸持电解液；胶体采用凝胶固定液相。隔板不仅隔开两极，还影响润湿、传质和内部气体复合。VRLA 的阀控结构用于压力管理，不能将“密封”理解为任何工况下完全不排气。\n\n来源：[原始资料](https://www.sonnenschein.org/PDF%20files/GelHandbookPart1.pdf) ；[原始资料](https://www.enersys.com/493c0d/globalassets/documents/product-documentation/cyclon/apac/en-cyc-am-007_1208.pdf)\n\n### 薄纯铅极板与卷绕结构\n\nCYCLON 官方资料给出纯度 99.99% 的薄纯铅极板和 AGM 结构。其容量产品范围 2.5–25 Ah 的额定条件为 25°C、10 小时率、终止电压 1.67 V/单格；换成大电流短时放电后，不能直接沿用该 Ah。几何结构优化的核心是缩短电流和离子路径，同时保留足够机械稳定性。\n\n来源：[原始资料](https://www.enersys.com/en-gb/products/batteries/cyclon/cyclon/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文与测试",
      "title": "浅循环寿命要连同SOC与恢复策略读取",
      "content": "| 原始研究 | 实际结果与条件 | 解释与边界 |\n|---|---|---|\n| Lam 等，2007，VRLA Ultrabattery | 集成非对称电容与铅酸功能，研究高倍率部分荷电运行 | 结构证据；未从摘要补写整站效率或完整深循环次数。[DOI](https://doi.org/10.1016/j.jpowsour.2007.05.047) |\n| Hund / Baca，Sandia，2009 | 1,048 Ah（8 h 率）大电芯；8,529 次 10% DOD PSoC；200/400 A 脉冲，含恢复充电 | 证明浅循环耐久；恢复充电间隔与电芯电压分散仍出现退化。原报告 URL 见历史节点。 |\n| 2011，Study of the influence of carbon on the negative lead-acid battery electrodes | 该配方加速 PSoC 试验约 1% 碳最优；超过 2% 电阻增加 | 添加剂、压紧和化成共同作用，不外推到所有碳材料。[DOI](https://doi.org/10.1016/j.jpowsour.2010.11.046) |\n| Zhou 等，2024，铅产业技术与材料情景 | 历史材料流与未来情景联立，研究中国铅产业排放 | 生命周期与资源研究，不是电芯寿命实验。[原始资料](https://www.nature.com/articles/s43247-024-01743-7) |\n\n### 从额定容量到可调度电量\n\n额定 Ah 对应规定电流、终止电压和温度。储能站可输出的交流电量还受允许 SOC 窗口、放电倍率、老化、变流器和备用裕度影响。高倍率设备的价值可能是及时输出功率；日循环项目则更看重累计能量吞吐。两类产品不能只按铭牌 Ah 排名。\n\n原始来源：[1859 Planté 的可充电铅体系](https://indico.ictp.it/event/a0229/session/15/contribution/15/material/0/0.pdf)\n\n原始来源：[1881 Faure 将活性物质涂到极板](https://www.nature.com/articles/024068b0)\n\n原始来源：[1957 胶体电解液形成产业路线](https://www.exidegroup.com/en/about-us)\n\n原始来源：[1973 密封纯铅卷绕电芯](https://www.enersys.com/493c0d/globalassets/documents/product-documentation/cyclon/emea/en-cyc-sg-004_0614.pdf)\n\n原始来源：[2007 UltraBattery 针对部分荷电运行](https://doi.org/10.1016/j.jpowsour.2007.05.047)\n\n原始来源：[2009 大尺寸铅碳进入实验室公用事业工况](https://www.sandia.gov/ess-ssl/EESAT/2009_papers/Large%20Format%20Carbon%20Enhanced%20VRLA%20Battery%20Test%20Results.pdf)\n\n原始来源：[2011 碳添加量出现明确取舍](https://doi.org/10.1016/j.jpowsour.2010.11.046)\n\n原始来源：[2012 East Penn 3 MW 系统投入辅助服务](https://www.energy.gov/sites/prod/files/2013/08/f2/ElecStorageHndbk2013.pdf)\n\n原始来源：[2023 DOE 将深循环寿命列为长时突破点](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lead%20Batteries.pdf)\n\n原始来源：[2024 铅产业材料流与碳排放联合建模](https://www.nature.com/articles/s43247-024-01743-7)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业与制造",
      "title": "集团铅酸规模不等于固定储能产量",
      "content": "| 主体 | 本路线技术角色 | 可核案例 |\n|---|---|---|\n| Exide / Sonnenschein | 胶体与工业固定式铅酸 | 1957 dryfit 历史；官方技术手册描述凝胶电解液。[原始资料](https://www.exidegroup.com/en/about-us) |\n| EnerSys | 纯铅、AGM、工业备用和动力产品 | CYCLON 薄纯铅卷绕电芯，给定温度和倍率的容量规格。[原始资料](https://www.enersys.com/en-gb/products/batteries/cyclon/cyclon/) |\n| East Penn | 大尺寸 VRLA、铅碳与 UltraBattery 工程 | Sandia 测试及 2012 年 3 MW PJM 项目。来源见对应节点。 |\n| CSIRO / Furukawa | UltraBattery 研发与产业化合作 | CSIRO 原始成果与论文目录。[原始资料](https://csiropedia.csiro.au/ultrabattery/) ；[原始资料](https://csiropedia.csiro.au/ultrabattery-publications/) |\n\n企业规模、上市主体和图片另由企业底稿提供；本表只描述可核技术关联。\n\n### 天能\n\n天能电池集团经营铅蓄电池、铅炭储能等业务；集团规模不等于储能收入。\n\n2025集团营收人民币457.92亿元、铅酸产品收入415.66亿元。和平共储一期2023年并网，官方披露全项目100MW/1000MWh，由国家电投与天能等共同建设。\n\n原始来源：[天能股份2025年报](https://static.cninfo.com.cn/finalpage/2026-03-28/1225042972.PDF) · [和平共储项目说明](https://www.tianneng.com/news/information/197) · [天能2023 ESG报告](https://www.tianneng.com/Public/Uploads/uploadfile/files/20240330/tiannengdianchijituangufenyouxianghuanjingshebaogao.pdf)\n\n### EnerSys\n\nEnerSys提供工业备用、牵引与动力电池；PowerSafe含固定式铅酸产品。\n\nFY2025集团净销售额36.176亿美元，包含多类电源产品和服务，不是铅酸储能专属收入。PowerSafe DSG面向工业与公用事业备用。\n\n原始来源：[EnerSys FY2025结果](https://investor.enersys.com/news/news-details/2025/ENERSYS-REPORTS-FOURTH-QUARTER-FISCAL-YEAR-2025-RESULTS-05-21-2025/default.aspx) · [PowerSafe DSG资料](https://www.enersys.com/49c727/globalassets/documents/marketing-literature/esg/industrial/flyers/amer/amer-en-sellsheet-powersafedsg-2025.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策与市场",
      "title": "铅酸有成熟市场，储能份额需单独核实",
      "content": "### 启动、备用与循环储能有不同需求\n\n启动应用关注短时间大功率输出，通常较浅放电；通信与 UPS 更重视长期保持可用、偶发停电时供电；风光平滑和辅助服务强调充电接受能力及频繁浅循环；每日移峰增加了深循环与累计吞吐要求。不能将整个汽车启动和工业铅酸市场规模当作电网储能装机。\n\n### 长时研究目标与已建工程分开\n\nDOE 2023 战略评估属于研发情景；East Penn 2012 年项目属于实际工程。前者的成本、效率和寿命基准用于比较研发路径，后者证明特定电网任务可实现。将二者拼接成“3 MW 项目实测 78% 效率、1,370 次寿命”没有证据。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Lead%20Batteries.pdf) ；[原始资料](https://www.energy.gov/sites/prod/files/2013/08/f2/ElecStorageHndbk2013.pdf)\n\n### 回收体系与生命周期\n\n铅能够进入再生材料链，但回收率、回收过程排放和电池运行寿命是三个不同指标。2024 年原始模型将技术与材料路径一起考察，适合说明生命周期研究方向；本路线不提供缺少地区、年份和分母的统一“全球回收率”。\n\n来源：[原始资料](https://www.nature.com/articles/s43247-024-01743-7)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "更换、效率与可用放电深度决定全周期价值",
      "content": "| 场景 | 适配价值 | 决定成败的变量 |\n|---|---|---|\n| UPS / 通信备用 | 供应与维护经验成熟，按规定时长保护负载 | 浮充温度、单体一致性、备用时长、老化后的功率与容量 |\n| 风光平滑 / 调频 | 铅碳和复合电容路线改善部分荷电充电接受 | SOC 窗口、脉冲频次、恢复充电、温升 |\n| 每日能量移峰 | 水系体系与成熟制造具有工程基础 | 深循环寿命、有效放电深度、更换与维护成本 |\n| 十小时以上储能 | 可研究低成本材料和结构优化 | 不能直接套用启动电池；长时可用容量、用地和寿命决定经济性 |\n\n### 项目尺度上的关键取舍\n\n浅放电可以延缓衰减，却意味着相同铭牌容量只能使用较少电量；扩大电池组可以降低倍率，却增加占地和资本占用。部分荷电下的碳增强改善某些失效机制，也可能要求专门的恢复充电策略。较有意义的工程比较是给定负荷曲线、温度和更换计划下的可用交流电量与累计吞吐。\n\n### 研究状态\n\n化学体系和多种产品已经产业化；先进铅碳、复合结构及长时专用设计仍需按产品和现场分别验证。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "lead-policy",
    "label": "政策背景",
    "year": "2025",
    "title": "新型储能规模化建设专项行动方案",
    "copy": "国家发改委、能源局给出2025—2027年新型储能规模化建设政策框架；文件没有逐项认证铅酸路线成熟。",
    "facts": [
      [
        "2027年目标",
        "全国新型储能装机规模1.8亿千瓦以上，覆盖多条路线"
      ],
      [
        "监管要求",
        "强化电化学储能安全管理"
      ]
    ],
    "subject": "scene:electrochemical-policy"
  },
  "market": {
    "id": "lead-market",
    "label": "统计口径",
    "year": "2026",
    "title": "不把铅酸行业收入当成储能市场",
    "copy": "企业报告将铅酸用于动力、启动、备用等多种用途。项目对比需单列固定储能收入与装机。",
    "facts": [
      [
        "集团营收",
        "需与铅酸产品收入、储能收入分开"
      ],
      [
        "MW 与 MWh",
        "功率和储电量是不同参数"
      ]
    ],
    "subject": "scene:electrochemical-lead-acid-market"
  },
  "papers": {
    "id": "lead-papers",
    "label": "论文与工程依据",
    "year": "2023",
    "title": "部分荷电研究与电站数据不可混为一谈",
    "copy": "Sandia大尺寸铅碳电芯在部分荷电下完成浅循环。10% DOD、SOC窗口和恢复充电共同限定这组结果。",
    "facts": [
      [
        "8,529次 / 10% DOD",
        "1,048Ah（8h率），40–50% SOC，含恢复充电"
      ],
      [
        "200 / 400 A",
        "报告中的两类脉冲工况"
      ]
    ],
    "subject": "route:electrochemical-lead-acid:history"
  },
  "storage": {
    "id": "lead-storage",
    "label": "应用适配",
    "year": "固定储能",
    "title": "从UPS到日内移峰按任务分别验证",
    "copy": "放电时长、DOD、温度和维护策略决定铅酸能否承担预期电力任务。",
    "facts": [
      [
        "备用",
        "浮充与停电放电能力"
      ],
      [
        "日循环",
        "深循环寿命、效率和更换计划"
      ]
    ],
    "subject": "route:electrochemical-lead-acid:history"
  }
};

export const zincResearch: ChronicleResearch = {
  "name": "锌基电池",
  "historySubject": "route:electrochemical-zinc:history",
  "note": "范围仅包括非空气、非外循环液流的可充锌基电池；锌溴液流和锌空气分别归其他路线。",
  "showMarketChart": false,
  "timeline": [
    {
      "id": "electrochemical-zinc-1800",
      "yearNumber": 1800,
      "year": "1800",
      "label": "锌进入伏打电堆",
      "title": "锌进入伏打电堆",
      "copy": "Volta 的原始通信描述用不同金属与湿润隔层构造连续供电装置。",
      "facts": [
        [
          "1800",
          "原始通信年份"
        ],
        [
          "一次电池",
          "当时并非可逆锌沉积体系"
        ]
      ],
      "detail": "Volta 的原始通信描述用不同金属与湿润隔层构造连续供电装置。\n\n1800 年论文列出锌、银或铜以及含水导电层的组合；ECS 历史文献库保存原文影印。此时是消耗材料的一次电源，不是现代可充锌离子电池。\n\n锌的电化学活性成为可用电源基础。把金属重新均匀沉积回来，是后来二次锌电池需要另行解决的问题。",
      "source": "https://knowledge.electrochem.org/estir/hist/hist-20-Volta-2.pdf",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2012",
      "yearNumber": 2012,
      "year": "2012",
      "label": "温和水系锌离子电池形成明确研究对象",
      "title": "温和水系锌离子电池形成明确研究对象",
      "copy": "Xu、Li、Du、Kang 报道由 α-MnO₂、锌和温和锌盐电解液构成的可充电体系。",
      "facts": [
        [
          "α-MnO₂",
          "正极材料"
        ],
        [
          "ZnSO₄ / Zn(NO₃)₂",
          "摘要列出的水系电解液"
        ]
      ],
      "detail": "Xu、Li、Du、Kang 报道由 α-MnO₂、锌和温和锌盐电解液构成的可充电体系。\n\n《Angewandte Chemie International Edition》51，933–935；正式卷期为 2012 年，首次在线为 2011 年 12 月 13 日。电解液为 ZnSO₄ 或 Zn(NO₃)₂ 水溶液。\n\n从成熟一次碱性锌锰转向温和水系可逆储能；不同电解液和晶型的反应机理不能沿用同一个“纯 Zn²⁺ 嵌入”解释。",
      "source": "https://onlinelibrary.wiley.com/doi/abs/10.1002/anie.201106307",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2016",
      "yearNumber": 2016,
      "year": "2016",
      "label": "层间水与锌支撑的钒氧化物",
      "title": "层间水与锌支撑的钒氧化物",
      "copy": "Kundu 等利用水合钒氧化物扩展水系锌电池正极选择。",
      "facts": [
        [
          "约300mAh/g",
          "最高报告容量"
        ],
        [
          ">1000次",
          "另一循环条件下保持超过80%"
        ]
      ],
      "detail": "Kundu 等利用水合钒氧化物扩展水系锌电池正极选择。\n\nZn₀.₂₅V₂O₅·nH₂O 正极；摘要报告最高约 300 mAh/g 及超过 1,000 次循环后保留逾 80% 容量。最高容量与长循环不是同一倍率纪录，本节点不合成单组测试。\n\n层间离子与水参与稳定宿主结构，材料设计从单纯更换金属氧化物转到调节层间环境。摘要的体积能量密度不在本页当作完整封装电芯或系统指标。",
      "source": "https://www.nature.com/articles/nenergy2016119",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2017",
      "yearNumber": 2017,
      "year": "2017",
      "label": "锌锰从机理研究走向软包验证",
      "title": "锌锰从机理研究走向软包验证",
      "copy": "β-MnO₂ 首次放电形成层状相，温和电解液配方改善后续可逆性。",
      "facts": [
        [
          "225mAh/g",
          "0.65C特定测试条件"
        ],
        [
          "94%",
          "2,000次循环、6.50C条件"
        ],
        [
          "75.2Wh/kg",
          "独立软包比能量报告"
        ]
      ],
      "detail": "β-MnO₂ 首次放电形成层状相，温和电解液配方改善后续可逆性。\n\n3 M Zn(CF₃SO₃)₂ 加 0.1 M Mn(CF₃SO₃)₂；225 mAh/g 对应 0.65 C，2,000 次后 94% 保持率对应 6.50 C。另有软包整体比能量 75.2 Wh/kg，不能把正极 mAh/g 视为电芯指标。\n\nMn²⁺ 添加剂与相变机制共同影响结果。同年 NRL 三维锌海绵镍锌研究则从负极几何结构切入，说明可充锌并不只是一条锌离子正极路线。",
      "source": "https://www.nature.com/articles/s41467-017-00467-x",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "高浓度电解液重塑锌溶剂化",
      "title": "高浓度电解液重塑锌溶剂化",
      "copy": "Zn 版本的 water-in-salt 电解液改善金属锌沉积/剥离可逆性。",
      "facts": [
        [
          "接近100%",
          "锌镀剥库仑效率口径"
        ],
        [
          "非能效",
          "不等于整芯往返效率"
        ]
      ],
      "detail": "Zn 版本的 water-in-salt 电解液改善金属锌沉积/剥离可逆性。\n\nWang 等《Nature Materials》论文及 NIST 作者记录报告接近 100% 的沉积/剥离库仑效率。不同正极分支有不同能量与寿命，不将该效率写成整电池能量往返效率。\n\n水系并非固定不变的溶剂环境，盐浓度可以改变界面与水的反应活性。高盐成本、黏度和真实贫液条件仍影响工程适用性。",
      "source": "https://www.nature.com/articles/s41563-018-0063-z",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "DOE 单列锌电池研发路径",
      "title": "DOE 单列锌电池研发路径",
      "copy": "锌被纳入长时储能技术评估，路线包含多种化学和系统形式。",
      "facts": [
        [
          "2023",
          "官方技术评估"
        ],
        [
          "目标",
          "不是已达成产品性能"
        ]
      ],
      "detail": "锌被纳入长时储能技术评估，路线包含多种化学和系统形式。\n\n2023 年 7 月发布的报告讨论负极、正极、隔膜、电解液及系统制造。目标为推动长时成本下降；目标年份不表示相关指标已经实现。\n\n从活性材料性能转向循环寿命、气体管理和示范验证。锌基各分支的成本与寿命不同，不能用一张统一电芯纪录代表整个路线。",
      "source": "https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Zinc%20Batteries.pdf",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "静态锌卤素制造扩建获得融资",
      "title": "静态锌卤素制造扩建获得融资",
      "copy": "Eos 制造扩建获得 DOE 担保贷款支持，代表产业扩产节点。",
      "facts": [
        [
          "3.035亿美元",
          "融资金额"
        ],
        [
          "8GWh/年",
          "扩产目标，不是产量"
        ]
      ],
      "detail": "Eos 制造扩建获得 DOE 担保贷款支持，代表产业扩产节点。\n\nEos 2024 年 12 月 3 日原始公告为 3.035 亿美元贷款，8 GWh/年为预期扩产能力。现 DOE 项目页另列 3.053 亿美元，与其本金和利息分项也不完全一致；展示应保留公告日期与来源，不能混算。\n\n融资和产线建设可以支持规模化，但融资规模、产能目标、实际产量及已交付储能量是四类事实。该公司静态模块无需外置液流储罐和循环泵，不归入已完成锌溴液流页。",
      "source": "https://investors.eose.com/news-releases/news-release-details/eos-energy-closes-3035-million-loan-guaranteed-us-department",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "高熵溶剂化实现 Ah 级原型",
      "title": "高熵溶剂化实现 Ah 级原型",
      "copy": "少量多种卤化锌添加剂调节水系溶剂化环境，并进行多层软包验证。",
      "facts": [
        [
          "1.142亿美元",
          "FY2025营收"
        ],
        [
          "2.8GWh",
          "2025年底订单积压"
        ],
        [
          "2GWh",
          "公司所称年化产能，不是全年出货"
        ]
      ],
      "detail": "少量多种卤化锌添加剂调节水系溶剂化环境，并进行多层软包验证。\n\n原论文 8.5×8.5 cm 多层软包，正极载量 28.1 mg/cm²，初始 1.0 Ah，超过 250 次循环。主体电解液为 2 M ZnSO₄，配合低浓度卤盐添加；不是高浓度含锂盐路线的重复。\n\n研究把高载量、软包和贫液作为评价维度。论文的电解液原料成本估算不等于电池制造成本，也不能直接转成储能 LCOS。",
      "source": "https://www.nature.com/articles/s41467-025-61456-z",
      "subject": "route:electrochemical-zinc:history"
    },
    {
      "id": "electrochemical-zinc-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "表面张力与实用锌利用率联系起来",
      "title": "表面张力与实用锌利用率联系起来",
      "copy": "低表面张力电解液通过细化锌成核与生长，提高苛刻条件下的沉积稳定性。",
      "facts": [
        [
          "10mA/cm²、10mAh/cm²",
          "沉积条件"
        ],
        [
          ">2200h / >300h",
          "17%/85%DOD对称测试分别结果"
        ],
        [
          "1.27Ah",
          "独立软包"
        ]
      ],
      "detail": "低表面张力电解液通过细化锌成核与生长，提高苛刻条件下的沉积稳定性。\n\n在 10 mA/cm²、10 mAh/cm² 条件下，金属电极测试分别达到超过 2,200 h（17% DOD）和 300 h（85% DOD）；另示范 1.27 Ah 软包。两种 DOD 和软包不能合并为同一寿命纪录。\n\n研究重点从低利用率对称电池的长小时数转向负极利用、面容量与完整电芯。实验室原型尚不能证明多年现场日历寿命。",
      "source": "https://www.nature.com/articles/s41467-026-68393-5.pdf",
      "subject": "route:electrochemical-zinc:history"
    }
  ],
  "materials": [
    {
      "id": "zinc-material-anode",
      "label": "锌金属负极",
      "year": "材料",
      "title": "沉积/剥离可逆性限制锌利用率",
      "copy": "不均匀电流和副反应可使锌局部突起、腐蚀或析氢；大量过量锌有助维持循环，却降低全电芯质量与体积能量密度。",
      "facts": [
        [
          "约820mAh/g",
          "锌理论比容量，按锌质量"
        ],
        [
          "沉积/剥离",
          "对称电池效率不能当整电池效率"
        ]
      ],
      "subject": "material:electrochemical-zinc-zinc-anode"
    },
    {
      "id": "zinc-material-cathode",
      "label": "正极：锰、钒、镍与卤素",
      "year": "材料",
      "title": "同一锌负极配不同正极会变成不同化学路线",
      "copy": "锰氧化物可能发生嵌入、相变及溶解沉积；水合钒氧化物借助层间水；镍锌与静态锌卤反应也各自不同。",
      "facts": [
        [
          "Mn / V / Ni / 卤素",
          "不同正极反应路径"
        ],
        [
          "静态Z3",
          "不等同锌溴液流"
        ],
        [
          "锌空气",
          "归金属空气路线"
        ]
      ],
      "subject": "material:electrochemical-zinc-cathode"
    },
    {
      "id": "zinc-material-electrolyte",
      "label": "水系电解液",
      "year": "材料",
      "title": "盐浓度和添加剂改变溶剂化与界面",
      "copy": "温和盐、浓盐、强碱和添加剂服务不同正极反应。浓盐可能抑制水副反应，也增加成本、黏度和传输阻力。",
      "facts": [
        [
          "水活度/溶剂化",
          "影响析氢、腐蚀和锌沉积"
        ],
        [
          "材料电导",
          "不能代替电芯能量或交流效率"
        ]
      ],
      "subject": "material:electrochemical-zinc-aqueous-electrolyte"
    },
    {
      "id": "zinc-material-separator",
      "label": "隔膜与静态模块",
      "year": "材料",
      "title": "离子阻力、短路和电解液用量需平衡",
      "copy": "隔膜厚度和润湿影响阻抗与枝晶穿透。Eos披露模块内部包含水系电解质和双极结构；公开剖面图不能证明各材料微观形貌。",
      "facts": [
        [
          "隔膜",
          "测试时报告厚度与面电阻"
        ],
        [
          "静态模块",
          "无外置储液罐和循环泵"
        ]
      ],
      "subject": "material:electrochemical-zinc-separator-static-module"
    }
  ],
  "companies": [
    {
      "id": "electrochemical-zinc-eos",
      "label": "Eos",
      "year": "2025",
      "title": "Eos披露收入和订单积压",
      "copy": "Eos年末订单积压2.8GWh、FY2025收入1.142亿美元；产能、积压与实际交付是不同指标。",
      "facts": [
        [
          "1.142亿美元",
          "FY2025公司收入"
        ],
        [
          "2.8GWh",
          "年末订单积压，非出货"
        ]
      ],
      "subject": "company:electrochemical-zinc-eos"
    },
    {
      "id": "electrochemical-zinc-hfips",
      "label": "中科院合肥物质院",
      "year": "2025",
      "title": "醋酸锌水凝胶用于准固态锌软包研究",
      "copy": "醋酸锌水凝胶软包研究涉及增溶、疲劳和界面稳定；无证据表明已转为电网项目。",
      "facts": [
        [
          "557%",
          "水凝胶拉伸延伸率"
        ],
        [
          "3.7MPa",
          "水凝胶压缩强度，非堆压"
        ]
      ],
      "subject": "company:electrochemical-zinc-hfips"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史脉络",
      "title": "从一次锌电堆到多种可充锌体系",
      "content": "### 1800｜锌进入伏打电堆\n\nVolta 的原始通信描述用不同金属与湿润隔层构造连续供电装置。\n\n1800 年论文列出锌、银或铜以及含水导电层的组合；ECS 历史文献库保存原文影印。此时是消耗材料的一次电源，不是现代可充锌离子电池。\n\n锌的电化学活性成为可用电源基础。把金属重新均匀沉积回来，是后来二次锌电池需要另行解决的问题。\n\n来源：[原始资料](https://knowledge.electrochem.org/estir/hist/hist-20-Volta-2.pdf) ；[原始资料](https://doi.org/10.1098/rstl.1800.0018)\n\n### 2012｜温和水系锌离子电池形成明确研究对象\n\nXu、Li、Du、Kang 报道由 α-MnO₂、锌和温和锌盐电解液构成的可充电体系。\n\n《Angewandte Chemie International Edition》51，933–935；正式卷期为 2012 年，首次在线为 2011 年 12 月 13 日。电解液为 ZnSO₄ 或 Zn(NO₃)₂ 水溶液。\n\n从成熟一次碱性锌锰转向温和水系可逆储能；不同电解液和晶型的反应机理不能沿用同一个“纯 Zn²⁺ 嵌入”解释。\n\n来源：[原始资料](https://onlinelibrary.wiley.com/doi/abs/10.1002/anie.201106307)\n\n### 2016｜层间水与锌支撑的钒氧化物\n\nKundu 等利用水合钒氧化物扩展水系锌电池正极选择。\n\nZn₀.₂₅V₂O₅·nH₂O 正极；摘要报告最高约 300 mAh/g 及超过 1,000 次循环后保留逾 80% 容量。最高容量与长循环不是同一倍率纪录，本节点不合成单组测试。\n\n层间离子与水参与稳定宿主结构，材料设计从单纯更换金属氧化物转到调节层间环境。摘要的体积能量密度不在\n\n来源：[原始资料](https://www.nature.com/articles/nenergy2016119)\n\n### 2017｜锌锰从机理研究走向软包验证\n\nβ-MnO₂ 首次放电形成层状相，温和电解液配方改善后续可逆性。\n\n3 M Zn(CF₃SO₃)₂ 加 0.1 M Mn(CF₃SO₃)₂；225 mAh/g 对应 0.65 C，2,000 次后 94% 保持率对应 6.50 C。另有软包整体比能量 75.2 Wh/kg，不能把正极 mAh/g 视为电芯指标。\n\nMn²⁺ 添加剂与相变机制共同影响结果。同年 NRL 三维锌海绵镍锌研究则从负极几何结构切入，说明可充锌并不只是一条锌离子正极路线。\n\n来源：[原始资料](https://www.nature.com/articles/s41467-017-00467-x) ；[原始资料](https://doi.org/10.1126/science.aak9991) ；[原始资料](https://www.navy.mil/Press-Office/News-Stories/Article/2255647/nrl-breakthrough-enables-safer-alternative-to-lithium-ion-batteries/)\n\n### 2018｜高浓度电解液重塑锌溶剂化\n\nZn 版本的 water-in-salt 电解液改善金属锌沉积/剥离可逆性。\n\nWang 等《Nature Materials》论文及 NIST 作者记录报告接近 100% 的沉积/剥离库仑效率。不同正极分支有不同能量与寿命，不将该效率写成整电池能量往返效率。\n\n水系并非固定不变的溶剂环境，盐浓度可以改变界面与水的反应活性。高盐成本、黏度和真实贫液条件仍影响工程适用性。\n\n来源：[原始资料](https://www.nature.com/articles/s41563-018-0063-z) ；[原始资料](https://www.nist.gov/publications/highly-reversible-zinc-metal-anode-aqueous-batteries)\n\n### 2023｜DOE 单列锌电池研发路径\n\n锌被纳入长时储能技术评估，路线包含多种化学和系统形式。\n\n2023 年 7 月发布的报告讨论负极、正极、隔膜、电解液及系统制造。目标为推动长时成本下降；目标年份不表示相关指标已经实现。\n\n从活性材料性能转向循环寿命、气体管理和示范验证。锌基各分支的成本与寿命不同，不能用一张统一电芯纪录代表整个路线。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Zinc%20Batteries.pdf)\n\n### 2024｜静态锌卤素制造扩建获得融资\n\nEos 制造扩建获得 DOE 担保贷款支持，代表产业扩产节点。\n\nEos 2024 年 12 月 3 日原始公告为 3.035 亿美元贷款，8 GWh/年为预期扩产能力。现 DOE 项目页另列 3.053 亿美元，与其本金和利息分项也不完全一致；展示应保留公告日期与来源，不能混算。\n\n融资和产线建设可以支持规模化，但融资规模、产能目标、实际产量及已交付储能量是四类事实。该公司静态模块无需外置液流储罐和循环泵，不归入已完成锌溴液流页。\n\n来源：[原始资料](https://investors.eose.com/news-releases/news-release-details/eos-energy-closes-3035-million-loan-guaranteed-us-department) ；[原始资料](https://www.energy.gov/edf/eos) ；[原始资料](https://www.eose.com/solutions/)\n\n### 2025｜高熵溶剂化实现 Ah 级原型\n\n少量多种卤化锌添加剂调节水系溶剂化环境，并进行多层软包验证。\n\n原论文 8.5×8.5 cm 多层软包，正极载量 28.1 mg/cm²，初始 1.0 Ah，超过 250 次循环。主体电解液为 2 M ZnSO₄，配合低浓度卤盐添加；不是高浓度含锂盐路线的重复。\n\n研究把高载量、软包和贫液作为评价维度。论文的电解液原料成本估算不等于电池制造成本，也不能直接转成储能 LCOS。\n\n来源：[原始资料](https://www.nature.com/articles/s41467-025-61456-z)\n\n### 2026｜表面张力与实用锌利用率联系起来\n\n低表面张力电解液通过细化锌成核与生长，提高苛刻条件下的沉积稳定性。\n\n在 10 mA/cm²、10 mAh/cm² 条件下，金属电极测试分别达到超过 2,200 h（17% DOD）和 300 h（85% DOD）；另示范 1.27 Ah 软包。两种 DOD 和软包不能合并为同一寿命纪录。\n\n研究重点从低利用率对称电池的长小时数转向负极利用、面容量与完整电芯。实验室原型尚不能证明多年现场日历寿命。\n\n来源：[原始资料](https://www.nature.com/articles/s41467-026-68393-5.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料结构",
      "title": "锌负极、电解液与正极要协同设计",
      "content": "### 金属锌负极：箔材、三维骨架与界面\n\n放电时锌氧化，充电时锌重新沉积；突起处局部电流集中可能形成不均匀生长。金属锌理论比容量约 820 mAh/g，仅以锌质量为分母。增加过量锌可以掩盖部分损失，却降低完整电芯能量密度。三维锌海绵以连续结构替代松散粉体；表面张力与保护界面路线则调节新生锌的位置和形貌。\n\n来源：[原始资料](https://www.nist.gov/publications/highly-reversible-zinc-metal-anode-aqueous-batteries) ；[原始资料](https://doi.org/10.1126/science.aak9991) ；[原始资料](https://www.nature.com/articles/s41467-026-68393-5.pdf)\n\n### 正极：锰、钒、镍与卤素反应\n\n锰氧化物可以经历嵌入、相变及溶解/沉积，机理取决于 pH、晶型和添加剂；水合钒氧化物利用层间结构容纳载流离子；镍锌采用镍基正极的碱性氧化还原；静态锌卤素使用卤素相关反应。不同载流离子和反应路径不应统一称作“锌离子在两极摇椅式穿梭”。\n\n来源：[原始资料](https://onlinelibrary.wiley.com/doi/abs/10.1002/anie.201106307) ；[原始资料](https://www.nature.com/articles/nenergy2016119) ；[原始资料](https://www.eose.com/technology/)\n\n### 电解液：温和水系、浓盐与添加剂\n\n温和 ZnSO₄、三氟甲磺酸锌、强碱性镍锌电解液服务不同反应。浓盐策略减少自由水参与副反应；添加剂可改变溶剂化和表面润湿，而不必把全部电解液变成高盐体系。配方设计必须同时考虑正极稳定性与负极析氢、腐蚀，不能只优化单边对称电池。\n\n来源：[原始资料](https://www.nature.com/articles/s41563-018-0063-z) ；[原始资料](https://www.nature.com/articles/s41467-025-61456-z)\n\n### 隔膜与静态模块结构\n\n隔膜的厚度、润湿和阻隔能力影响短路概率、离子阻力及电解液用量。实验室厚隔膜和过量电解液可能提供良好循环，却拉低封装比能量。不同产品并非必须采用同一隔膜：Eos 官方披露双极堆叠、导电塑料负极侧及碳毡正极侧，电解液保存在单元内部；不能给其未知结构画上通用“锂电隔膜”。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Zinc%20Batteries.pdf) ；[原始资料](https://www.eose.com/technology/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文与测试",
      "title": "面容量和软包数据比漂亮半电池纪录更接近实用",
      "content": "| 原始论文 | 数据及测试对象 | 带来的认识 |\n|---|---|---|\n| Xu 等，2011 在线 / 2012 卷期，Angew. | α-MnO₂ / Zn / 温和 ZnSO₄ 或 Zn(NO₃)₂ | 现代水系锌离子研究的早期节点；不写成锌电池第一次发明。[DOI](https://doi.org/10.1002/anie.201106307) |\n| Kundu 等，2016，Nature Energy | 水合钒氧化物；最高 300 mAh/g 与千次保持分别有各自工况 | 层间水和预嵌锌参与宿主稳定。[DOI](https://doi.org/10.1038/nenergy.2016.119) |\n| Zhang 等，2017，Nature Communications | 225 mAh/g @0.65 C；94%/2,000 次 @6.50 C；软包 75.2 Wh/kg | 正极性能、倍率寿命和软包指标必须分列。[DOI](https://doi.org/10.1038/s41467-017-00467-x) |\n| Parker 等，2017，Science | 三维锌海绵与镍正极的可充体系 | 连续锌结构改善沉积形态；[DOI](https://doi.org/10.1126/science.aak9991) |\n| Wang 等，2018，Nature Materials | Zn-WiSE 电解液，金属沉积/剥离接近 100% 库仑效率 | 电荷可逆性不等于能量效率。[DOI](https://doi.org/10.1038/s41563-018-0063-z) |\n| 2025，High-entropy solvation chemistry | 1.0 Ah 多层软包；28.1 mg/cm² 正极；超过 250 次 | 向高载量封装原型推进。[DOI](https://doi.org/10.1038/s41467-025-61456-z) |\n| 2026，Regulating zinc nucleation and growth | 10 mA/cm²、10 mAh/cm²，17% 与 85% DOD 对应不同寿命；另有 1.27 Ah 软包 | 高面容量与高锌利用率增加实际约束。[DOI](https://doi.org/10.1038/s41467-026-68393-5) |\n\n### 为什么正极容量不能替代整电池指标\n\n正极活性物质的 mAh/g 没有计入锌、集流体、隔膜、壳体和电解液；全电芯 Wh/kg 还受平均电压影响。对称电池研究锌界面，通常不包含可限制循环的真实正极。面容量、N/P 容量比与电解液/容量比越接近产品，越能暴露原先由过量材料缓冲的问题。\n\n原始来源：[1800 锌进入伏打电堆](https://knowledge.electrochem.org/estir/hist/hist-20-Volta-2.pdf)\n\n原始来源：[2012 温和水系锌离子电池形成明确研究对象](https://onlinelibrary.wiley.com/doi/abs/10.1002/anie.201106307)\n\n原始来源：[2016 层间水与锌支撑的钒氧化物](https://www.nature.com/articles/nenergy2016119)\n\n原始来源：[2017 锌锰从机理研究走向软包验证](https://www.nature.com/articles/s41467-017-00467-x)\n\n原始来源：[2018 高浓度电解液重塑锌溶剂化](https://www.nature.com/articles/s41563-018-0063-z)\n\n原始来源：[2023 DOE 单列锌电池研发路径](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Zinc%20Batteries.pdf)\n\n原始来源：[2024 静态锌卤素制造扩建获得融资](https://investors.eose.com/news-releases/news-release-details/eos-energy-closes-3035-million-loan-guaranteed-us-department)\n\n原始来源：[2025 高熵溶剂化实现 Ah 级原型](https://www.nature.com/articles/s41467-025-61456-z)\n\n原始来源：[2026 表面张力与实用锌利用率联系起来](https://www.nature.com/articles/s41467-026-68393-5.pdf)\n\n### 2026对称电池与独立软包\n\n**10 mA/cm²、10 mAh/cm²**：17% DOD下超过2200 h；85% DOD下超过300 h。另制备1.27 Ah软包，软包容量与对称电池镀剥时长分别记录。\n\n原始来源：[锌成核与生长论文](https://www.nature.com/articles/s41467-026-68393-5)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业与制造",
      "title": "订单、年化产能和交付须分别标示",
      "content": "| 主体 | 技术位置 | 事实状态 |\n|---|---|---|\n| Eos | 静态水系锌卤素、双极模块，面向固定式储能 | 商业制造与扩产融资；产品寿命属于企业规格，贷款支持不等于完成独立寿命测试。[原始资料](https://www.eose.com/technology/) |\n| EnZinc / NRL | 三维锌骨架与镍锌等组合 | 原始 NRL 研究与技术转移；不把材料许可等同整站部署。[原始资料](https://www.navy.mil/Press-Office/News-Stories/Article/2255647/nrl-breakthrough-enables-safer-alternative-to-lithium-ion-batteries/) |\n| Urban Electric Power | 可充碱性锌锰方向 | DOE 锌路线参与主体；具体产品/项目以另行企业底稿为准。[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Zinc%20Batteries.pdf) |\n| Salient Energy | 水系锌离子产业化方向 | DOE 技术评估参与主体；不以研究论文性能替代公司规格。来源同上。 |\n\n### Eos\n\nEos Energy Enterprises制造静态锌卤水系电池；Z3单元内封装电解质，不用外置储液罐和循环泵。\n\nFY2025收入1.142亿美元，年末订单积压7.015亿美元/2.8GWh，非已交付量。公司称2025年末年化制造产能达到2GWh，非全年出货。\n\n原始来源：[Eos FY2025结果](https://investors.eose.com/news-releases/news-release-details/eos-energy-enterprises-reports-fourth-quarter-and-full-year-2025) · [Z3技术说明](https://www.eose.com/technology/)\n\n### 中科院合肥物质院\n\n中科院合肥物质科学研究院固体所团队研究水系准固态锌离子电池与凝胶电解质，属科研机构而非公司。\n\n2025年报道醋酸锌水凝胶与软包研究；557%延伸率、3.7MPa压缩强度为材料力学测试，不是电池/电站性能。\n\n原始来源：[中文研究成果](https://www.hf.cas.cn/zhxw/jrtt/202506/t20250618_7871328.html) · [英文报道与参数](https://english.hf.cas.cn/nr/bth/202506/t20250624_1046068.html) · [原论文](https://doi.org/10.1002/anie.202508556)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策与市场",
      "title": "总储能统计没有给出锌基路线分项",
      "content": "### 产业化是多个子体系并行\n\n碱性一次锌锰已有大规模消费市场，但使用过的电池不能据此当作可充储能设备。镍锌、温和水系锌离子和静态锌卤素具有不同的正极、充电控制与寿命限制。DOE 的锌路线统计和评估覆盖较宽，不能把该大类直接等同单一锌离子产品出货。\n\n### 扩产融资与装机分开\n\n2024 年 Eos 原始公告中的 8 GWh/年是未来制造能力口径，既不是当年产量，也不是已安装容量。\n\n### 长时研发与实际工程\n\nDOE 2023 评估支持正极、隔膜、电解液和系统层面创新。寿命、气体管理、测试一致性及示范项目决定技术能否从实验走向固定式储能。本批不拿全技术新型储能总装机当作锌基专属市场。\n\n来源：[原始资料](https://www.energy.gov/oe/storage-innovations-2030) ；[原始资料](https://investors.eose.com/news-releases/news-release-details/eos-energy-closes-3035-million-loan-guaranteed-us-department)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "水系安全优势还要经过系统和寿命验证",
      "content": "| 场景 | 可用优势 | 关键限制 |\n|---|---|---|\n| UPS / 功率型镍锌 | 水系电解液、锌资源与高倍率设计 | 充电接受、负极形貌、寿命和产品级可靠性 |\n| 工商业日内移峰 | 多种水系化学可开发固定式模块 | 可用容量、能量效率、日历腐蚀及温度窗口 |\n| 更长时储能 | 静态锌卤素可按产品设计较长放电 | 企业 4–16+ h 应用规格不代表全锌体系都达到该范围 |\n| 学术锌离子原型 | 可系统研究离子存储与界面 | 扣式高倍率循环不能替代 Ah 级贫液、低 N/P 和长期静置 |\n\n### 水系的工程含义\n\n水系可以避免部分有机溶剂可燃性，但析氢、腐蚀、漏液和短路仍由实际配方及封装决定。容量衰减可能来自锌损失，也可能来自正极溶解、电解液耗损或接触变化。固定式适配要同时考虑储存等待期和充放电期，而不能只看连续测试的循环数。\n\n### 不同锌路线的入口边界\n\n锌空气依赖气体正极与空气管理，见金属空气；带外部液罐和循环回路的锌溴见液流；此页保留静态非空气体系，使相同元素下的结构差异能被明确比较。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "zinc-policy",
    "label": "政策背景",
    "year": "2025",
    "title": "新型储能专项行动方案",
    "copy": "2025—2027年方案给出新型储能多元化政策背景，不单独确认锌基化学成熟度。",
    "facts": [
      [
        "电化学安全",
        "加强新型储能安全管理"
      ],
      [
        "多元路线",
        "培育试点并提升系统效率、寿命"
      ]
    ],
    "subject": "scene:electrochemical-policy"
  },
  "market": {
    "id": "zinc-market",
    "label": "统计口径",
    "year": "2025",
    "title": "订单积压不是已装机容量",
    "copy": "Eos公开订单积压与制造产能，仍需等待交付与运行数据验证产品规模。",
    "facts": [
      [
        "2.8GWh",
        "公司年末订单积压"
      ],
      [
        "不可外推",
        "不代表已并网容量或中国锌基份额"
      ]
    ],
    "subject": "scene:electrochemical-zinc-market"
  },
  "papers": {
    "id": "zinc-papers",
    "label": "论文与测试依据",
    "year": "2025",
    "title": "高面容量下比较锌利用率与镀剥稳定性",
    "copy": "同样面电流与面容量下，提高锌利用率会缩短稳定镀剥时间。1.27Ah软包是另一封装原型。",
    "facts": [
      [
        ">2200 h / 17% DOD",
        "10mA/cm²、10mAh/cm²，对称电池"
      ],
      [
        ">300 h / 85% DOD",
        "相同面电流与面容量，对称电池"
      ],
      [
        "1.27 Ah",
        "独立软包容量，不与小时纪录拼接"
      ]
    ],
    "subject": "route:electrochemical-zinc:history"
  },
  "storage": {
    "id": "zinc-storage",
    "label": "应用适配",
    "year": "多小时",
    "title": "按完整产品系统核验水系锌储能",
    "copy": "固定储能需核实实际放电时长、交流效率、环境温度、寿命和维护方式。",
    "facts": [
      [
        "温度与密封",
        "关注冻融、蒸发和腐蚀"
      ],
      [
        "系统效率",
        "含变流器与辅助负载"
      ]
    ],
    "subject": "route:electrochemical-zinc:history"
  }
};

export const metalAirResearch: ChronicleResearch = {
  "name": "金属空气",
  "historySubject": "route:electrochemical-metal-air:history",
  "note": "铁空气商业系统须与锌/铝空气一次电池区分；未将燃料消耗型金属空气写成可充储能。",
  "showMarketChart": false,
  "timeline": [
    {
      "id": "electrochemical-metal-air-1933",
      "yearNumber": 1933,
      "year": "1933",
      "label": "空气去极化一次电池的原始专利",
      "title": "空气去极化一次电池的原始专利",
      "copy": "Heise 的专利把金属负极、含碳空气正极和糊状电解液组成可更换部件的电源。",
      "facts": [
        [
          "1933-02-28",
          "授权公开日期"
        ],
        [
          "一次体系",
          "非可充储能"
        ]
      ],
      "detail": "Heise 的专利把金属负极、含碳空气正极和糊状电解液组成可更换部件的电源。\n\nUS1899615A 于 1925 年申请、1933 年 2 月 28 日公开授权，优选负极为锌。专利描述空气中的氧参与正极过程，并明确属于一次电池。\n\n反应物可从环境供给，减少内部正极氧化剂负担；电极透气、润湿与保存方式成为器件设计条件。此处是可核早期专利节点，不宣称金属空气唯一发明年份。",
      "source": "https://patents.google.com/patent/US1899615A/en",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-1978",
      "yearNumber": 1978,
      "year": "1978",
      "label": "30 kWh 铁空气牵引系统被测试",
      "title": "30 kWh 铁空气牵引系统被测试",
      "copy": "铁空气已在早期电动车研究中推进到系统尺度。",
      "facts": [
        [
          "30kWh",
          "系统容量"
        ],
        [
          "80Wh/kg",
          "5小时率条件"
        ]
      ],
      "detail": "铁空气已在早期电动车研究中推进到系统尺度。\n\n《Journal of Power Sources》原始论文报道已开发测试的 30 kWh 铁空气系统，5 小时放电率下比能量 80 Wh/kg。该数值属于论文系统和工况，不是今天所有铁空气电池的规格。\n\n证明金属空气的工程问题早于当前长时市场。牵引系统追求质量与功率；今天低频多日储能的成本和寿命目标不同，不能直接继承旧车用测试结论。",
      "source": "https://www.sciencedirect.com/science/article/pii/0378775378850198",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-1996",
      "yearNumber": 1996,
      "year": "1996",
      "label": "聚合物电解质锂氧原型",
      "title": "聚合物电解质锂氧原型",
      "copy": "Abraham 与 Jiang 以锂金属、聚合物电解质和碳复合氧电极构建可充锂氧电池。",
      "facts": [
        [
          "200–300μm",
          "叠层厚度"
        ],
        [
          "约2–2.8V",
          "负载电压，随负载变化"
        ]
      ],
      "detail": "Abraham 与 Jiang 以锂金属、聚合物电解质和碳复合氧电极构建可充锂氧电池。\n\n论文发表于《Journal of The Electrochemical Society》143，1–5。作者公开保存的原文描述叠层约 200–300 μm，开路约 3 V，负载电压约 2–2.8 V，取决于负载。\n\n把金属锂与气体反应电极结合，形成区别于嵌入型正极的研究方向。薄实验叠层不等同完整电池包，实验氧气环境也不能直接推广到任意户外空气。",
      "source": "https://doi.org/10.1149/1.1836378",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2006",
      "yearNumber": 2006,
      "year": "2006",
      "label": "Li₂O₂ 的形成与分解得到气体证据",
      "title": "Li₂O₂ 的形成与分解得到气体证据",
      "copy": "Ogasawara 等用原位质谱考察锂氧正极的可逆反应。",
      "facts": [
        [
          "原位MS",
          "气体产物测量"
        ],
        [
          "反应机理",
          "非长期电芯验证"
        ]
      ],
      "detail": "Ogasawara 等用原位质谱考察锂氧正极的可逆反应。\n\n论文观察放电形成 Li₂O₂、充电释放 O₂，并讨论有无催化剂的充放电。这是反应可逆性的实验节点，而不是汽车电池量产节点。\n\n充电时有电流并不自动说明放电产物被干净恢复；识别氧气释放与产物变化，开始成为评价依据。",
      "source": "https://pubs.acs.org/doi/10.1021/ja056811q",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2012",
      "yearNumber": 2012,
      "year": "2012",
      "label": "可充电性评价转向定量化学平衡",
      "title": "可充电性评价转向定量化学平衡",
      "copy": "McCloskey 等指出，电压曲线和容量保持不足以证明锂氧反应真正可逆。",
      "facts": [
        [
          "OER/ORR<90%",
          "论文所测体系"
        ],
        [
          "氧回收率",
          "不同于能量往返效率"
        ]
      ],
      "detail": "McCloskey 等指出，电压曲线和容量保持不足以证明锂氧反应真正可逆。\n\n该论文用定量差分电化学质谱比较多种非水电解液，所测体系的氧回收效率 OER/ORR 均低于 90%。这不是整电池能量效率，也不是对后来所有配方的结论。\n\n副反应也会消耗或产生电荷。研究必须区分目标产物分解与溶剂氧化，催化剂降低充电电压本身不能消除所有副反应。",
      "source": "https://pubs.acs.org/doi/10.1021/jz301359t",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2018",
      "yearNumber": 2018,
      "year": "2018",
      "label": "铝空气用油置换减少待机腐蚀",
      "title": "铝空气用油置换减少待机腐蚀",
      "copy": "MIT 研究在待机时用非导电油替换接触铝的电解液，降低自腐蚀。",
      "facts": [
        [
          "100小时",
          "产品目标时长"
        ],
        [
          "原型阶段",
          "不是电站运行结果"
        ]
      ],
      "detail": "MIT 研究在待机时用非导电油替换接触铝的电解液，降低自腐蚀。\n\n原始《Science》论文题名明确为 primary aluminum–air batteries，研究的是一次铝空气体系；重新注入电解液恢复放电，不是原位电化学充电再生铝。\n\n对长时间待命电源，停止用电不等于停止消耗金属。隔离电解液改善储存行为，但泵、油及容器会增加系统质量与复杂度。",
      "source": "https://doi.org/10.1126/science.aat9149",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2021",
      "yearNumber": 2021,
      "year": "2021",
      "label": "非碱性 ZnO₂ 反应路线",
      "title": "非碱性 ZnO₂ 反应路线",
      "copy": "Sun 等将锌空气反应由传统碱性四电子路径改为非碱性过氧化锌路径。",
      "facts": [
        [
          "ZnO₂ / 2 e⁻/O₂",
          "非碱性水系，环境空气运行"
        ]
      ],
      "detail": "Sun 等将锌空气反应由传统碱性四电子路径改为非碱性过氧化锌路径。\n\n原始论文报告 2 e⁻/O₂ 的 ZnO₂ 生成/分解机制，三氟甲磺酸根使空气电极内亥姆霍兹层相对贫水、富 Zn²⁺；论文报告能够在环境空气运行。\n\n改变电解液可以改变主要放电产物，不只是改善同一反应的速度。材料可逆性、空气耐受与电池长期寿命仍是相互关联但不同的证据。",
      "source": "https://doi.org/10.1126/science.abb9554",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "室温固态锂空气推进四电子产物",
      "title": "室温固态锂空气推进四电子产物",
      "copy": "复合固态电解质使室温锂空气实验中 Li₂O 成为主要产物。",
      "facts": [
        [
          "2023",
          "现场测试系统部署年份"
        ],
        [
          "验证阶段",
          "并网测试，不等于商用多年运营"
        ]
      ],
      "detail": "复合固态电解质使室温锂空气实验中 Li₂O 成为主要产物。\n\nKondori 等使用 LGPS 纳米颗粒与改性 PEO 聚合物组成电解质。DOE 年度报告记录扣式测试在室温、1 C、限容量条件下循环 1,000 次，图示限容量为 1,000 mAh/g；该质量归一化不是封装电芯总质量。\n\nLi₂O 与 Li₂O₂ 分别对应不同电子数和反应路径。该结果不能写成“1,000 Wh/kg 实测电芯循环 1,000 次”，也不是完成车辆或电站级验证。",
      "source": "https://doi.org/10.1126/science.abq1347",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "Cambridge 铁空气示范开工",
      "title": "Cambridge 铁空气示范开工",
      "copy": "Great River Energy 与 Form Energy 开工建设多日储能试点。",
      "facts": [
        [
          "课题方向",
          "面向规模储能"
        ],
        [
          "未披露",
          "样机额定功率、电量和并网状态"
        ]
      ],
      "detail": "Great River Energy 与 Form Energy 开工建设多日储能试点。\n\n2024 年 8 月 15 日公告，项目为 1.5 MW / 150 MWh，设计对应 100 h。当时公告预期 2025 年末运行，不能用预期日期替代验收证据。\n\n验证对象从材料与单体扩展到完整电网调度。多日输出需要空气、水分、温度及功率变换协同控制，容量规格不等于已经获得多年可用率数据。",
      "source": "https://formenergy.com/great-river-energy-and-form-energy-break-ground-on-first-of-its-kind-multi-day-energy-storage-project/",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "首套铁空气商用示范部署",
      "title": "首套铁空气商用示范部署",
      "copy": "Form 官方发展时间线记录与 Great River Energy 的首套商用示范系统部署。",
      "facts": [
        [
          "部署",
          "公司披露状态"
        ],
        [
          "多年评估",
          "需单独观察后续可用率、效率和衰减"
        ]
      ],
      "detail": "Form 官方发展时间线记录与 Great River Energy 的首套商用示范系统部署。\n\n这是企业明确列出的 2025 年进展。公开表述为 commercial demonstration，底稿未据此宣称整个 1.5 MW / 150 MWh 项目已完成全容量验收。\n\n安装示范系统与签订项目协议相比更接近现场数据。研究下一步需要持续输出、补能、辅助用电和季节环境下的运行记录。",
      "source": "https://formenergy.com/about/",
      "subject": "route:electrochemical-metal-air:history"
    },
    {
      "id": "electrochemical-metal-air-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "国际项目协议扩展到爱尔兰",
      "title": "国际项目协议扩展到爱尔兰",
      "copy": "FuturEnergy Ireland 与 Form 签署 100 小时铁空气项目协议。",
      "facts": [
        [
          "300MW/30GWh",
          "Xcel项目规划"
        ],
        [
          "10MW/1000MWh",
          "爱尔兰协议，计划2029投运"
        ],
        [
          "1GW",
          "开发商清洁电力目标，不是电池功率"
        ]
      ],
      "detail": "FuturEnergy Ireland 与 Form 签署 100 小时铁空气项目协议。\n\n2026 年 3 月 17 日公告为 10 MW / 1,000 MWh，预计 2029 年上线。10 MW 是该电池功率；开发商更广的 1 GW 清洁电力目标不是电池额定功率。\n\n长时方案进入新的电网与项目开发环境。协议和预计投运时间是商业进度，不能与 2025 年已部署示范或原始论文实验合并为装机实绩。",
      "source": "https://formenergy.com/form-energy-and-futurenergy-ireland-announce-agreement-to-deploy-first-iron-air-battery-storage-project-in-ireland/",
      "subject": "route:electrochemical-metal-air:history"
    }
  ],
  "materials": [
    {
      "id": "metal-air-material-iron",
      "label": "铁负极",
      "year": "材料",
      "title": "充电把铁氧化物还原为金属铁",
      "copy": "铁空气储能通过可逆铁氧化还原储放电；长期运行关注活性材料转化、钝化及副反应。",
      "facts": [
        [
          "可逆循环",
          "铁空气商业产品的关键条件"
        ],
        [
          "铁质量",
          "不是完整电池Wh/kg分母"
        ]
      ],
      "subject": "material:electrochemical-metal-air-iron-anode"
    },
    {
      "id": "metal-air-material-air",
      "label": "空气电极",
      "year": "材料",
      "title": "氧气反应和三相界面控制功率",
      "copy": "空气电极必须让气体、液相电解质和电子导体有效接触；气体扩散、催化层与孔隙影响反应速率和耐久。",
      "facts": [
        [
          "气/液/固三相界面",
          "空气电极反应区域"
        ],
        [
          "水管理",
          "影响传质和电极寿命"
        ]
      ],
      "subject": "material:electrochemical-metal-air-air-cathode"
    },
    {
      "id": "metal-air-material-electrolyte",
      "label": "电解液与气体管理",
      "year": "材料",
      "title": "电解质和氧气通道共同决定实际运行",
      "copy": "电解液组成、浓度、液量和循环会影响欧姆阻力、副反应及维护；系统还需过滤/气体管理和密封。",
      "facts": [
        [
          "电解质",
          "按具体铁空气化学验证"
        ],
        [
          "辅助系统",
          "必须计入系统能耗"
        ]
      ],
      "subject": "material:electrochemical-metal-air-electrolyte"
    },
    {
      "id": "metal-air-material-reversible",
      "label": "可充单元和一次性金属空气",
      "year": "材料",
      "title": "能否外部充电是路线边界",
      "copy": "可充铁空气通过外部电能恢复铁态；不少铝空气等产品依靠消耗/更换金属燃料，不可直接作为电网可充电储能。",
      "facts": [
        [
          "铁空气",
          "公司商业产品定义为可充电"
        ],
        [
          "铝空气燃料",
          "金属消耗不等于回充储电"
        ]
      ],
      "subject": "material:electrochemical-metal-air-reversible-cell"
    }
  ],
  "companies": [
    {
      "id": "electrochemical-metal-air-form",
      "label": "Form Energy",
      "year": "2025",
      "title": "铁空气系统进入商业示范",
      "copy": "Form公司称其首套商业示范已部署，产品目标最长100小时；实际商业表现应等待场站运行评估。",
      "facts": [
        [
          "1.5MW/150MWh",
          "试点开工公告规模"
        ],
        [
          "100小时",
          "系统设计目标，非多年现场实测"
        ]
      ],
      "subject": "company:electrochemical-metal-air-form"
    },
    {
      "id": "electrochemical-metal-air-sinap",
      "label": "中科院上海应物所",
      "year": "2024",
      "title": "高温金属空气规模储能列入研究方向",
      "copy": "招生目录公开高温金属空气电池研究方向，未给出实验结果或投运规模。",
      "facts": [
        [
          "研究方向",
          "高温金属空气，无公开样机容量"
        ],
        [
          "边界",
          "不是商业产品或已投运项目"
        ]
      ],
      "subject": "company:electrochemical-metal-air-sinap"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史脉络",
      "title": "从实验原型到铁空气商业示范",
      "content": "### 1933｜空气去极化一次电池的原始专利\n\nHeise 的专利把金属负极、含碳空气正极和糊状电解液组成可更换部件的电源。\n\nUS1899615A 于 1925 年申请、1933 年 2 月 28 日公开授权，优选负极为锌。专利描述空气中的氧参与正极过程，并明确属于一次电池。\n\n反应物可从环境供给，减少内部正极氧化剂负担；电极透气、润湿与保存方式成为器件设计条件。此处是可核早期专利节点，不宣称金属空气唯一发明年份。\n\n来源：[原始资料](https://patents.google.com/patent/US1899615A/en)\n\n### 1978｜30 kWh 铁空气牵引系统被测试\n\n铁空气已在早期电动车研究中推进到系统尺度。\n\n《Journal of Power Sources》原始论文报道已开发测试的 30 kWh 铁空气系统，5 小时放电率下比能量 80 Wh/kg。该数值属于论文系统和工况，不是今天所有铁空气电池的规格。\n\n证明金属空气的工程问题早于当前长时市场。牵引系统追求质量与功率；今天低频多日储能的成本和寿命目标不同，不能直接继承旧车用测试结论。\n\n来源：[原始资料](https://www.sciencedirect.com/science/article/pii/0378775378850198) ；[DOI](https://doi.org/10.1016/0378-7753%2878%2985019-8)\n\n### 1996｜聚合物电解质锂氧原型\n\nAbraham 与 Jiang 以锂金属、聚合物电解质和碳复合氧电极构建可充锂氧电池。\n\n论文发表于《Journal of The Electrochemical Society》143，1–5。作者公开保存的原文描述叠层约 200–300 μm，开路约 3 V，负载电压约 2–2.8 V，取决于负载。\n\n把金属锂与气体反应电极结合，形成区别于嵌入型正极的研究方向。薄实验叠层不等同完整电池包，实验氧气环境也不能直接推广到任意户外空气。\n\n来源：[原始资料](https://doi.org/10.1149/1.1836378) ；作者公开原文：[原始资料](https://www.researchgate.net/publication/234902950_A_Polymer_Electrolyte-Based_Rechargeable_LithiumOxygen_Battery)\n\n### 2006｜Li₂O₂ 的形成与分解得到气体证据\n\nOgasawara 等用原位质谱考察锂氧正极的可逆反应。\n\n论文观察放电形成 Li₂O₂、充电释放 O₂，并讨论有无催化剂的充放电。这是反应可逆性的实验节点，而不是汽车电池量产节点。\n\n充电时有电流并不自动说明放电产物被干净恢复；识别氧气释放与产物变化，开始成为评价依据。\n\n来源：[原始资料](https://pubs.acs.org/doi/10.1021/ja056811q)\n\n### 2012｜可充电性评价转向定量化学平衡\n\nMcCloskey 等指出，电压曲线和容量保持不足以证明锂氧反应真正可逆。\n\n该论文用定量差分电化学质谱比较多种非水电解液，所测体系的氧回收效率 OER/ORR 均低于 90%。这不是整电池能量效率，也不是对后来所有配方的结论。\n\n副反应也会消耗或产生电荷。研究必须区分目标产物分解与溶剂氧化，催化剂降低充电电压本身不能消除所有副反应。\n\n来源：[原始资料](https://pubs.acs.org/doi/10.1021/jz301359t)\n\n### 2018｜铝空气用油置换减少待机腐蚀\n\nMIT 研究在待机时用非导电油替换接触铝的电解液，降低自腐蚀。\n\n原始《Science》论文题名明确为 primary aluminum–air batteries，研究的是一次铝空气体系；重新注入电解液恢复放电，不是原位电化学充电再生铝。\n\n对长时间待命电源，停止用电不等于停止消耗金属。隔离电解液改善储存行为，但泵、油及容器会增加系统质量与复杂度。\n\n来源：[原始资料](https://doi.org/10.1126/science.aat9149) ；研究机构：[原始资料](https://news.mit.edu/2018/metal-air-batteries-extending-life-1108)\n\n### 2021｜非碱性 ZnO₂ 反应路线\n\nSun 等将锌空气反应由传统碱性四电子路径改为非碱性过氧化锌路径。\n\n原始论文报告 2 e⁻/O₂ 的 ZnO₂ 生成/分解机制，三氟甲磺酸根使空气电极内亥姆霍兹层相对贫水、富 Zn²⁺；论文报告能够在环境空气运行。\n\n改变电解液可以改变主要放电产物，不只是改善同一反应的速度。材料可逆性、空气耐受与电池长期寿命仍是相互关联但不同的证据。\n\n来源：[原始资料](https://doi.org/10.1126/science.abb9554) ；作者机构原文：[原始资料](https://bpb-us-e1.wpmucdn.com/blog.umd.edu/dist/7/477/files/2021/08/2-A-rechargeable-zinc-air-battery-based-on-zinc-peroxide-chemistry.pdf)\n\n### 2023｜室温固态锂空气推进四电子产物\n\n复合固态电解质使室温锂空气实验中 Li₂O 成为主要产物。\n\nKondori 等使用 LGPS 纳米颗粒与改性 PEO 聚合物组成电解质。DOE 年度报告记录扣式测试在室温、1 C、限容量条件下循环 1,000 次，图示限容量为 1,000 mAh/g；该质量归一化不是封装电芯总质量。\n\nLi₂O 与 Li₂O₂ 分别对应不同电子数和反应路径。该结果不能写成“1,000 Wh/kg 实测电芯循环 1,000 次”，也不是完成车辆或电站级验证。\n\n来源：[原始资料](https://doi.org/10.1126/science.abq1347) ；[原始资料](https://www.energy.gov/sites/default/files/2024-11/2023_U.S._DRIVE_Accomplishments_Report_FINAL.pdf) （电化学储能章节，第 11 页）\n\n### 2024｜Cambridge 铁空气示范开工\n\nGreat River Energy 与 Form Energy 开工建设多日储能试点。\n\n2024 年 8 月 15 日公告，项目为 1.5 MW / 150 MWh，设计对应 100 h。当时公告预期 2025 年末运行，不能用预期日期替代验收证据。\n\n验证对象从材料与单体扩展到完整电网调度。多日输出需要空气、水分、温度及功率变换协同控制，容量规格不等于已经获得多年可用率数据。\n\n来源：[原始资料](https://formenergy.com/great-river-energy-and-form-energy-break-ground-on-first-of-its-kind-multi-day-energy-storage-project/)\n\n### 2025｜首套铁空气商用示范部署\n\nForm 官方发展时间线记录与 Great River Energy 的首套商用示范系统部署。\n\n这是企业明确列出的 2025 年进展。公开表述为 commercial demonstration，底稿未据此宣称整个 1.5 MW / 150 MWh 项目已完成全容量验收。\n\n安装示范系统与签订项目协议相比更接近现场数据。研究下一步需要持续输出、补能、辅助用电和季节环境下的运行记录。\n\n来源：[原始资料](https://formenergy.com/about/) （Our Progress，2025）\n\n### 2026｜国际项目协议扩展到爱尔兰\n\nFuturEnergy Ireland 与 Form 签署 100 小时铁空气项目协议。\n\n2026 年 3 月 17 日公告为 10 MW / 1,000 MWh，预计 2029 年上线。10 MW 是该电池功率；开发商更广的 1 GW 清洁电力目标不是电池额定功率。\n\n长时方案进入新的电网与项目开发环境。协议和预计投运时间是商业进度，不能与 2025 年已部署示范或原始论文实验合并为装机实绩。\n\n来源：[原始资料](https://formenergy.com/form-energy-and-futurenergy-ireland-announce-agreement-to-deploy-first-iron-air-battery-storage-project-in-ireland/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料结构",
      "title": "金属负极与空气电极要可逆协作",
      "content": "### 金属负极：铁、锌、锂与铝\n\n铁空气利用铁的氧化与还原，固定式设计可优先考虑低成本与储能时长；锌需要控制重复沉积的形貌与腐蚀；锂具有很强反应活性，需要隔离不希望接触的空气成分；常见水系铝空气在放电后通过更换金属、外部再生恢复能源供应。材料的理论比能量不能直接代表带电解液、气路和电力电子的系统。\n\n来源：[原始资料](https://www.sciencedirect.com/science/article/pii/0378775378850198) ；[原始资料](https://doi.org/10.1126/science.abb9554) ；[原始资料](https://doi.org/10.1126/science.aat9149)\n\n### 多孔空气电极与催化层\n\n空气正极需要让气体、离子与电子在反应区域会合。催化剂可以促进放电氧还原和充电析氧，但二者所需电位与耐久性不同。含碳多孔结构提供通道和导电，若被液体淹没会损失气体传输，若过度干燥又会失去离子接触。电极峰值功率不能代替长时间水分平衡和催化层寿命。\n\n来源：[原始资料](https://patents.google.com/patent/US1899615A/en) ；[原始资料](https://pubs.acs.org/doi/10.1021/ja056811q) ；[原始资料](https://doi.org/10.1126/science.abb9554)\n\n### 电解液与放电产物\n\n传统碱性锌空气主要关注 ZnO 相关反应与四电子氧过程；2021 年非碱性体系则产生 ZnO₂。非水锂氧常以 Li₂O₂ 为目标，2023 年复合固态体系报告 Li₂O 为主要产物。电解液不是纯粹传输媒介，其水活性、溶剂稳定性和界面结构会决定实际反应路径。\n\n来源：[原始资料](https://doi.org/10.1126/science.abb9554) ；[原始资料](https://pubs.acs.org/doi/10.1021/jz301359t) ；[原始资料](https://doi.org/10.1126/science.abq1347)\n\n### 隔离膜、气体通道与水分管理\n\n离子导通层必须隔开金属与不兼容物质，同时维持足够低的阻抗。空气中的 CO₂ 可影响碱性体系，水汽既可能是反应条件也可能带来副反应；实验纯氧、人工配气与真实空气是不同工况。固态聚合物/无机复合电解质属于材料路径，过滤、除湿和气路属于系统路径，二者都占用空间与辅助能耗。\n\n来源：[原始资料](https://www.alcf.anl.gov/news/out-thin-air) ；[原始资料](https://doi.org/10.1126/science.abb9554) ；[原始资料](https://doi.org/10.1126/science.abq1347)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文与测试",
      "title": "100小时目标不等于完整寿命证据",
      "content": "| 原始研究 | 数据 / 方法 | 实际证据范围 |\n|---|---|---|\n| An iron–air vehicle battery，1978 | 30 kWh 系统；5 h 放电率下 80 Wh/kg | 牵引系统测试，不是现代 100 h 电站。[DOI](https://doi.org/10.1016/0378-7753%2878%2985019-8) |\n| Abraham / Jiang，1996 | 聚合物锂氧叠层约 200–300 μm；负载电压约 2–2.8 V | 原型结构与负载依赖，不计作完整系统能量密度。[DOI](https://doi.org/10.1149/1.1836378) |\n| Ogasawara 等，2006 | 原位质谱识别充电释氧、放电 Li₂O₂ | 化学可逆性证据。[DOI](https://doi.org/10.1021/ja056811q) |\n| McCloskey 等，2012 | 定量 DEMS；所测非水电解液 OER/ORR <90% | 氧回收效率，不是往返电效率；说明副反应会干扰循环曲线。[DOI](https://doi.org/10.1021/jz301359t) |\n| Hopkins 等，2018 | 铝空气待机油置换，研究自腐蚀抑制 | 一次电池的待机管理，不是可逆充铝。[DOI](https://doi.org/10.1126/science.aat9149) |\n| Sun 等，2021 | 非碱性水系 ZnO₂；2 e⁻/O₂；环境空气运行 | 电解液改变氧反应路径。[DOI](https://doi.org/10.1126/science.abb9554) |\n| Kondori 等，2023 | LGPS/改性 PEO；室温 Li₂O 路径；限容量 1 C 扣式循环 | 1,000 次是受限实验循环，不能配上尚未实测的整芯 Wh/kg。[DOI](https://doi.org/10.1126/science.abq1347) |\n\n### 三种效率要分开\n\n库仑效率比较放出与充入的电荷；氧回收效率比较气体消耗与释放；能量往返效率还包含充放电电压差及系统辅助损耗。金属空气中，副反应会造成三者分离。记录稳定电压不等于已经闭合物质平衡，材料理论能量也不包括气路和水分管理。\n\n原始来源：[1933 空气去极化一次电池的原始专利](https://patents.google.com/patent/US1899615A/en)\n\n原始来源：[1978 30 kWh 铁空气牵引系统被测试](https://www.sciencedirect.com/science/article/pii/0378775378850198)\n\n原始来源：[1996 聚合物电解质锂氧原型](https://doi.org/10.1149/1.1836378)\n\n原始来源：[2006 Li₂O₂ 的形成与分解得到气体证据](https://pubs.acs.org/doi/10.1021/ja056811q)\n\n原始来源：[2012 可充电性评价转向定量化学平衡](https://pubs.acs.org/doi/10.1021/jz301359t)\n\n原始来源：[2018 铝空气用油置换减少待机腐蚀](https://doi.org/10.1126/science.aat9149)\n\n原始来源：[2021 非碱性 ZnO₂ 反应路线](https://doi.org/10.1126/science.abb9554)\n\n原始来源：[2023 室温固态锂空气推进四电子产物](https://doi.org/10.1126/science.abq1347)\n\n原始来源：[2024 Cambridge 铁空气示范开工](https://formenergy.com/great-river-energy-and-form-energy-break-ground-on-first-of-its-kind-multi-day-energy-storage-project/)\n\n原始来源：[2025 首套铁空气商用示范部署](https://formenergy.com/about/)\n\n原始来源：[2026 国际项目协议扩展到爱尔兰](https://formenergy.com/form-energy-and-futurenergy-ireland-announce-agreement-to-deploy-first-iron-air-battery-storage-project-in-ireland/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业与制造",
      "title": "Form已有工厂与项目示范，仍持续放大",
      "content": "| 主体 | 技术位置 | 可核关联 |\n|---|---|---|\n| Form Energy | 可充铁空气，多日固定式储能 | 2024 开工、2025 官方商用示范部署、2026 国际协议；采用各自证据状态。[原始资料](https://formenergy.com/about/) |\n| Great River Energy | 示范业主与电网应用研究 | Cambridge 1.5 MW / 150 MWh 项目合作。[原始资料](https://greatriverenergy.com/what-we-do/cambridge-energy-storage-project/) |\n| Xcel Energy | 铁空气多日项目与电网集成 | DOE MIND 项目拟建两套 10 MW、100 h 系统。[原始资料](https://www.energy.gov/sites/default/files/2024-06/FactSheet_LDESAward_Xcel_6.5.24_v3.pdf) |\n| FuturEnergy Ireland | 爱尔兰开发与应用场景 | 10 MW / 1,000 MWh 协议，计划 2029；不是 1 GW 电池。来源见 2026 节点。 |\n\n铝空气和锌空气公司的产品、规模及图片由企业底稿补充；不能把原始实验材料的性能归到某家公司商品上。\n\n### Form Energy\n\nForm Energy为私营储能企业，首个商业产品是可充铁空气系统，面向多日储能。\n\n官网称员工超过1000人。公司称2025年与Great River Energy部署首套商业示范；2026公布的Xcel及爱尔兰项目仍为计划/协议。\n\n原始来源：[Form Energy进展](https://formenergy.com/about/) · [技术说明](https://formenergy.com/technology/battery-technology/) · [Great River项目](https://formenergy.com/great-river-energy-and-form-energy-break-ground-on-first-of-its-kind-multi-day-energy-storage-project/) · [爱尔兰公告，2026-03-17](https://formenergy.com/form-energy-and-futurenergy-ireland-announce-agreement-to-deploy-first-iron-air-battery-storage-project-in-ireland/)\n\n### 中科院上海应物所\n\n中科院上海应用物理研究所公开研究方向包含面向规模储能的高温金属空气电池；不是商业企业或已投运项目。\n\n招生目录列出高温金属空气和水系铁电池研究方向，未给出已完成实验、样机容量或并网状态。\n\n原始来源：[硕士招生目录](https://sinap.cas.cn/yjsjynew/zsjz/sszs_177904/202407/W020240725722368110027.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策与市场",
      "title": "规划项目不计入现有运行装机",
      "content": "### 多日储能示范的资助状态\n\nDOE 在 2024 年 6 月公布 MIND 项目前两阶段获资助超过 430 万美元，总联邦分担上限 7,000 万美元。项目拟在 Minnesota 与 Colorado 的退役煤电场地各部署一套 10 MW、100 h 系统。分阶段资助支持开发与验证，不代表总额已拨付或两套设备已运行。\n\n来源：[原始资料](https://www.energy.gov/cmei/oced/articles/award-wednesdays-june-5-2024) ；[原始资料](https://www.energy.gov/sites/default/files/2024-06/FactSheet_LDESAward_Xcel_6.5.24_v3.pdf)\n\n### 项目协议与制造融资\n\nForm 2026 年 8 月 12 日宣布 7.5 亿美元 G 轮融资，并披露约 80 GWh 项目协议积压量。融资是私人股权事件，80 GWh 是协议范围，不是当期装机、出货或已通过性能验收容量。公司 100 h 产品定位服务多日供电，价值还取决于项目调度、补能和可靠性。\n\n来源：[原始资料](https://formenergy.com/form-energy-secures-750m-in-series-g-financing/)\n\n### 不同金属的市场不能相加\n\n一次锌空气的小型设备市场、铝空气金属补给电源、实验锂空气与可充铁空气固定式工程面对不同需求。按“金属空气”汇总研究是合理分类，按统一电芯价格、装机量或效率展示则需要明确子体系与统计边界。\n\n### 2026 Xcel与Google数据中心项目计划\n\n2026年2月24日Xcel公告计划为Google明尼苏达数据中心配置**300 MW / 30 GWh** Form铁空气储能，设计持续100h。公告当时能源服务协议尚需明尼苏达公用事业委员会批准；这是新项目计划，区别于2024年DOE支持的两套10MW/100h项目。\n\n原始来源：[Xcel原始公告，2026-02-24](https://newsroom.xcelenergy.com/news/xcel-energy-to-power-new-google-data-center-in-minnesota) · [Form发展时间线](https://formenergy.com/about/)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "多日储能须验证系统效率和维护成本",
      "content": "| 分支 / 场景 | 主要价值 | 实际取舍 |\n|---|---|---|\n| 铁空气 / 多日电网支撑 | 丰富材料与较长设计放电时长，针对连续低风低光和极端供需事件 | 功率密度、占地、充电时间、往返能量损耗及现场寿命 |\n| 可充锌空气 / 固定式或分布式 | 水系反应与环境氧气作为反应物 | 双功能电极耐久、锌形貌、CO₂ 与湿度、空气通量 |\n| 锂氧 / 锂空气研究 | 高理论比能与不同氧产物化学 | 金属保护、副反应、真实空气、受限容量循环到实用电芯的放大 |\n| 铝空气 / 备用与金属补给 | 停机隔离及更换金属可支持特定离网任务 | 金属再生在外部发生，需计入冶炼能耗、物流、水和辅助设备 |\n\n### 百小时与高频调节\n\n100 h 设计表示在规定额定功率下的能量/功率配比；1.5 MW × 100 h 对应 150 MWh，10 MW × 100 h 对应 1,000 MWh。该配比不自动给出充电时间、往返效率或每天满循环能力。多日储能可以与短时功率设备共同运行，具体分工由电网任务和经济性决定。\n\n### 空气不是无成本部件\n\n氧进入电极的速度限制电流，潮湿与干燥改变电解液状态，CO₂ 和其他杂质可能触发副反应。若实验使用净化氧气，系统比较必须包含相应供气设施；若声称直接用空气，应给出组成、湿度和过滤条件。每种材料的理论能量最终都要经过完整装置与现场运行检验。\n\n### 已核证据状态\n\n1978 年为论文系统测试；2023 年锂空气为实验室扣式研究；2024 年 Cambridge 为开工；2025 年为官方记录的首套商用示范部署；2026 年爱尔兰为协议与 2029 年目标。保持这些状态即可形成从机理到工程的时间线，无需将不同阶段拼成成熟度纪录。",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "metal-air-policy",
    "label": "政策背景",
    "year": "2025",
    "title": "新型储能规模化建设专项行动方案",
    "copy": "政策支持新型储能多元路线和试点验证；文件不代表金属空气已商业成熟。",
    "facts": [
      [
        "2025—2027",
        "行动方案周期"
      ],
      [
        "路线状态",
        "多元示范与技术创新框架"
      ]
    ],
    "subject": "scene:electrochemical-policy"
  },
  "market": {
    "id": "metal-air-market",
    "label": "统计口径",
    "year": "2026",
    "title": "大型合作公告仍属于规划容量",
    "copy": "Form与Xcel、FuturEnergy Ireland公布的项目规模需按计划项目登记，投运后再计入已装资产。",
    "facts": [
      [
        "10MW/1000MWh",
        "爱尔兰协议，预期2029投运"
      ],
      [
        "300MW/30GWh",
        "Xcel计划项目"
      ],
      [
        "不是已投运量",
        "协议容量不能当现有装机"
      ]
    ],
    "subject": "scene:electrochemical-metal-air-market"
  },
  "papers": {
    "id": "metal-air-papers",
    "label": "研究与测试依据",
    "year": "2026",
    "title": "从铁空气系统到锂空气产物研究",
    "copy": "历史铁空气给出牵引系统测试。锂空气扣式循环与铁空气多日工程分别研究化学可逆性和系统交付。",
    "facts": [
      [
        "30 kWh / 80 Wh/kg",
        "1978铁空气系统，5h放电率"
      ],
      [
        "1000次",
        "2023锂空气室温限容量1C扣式循环"
      ]
    ],
    "subject": "route:electrochemical-metal-air:history"
  },
  "storage": {
    "id": "metal-air-storage",
    "label": "应用适配",
    "year": "100小时",
    "title": "面向多日供能的系统级验证",
    "copy": "可充铁空气适合研究长放电任务；系统效率、寿命和电极维护需要运营数据确认。",
    "facts": [
      [
        "时长",
        "厂商目标，不是单次独立实测参数"
      ],
      [
        "收益",
        "按实际可交付交流电量核算"
      ]
    ],
    "subject": "route:electrochemical-metal-air:history"
  }
};
