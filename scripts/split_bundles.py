#!/usr/bin/env python3
"""Split topic bundles into content/ files and register them in _order.json.

A bundle is one JSON file holding everything for one new topic:
  { "id": ..., "topic": {...}, "readingSkills": {...}, "grammarLab": {...},
    "translation": {...}, "summary": {...}, "extended": {...} }
`summary` and `extended` carry their own ids (they're standalone entries).

Usage: python3 scripts/split_bundles.py <bundle.json> [...]
Re-running with the same bundle overwrites its files; ids are only appended
to _order.json once.
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "content")
PARTS = {
    "topic": "topics",
    "readingSkills": "reading-skills",
    "grammarLab": "grammar-lab",
    "translation": "translation",
    "summary": "summary-writing",
    "extended": "extended-writing",
}

def write(kind, obj):
    d = os.path.join(ROOT, kind)
    with open(os.path.join(d, obj["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")
    order_path = os.path.join(d, "_order.json")
    order = json.load(open(order_path, encoding="utf-8"))
    if obj["id"] not in order:
        order.append(obj["id"])
        with open(order_path, "w", encoding="utf-8") as f:
            json.dump(order, f, ensure_ascii=False, indent=2)
            f.write("\n")

for path in sys.argv[1:]:
    b = json.load(open(path, encoding="utf-8"))
    for key, kind in PARTS.items():
        obj = b[key]
        if key not in ("summary", "extended"):
            obj = dict({"id": b["id"]}, **{k: v for k, v in obj.items() if k != "id"})
        write(kind, obj)
    print("split", b["id"], "->", b["summary"]["id"], "/", b["extended"]["id"])
