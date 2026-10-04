"""Own synthetic evidence fixtures with author-defined ground truth."""
import argparse
import json
from pathlib import Path

import fitz


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    cases = []
    for scanned in (False, True):
        name = "scanned-table" if scanned else "native-table"
        with fitz.open() as doc:
            page = doc.new_page(width=600, height=800)
            page.insert_text((50, 55), "Battery validation - synthetic data", fontsize=18)
            page.insert_text((50, 88), "Table 1. Controlled measurements; these are not research results.", fontsize=11)
            xs, ys = [50, 210, 380, 550], [120, 155, 190, 225, 260]
            for x in xs:
                page.draw_line((x, ys[0]), (x, ys[-1]))
            for y in ys:
                page.draw_line((xs[0], y), (xs[-1], y))
            rows = [["Sample", "Capacity (mAh/g)", "Retention (%)"],
                    ["Alpha", "120.5", "92.0"], ["Beta", "98.2", "87.5"],
                    ["Gamma", "135.7", "95.3"]]
            for i, row in enumerate(rows):
                for j, value in enumerate(row):
                    page.insert_text((xs[j] + 10, ys[i] + 23), value, fontsize=12)
            page.insert_text((50, 300), "All rows share the same testing conditions. Check row-value association.", fontsize=10)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            pix.save(args.output / (name + ".png"))
            if scanned:
                with fitz.open() as raster:
                    raster.new_page(width=600, height=800).insert_image(
                        fitz.Rect(0, 0, 600, 800), stream=pix.tobytes("png"))
                    raster.save(args.output / (name + ".pdf"))
            else:
                doc.save(args.output / (name + ".pdf"))
        cases.append({"file": name + ".pdf", "blocks": [
            {"page": 1, "label": "table", "bbox": [50, 120, 550, 260],
             "rows": [" ".join(row) for row in rows[1:]]}
        ]})
    with fitz.open() as doc:
        page = doc.new_page(width=600, height=800)
        page.insert_text((50, 55), "Specific capacity - synthetic formula", fontsize=18)
        page.insert_text((50, 90), "A fraction must preserve numerator and denominator, not only its characters.")
        page.insert_text((165, 175), "Q =", fontsize=22)
        page.insert_text((235, 157), "I t", fontsize=22)
        page.draw_line((225, 166), (285, 166), width=1)
        page.insert_text((245, 192), "m", fontsize=22)
        page.insert_text((50, 240), "I denotes current, t denotes time, and m denotes active mass.")
        doc.save(args.output / "fraction-formula.pdf")
        page.get_pixmap(matrix=fitz.Matrix(2, 2)).save(args.output / "fraction-formula.png")
    cases.append({"file": "fraction-formula.pdf", "blocks": [
        {"page": 1, "label": "formula", "bbox": [160, 132, 290, 200], "rows": ["Q = I t / m"]}
    ]})
    with fitz.open() as doc:
        page = doc.new_page(width=600, height=800)
        page.insert_text((50, 55), "Merged headers - synthetic stress case", fontsize=18)
        xs = [50, 190, 310, 430, 550]
        ys = [120, 150, 185, 225, 265, 305]
        for y in ys:
            page.draw_line((50, y), (550, y))
        for i, x in enumerate(xs):
            page.draw_line((x, 150 if i in (2, 4) else 120), (x, 305))
        page.draw_line((550, 120), (550, 150))
        page.insert_text((220, 140), "Initial test", fontsize=11)
        page.insert_text((450, 140), "Repeat", fontsize=11)
        rows = [["Sample", "Shift (mV)", "Rate (A/g)", "Capacity"],
                ["Alpha", "-12.5", "1.20e-3", "125.4"],
                ["Beta", "-8.2", "2.50e-3", "118.7"],
                ["Gamma", "3.1", "5.00e-3", "103.6"]]
        for i, row in enumerate(rows):
            for j, value in enumerate(row):
                page.insert_text((xs[j] + 8, ys[i + 1] + 23), value, fontsize=11)
        doc.save(args.output / "merged-header-table.pdf")
        page.get_pixmap(matrix=fitz.Matrix(2, 2)).save(args.output / "merged-header-table.png")
    cases.append({"file": "merged-header-table.pdf", "blocks": [
        {"page": 1, "label": "table", "bbox": [50, 120, 550, 305],
         "rows": [" ".join(row) for row in rows[1:]]}
    ]})
    (args.output / "expected.json").write_text(
        json.dumps({"scope": "Own synthetic fixtures, not scientific results", "cases": cases},
                   ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
