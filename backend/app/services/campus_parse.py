"""Conservative extraction of public campus notices. Unknown dates stay unknown."""

from __future__ import annotations

import re
import hashlib
from dataclasses import dataclass
from datetime import date
from urllib.parse import parse_qs, quote, urljoin, urlsplit

from bs4 import BeautifulSoup


DATE_RE = re.compile(r"(?<!\d)(20\d{2})[年./-](0?[1-9]|1[0-2])[月./-](0?[1-9]|[12]\d|3[01])日?(?!\d)")
CONTACT_RE = re.compile(r"(?:1[3-9]\d{9}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|联系人|联系电话|联系邮箱|通讯地址)", re.I)
DETAIL_RE = re.compile(r"/(?:info/\d+/\d+|lecturenotice/\d+)(?:\.htm)?/?$", re.I)
OA_ID_RE = re.compile(r"^gotodetail\(['\"]([A-Za-z0-9]{4,30})['\"]\)$", re.I)
PRIVATE_RE = re.compile(r"名单|拟录取|拟聘|公示|录取结果|资格审查")
NEXT_RE = re.compile(r"下一页|下页|Next|›|»", re.I)
LABELS = ((re.compile(r"作品.{0,4}(?:提交|上传|截止)|提交.{0,4}截止"), "提交"),
          (re.compile(r"报名.{0,12}(?:截止|时间|日期|即日起至|至)|报名\s*[:：]|报名截止|截止.{0,5}报名"), "报名"),
          (re.compile(r"讲座时间|活动时间|举办时间|报告时间|论坛时间|会议时间|开始时间"), "活动"),
          (re.compile(r"申请.{0,4}截止|申报.{0,4}截止"), "申请"))


@dataclass(frozen=True)
class DiscoveredLink:
    url: str
    title: str
    published_on: date | None = None


@dataclass(frozen=True)
class ParsedNotice:
    excerpt: str
    published_on: date | None
    dates: list[dict[str, str]]
    category: str
    title: str = ""
    publication_evidence: str = ""
    content_hash: str = ""
    model_text: str = ""


@dataclass(frozen=True)
class Classification:
    category: str | None
    subtype: str | None
    competition_type: str | None = None
    stage: str | None = None


