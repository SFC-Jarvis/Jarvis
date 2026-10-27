from pathlib import Path

from jarvis_tools.config import default_data_dir, load_settings
from jarvis_tools.db import connect


def test_settings_defaults() -> None:
    s = load_settings({})
    assert s.port == 8700
    assert s.data_dir == default_data_dir()


def test_settings_from_env(tmp_path: Path) -> None:
    s = load_settings({"JARVIS_TOOLS_PORT": "9000", "JARVIS_DATA_DIR": str(tmp_path)})
    assert s.port == 9000
    assert s.db_path == tmp_path / "jarvis.db"


def test_connect_creates_db(tmp_path: Path) -> None:
    conn = connect(tmp_path / "sub" / "jarvis.db")
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    conn.close()
