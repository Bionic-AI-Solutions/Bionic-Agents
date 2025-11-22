import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";

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

  // Load widget when agent data is available
  useEffect(() => {
    if (!agent || widgetLoaded) return;

    // Create widget configuration
    const config = {
      agentId: agent.id,
      agentName: agent.name,
      theme: "light",
      position: "bottom-right",
      primaryColor: "#3b82f6",
      buttonText: `Chat with ${agent.name}`,
      avatarUrl: "",
      features: {
        vision: agent.visionEnabled === 1,
        screenShare: agent.screenShareEnabled === 1,
        transcribe: agent.transcribeEnabled === 1,
      },
    };

    // Inject widget styles
    const style = document.createElement("style");
    style.textContent = `
      .livekit-widget-button {
        position: fixed;
        z-index: 9998;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${config.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        bottom: 20px;
        right: 20px;
      }
      
      .livekit-widget-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      .livekit-widget-button svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      
      .livekit-widget-modal {
        position: fixed;
        z-index: 9999;
        width: 400px;
        height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        bottom: 90px;
        right: 20px;
      }
      
      .livekit-widget-modal.open {
        display: flex;
      }
      
      .livekit-widget-header {
        background-color: ${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .livekit-widget-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .livekit-widget-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        padding: 0;
        width: 24px;
        height: 24px;
      }
      
      .livekit-widget-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 20px;
      }
      
      .livekit-widget-messages {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 16px;
      }
      
      .livekit-widget-message {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        max-width: 80%;
      }
      
      .livekit-widget-message.user {
        background-color: ${config.primaryColor};
        color: white;
        margin-left: auto;
      }
      
      .livekit-widget-message.agent {
        background-color: #f3f4f6;
        color: #1f2937;
      }
      
      .livekit-widget-input-container {
        display: flex;
        gap: 8px;
      }
      
      .livekit-widget-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
      }
      
      .livekit-widget-send {
        padding: 10px 16px;
        background-color: ${config.primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
      }
      
      @media (max-width: 480px) {
        .livekit-widget-modal {
          width: calc(100vw - 40px);
          height: calc(100vh - 140px);
        }
      }
    `;
    document.head.appendChild(style);

    // Create button
    const button = document.createElement("button");
    button.className = "livekit-widget-button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;

    // Create modal
    const modal = document.createElement("div");
    modal.className = "livekit-widget-modal";
    modal.innerHTML = `
      <div class="livekit-widget-header">
        <h3>${config.agentName}</h3>
        <button class="livekit-widget-close">&times;</button>
      </div>
      <div class="livekit-widget-content">
        <div class="livekit-widget-messages" id="livekit-messages">
          <div class="livekit-widget-message agent">
            Hello! I'm ${config.agentName}. How can I help you today?
          </div>
        </div>
        <div class="livekit-widget-input-container">
          <input 
            type="text" 
            class="livekit-widget-input" 
            placeholder="Type your message..."
            id="livekit-input"
          />
          <button class="livekit-widget-send" id="livekit-send">Send</button>
        </div>
      </div>
    `;

    if (widgetContainerRef.current) {
      widgetContainerRef.current.appendChild(button);
      widgetContainerRef.current.appendChild(modal);
    }

    // Add event listeners
    button.addEventListener("click", () => {
      modal.classList.toggle("open");
    });

    const closeBtn = modal.querySelector(".livekit-widget-close");
    closeBtn?.addEventListener("click", () => {
      modal.classList.remove("open");
    });

    const input = modal.querySelector("#livekit-input") as HTMLInputElement;
    const sendBtn = modal.querySelector("#livekit-send");
    const messagesContainer = modal.querySelector("#livekit-messages");

    const sendMessage = () => {
      if (!input.value.trim()) return;

      const messageDiv = document.createElement("div");
      messageDiv.className = "livekit-widget-message user";
      messageDiv.textContent = input.value;
      messagesContainer?.appendChild(messageDiv);

      // Simulate agent response
      setTimeout(() => {
        const responseDiv = document.createElement("div");
        responseDiv.className = "livekit-widget-message agent";
        responseDiv.textContent = "This is a demo response. In production, this would connect to your LiveKit agent.";
        messagesContainer?.appendChild(responseDiv);
        messagesContainer?.scrollTo(0, messagesContainer.scrollHeight);
      }, 1000);

      input.value = "";
      messagesContainer?.scrollTo(0, messagesContainer.scrollHeight);
    };

    sendBtn?.addEventListener("click", sendMessage);
    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    setWidgetLoaded(true);

    // Cleanup
    return () => {
      button.remove();
      modal.remove();
      style.remove();
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a demo preview. In production, the widget will connect to your deployed LiveKit agent and provide real voice/video interaction.
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
