"""設定。値は環境変数から読む（.env.local を scripts/dev.sh が読み込む）。"""

import os
from dataclasses import dataclass
from pathlib import Path


def default_data_dir() -> Path:
    """端末内の保存先。ユーザーの記憶・タスクはここから外に出さない。"""
    return Path.home() / "Library" / "Application Support" / "JARVIS"


@dataclass(frozen=True)
class Settings:
    port: int
    data_dir: Path

    @property
    def db_path(self) -> Path:
        return self.data_dir / "jarvis.db"


def load_settings(env: dict[str, str] | None = None) -> Settings:
    e = dict(os.environ) if env is None else env
    data_dir = e.get("JARVIS_DATA_DIR") or str(default_data_dir())
    return Settings(port=int(e.get("JARVIS_TOOLS_PORT", "8700")), data_dir=Path(data_dir))
