import json
import logging
from typing import Dict, List, Optional
from app.tools.base import BaseTool
from app.tools.profile_tools import GetCandidateProfileTool
from app.tools.job_tools import SearchJobsTool, GetJobDetailsTool, AnalyzeJDTool
from app.tools.matching_tools import MatchCandidateTool, GetTopRecommendationsTool
from app.tools.skill_gap_tools import GenerateStudyRoadmapTool
from app.tools.application_tools import SaveApplicationTool, ListCandidateApplicationsTool
from app.tools.memory_tools import RetrieveCandidateContextTool
from app.tools.interview_tools import StartMockInterviewTool, GetMockInterviewHistoryTool

logger = logging.getLogger("app.tools.registry")


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        default_tools = [
            GetCandidateProfileTool(),
            RetrieveCandidateContextTool(),
            SearchJobsTool(),
            GetJobDetailsTool(),
            AnalyzeJDTool(),
            MatchCandidateTool(),
            GetTopRecommendationsTool(),
            GenerateStudyRoadmapTool(),
            StartMockInterviewTool(),
            GetMockInterviewHistoryTool(),
            SaveApplicationTool(),
            ListCandidateApplicationsTool(),
        ]
        for tool in default_tools:
            self.register(tool)




    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool
        logger.debug(f"Registered tool: {tool.name}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[BaseTool]:
        return list(self._tools.values())

    def get_tools_description_prompt(self) -> str:
        """Formats all registered tools into structured prompt specs for LLM reasoning."""
        descriptions = []
        for tool in self._tools.values():
            schema_json = json.dumps(tool.input_schema.model_json_schema().get("properties", {}))
            descriptions.append(
                f"- Tool: `{tool.name}`\n"
                f"  Description: {tool.description}\n"
                f"  Parameters: {schema_json}\n"
                f"  Requires Confirmation: {'YES' if tool.requires_confirmation else 'NO'}"
            )
        return "\n\n".join(descriptions)


# Singleton tool registry instance
tool_registry = ToolRegistry()
