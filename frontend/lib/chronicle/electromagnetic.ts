import type { ChronicleResearch } from "./researchRoutes";

export const supercapacitorResearch: ChronicleResearch = {
  "name": "超级电容",
  "timeline": [
    {
      "id": "supercapacitor-1957",
      "yearNumber": 1957,
      "year": "1957",
      "label": "多孔碳低压电容专利",
      "title": "多孔碳低压电容专利",
      "copy": "Becker 的低压电解电容专利采用多孔碳电极与电解液，成为电化学电容的重要早期器件证据。",
      "facts": [
        [
          "<2.5 V",
          "早期低压专利，1954申请/1957授权"
        ]
      ],
      "detail": "Becker 的低压电解电容专利采用多孔碳电极与电解液，成为电化学电容的重要早期器件证据。\n\n1954-04-14 申请、1957-07-23 授权 US2800616A；专利针对低于 2.5 V 的应用。它是历史专利，不以当年的机理猜测替代今天的双电层理论。\n\n多孔电极内部表面被用于提高电容；后续工程需要解决有效表面、离子通达性及电解液稳定窗口，而不只是增大外形体积。",
      "source": "https://patents.google.com/patent/US2800616A/en",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-1966",
      "yearNumber": 1966,
      "year": "1966",
      "label": "界面离子吸附成为器件设计核心",
      "title": "界面离子吸附成为器件设计核心",
      "copy": "Rightmire 专利将电子导体与离子导体界面的电场和离子吸附用于能量存储。",
      "facts": [
        [
          "1966",
          "界面吸附储电专利授权"
        ]
      ],
      "detail": "Rightmire 专利将电子导体与离子导体界面的电场和离子吸附用于能量存储。\n\nUS3288641，1962 年申请、1966-11-29 授权。专利还讨论可逆电化学反应的贡献，不能把所有后续超级电容统一描述为完全无反应的物理器件。\n\n材料界面与电解质共同决定储电，形成与传统介质电容不同的设计路径。低内阻、可用电压与长期密封仍需器件验证。",
      "source": "https://ptacts.uspto.gov/ptacts/public-informations/petitions/1526770/download-documents?artifactId=hjse67xhWrwtPYetcB2s7QeUmga2JypCO-KvtVBXGL8e2zpXbwXl0eI",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2006",
      "yearNumber": 2006,
      "year": "2006",
      "label": "亚纳米孔重新定义可用表面积",
      "title": "亚纳米孔重新定义可用表面积",
      "copy": "Chmiola 等发现小于 1 nm 的碳孔仍可贡献显著电容，推动电极设计从单纯追求面积转向孔—离子匹配。",
      "facts": [
        [
          "0.6–2.25 nm",
          "碳化物衍生碳孔径，有机电解液"
        ]
      ],
      "detail": "Chmiola 等发现小于 1 nm 的碳孔仍可贡献显著电容，推动电极设计从单纯追求面积转向孔—离子匹配。\n\n碳化物衍生碳平均孔径范围 0.6–2.25 nm；在有机电解液中测试双电层电容。论文没有证明所有越小孔径都更好。\n\n溶剂化、孔内离子排列和脱溶剂化使孔可达性不能仅由溶剂化离子直径判断。高倍率下还要考虑传输距离和孔网络。",
      "source": "https://doi.org/10.1126/science.1132195",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2010",
      "yearNumber": 2010,
      "year": "2010",
      "label": "垂直石墨烯支持交流纹波滤波",
      "title": "垂直石墨烯支持交流纹波滤波",
      "copy": "Miller 等让石墨烯纳米片直接生长在金属集流体上，减少电子与离子路径阻力。",
      "facts": [
        [
          "120 Hz / RC <200 μs",
          "垂直石墨烯小器件滤波"
        ]
      ],
      "detail": "Miller 等让石墨烯纳米片直接生长在金属集流体上，减少电子与离子路径阻力。\n\n原始论文展示 120 Hz 滤波，RC 时间常数小于 200 μs。RC 常数不是把任意大容量模组充满所需时间。\n\n功率与频率响应可以通过电极结构优化；高表面积若来自深而曲折的孔，未必适合高频滤波。该研究是小器件功能验证，不是电网级储能系统。",
      "source": "https://doi.org/10.1126/science.1194372",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "MXene 拓展插层电容材料",
      "title": "MXene 拓展插层电容材料",
      "copy": "Lukatskaya 等证明多种阳离子可进入 Ti₃C₂ 层间，二维导电材料成为高体积电容方向。",
      "facts": [
        [
          ">300 F/cm³",
          "MXene电极体积电容，水系离子插层"
        ]
      ],
      "detail": "Lukatskaya 等证明多种阳离子可进入 Ti₃C₂ 层间，二维导电材料成为高体积电容方向。\n\n水系盐溶液中的单价、多价离子插层；原始摘要报告超过 300 F/cm³。作者稿进一步指出无黏结剂 MXene 纸在碱性体系表现突出。该单位是电极体积电容，不能直接写作整机能量密度。\n\n研究扩展了纯表面吸附以外的快速储电过程；但体积优势还需与电压、厚电极传输、氧化稳定性和完整两电极器件一起评价。",
      "source": "https://doi.org/10.1126/science.1241488",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2015",
      "yearNumber": 2015,
      "year": "2015",
      "label": "轨道交通型大电容单体披露",
      "title": "轨道交通型大电容单体披露",
      "copy": "中国中车社会责任报告披露面向交通应用的新一代大容量电容产品，将材料开发与频繁补能场景连接。",
      "facts": [
        [
          "3 V / 12000 F",
          "石墨烯—活性炭单体"
        ],
        [
          "2.8 V / 30000 F",
          "另一纳米混合单体"
        ]
      ],
      "detail": "中国中车社会责任报告披露面向交通应用的新一代大容量电容产品，将材料开发与频繁补能场景连接。\n\n2015 年 10 月产品规格包括 3 V/12000 F 石墨烯—活性炭复合电极与 2.8 V/30000 F 纳米混合型。两种产品体系不同，不能合并成“3 V、30000 F”单一纪录。\n\n站间快速补能与制动回收利用了高功率特征。单体电压、电容并不能直接决定整车续航，还需要串并联数量、最低使用电压、载荷和线路条件。",
      "source": "https://www.crrcgc.cc/Portals/71/Uploads/Files/2016/6-30/636028986785430729.pdf",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-inl-blackstart-2021",
      "yearNumber": 2021,
      "year": "2021",
      "label": "小水电+超级电容黑启动与孤岛试验",
      "title": "小水电+超级电容黑启动与孤岛试验",
      "copy": "INL与Idaho Falls Power把超容接入小水电系统，现场试验显示超容承担快速、大功率短时响应，让水电机组逐步跟上负荷。",
      "facts": [
        [
          "一周现场试验",
          "2021-04小水电+超容黑启动"
        ]
      ],
      "detail": "小水电+超级电容黑启动与孤岛试验。INL与Idaho Falls Power把超容接入小水电系统，现场试验显示超容承担快速、大功率短时响应，让水电机组逐步跟上负荷。DOE明确指出该设备不能提供电池式持续输出。\n\n现场测试持续一周，研究黑启动与孤岛运行。 两台6 MW设备是模拟关键负荷的负载箱规格，不是超容装置额定功率。 DOE未在该篇披露设备的kW/kWh或放电时长。",
      "source": "https://www.energy.gov/cmei/water/articles/first-kind-tests-demonstrate-how-small-hydropower-plants-and-energy-storage-can",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2023",
      "yearNumber": 2023,
      "year": "2023",
      "label": "水泥—碳网络成为结构储电原型",
      "title": "水泥—碳网络成为结构储电原型",
      "copy": "PNAS 研究将水泥、水和炭黑构成的导电网络用于电化学电容，探索承载材料与储电的结合。",
      "facts": [
        [
          "1 M KCl",
          "碳—水泥两电极原型"
        ]
      ],
      "detail": "PNAS 研究将水泥、水和炭黑构成的导电网络用于电化学电容，探索承载材料与储电的结合。\n\n实验电池由两片电解液饱和的碳—水泥电极、玻璃纤维隔膜和石墨集流体组成，采用 1 M KCl。建筑地基级容量是放大设想，不是已建住宅电站。\n\n低单位体积容量可通过结构体积补偿，但导电碳含量、电化学性能和力学强度存在取舍；防干燥、封装、接线和长期漏电仍是工程课题。",
      "source": "https://www.pnas.org/doi/10.1073/pnas.2304318120",
      "subject": "route:supercapacitor:history"
    },
    {
      "id": "supercapacitor-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "结构储电推进到 12 V 模组",
      "title": "结构储电推进到 12 V 模组",
      "copy": "后续碳—水泥研究展示串联模组和承载拱形原型，开始检验材料到器件的集成。",
      "facts": [
        [
          "12 V / 49.8 F",
          "12单元，2 M KCl，电容为速率外推"
        ],
        [
          "304 Wh/m³ = 0.304 Wh/L",
          "约0.003 m³模组"
        ]
      ],
      "detail": "后续碳—水泥研究展示串联模组和承载拱形原型，开始检验材料到器件的集成。\n\n12 个约 1 V 单元串联、2 M KCl，模组约 0.003 m³；论文报告 12 V、拟合低速极限电容约 49.8 F、304 Wh/m³。304 Wh/m³ 等于 0.304 Wh/L，不是 304 Wh/L。\n\n原型可驱动小型风扇等负载，证明连线和供电功能；电容由不同扫描速率外推，不能把低速极限能量与最高倍率同时宣传为实测整机性能。\n\n\n莱比锡超级电容工厂启用。Skeleton称工厂已启用，设计年产能最高1200万只电芯、投资€220m。容量为公司披露的设计值；实际年产、合格率和电网项目装机量未由该公告量化。\n\n产品页D60单体比能量为厂商标称8.27–11.1 Wh/kg，不能代替含功率变换、热管理、支撑结构的系统比能量。 公司新闻稿称工厂向部分电网与数据中心客户交付产品；该信息为公司披露。\n\n\n江海股份超级电容业务增长并取得批量订单。公司年报显示超级电容器收入人民币3.52亿元，并报告电网调频/SVG等应用出现批量订单。年报未给出这些订单对应的独立储能站数量和单站能量。\n\n超级电容收入同比增长17.32%。 公司获奖项目为“兆瓦级超级电容复合储能系统关键技术及工程应用”，属于复合储能技术项目，不应描述为已部署同容量的纯超容电站。",
      "source": "https://doi.org/10.1073/pnas.2511912122",
      "subject": "route:supercapacitor:history"
    }
  ],
  "materials": [
    {
      "id": "supercapacitor-carbon",
      "label": "多孔碳电极",
      "year": "界面",
      "title": "面积、孔径和传输网络",
      "copy": "活性炭、碳化物衍生碳和石墨烯通过可达界面储存电荷。纳米孔提供储电面积，较大孔与短路径支持快速离子输运；电极增厚会提高单位面积载量，也可能降低高倍率利用率。",
      "facts": [
        [
          "孔—离子匹配",
          "材料结构与完整器件分别评价"
        ]
      ],
      "subject": "material:supercapacitor-carbon"
    },
    {
      "id": "supercapacitor-pseudocapacitive",
      "label": "赝电容与插层电极",
      "year": "界面",
      "title": "快速反应的电位响应",
      "copy": "某些氧化物、导电聚合物及二维材料可以通过快速可逆电荷转移获得电容式响应。是否属于赝电容，取决于反应和电位响应，不能因为材料含金属或循环曲线面积大就下结论。",
      "facts": [
        [
          ">300 F/cm³",
          "2013 MXene电极体积电容"
        ]
      ],
      "subject": "material:supercapacitor-pseudocapacitive"
    },
    {
      "id": "supercapacitor-electrolyte",
      "label": "电解液与隔膜",
      "year": "界面",
      "title": "电压窗口和离子电阻",
      "copy": "水系、有机和离子液体在离子电导、可用电压、低温黏度与材料兼容性之间取舍。隔膜须阻止电子短路同时允许离子通过，其厚度与浸润关系到内阻。",
      "facts": [
        [
          "E=½CV²",
          "材料结构与完整器件分别评价"
        ]
      ],
      "subject": "material:supercapacitor-electrolyte"
    },
    {
      "id": "supercapacitor-module",
      "label": "集流体、封装与均压",
      "year": "界面",
      "title": "把电极变成模组",
      "copy": "金属或石墨集流体、端子接触、密封、均压电路与功率转换器决定整机性能。串联提高电压但降低等效电容，各单体漏电差异还会造成电压不均。",
      "facts": [
        [
          "串联与均压",
          "材料结构与完整器件分别评价"
        ]
      ],
      "subject": "material:supercapacitor-module"
    }
  ],
  "companies": [
    {
      "id": "supercapacitor-skeleton",
      "label": "Skeleton",
      "year": "2025",
      "title": "莱比锡超级电容工厂启用",
      "copy": "Skeleton称工厂已启用，设计年产能最高1200万只电芯、投资€220m。",
      "facts": [
        [
          "最高1200万只/年",
          "2025莱比锡工厂设计产能"
        ]
      ],
      "subject": "company:supercapacitor-skeleton"
    },
    {
      "id": "supercapacitor-jianghai",
      "label": "江海股份",
      "year": "2025",
      "title": "江海股份超级电容业务增长并取得批量订单",
      "copy": "公司年报显示超级电容器收入人民币3.52亿元，并报告电网调频/SVG等应用出现批量订单。",
      "facts": [
        [
          "3.52亿元",
          "2025超级电容收入"
        ]
      ],
      "subject": "company:supercapacitor-jianghai"
    },
    {
      "id": "supercapacitor-inl-idaho-falls",
      "label": "INL / Idaho Falls Power",
      "year": "2021",
      "title": "小水电+超级电容黑启动与孤岛试验",
      "copy": "INL与Idaho Falls Power把超容接入小水电系统，现场试验显示超容承担快速、大功率短时响应，让水电机组逐步跟上负荷。",
      "facts": [
        [
          "一周现场试验",
          "2021-04小水电+超容黑启动"
        ]
      ],
      "subject": "company:supercapacitor-inl-idaho-falls"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "超级电容 · 历史",
      "content": "### 1957｜多孔碳低压电容专利\n\nBecker 的低压电解电容专利采用多孔碳电极与电解液，成为电化学电容的重要早期器件证据。\n\n1954-04-14 申请、1957-07-23 授权 US2800616A；专利针对低于 2.5 V 的应用。它是历史专利，不以当年的机理猜测替代今天的双电层理论。\n\n多孔电极内部表面被用于提高电容；后续工程需要解决有效表面、离子通达性及电解液稳定窗口，而不只是增大外形体积。\n\n来源：[原始资料](https://patents.google.com/patent/US2800616A/en)\n\n### 1966｜界面离子吸附成为器件设计核心\n\nRightmire 专利将电子导体与离子导体界面的电场和离子吸附用于能量存储。\n\nUS3288641，1962 年申请、1966-11-29 授权。专利还讨论可逆电化学反应的贡献，不能把所有后续超级电容统一描述为完全无反应的物理器件。\n\n材料界面与电解质共同决定储电，形成与传统介质电容不同的设计路径。低内阻、可用电压与长期密封仍需器件验证。\n\n来源：[原始资料](https://ptacts.uspto.gov/ptacts/public-informations/petitions/1526770/download-documents?artifactId=hjse67xhWrwtPYetcB2s7QeUmga2JypCO-KvtVBXGL8e2zpXbwXl0eI)\n\n### 2006｜亚纳米孔重新定义可用表面积\n\nChmiola 等发现小于 1 nm 的碳孔仍可贡献显著电容，推动电极设计从单纯追求面积转向孔—离子匹配。\n\n碳化物衍生碳平均孔径范围 0.6–2.25 nm；在有机电解液中测试双电层电容。论文没有证明所有越小孔径都更好。\n\n溶剂化、孔内离子排列和脱溶剂化使孔可达性不能仅由溶剂化离子直径判断。高倍率下还要考虑传输距离和孔网络。\n\n来源：[原始资料](https://doi.org/10.1126/science.1132195) ；作者摘要：[原始资料](https://pubmed.ncbi.nlm.nih.gov/16917025/)\n\n### 2010｜垂直石墨烯支持交流纹波滤波\n\nMiller 等让石墨烯纳米片直接生长在金属集流体上，减少电子与离子路径阻力。\n\n原始论文展示 120 Hz 滤波，RC 时间常数小于 200 μs。RC 常数不是把任意大容量模组充满所需时间。\n\n功率与频率响应可以通过电极结构优化；高表面积若来自深而曲折的孔，未必适合高频滤波。该研究是小器件功能验证，不是电网级储能系统。\n\n来源：[原始资料](https://doi.org/10.1126/science.1194372) ；作者摘要：[原始资料](https://pubmed.ncbi.nlm.nih.gov/20929845/)\n\n### 2013｜MXene 拓展插层电容材料\n\nLukatskaya 等证明多种阳离子可进入 Ti₃C₂ 层间，二维导电材料成为高体积电容方向。\n\n水系盐溶液中的单价、多价离子插层；原始摘要报告超过 300 F/cm³。作者稿进一步指出无黏结剂 MXene 纸在碱性体系表现突出。该单位是电极体积电容，不能直接写作整机能量密度。\n\n研究扩展了纯表面吸附以外的快速储电过程；但体积优势还需与电压、厚电极传输、氧化稳定性和完整两电极器件一起评价。\n\n来源：[原始资料](https://doi.org/10.1126/science.1241488) ；作者稿：[原始资料](https://discovery.ucl.ac.uk/10076109/7/Dallagnese_33664180_extracted.pdf)\n\n### 2015｜轨道交通型大电容单体披露\n\n中国中车社会责任报告披露面向交通应用的新一代大容量电容产品，将材料开发与频繁补能场景连接。\n\n2015 年 10 月产品规格包括 3 V/12000 F 石墨烯—活性炭复合电极与 2.8 V/30000 F 纳米混合型。两种产品体系不同，不能合并成“3 V、30000 F”单一纪录。\n\n站间快速补能与制动回收利用了高功率特征。单体电压、电容并不能直接决定整车续航，还需要串并联数量、最低使用电压、载荷和线路条件。\n\n来源：[原始资料](https://www.crrcgc.cc/Portals/71/Uploads/Files/2016/6-30/636028986785430729.pdf)\n\n### 2023｜水泥—碳网络成为结构储电原型\n\nPNAS 研究将水泥、水和炭黑构成的导电网络用于电化学电容，探索承载材料与储电的结合。\n\n实验电池由两片电解液饱和的碳—水泥电极、玻璃纤维隔膜和石墨集流体组成，采用 1 M KCl。建筑地基级容量是放大设想，不是已建住宅电站。\n\n低单位体积容量可通过结构体积补偿，但导电碳含量、电化学性能和力学强度存在取舍；防干燥、封装、接线和长期漏电仍是工程课题。\n\n来源：[原始资料](https://www.pnas.org/doi/10.1073/pnas.2304318120)\n\n### 2025｜结构储电推进到 12 V 模组\n\n后续碳—水泥研究展示串联模组和承载拱形原型，开始检验材料到器件的集成。\n\n12 个约 1 V 单元串联、2 M KCl，模组约 0.003 m³；论文报告 12 V、拟合低速极限电容约 49.8 F、304 Wh/m³。304 Wh/m³ 等于 0.304 Wh/L，不是 304 Wh/L。\n\n原型可驱动小型风扇等负载，证明连线和供电功能；电容由不同扫描速率外推，不能把低速极限能量与最高倍率同时宣传为实测整机性能。\n\n来源：[原始资料](https://doi.org/10.1073/pnas.2511912122)\n\n原始来源：[原始资料](https://patents.google.com/patent/US2800616A/en)\n\n原始来源：[原始资料](https://ptacts.uspto.gov/ptacts/public-informations/petitions/1526770/download-documents?artifactId=hjse67xhWrwtPYetcB2s7QeUmga2JypCO-KvtVBXGL8e2zpXbwXl0eI)\n\n原始来源：[原始资料](https://doi.org/10.1126/science.1132195) ；作者摘要：[原始资料](https://pubmed.ncbi.nlm.nih.gov/16917025/)\n\n原始来源：[原始资料](https://doi.org/10.1126/science.1194372) ；作者摘要：[原始资料](https://pubmed.ncbi.nlm.nih.gov/20929845/)\n\n原始来源：[原始资料](https://doi.org/10.1126/science.1241488) ；作者稿：[原始资料](https://discovery.ucl.ac.uk/10076109/7/Dallagnese_33664180_extracted.pdf)\n\n原始来源：[原始资料](https://www.crrcgc.cc/Portals/71/Uploads/Files/2016/6-30/636028986785430729.pdf)\n\n原始来源：[项目资料](https://www.energy.gov/cmei/water/articles/first-kind-tests-demonstrate-how-small-hydropower-plants-and-energy-storage-can)\n\n原始来源：[原始资料](https://www.pnas.org/doi/10.1073/pnas.2304318120)\n\n原始来源：[原始资料](https://doi.org/10.1073/pnas.2511912122) · [项目资料](https://www.skeletontech.com/news/skeleton-opens-220-million-leipzig-factory-to-stabilise-europes-electrical-grid-and-ai-infrastructure) · [项目资料](https://disc.static.szse.cn/disc/disk03/finalpage/2026-04-10/226419ee-9a1c-4425-b3b4-e7da33cfff25.PDF)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "超级电容 · 材料",
      "content": "### 多孔碳电极｜面积、孔径和传输网络\n\n活性炭、碳化物衍生碳和石墨烯通过可达界面储存电荷。纳米孔提供储电面积，较大孔与短路径支持快速离子输运；电极增厚会提高单位面积载量，也可能降低高倍率利用率。\n\n2006 年亚纳米孔研究与 2010 年垂直片层滤波分别说明容量和频率响应的不同优化方向。不能把一种粉末的高 F/g 与另一种薄膜的低 RC 合并成新器件指标。\n\n来源：[原始资料](https://doi.org/10.1126/science.1132195) ；[原始资料](https://doi.org/10.1126/science.1194372)\n\n### 赝电容与插层电极｜快速反应的电位响应\n\n某些氧化物、导电聚合物及二维材料可以通过快速可逆电荷转移获得电容式响应。是否属于赝电容，取决于反应和电位响应，不能因为材料含金属或循环曲线面积大就下结论。\n\nMXene 层间离子与表面端基共同影响响应；高体积电容需要说明电极密度、厚度、扫描速率和电解液。电池型混合器件若具有明显平台，宜采用电量和完整电压积分评价能量。\n\n来源：[原始资料](https://doi.org/10.1126/science.1241488) ；[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Supercapacitors.pdf)\n\n### 电解液与隔膜｜电压窗口和离子电阻\n\n水系、有机和离子液体在离子电导、可用电压、低温黏度与材料兼容性之间取舍。隔膜须阻止电子短路同时允许离子通过，其厚度与浸润关系到内阻。\n\n储能 E=½CV²，电压提高可显著增加理想能量，但超过稳定窗口会加速分解和气体生成。2025 年水泥体系的有机电解液单元与水系串联模组是不同实验，不能混用最高能量和模组尺寸。\n\n来源：[原始资料](https://doi.org/10.1073/pnas.2511912122)\n\n### 集流体、封装与均压｜把电极变成模组\n\n金属或石墨集流体、端子接触、密封、均压电路与功率转换器决定整机性能。串联提高电压但降低等效电容，各单体漏电差异还会造成电压不均。\n\nEusable=½C(Vmax²−Vmin²)。这个表达式说明额定电压下理论能量不等于负载可用能量。功率还受等效串联电阻 ESR、温升和转换器电流限制；F 是电容，Wh 是能量，二者不能互换。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Supercapacitors.pdf)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "超级电容 · 论文",
      "content": "| 原始论文 | 指标 | 条件与分母 | 结果意义 |\n|---|---|---|---|\n| Chmiola 2006 | 孔径 0.6–2.25 nm；亚纳米孔贡献电容 | 碳化物衍生碳、有机电解液；材料结构研究 | 可用孔不由溶剂化离子尺寸简单决定 |\n| Miller 2010 | 120 Hz 滤波，RC <200 μs | 金属集流体上垂直石墨烯；小型器件 | 改善频率响应，非大模组充满时间 |\n| Lukatskaya 2013 | >300 F/cm³ | Ti₃C₂、水系离子插层；电极体积 | 高体积电容，不能当作系统 Wh/L |\n| 碳—水泥 2023 | 1 M KCl 两电极原型 | 玻纤隔膜、石墨集流体；实验室尺度 | 结构材料储电概念验证 |\n| 碳—水泥 2025 | 12 V、49.8 F、304 Wh/m³ | 2 M KCl、12 单元串联；电容为速率外推值 | 材料—模组放大；约 0.003 m³ 原型 |\n\n来源：上述年份节点的 DOI 与作者原稿。论文 F/g 或 F/cm³ 的分母保留为电极，不替换为设备质量或体积。\n\n原始来源：[1957 多孔碳低压电容专利](https://patents.google.com/patent/US2800616A/en)\n\n原始来源：[1966 界面离子吸附成为器件设计核心](https://ptacts.uspto.gov/ptacts/public-informations/petitions/1526770/download-documents?artifactId=hjse67xhWrwtPYetcB2s7QeUmga2JypCO-KvtVBXGL8e2zpXbwXl0eI)\n\n原始来源：[2006 亚纳米孔重新定义可用表面积](https://doi.org/10.1126/science.1132195)\n\n原始来源：[2010 垂直石墨烯支持交流纹波滤波](https://doi.org/10.1126/science.1194372)\n\n原始来源：[2013 MXene 拓展插层电容材料](https://doi.org/10.1126/science.1241488)\n\n原始来源：[2015 轨道交通型大电容单体披露](https://www.crrcgc.cc/Portals/71/Uploads/Files/2016/6-30/636028986785430729.pdf)\n\n原始来源：[2023 水泥—碳网络成为结构储电原型](https://www.pnas.org/doi/10.1073/pnas.2304318120)\n\n原始来源：[2025 结构储电推进到 12 V 模组](https://doi.org/10.1073/pnas.2511912122)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "超级电容 · 企业",
      "content": "### 单体、模组与应用集成\n\n单体厂商主要交付容量、ESR、额定电压与寿命条件；模组集成包括串并联、均压与冷却；轨道和电网设备企业还需完成变流器控制与系统保护。中国中车 2015 年官方报告提供交通产品锚点，\n\n纯双电层、锂离子电容及其他混合产品不可共用同一寿命和安全口径。厂商的循环次数还需对应电压窗口、温度和寿命终止标准。\n\n来源：[原始资料](https://www.crrcgc.cc/Portals/71/Uploads/Files/2016/6-30/636028986785430729.pdf)\n\n### Skeleton\n\nSkeleton Technologies为私营高功率超级电容企业，覆盖材料、电芯、模组与系统。产品页列出D60单体规格；公司将其作为秒级功率支撑设备，不能将电芯参数解释为电站性能。\n\n产品页D60单体比能量为厂商标称8.27–11.1 Wh/kg，不能代替含功率变换、热管理、支撑结构的系统比能量。 公司新闻稿称工厂向部分电网与数据中心客户交付产品；该信息为公司披露。\n\n原始来源：[企业/项目资料](https://www.skeletontech.com/news/skeleton-opens-220-million-leipzig-factory-to-stabilise-europes-electrical-grid-and-ai-infrastructure)\n\n### 江海股份\n\n南通江海电容器股份有限公司生产铝电解、薄膜和超级电容器，官网列出EDLC与锂离子电容器单体及模组，应用包括电网后备、风电和轨道交通。\n\n超级电容收入同比增长17.32%。 公司获奖项目为“兆瓦级超级电容复合储能系统关键技术及工程应用”，属于复合储能技术项目，不应描述为已部署同容量的纯超容电站。\n\n原始来源：[企业/项目资料](https://disc.static.szse.cn/disc/disk03/finalpage/2026-04-10/226419ee-9a1c-4425-b3b4-e7da33cfff25.PDF)\n\n### INL / Idaho Falls Power\n\nDOE资助的INL、Idaho Falls Power与NREL联合现场试验，将超容接入小水电系统验证孤岛运行和黑启动支持；这是社区微电网韧性研究，不是独立大型储能站。\n\n现场测试持续一周，研究黑启动与孤岛运行。 两台6 MW设备是模拟关键负荷的负载箱规格，不是超容装置额定功率。 DOE未在该篇披露设备的kW/kWh或放电时长。\n\n原始来源：[企业/项目资料](https://www.energy.gov/cmei/water/articles/first-kind-tests-demonstrate-how-small-hydropower-plants-and-energy-storage-can)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "超级电容 · 政策市场",
      "content": "### 功率服务是成熟应用的重要部分\n\nDOE 2023 年超级电容技术评估纳入 SI2030 研究框架。被纳入长时储能降本研究，不代表常规超级电容已经普遍用于十小时储电；降低自放电、材料成本和提高器件能量密度仍是研究问题。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Supercapacitors.pdf)\n\n### 独立呈现器件与项目口径\n\n| 对象 | 推荐指标 | 容易混淆的指标 |\n|---|---|---|\n| 电极材料 | F/g、F/cm³、倍率、载量 | 单电极数值不能代表两电极封装 |\n| 单体/模组 | V、F、ESR、Wh、峰值电流 | 理论储能不等于可用放电能量 |\n| 交通/工业项目 | 功率脉冲、回收电量、工作循环 | 整车或线路规模不是储能容量 |\n| 电网服务 | kW/MW、响应时间、持续时长 | 不用年度全国电池装机代表本路线 |\n\n### 2021联合科技创新规划\n\n国家能源局与科技部《十四五能源领域科技创新规划》第21页列出超导与电介质电容技术攻关，以及10MW级超级电容示范方向。规划研发目标与实际示范运行分开记录。\n\n原始来源：[联合科技创新规划](https://zfxxgk.nea.gov.cn/2021-11/29/c_1310540453.htm)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "超级电容 · 储能适配",
      "content": "### 频繁功率脉冲与混合储能\n\n超级电容适合制动回收、升降机械、短时备用切换、频繁功率波动与滤波。与电池配合时，可由电容承担快速功率变化、电池提供较长持续能量；是否延长电池寿命取决于具体工况和控制，不能预设固定百分比收益。\n\n| 场景 | 价值 | 设计重点 | 限制 |\n|---|---|---|---|\n| 再生制动 | 吸收短而强的功率 | 充电余量、峰值电流、温升 | 存量过满时无法继续吸收 |\n| 关键负载过渡 | 快速支撑至备用源启动 | 最低电压、转换器容量 | 能量持续时间有限 |\n| 高频纹波 | 低阻抗和短时间常数 | 电极路径、寄生参数 | 大孔隙容量不等于高频容量 |\n| 长时独立储电 | 可研究结构集成与混合路线 | 自放电、体积和全寿命成本 | 常规器件能量密度偏低，需实证经济性 |\n\n### 评价循环寿命也要看能量与温度\n\n相同循环次数下，微小电压摆动和深度放电的能量吞吐不同。快速往返损耗由内阻、转换器与均压支路构成，长期保存则还要计算漏电和自放电；短脉冲高效率不能直接用于日间充电、夜间放电的效率声明。\n\n来源：[原始资料](https://www.energy.gov/sites/default/files/2023-07/Technology%20Strategy%20Assessment%20-%20Supercapacitors.pdf)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "supercapacitor-policy",
    "label": "功率型储能与研发",
    "year": "2021",
    "title": "超级电容与超导储能纳入科技创新规划",
    "copy": "联合规划列出功率型储能攻关和示范。器件研发、工程建设与专用项目运行分别记录。",
    "facts": [
      [
        "10 MW级",
        "超级电容示范研发方向"
      ],
      [
        "超导技术",
        "科技创新规划攻关方向"
      ]
    ],
    "subject": "scene:supercapacitor-policy"
  },
  "market": {
    "id": "supercapacitor-market",
    "label": "器件与具体工程",
    "year": "应用",
    "title": "工业脉冲、交通回收与微电网",
    "copy": "江海年报披露产品收入，INL现场验证小水电黑启动。产品业务和项目服务分别记录。",
    "facts": [
      [
        "一周现场试验",
        "2021-04小水电+超容黑启动"
      ]
    ],
    "subject": "route:supercapacitor:history"
  },
  "historySubject": "route:supercapacitor:history",
  "note": "原始研究与专用工程",
  "showMarketChart": false,
  "papers": {
    "id": "supercapacitor-papers",
    "label": "原始研究",
    "year": "实验",
    "title": "孔径、频率响应与结构储电",
    "copy": "碳—水泥原型连接12单元并供电。304Wh/m³换算为0.304Wh/L，电容值来自速率外推。",
    "facts": [
      [
        "12 V / 49.8 F",
        "12单元，2 M KCl，电容为速率外推"
      ],
      [
        "304 Wh/m³ = 0.304 Wh/L",
        "约0.003 m³模组"
      ]
    ],
    "subject": "route:supercapacitor:history"
  },
  "storage": {
    "id": "supercapacitor-storage",
    "label": "功率服务",
    "year": "应用",
    "title": "快速功率脉冲与备用切换",
    "copy": "可用能量由最高与最低工作电压决定。内阻、温升与自放电分别影响循环和保存。",
    "facts": [
      [
        "Eusable=½C(Vmax²−Vmin²)",
        "负载实际工作电压范围"
      ],
      [
        "ESR / 温升 / 自放电",
        "脉冲与保存的不同约束"
      ]
    ],
    "subject": "route:supercapacitor:history"
  }
};

export const smesResearch: ChronicleResearch = {
  "name": "超导磁储能",
  "timeline": [
    {
      "id": "smes-1970",
      "yearNumber": 1970,
      "year": "1970",
      "label": "超导绕组储能概念形成文献节点",
      "title": "超导绕组储能概念形成文献节点",
      "copy": "Ferrier 在《Low Temperatures and Electric Power》中讨论超导绕组储能，成为早期概念文献。",
      "facts": [
        [
          "1970",
          "超导绕组储能概念书目"
        ]
      ],
      "detail": "Ferrier 在《Low Temperatures and Electric Power》中讨论超导绕组储能，成为早期概念文献。\n\n1970 年、425–432 页的出版信息由 Los Alamos 原始技术报告参考文献确认。来源为机构报告参考书目。\n\n使低电阻持续电流与电力系统储能联系起来。概念落地仍需承受电磁力、维持低温并控制充放电，不只是制造一根超导线材。",
      "source": "https://www.osti.gov/servlets/purl/4288420",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-1981",
      "yearNumber": 1981,
      "year": "1981",
      "label": "30 MJ 电网磁体制造进入集成",
      "title": "30 MJ 电网磁体制造进入集成",
      "copy": "Los Alamos 年度报告记录为 BPA 输电系统稳定服务的 30 MJ 线圈制造完成。",
      "facts": [
        [
          "30 MJ",
          "磁体制造与集成阶段"
        ]
      ],
      "detail": "Los Alamos 年度报告记录为 BPA 输电系统稳定服务的 30 MJ 线圈制造完成。\n\n1981 年报告涉及线圈、杜瓦、制冷机、变流器和控制集成；当年是制造与准备阶段，不能提前写成投运。\n\n电网 SMES 的工作范围扩展到低温、机械和电力电子系统。线圈能量、变流器功率以及保护能力分别决定系统边界。",
      "source": "https://www.osti.gov/servlets/purl/5370179",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-1983",
      "yearNumber": 1983,
      "year": "1983",
      "label": "Tacoma 系统完成早期电网测试",
      "title": "Tacoma 系统完成早期电网测试",
      "copy": "BPA Tacoma 变电站 SMES 用于抑制太平洋交流联络线的低频功率摆动。",
      "facts": [
        [
          "30 MJ ≈8.33 kWh",
          "Tacoma实网稳定试验"
        ],
        [
          "10 MW / 约0.35 Hz",
          "变流器与摆动频率"
        ]
      ],
      "detail": "BPA Tacoma 变电站 SMES 用于抑制太平洋交流联络线的低频功率摆动。\n\n1982 年末安装，1983 年上半年广泛测试；线圈储能 30 MJ，变流器 10 MW，针对约 0.35 Hz 摆动。30 MJ≈8.33 kWh；原报告四舍五入为 8.4 kWh。\n\n展示了大功率、低能量的动态调节用途。30 MJ/10 MW 的理论满能量比仅约 3 s，不能写成 10 MW 级长时调峰电站。",
      "source": "https://digital.library.unt.edu/ark:/67531/metadc1102206/",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2003",
      "yearNumber": 2003,
      "year": "2003",
      "label": "工厂瞬时电压跌落补偿进入现场验证",
      "title": "工厂瞬时电压跌落补偿进入现场验证",
      "copy": "中部电力开始在大型电器制造工厂验证 SMES，用于关键生产设备的瞬时供电保护。",
      "facts": [
        [
          "2003-07",
          "工厂瞬时跌落现场验证"
        ]
      ],
      "detail": "中部电力开始在大型电器制造工厂验证 SMES，用于关键生产设备的瞬时供电保护。\n\n企业 2007 年年报回顾试验从 2003 年 7 月开始。此处只采用可核日期和应用，不将年报图中文字“kW/second”擅自转为储能容量。\n\n价值从电网振荡控制延伸到减少工厂停机；经济性依赖受保护负载价值和跌落时长，不能只按储电 kWh 单价判断。",
      "source": "https://www.chuden.co.jp/english/resource/corporate/ecsr_annual_report_2007.pdf",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2007",
      "yearNumber": 2007,
      "year": "2007",
      "label": "10 MVA 系统进入 LCD 工厂",
      "title": "10 MVA 系统进入 LCD 工厂",
      "copy": "东芝与中部电力开发的 SMES 在大型 LCD 工厂实施瞬时电压跌落保护。",
      "facts": [
        [
          "10 MVA",
          "LCD工厂专用补偿，视在功率"
        ]
      ],
      "detail": "东芝与中部电力开发的 SMES 在大型 LCD 工厂实施瞬时电压跌落保护。\n\n东芝 2009 年技术报告称 10 MVA 系统于 2007 年 7 月安装，此后已应对超过 10 次瞬时电压跌落。MVA 是视在功率，不是 MWh。\n\n这是具体工业应用证据，不能因新论文概括“尚未商业化”就抹去已有专用部署；但专用保护系统也不代表广泛的电网长时储能市场。\n\n\n细尾电站10 MW/20 MJ级SMES实系试验。九州电力公司史记载该联合项目在水电与波动负荷并存的实电网进行SMES联调，目标为电网稳定控制与光伏出力管理。20 MJ仅约5.56 kWh，需将MW级功率与kWh级能量分开阅读。\n\n2007年度起开展约半年实证，2011年4月以前试验确认预定控制功能动作。 项目与中部电力、ISTEC合作，获得古河电工支持，安装地点是古河日光发电细尾电站。",
      "source": "https://www.global.toshiba/content/dam/toshiba/migration/corp/techReviewAssets/tech/review/2009/high2009/high2009pdf/0906.pdf",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2013",
      "yearNumber": 2013,
      "year": "2013",
      "label": "高温超导高场线圈探索更紧凑储能",
      "title": "高温超导高场线圈探索更紧凑储能",
      "copy": "DOE 报告将高温超导带材及增强结构用于高场 SMES 研究，关注高磁场下的应力承载。",
      "facts": [
        [
          "约24 T",
          "高场SMES研究方案"
        ]
      ],
      "detail": "DOE 报告将高温超导带材及增强结构用于高场 SMES 研究，关注高磁场下的应力承载。\n\n机构介绍约 24 T 的 SMES 方案采用 HTS 带材与不锈钢带共绕技术；这是研究方案及相关磁体技术进展，不是 24 T 商业电站投运公告。\n\n磁场提高可增加磁能密度，同时显著提高电磁应力。导体、结构和失超保护必须共同设计，不能只追求磁场纪录。",
      "source": "https://science.osti.gov/hep/Highlights/2013/NP-2013-08-a",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2024",
      "yearNumber": 2024,
      "year": "2024",
      "label": "设计优化同时纳入应变与冷却成本",
      "title": "设计优化同时纳入应变与冷却成本",
      "copy": "Sadeghi 等针对 MJ 级装置开展电磁、机械和冷却多目标优化，将可制造性纳入设计。",
      "facts": [
        [
          "MJ级",
          "解析/有限元计算设计"
        ]
      ],
      "detail": "Sadeghi 等针对 MJ 级装置开展电磁、机械和冷却多目标优化，将可制造性纳入设计。\n\nJournal of Energy Storage 原始论文 DOI 10.1016/j.est.2024.112917；通过解析模型与有限元对照验证，属于计算设计，不是新电站实测。\n\n提高运行电流占临界电流比例会改变冷却负荷、重量与应变，单独优化一种参数可能使另一个约束恶化。该论文宽泛的商业化表述不覆盖已证实的日本专用系统。",
      "source": "https://eprints.gla.ac.uk/330106/1/330106.pdf",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2025",
      "yearNumber": 2025,
      "year": "2025",
      "label": "储能与限流功能进入同一实验原型",
      "title": "储能与限流功能进入同一实验原型",
      "copy": "多功能超导装置研究让同一线圈在正常运行时平滑功率、故障时参与限流。",
      "facts": [
        [
          "实验原型",
          "饼式线圈充放电与限流"
        ]
      ],
      "detail": "多功能超导装置研究让同一线圈在正常运行时平滑功率、故障时参与限流。\n\n论文发表于 Journal of Energy Storage 106，114723；既有 PSCAD/EMTDC 仿真，也制造饼式超导线圈原型并开展充放电及限流两类实验。摘要没有提供完整商业额定参数，不补 MW/GWh。\n\n研究面向微电网多功能设备，减少独立功能模块的重复；故障转换、保护配合及实网可靠性还需进一步验证。",
      "source": "https://www.sciencedirect.com/science/article/abs/pii/S2352152X24043093",
      "subject": "route:smes:history"
    },
    {
      "id": "smes-2026",
      "yearNumber": 2026,
      "year": "2026",
      "label": "10 MJ 混合超导模块开展低温测试",
      "title": "10 MJ 混合超导模块开展低温测试",
      "copy": "MgB₂ 与 YBCO 混合磁体原始论文给出模块设计、导体测试和低温运行结果。",
      "facts": [
        [
          "10 MJ ≈2.78 kWh",
          "混合超导模块低温测试"
        ],
        [
          ">3 kA @20 K / 3 T",
          "MgB₂电缆临界电流，非整机额定"
        ]
      ],
      "detail": "MgB₂ 与 YBCO 混合磁体原始论文给出模块设计、导体测试和低温运行结果。\n\n2026-03-30 论文，10 MJ≈2.78 kWh；MgB₂ 电缆临界电流在 20 K、3 T 下超过 3 kA。验证线圈升至 1400 A 时，YBCO 温升 <0.8 K、MgB₂ <0.1 K；这些是不同导体/线圈测试条件。\n\n导体电流能力和绕组低温稳定性支持进一步工程集成。论文称达到 10 MJ 目标，但不能改写为电网商业投运或完整交流侧效率认证；液氢冷却工程应用仍是后续方向。\n\n\n中山高温超导磁储能示范工程投入运行。地方政府2026年计划执行报告确认示范工程已投入运行。其2025年开工公告所列5 MVA/10 MJ为设计规模；MJ换算为kWh后表明该系统的设计强项是瞬时功率支撑，不是长时能量搬移。\n\n2025年开工公告：投资人民币2.08亿元，最大输出功率不低于5 MW，储能量不低于10 MJ。 2026年政府报告确认投入运行，但未给出当年的实测可用能量、响应曲线、冷却辅助能耗或年循环统计。",
      "source": "https://www.sciencedirect.com/science/article/pii/S2352152X26003348",
      "subject": "route:smes:history"
    }
  ],
  "materials": [
    {
      "id": "smes-conductor",
      "label": "超导导体",
      "year": "磁场",
      "title": "低温合金与高温带材",
      "copy": "导体可用电流受温度、磁场强度、磁场方向和应变共同限制。REBCO/YBCO 带材的高临界温度并不意味着高场装置一定能在液氮温度运行；MgB₂ 的线材设计和冷却温度也需结合实际磁场。",
      "facts": [
        [
          "温度 / 磁场 / 应变",
          "低温、结构与控制共同约束"
        ]
      ],
      "subject": "material:smes-conductor"
    },
    {
      "id": "smes-magnet",
      "label": "绕组与支撑",
      "year": "磁场",
      "title": "电磁力决定结构成本",
      "copy": "磁能 E=½LI²；螺线管、环形和其他绕组拓扑改变电感、漏磁及受力。更高磁场意味着更强的洛伦兹力，支撑材料和绕组应变限制会侵蚀仅按超导材料计算的能量密度优势。",
      "facts": [
        [
          "E=½LI²",
          "低温、结构与控制共同约束"
        ]
      ],
      "subject": "material:smes-magnet"
    },
    {
      "id": "smes-cryogenic",
      "label": "低温系统",
      "year": "磁场",
      "title": "杜瓦、热屏与电流引线",
      "copy": "真空绝热、低温容器、电流引线和制冷机负责维持工作温度。进入低温端的每一瓦热负荷都需要额外制冷电力；低温制冷量 W 与制冷机输入 W 不能混用。",
      "facts": [
        [
          "热漏与制冷",
          "低温、结构与控制共同约束"
        ]
      ],
      "subject": "material:smes-cryogenic"
    },
    {
      "id": "smes-converter",
      "label": "变流器与失超保护",
      "year": "磁场",
      "title": "让储能可控释放",
      "copy": "双向功率变换将电网电压与线圈大电流连接，有功和无功控制受到变流器额定容量约束。电流下降时剩余储能按 I² 下降，实际可用范围还取决于控制最低电流。",
      "facts": [
        [
          "功率变换与失超",
          "低温、结构与控制共同约束"
        ]
      ],
      "subject": "material:smes-converter"
    }
  ],
  "companies": [
    {
      "id": "smes-zhongshan-project",
      "label": "中山磁储能示范",
      "year": "2026",
      "title": "中山高温超导磁储能示范工程投入运行",
      "copy": "地方政府2026年计划执行报告确认示范工程已投入运行。",
      "facts": [
        [
          "5 MVA / 10 MJ",
          "2025设计规模，2026政府确认运行"
        ]
      ],
      "subject": "company:smes-zhongshan-project"
    },
    {
      "id": "smes-kyuden",
      "label": "九州电力",
      "year": "2007",
      "title": "细尾电站10 MW/20 MJ级SMES实系试验",
      "copy": "九州电力公司史记载该联合项目在水电与波动负荷并存的实电网进行SMES联调，目标为电网稳定控制与光伏出力管理。",
      "facts": [
        [
          "10 MW / 20 MJ",
          "2007年度起细尾电站实证"
        ]
      ],
      "subject": "company:smes-kyuden"
    }
  ],
  "chapters": [
    {
      "id": "history",
      "label": "历史",
      "title": "超导磁储能 · 历史",
      "content": "### 1970｜超导绕组储能概念形成文献节点\n\nFerrier 在《Low Temperatures and Electric Power》中讨论超导绕组储能，成为早期概念文献。\n\n1970 年、425–432 页的出版信息由 Los Alamos 原始技术报告参考文献确认。本次未读到该章节全文，因此不补原方案规模，也不把出版年断言为所有磁储能的唯一发明年。\n\n使低电阻持续电流与电力系统储能联系起来。概念落地仍需承受电磁力、维持低温并控制充放电，不只是制造一根超导线材。\n\n来源：[原始资料](https://www.osti.gov/servlets/purl/4288420)\n\n### 1981｜30 MJ 电网磁体制造进入集成\n\nLos Alamos 年度报告记录为 BPA 输电系统稳定服务的 30 MJ 线圈制造完成。\n\n1981 年报告涉及线圈、杜瓦、制冷机、变流器和控制集成；当年是制造与准备阶段，不能提前写成投运。\n\n电网 SMES 的工作范围扩展到低温、机械和电力电子系统。线圈能量、变流器功率以及保护能力分别决定系统边界。\n\n来源：[原始资料](https://www.osti.gov/servlets/purl/5370179)\n\n### 1983｜Tacoma 系统完成早期电网测试\n\nBPA Tacoma 变电站 SMES 用于抑制太平洋交流联络线的低频功率摆动。\n\n1982 年末安装，1983 年上半年广泛测试；线圈储能 30 MJ，变流器 10 MW，针对约 0.35 Hz 摆动。30 MJ≈8.33 kWh；原报告四舍五入为 8.4 kWh。\n\n展示了大功率、低能量的动态调节用途。30 MJ/10 MW 的理论满能量比仅约 3 s，不能写成 10 MW 级长时调峰电站。\n\n来源：[原始资料](https://digital.library.unt.edu/ark:/67531/metadc1102206/) ；1984 运行报告：[原始资料](https://www.osti.gov/servlets/purl/5533723)\n\n### 2003｜工厂瞬时电压跌落补偿进入现场验证\n\n中部电力开始在大型电器制造工厂验证 SMES，用于关键生产设备的瞬时供电保护。\n\n企业 2007 年年报回顾试验从 2003 年 7 月开始。此处只采用可核日期和应用，不将年报图中文字“kW/second”擅自转为储能容量。\n\n价值从电网振荡控制延伸到减少工厂停机；经济性依赖受保护负载价值和跌落时长，不能只按储电 kWh 单价判断。\n\n来源：[原始资料](https://www.chuden.co.jp/english/resource/corporate/ecsr_annual_report_2007.pdf)\n\n### 2007｜10 MVA 系统进入 LCD 工厂\n\n东芝与中部电力开发的 SMES 在大型 LCD 工厂实施瞬时电压跌落保护。\n\n东芝 2009 年技术报告称 10 MVA 系统于 2007 年 7 月安装，此后已应对超过 10 次瞬时电压跌落。MVA 是视在功率，不是 MWh。\n\n这是具体工业应用证据，不能因新论文概括“尚未商业化”就抹去已有专用部署；但专用保护系统也不代表广泛的电网长时储能市场。\n\n来源：[原始资料](https://www.global.toshiba/content/dam/toshiba/migration/corp/techReviewAssets/tech/review/2009/high2009/high2009pdf/0906.pdf)\n\n### 2013｜高温超导高场线圈探索更紧凑储能\n\nDOE 报告将高温超导带材及增强结构用于高场 SMES 研究，关注高磁场下的应力承载。\n\n机构介绍约 24 T 的 SMES 方案采用 HTS 带材与不锈钢带共绕技术；这是研究方案及相关磁体技术进展，不是 24 T 商业电站投运公告。\n\n磁场提高可增加磁能密度，同时显著提高电磁应力。导体、结构和失超保护必须共同设计，不能只追求磁场纪录。\n\n来源：[原始资料](https://science.osti.gov/hep/Highlights/2013/NP-2013-08-a)\n\n### 2024｜设计优化同时纳入应变与冷却成本\n\nSadeghi 等针对 MJ 级装置开展电磁、机械和冷却多目标优化，将可制造性纳入设计。\n\nJournal of Energy Storage 原始论文 DOI 10.1016/j.est.2024.112917；通过解析模型与有限元对照验证，属于计算设计，不是新电站实测。\n\n提高运行电流占临界电流比例会改变冷却负荷、重量与应变，单独优化一种参数可能使另一个约束恶化。该论文宽泛的商业化表述不覆盖已证实的日本专用系统。\n\n来源：[原始资料](https://eprints.gla.ac.uk/330106/1/330106.pdf)\n\n### 2025｜储能与限流功能进入同一实验原型\n\n多功能超导装置研究让同一线圈在正常运行时平滑功率、故障时参与限流。\n\n论文发表于 Journal of Energy Storage 106，114723；既有 PSCAD/EMTDC 仿真，也制造饼式超导线圈原型并开展充放电及限流两类实验。摘要没有提供完整商业额定参数，不补 MW/GWh。\n\n研究面向微电网多功能设备，减少独立功能模块的重复；故障转换、保护配合及实网可靠性还需进一步验证。\n\n来源：[原始资料](https://www.sciencedirect.com/science/article/abs/pii/S2352152X24043093)\n\n### 2026｜10 MJ 混合超导模块开展低温测试\n\nMgB₂ 与 YBCO 混合磁体原始论文给出模块设计、导体测试和低温运行结果。\n\n2026-03-30 论文，10 MJ≈2.78 kWh；MgB₂ 电缆临界电流在 20 K、3 T 下超过 3 kA。验证线圈升至 1400 A 时，YBCO 温升 <0.8 K、MgB₂ <0.1 K；这些是不同导体/线圈测试条件。\n\n导体电流能力和绕组低温稳定性支持进一步工程集成。论文称达到 10 MJ 目标，但不能改写为电网商业投运或完整交流侧效率认证；液氢冷却工程应用仍是后续方向。\n\n来源：[原始资料](https://www.sciencedirect.com/science/article/pii/S2352152X26003348) ；DOI：[原始资料](https://doi.org/10.1016/j.est.2026.120670)\n\n原始来源：[原始资料](https://www.osti.gov/servlets/purl/4288420)\n\n原始来源：[原始资料](https://www.osti.gov/servlets/purl/5370179)\n\n原始来源：[原始资料](https://digital.library.unt.edu/ark:/67531/metadc1102206/) ；1984 运行报告：[原始资料](https://www.osti.gov/servlets/purl/5533723)\n\n原始来源：[原始资料](https://www.chuden.co.jp/english/resource/corporate/ecsr_annual_report_2007.pdf)\n\n原始来源：[原始资料](https://www.global.toshiba/content/dam/toshiba/migration/corp/techReviewAssets/tech/review/2009/high2009/high2009pdf/0906.pdf) · [项目资料](https://www.kyuden.co.jp/company/history/energy/technology/technology-1.html)\n\n原始来源：[原始资料](https://science.osti.gov/hep/Highlights/2013/NP-2013-08-a)\n\n原始来源：[原始资料](https://eprints.gla.ac.uk/330106/1/330106.pdf)\n\n原始来源：[原始资料](https://www.sciencedirect.com/science/article/abs/pii/S2352152X24043093)\n\n原始来源：[原始资料](https://www.sciencedirect.com/science/article/pii/S2352152X26003348) ；DOI：[原始资料](https://doi.org/10.1016/j.est.2026.120670) · [项目资料](https://www.zs.gov.cn/zwgk/ghzj/fzghjh/gmjjshfzghgy/content/post_2597701.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "materials",
      "label": "材料",
      "title": "超导磁储能 · 材料",
      "content": "### 超导导体｜低温合金与高温带材\n\n导体可用电流受温度、磁场强度、磁场方向和应变共同限制。REBCO/YBCO 带材的高临界温度并不意味着高场装置一定能在液氮温度运行；MgB₂ 的线材设计和冷却温度也需结合实际磁场。\n\n2026 年原始测试提供 20 K/3 T 下 MgB₂ 电缆临界电流，不能把此值当作整个混合磁体的额定运行电流。运行应保留临界裕量，并明确接头、弯曲和冷却条件。\n\n来源：[原始资料](https://doi.org/10.1016/j.est.2026.120670)\n\n### 绕组与支撑｜电磁力决定结构成本\n\n磁能 E=½LI²；螺线管、环形和其他绕组拓扑改变电感、漏磁及受力。更高磁场意味着更强的洛伦兹力，支撑材料和绕组应变限制会侵蚀仅按超导材料计算的能量密度优势。\n\n环形布置可控制外泄磁场，但结构和制造复杂度随之变化。优化不能只看磁场或电感，而要同时满足导体性能、空间布置与可承受应变。\n\n来源：[原始资料](https://eprints.gla.ac.uk/330106/1/330106.pdf)\n\n### 低温系统｜杜瓦、热屏与电流引线\n\n真空绝热、低温容器、电流引线和制冷机负责维持工作温度。进入低温端的每一瓦热负荷都需要额外制冷电力；低温制冷量 W 与制冷机输入 W 不能混用。\n\n稳态线圈低电阻不能消除热漏、接头、交流损耗及功率电子待机功耗。长时间保存少量能量时，制冷辅耗可能变得更重要；效率必须给出保持时间和完整系统边界。\n\n来源：[原始资料](https://www.osti.gov/servlets/purl/5370179) ；[原始资料](https://eprints.gla.ac.uk/330106/1/330106.pdf)\n\n### 变流器与失超保护｜让储能可控释放\n\n双向功率变换将电网电压与线圈大电流连接，有功和无功控制受到变流器额定容量约束。电流下降时剩余储能按 I² 下降，实际可用范围还取决于控制最低电流。\n\n局部失超会将能量转为热；检测、旁路、泄能回路及绝缘需要协同。现代研究尝试将储能和故障限流结合，但“同一线圈多功能”仍应区分仿真与实际原型验证。\n\n来源：[原始资料](https://www.osti.gov/servlets/purl/5533723) ；[原始资料](https://www.sciencedirect.com/science/article/abs/pii/S2352152X24043093)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "papers",
      "label": "论文",
      "title": "超导磁储能 · 论文",
      "content": "| 原始证据 | 可展示数字 | 条件／尺度 | 不能推出的结论 |\n|---|---|---|---|\n| Tacoma 1983 实验报告 | 30 MJ、10 MW、约 0.35 Hz | 实网稳定试验；1982 末安装、1983 测试 | 不是 10 MW 持续数小时 |\n| Los Alamos 1984 报告 | 12 脉波模式可跟随约 8.6 MW 正弦幅值；恒无功模式约 5 MW | 两种变流器运行模式 | 不把两项功率叠加或当作额外能量 |\n| Sadeghi 2024 | MJ 级多目标优化 | 解析设计与有限元对照 | 不是投运装置或实测效率 |\n| 多功能装置 2025 | 饼式线圈充放电与限流实验 | 仿真与实验原型并存 | 不是整网工程验收 |\n| Song 等 2026 | 10 MJ；20 K/3 T 下电缆临界电流 >3 kA | 导体、验证线圈和模块分别评价 | 3 kA 不能移为整机额定电流；没有商业运行时长 |\n\n来源：对应历史节点的原报告/DOI。原始数值不足的研究使用机制或实验状态展示，不填推测的最高效率。\n\n原始来源：[1970 超导绕组储能概念形成文献节点](https://www.osti.gov/servlets/purl/4288420)\n\n原始来源：[1981 30 MJ 电网磁体制造进入集成](https://www.osti.gov/servlets/purl/5370179)\n\n原始来源：[1983 Tacoma 系统完成早期电网测试](https://digital.library.unt.edu/ark:/67531/metadc1102206/)\n\n原始来源：[2003 工厂瞬时电压跌落补偿进入现场验证](https://www.chuden.co.jp/english/resource/corporate/ecsr_annual_report_2007.pdf)\n\n原始来源：[2007 10 MVA 系统进入 LCD 工厂](https://www.global.toshiba/content/dam/toshiba/migration/corp/techReviewAssets/tech/review/2009/high2009/high2009pdf/0906.pdf)\n\n原始来源：[2013 高温超导高场线圈探索更紧凑储能](https://science.osti.gov/hep/Highlights/2013/NP-2013-08-a)\n\n原始来源：[2024 设计优化同时纳入应变与冷却成本](https://eprints.gla.ac.uk/330106/1/330106.pdf)\n\n原始来源：[2025 储能与限流功能进入同一实验原型](https://www.sciencedirect.com/science/article/abs/pii/S2352152X24043093)\n\n原始来源：[2026 10 MJ 混合超导模块开展低温测试](https://www.sciencedirect.com/science/article/pii/S2352152X26003348)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "industry",
      "label": "企业",
      "title": "超导磁储能 · 企业",
      "content": "### 磁体、制冷与电网设备分别交付\n\n超导材料企业交付线材/带材，磁体企业交付绕组与低温结构，系统企业提供变流器、保护与控制。制造商拥有超导产品不自动意味着已有 SMES 成品；磁共振或聚变磁体经验可以相关，但其装机不能计入储能。\n\n东芝与中部电力 2007 年 LCD 工厂系统是明确的 SMES 工程锚点。新一代混合超导模块的合作企业应按论文署名与实际分工描述，避免将线材供应量折算成储能电站规模。\n\n来源：[原始资料](https://www.global.toshiba/content/dam/toshiba/migration/corp/techReviewAssets/tech/review/2009/high2009/high2009pdf/0906.pdf)\n\n### 中山磁储能示范\n\n中山市高性能高温超导材料及磁储能应用示范工程由南方凯能（广东）电力集团旗下中山市农村电力工程有限公司承接，地点在翠亨新区110 kV滨海变电站旁。\n\n2025年开工公告：投资人民币2.08亿元，最大输出功率不低于5 MW，储能量不低于10 MJ。 2026年政府报告确认投入运行，但未给出当年的实测可用能量、响应曲线、冷却辅助能耗或年循环统计。\n\n原始来源：[企业/项目资料](https://www.zs.gov.cn/zwgk/ghzj/fzghjh/gmjjshfzghgy/content/post_2597701.html)\n\n### 九州电力\n\n九州电力参与超导电力网络控制技术研发，曾与中部电力、ISTEC及古河电工合作开发并验证电网控制用SMES。\n\n2007年度起开展约半年实证，2011年4月以前试验确认预定控制功能动作。 项目与中部电力、ISTEC合作，获得古河电工支持，安装地点是古河日光发电细尾电站。\n\n原始来源：[企业/项目资料](https://www.kyuden.co.jp/company/history/energy/technology/technology-1.html)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "market",
      "label": "政策市场",
      "title": "超导磁储能 · 政策市场",
      "content": "### 电能质量与超导研发驱动\n\nSMES 的明确工程证据集中于短时功率调节与工业供电保护。DOE 高温超导研究代表政府支持高场磁体技术探索，但科研资助不等于商业市场收入或投运容量。\n\n来源：[原始资料](https://science.osti.gov/hep/Highlights/2013/NP-2013-08-a)\n\n| 统计对象 | 正确口径 | 典型误读 |\n|---|---|---|\n| 线圈储能 | J、MJ、kWh | 10 MJ 误写成 10 MWh，放大 3600 倍 |\n| 变流器 | MW 或 MVA，注明有功/视在 | MVA 误作储电能量 |\n| 超导线材 | 长度、临界电流及工况 | 线材产能等于储能装机 |\n| 工业保护项目 | 保护负载、跌落持续时间、动作记录 | 把专用短时部署泛化为大规模调峰 |\n\n2024 模型论文对商业化的概括与 2007 具体工程证据存在范围差异，以具体项目事实为准。\n\n### 2021联合科技创新规划\n\n国家能源局与科技部《十四五能源领域科技创新规划》第21页列出超导与电介质电容技术攻关，以及10MW级超级电容示范方向。规划研发目标与实际示范运行分开记录。\n\n原始来源：[联合科技创新规划](https://zfxxgk.nea.gov.cn/2021-11/29/c_1310540453.htm)",
      "detailLabel": "",
      "details": ""
    },
    {
      "id": "storage",
      "label": "储能适配",
      "title": "超导磁储能 · 储能适配",
      "content": "| 场景 | 适配价值 | 主要约束 |\n|---|---|---|\n| 输电功率摆动 | 快速双向交换有功、配合无功控制 | 控制稳定性、变流器容量与能量余量 |\n| 工厂瞬时跌落 | 短时保护高价值制造负载 | 低温系统可靠性、切换时间与维护 |\n| 高频功率波动 | 频繁循环且不依赖化学物质转化 | 交流损耗、引线和辅耗 |\n| 长时电量搬移 | 原理上可保持电流 | 大磁体材料/受力成本、持续制冷，不是当前典型优势 |\n\n### 持续时间由能量和功率共同决定\n\n以 30 MJ 和 10 MW 为例，E/P≈3 s 只是理想满能量上界，实际受最低线圈电流、功率控制和损耗限制。重复振荡服务并不要求每次从满电放空，需结合信号频率和能量摆幅分析。\n\n### 全系统效率包含保持时间\n\n线圈、低温、变流器和保护系统分别产生损耗。展示“效率”必须说明是单次线圈充放、交流端往返，还是含若干小时待机的周期；不能以超导态零直流电阻推导“无限保存”或“100% 往返”。\n\n来源：[原始资料](https://www.osti.gov/servlets/purl/5533723) ；[原始资料](https://eprints.gla.ac.uk/330106/1/330106.pdf)",
      "detailLabel": "",
      "details": ""
    }
  ],
  "policy": {
    "id": "smes-policy",
    "label": "功率型储能与研发",
    "year": "2021",
    "title": "超级电容与超导储能纳入科技创新规划",
    "copy": "联合规划列出功率型储能攻关和示范。器件研发、工程建设与专用项目运行分别记录。",
    "facts": [
      [
        "10 MW级",
        "超级电容示范研发方向"
      ],
      [
        "超导技术",
        "科技创新规划攻关方向"
      ]
    ],
    "subject": "scene:smes-policy"
  },
  "market": {
    "id": "smes-market",
    "label": "器件与具体工程",
    "year": "应用",
    "title": "短时保护与电网控制",
    "copy": "LCD工厂专用保护和细尾电站试验已有工程记录。MJ能量与MW功率决定短时服务范围。",
    "facts": [
      [
        "10 MW / 20 MJ",
        "2007年度起细尾电站实证"
      ]
    ],
    "subject": "route:smes:history"
  },
  "historySubject": "route:smes:history",
  "note": "原始研究与专用工程",
  "showMarketChart": false,
  "papers": {
    "id": "smes-papers",
    "label": "原始研究",
    "year": "实验",
    "title": "导体低温条件与模块测试",
    "copy": "10MJ模块研究给出低温测试。电缆临界电流对应20K和3T，有独立测试边界。",
    "facts": [
      [
        "10 MJ ≈2.78 kWh",
        "混合超导模块低温测试"
      ],
      [
        ">3 kA @20 K / 3 T",
        "MgB₂电缆临界电流，非整机额定"
      ]
    ],
    "subject": "route:smes:history"
  },
  "storage": {
    "id": "smes-storage",
    "label": "功率服务",
    "year": "应用",
    "title": "电网摆动与瞬时跌落保护",
    "copy": "储能量和变流器功率限定支撑时长。热漏、制冷和功率电子辅耗计入完整系统。",
    "facts": [
      [
        "30 MJ ≈8.33 kWh",
        "Tacoma实网稳定试验"
      ],
      [
        "10 MW / 约0.35 Hz",
        "变流器与摆动频率"
      ]
    ],
    "subject": "route:smes:history"
  }
};
