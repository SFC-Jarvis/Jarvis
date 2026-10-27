"""起動: uv run python -m jarvis_voice"""

from jarvis_voice.config import load_settings
from jarvis_voice.pipeline import build_pipeline


def main() -> None:
    settings = load_settings()
    print(f"voice service (port {settings.port})")
    build_pipeline()


if __name__ == "__main__":
    main()
