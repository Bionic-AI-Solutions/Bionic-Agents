# LiveKit Widget Integration Guide

This guide explains how the production LiveKit widget works and how to integrate it into your website.

## Overview

The LiveKit Agent Widget provides a fully functional, production-ready chat interface that connects to your deployed LiveKit agents. It uses the official LiveKit client SDK to establish real-time voice and video connections.

## Architecture

### Components

1. **Backend API** (`server/livekit.ts`)
   - Generates LiveKit access tokens using the LiveKit Server SDK
   - Validates agent existence
   - Retrieves LiveKit server configuration from global settings

2. **Widget JavaScript** (`client/public/livekit-widget.js`)
   - Self-contained widget that loads the LiveKit client SDK from CDN
   - Manages room connections, audio/video tracks, and UI state
   - Handles reconnection and error states

3. **Widget Generator** (`server/widget.ts`)
   - Generates embeddable HTML snippet with configuration
   - Customizable theme, position, and colors

## How It Works

### 1. Widget Initialization

When the widget snippet is embedded on a website:

```html
<script src="https://your-app.com/livekit-widget.js"></script>
<script>
new window.LiveKitAgentWidget({
  agentId: 123,
  agentName: "Support Agent",
  apiUrl: "https://your-app.com",
  theme: "light",
  position: "bottom-right",
  primaryColor: "#3b82f6"
});
</script>
```

### 2. Connection Flow

1. **User clicks the chat button**
2. Widget calls `/api/trpc/livekit.getToken` with the agent ID
3. Backend validates the agent and generates a LiveKit JWT token
4. Widget receives: `{ token, url, roomName, agentName }`
5. Widget connects to LiveKit room using the token
6. LiveKit agent (deployed on Kubernetes) joins the same room
7. Real-time audio/video communication begins

### 3. LiveKit Token Generation

The backend generates secure JWT tokens with these grants:

```typescript
{
  roomJoin: true,
  room: `agent-${agentId}-room`,
  canPublish: true,      // User can send audio/video
  canSubscribe: true,    // User can receive audio/video
  canPublishData: true,  // User can send data messages
}
```

### 4. Room Management

- Each agent gets a unique room: `agent-{id}-room`
- Multiple users can join the same agent's room simultaneously
- The LiveKit agent (Python process) joins the room and handles conversations
- Audio/video tracks are automatically managed by LiveKit

## Configuration Requirements

### Global Settings (Admin Only)

Before the widget can work, configure these settings in the Settings page:

1. **LiveKit URL**: WebSocket URL of your LiveKit server
   - Example: `wss://livekit.example.com`
   - This is where the widget connects to

2. **LiveKit API Key**: Your LiveKit API key
   - Example: `APIxxxxxxxxxxxxx`
   - Used to generate access tokens

3. **LiveKit API Secret**: Your LiveKit API secret
   - Used to sign JWT tokens
   - Keep this secure!

4. **LangFuse** (Optional): Enable tracing for observability

### Agent Deployment

The agent must be deployed to your Kubernetes cluster:

1. Configure the agent in the UI
2. Click "Deploy" to generate Kubernetes manifests
3. Apply manifests to your cluster:
   ```bash
   kubectl apply -f agent-manifest.yaml
   ```

The deployed agent will:
- Listen for participants joining its room
- Use the configured STT/TTS/LLM providers
- Follow the system prompt/persona
- Optionally use vision, screen share, transcription features

## Widget Features

### Audio Controls
- **Microphone Toggle**: Mute/unmute your microphone
- **Video Toggle**: Enable/disable your camera
- **Hang Up**: Disconnect from the agent

### Connection States
- **Connecting**: Shows spinner while establishing connection
- **Connected**: Displays agent name and video feed
- **Disconnected**: Shows error message and closes after timeout

### Responsive Design
- Adapts to mobile screens
- Customizable position (4 corners)
- Customizable colors and theme

## Security Considerations

