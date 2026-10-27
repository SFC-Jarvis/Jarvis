import asyncio

from fastmcp import Client

from jarvis_tools.mcp_server import mcp


def test_ping_tool() -> None:
    async def run() -> str:
        async with Client(mcp) as client:
            result = await client.call_tool("ping", {})
            return str(result.data)

    assert asyncio.run(run()) == "pong"
