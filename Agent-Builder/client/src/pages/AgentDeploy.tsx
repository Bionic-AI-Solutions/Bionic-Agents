import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Download, Loader2, Play, Square } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";

export default function AgentDeploy() {
  const [, params] = useRoute("/agents/:id/deploy");
  const { isAuthenticated } = useAuth();
  const agentId = parseInt(params?.id || "0");

  const { data: agent, isLoading, refetch } = trpc.agents.get.useQuery(
    { id: agentId },
    { enabled: !!agentId }
  );

  const generateManifest = trpc.agents.generateManifest.useMutation({
    onSuccess: () => {
      toast.success("Kubernetes manifest generated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate manifest: ${error.message}`);
    },
  });

  const deploy = trpc.agents.deploy.useMutation({
    onSuccess: () => {
      toast.success("Agent deployment started");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to deploy agent: ${error.message}`);
    },
  });

  const undeploy = trpc.agents.undeploy.useMutation({
    onSuccess: () => {
      toast.success("Agent stopped");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to stop agent: ${error.message}`);
    },
  });

  const generateWidget = trpc.agents.generateWidget.useMutation({
    onSuccess: () => {
      toast.success("Widget snippet generated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate widget: ${error.message}`);
    },
  });

  const [widgetConfig, setWidgetConfig] = useState({
    theme: "light" as "light" | "dark",
    position: "bottom-right" as "bottom-right" | "bottom-left" | "top-right" | "top-left",
    primaryColor: "#3b82f6",
    buttonText: "Chat with AI",
  });

  const [copied, setCopied] = useState<"manifest" | "widget" | null>(null);

  const handleCopy = (text: string, type: "manifest" | "widget") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadManifest = () => {
    if (!agent?.kubernetesManifest) return;
    const blob = new Blob([agent.kubernetesManifest], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-${agent.id}-manifest.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h1 className="text-4xl font-bold tracking-tight">Deploy Agent</h1>
          <p className="text-muted-foreground mt-2">{agent.name}</p>
        </div>

        <div className="space-y-6">
          {/* Deployment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>Current status of your agent deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{agent.deploymentStatus}</p>
                </div>
                <div className="flex gap-2">
                  {agent.deploymentStatus === "deployed" ? (
                    <Button
                      onClick={() => undeploy.mutate({ id: agent.id })}
                      disabled={undeploy.isPending}
                      variant="destructive"
                    >
                      {undeploy.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Square className="h-4 w-4 mr-2" />
                      Stop Agent
                    </Button>
                  ) : (
                    <Button
                      onClick={() => deploy.mutate({ id: agent.id })}
                      disabled={deploy.isPending || agent.deploymentStatus === "deploying"}
                    >
                      {deploy.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Play className="h-4 w-4 mr-2" />
                      Deploy Agent
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kubernetes Manifest */}
          <Card>
            <CardHeader>
              <CardTitle>Kubernetes Manifest</CardTitle>
              <CardDescription>
                Generate and download the Kubernetes deployment manifest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => generateManifest.mutate({ id: agent.id })}
                disabled={generateManifest.isPending}
              >
                {generateManifest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Manifest
              </Button>

              {agent.kubernetesManifest && (
                <>
                  <div className="relative">
                    <Textarea
                      value={agent.kubernetesManifest}
                      readOnly
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(agent.kubernetesManifest!, "manifest")}
                      >
                        {copied === "manifest" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadManifest}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Deployment Command:</p>
                    <code className="text-sm">
                      kubectl apply -f agent-{agent.id}-manifest.yaml -n{" "}
                      {agent.deploymentNamespace}
                    </code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Widget Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Embeddable Widget</CardTitle>
              <CardDescription>
                Customize and generate the widget snippet for your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={widgetConfig.theme}
                    onValueChange={(value: "light" | "dark") =>
                      setWidgetConfig({ ...widgetConfig, theme: value })
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={widgetConfig.position}
                    onValueChange={(
                      value: "bottom-right" | "bottom-left" | "top-right" | "top-left"
                    ) => setWidgetConfig({ ...widgetConfig, position: value })}
                  >
                    <SelectTrigger id="position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={widgetConfig.primaryColor}
                    onChange={(e) =>
                      setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={widgetConfig.buttonText}
                    onChange={(e) =>
                      setWidgetConfig({ ...widgetConfig, buttonText: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  generateWidget.mutate({
                    id: agent.id,
                    ...widgetConfig,
                  })
                }
                disabled={generateWidget.isPending}
              >
                {generateWidget.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Widget Snippet
              </Button>

              {agent.widgetSnippet && (
                <div className="relative">
                  <Textarea
                    value={agent.widgetSnippet}
                    readOnly
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(agent.widgetSnippet!, "widget")}
                  >
                    {copied === "widget" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
