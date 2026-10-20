import unittest

from backend.app.execution_modes import WRITE_TOOL_NAMES, tools_for_execution_mode


class ExecutionModeTests(unittest.TestCase):
    def test_auto_mode_exposes_all_tools(self) -> None:
        tools = tools_for_execution_mode("auto")
        names = {tool["function"]["name"] for tool in tools}
        self.assertTrue(WRITE_TOOL_NAMES.issubset(names))

    def test_plan_mode_hides_write_tools(self) -> None:
        tools = tools_for_execution_mode("plan")
        names = {tool["function"]["name"] for tool in tools}
        self.assertTrue(names)
        self.assertTrue(WRITE_TOOL_NAMES.isdisjoint(names))


if __name__ == "__main__":
    unittest.main()
