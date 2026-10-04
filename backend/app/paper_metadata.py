from __future__ import annotations

import asyncio
import re
import unicodedata
from dataclasses import dataclass, replace
from typing import Mapping

import httpx

from app.config import get_settings
from app.paper_identity import normalize_doi
from app.paper_sources.base import SourceRequestError
from app.paper_sources.crossref import CrossrefSource


_DOI_PATTERN = re.compile(r"\b10\.\d{4,9}/[^\s<>\"']+", re.IGNORECASE)
_PUBLICATION_YEAR_PATTERN = re.compile(
    r"(?:date\s+of\s+publication|published(?:\s+online)?|publication\s+date|copyright|©)"
    r"[^\n]{0,80}?\b((?:19|20)\d{2})\b",
    re.IGNORECASE,
)
_CITATION_DOI_YEAR_PATTERN = re.compile(
    r"citation\s+information[^\n]{0,200}?doi\s+10\.\d{4,9}/[^\s]*?((?:19|20)\d{2})",
    re.IGNORECASE,
)
_PAGE_YEAR_PATTERNS = (
    re.compile(r"\|\s*\(((?:19|20)\d{2})\)"),
    re.compile(r"\|\s*Volume\b[^\n]{0,60}?\b((?:19|20)\d{2})\b", re.IGNORECASE),
)
_SUBJECT_YEAR_PATTERNS = (
    re.compile(r"^[^,\n]{3,120}?\s*\(((?:19|20)\d{2})\)\s*,"),
    re.compile(r"^[A-Z][A-Za-z&.\-\s]{2,100}?\s+((?:19|20)\d{2})[.,]\d+"),
)
_KEYWORDS_HEADING_PATTERN = re.compile(
    r"(?im)^(?:index\s+terms|key\s*words|keywords)\s*[:—\-]?\s*",
)
_SECTION_HEADING_PATTERN = re.compile(
    r"^(?:(?:\d+(?:\.\d+)*|[IVXLCDM]+)\.?\s*)?"
    r"(?:abstract|introduction|background|materials?\s+and\s+methods?|methods?|experimental(?:\s+section)?|"
    r"results?(?:\s+and\s+discussion)?|discussion|conclusions?|references)\b",
    re.IGNORECASE,
)
_KEYWORD_TRANSLATIONS = {
    "electricity markets": "电力市场",
    "power system flexibility": "电力系统灵活性",
    "flexibility": "灵活性",
    "flexibility resources": "灵活性资源",
    "variable energy resources": "可变能源资源",
    "energy storage": "储能",
    "sodium-ion battery": "钠离子电池",
    "sodium-ion batteries": "钠离子电池",
    "na-ion cathode": "钠离子电池正极",
    "structural transition": "结构转变",
    "rietveld refinement": "Rietveld 精修",
    "layered oxides": "层状氧化物",
    "electrochemical impedance spectroscopy": "电化学阻抗谱",
    "interfacial impedance": "界面阻抗",
    "equivalent circuit modeling": "等效电路建模",
}
_EXPLICIT_JOURNAL_PATTERNS = (
    re.compile(r"(?:to\s+appear\s+in|journal)\s*:\s*\n\s*([^\n]{3,120})", re.IGNORECASE),
    re.compile(
        r"accepted\s+for\s+publication\s+in\s+([A-Z][^\n.]{2,100})",
        re.IGNORECASE,
    ),
    re.compile(r"(?:journal|published\s+in)\s*:\s*([^\n]{3,120})", re.IGNORECASE),
)
_CITATION_LINE_PATTERN = re.compile(
    r"^([A-Z][A-Za-z&.\-\s]{2,80}?)\s+(?:19|20)\d{2}\s*,",
    re.MULTILINE,
)
_PAGE_JOURNAL_PATTERNS = (
    re.compile(r"^(?:[^\n]{1,80}?\bet\s+al\.\s+)([A-Z][A-Za-z&.:\- ]{2,110}?)\s+\((?:19|20)\d{2}\)\s*\d+:\d+", re.MULTILINE),
    re.compile(r"^([A-Z][A-Za-z&.:\- ]{2,110}?)\s*(?:,\s*)?(?:\d+\s*)?\((?:19|20)\d{2}\)\s*\d*(?:[: ,]|$)", re.MULTILINE),
    re.compile(
        r"^([A-Z][A-Za-z&.\-\s]{2,100}?)\s*\|\s*(?:\((?:19|20)\d{2}\)|Volume\b)",
        re.MULTILINE,
    ),
    re.compile(
        r"^Cite\s+this:\s*([A-Z][A-Za-z&.\-\s]{2,100}?),\s*(?:19|20)\d{2}\s*,",
        re.IGNORECASE | re.MULTILINE,
    ),
)
_SUBJECT_JOURNAL_PATTERNS = (
    re.compile(r"^\s*([^,\n]{3,120}?),\s*\d+\s*\((?:19|20)\d{2}\)"),
    re.compile(r"^\s*([^,\n]{3,120}?)\s*,\s*doi\s*:", re.IGNORECASE),
    re.compile(r"^\s*([A-Z][A-Za-z&.\-\s]{2,100}?)\s*\((?:19|20)\d{2}\)\s*,"),
    re.compile(r"^\s*([A-Z][A-Za-z&.\-\s]{2,100}?)\s+(?:19|20)\d{2}[.,]\d+"),
)
_CONTROLLED_TOPICS = (
    (re.compile(r"sodium[-\s]?ion\s+batter(?:y|ies)|钠离子电池", re.IGNORECASE), "钠离子电池"),
    (re.compile(r"lithium[-\s]?ion\s+batter(?:y|ies)|锂离子电池", re.IGNORECASE), "锂离子电池"),
    (re.compile(r"solid[-\s]?state\s+batter(?:y|ies)|固态电池", re.IGNORECASE), "固态电池"),
    (re.compile(r"energy\s+storage|储能", re.IGNORECASE), "储能"),
    (re.compile(r"layered\s+oxide|层状氧化物", re.IGNORECASE), "层状氧化物"),
    (re.compile(r"cathode(?:\s+material)?|正极材料", re.IGNORECASE), "正极材料"),
    (re.compile(r"power\s+system\s+flexibility|电力系统灵活性", re.IGNORECASE), "电力系统灵活性"),
)
# Specific phrases are matched against title/abstract before the front matter.
# These are transparent local rules, not a model-generated summary.
_SPECIFIC_TOPICS = tuple((re.compile(pattern, re.IGNORECASE), label) for pattern, label in (
    (r"(?:nickel\s+hydroxide|Ni\(OH\)[2₂])\s+slurr(?:y|ies)|氢氧化镍浆料", "氢氧化镍浆料"),
    (r"(?:CO[2₂]|carbon\s+dioxide)\s+(?:capture|capturing)|二氧化碳捕集", "CO2捕集"),
    (r"carbonation|碳酸化", "碳酸化反应"),
    (r"(?:redox\s+)?flow\s+batter(?:y|ies)|液流电池", "液流电池"),
    (r"vanadium\s+(?:redox\s+)?flow|全钒液流", "全钒液流电池"),
    (r"semi[-\s]?solid\s+(?:flow\s+)?batter(?:y|ies)|半固态(?:液流)?电池", "半固态液流电池"),
    (r"slurry\s+(?:electrode|battery|batteries)|浆料电极", "浆料电极"),
    (r"aqueous\s+(?:zinc|Zn)[-\s]?(?:ion\s+)?batter(?:y|ies)|水系锌", "水系锌离子电池"),
    (r"sodium[-\s]?ion\s+cathode|钠离子电池正极", "钠离子电池正极"),
    (r"(?:P[23][-/\s])?(?:layered\s+oxide)\s+cathode|层状氧化物正极", "层状氧化物正极"),
    (r"slab\s+gliding|层板滑移", "层板滑移"),
    (r"lattice\s+contraction|晶格收缩", "晶格收缩"),
    (r"(?:structural|phase)\s+transition|相变|结构转变", "结构相变"),
    (r"cation\s+(?:disorder|ordering)|阳离子(?:无序|有序)", "阳离子有序与无序"),
    (r"oxygen\s+redox|氧氧化还原", "氧氧化还原"),
    (r"solid[-\s]electrolyte\s+interphase|固态电解质界面", "固态电解质界面"),
    (r"electrochemical\s+impedance\s+spectroscopy|电化学阻抗谱", "电化学阻抗谱"),
    (r"equivalent\s+circuit\s+model(?:ing)?|等效电路", "等效电路建模"),
    (r"density\s+functional\s+theory|密度泛函理论", "密度泛函理论"),
    (r"computational\s+fluid\s+dynamics|计算流体力学", "计算流体力学"),
    (r"virtual\s+power\s+plants?|虚拟电厂", "虚拟电厂"),
    (r"mixed[-\s]integer\s+linear\s+programming|混合整数线性规划", "混合整数线性规划"),
    (r"(?:optimal|economic|day[-\s]ahead)\s+(?:scheduling|dispatch)|优化调度|经济调度", "优化调度"),
    (r"demand\s+response|需求响应", "需求响应"),
    (r"frequency\s+regulation|调频", "储能调频"),
    (r"life[-\s]cycle\s+assessment|生命周期评价", "生命周期评价"),
    (r"techno[-\s]economic\s+(?:analysis|assessment)|技术经济(?:分析|评价)", "技术经济分析"),
    (r"battery\s+(?:recycling|recovery)|电池回收", "电池回收"),
))


