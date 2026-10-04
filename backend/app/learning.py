from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import date, timedelta

from .paper_analysis import AnalysisReportType, is_usable_report_version


CARDS_PROMPT_VERSION = "learning-cards-v1"
CARDS_SCHEMA_VERSION = "learning-cards-schema-v1"
QUIZ_PROMPT_VERSION = "learning-quiz-v1"
QUIZ_SCHEMA_VERSION = "learning-quiz-schema-v1"
QUIZ_V2_PROMPT_VERSION = "learning-quiz-v2"
QUIZ_V2_SCHEMA_VERSION = "learning-quiz-schema-v2"
FEEDBACK_PROMPT_VERSION = "learning-short-feedback-v1"
REPORT_PRIORITY = (
    AnalysisReportType.reviewer_analysis,
    AnalysisReportType.layman_understanding,
    AnalysisReportType.quick_understanding,
)


@dataclass(frozen=True)
class LearningEvidence:
    evidence_id: str
    paper_id: int
    paper_title: str
    page_number: int | None
    section: str
    excerpt: str
    source_scope: str


@dataclass(frozen=True)
class LearningCardDraft:
    concept: str
    content: str
    importance: str
    common_mistake: str
    evidence_ids: list[str]


@dataclass(frozen=True)
class LearningCardsResult:
    cards: list[LearningCardDraft]
    model_name: str


@dataclass(frozen=True)
class LearningQuestionDraft:
    question_type: str
    prompt: str
    options: list[str]
    correct_answer: str
    explanation: str
    reference_points: list[str]
    related_card_positions: list[int]
    evidence_ids: list[str]
    accepted_answers: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class LearningQuizResult:
    questions: list[LearningQuestionDraft]
    model_name: str


@dataclass(frozen=True)
class LearningFeedbackResult:
    feedback_markdown: str
    model_name: str
    evidence_status: str


def current_reports(analysis: object) -> list[str]:
    available: list[str] = []
    for report_type in REPORT_PRIORITY:
        prefix = {
            AnalysisReportType.quick_understanding: "quick",
            AnalysisReportType.layman_understanding: "layman",
            AnalysisReportType.reviewer_analysis: "reviewer",
        }[report_type]
        if (
            str(getattr(analysis, report_type.value, "") or "").strip()
            and is_usable_report_version(
                report_type,
                getattr(analysis, f"{prefix}_prompt_version", ""),
                getattr(analysis, f"{prefix}_schema_version", ""),
            )
        ):
            available.append(report_type.value)
    return available


def report_versions(analysis: object, available: list[str]) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for value in available:
        report_type = AnalysisReportType(value)
        prefix = value.split("_", 1)[0]
        result[value] = {
            "prompt_version": str(getattr(analysis, f"{prefix}_prompt_version")),
            "schema_version": str(getattr(analysis, f"{prefix}_schema_version")),
            "evidence_status": str(getattr(analysis, f"{prefix}_evidence_status")),
        }
    return result


