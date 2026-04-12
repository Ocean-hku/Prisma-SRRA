import math
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple


CoreDimension = Literal["social", "rational", "rebellious", "ambition"]
CORE_DIMS: Tuple[CoreDimension, ...] = ("social", "rational", "rebellious", "ambition")


@dataclass(frozen=True)
class PersonalityType:
    id: str
    name: str
    centroid: Dict[CoreDimension, float]


@dataclass(frozen=True)
class Option:
    label: str
    text: str
    weights: Dict[CoreDimension, float]


@dataclass(frozen=True)
class QuestionRec:
    order: int
    id: int
    scenario: str
    level: str
    text: str
    options: List[Option]


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def calculate_distance(p1: Dict[CoreDimension, float], p2: Dict[CoreDimension, float]) -> float:
    return math.sqrt(
        (p1["social"] - p2["social"]) ** 2
        + (p1["rational"] - p2["rational"]) ** 2
        + (p1["rebellious"] - p2["rebellious"]) ** 2
        + (p1["ambition"] - p2["ambition"]) ** 2
    )


def parse_personality_types(questions_ts: str) -> List[PersonalityType]:
    pattern = re.compile(
        r'id:\s*"(?P<id>type_\d+)"[\s\S]*?friendlyName:\s*"(?P<friendly>[^"]+)"[\s\S]*?centroid:\s*\{\s*social:\s*(?P<social>-?\d+)\s*,\s*rational:\s*(?P<rational>-?\d+)\s*,\s*rebellious:\s*(?P<rebellious>-?\d+)\s*,\s*ambition:\s*(?P<ambition>-?\d+)\s*\}',
        re.MULTILINE,
    )
    out: List[PersonalityType] = []
    for m in pattern.finditer(questions_ts):
        out.append(
            PersonalityType(
                id=m.group("id"),
                name=m.group("friendly"),
                centroid={
                    "social": float(m.group("social")),
                    "rational": float(m.group("rational")),
                    "rebellious": float(m.group("rebellious")),
                    "ambition": float(m.group("ambition")),
                },
            )
        )
    out.sort(key=lambda t: int(t.id.split("_")[1]))
    if len(out) < 16:
        raise RuntimeError(f"Failed to parse personalityTypes, got {len(out)}")
    return out


def parse_questions(questions_v2_ts: str) -> List[QuestionRec]:
    q_pat = re.compile(
        r"\{\s*id:\s*(?P<id>\d+),\s*scenario:\s*'(?P<scenario>[^']*)',\s*level:\s*'(?P<level>[^']*)',\s*text:\s*'(?P<text>[^']*)',\s*options:\s*(?P<fn>make5Text_2d|make5Text)\((?P<args>[^)]*)\)\s*\}",
        re.MULTILINE,
    )
    questions: List[QuestionRec] = []
    scale5 = [-2, -1, 0, 1, 2]
    for idx, m in enumerate(q_pat.finditer(questions_v2_ts), start=1):
        qid = int(m.group("id"))
        scenario = m.group("scenario")
        level = m.group("level")
        text = m.group("text")
        fn = m.group("fn")
        args = m.group("args")

        dim1: Optional[CoreDimension] = None
        dim2: Optional[CoreDimension] = None
        weights2: Optional[List[int]] = None
        texts: Optional[List[str]] = None

        if fn == "make5Text":
            mm = re.match(r"\s*\d+\s*,\s*'(?P<dim>\w+)'\s*,\s*\[(?P<texts>[\s\S]*)\]\s*$", args)
            if not mm:
                raise RuntimeError(f"Failed to parse make5Text args: {args}")
            dim1 = mm.group("dim")  # type: ignore[assignment]
            texts = re.findall(r"'([^']*)'", mm.group("texts"))
        else:
            mm = re.match(
                r"\s*\d+\s*,\s*'(?P<dim1>\w+)'\s*,\s*'(?P<dim2>\w+)'\s*,\s*\[(?P<texts>[\s\S]*?)\]\s*,\s*\[(?P<w2>[^\]]+)\]\s*$",
                args,
            )
            if not mm:
                raise RuntimeError(f"Failed to parse make5Text_2d args: {args}")
            dim1 = mm.group("dim1")  # type: ignore[assignment]
            dim2 = mm.group("dim2")  # type: ignore[assignment]
            texts = re.findall(r"'([^']*)'", mm.group("texts"))
            weights2 = [int(x.strip()) for x in mm.group("w2").split(",")]
            if len(weights2) != 5:
                raise RuntimeError(f"make5Text_2d weights2 expected 5 numbers, got {len(weights2)}: {weights2}")

        if dim1 not in CORE_DIMS:
            raise RuntimeError(f"Unknown dim1: {dim1}")
        if dim2 is not None and dim2 not in CORE_DIMS:
            raise RuntimeError(f"Unknown dim2: {dim2}")
        if texts is None or len(texts) != 5:
            raise RuntimeError(f"Expected 5 option texts for question {qid}, got {0 if texts is None else len(texts)}")

        opts: List[Option] = []
        for opt_idx in range(5):
            label = chr(ord("A") + opt_idx)
            weights: Dict[CoreDimension, float] = {dim1: float(scale5[opt_idx])}
            if dim2 is not None and weights2 is not None:
                weights[dim2] = float(weights2[opt_idx])
            opts.append(Option(label=label, text=texts[opt_idx], weights=weights))

        questions.append(QuestionRec(order=idx, id=qid, scenario=scenario, level=level, text=text, options=opts))
    if len(questions) < 60:
        raise RuntimeError(f"Expected >= 60 questions, got {len(questions)}")
    return questions