def classify(title: str, excerpt: str = "") -> Classification:
    """Conservative title-led labels; uncertain notices stay unclassified."""
    value = title + " " + excerpt[:160]
    if re.search(r"歌手|摄影|篮球|足球|羽毛球|文艺|体育|运动|书画|朗诵", title) and re.search(r"比赛|大赛|竞赛", title):
        return Classification("校园活动", "文艺体育")
    if re.search(r"竞赛|大赛|比赛|挑战杯|创新创业赛|建模赛|电赛", title):
        if re.search(r"数学建模", value):
            subtype, contest_type = "数学建模", "数学建模"
        elif re.search(r"人工智能|AI|编程|信息技术", value, re.I):
            subtype = "AI与编程"
            contest_type = "AI应用创新" if re.search(r"AI\s*\+\s*教育|AI应用|人工智能应用", value, re.I) else None
        elif re.search(r"机械|工程|设计|制造|节能减排|电赛", value):
            subtype, contest_type = "工程设计", "工程设计"
        elif re.search(r"创业|大创|腾飞杯|挑战杯", value):
            subtype, contest_type = "创新创业", "创新创业"
        elif re.search(r"获奖|成绩|结果", value):
            subtype, contest_type = "竞赛结果", None
        else:
            subtype, contest_type = None, None
        stage = ("结果" if re.search(r"获奖|成绩|结果|颁奖", title) else
                 "提交" if re.search(r"作品提交|材料提交", title) else
                 "报名" if re.search(r"报名|征集|通知|预通知", title) else None)
        return Classification("竞赛创新", subtype, contest_type, stage)
    for pattern, subtype in (
        (r"保研|推免|推荐免试|夏令营|预推免", "保研推免"),
        (r"考研|硕士研究生招生|研究生招考|复试|调剂", "考研招考"),
        (r"招生|招收(?:硕士|博士|研究生|本科生|直博生)|培养方案|选拔", "招生培养"),
        (r"课程|考试|选课|重修|教学教务", "课程考试"),
        (r"奖学金|助学金|奖助|助教", "奖助学金"),
        (r"海外|交换|留学|国际交流", "海外交流"),
    ):
        if re.search(pattern, title):
            return Classification("学业升学", subtype)
    for pattern, subtype in (
        (r"学术成果|研究成果|论文发表|科研成果", "学术成果"),
        (r"前沿|突破|最新研究|科学发现", "前沿研究"),
        (r"课题组|实验室招募|研究助理", "课题组招募"),
        (r"科研项目|基金申报|课题申报|项目申报", "科研项目申报"),
        (r"科研平台|研究中心|实验室", "科研平台"),
    ):
        if re.search(pattern, title):
            return Classification("科研学术", subtype)
    for pattern, subtype in (
        (r"工作坊|培训|技能讲座", "技能工作坊"),
        (r"研究生论坛", "研究生论坛"),
        (r"行业交流|企业交流", "行业交流"),
        (r"学术报告|学术论坛|研讨会", "学术报告"),
        (r"讲座|论坛|报告会", "知识讲座"),
    ):
        if re.search(pattern, title):
            return Classification("讲座交流", subtype)
    for pattern, subtype in (
        (r"志愿|志愿者", "志愿服务"),
        (r"实习|就业|招聘|宣讲会", "实习就业"),
        (r"社会实践|调研实践", "社会实践"),
        (r"学生会|学辅|社团招新|组织招募", "学生组织招募"),
    ):
        if re.search(pattern, title):
            return Classification("招募实践", subtype)
    for pattern, subtype in (
        (r"趣味|游园|桌游|运动会", "趣味活动"),
        (r"文艺|音乐会|体育|球赛|展演", "文艺体育"),
        (r"书院活动|书院文化|书院节", "书院活动"),
        (r"校园活动|校园生活|文化节", "校园生活"),
    ):
        if re.search(pattern, title):
            return Classification("校园活动", subtype)
    for pattern, subtype in (
        (r"教学事务|教务安排|教学检查", "教学事务"),
        (r"场地|停电|设施|服务调整", "场地服务"),
        (r"制度|管理办法|规定", "制度安排"),
        (r"校务通知|行政公告", "综合通知"),
    ):
        if re.search(pattern, title):
            return Classification("校务通知", subtype)
    return Classification(None, None)


def _date(value: str) -> date | None:
    found = DATE_RE.search(value)
    if not found:
        return None
    try:
        return date(*map(int, found.groups()))
    except ValueError:
        return None


def _same_host(url: str, base: str) -> bool:
    dest, origin = urlsplit(url), urlsplit(base)
    return dest.scheme == "https" and dest.hostname == origin.hostname and not dest.username and not dest.password and dest.port is None


