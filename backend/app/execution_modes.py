"""Server-side tool permissions for Agent execution modes."""

from typing import Literal

from .tools import AGENT_TOOLS


WRITE_TOOL_NAMES = {"create_task", "complete_task", "save_note"}


def tools_for_execution_mode(execution_mode: Literal["auto", "plan"]) -> list[dict[str, object]]:
    """Expose only tools that are allowed for the current execution mode.

    Plan mode must be enforced at the server boundary rather than relying on a
    system-prompt instruction, because prompts are not an authorization layer.
    """
    if execution_mode != "plan":
        return AGENT_TOOLS
    return [
        tool
        for tool in AGENT_TOOLS
        if str(tool.get("function", {}).get("name", "")) not in WRITE_TOOL_NAMES
    ]
