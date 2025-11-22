# LiveKit Agent Builder

A comprehensive web application for building, configuring, and deploying LiveKit-based AI agents with custom configurations. This application provides a user-friendly interface to create agents with various STT, TTS, and LLM providers, manage deployments to Kubernetes, and generate embeddable widgets for websites.

## Features

### Agent Configuration
- **Speech-to-Text (STT)**: Support for Deepgram and Speechmatics
- **Text-to-Speech (TTS)**: Support for ElevenLabs, Speechmatics, and Cartesia with voice selection
- **Language Models (LLM)**: Support for OpenAI, Anthropic, Gemini, and RealTime API
- **Advanced Capabilities**:
  - Vision support (Gemini Vision API)
  - Screen sharing
  - Transcription
  - Multi-lingual support
- **Avatar Selection**: BitHuman local model integration
- **Custom Prompts**: Define agent personality and behavior
- **MCP Gateway**: Model Context Protocol integration

### Global Configuration
- Centralized LiveKit server settings (URL, API keys)
- Optional LangFuse tracing for observability
- Admin-only settings management
- Environment variable support

### Deployment & Testing
- **Kubernetes Deployment**: Automatic generation of K8s manifests (Deployment, Service, ConfigMap, Secret)
- **Widget System**: Generate embeddable chat widgets for any website
- **Agent Testing**: Interactive preview page to test agents before deployment
- **Deployment Status Tracking**: Monitor agent deployment states

### Security & Access Control
- Role-based access control (admin/user)
- Protected API endpoints
- Secure credential management via Kubernetes secrets

## Prerequisites

- Node.js 22.x
- MySQL/TiDB database
- LiveKit server (running on Kubernetes cluster)
- Optional: LangFuse instance for tracing
- Optional: Kubernetes cluster for agent deployment

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd livekit-agent-builder
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   The application requires the following environment variables (automatically configured in Manus platform):
   - `DATABASE_URL`: MySQL/TiDB connection string
   - `JWT_SECRET`: Session cookie signing secret
   - `VITE_APP_ID`: OAuth application ID
   - `OAUTH_SERVER_URL`: OAuth backend base URL
   - `VITE_OAUTH_PORTAL_URL`: OAuth login portal URL

   Optional LiveKit/LangFuse configuration (can be set via UI or environment):
   - `LIVEKIT_URL`: LiveKit server WebSocket URL
   - `LIVEKIT_API_KEY`: LiveKit API key
   - `LIVEKIT_API_SECRET`: LiveKit API secret
   - `LANGFUSE_ENABLED`: Enable LangFuse tracing (true/false)
   - `LANGFUSE_PUBLIC_KEY`: LangFuse public API key
   - `LANGFUSE_SECRET_KEY`: LangFuse secret API key
   - `LANGFUSE_BASE_URL`: LangFuse instance URL

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Usage

### First-Time Setup

1. **Sign in** using the authentication system
2. **Configure Global Settings** (Admin only):
   - Navigate to Settings (gear icon in top-right)
   - Enter your LiveKit server details
   - Optionally enable LangFuse tracing
   - Save settings

### Creating an Agent

1. Click **"Create Agent"** on the dashboard
2. Fill in the agent configuration:
   - **Basic Info**: Name and description
   - **STT Provider**: Choose speech-to-text provider
   - **TTS Provider**: Choose text-to-speech provider and voice
   - **LLM Provider**: Choose language model and specific model
   - **Features**: Enable vision, screen share, transcription as needed
   - **Languages**: Specify supported language codes (comma-separated)
   - **Avatar**: Select BitHuman model (optional)
   - **System Prompt**: Define agent personality and behavior
   - **MCP Gateway**: Configure Model Context Protocol connection (optional)
3. Click **"Create Agent"** to save

### Testing an Agent

1. Open an existing agent configuration
2. Click the **"Test"** button
3. A widget preview page will open
4. Click the blue chat button in the bottom-right to interact with the agent
5. Test the agent's responses and behavior

**Note**: The test page shows a demo interface. In production, the widget connects to your deployed LiveKit agent for real voice/video interaction.

### Deploying an Agent

1. Open an existing agent configuration
2. Click the **"Deploy"** button
3. Review the generated Kubernetes manifests:
   - **Deployment**: Agent pod configuration
   - **Service**: Network exposure
   - **ConfigMap**: Agent configuration
   - **Secret**: LiveKit and LangFuse credentials
4. Copy the manifest and apply to your Kubernetes cluster:
   ```bash
   kubectl apply -f agent-manifest.yaml
   ```
5. The agent will be deployed to the `agents` namespace

### Embedding the Widget

