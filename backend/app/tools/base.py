import time
from abc import ABC, abstractmethod
from typing import Type, Dict, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field


class ToolExecutionContext(BaseModel):
    user_id: PydanticObjectId
    session_id: str
    is_confirmed: bool = False


class ToolExecutionResult(BaseModel):
    tool_name: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_payload: Optional[Dict[str, Any]] = None
    latency_ms: float = 0.0


class BaseTool(ABC):
    name: str
    description: str
    input_schema: Type[BaseModel]
    requires_confirmation: bool = False

    @abstractmethod
    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        """Executes tool logic with typed params and user auth context."""
        pass

    async def run(self, raw_params: Dict[str, Any], context: ToolExecutionContext) -> ToolExecutionResult:
        start_time = time.time()

        # Check HITL confirmation requirement
        if self.requires_confirmation and not context.is_confirmed:
            return ToolExecutionResult(
                tool_name=self.name,
                success=True,
                requires_confirmation=True,
                confirmation_payload={
                    "tool_name": self.name,
                    "params": raw_params,
                    "warning_message": f"Action '{self.name}' requires explicit candidate confirmation.",
                },
                latency_ms=(time.time() - start_time) * 1000,
            )

        try:
            # Validate input schema
            validated_input = self.input_schema.model_validate(raw_params)
            # Execute
            result_data = await self.execute(params=validated_input.model_dump(), context=context)
            latency = (time.time() - start_time) * 1000

            # Convert Pydantic or dict to dict format
            if hasattr(result_data, "model_dump"):
                formatted_data = result_data.model_dump()
            elif isinstance(result_data, list):
                formatted_data = {"items": [item.model_dump() if hasattr(item, "model_dump") else item for item in result_data]}
            elif isinstance(result_data, dict):
                formatted_data = result_data
            else:
                formatted_data = {"result": result_data}

            return ToolExecutionResult(
                tool_name=self.name,
                success=True,
                data=formatted_data,
                latency_ms=latency,
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return ToolExecutionResult(
                tool_name=self.name,
                success=False,
                error=str(e),
                latency_ms=latency,
            )
