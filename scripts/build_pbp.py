#!/usr/bin/env python3
"""Rebuild Monetary System.pbp from the source JavaScript files."""

from __future__ import annotations

import argparse
import gzip
import json
import re
from pathlib import Path


PBP_MAGIC = b"PBP1>>"
SOURCE_ORDER = [
    "money.js",
    "data.js",
    "sync.js",
    "bank.js",
    "wages.js",
    "rank_up.js",
    "stock_market.js",
    "donation.js",
    "gift.js",
]


def read_pbp(path: Path) -> dict:
    raw = path.read_bytes()
    if not raw.startswith(PBP_MAGIC):
        raise ValueError(f"{path} is not a ProBoards package")
    return json.loads(gzip.decompress(raw[len(PBP_MAGIC) :]).decode("utf-8"))


def write_pbp(path: Path, payload: dict) -> None:
    packed = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    path.write_bytes(PBP_MAGIC + gzip.compress(packed))


def remove_comments(code: str) -> str:
    token = r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`|//[^\r\n]*|/\*.*?\*/'

    def replace(match: re.Match[str]) -> str:
        text = match.group(0)
        if text.startswith(("'", '"', "`")):
            return text
        if text.startswith(("/*!", "/**")):
            return text
        return ""

    return re.sub(token, replace, code, flags=re.S)


def minify_js(code: str) -> str:
    code = remove_comments(code)
    code = re.sub(r"\s+", " ", code)
    code = re.sub(r"\s*([{}()[\].,;:+\-*/%<>=!&|?:])\s*", r"\1", code)
    code = re.sub(r";}", "}", code)
    return code.strip()


def assemble(root: Path, version: str) -> str:
    plugin = "\n\n".join((root / name).read_text(encoding="utf-8") for name in SOURCE_ORDER)
    wrapper = (root / "monetary.js").read_text(encoding="utf-8")
    return wrapper.replace("{PLUGIN}", plugin).replace("{VER}", version)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--pbp", default="Monetary System.pbp")
    parser.add_argument("--output")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    pbp_path = root / args.pbp
    output_path = root / args.output if args.output else pbp_path
    payload = read_pbp(pbp_path)
    version = str(payload.get("version") or "0.0.0")
    source = assemble(root, version)
    banner = f"/* Monetary System {version} - Copyright (C) 2015 pixelDepth.net All Rights Reserved. http://support.proboards.com/user/2671 */\n"
    code = banner + minify_js(source)

    for component in payload.get("components", []):
        if component.get("type") == "js":
            component["header"] = code
            break
    else:
        raise ValueError("Could not find JavaScript component")

    if not args.dry_run:
        write_pbp(output_path, payload)

    print(f"source bytes: {len(source)}")
    print(f"bundle js bytes: {len(code)}")
    print(f"output: {output_path}")
    print(f"dry run: {args.dry_run}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