def compute_core_max_abs(questions: List[QuestionRec]) -> Dict[CoreDimension, float]:
    max_abs: Dict[CoreDimension, float] = {dim: 0.0 for dim in CORE_DIMS}
    for q in questions:
        for dim in CORE_DIMS:
            best = 0.0
            for opt in q.options:
                best = max(best, abs(float(opt.weights.get(dim, 0.0))))
            max_abs[dim] += best
    for dim in CORE_DIMS:
        if not math.isfinite(max_abs[dim]) or max_abs[dim] <= 0:
            max_abs[dim] = 1.0
    return max_abs


def score_sheet(
    questions: List[QuestionRec],
    personality_types: List[PersonalityType],
    rng: random.Random,
) -> Tuple[List[str], Dict[CoreDimension, float], Dict[CoreDimension, float], List[Tuple[PersonalityType, float]], List[int]]:
    raw_scores: Dict[CoreDimension, float] = {dim: 0.0 for dim in CORE_DIMS}
    chosen_labels: List[str] = []

    for q in questions:
        idx = rng.randrange(5)
        opt = q.options[idx]
        chosen_labels.append(opt.label)
        for dim, v in opt.weights.items():
            raw_scores[dim] += float(v)

    core_max_abs = compute_core_max_abs(questions)

    normalized: Dict[CoreDimension, float] = {}
    for dim in CORE_DIMS:
        normalized[dim] = clamp((raw_scores[dim] / core_max_abs[dim]) * 8.0, -8.0, 8.0)

    distances: List[Tuple[PersonalityType, float]] = []
    for t in personality_types:
        d = calculate_distance(normalized, t.centroid)
        distances.append((t, d))
    distances.sort(key=lambda x: x[1])

    min_dist = distances[0][1] if distances else 0.0
    tied = [td for td in distances if abs(td[1] - min_dist) <= 0.02]
    if len(tied) > 1:
        def score_sign(v: float) -> int:
            if abs(v) < 0.35:
                return 0
            return 1 if v > 0 else -1

        def centroid_sign(v: float) -> int:
            return 1 if v > 0 else -1

        def match_count(t: PersonalityType) -> int:
            s = 0
            for dim in CORE_DIMS:
                sv = score_sign(normalized[dim])
                if sv != 0 and sv == centroid_sign(t.centroid[dim]):
                    s += 1
            return s

        tie_sorted = sorted(
            tied,
            key=lambda td: (-match_count(td[0]), td[1], td[0].id),
        )
        chosen = tie_sorted[0]
        rest = [td for td in distances if td[0].id != chosen[0].id]
        distances = [chosen] + rest

    top3 = distances[:3]
    temperature = 4.0
    r = [math.exp(-d / temperature) for _, d in top3]
    total = sum(r) or 1.0
    perc = [int(round((x / total) * 100.0)) for x in r]
    diff = 100 - sum(perc)
    max_idx = perc.index(max(perc))
    perc[max_idx] += diff

    return chosen_labels, raw_scores, normalized, top3, perc


def main() -> None:
    base = Path(__file__).resolve().parents[1]
    questions_ts_path = base / "src" / "data" / "questions.ts"
    questions_v2_path = base / "src" / "data" / "questions_v2.ts"

    questions_ts = questions_ts_path.read_text(encoding="utf-8")
    questions_v2_ts = questions_v2_path.read_text(encoding="utf-8")

    personality_types = parse_personality_types(questions_ts)
    questions = parse_questions(questions_v2_ts)

    rng = random.Random(20260412)
    sheets = 20

    lines: List[str] = []
    for i in range(1, sheets + 1):
        chosen_labels, raw_scores, normalized, top3, perc = score_sheet(questions, personality_types, rng)

        primary = top3[0][0]
        top3_str = " / ".join([f"{t.name} {p}%" for (t, _), p in zip(top3, perc)])
        raw_str = ", ".join([f"{dim}={raw_scores[dim]:.0f}" for dim in CORE_DIMS])
        norm_str = ", ".join([f"{dim}={normalized[dim]:.2f}" for dim in CORE_DIMS])
        seq = " ".join([f"Q{idx:02d}:{lab}" for idx, lab in enumerate(chosen_labels, start=1)])

        lines.append(f"答卷{i:02d}：主类型={primary.name}（{perc[0]}%） | Top3={top3_str}")
        lines.append(f"  原始分：{raw_str}")
        lines.append(f"  归一化：{norm_str}")
        lines.append(f"  选项：{seq}")
        lines.append("")

    print("\n".join(lines).rstrip() + "\n")


if __name__ == "__main__":
    main()
