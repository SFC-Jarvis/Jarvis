"""SQLite への接続。テーブル設計は担当者が決める（docs/tasks/data-tools.md p2）。

暗号化（p6）を入れるときも、接続はこのモジュール経由に限定する。
"""

import sqlite3
from pathlib import Path


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