### Token Security
- Tokens are generated on the backend (never exposed to client)
- Tokens are short-lived JWT tokens
- Each token is scoped to a specific room

### CORS Configuration
- LiveKit server must allow connections from your widget domains
- Configure CORS in your LiveKit server settings

### API Access
- The `livekit.getToken` endpoint is public (no auth required)
- This allows widgets on any website to connect
- Consider adding rate limiting or domain whitelisting for production

## Troubleshooting

### Widget Won't Connect

**Check LiveKit Settings**:
```bash
# In Settings page, verify:
- LiveKit URL is correct (wss://...)
- API Key and Secret are valid
- Test connection from backend
```

**Check Browser Console**:
```javascript
// Look for errors like:
- "Failed to get connection token"
- "Connection failed"
- "Agent not found"
```

**Check Network**:
- Ensure WebSocket connections are allowed
- Check firewall rules
- Verify LiveKit server is accessible

### No Audio/Video

**Check Permissions**:
- Browser must grant microphone/camera permissions
- Check browser settings for blocked permissions

**Check LiveKit Agent**:
- Verify agent is deployed and running
- Check agent logs: `kubectl logs -n agents deployment/agent-{id}`
- Ensure agent joins the room

**Check Tracks**:
- Open browser DevTools → Console
- Look for "TrackSubscribed" events
- Verify audio tracks are being published

### Agent Not Responding

**Check Agent Configuration**:
- Verify STT/TTS/LLM providers are configured
- Check API keys in Kubernetes secrets
- Review system prompt

**Check LangFuse Traces** (if enabled):
- Open LangFuse dashboard
- Find traces for your agent
- Look for errors in LLM calls

## Advanced Customization

### Custom Styling

The widget uses CSS variables for theming:

```javascript
new window.LiveKitAgentWidget({
  // ... other config
  primaryColor: "#your-brand-color",
  theme: "dark" // or "light"
});
```

### Multiple Agents

You can embed multiple widgets on the same page:

```html
<script src="/livekit-widget.js"></script>
<script>
  // Sales agent
  new window.LiveKitAgentWidget({
    agentId: 1,
    agentName: "Sales",
    position: "bottom-right"
  });
  
  // Support agent
  new window.LiveKitAgentWidget({
    agentId: 2,
    agentName: "Support",
    position: "bottom-left"
  });
</script>
```

### Event Handling

The widget emits events you can listen to:

```javascript
const widget = new window.LiveKitAgentWidget({...});

// Access the room object
widget.room.on('connected', () => {
  console.log('Connected to agent!');
});

widget.room.on('disconnected', () => {
  console.log('Disconnected from agent');
});
```

## Production Checklist

- [ ] LiveKit server is deployed and accessible
- [ ] Global settings are configured (URL, API keys)
- [ ] Agents are deployed to Kubernetes
- [ ] Widget snippet is embedded on website
- [ ] CORS is configured on LiveKit server
- [ ] SSL/TLS is enabled (required for WebRTC)
- [ ] Rate limiting is configured (optional)
- [ ] LangFuse tracing is enabled (optional)
- [ ] Monitoring and alerts are set up
- [ ] Tested on multiple browsers and devices

## API Reference

### `POST /api/trpc/livekit.getToken`

Generate a LiveKit access token for connecting to an agent's room.

**Request Body**:
```json
{
  "agentId": 123,
  "participantName": "Guest"
}
```

**Response**:
```json
{
  "result": {
    "data": {
      "token": "eyJhbGc...",
      "url": "wss://livekit.example.com",
      "roomName": "agent-123-room",
      "agentName": "Support Agent"
    }
  }
}
```

**Errors**:
- `400`: Invalid agent ID
- `404`: Agent not found
- `500`: LiveKit not configured or token generation failed

## Support

For issues or questions:
- Check the main README.md
- Review LiveKit documentation: https://docs.livekit.io
- Check agent logs in Kubernetes
- Enable LangFuse for detailed tracing
