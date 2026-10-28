from pathlib import Path

import pytest

from jarvis_tools.config import default_data_dir

HOME = Path("/home/u")


def test_macでは_libraryに保存する() -> None:
    assert default_data_dir("darwin", {}, HOME) == HOME / "Library/Application Support/JARVIS"


def test_windowsでは_appdataに保存する() -> None:
    assert default_data_dir("win32", {"APPDATA": "/appdata"}, HOME) == Path("/appdata/JARVIS")


def test_windowsで_appdataがなければroamingに保存する() -> None:
    assert default_data_dir("win32", {}, HOME) == HOME / "AppData/Roaming/JARVIS"


@pytest.mark.parametrize(
    ("env", "expected"),
    [({}, HOME / ".local/share/JARVIS"), ({"XDG_DATA_HOME": "/xdg"}, Path("/xdg/JARVIS"))],
)
def test_linuxとwslでは_xdgに保存する(env: dict[str, str], expected: Path) -> None:
    assert default_data_dir("linux", env, HOME) == expected