def discover(html: str, base_url: str) -> tuple[list[DiscoveredLink], str | None]:
    soup = BeautifulSoup(html, "html.parser")
    links: list[DiscoveredLink] = []
    seen: set[str] = set()
    next_page = None
    for anchor in soup.select("a[href]"):
        title = " ".join(anchor.stripped_strings).strip()[:500]
        if urlsplit(base_url).hostname == "oa.xjtu.edu.cn" and anchor.has_attr("onclick"):
            match = OA_ID_RE.fullmatch(anchor["onclick"].strip())
            if match and anchor.has_attr("class") and "noa_list" in anchor["class"] and title and not PRIVATE_RE.search(title):
                url = "https://oa.xjtu.edu.cn/zxgg_infonew.jsp?processInsId=" + match.group(1)
                if url not in seen:
                    near = anchor.find_parent("tr")
                    nearby = near.get_text(" ", strip=True) if near else ""
                    links.append(DiscoveredLink(url, title, _date(nearby)))
                    seen.add(url)
            continue
        url = urljoin(base_url, anchor.get("href", "").strip()).split("#", 1)[0]
        if (urlsplit(base_url).hostname == "www.xjtu.edu.cn" and url.startswith("http://news.xjtu.edu.cn/info/")):
            url = "https://" + url.removeprefix("http://")
        if urlsplit(url).hostname != urlsplit(base_url).hostname:
            if not (urlsplit(base_url).hostname in {"www.xjtu.edu.cn", "news.xjtu.edu.cn"}
                    and urlsplit(url).hostname in {"news.xjtu.edu.cn", "oa.xjtu.edu.cn"}
                    and urlsplit(url).scheme == "https"):
                continue
            if urlsplit(url).hostname == "oa.xjtu.edu.cn":
                query = parse_qs(urlsplit(url).query)
                ids = query.get("processInsId", [])
                if urlsplit(url).path != "/zxgg_infonew.jsp" or len(ids) != 1 or not re.fullmatch(r"[A-Za-z0-9\[\]]{4,30}", ids[0]):
                    continue
                url = "https://oa.xjtu.edu.cn/zxgg_infonew.jsp?processInsId=" + quote(ids[0])
            elif not DETAIL_RE.search(urlsplit(url).path):
                continue
        if not (urlsplit(url).hostname != urlsplit(base_url).hostname or _same_host(url, base_url)):
            continue
        if NEXT_RE.fullmatch(title) or NEXT_RE.search(anchor.get("title", "")):
            if next_page is None and url != base_url:
                next_page = url
            continue
        if not title or re.fullmatch(r"[\d\s年/月日.\-]+", title) or PRIVATE_RE.search(title) or url in seen:
            continue
        path = urlsplit(url).path
        if DETAIL_RE.search(path) or (urlsplit(url).hostname == "oa.xjtu.edu.cn" and path == "/zxgg_infonew.jsp"):
            links.append(DiscoveredLink(url, title))
            seen.add(url)
    return links[:200], next_page


def category_for(title: str, *, lecture: bool = False) -> str:
    if lecture:
        return "讲座交流"
    return classify(title).category or ""


