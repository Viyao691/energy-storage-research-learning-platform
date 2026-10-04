export type CityMode = "charge" | "discharge" | "emergency";
export type CityIllustration = "solar" | "grid" | "factory" | "homes" | "charging" | "hospital" | "thermal" | "hydroLower" | "hydroUpper" | "turbine" | "battery";

export type DiagramNode = { label: string; icon: CityIllustration };
export type DetailStep = { title: string; text: string };

export type CityScene = {
  id: string;
  title: string;
  x: number;
  y: number;
  source: [number, number];
  load: [number, number];
  location: string;
  purpose: string;
  charge: string;
  discharge: string;
  emergency?: string;
  principleSteps: [DetailStep, DetailStep, DetailStep];
  conditionSteps: [DetailStep, DetailStep, DetailStep];
  tagline: string;
  diagram: [DiagramNode, DiagramNode, DiagramNode];
};

export const cityScenes: CityScene[] = [
  {
    id: "renewable", tagline: "平滑波动，错峰消纳", diagram: [{ label: "风光发电", icon: "solar" }, { label: "场站储能", icon: "battery" }, { label: "按需并网", icon: "grid" }],
    title: "新能源场站", x: 20, y: 19, source: [10, 12], load: [36, 28],
    location: "风电与光伏场站并网点附近", purpose: "储存富余发电，缓解出力波动并按需送网。",
    charge: "风光高出力时吸收场站富余电能。", discharge: "出力转弱或系统需要时，按调度放电送网。",
    principleSteps: [
      { title: "识别波动", text: "比较风光实时出力、预测值与并网计划，识别短时偏差和可利用的富余电量。" },
      { title: "储存富余", text: "双向变流器控制充电，把部分富余电量存入电池，并保持合理荷电状态。" },
      { title: "按需释放", text: "出力下降或调度要求送电时放电，降低并网功率的剧烈变化并支持错峰消纳。" },
    ],
    conditionSteps: [
      { title: "并网控制", text: "遵守接入点功率、保护和调度要求，不能把储能当成无限制送电通道。" },
      { title: "容量匹配", text: "功率决定可平抑的瞬时波动，电量容量决定能持续转移多久。" },
      { title: "运行边界", text: "结合风光出力曲线、电池效率与寿命，确定充放电窗口。" },
    ],
  },
  {
    id: "grid", tagline: "调峰与调频，各司其职", diagram: [{ label: "电网供电", icon: "grid" }, { label: "储能电站", icon: "battery" }, { label: "城市负荷", icon: "homes" }],
    title: "电网储能站", x: 79, y: 27, source: [66, 21], load: [89, 39],
    location: "变电站与城市配电网络附近", purpose: "按调度承担负荷转移或快速功率调节。",
    charge: "低负荷时充电，为后续高峰预留电量。", discharge: "高峰放电；调频时则双向跟踪功率指令。",
    principleSteps: [
      { title: "调峰移时", text: "在系统负荷较低时充电、高峰时放电，把一部分用电需求移到其他时段。" },
      { title: "快速调频", text: "变流器按电网指令改变有功功率；调频可能在短时间内多次双向变化。" },
      { title: "状态协调", text: "能量管理系统留出足够荷电状态，避免满充或放空后失去调节能力。" },
    ],
    conditionSteps: [
      { title: "功率与电量", text: "额定功率影响瞬时调节幅度，电量容量影响调峰时长，两者不能互相替代。" },
      { title: "安全并网", text: "保护、消防、热管理和通信必须满足电网储能站的接入要求。" },
      { title: "服务规则", text: "调峰、调频等服务的运行方式取决于当地调度与市场机制。" },
    ],
  },
  {
    id: "industrial", tagline: "峰谷计划与需量削峰", diagram: [{ label: "低谷 / 光伏", icon: "solar" }, { label: "园区储能", icon: "battery" }, { label: "厂区高峰", icon: "factory" }],
    title: "工商业园区", x: 32, y: 48, source: [20, 38], load: [45, 60],
    location: "工厂与办公园区配电侧", purpose: "结合峰谷计划、需量削峰和屋顶光伏自用。",
    charge: "结合电价时段与光伏富余安排充电。", discharge: "负荷尖峰时放电，降低瞬时取电需量。",
    principleSteps: [
      { title: "识别用电峰值", text: "读取园区负荷曲线和电价时段，区分持续高负荷与短时需量尖峰。" },
      { title: "计划充电", text: "在合适的低价时段或屋顶光伏富余时充电，保留高峰所需电量。" },
      { title: "削减尖峰", text: "厂区负荷冲高时短时放电，减少配电侧瞬时取电，也提高光伏自用。" },
    ],
    conditionSteps: [
      { title: "电价适用", text: "收益取决于企业适用的峰谷电价、需量计费方式和实际充放电时段。" },
      { title: "设备代价", text: "计算变流损耗、电池循环寿命、维护与消防成本，不能保证固定收益。" },
      { title: "负荷协同", text: "控制系统要与屋顶光伏和生产用电计划协调，避免充电反而抬高需量。" },
    ],
  },
  {
    id: "community", tagline: "白天存光伏，夜间供选定回路", diagram: [{ label: "分布式光伏", icon: "solar" }, { label: "社区储能", icon: "battery" }, { label: "选定回路", icon: "homes" }],
    title: "居民社区", x: 81, y: 50, source: [68, 43], load: [90, 59],
    location: "住宅屋顶与社区公共配电区域", purpose: "提高光伏自用，支持公共或关键回路备用。",
    charge: "白天光伏富余时，户用或社区储能充电。", discharge: "夜间按控制策略向选定本地负荷供电。",
    emergency: "仅在具备切换和隔离配置时，为选定公共或关键回路局部备用供电。",
    principleSteps: [
      { title: "日间存光", text: "配置双向变流器和控制系统，把屋顶分布式光伏的部分富余电能存入储能。" },
      { title: "夜间自用", text: "光伏出力减少后，储能向约定的住户或公共负荷回路供电。" },
      { title: "局部备用", text: "若另配切换和孤岛保护，停电时可隔离电网并支撑指定关键回路。" },
    ],
    conditionSteps: [
      { title: "回路选择", text: "先确定电梯、照明或特定住户等哪些回路需要备用，不能默认全社区不断电。" },
      { title: "切换保护", text: "备用供电必须具备安全的电网隔离、切换和孤岛运行控制。" },
      { title: "容量时长", text: "储能电量、备用负荷和可持续时间需共同设计，并定期维护。" },
    ],
  },
  {
    id: "charging", tagline: "缓解集中补能瞬时压力", diagram: [{ label: "站内光伏", icon: "solar" }, { label: "站内储能", icon: "battery" }, { label: "车辆补能", icon: "charging" }],
    title: "充电场站", x: 30, y: 68, source: [18, 62], load: [40, 77],
    location: "城市公共充电站", purpose: "让储能分担车辆集中到站时的短时功率。",
    charge: "车少或光伏富余时补能，留出可用电量。", discharge: "车辆集中到站时，储能与电网共同供桩。",
    principleSteps: [
      { title: "识别车流", text: "站级控制系统根据车辆到站和充电功率变化预测短时用电峰值。" },
      { title: "提前补能", text: "车少或光伏富余时给储能充电，为集中充电时段准备可用电量。" },
      { title: "共同供桩", text: "多辆车同时快充时，储能补充一部分瞬时功率，缓解配变压力。" },
    ],
    conditionSteps: [
      { title: "配变约束", text: "先核定配电变压器和充电设备的功率上限，再制定站内分配策略。" },
      { title: "补能周转", text: "储能放电后要有足够空档重新充电；持续满负荷车流会耗尽可用电量。" },
      { title: "设备安全", text: "光伏、储能与充电区需满足接入、热管理和消防布置要求。" },
    ],
  },
  {
    id: "hospital", tagline: "关键负荷的连续供电", diagram: [{ label: "正常供电", icon: "grid" }, { label: "UPS / 储能", icon: "battery" }, { label: "关键负荷", icon: "hospital" }],
    title: "医院与数据中心", x: 89, y: 74, source: [77, 67], load: [94, 86],
    location: "医院与数据中心的关键负荷回路", purpose: "与 UPS、发电机及冗余配电协同保障关键负荷。",
    charge: "正常时保持备电可用，优先留足应急余量。", discharge: "按供电方案释放电能，保留必要备电余量。",
    emergency: "市电中断后由 UPS 电池先承接过渡；发电机稳定接替，配置合适的储能可支撑指定回路。",
    principleSteps: [
      { title: "市电中断", text: "切换和监测系统识别上级供电异常，只让设计中的关键负荷进入备用链路。" },
      { title: "UPS 立即承接", text: "UPS 电池在切换过渡时维持敏感设备供电；普通 BESS 不应默认等于无缝 UPS。" },
      { title: "发电机接替", text: "发电机稳定后承担较长期供电；配置合适的 BESS 可按方案配合支撑关键回路。" },
    ],
    conditionSteps: [
      { title: "关键回路", text: "医疗设备、服务器与辅助系统须按可靠性等级划分，明确哪些负荷优先保障。" },
      { title: "冗余切换", text: "UPS、发电机、BESS 与配电开关需按设计协同，验证隔离、切换和保护动作。" },
      { title: "维护演练", text: "定期检查电池状态、发电机启动与燃料、旁路及故障演练，避免单点失效。" },
    ],
  },
  {
    id: "thermal", tagline: "储能快，机组慢", diagram: [{ label: "火电机组", icon: "thermal" }, { label: "调频储能", icon: "battery" }, { label: "AGC 指令", icon: "grid" }],
    title: "火力发电站", x: 58, y: 17, source: [46, 10], load: [69, 25],
    location: "火电机组侧的储能系统", purpose: "火储联合跟踪 AGC，以储能补足机组响应速度。",
    charge: "AGC 下调时储能可吸收功率，机组随后调整。", discharge: "AGC 上调时储能可先补功率，机组随后跟进。",
    principleSteps: [
      { title: "接收 AGC", text: "机组与储能共同接收调度的功率变化指令，目标可能随时向上或向下改变。" },
      { title: "储能先响应", text: "变流器快速双向调节功率，承担机组暂时跟不上的变化部分。" },
      { title: "机组再跟进", text: "火电机组逐步调整出力，储能随之回到适合下一次调节的荷电状态。" },
    ],
    conditionSteps: [
      { title: "协调控制", text: "需明确机组和储能各自承担的功率变化，避免相互抵消或过度循环。" },
      { title: "状态约束", text: "储能须保留向上和向下调节空间，并考虑电池温度、寿命与安全边界。" },
      { title: "真实工况", text: "AGC 不按固定白天充、夜晚放运行；本页日夜按钮只说明流向。" },
    ],
  },
  {
    id: "hydro", tagline: "电能变水势能，再发电", diagram: [{ label: "下水库抽水", icon: "hydroLower" }, { label: "上水库蓄能", icon: "hydroUpper" }, { label: "电网调度", icon: "grid" }],
    title: "抽水蓄能电站", x: 87, y: 7, source: [91, 22], load: [91, 22],
    location: "具备上下水库的城市外围山地", purpose: "利用水库高差储存势能，按系统需求发电。",
    charge: "抽水工况：使用电能将下水库的水提升到上水库。",
    discharge: "发电工况：上水库放水，推动水轮机发电。",
    principleSteps: [
      { title: "用电抽水", text: "系统供给电能，水泵把下水库的水提升至上水库，电能转化为水的势能。" },
      { title: "高处储能", text: "水位差与可调度水量共同决定可储存的能量，水泵停止后保持蓄水状态。" },
      { title: "放水发电", text: "需要电能时由上水库放水，推动水轮发电机向电网送电。" },
    ],
    conditionSteps: [
      { title: "地形水源", text: "需有合适的上下水库高差和可用水量，并完成生态环境评估。" },
      { title: "工况切换", text: "抽水和发电是不同运行工况，同一机组不能同时进行两种能量转换。" },
      { title: "系统接入", text: "水道、机组容量及电网接入能力共同限制功率和持续时长。" },
    ],
  },
];
