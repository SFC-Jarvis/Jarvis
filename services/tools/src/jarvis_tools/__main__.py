"""起動: uv run python -m jarvis_tools"""

import uvicorn

from jarvis_tools.api import create_app
from jarvis_tools.config import load_settings


def main() -> None:
    settings = load_settings()
    # 127.0.0.1 のみで待ち受ける（外部に公開しない）
    uvicorn.run(create_app(), host="127.0.0.1", port=settings.port)


if __name__ == "__main__":
    main()