1. After deploying an agent, navigate to the Deploy page
2. Copy the widget snippet code
3. Paste the code into your website's HTML before the closing `</body>` tag
4. Customize the widget appearance by modifying the configuration object:
   ```javascript
   {
     theme: "light",           // or "dark"
     position: "bottom-right", // or "bottom-left", "top-right", "top-left"
     primaryColor: "#3b82f6",  // Any hex color
     buttonText: "Chat with us",
     agentId: 123,
     agentName: "Support Agent"
   }
   ```

## Architecture

### Technology Stack
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Wouter (routing)
- **Backend**: Express 4, tRPC 11, Drizzle ORM
- **Database**: MySQL/TiDB
- **Authentication**: Manus OAuth
- **Deployment**: Kubernetes

### Project Structure
```
client/
  src/
    pages/           # Page components
      AgentsDashboard.tsx    # Main agent list
      AgentConfig.tsx        # Agent configuration form
      AgentDeploy.tsx        # Deployment & widget generation
      AgentTest.tsx          # Agent testing interface
      Settings.tsx           # Global settings (admin only)
    components/      # Reusable UI components
    lib/trpc.ts      # tRPC client setup
    App.tsx          # Routes and layout

server/
  routers.ts         # tRPC API endpoints
  db.ts              # Database helpers
  settings.ts        # Settings management
  k8s.ts             # Kubernetes manifest generator
  widget.ts          # Widget code generator
  *.test.ts          # Unit tests

drizzle/
  schema.ts          # Database schema
  migrations/        # Database migrations
```

### Database Schema

**users** - User authentication and roles
- id, openId, name, email, role, timestamps

**agents** - Agent configurations
- id, userId, name, description
- sttProvider, sttConfig, ttsProvider, ttsConfig, voiceId
- llmProvider, llmModel, llmConfig
- visionEnabled, screenShareEnabled, transcribeEnabled
- languages, avatarModel, systemPrompt
- mcpGatewayUrl, mcpConfig
- deploymentStatus, deploymentNamespace, kubernetesManifest
- widgetConfig, widgetSnippet
- timestamps

**settings** - Global configuration
- id, key, value, description, updatedAt

## API Reference

### Agent Management
- `agents.list` - List all user's agents
- `agents.get` - Get agent by ID
- `agents.create` - Create new agent
- `agents.update` - Update agent configuration
- `agents.delete` - Delete agent
- `agents.generateManifest` - Generate Kubernetes manifest
- `agents.generateWidget` - Generate widget snippet

### Settings Management (Admin only)
- `settings.getAll` - Get all settings
- `settings.update` - Update a setting value

## Testing

Run the test suite:
```bash
pnpm test
```

Tests cover:
- Authentication flows
- Agent CRUD operations
- Kubernetes manifest generation
- Widget generation
- Settings management
- Access control

## Deployment Workflow

1. **Configure Global Settings**: Set LiveKit and LangFuse credentials (one-time setup)
2. **Create Agent**: Define agent configuration through the UI
3. **Test Agent**: Use the test page to verify agent behavior
4. **Generate Manifest**: Click Deploy to generate Kubernetes manifests
5. **Apply to Cluster**: Use `kubectl apply` to deploy the agent
6. **Generate Widget**: Get the embeddable code snippet
7. **Embed on Website**: Add the widget code to your website

## LangFuse Integration

When LangFuse is enabled in global settings, all agents automatically get:
- Conversation tracing
- Performance metrics
- Error tracking
- Usage analytics

Access traces at your LangFuse instance URL.

## Kubernetes Agent Deployment

Agents are deployed as Kubernetes Deployments in the `agents` namespace with:
- **Resource Limits**: Configurable CPU/memory
- **Environment Variables**: Agent configuration via ConfigMap
- **Secrets**: LiveKit and LangFuse credentials
- **Service**: ClusterIP service for internal access
- **Scaling**: Single replica by default (configurable)

## Security Considerations

1. **Credentials**: LiveKit and LangFuse credentials are stored in Kubernetes Secrets (base64 encoded)
2. **Access Control**: Only authenticated users can create agents; only admins can modify global settings
3. **API Keys**: Never expose API keys in widget code - agents connect via secure backend
4. **CORS**: Configure appropriate CORS settings for widget embedding

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` environment variable
- Check database server accessibility
- Run `pnpm db:push` to ensure schema is up-to-date

### Agent Deployment Failures
- Verify LiveKit settings are configured
- Check Kubernetes cluster connectivity
- Ensure `agents` namespace exists: `kubectl create namespace agents`
- Verify secrets are created correctly

### Widget Not Loading
- Check browser console for errors
- Verify agent is deployed and running
- Ensure CORS is configured on LiveKit server
- Check widget configuration matches agent ID

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]
- Email: [support-email]
