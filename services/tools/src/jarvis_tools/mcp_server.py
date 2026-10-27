"""OpenClaw から呼ばれる MCP ツール。

ルール（docs/CODING_RULES.md）:
- 追加・変更・削除をするツールは直接実行せず「承認待ち」を返す（p5 で実装）
- ツールの説明文（docstring）は OpenClaw の AI が読むので、日本語で具体的に書く
"""

from fastmcp import FastMCP

mcp: FastMCP = FastMCP("jarvis-tools")


@mcp.tool
def ping() -> str:
    """ツールサーバーが動いているか確認する。"""
    return "pong"
