import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, Rocket, Save, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function AgentConfig() {
  const [, params] = useRoute("/agents/:id");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const isNew = params?.id === "new";
  const agentId = isNew ? null : parseInt(params?.id || "0");

  const { data: agent, isLoading } = trpc.agents.get.useQuery(
    { id: agentId! },
    { enabled: !isNew && !!agentId }
  );

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: (data) => {
      toast.success("Agent created successfully");
      navigate(`/agents/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
      toast.success("Agent updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sttProvider: "deepgram",
    ttsProvider: "elevenlabs",
    voiceId: "",
    llmProvider: "openai",
    llmModel: "gpt-4o-mini",
    visionEnabled: false,
    screenShareEnabled: false,
    transcribeEnabled: false,
    languages: "en",
    avatarModel: "",
    systemPrompt: "You are a helpful AI assistant.",
    mcpGatewayUrl: "",
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || "",
        sttProvider: agent.sttProvider,
        ttsProvider: agent.ttsProvider,
        voiceId: agent.voiceId || "",
        llmProvider: agent.llmProvider,
        llmModel: agent.llmModel || "gpt-4o-mini",
        visionEnabled: agent.visionEnabled === 1,
        screenShareEnabled: agent.screenShareEnabled === 1,
        transcribeEnabled: agent.transcribeEnabled === 1,
        languages: agent.languages || "en",
        avatarModel: agent.avatarModel || "",
        systemPrompt: agent.systemPrompt || "You are a helpful AI assistant.",
        mcpGatewayUrl: agent.mcpGatewayUrl || "",
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      visionEnabled: formData.visionEnabled ? 1 : 0,
      screenShareEnabled: formData.screenShareEnabled ? 1 : 0,
      transcribeEnabled: formData.transcribeEnabled ? 1 : 0,
    };

    if (isNew) {
      await createAgent.mutateAsync(payload);
    } else if (agentId) {
      await updateAgent.mutateAsync({ id: agentId, ...payload });
    }
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            {isNew ? "Create New Agent" : "Configure Agent"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your LiveKit agent with custom STT, TTS, LLM, and more
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and describe your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="My Voice Agent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A helpful voice assistant for customer support"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Speech-to-Text */}
          <Card>
            <CardHeader>
              <CardTitle>Speech-to-Text (STT)</CardTitle>
              <CardDescription>Configure speech recognition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sttProvider">STT Provider *</Label>
                <Select
                  value={formData.sttProvider}
                  onValueChange={(value) => setFormData({ ...formData, sttProvider: value })}
                >
                  <SelectTrigger id="sttProvider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepgram">Deepgram</SelectItem>
                    <SelectItem value="speechmatics">Speechmatics</SelectItem>
                    <SelectItem value="google">Google Speech-to-Text</SelectItem>
                    <SelectItem value="azure">Azure Speech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Text-to-Speech */}
          <Card>
            <CardHeader>
              <CardTitle>Text-to-Speech (TTS)</CardTitle>
              <CardDescription>Configure voice synthesis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ttsProvider">TTS Provider *</Label>
                <Select
                  value={formData.ttsProvider}
                  onValueChange={(value) => setFormData({ ...formData, ttsProvider: value })}
                >
                  <SelectTrigger id="ttsProvider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="speechmatics">Speechmatics</SelectItem>
                    <SelectItem value="cartesia">Cartesia</SelectItem>
                    <SelectItem value="google">Google Text-to-Speech</SelectItem>
                    <SelectItem value="azure">Azure Speech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice ID</Label>
                <Input
                  id="voiceId"
                  value={formData.voiceId}
                  onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                  placeholder="Voice identifier from your TTS provider"
                />
              </div>
            </CardContent>
          </Card>

          {/* LLM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Language Model (LLM)</CardTitle>
              <CardDescription>Configure the AI brain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llmProvider">LLM Provider *</Label>
                <Select
                  value={formData.llmProvider}
                  onValueChange={(value) => setFormData({ ...formData, llmProvider: value })}
                >
                  <SelectTrigger id="llmProvider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="realtime">OpenAI Realtime API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="llmModel">Model</Label>
                <Input
                  id="llmModel"
                  value={formData.llmModel}
                  onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt / Persona</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={6}
                  placeholder="You are a helpful AI assistant..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable additional capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vision (Gemini Vision API)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable visual understanding capabilities
                  </p>
                </div>
                <Switch
                  checked={formData.visionEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, visionEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Screen Share</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow screen sharing in sessions
                  </p>
                </div>
                <Switch
                  checked={formData.screenShareEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, screenShareEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transcription</Label>
                  <p className="text-sm text-muted-foreground">
                    Record and transcribe conversations
                  </p>
                </div>
                <Switch
                  checked={formData.transcribeEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, transcribeEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Multi-lingual & Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Localization & Avatar</CardTitle>
              <CardDescription>Language and visual settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="en, es, fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarModel">Avatar Model (BitHuman)</Label>
                <Input
                  id="avatarModel"
                  value={formData.avatarModel}
                  onChange={(e) => setFormData({ ...formData, avatarModel: e.target.value })}
                  placeholder="model-name"
                />
              </div>
            </CardContent>
          </Card>

          {/* MCP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>MCP Gateway</CardTitle>
              <CardDescription>Model Context Protocol integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mcpGatewayUrl">MCP Gateway URL</Label>
                <Input
                  id="mcpGatewayUrl"
                  value={formData.mcpGatewayUrl}
                  onChange={(e) => setFormData({ ...formData, mcpGatewayUrl: e.target.value })}
                  placeholder="https://mcp-gateway.example.com"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createAgent.isPending || updateAgent.isPending}
              className="flex-1"
            >
              {(createAgent.isPending || updateAgent.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              {isNew ? "Create Agent" : "Save Changes"}
            </Button>
            {!isNew && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/agents/${agentId}/test`)}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => navigate(`/agents/${agentId}/deploy`)}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
