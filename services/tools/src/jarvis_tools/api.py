"""画面（apps/web）から使う HTTP API と、MCP の入口をまとめたアプリ。

API を変えたら `pnpm gen:contracts` で contracts/tools-api.json と画面側の型を更新する。
"""

from fastapi import FastAPI
from pydantic import BaseModel

from jarvis_tools import __version__
from jarvis_tools.mcp_server import mcp


class Health(BaseModel):
    status: str
    version: str


def create_app() -> FastAPI:
    mcp_app = mcp.http_app(path="/")
    app = FastAPI(title="JARVIS Tools API", version=__version__, lifespan=mcp_app.lifespan)

    @app.get("/health", response_model=Health, operation_id="getHealth")
    def health() -> Health:
        return Health(status="ok", version=__version__)

    app.mount("/mcp", mcp_app)
    return app