def parse_notice(html: str, title: str, *, lecture: bool = False) -> ParsedNotice:
    soup = BeautifulSoup(html, "html.parser")
    for selector in (".v_news_content", "#vsb_content", ".nos_d", ".advance-panel .article",
                     ".article-container .article", "article", "main", ".article-content"):
        content = soup.select_one(selector)
        if content is not None:
            break
    else:
        raise ValueError("未找到可识别的公告正文")
    for element in content.select("script,style,nav,footer,header,form"):
        element.decompose()
    text = content.get_text(" ", strip=True)
    if len(text) < 8 or re.search(r"登录后访问|请先登录|需要登录", text):
        raise ValueError("正文不可公开读取")
    published = None
    publication_evidence = ""
    for meta in soup.select("meta[name],meta[property]"):
        label = (meta.get("name") or meta.get("property") or "").lower()
        if any(key in label for key in ("publishdate", "pubdate", "published_time", "publish_date")):
            published = _date(meta.get("content", ""))
            if published:
                publication_evidence = meta.get("content", "")[:120]
                break
    if published is None:
        # These verified CMS templates put an explicit publication label
        # beside the title. Never infer it from dates in the body/footer.
        for selector in (".contt_tit", ".con-tit", ".arc-info", ".noa_f"):
            header = soup.select_one(selector)
            if header is None:
                continue
            match = re.search(r"(?:时间|日期|发布日期|发布时间)\s*[:：]?\s*(20\d{2}[年./-]\d{1,2}[月./-]\d{1,2}日?)|发布于\s*(20\d{2}[年./-]\d{1,2}[月./-]\d{1,2}日?)",
                              header.get_text(" ", strip=True))
            if match:
                published = _date(match.group(1) or match.group(2))
                publication_evidence = match.group(0)[:120]
                break
    date_items: list[dict[str, str]] = []
    seen_dates: set[tuple[str, str]] = set()
    # A row or paragraph is the evidence boundary. Do not let a date in one row
    # borrow the label in another, and never use the article publication date.
    segments = []
    for node in content.find_all(["tr", "p", "li", "div"], recursive=True):
        if node.name == "div" and node.find(["tr", "p", "li", "div"]):
            continue
        value = node.get_text(" ", strip=True)
        if value and len(value) <= 450:
            segments.append(value)
    if not segments and len(text) <= 450:
        segments = [text]
    for segment in [part.strip() for value in segments for part in re.split(r"[；;。，,]", value)]:
        if not segment or CONTACT_RE.search(segment):
            continue
        date_matches = list(DATE_RE.finditer(segment))
        if not date_matches:
            continue
        for index, match in enumerate(date_matches):
            day = _date(match.group())
            if not day:
                continue
            # Label must precede this date and be close. This also separates
            # "报名截止 ...；作品提交截止 ..." in one paragraph.
            prefix = segment[max(0, match.start()-35):match.start()]
            prior_labels = [(m.end(), kind) for pattern, kind in LABELS for m in pattern.finditer(prefix)]
            kind = max(prior_labels, default=(-1, ""))[1]
            if not kind and lecture and re.search(r"(?:讲座|活动)?时间\s*[:：]?\s*$", prefix):
                kind = "活动"
            if not kind:
                continue
            between_dates = (segment[match.end():date_matches[index + 1].start()]
                             if index < len(date_matches) - 1 else "")
            next_label = any(pattern.search(between_dates) for pattern, _ in LABELS)
            if (kind == "报名" and between_dates and re.search(r"至|到|[-~—–]", between_dates)
                    and not next_label):
                # A registration interval starts at the first date; the final
                # date is the relevant deadline for reminders.
                continue
            evidence = segment[max(0, match.start()-35):min(len(segment), match.end()+12)].strip()
            key = (kind, day.isoformat())
            if key not in seen_dates:
                date_items.append({"kind": kind, "day": day.isoformat(), "evidence": evidence[:100]})
                seen_dates.add(key)
    # Short, sanitized metadata only. Contact and name-list rows are discarded.
    excerpt_parts = []
    for piece in content.find_all(["tr", "p", "li", "div"], recursive=True):
        if piece.name == "div" and piece.find(["tr", "p", "li", "div"]):
            continue
        value = " ".join(piece.get_text(" ", strip=True).split())
        if value and not CONTACT_RE.search(value) and not PRIVATE_RE.search(value):
            excerpt_parts.append(value)
    full_safe_text = "\n".join(dict.fromkeys(excerpt_parts))
    safe_text = full_safe_text[:8000]
    excerpt = " · ".join(dict.fromkeys(excerpt_parts))[:280]
    title_nodes = (soup.select(".noa_title") + soup.select(".con-tit h1.ssd")
                   + soup.select(".con-tit h1, .con-tit h2, .con-tit h3") + soup.select("h1"))
    cleaned_title = next((node.get_text(" ", strip=True)[:500] for node in title_nodes
                          if node.get_text(" ", strip=True)), title)
    digest = hashlib.sha256((cleaned_title + "\n" + full_safe_text + "\n"
                             + (published.isoformat() if published else "") + "\n"
                             + repr([(part["kind"], part["day"]) for part in date_items])).encode()).hexdigest()
    return ParsedNotice(excerpt, published, date_items, category_for(cleaned_title, lecture=lecture),
                        cleaned_title, publication_evidence, digest, safe_text)


def is_active(dates: list[dict[str, str]], published_on: date | None, today: date) -> bool:
    if dates:
        return any(item["day"] >= today.isoformat() for item in dates)
    return True


def is_recent_enough_to_alert(dates: list[dict[str, str]], published_on: date | None, today: date) -> bool:
    if dates:
        return is_active(dates, published_on, today)
    return bool(published_on and published_on >= today.fromordinal(today.toordinal()-7))
