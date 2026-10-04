# 机械储能企业与媒体证据（第一批：抽水蓄能）

核查日期：2026-10-03。仅纳入抽水蓄能，不将常规水电水库照片自动当作抽水蓄能。规划、在建、投运分开标注。图片优先公司官方项目媒体；公开页面并不自动代表开放许可，清单记录授权范围。

## CompanyProfile JSON

字段对齐 chronicle CompanyProfile 形状；ID使用路线前缀，规模按来源原文限定。未填可核实市值的项目不套用上市母集团市值。

{
  "pumped-hydro-edf": {
    "summary": "法国公营电力公司EDF运营抽水蓄能与水电资产；Grand’Maison为抽水-发电混合电站。",
    "country": "法国",
    "listing": "EDF自2023-06-08由法国政府持有全部股本并从Euronext Paris退市；无公开市场市值。",
    "scale": "Grand’Maison于1985–1987分批投运，装机1,800MW；上水库可存水1.4亿m³，下水库1,500万m³。数据为电站规模，不代表储能效率或可用MWh。",
    "asOf": "项目资料核查2026-10-03；股权状态自2023-06-08",
    "sources": [
      {"label":"EDF Grand’Maison电站资料","url":"https://www.edf.fr/groupe-edf/agir-en-entreprise-responsable/fondation-et-mecenat-patrimoine-sport/site-edf-grand-maison-hydrelec/amenagement-de-grand-maison"},
      {"label":"EDF退市及法国政府持股公告","url":"https://www.edf.fr/en/the-edf-group/dedicated-sections/journalists/all-press-releases/implementation-of-the-squeeze-out-procedure-in-respect-of-the-equity-securities-of-edf"}
    ]
  },
  "pumped-hydro-drax": {
    "summary": "英国Drax Group运营发电、能源供应及水电资产；苏格兰Cruachan为山体洞室内的可逆式抽水蓄能电站。",
    "country": "英国",
    "listing": "Drax Group plc，伦敦证券交易所上市；本资料不列无日期市值。",
    "scale": "Cruachan现有机组装机440MW，4台可逆机组，约30秒可达满出力，最高可连续发电超过16小时（公司介绍）；2024年公布升级计划拟增至480MW、另有600MW Cruachan 2开发，不作为已投运容量。",
    "asOf": "Cruachan页面更新至2026-04；升级信息来自2024公告",
    "sources": [
      {"label":"Cruachan电站与现役规模","url":"https://www.drax.com/uk/what-we-do/cruachan-power-station/"},
      {"label":"Drax Cruachan升级公告，2024-04-29","url":"https://www.drax.com/press_release/draxs-iconic-cruachan-hollow-mountain-power-station-set-for-80-million-upgrade/"},
      {"label":"Drax网站使用条款","url":"https://www.drax.com/terms-of-use/"}
    ]
  },
  "pumped-hydro-state-grid": {
    "summary": "国家电网旗下国网新源建设运营抽水蓄能电站；河北丰宁为大型纯抽水蓄能项目。",
    "country": "中国",
    "listing": "国网新源为国家电网体系项目开发运营主体，非独立公开上市公司；不套用国家电网市值。",
    "scale": "丰宁12台机组共3.6GW，最后一台变速机组于2024-12-31投入商业运行，完成全容量投产。当地政府报告的年设计发电量66.12亿kWh、年设计抽水耗电量87.16亿kWh为设计指标，非当年实测值。",
    "asOf": "全容量商业运行日期2024-12-31；运行统计发布2025-09-17",
    "sources": [
      {"label":"丰宁县政府全容量并网公告，运营主体及设计规模","url":"https://www.fengning.gov.cn/art/2025/1/2/art_4511_1040263.html"},
      {"label":"丰宁县清洁能源发展中心项目运行信息，2025-09-17","url":"https://www.fengning.gov.cn/art/2025/9/17/art_4511_1083354.html"}
    ]
  }
}

## 历史节点建议

