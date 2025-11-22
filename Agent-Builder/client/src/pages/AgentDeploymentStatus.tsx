import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AgentDeploymentStatus() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const agentId = params.id ? parseInt(params.id) : 0;

  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: agent, isLoading: agentLoading } = trpc.agents.get.useQuery({ id: agentId });
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.agents.getDeploymentStatus.useQuery(
    { id: agentId },
    {
      enabled: !!agentId,
      refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
    }
  );
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.agents.getLogs.useQuery(
    { id: agentId, tailLines: 100 },
    {
      enabled: !!agentId && !!status?.deployed,
      refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh logs every 10 seconds
    }
  );

  const undeployMutation = trpc.agents.undeploy.useMutation({
    onSuccess: () => {
      toast.success("Agent undeployed successfully");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Failed to undeploy agent: ${error.message}`);
    },
  });

  const handleUndeploy = () => {
    if (confirm("Are you sure you want to undeploy this agent?")) {
      undeployMutation.mutate({ id: agentId });
    }
  };

  const getStatusIcon = (statusStr?: string) => {
    switch (statusStr) {
      case "Running":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "Progressing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "Pending":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (statusStr?: string) => {
    switch (statusStr) {
      case "Running":
        return "bg-green-100 text-green-800 border-green-200";
      case "Progressing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPodStatusColor = (podStatus?: string) => {
    switch (podStatus) {
      case "Running":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-500";
      case "Failed":
        return "bg-red-500";
      case "Succeeded":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">Deployment Status & Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStatus();
              refetchLogs();
            }}
            disabled={statusLoading || logsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(statusLoading || logsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Disable" : "Enable"} Auto-refresh
          </Button>
          {status?.deployed && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUndeploy}
              disabled={undeployMutation.isPending}
            >
              {undeployMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Undeploying...
                </>
              ) : (
                "Undeploy"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(status?.status)}
            Deployment Status
          </CardTitle>
          <CardDescription>
            Real-time status of your agent deployment on Kubernetes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.deployed ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Agent Not Deployed</p>
              <p className="text-sm text-gray-500 mt-2">
                This agent is not currently deployed to the Kubernetes cluster
              </p>
              {status?.error && (
                <p className="text-sm text-red-500 mt-2">Error: {status.error}</p>
              )}
            </div>
          ) : (
            <>
              {/* Overall Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(status.status)} variant="outline">
                    {status.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Replicas</p>
                  <p className="text-2xl font-bold">
                    {status.replicas?.ready || 0} / {status.replicas?.desired || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{status.replicas?.available || 0}</p>
                </div>
              </div>

              {/* Pods */}
              {status.pods && status.pods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Pods</h3>
                  <div className="space-y-2">
                    {status.pods.map((pod) => (
                      <div
                        key={pod.name}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getPodStatusColor(pod.status)}`} />
                          <div>
                            <p className="font-medium text-sm">{pod.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Status: {pod.status} • Age: {pod.age}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Ready</p>
                            <p className="text-sm font-medium">
                              {pod.ready ? "Yes" : "No"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Restarts</p>
                            <p className="text-sm font-medium">{pod.restarts}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      {status?.deployed && (
        <Card>
          <CardHeader>
            <CardTitle>Pod Logs</CardTitle>
            <CardDescription>
              Recent logs from the agent pod (last 100 lines)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : logs?.success ? (
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                <pre>{logs.logs || "No logs available"}</pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {logs?.error || "Unable to fetch logs"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