@dataclass(frozen=True)
class LocalPaperMetadata:
    title: str = ""
    doi: str | None = None
    journal: str = ""
    published_date: str | None = None
    keywords: tuple[str, ...] = ()
    keywords_are_explicit: bool = False
    article_type: str = ""


def extract_local_paper_metadata(
    *,
    filename: str,
    text: str,
    document_metadata: Mapping[str, object] | None = None,
) -> LocalPaperMetadata:
    sample = re.split(r"(?im)^\s*(?:\d+\.?\s*)?(?:references|bibliography|参考文献)\s*$", text, maxsplit=1)[0][:12000]
    metadata = document_metadata or {}
    front = str(metadata.get("first_page_text", sample))
    front = re.split(r"(?im)^\s*(?:\d+\.?\s*)?references\s*$", front, maxsplit=1)[0]
    journal = _extract_journal(front, metadata)
    title = _extract_title(metadata, journal)
    explicit_keywords = _extract_keywords(sample, metadata)
    metadata_keywords = metadata.get("keywords")
    keywords_are_explicit = bool(
        _KEYWORDS_HEADING_PATTERN.search(sample)
        or (isinstance(metadata_keywords, str) and metadata_keywords.strip())
    )
    return LocalPaperMetadata(
        title=title,
        doi=_extract_doi(front) or _extract_doi(str(metadata.get("subject", ""))),
        journal=journal,
        published_date=_extract_year(sample, document_metadata or {}),
        keywords=_ranked_keywords(explicit_keywords, title, sample),
        keywords_are_explicit=keywords_are_explicit,
        article_type=_extract_article_type(filename, sample, title),
    )


