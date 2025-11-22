import type { Agent } from "../drizzle/schema";

export interface WidgetConfig {
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  primaryColor?: string;
  buttonText?: string;
}

/**
 * Generate embeddable widget snippet for an agent using production LiveKit SDK
 */
export function generateWidgetSnippet(
  agent: Agent,
  baseUrl: string,
  config?: WidgetConfig
): string {
  const widgetConfig = {
    agentId: agent.id,
    agentName: agent.name,
    apiUrl: baseUrl,
    theme: config?.theme || "light",
    position: config?.position || "bottom-right",
    primaryColor: config?.primaryColor || "#3b82f6",
    buttonText: config?.buttonText || "Chat with AI",
  };

  return `<!-- LiveKit Agent Widget -->
<script src="${baseUrl}/livekit-widget.js"></script>
<script>
(function() {
  // Initialize LiveKit Agent Widget
  new window.LiveKitAgentWidget(${JSON.stringify(widgetConfig, null, 2)});
})();
</script>
<!-- End LiveKit Agent Widget -->`;
}

/**
 * Save widget configuration to database
 */
export function saveWidgetConfig(config: WidgetConfig): string {
  return JSON.stringify(config);
}
