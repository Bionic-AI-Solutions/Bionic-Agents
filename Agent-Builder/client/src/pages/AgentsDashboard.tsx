import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Settings, Trash2, Settings as SettingsIcon, BarChart3, TestTube } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function AgentsDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: agents, isLoading, refetch } = trpc.agents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const deleteAgent = trpc.agents.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to manage your LiveKit agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await deleteAgent.mutateAsync({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">LiveKit Agents</h1>
            <p className="text-muted-foreground mt-2">
              Build and deploy AI agents with custom configurations
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === "admin" && (
              <Button asChild variant="outline">
                <Link href="/settings">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/agents/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {agent.description || "No description"}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        agent.deploymentStatus === "deployed"
                          ? "bg-green-100 text-green-800"
                          : agent.deploymentStatus === "deploying"
                          ? "bg-blue-100 text-blue-800"
                          : agent.deploymentStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {agent.deploymentStatus}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">STT:</span>
                      <span className="font-medium">{agent.sttProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TTS:</span>
                      <span className="font-medium">{agent.ttsProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LLM:</span>
                      <span className="font-medium">{agent.llmProvider}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/agents/${agent.id}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/agents/${agent.id}/test`}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </Link>
                    </Button>
                    {agent.deploymentStatus === "deployed" && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/agents/${agent.id}/status`}>
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleteAgent.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No agents yet. Create your first agent to get started.
              </p>
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