def pdf_bibliography_metadata(document: object) -> dict[str, object]:
    """Capture only first-page layout while the caller already has the PDF open."""
    metadata = dict(document.metadata or {})
    if len(document):
        page = document[0]
        metadata["first_page_text"] = page.get_text("text")
        metadata["first_page_layout"] = page.get_text("dict", flags=0)
    return metadata


def _clean_title(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).split()).strip()


def _valid_title(value: str, journal: str = "") -> bool:
    chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", value))
    if not value or (len(value) < 12 and chinese_chars < 6) or value.casefold() == journal.casefold():
        return False
    if re.search(r"[\ufffd\x00-\x1f]|(?:microsoft\s+word|untitled|document\s*\d*|powerpoint|acrobat)|(?:https?://|www\.|[A-Z]:\\)|\.pdf$", value, re.I):
        return False
    if _SECTION_HEADING_PATTERN.match(value) or re.match(r"^(?:keywords?|index terms|cite this|citation information|journal pre-proof|contents available)\b", value, re.I) or re.match(r"^(?:article|review|research article|accepted manuscript|contents)\s*$", value, re.I):
        return False
    if re.match(r"^(?:journal of|nature(?:\s+(?:energy|communications|materials|chemistry|reviews chemistry))?$|chemical society reviews$|advanced energy materials$|science direct$)", value, re.I):
        return False
    return len(value.split()) >= 3 or chinese_chars >= 6