| route | year | title / evidence | subjects | source |
|---|---:|---|---|---|
| pumped-hydro | 1965 | Cruachan可逆式抽水蓄能电站于1965年启用，设施位于Ben Cruachan山体内部；当前运营公司为Drax。 | company:pumped-hydro-drax, route:pumped-hydro:history | https://www.drax.com/uk/what-we-do/cruachan-power-station/ |
| pumped-hydro | 1987 | EDF Grand’Maison抽水蓄能电站最后机组于1987年投运；装机1,800MW，由上下水库与可逆泵水轮机组构成。 | company:pumped-hydro-edf, route:pumped-hydro:history | https://www.edf.fr/groupe-edf/agir-en-entreprise-responsable/fondation-et-mecenat-patrimoine-sport/site-edf-grand-maison-hydrelec/amenagement-de-grand-maison |
| pumped-hydro | 2024 | 丰宁最后一台变速机组于2024-12-31投入商业运行，全站12台机组、3.6GW实现全容量投产；由国家电网出资、国网新源开发运营。 | company:pumped-hydro-state-grid, route:pumped-hydro:history | https://www.fengning.gov.cn/art/2025/1/2/art_4511_1040263.html |

## 图片清单与授权边界

可接入素材见同目录 chronicle-mechanical-assets.json。图源均来自Drax官方2021-06-24 Cruachan扩建新闻稿，Drax条款允许记者、报道者、广播制作人或博主将Media区域中的新闻稿和视觉资产用于非商业新闻编辑；本项目保留权利人和出处，按本地研究展示使用，不代表开放许可或外部再发布授权。照片credit按Drax来源记录。

丰宁项目事实可靠，但gov.cn转载页明确禁止未经书面授权复用其文字、照片和多媒体；因此本轮只引用项目数据，不下载该页新华社照片。EDF网站图片条款要求任何图片事先取得EDF明确书面同意；Grand’Maison只保留项目与运营者档案，不下载或登记EDF官网照片。

抽水蓄能材料/部件可用真实工程照片直接表达上下水库和地下机组，当前无需AI材料示意图。

## 其余五路企业、项目与事件（补充批次）

核查日期：2026-10-03。容量分别注明功率、能量和时长；开发、建设、试验与投运区分。未取得带明确交易日、币种和发行主体的市值快照时，不填动态市值。

### CompanyProfile JSON（新增）

