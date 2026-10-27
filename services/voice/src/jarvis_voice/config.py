"""設定。値は環境変数から読む。"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    port: int
    openclaw_base_url: str
    aivis_base_url: str
    ollama_base_url: str


def load_settings(env: dict[str, str] | None = None) -> Settings:
    e = dict(os.environ) if env is None else env
    return Settings(
        port=int(e.get("JARVIS_VOICE_PORT", "8710")),
        openclaw_base_url=e.get("OPENCLAW_BASE_URL", "http://127.0.0.1:18789"),
        aivis_base_url=e.get("AIVIS_BASE_URL", "http://127.0.0.1:10101"),
        ollama_base_url=e.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
    )
