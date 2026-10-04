"""Explicit public, official XJTU source catalogue. No arbitrary URL input."""

from __future__ import annotations

from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.campus_models import CampusSource


# key, display name, group, public list/home URL, priority.
# Roots are deliberately labelled as home-page coverage in the UI/status; they are not a claim
# to have discovered every subcolumn.
CATALOGUE = (
    ("xjtu-home", "西安交通大学 · 官网", "学校", "https://www.xjtu.edu.cn/", 90),
    ("xjtu-news", "西安交通大学 · 新闻网", "学校", "https://news.xjtu.edu.cn/", 90),
    ("xjtu-research", "西安交通大学 · 科学研究", "学校", "https://news.xjtu.edu.cn/kxyj.htm", 88),
    ("xjtu-talent", "西安交通大学 · 人才培养", "学校", "https://news.xjtu.edu.cn/rcpy.htm", 87),
    ("xjtu-units", "西安交通大学 · 院部动态", "学校", "https://news.xjtu.edu.cn/yxdt/ybdt.htm", 86),
    ("xjtu-today", "西安交通大学 · 今日交大", "学校", "https://news.xjtu.edu.cn/index/jrjd1.htm", 86),
    ("zhongying-news", "仲英书院 · 新闻动态", "书院", "https://cy.xjtu.edu.cn/xwdt/xwdt.htm", 72),
    ("xjtu-oa", "西安交通大学 · 校级通知公告", "学校", "https://oa.xjtu.edu.cn/zxgg_index.jsp", 92),
    ("xjtu-info", "西安交通大学 · 综合信息", "学校", "https://info.xjtu.edu.cn/", 85),
    ("future-notices", "未来技术学院 · 通知公告", "未来技术学院", "https://wljsxy.xjtu.edu.cn/xwgg/tzgg.htm", 100),
    ("future-teaching", "未来技术学院 · 教学教务", "未来技术学院", "https://wljsxy.xjtu.edu.cn/zspy/jxjw.htm", 98),
    ("future-projects", "未来技术学院 · 项目列表", "未来技术学院", "https://wljsxy.xjtu.edu.cn/xmpt/xmlb.htm", 98),
    ("future-coffee", "未来技术学院 · Coffee Hour", "未来技术学院", "https://wljsxy.xjtu.edu.cn/list-pic.jsp?urltype=tree.TreeTempUrl&wbtreeid=1052", 97),
    ("future-forum", "未来技术学院 · 创客论坛", "未来技术学院", "https://wljsxy.xjtu.edu.cn/list-pic.jsp?urltype=tree.TreeTempUrl&wbtreeid=1053", 97),
    ("future-home", "未来技术学院 · 官网", "未来技术学院", "https://wljsxy.xjtu.edu.cn/", 95),
    ("energy-notices", "能源与动力工程学院 · 通知公告", "工科学院", "https://epe.xjtu.edu.cn/index/tzgg.htm", 85),
    ("energy-contests", "能源与动力工程学院 · 科创竞赛", "工科学院", "https://epe.xjtu.edu.cn/szgz/kcjs.htm", 85),
    ("lectures", "西安交大 · 学术讲座", "学校", "https://meeting.xjtu.edu.cn/lecturenotices/list/0/1", 80),
    ("academics", "西安交大 · 教务处", "学校", "https://jwc.xjtu.edu.cn/", 70),
    ("mechanical", "机械工程学院", "工科学院", "https://mec.xjtu.edu.cn/", 65),
    ("mechanical-undergraduate", "机械工程学院 · 本科生通知", "工科学院", "https://mec.xjtu.edu.cn/index/tzgg/bks.htm", 90),
    ("mechanical-graduate", "机械工程学院 · 研究生通知", "工科学院", "https://mec.xjtu.edu.cn/index/tzgg/yjs.htm", 65),
    ("electrical", "电气工程学院", "工科学院", "https://ee.xjtu.edu.cn/", 65),
    ("materials", "材料科学与工程学院", "工科学院", "https://mse.xjtu.edu.cn/", 65),
    ("chemical", "化学工程与技术学院", "工科学院", "https://clet.xjtu.edu.cn/", 65),
    ("aerospace", "航天航空学院", "工科学院", "https://sae.xjtu.edu.cn/", 65),
    ("instruments", "仪器科学与技术学院", "工科学院", "https://ist.xjtu.edu.cn/", 65),
    ("habitat", "人居环境与建筑工程学院", "工科学院", "https://hsce.xjtu.edu.cn/", 65),
    ("life", "生命科学与技术学院", "工科学院", "https://slst.xjtu.edu.cn/", 65),
    ("electronics", "电子与信息学部", "工科学院", "https://eie.xjtu.edu.cn/", 65),
    ("ai", "人工智能学院", "工科学院", "https://www.aiar.xjtu.edu.cn/", 65),
    ("storage", "储能科学与工程研究平台", "工科学院", "https://gjcnpt.xjtu.edu.cn/", 70),
    ("pengkang", "彭康书院", "书院", "https://pksy.xjtu.edu.cn/", 55),
    ("wenzhi", "文治书院 · 通知公告", "书院", "https://wen.xjtu.edu.cn/tzgg.htm", 55),
    ("zonglian", "宗濂书院", "书院", "https://zlsy.xjtu.edu.cn/", 55),
    ("qide", "启德书院", "书院", "https://qdsy.xjtu.edu.cn/", 55),
    ("zhongying", "仲英书院", "书院", "https://cy.xjtu.edu.cn/", 55),
    ("lizhi", "励志书院", "书院", "https://lizhi.xjtu.edu.cn/", 55),
    ("chongshi", "崇实书院", "书院", "https://cssy.xjtu.edu.cn/", 55),
    ("nanyang", "南洋书院", "书院", "https://nanyang.xjtu.edu.cn/", 55),
    ("qianxuesen", "钱学森书院／钱学森学院（共用官网）", "书院", "https://bjb.xjtu.edu.cn/", 55),
    ("math", "数学与统计学院", "学院", "https://math.xjtu.edu.cn/", 60),
    ("physics", "物理学院", "学院", "https://phy.xjtu.edu.cn/", 60),
    ("physics-notices", "物理学院 · 通知公告", "学院", "https://phy.xjtu.edu.cn/glfw/tzgg.htm", 62),
    ("physics-academic", "物理学院 · 学术动态", "学院", "https://phy.xjtu.edu.cn/kxyj/xsdt1.htm", 62),
    ("chemistry", "化学学院", "学院", "https://chem.xjtu.edu.cn/", 60),
    ("chemistry-notices", "化学学院 · 通知公告", "学院", "https://chem.xjtu.edu.cn/tzgg.htm", 62),
    ("frontier-science", "前沿科学技术研究院", "学院", "https://fist.xjtu.edu.cn/", 60),
    ("frontier-lectures", "前沿科学技术研究院 · 学术报告", "学院", "https://fist.xjtu.edu.cn/xwgg/xsbg.htm", 62),
    ("medicine", "医学部", "学院", "https://www.med.xjtu.edu.cn/", 60),
    ("economics", "经济与金融学院", "学院", "https://sef.xjtu.edu.cn/", 58),
    ("jinhe", "金禾经济研究中心", "学院", "https://jinhe.xjtu.edu.cn/", 58),
    ("management", "管理学院", "学院", "https://som.xjtu.edu.cn/", 58),
    ("public-policy", "公共政策与管理学院", "学院", "https://sppa.xjtu.edu.cn/", 58),
    ("humanities", "人文社会科学学院", "学院", "https://rwxy.xjtu.edu.cn/", 58),
    ("media", "新闻与新媒体学院", "学院", "https://xmtxy.xjtu.edu.cn/", 58),
    ("marxism", "马克思主义学院", "学院", "https://marx.xjtu.edu.cn/", 58),
    ("law", "法学院", "学院", "https://fxy.xjtu.edu.cn/", 58),
    ("foreign-languages", "外国语学院", "学院", "https://sfs.xjtu.edu.cn/", 58),
    ("sports", "体育学院", "学院", "https://tyzx.xjtu.edu.cn/", 58),
    ("continuing-education", "继续教育（远程教育）学院", "学院", "https://sce.xjtu.edu.cn/", 55),
    ("international-education", "国际教育学院", "学院", "https://sie.xjtu.edu.cn/", 55),
    ("milan", "西交米兰学院", "学院", "https://jsdi.xjtu.edu.cn/", 60),
    ("excellent-engineers", "国家卓越工程师学院", "学院", "https://nse.xjtu.edu.cn/", 60),
    ("medical-innovation", "医学攻关平台", "学院", "https://sicmi.xjtu.edu.cn/", 60),
    ("innovation-practice", "实践教学中心 · 大创项目（创新创业相关）", "学院", "https://pec.xjtu.edu.cn/cxcy/dcxm.htm", 60),
    ("hainan-profile", "海南国际学院 · 官网目录介绍", "学院", "https://www.xjtu.edu.cn/xynr.jsp?urltype=tree.TreeTempUrl&wbtreeid=2291", 40),
)