def analysis_snapshot_hash(analysis: object, available: list[str]) -> str:
    material = "\n".join(
        f"{value}:{getattr(analysis, value, '')}" for value in available
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def build_cards_prompt(title: str, goal: str, reports: str, evidence: list[LearningEvidence]) -> str:
    evidence_text = "\n\n".join(
        f"[{item.evidence_id}] 论文：{item.paper_title}；页码：{item.page_number if item.page_number else '无法确认'}；"
        f"章节：{item.section or '无法确认'}；原文：{item.excerpt}"
        for item in evidence
    )
    return (
        "你是储能科研导师。为学习包生成 8–16 张相互补充、具有证据深度的中文知识卡片。"
        "每张卡片必须讲清概念、论文中的作用、因果或机制边界、易错点；不能只做名词解释。"
        "只允许引用输入中存在的证据编号，不得自行生成论文名、页码、章节、图号或引文。"
        "返回单个 JSON 对象，只有 cards 数组；每项只有 concept、content、importance、"
        "common_mistake、evidence_ids。evidence_ids 必须是字符串数组。不要输出 Markdown 代码围栏。"
        f"\n版本：{CARDS_PROMPT_VERSION}/{CARDS_SCHEMA_VERSION}"
        f"\n学习包：{title}\n学习目标：{goal or '建立完整论文理解'}"
        f"\n\n现有独立解析（按审稿人、通俗、快速优先）：\n{reports}"
        f"\n\n可核验全文证据：\n{evidence_text}"
    )


def build_quiz_prompt(title: str, cards: list[dict[str, object]]) -> str:
    material = json.dumps(cards, ensure_ascii=False)
    return (
        "你是严谨的储能课程命题教师。仅依据已保存知识卡片生成自测：6–10 道四选一选择题，"
        "4–6 道简答题。题目应覆盖理解、证据边界和机制辨析，避免纯记忆重复。"
        "返回单个 JSON 对象，只有 questions 数组。每项只有 question_type（multiple_choice 或 short_answer）、"
        "prompt、options、correct_answer、explanation、reference_points、related_card_positions、evidence_ids。"
        "选择题 options 必须正好四项且 correct_answer 为 A/B/C/D；简答题 options 为空数组。"
        "related_card_positions 使用卡片 position，证据编号只能复用卡片中已有编号。不要输出代码围栏。"
        f"\n版本：{QUIZ_PROMPT_VERSION}/{QUIZ_SCHEMA_VERSION}\n学习包：{title}\n卡片：{material}"
    )


def build_quiz_prompt_v2(title: str, cards: list[dict[str, object]]) -> str:
    material = json.dumps(cards, ensure_ascii=False)
    return (
        "你是严谨的储能课程命题教师。仅依据已保存知识卡片生成自测：4–6 道四选一选择题，"
        "2–3 道判断题，2–3 道填空题，3–4 道简答题。题目覆盖理解、证据边界和机制辨析。"
        "返回单个 JSON 对象，只有 questions 数组。每项只有 question_type、prompt、options、"
        "correct_answer、accepted_answers、explanation、reference_points、related_card_positions、evidence_ids。"
        "question_type 只能是 multiple_choice、true_false、fill_blank、short_answer。"
        "选择题必须四个选项且答案为 A/B/C/D；判断题答案只能为正确或错误；"
        "填空题 accepted_answers 必须给出 1–5 个可接受答案；简答题不提供标准答案。"
        "关联卡片使用 position，证据编号只能复用卡片已有编号。不要输出代码围栏。"
        f"\n版本：{QUIZ_V2_PROMPT_VERSION}/{QUIZ_V2_SCHEMA_VERSION}\n学习包：{title}\n卡片：{material}"
    )


def build_feedback_prompt(
    question: str,
    answer: str,
    reference_points: list[str],
    evidence: list[dict[str, object]],
) -> str:
    material = json.dumps(
        {
            "question": question,
            "answer": answer,
            "reference_points": reference_points,
            "evidence_snapshot": evidence,
        },
        ensure_ascii=False,
    )
    return (
        "你是储能科研学习导师。仅依据题目、用户答案、参考要点和已保存证据快照，"
        "给出具体、克制、可执行的中文反馈。不得补充论文全文、外部事实、伪造页码或证据。"
        "返回单个 JSON 对象，只有 feedback_markdown 和 evidence_status；"
        "evidence_status 固定写“基于学习包证据快照”。不要输出代码围栏。"
        f"\n版本：{FEEDBACK_PROMPT_VERSION}\n输入：{material}"
    )


def _object(content: str) -> dict[str, object]:
    text = content.strip()
    if text.startswith("```"):
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    value = json.loads(text)
    if not isinstance(value, dict):
        raise ValueError("模型返回不是 JSON 对象")
    return value


def parse_cards_result(content: str, model_name: str, valid_evidence_ids: set[str]) -> LearningCardsResult:
    raw = _object(content).get("cards")
    if not isinstance(raw, list) or not 8 <= len(raw) <= 16:
        raise ValueError("知识卡片数量必须为 8–16")
    cards: list[LearningCardDraft] = []
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("卡片结构无效")
        strings = [item.get(name) for name in ("concept", "content", "importance", "common_mistake")]
        evidence_ids = item.get("evidence_ids")
        if not all(isinstance(value, str) and value.strip() for value in strings):
            raise ValueError("卡片文本字段缺失")
        if not isinstance(evidence_ids, list) or not evidence_ids or any(value not in valid_evidence_ids for value in evidence_ids):
            raise ValueError("卡片使用了无效证据编号")
        cards.append(LearningCardDraft(*(value.strip() for value in strings), list(dict.fromkeys(evidence_ids))))
    return LearningCardsResult(cards, model_name)


def parse_quiz_result(
    content: str,
    model_name: str,
    valid_positions: set[int],
    valid_evidence_ids: set[str],
    schema_version: str = QUIZ_SCHEMA_VERSION,
) -> LearningQuizResult:
    raw = _object(content).get("questions")
    if not isinstance(raw, list):
        raise ValueError("题目结构无效")
    questions: list[LearningQuestionDraft] = []
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("题目结构无效")
        question_type = item.get("question_type")
        prompt = item.get("prompt")
        options = item.get("options")
        correct_answer = item.get("correct_answer")
        explanation = item.get("explanation")
        points = item.get("reference_points")
        positions = item.get("related_card_positions")
        evidence_ids = item.get("evidence_ids")
        accepted_answers = item.get("accepted_answers", [])
        allowed_types = (
            {"multiple_choice", "true_false", "fill_blank", "short_answer"}
            if schema_version == QUIZ_V2_SCHEMA_VERSION
            else {"multiple_choice", "short_answer"}
        )
        if question_type not in allowed_types or not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("题目类型或题干无效")
        if not isinstance(options, list) or any(not isinstance(value, str) for value in options):
            raise ValueError("选项结构无效")
        if question_type == "multiple_choice" and (len(options) != 4 or correct_answer not in {"A", "B", "C", "D"}):
            raise ValueError("选择题必须含四个选项和 A-D 答案")
        if question_type != "multiple_choice" and options:
            raise ValueError("非选择题不能包含选项")
        if question_type == "true_false" and correct_answer not in {"正确", "错误"}:
            raise ValueError("判断题答案必须为正确或错误")
        if question_type == "fill_blank":
            if (
                not isinstance(accepted_answers, list)
                or not 1 <= len(accepted_answers) <= 5
                or any(not isinstance(value, str) or not value.strip() for value in accepted_answers)
            ):
                raise ValueError("填空题必须包含 1–5 个可接受答案")
            correct_answer = accepted_answers[0]
        elif accepted_answers:
            raise ValueError("只有填空题可以包含可接受答案")
        if not isinstance(correct_answer, str) or not isinstance(explanation, str) or not isinstance(points, list):
            raise ValueError("答案结构无效")
        if not isinstance(positions, list) or not positions or any(value not in valid_positions for value in positions):
            raise ValueError("题目关联了无效卡片")
        if not isinstance(evidence_ids, list) or any(value not in valid_evidence_ids for value in evidence_ids):
            raise ValueError("题目关联了无效证据")
        questions.append(LearningQuestionDraft(question_type, prompt.strip(), options, correct_answer, explanation, points, positions, evidence_ids, accepted_answers))
    counts = {
        kind: sum(question.question_type == kind for question in questions)
        for kind in ("multiple_choice", "true_false", "fill_blank", "short_answer")
    }
    if schema_version == QUIZ_V2_SCHEMA_VERSION:
        valid_counts = (
            4 <= counts["multiple_choice"] <= 6
            and 2 <= counts["true_false"] <= 3
            and 2 <= counts["fill_blank"] <= 3
            and 3 <= counts["short_answer"] <= 4
        )
        if not valid_counts:
            raise ValueError("题型数量不符合 learning-quiz-v2")
    elif not 6 <= counts["multiple_choice"] <= 10 or not 4 <= counts["short_answer"] <= 6:
        raise ValueError("题型数量不符合 6–10 道选择题和 4–6 道简答题")
    return LearningQuizResult(questions, model_name)


def parse_feedback_result(content: str, model_name: str) -> LearningFeedbackResult:
    raw = _object(content)
    feedback = raw.get("feedback_markdown")
    evidence_status = raw.get("evidence_status")
    if not isinstance(feedback, str) or not feedback.strip():
        raise ValueError("反馈正文无效")
    if evidence_status != "基于学习包证据快照":
        raise ValueError("反馈证据状态无效")
    return LearningFeedbackResult(feedback.strip(), model_name, evidence_status)


def active_dates(start: date, end: date, weekdays: list[int]) -> list[date]:
    values: list[date] = []
    cursor = start
    allowed = set(weekdays)
    while cursor <= end:
        if cursor.isoweekday() in allowed:
            values.append(cursor)
        cursor += timedelta(days=1)
    return values