def _extract_title(metadata: Mapping[str, object], journal: str) -> str:
    raw = metadata.get("title")
    title = _clean_title(raw) if isinstance(raw, str) else ""
    if _valid_title(title, journal):
        return title
    layout = metadata.get("first_page_layout")
    if not isinstance(layout, dict):
        return ""
    lines: list[tuple[float, float, float, float, str]] = []
    for block in layout.get("blocks", []):
        for line in block.get("lines", []):
            spans = [span for span in line.get("spans", []) if str(span.get("text", "")).strip()]
            if not spans:
                continue
            size = max(span.get("size", 0) for span in spans)
            text = _clean_title("".join(span["text"] for span in spans if span.get("size", 0) >= size * .85))
            bbox = line.get("bbox", (0, 0, 0, 0))
            lines.append((bbox[1], bbox[3], bbox[0], size, text))
    lines.sort(key=lambda line: (line[0], line[2]))
    abstract_y = min((line[0] for line in lines if re.match(r"^abstract\b|^摘要", line[4], re.I)), default=float(layout.get("height", 842)) * .7)
    candidates: list[tuple[float, str]] = []
    for index, line in enumerate(lines):
        y, bottom, x, size, text = line
        if y >= abstract_y or size < 11 or not _valid_title(text, journal):
            continue
        if re.search(r"doi|@|\b(?:university|department|institute|received|accepted|published|copyright|pre-proof)\b", text, re.I) or text.count(",") > 1:
            continue
        if "," in text and all(re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$", name.strip()) for name in text.split(",")):
            continue
        joined = [text]
        last_bottom = bottom
        for next_line in lines[index + 1:]:
            ny, nb, nx, ns, nt = next_line
            if ny - last_bottom > size * 1.4 or ny >= abstract_y or abs(ns - size) > size * .1 or abs(nx - x) > 150:
                break
            if not nt or nt.casefold() == journal.casefold() or re.search(r"doi|@|\b(?:abstract|university|department|received|accepted|published|copyright|keywords?|index terms|citation information)\b", nt, re.I):
                break
            joined.append(nt)
            last_bottom = nb
        candidate = _clean_title(" ".join(joined))
        candidates.append((size + min(len(candidate), 200) / 100, candidate))
    return max(candidates, default=(0, ""), key=lambda item: item[0])[1]


async def complete_public_bibliography(metadata: LocalPaperMetadata, *, source: object | None = None, need_title: bool = True, need_journal: bool = True) -> LocalPaperMetadata:
    """Fill missing title/journal by exact DOI; no model or fuzzy title search."""
    if not metadata.doi or not ((need_title and not metadata.title) or (need_journal and not metadata.journal)):
        return metadata
    settings = get_settings()
    if source is None and not settings.crossref_enabled:
        return metadata
    try:
        if source is None:
            async with httpx.AsyncClient() as client:
                adapter = CrossrefSource(client, settings.crossref_base_url, timeout=min(settings.paper_source_timeout_seconds, 8), mailto=settings.crossref_mailto)
                publication = await asyncio.wait_for(adapter.get_by_id(metadata.doi), timeout=8)
        else:
            publication = await asyncio.wait_for(source.get_by_id(metadata.doi), timeout=8)
    except (SourceRequestError, httpx.HTTPError, TimeoutError, ValueError):
        return metadata
    if normalize_doi(publication.doi) != normalize_doi(metadata.doi):
        return metadata
    title = _clean_title(publication.title)
    journal = _clean_journal(publication.journal)
    return replace(metadata, title=metadata.title or (title if need_title and _valid_title(title, journal) else ""), journal=metadata.journal or (journal if need_journal else ""))


def replaceable_paper_title(title: str, filename: str, candidate: str = "") -> bool:
    """Keep custom/imported titles; repair file names or an evidenced prefix."""
    current = _clean_title(title)
    stem = _clean_title(filename.rsplit(".", 1)[0]) if filename else ""
    if not current or (stem and current.casefold() == stem.casefold()):
        return True
    current_prefix = current.rstrip(" .…")
    return bool(candidate and len(current_prefix) >= 30 and _clean_title(candidate).casefold().startswith(current_prefix.casefold()) and len(candidate) > len(current) + 8)


def _extract_doi(text: str) -> str | None:
    for match in _DOI_PATTERN.finditer(text):
        candidate = match.group(0).rstrip(".,;:)]}").lower()
        suffix = candidate.split("/", 1)[-1]
        if re.search(r"(?:^|[._-])(?:doi|xxxx)$", suffix, re.IGNORECASE):
            continue
        return candidate
    return None


def _extract_year(text: str, document_metadata: Mapping[str, object]) -> str | None:
    match = _PUBLICATION_YEAR_PATTERN.search(text)
    if match is not None:
        return match.group(1)
    for pattern in _PAGE_YEAR_PATTERNS:
        match = pattern.search(text)
        if match is not None:
            return match.group(1)
    citation_match = _CITATION_DOI_YEAR_PATTERN.search(text)
    if citation_match is not None:
        return citation_match.group(1)
    subject = document_metadata.get("subject")
    if isinstance(subject, str):
        for pattern in _SUBJECT_YEAR_PATTERNS:
            match = pattern.search(subject)
            if match is not None:
                return match.group(1)
    return None


def _extract_keywords(
    text: str,
    document_metadata: Mapping[str, object],
) -> tuple[str, ...]:
    match = _KEYWORDS_HEADING_PATTERN.search(text)
    raw = "" if match is None else _keyword_block(text[match.end():])
    if not raw:
        metadata_keywords = document_metadata.get("keywords")
        raw = metadata_keywords if isinstance(metadata_keywords, str) else ""
    values: list[str] = []
    for part in re.split(r"[,;；，]", raw):
        value = re.sub(r"\s+", " ", part).strip(" .:—-")
        translated = _KEYWORD_TRANSLATIONS.get(value.casefold(), value)
        if translated and len(translated) <= 80 and translated.casefold() not in {item.casefold() for item in values}:
            values.append(translated)
        if len(values) == 8:
            break
    return tuple(values)


def _keyword_block(text_after_heading: str) -> str:
    lines: list[str] = []
    for line in text_after_heading.splitlines()[:5]:
        stripped = line.strip()
        if not stripped or _SECTION_HEADING_PATTERN.match(stripped):
            break
        lines.append(stripped)
        if stripped.endswith("."):
            break
    return " ".join(lines)


def _extract_journal(text: str, document_metadata: Mapping[str, object]) -> str:
    homepage = re.search(r"(?im)^([^\n]{3,120})\n\s*journal\s+homepage\s*:", text)
    if homepage is not None:
        return _clean_journal(homepage.group(1))
    for pattern in _EXPLICIT_JOURNAL_PATTERNS:
        match = pattern.search(text)
        if match is not None:
            return _clean_journal(match.group(1))
    for pattern in _PAGE_JOURNAL_PATTERNS:
        match = pattern.search(text)
        if match is not None:
            return _clean_journal(match.group(1))
    match = _CITATION_LINE_PATTERN.search(text)
    if match is not None:
        return _clean_journal(match.group(1))
    subject = document_metadata.get("subject")
    if isinstance(subject, str):
        match = re.search(r"(?:journal|published\s+in)\s*:\s*([^;\n]{3,120})", subject, re.IGNORECASE)
        if match is not None:
            return _clean_journal(match.group(1))
        for pattern in _SUBJECT_JOURNAL_PATTERNS:
            match = pattern.search(subject)
            if match is not None:
                return _clean_journal(match.group(1))
    return ""


def _clean_journal(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip(" .,:;—-")
    return re.sub(r"^(?:research\s+article|review\s+article|article)\s+", "", cleaned, flags=re.IGNORECASE)


def _controlled_topics(text: str) -> tuple[str, ...]:
    topics = [label for pattern, label in _CONTROLLED_TOPICS if pattern.search(text)]
    return tuple(topics[:3])


def _ranked_keywords(explicit: tuple[str, ...], title: str, text: str) -> tuple[str, ...]:
    values = list(explicit)
    if len(values) >= 4:
        return explicit
    abstract = re.split(r"(?im)^\s*(?:abstract|摘要)\s*[:：]?", text, maxsplit=1)
    abstract_text = re.split(r"(?im)^\s*(?:keywords?|index\s+terms|(?:1[.\s]+)?introduction|关键词)\b", abstract[-1], maxsplit=1)[0][:3000] if len(abstract) > 1 else ""
    title_text = title or text.split("\n", 1)[0]
    ranked = []
    for pattern, label in _SPECIFIC_TOPICS:
        score = 100 * bool(pattern.search(title_text)) + 40 * bool(pattern.search(abstract_text)) + min(len(pattern.findall(text)), 5)
        if score:
            ranked.append((score, label))
    for _, label in sorted(ranked, key=lambda item: -item[0]):
        if label.casefold() not in {item.casefold() for item in values}:
            values.append(label)
        if len(values) >= 6:
            break
    if not explicit:
        for label in _controlled_topics(text):
            if label not in values and len(values) < 6:
                values.append(label)
    return tuple(values)


def _extract_article_type(filename: str, text: str, title: str = "") -> str:
    abstract = re.split(r"(?im)^\s*(?:abstract|摘要)\s*[:：]?", text, maxsplit=1)
    header = abstract[0] if len(abstract) > 1 else text[:1500]
    headline = title or header.split("\n", 1)[0]
    if re.search(r"(?im)^\s*(?:review(?:\s+article)?|综述|perspective|观点|tutorial|教程|short\s+communication|technical\s+note)\s*$", header):
        marker = re.search(r"(?im)^\s*(review(?:\s+article)?|综述|perspective|观点|tutorial|教程|short\s+communication|technical\s+note)\s*$", header).group(1).casefold()
        return {"perspective": "观点", "观点": "观点", "tutorial": "教程", "教程": "教程", "short communication": "短篇研究", "technical note": "技术说明"}.get(marker, "综述")
    if re.search(r"\b(?:review\s+of|(?:comprehensive|critical|systematic|literature)\s+review)\b|:\s*(?:a\s+)?review\b|综述", headline, re.IGNORECASE):
        return "综述"
    method_sample = (title + "\n" + text)[:9000]
    optimization = bool(re.search(r"mixed[-\s]integer\s+(?:linear\s+)?programming|(?:optimal|economic|day[-\s]ahead)\s+(?:scheduling|dispatch)|stochastic\s+optimization|优化调度|混合整数规划", method_sample, re.I))
    experiment = bool(re.search(r"experimental\s+(?:study|research|investigation)|we\s+(?:synthesized|fabricated|prepared|measured)|(?:electrochemical|cycling)\s+(?:tests?|measurements?)|实验研究|制备并|实测", method_sample, re.I))
    computation = bool(re.search(r"density\s+functional\s+theory|first[-\s]principles\s+calculations?|molecular\s+dynamics|密度泛函|第一性原理", method_sample, re.I))
    simulation = bool(re.search(r"numerical\s+(?:simulation|model)|computational\s+fluid\s+dynamics|finite[-\s]element\s+(?:analysis|simulation)|数值仿真|有限元", method_sample, re.I))
    if optimization:
        return "建模与优化研究"
    if experiment and (computation or simulation):
        return "实验与计算研究"
    if experiment:
        return "实验研究"
    if computation:
        return "理论与计算研究"
    if simulation:
        return "数值仿真研究"
    if re.search(r"techno[-\s]economic\s+(?:analysis|assessment)|life[-\s]cycle\s+assessment|技术经济分析|生命周期评价", method_sample, re.I):
        return "评价研究"
    sample = f"{filename}\n{text}"
    if re.search(r"\b(?:research|original)\s+article\b|\boriginal\s+research\b", sample, re.IGNORECASE):
        return "研究论文"
    if re.search(r"(?im)^\s*article\s*$", text[:12000]):
        return "研究论文"
    if re.search(r"\barxiv\s*:\s*\d{4}\.\d{4,5}\b", sample, re.IGNORECASE) and not _DOI_PATTERN.search(sample):
        return "预印本"
    section_patterns = (
        r"abstract",
        r"introduction",
        r"(?:materials?\s+and\s+methods?|methods?|experimental(?:\s+section)?)",
        r"(?:results?(?:\s+and\s+discussion)?|discussion)",
        r"conclusions?",
    )
    section_count = sum(
        bool(re.search(
            rf"(?im)^\s*(?:\d+(?:\.\d+)*\.?\s*)?{pattern}\s*$",
            text,
        ))
        for pattern in section_patterns
    )
    if section_count >= 3:
        return "研究论文"
    return ""