ALLOWED_HOSTS = frozenset(urlsplit(row[3]).hostname for row in CATALOGUE)


def source_coverage(key: str, url: str) -> str:
    if key in {"hainan-profile", "future-coffee", "future-forum"}:
        return "unverified"
    return "homepage" if urlsplit(url).path in ("", "/") else "column"


def seed_sources(db: Session) -> None:
    """Idempotently add newly supported sources; never reset user controls or cooldowns."""
    present = {source.key: source for source in db.scalars(select(CampusSource))}
    auto_enable = db.scalar(select(CampusSource.id).where(CampusSource.enabled.is_(True)).limit(1)) is not None
    for key, name, group, url, priority in CATALOGUE:
        if key in present:
            present[key].name = name
            present[key].group = group
            present[key].priority = priority
        else:
            placeholder = key == "hainan-profile"
            db.add(CampusSource(key=key, name=name, group=group, url=url, priority=priority,
                                enabled=auto_enable and key != "hainan-profile",
                                ever_enabled=auto_enable and key != "hainan-profile",
                                status="pending", detail=("仅官网目录介绍，尚无已核实资讯栏目" if placeholder else
                                                          "等待首次检查" if auto_enable else "尚未启用"),
                                robots_status="unchecked", coverage=source_coverage(key, url)))
    for source in db.scalars(select(CampusSource).where(CampusSource.coverage == "unverified")):
        if source.key != "hainan-profile":
            source.coverage = source_coverage(source.key, source.url)
    db.commit()
