import pytest
from app.tools.registry import tool_registry
from app.tools.job_tools import SearchJobsInputSchema, GetJobDetailsInputSchema, AnalyzeJDInputSchema
from app.tools.skill_gap_tools import GenerateStudyRoadmapInputSchema
from pydantic import ValidationError


def test_tool_registry_initialization():
    tools = tool_registry.list_tools()
    assert len(tools) >= 6
    assert tool_registry.get_tool("get_candidate_profile") is not None
    assert tool_registry.get_tool("search_jobs") is not None
    assert tool_registry.get_tool("match_candidate") is not None
    assert tool_registry.get_tool("generate_study_roadmap") is not None
    assert tool_registry.get_tool("save_application") is not None


def test_search_jobs_input_schema_validation():
    valid = SearchJobsInputSchema(query="Backend", location="Remote", limit=10)
    assert valid.query == "Backend"
    assert valid.limit == 10

    with pytest.raises(ValidationError):
        SearchJobsInputSchema(limit=50)  # Exceeds max 20 limit


def test_analyze_jd_input_schema_validation():
    with pytest.raises(ValidationError):
        AnalyzeJDInputSchema(raw_text="Short")  # Min length is 20 chars

    valid = AnalyzeJDInputSchema(raw_text="Looking for a Python Backend Developer with 2+ years exp.")
    assert "Python" in valid.raw_text


def test_roadmap_input_schema_defaults():
    schema = GenerateStudyRoadmapInputSchema()
    assert schema.duration_type == "2_weeks"
    assert schema.target_role == "Software Engineer"
