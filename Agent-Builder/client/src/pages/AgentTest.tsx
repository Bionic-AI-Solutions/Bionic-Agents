import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";

// TypeScript declaration for LiveKit widget
declare global {
  interface Window {
    LiveKitAgentWidget: new (config: {
      agentId: number;
      agentName: string;
      apiUrl: string;
      theme?: string;
      position?: string;
      primaryColor?: string;
      buttonText?: string;
    }) => {
      close: () => void;
    };
    livekitWidgetInstance?: {
      close: () => void;
    };
  }
}

export default function AgentTest() {
  const [, params] = useRoute("/agents/:id/test");
  const { isAuthenticated } = useAuth();
  const agentId = parseInt(params?.id || "0");
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const { data: agent, isLoading } = trpc.agents.get.useQuery(
    { id: agentId },
    { enabled: !!agentId }
  );

  // Load real LiveKit widget when agent data is available
  useEffect(() => {
    if (!agent || widgetLoaded) return;

    // Load the LiveKit widget script
    const loadWidgetScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script is already loaded
        if (window.LiveKitAgentWidget) {
          resolve();
          return;
        }

        // Check if the script tag already exists
        const existingScript = document.querySelector('script[src="/livekit-widget.js"]');
        if (existingScript) {
          // Wait for it to load
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load widget script')));
          return;
        }

        // Load the widget script
        const script = document.createElement('script');
        script.src = '/livekit-widget.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load LiveKit widget script'));
        document.head.appendChild(script);
      });
    };

    // Initialize the widget after script loads
    loadWidgetScript()
      .then(() => {
        if (!window.LiveKitAgentWidget) {
          console.error('LiveKitAgentWidget not found after script load');
          return;
        }

        // Initialize the real LiveKit widget
        const widget = new window.LiveKitAgentWidget({
          agentId: agent.id,
          agentName: agent.name,
          apiUrl: window.location.origin,
          theme: "light",
          position: "bottom-right",
          primaryColor: "#3b82f6",
          buttonText: `Chat with ${agent.name}`,
        });

        // Store widget instance for cleanup
        (window as any).livekitWidgetInstance = widget;
        setWidgetLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load LiveKit widget:', error);
        // Fallback: show error message
        if (widgetContainerRef.current) {
          widgetContainerRef.current.innerHTML = `
            <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c33;">
              <strong>Error loading widget:</strong> ${error.message}
              <br />
              <small>Make sure the livekit-widget.js file is available in the public folder.</small>
            </div>
          `;
        }
      });

    // Cleanup
    return () => {
      if ((window as any).livekitWidgetInstance) {
        try {
          (window as any).livekitWidgetInstance.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        delete (window as any).livekitWidgetInstance;
      }
    };
  }, [agent, widgetLoaded]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Agent not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Test Agent</h1>
          <p className="text-muted-foreground mt-2">{agent.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              Test your agent by clicking the chat button in the bottom-right corner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-6 rounded-lg min-h-[400px] relative">
              <p className="text-center text-muted-foreground">
                Your widget will appear in the bottom-right corner of this page.
                <br />
                Click the blue chat button to start testing.
              </p>
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Agent Configuration:</h3>
                  <ul className="space-y-1 text-sm">
                    <li><strong>STT:</strong> {agent.sttProvider}</li>
                    <li><strong>TTS:</strong> {agent.ttsProvider}</li>
                    <li><strong>LLM:</strong> {agent.llmProvider} ({agent.llmModel})</li>
                    <li><strong>Vision:</strong> {agent.visionEnabled ? "Enabled" : "Disabled"}</li>
                    <li><strong>Screen Share:</strong> {agent.screenShareEnabled ? "Enabled" : "Disabled"}</li>
                    <li><strong>Transcription:</strong> {agent.transcribeEnabled ? "Enabled" : "Disabled"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Ready to Test:</strong> Click the chat button in the bottom-right corner to start a real conversation with your agent. 
                Make sure your agent is deployed and the Agent-Runtime is running for the agent to respond.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Widget container */}
        <div ref={widgetContainerRef} />
      </div>
    </div>
  );
}
