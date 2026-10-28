"""設定。値は環境変数から読む（.env.local を scripts/dev.sh が読み込む）。"""

import os
import sys
from dataclasses import dataclass
from pathlib import Path


def default_data_dir(
    platform: str | None = None, env: dict[str, str] | None = None, home: Path | None = None
) -> Path:
    """端末内の保存先。ユーザーの記憶・タスクはここから外に出さない。

    - macOS: ~/Library/Application Support/JARVIS
    - Windows（次学期のデスクトップアプリ用）: %APPDATA%\\JARVIS
    - Linux・WSL: $XDG_DATA_HOME/JARVIS（未設定なら ~/.local/share/JARVIS）
    """
    plat = sys.platform if platform is None else platform
    e = dict(os.environ) if env is None else env
    h = Path.home() if home is None else home
    if plat == "darwin":
        return h / "Library" / "Application Support" / "JARVIS"
    if plat == "win32":
        return Path(e.get("APPDATA") or h / "AppData" / "Roaming") / "JARVIS"
    return Path(e.get("XDG_DATA_HOME") or h / ".local" / "share") / "JARVIS"


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
