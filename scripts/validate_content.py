#!/usr/bin/env python3
"""Structural checks on content/ that build.js's required-field check can't
catch: answer indexes in range, word banks that really are permutations of
their answers, cloze gap markers matching the gap list, matching labels that
exist, exam-format stems with exactly one gap, and so on.

Usage: python3 scripts/validate_content.py   (exit code 1 on any problem)
"""
import json, os, re, sys
from collections import Counter

ROOT = os.path.join(os.path.dirname(__file__), "..", "content")
problems = []

def bad(where, msg):
    problems.append(f"{where}: {msg}")

def load(kind):
    d = os.path.join(ROOT, kind)
    order = json.load(open(os.path.join(d, "_order.json"), encoding="utf-8"))
    if len(order) != len(set(order)):
        bad(kind, "duplicate ids in _order.json")
    return [(i, json.load(open(os.path.join(d, i + ".json"), encoding="utf-8"))) for i in order]

def mcq(where, opts, a, n=None):
    if not isinstance(opts, list) or len(opts) < 2:
        bad(where, "needs at least 2 options"); return
    if len(set(opts)) != len(opts):
        bad(where, f"duplicate options {opts}")
    if not isinstance(a, int) or not 0 <= a < len(opts):
        bad(where, f"answer index {a} out of range")
    if n and len(opts) != n:
        bad(where, f"expected {n} options, got {len(opts)}")

def bank(where, item):
    if Counter(item["bank"]) != Counter(item["answer"]):
        bad(where, f"bank is not a permutation of answer: bank={item['bank']} answer={item['answer']}")
    if item["bank"] == item["answer"]:
        bad(where, "bank is already in answer order")

def nonempty(where, s):
    if not isinstance(s, str) or not s.strip():
        bad(where, "empty text")

for tid, t in load("topics"):
    w = f"topics/{tid}"
    if len(t["vocab"]) < 8: bad(w, f"only {len(t['vocab'])} vocab words")
    seen = set()
    for i, v in enumerate(t["vocab"]):
        for k in ("ur", "en", "ex_ur", "ex_en"): nonempty(f"{w} vocab[{i}].{k}", v.get(k))
        if v["ur"] in seen: bad(w, f"duplicate vocab word {v['ur']}")
        seen.add(v["ur"])
    nonempty(f"{w} reading.passage", t["reading"]["passage"])
    for i, q in enumerate(t["reading"]["questions"]): mcq(f"{w} reading.q[{i}]", q["opts"], q["a"])
    for i, b in enumerate(t["writing"]["build"]): bank(f"{w} writing.build[{i}]", b)
    for i, b in enumerate(t["writing"]["blanks"]):
        if "____" not in b["text"]: bad(f"{w} writing.blanks[{i}]", "no ____ gap")
        mcq(f"{w} writing.blanks[{i}]", b["opts"], b["a"])
    nonempty(f"{w} writing.creative.ur", t["writing"]["creative"]["ur"])
    g = t["grammar"]
    if len(g["rows"]) < 3: bad(w, "grammar needs 3+ example rows")
    for i, p in enumerate(g["practice"]):
        if "____" not in p["q"]: bad(f"{w} grammar.practice[{i}]", "no ____ gap")
        mcq(f"{w} grammar.practice[{i}]", p["opts"], p["a"])

for tid, t in load("reading-skills"):
    w = f"reading-skills/{tid}"
    sa = t["shortAnswer"]
    nonempty(f"{w} shortAnswer.passage", sa["passage"])
    for i, q in enumerate(sa["questions"]):
        if not q.get("answers"): bad(f"{w} shortAnswer.q[{i}]", "no accepted answers")
    mm = t["multipleMatching"]
    labels = [p["label"] for p in mm["paragraphs"]]
    if len(set(labels)) != len(labels): bad(w, "duplicate paragraph labels")
    for i, s in enumerate(mm["statements"]):
        if s["match"] not in labels: bad(f"{w} matching.statement[{i}]", f"label {s['match']} not a paragraph")
    nm = t["noteMaking"]
    keys = [h["key"] for h in nm["headings"]]
    for k in keys:
        if not nm["modelNotes"].get(k): bad(w, f"noteMaking heading '{k}' has no model notes")
    for k in nm["modelNotes"]:
        if k not in keys: bad(w, f"modelNotes key '{k}' has no heading")

for tid, t in load("grammar-lab"):
    w = f"grammar-lab/{tid}"
    c = t["cloze"]
    marks = [int(m) for m in re.findall(r"\((\d+)\)_____", c["passage"])]
    if marks != list(range(1, len(c["gaps"]) + 1)):
        bad(w, f"cloze markers {marks} don't match {len(c['gaps'])} gaps")
    for i, gp in enumerate(c["gaps"]): mcq(f"{w} cloze.gap[{i}]", gp["opts"], gp["a"])
    for i, tr in enumerate(t["transformation"]):
        if not tr.get("answers"): bad(f"{w} transformation[{i}]", "no answers")
        if "stem" in tr:
            if tr["stem"].count("____") != 1: bad(f"{w} transformation[{i}]", "stem must have exactly one ____")
            for a in tr["answers"]:
                filled = tr["stem"].replace("____", a)
                if len(a.split()) > 4: bad(f"{w} transformation[{i}]", f"gap answer too long: {a}")
                if filled.strip() == tr["original"].strip(): bad(f"{w} transformation[{i}]", "filled stem identical to original — nothing to transform")

for tid, t in load("translation"):
    w = f"translation/{tid}"
    for i, b in enumerate(t["warmup"]): bank(f"{w} warmup[{i}]", b)
    nonempty(f"{w} passage.en", t["passage"]["en"])
    nonempty(f"{w} passage.modelUr", t["passage"]["modelUr"])

for tid, t in load("summary-writing"):
    w = f"summary-writing/{tid}"
    n = len(t["modelSummary"].split())
    if n > 100: bad(w, f"model summary is {n} words (limit 100)")
    if len(t["passage"].split()) < 150: bad(w, "passage too short to summarise")

for tid, t in load("extended-writing"):
    w = f"extended-writing/{tid}"
    p = t["prompt"]
    for k in ("ur", "en", "purpose", "format", "audience"): nonempty(f"{w} prompt.{k}", p.get(k))
    if "points" in p and (not isinstance(p["points"], list) or len(p["points"]) != 3):
        bad(w, "prompt.points should list exactly 3 points (exam format)")
    if len(t["modelResponse"].split()) < 100: bad(w, "model response looks too short")

if problems:
    print(f"{len(problems)} problem(s):")
    for p in problems: print("  -", p)
    sys.exit(1)
print("content OK")
