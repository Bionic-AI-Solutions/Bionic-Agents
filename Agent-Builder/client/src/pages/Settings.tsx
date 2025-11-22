import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    livekit_url: "",
    livekit_api_key: "",
    livekit_api_secret: "",
    langfuse_enabled: "false",
    langfuse_public_key: "",
    langfuse_secret_key: "",
    langfuse_base_url: "https://cloud.langfuse.com",
  });

  const { data: settings, isLoading } = trpc.settings.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateSetting = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        livekit_url: settings.livekit_url || "",
        livekit_api_key: settings.livekit_api_key || "",
        livekit_api_secret: settings.livekit_api_secret || "",
        langfuse_enabled: settings.langfuse_enabled || "false",
        langfuse_public_key: settings.langfuse_public_key || "",
        langfuse_secret_key: settings.langfuse_secret_key || "",
        langfuse_base_url: settings.langfuse_base_url || "https://cloud.langfuse.com",
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save all settings
    for (const [key, value] of Object.entries(formData)) {
      await updateSetting.mutateAsync({ key, value });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. Only administrators can access settings.</p>
      </div>
    );
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Global Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure LiveKit and LangFuse for all agents
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LiveKit Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>LiveKit Server</CardTitle>
              <CardDescription>
                Connection settings for your LiveKit cluster. These will be used by all agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="livekit_url">LiveKit URL *</Label>
                <Input
                  id="livekit_url"
                  value={formData.livekit_url}
                  onChange={(e) => setFormData({ ...formData, livekit_url: e.target.value })}
                  placeholder="wss://livekit.example.com"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  WebSocket URL of your LiveKit server
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="livekit_api_key">API Key *</Label>
                <Input
                  id="livekit_api_key"
                  value={formData.livekit_api_key}
                  onChange={(e) => setFormData({ ...formData, livekit_api_key: e.target.value })}
                  placeholder="APIxxxxxxxxxxxxx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="livekit_api_secret">API Secret *</Label>
                <Input
                  id="livekit_api_secret"
                  type="password"
                  value={formData.livekit_api_secret}
                  onChange={(e) => setFormData({ ...formData, livekit_api_secret: e.target.value })}
                  placeholder="Enter API secret"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* LangFuse Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>LangFuse Tracing</CardTitle>
              <CardDescription>
                Enable observability and tracing for all agents. Optional but recommended.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="langfuse_enabled">Enable LangFuse</Label>
                <select
                  id="langfuse_enabled"
                  value={formData.langfuse_enabled}
                  onChange={(e) => setFormData({ ...formData, langfuse_enabled: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              {formData.langfuse_enabled === "true" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="langfuse_public_key">Public Key</Label>
                    <Input
                      id="langfuse_public_key"
                      value={formData.langfuse_public_key}
                      onChange={(e) => setFormData({ ...formData, langfuse_public_key: e.target.value })}
                      placeholder="pk-lf-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="langfuse_secret_key">Secret Key</Label>
                    <Input
                      id="langfuse_secret_key"
                      type="password"
                      value={formData.langfuse_secret_key}
                      onChange={(e) => setFormData({ ...formData, langfuse_secret_key: e.target.value })}
                      placeholder="sk-lf-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="langfuse_base_url">Base URL</Label>
                    <Input
                      id="langfuse_base_url"
                      value={formData.langfuse_base_url}
                      onChange={(e) => setFormData({ ...formData, langfuse_base_url: e.target.value })}
                      placeholder="https://cloud.langfuse.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use https://cloud.langfuse.com for LangFuse Cloud or your self-hosted URL
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> These settings are shared across all agents. Changes will apply to new deployments and redeployments.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={updateSetting.isPending}
              className="flex-1"
            >
              {updateSetting.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
