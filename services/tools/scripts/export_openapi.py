"""FastAPI の OpenAPI を contracts/tools-api.json に書き出す。CI で差分がないか確認する。"""

import json
from pathlib import Path

from jarvis_tools.api import create_app

OUT = Path(__file__).resolve().parents[3] / "contracts" / "tools-api.json"


def main() -> None:
    spec = create_app().openapi()
    OUT.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