{
  "caes-adiabatic-hydrostor": {
    "summary": "加拿大长时储能开发商，开发和运营以压缩空气、水和热管理为核心的先进压缩空气储能（A-CAES）。",
    "country": "加拿大",
    "listing": "Hydrostor Inc.为非上市私营公司，由机构投资者支持，无独立公开市值。",
    "scale": "Goderich于2019年投运，放电1.75MW、充电2.2MW、容量超过10MWh；合同容量7MWh。Silver City 200MW/1,600MWh仍为开发项目。",
    "asOf": "2026-10-03",
    "sources": [{"label":"公司与投资者","url":"https://hydrostor.ca/our-company/"},{"label":"Goderich状态与数据","url":"https://hydrostor.ca/project/the-goderich-a-caes-facility/"},{"label":"Silver City项目公告","url":"https://hydrostor.ca/hydrostor-acquires-100-ownership-of-the-silver-city-energy-storage-centre/"}]
  },
  "caes-adiabatic-iet-cas": {
    "summary": "中国科学院工程热物理研究所研发张家口先进压缩空气储能示范项目；属于科研机构，不是上市公司。",
    "country": "中国",
    "listing": "中科院下属非上市研究机构，无独立市值。",
    "scale": "张家口项目于2022-09-30并网并具备商业运行条件，100MW/400MWh；采用人工储气装置并回收压缩热，降低常规CAES燃气复热依赖。",
    "asOf": "项目并网公告2022-09-30；网页收录2024-10-31",
    "sources": [{"label":"CAS项目说明","url":"https://english.cas.cn/Special_Reports/rd/2022/202410/t20241031_693356.shtml"},{"label":"CAS中文报道","url":"https://www.cas.cn/cm/202210/t20221001_4849738.shtml"}]
  },
  "caes-conventional-uniper": {
    "summary": "德国Uniper运营Huntorf压缩空气储能电站；盐穴储气，放电时天然气复热，属于传统补燃CAES。",
    "country": "德国",
    "listing": "Uniper SE在法兰克福上市，德国联邦政府于2022年救助后成为控股股东；未将集团市值用于电站估值。",
    "scale": "Huntorf自1978年投运；Uniper当前页面列321MW、两座盐穴，满功率启动约12分钟。",
    "asOf": "2026-10-03",
    "sources": [{"label":"Uniper Huntorf设施","url":"https://www.uniper.energy/about-uniper/projects/energy-transformation-hub-northwest"},{"label":"Uniper储能与投运信息","url":"https://www.uniper.energy/energy-storage-uniper"},{"label":"EWE与Uniper合作说明","url":"https://www.ewe.com/en/media-center/press-releases/2021/04/ewe-and-uniper-plan-to-build-hydrogen-hub-at-huntorf-site-ewe-ag"}]
  },
  "caes-conventional-powersouth": {
    "summary": "美国PowerSouth Energy Cooperative为成员制发电与输电合作社，拥有并运营阿拉巴马州McIntosh CAES机组。",
    "country": "美国",
    "listing": "非上市电力合作社，无公开股票市值。",
    "scale": "McIntosh CAES于1991年投运，发电功率110MW、设计最长放电约26小时；不与同址燃气机组总装机混为一谈。",
    "asOf": "2026-10-03",
    "sources": [{"label":"成员合作社McIntosh设施说明","url":"https://www.gcec.com/about-us/our-cooperative/power-generation/"},{"label":"阿拉巴马州2025运行许可公告","url":"https://adem.alabama.gov/sites/default/files/2025-06/06-25psmcintosh.html"}]
  },
  "liquid-air-highview": {
    "summary": "英国Highview Power开发液态空气储能（LAES）：液化空气储存，放电时加压升温并膨胀驱动透平。",
    "country": "英国",
    "listing": "非上市公司；Carrington融资方包括英国国家财富基金与Centrica，不代表Highview公开市值。",
    "scale": "Carrington于2025-11-21开工，设计50MW/300MWh，仍在建设。Pilsworth 5MW/15MWh于2018年发布为电网级示范；旧公告不证明其今天仍运行。",
    "asOf": "Carrington公告2025-11-21；Pilsworth公告2018-06-05",
    "sources": [{"label":"Carrington项目状态","url":"https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/"},{"label":"Pilsworth示范公告","url":"https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/"},{"label":"融资方与项目容量","url":"https://www.centrica.com/media-centre/news/2024/centrica-invests-in-renewable-energy-storage-capabilities/"}]
  },
  "liquid-air-birmingham": {
    "summary": "伯明翰大学低温储能研究团队曾与Highview合作验证LAES试验系统；是科研平台而非商业电站。",
    "country": "英国",
    "listing": "公立研究型大学，无上市主体或市值。",
    "scale": "Highview 350kW/2.5MWh试验装置曾从Slough搬至伯明翰继续研究；不推断其目前仍持续运行。",
    "asOf": "搬迁计划公告2014-12-11",
    "sources": [{"label":"伯明翰大学搬迁与试验装置","url":"https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage"},{"label":"LAES试验研究目录","url":"https://research.birmingham.ac.uk/en/publications/performance-analysis-and-detailed-experimental-results-of-the-fir/"}]
  },
  "flywheel-beacon": {
    "summary": "美国Beacon Power提供高速飞轮储能，Stephentown设施为NYISO提供频率调节。",
    "country": "美国",
    "listing": "Beacon Power, LLC为私营企业；RGA Investments于2018年收购，无独立公开市值。",
    "scale": "Stephentown 20MW站含200台飞轮，2011年1月商业运行、6月达到满出力；公司称设施总体量程40MW。",
    "asOf": "2026-10-03；收购公告2018-05-01",
    "sources": [{"label":"Stephentown设施数据","url":"https://beaconpower.com/stephentown-new-york/"},{"label":"Beacon公司历史","url":"https://beaconpower.com/history/"},{"label":"RGA收购公告","url":"https://beaconpower.com/news/rga-investments-llc-acquires-beacon-power-llc/"}]
  },
  "flywheel-amber": {
    "summary": "美国Amber Kinetics设计制造钢制飞轮系统，在菲律宾设有制造厂，面向电网、微网和孤岛供电部署。",
    "country": "美国研发总部；菲律宾制造",
    "listing": "非上市公司，无可核实独立市值。",
    "scale": "公司披露两座菲律宾工厂年产能可达4,000台；2025年与Indian Energy完成美国首个地上集装箱式系统调试并获UL现场认证。年产能不是实际出货。",
    "asOf": "产能页面核查2026-10-03；调试公告2025-08-06",
    "sources": [{"label":"公司与工厂","url":"https://amberkinetics.com/company/"},{"label":"安装组合","url":"https://amberkinetics.com/installations/"},{"label":"美国系统调试公告","url":"https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/"}]
  },
  "gravity-energy-vault": {
    "summary": "美国Energy Vault为上市储能技术公司，业务含重力、电池和绿色氢能储能，项目按具体技术分类。",
    "country": "美国",
    "listing": "Energy Vault Holdings, Inc.在NYSE以NRGV交易；未录入无实际日期和币种的市值。",
    "scale": "江苏如东EVx为25MW/100MWh；2023-12完成并网，2024-05完成测试，项目页称已commission。最终商业运营以地方审批为准，不能把其电池项目计为重力储能。",
    "asOf": "测试公告2024-05-07；项目页核查2026-10-03",
    "sources": [{"label":"如东EVx项目数据与状态","url":"https://www.energyvault.com/projects/rudong"},{"label":"测试及调试公告","url":"https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx"}]
  },
  "gravity-cnty": {
    "summary": "中国天楹（CNTY）为如东EVx重力项目本地投资和建设合作方之一，主营还包括环保与固废处理。",
    "country": "中国",
    "listing": "深交所上市，代码000035；母公司市值不等于重力项目估值。",
    "scale": "如东25MW/100MWh EVx由CNTY与合作方投资建设，并与Energy Vault、Atlas Renewable协作；其他项目应逐站区分建设和投运状态。",
    "asOf": "项目测试公告2024-05-07",
    "sources": [{"label":"Energy Vault公告及项目合作方","url":"https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx"}]
  },
  "gravity-gravitricity": {
    "summary": "英国Gravitricity开发以深竖井升降重物储能的方案；商业矿井项目与地上概念演示分开记。",
    "country": "英国",
    "listing": "非上市公司，无公开市值。",
    "scale": "Leith于2021年完成250kW并网演示，使用两只各25吨重物和15米高试验架；4–8MW是公司当时规划的商业项目规模，不是已建容量。",
    "asOf": "演示公告2021-04-22",
    "sources": [{"label":"Leith演示数据","url":"https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/"},{"label":"项目状态列表","url":"https://gravitricity.com/projects/"}]
  },
  "gravity-ares": {
    "summary": "美国ARES North America开发轨道式GravityLine，电机驱动质量车爬坡储能、下坡发电。",
    "country": "美国",
    "listing": "私营公司，无公开市场市值。",
    "scale": "Pahrump示范项目仍在开发，页面标示规划5MW、约20英亩；单组质量车720,000磅。",
    "asOf": "项目页面核查2026-10-03",
    "sources": [{"label":"ARES项目状态与运行方式","url":"https://aresnorthamerica.com/nevada-project/"},{"label":"ARES主页","url":"https://aresnorthamerica.com/"}]
  }
}

