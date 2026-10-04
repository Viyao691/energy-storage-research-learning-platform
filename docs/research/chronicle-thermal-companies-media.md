# 编年史热储能：企业、项目与图源记录

研究日期：2026-10-03。只记录热储能，不将电化学储能柜或项目套入本路线。企业网页中的宣传数字保留其披露性质；公开网页未给出的容量、功率、效率和运营年份不作推断。可解析的 profile、Exhibit 和图片映射在同目录的 [chronicle-thermal-assets.json](chronicle-thermal-assets.json)，供 Sol 选择性接入。

## 路线边界与证据阅读

显热储能主要将物质加热或冷却，储能量随质量、比热和温差变化（Q≈m·cp·ΔT）；水罐、岩石/混凝土、耐火砖、固体碳块及CSP熔盐罐都属于此类。Rondo报告砖与电阻丝、超过1000°C的热电池；Antora报告固体碳块超过1800°C。CSP中的熔盐主要通过冷热盐之间的温度差存热，属于显热，不因盐熔化就自动成为潜热储能。公开温度不等于工艺输出温度，也不能代替热功率或储能容量。

潜热储能在相变点附近通过熔化吸热、凝固放热。Sunamp手册说明P58在约58°C固液转变、以换热器将热传给水；案例显示负荷转移收益，但没有公布该系统MWhth。MGA Thermal则用Miscibility Gap Alloy块内部相变存储潜热，Tomago项目给出了系统级MW与MWh数据。潜热路线可在窄温区集中储热，适用于温度相配的过程热；工程上需评估导热率、换热面积、相分离/过冷、体积变化、密封和数千次循环后的可用热量。MGA项目照片是现场设备，不是合金组织显微图。

热化学储能通过可逆化学反应或吸附/脱附储热，充热把反应物转为高化学势状态，放热时逆反应释放热。长时间静置可减少显热罐的保温损失，但系统仍需处理反应动力学、热质传递、反应物迁移、含湿量、循环稳定性与反应器成本。SaltX的Bollmora是已结束的TCES试验；其“3–5倍”指相对Berlin反应器的换热系数。当前SaltX电弧煅烧石灰业务不等同于热化学储热交付。Cache Energy的Duke试验已经完成循环演示但未披露容量；Whirlpool公告为试点部署且未披露MW/MWh。UCSD/Tempo项目仍在2024–2028项目期早期，20 MWhth、4小时充电和100 kW发电机运行24小时以上都是项目目标，不是运营实测。

## 可显示的企业与项目事实

| 路线 / 对象 | 可核实的项目/产品数据 | 证据边界 |
|---|---|---|
| 显热 / Rondo Energy | 2025-10-16公告：加州燃料生产设施100 MWh热容量装置开始自动商业运行；现场光伏充电，连续蒸汽；储热温度>1000°C。 | 公司未公布该装置额定MWth；“100 MWh”是热量，不是电池电量。公告称十周运行达到项目性能与可靠性里程碑。来源：[Rondo公告](https://www.rondo.com/news-press/rondo-powers-up-worlds-largest-industrial-heat-battery)。 |
| 显热 / Antora Energy | 2023-09-12公告：加州Wellhead现场模块已运行；固体碳块储热温度>1800°C，热可直接使用，也可由TPV转为电。 | 公告没有这套装置的MWhth或输出MW；>1800°C是储热温度。来源：[Antora公告](https://www.antora.com/insights/system-launch)。 |
| 潜热 / MGA Thermal | Tomago装置：0.5 MWe充电、0.5 MWth放热、5 MWhth，365°C过热蒸汽、设计10小时；2025年4月开始运行。 | 公司给出1800 MWhth/年是每日一循环计算量；示范照片展示设备，不证明材料结构。来源：[项目规格](https://mgathermal.com/flagship-projects/mga-demonstration-plant)、[潜热机制说明](https://mgathermal.com/newsroom-posts/mga-thermal-achieves-world-first-latent-heat-leap----unlocking-24-7-renewable-industrial-steam)。 |
| 潜热 / Sunamp | Thermino P58通过约58°C固液相变存热；Latham办公楼案例报告2198 W对3107 W峰值功率，降低约29%。 | 公司产品体系适用热水/建筑热，案例未披露MWhth或统一的充放热效率。来源：[官方手册](https://installation.sunamp.com/thermino/north-america-us-ca/thermino/installation-user-manuals/d0063-thermino-p58-installation-and-user-instructions-manual~7615907194365528871?format=show_external_document)、[案例](https://sunamp.com/en-ca/case-studies/sunamp-thermal-batteries-reduce-peak-load-in-a-new-york-office-building-a-nyserda-program/)。 |
| 热化学 / SaltX Technology | 瑞典上市公司；Bollmora试验自2021年运行、2022年结项；报告换热系数为Berlin系统的3–5倍。 | 该值不是往返效率；公司公告称下一阶段仍需潜在终端客户。EAC电石灰/水泥煅烧订单不纳入储热项目。来源：[结项公告](https://www.saltxtechnology.com/cision/final-report-for-the-pilot-plant-in-bollmora-completed-with-good-results/)。 |
| 热化学 / Cache Energy | 2026-03 Duke测试设施完成充放热循环；2026-05 Whirlpool厂部署试点，目标为全天连续热、最高约538°C。 | 两篇公告均未给MWhth、MWth；项目试点状态不代表已公开验证规模化交付。来源：[Duke演示](https://www.cache-energy.com/insights/cache-energy-demonstrates-rapid-modular-thermochemical-storage-at-duke-energys-mt-holly-facility)、[Whirlpool部署](https://www.cache-energy.com/insights/cache-deploys-electrified-heat-and-thermal-energy-storage-unit-at-whirlpool-ohio-facility)。 |
| 热化学 / Tempo与UCSD | CEC资助项目目标20 MWhth、4小时充电；目标驱动100 kW发电机24小时以上并供应余热。 | 项目期2024–2028，UCSD网页说明处于早期阶段；属设计和测量目标。来源：[UCSD项目页](https://www.energystorage.ucsd.edu/projects/demonstrating-tempo-thermochemical-energy-storage-at-uc-san-diego)。 |

## 政策原文图

本批政策图片直接取自国家发展改革委、国家能源局联合印发的《“十四五”新型储能发展实施方案》PDF第6页（页面页码P5）。文件于2022-01-29印发、2022-03-21公开；P2将热（冷）储能列入长时间尺度储能技术攻关，P5–6要求拓展热（冷）储能应用，并提出高效储热日到周、周到季时间尺度示范。图映射 `scene:thermal-policy`。来源：[NDRC原文页面](https://www.ndrc.gov.cn/xxgk/zcfb/tz/202203/t20220321_1319772.html)，[原始PDF](https://www.ndrc.gov.cn/xxgk/zcfb/tz/202203/P020220321543703119995.pdf)。

## 图像来源与授权说明

本批文件名以 `thermal-` 开头，位于 `frontend/public/chronicle/`。Rondo、MGA Thermal、Cache、Sunamp图片均来自企业官网页面；政策图由发改委公开PDF第6页渲染。企业网页未声明开放图片许可，因此记录版权方与源页面，只供本地科研展示；对外转载或商用需另核授权。现场设备照只关联公司与路线，不标作耐火砖、碳块、PCM、MGA合金或盐水合材料的实物样品。未取得可靠、对应具体材料的照片，缺口列在JSON `materialImageGaps`，请用明确标注“结构示意、非实拍”的概念图补足。