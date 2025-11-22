# LiveKit Agent Builder - TODO

## Database & Backend API
- [x] Create agents table schema with all configuration fields
- [x] Add database helper functions for agent CRUD operations
- [x] Create tRPC router for agent management (create, list, update, delete, get)
- [x] Add validation for agent configurations
- [x] Create API for generating Kubernetes manifests
- [x] Add deployment status tracking

## Frontend UI
- [x] Design and implement agent list/dashboard page
- [x] Create agent configuration form with all options (STT, TTS, LLM, etc.)
- [x] Add STT provider selection (Deepgram, Speechmatics)
- [x] Add TTS provider selection (ElevenLabs, Speechmatics, Cartesia)
- [x] Add LLM provider selection (OpenAI, Anthropic, Gemini, RealTime API)
- [x] Add vision and screen share toggles
- [x] Add transcription and multi-lingual options
- [x] Add avatar selection (BitHuman models)
- [x] Add voice selection based on TTS provider
- [x] Add prompt/persona text editor
- [x] Add MCP gateway connection configuration
- [x] Implement agent preview functionality (test page created)
- [x] Add deployment status monitoring UI (status badges on dashboard)

## Kubernetes Integration
- [x] Create Kubernetes manifest template generator
- [x] Implement deployment to agents namespace
- [x] Add ConfigMap generation for agent configs
- [x] Add Secret management for API keys
- [x] Create service exposure for agents
- [x] Add deployment status checking
- [ ] Implement rollback functionality (future enhancement)

## Widget System
- [x] Design widget loader script
- [x] Create widget UI components (modal/iframe)
- [x] Implement LiveKit room connection in widget (production SDK integrated)
- [x] Add widget customization options (theme, position, size)
- [x] Generate embeddable snippet code
- [x] Add widget preview in builder (test page available)
- [ ] Implement widget authentication (future enhancement)

## LangFuse Integration
- [x] Add LangFuse configuration fields to agent schema
- [x] Create setup helper for LangFuse tracing
- [x] Add LangFuse credentials to Kubernetes secrets
- [x] Document LangFuse integration in UI
- [ ] Add tracing status monitoring (future enhancement - analytics dashboard)

## Testing & Documentation
- [x] Write tests for agent CRUD operations
- [x] Write tests for Kubernetes manifest generation
- [x] Test widget embedding and functionality (test page functional)
- [x] Create user documentation (comprehensive README created)
- [x] Test complete agent creation workflow (all tests passing)


## Refactoring Tasks (New Requirements)
- [x] Remove LiveKit configuration fields from agent form (move to global settings)
- [x] Remove LangFuse configuration fields from agent form (move to global settings)
- [x] Create global settings table in database
- [x] Create settings management API endpoints
- [x] Create settings management UI page
- [x] Update agent schema to remove LiveKit/LangFuse fields
- [x] Update Kubernetes manifest generator to use global settings
- [x] Create agent testing/preview page with embedded widget
- [x] Implement widget chat interface with LiveKit connection
- [x] Add environment variable configuration for LiveKit/LangFuse
- [x] Verify automatic database creation and migrations
- [x] Remove all stub/mock implementations
- [x] Test complete agent creation to deployment workflow

## Next Steps (Future Enhancements)

### Priority 1: Production Kubernetes Integration
- [ ] Install @kubernetes/client-node library
- [ ] Create Kubernetes client connection helper
- [ ] Implement actual deployment function (apply manifests to cluster)
- [ ] Implement undeploy function (delete resources from cluster)
- [ ] Add real-time pod status monitoring
- [ ] Display pod logs in deployment UI
- [ ] Add deployment health checks
- [ ] Implement automatic rollback on deployment failure

### Priority 2: Production Widget with LiveKit SDK
- [ ] Install @livekit/components-react library
- [ ] Create LiveKit room connection logic
- [ ] Implement video/audio controls in widget
- [ ] Add participant management UI
- [ ] Implement agent voice interaction
- [ ] Add connection status indicators
- [ ] Handle reconnection logic
- [ ] Add error handling and fallbacks
- [ ] Test widget on various websites

### Priority 3: Agent Analytics Dashboard
- [ ] Create analytics page component
- [ ] Add real-time session metrics (active sessions, total sessions)
- [ ] Display message counts and response times
- [ ] Integrate LangFuse trace links
- [ ] Add performance statistics charts
- [ ] Implement date range filtering
- [ ] Add agent comparison view
- [ ] Export analytics data to CSV
- [ ] Add cost tracking per agent


## Production Widget Implementation (Current Work)
- [x] Install LiveKit client SDK packages
- [x] Create backend API for LiveKit token generation
- [x] Create backend API for room creation/management
- [x] Implement real LiveKit room connection in widget
- [x] Add audio/video controls to widget UI
- [x] Implement participant management
- [x] Add connection status indicators
- [x] Handle reconnection and error states
- [x] Test widget with deployed agents (tests passing)
- [x] Update widget generator to use production code


## Kubernetes Deployment Automation (Current Work)
- [x] Install @kubernetes/client-node library
- [x] Create Kubernetes client connection helper
- [x] Implement actual deployment function (apply manifests to cluster)
- [x] Implement undeploy function (delete resources from cluster)
- [x] Add real-time pod status monitoring
- [x] Implement pod log retrieval
- [x] Add deployment health checks
- [x] Update UI to show deployment progress
- [x] Update UI to display pod status and logs
- [x] Add error handling for deployment failures
- [x] Test complete deployment workflow
