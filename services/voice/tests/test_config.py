import pytest

from jarvis_voice.config import load_settings
from jarvis_voice.pipeline import build_pipeline


def test_defaults() -> None:
    s = load_settings({})
    assert s.port == 8710
    assert s.aivis_base_url == "http://127.0.0.1:10101"


def test_env_override() -> None:
    assert load_settings({"JARVIS_VOICE_PORT": "9100"}).port == 9100


def test_pipeline_not_implemented_yet() -> None:
    with pytest.raises(NotImplementedError):
        build_pipeline()
