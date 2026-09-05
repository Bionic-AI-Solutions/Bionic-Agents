"""LangFuse client for observability."""

from typing import Dict, Any, Optional, List


class LangFuseClient:
    """LangFuse client for tracing and observability."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.enabled = self.config.get("enabled", False)
        self.public_key = self.config.get("publicKey")
        self.secret_key = self.config.get("secretKey")
        self.base_url = self.config.get("baseUrl", "https://cloud.langfuse.com")
        
        # TODO: Initialize LangFuse SDK (pinned to langfuse 4.15.1 in pyproject.toml)
        # if self.enabled:
        #     from langfuse import Langfuse
        #     self.client = Langfuse(
        #         public_key=self.public_key,
        #         secret_key=self.secret_key,
        #         base_url=self.base_url,   # `host=` still works in 4.x but is deprecated
        #     )
        # else:
        #     self.client = None
    
    def is_enabled(self) -> bool:
        """Check if LangFuse is enabled."""
        return self.enabled
    
    async def create_trace(
        self,
        name: str,
        input_data: Any,
        output_data: Any = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Create a trace."""
        if not self.enabled:
            return None
        
        # TODO: Implement LangFuse trace creation.
        #
        # The v4 SDK has no `client.trace()` / `trace.generation()` — those were
        # removed after v2. Note also that `start_span` / `start_as_current_span`
        # do NOT exist despite appearing in the published docs; the real package
        # exposes only start_observation / start_as_current_observation with an
        # `as_type` discriminator ("span", "generation", "agent", "tool").
        #
        # if self.client:
        #     with self.client.start_as_current_observation(
        #         name=name, as_type="generation", metadata=metadata
        #     ) as gen:
        #         gen.update(input=input_data, output=output_data)
        #         return gen.trace_id
        
        return None
    
    async def get_trace_metrics(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Get trace metrics."""
        if not self.enabled:
            return None
        
        # TODO: Implement trace metrics retrieval
        return None
    
    async def query_traces(
        self,
        agent_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Query traces."""
        if not self.enabled:
            return []
        
        # TODO: Implement trace querying
        return []