### 历史节点建议

| route | year | exhibit copy | subjects | source |
|---|---:|---|---|---|
| caes-adiabatic | 2019 | Hydrostor与NRStor完成Goderich A-CAES参考站，放电1.75MW、充电2.2MW、储能逾10MWh，合同容量7MWh。 | company:caes-adiabatic-hydrostor, route:caes-adiabatic:history | https://hydrostor.ca/hydrostor-nrstor-complete-a-caes-plant-in-canada/ |
| caes-adiabatic | 2022 | 张家口100MW先进CAES示范并网并具备商业运行条件，采用人工储气装置和压缩热回收。 | company:caes-adiabatic-iet-cas, route:caes-adiabatic:history | https://english.cas.cn/Special_Reports/rd/2022/202410/t20241031_693356.shtml |
| caes-conventional | 1978 | Uniper运营的Huntorf投运，盐穴储气，放电时燃烧天然气复热压缩空气。 | company:caes-conventional-uniper, route:caes-conventional:history | https://www.uniper.energy/energy-storage-uniper |
| caes-conventional | 1991 | PowerSouth McIntosh 110MW CAES机组投运，依靠盐穴和燃气复热，不与同厂燃气机组合并。 | company:caes-conventional-powersouth, route:caes-conventional:history | https://www.gcec.com/about-us/our-cooperative/power-generation/ |
| liquid-air | 2010 | Highview 350kW/2.5MWh LAES试验装置运行，后迁至伯明翰大学继续研究；不是商业电站。 | company:liquid-air-birmingham, company:liquid-air-highview, route:liquid-air:history | https://www.birmingham.ac.uk/news-archive/2014/cryogenic-energy-storage-expands-on-the-world-stage |
| liquid-air | 2018 | Highview发布Pilsworth 5MW/15MWh液态空气电网级示范；旧公告不证明该站当前仍在运行。 | company:liquid-air-highview, route:liquid-air:history | https://highviewpower.com/news-announcements/world-first-liquid-air-energy-storage-plant/ |
| liquid-air | 2025 | Carrington开工，设计50MW/300MWh，仍在建设；容量为设计值。 | company:liquid-air-highview, route:liquid-air:history | https://highviewpower.com/news-announcements/mayor-of-greater-manchester-andy-burnham-officially-breaks-ground-on-highviews-pioneering-liquid-air-energy-storage-facility-in-carrington-manchester/ |
| flywheel | 2011 | Beacon Stephentown飞轮站商业运行，200台飞轮提供NYISO频率调节；初期20MW，6月满出力。 | company:flywheel-beacon, route:flywheel:history | https://beaconpower.com/stephentown-new-york/ |
| flywheel | 2025 | Amber Kinetics与Indian Energy完成美国首套地上集装箱式飞轮系统调试并获UL现场认证；未披露系统容量。 | company:flywheel-amber, route:flywheel:history | https://amberkinetics.com/pr/amber-kinetics-receives-letter-of-support-from-indian-energy-for-its-above-ground-solution/ |
| gravity | 2021 | Gravitricity在Leith完成250kW并网概念演示，以两只25吨重物做升降测试；商业矿井项目仍在开发。 | company:gravity-gravitricity, route:gravity:history | https://gravitricity.com/gravitricity-250kw-demonstrator-stores-power-for-first-time/ |
| gravity | 2023–2024 | 如东25MW/100MWh EVx于2023年12月并网互联，2024年5月完成测试并进入调试披露；正式商业运行以当地审批为准。 | company:gravity-energy-vault, company:gravity-cnty, route:gravity:history | https://investors.energyvault.com/news/news-details/2024/Energy-Vault-Announces-Successful-Testing-and-Commissioning-of-First-EVx-100-MWh-Gravity-Energy-Storage-System-by-China-Tianying-Extension-of-Atlas-Renewable-Licensing-Agreement-to-15-Years-5e8837c40/default.aspx |
| gravity | 2020 | ARES在Pahrump公布5MW GravityLine示范项目开发；当前项目页仍标注开发中。 | company:gravity-ares, route:gravity:history | https://aresnorthamerica.com/nevada-project/ |

### 图片来源、授权与缺口

本批本地素材映射见同目录 chronicle-mechanical-assets.json。Carrington为Highview 2025开工活动实拍，前景含效果图、背景为施工现场；Beacon图是Stephentown飞轮站航拍；Rudong图是EVx重力块运输拖车组装厂房；ARES图为Pahrump开发现场，未展示完整GravityLine质量车。官网没有授予开放许可，素材按授权用于本地非商业研究展示并保留署名；外部发布前需另行确认权利。

Hydrostor Goderich文章的Image链接实际返回RenewablesNow第三方标志，已删除误下载文件；Hydrostor官方宣传册返回403，未绕过。Uniper Huntorf直链被Cloudflare拒绝，PowerSouth合作社McIntosh图链接返回403，均未下载或绕过。因此A-CAES和传统CAES暂时没有本地照片，建议补充分别标明储热/压缩热回收与燃气复热/盐穴的机理示意图，不借用其他技术照片。Highview的Pilsworth图片链接不可用，未纳入。照片均对应实际项目，不以普通电池储能、光伏或风电照片代替机械储能。

