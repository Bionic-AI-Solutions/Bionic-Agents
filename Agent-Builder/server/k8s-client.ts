import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import { getSetting } from "./settings";
import { generateK8sManifests, DeploymentMode } from "./k8s";
import type { Agent } from "../drizzle/schema";

/**
 * Initialize Kubernetes client from kubeconfig or in-cluster config
 */
export function getK8sClient() {
  const kc = new k8s.KubeConfig();
  
  try {
    // Try to load from default kubeconfig file
    kc.loadFromDefault();
  } catch (error) {
    // If that fails, try in-cluster config (when running inside K8s)
    try {
      kc.loadFromCluster();
    } catch (clusterError) {
      throw new Error(
        "Failed to load Kubernetes configuration. Ensure kubeconfig is available or running in-cluster."
      );
    }
  }

  return {
    kc,
    appsV1Api: kc.makeApiClient(k8s.AppsV1Api),
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),
    batchV1Api: kc.makeApiClient(k8s.BatchV1Api),
  };
}

/**
 * Serialize agent configuration for runtime registration
 */
async function serializeAgentConfig(agent: Agent): Promise<any> {
  const livekitConfig = await getSetting("livekit_url") ? {
    url: await getSetting("livekit_url"),
    apiKey: await getSetting("livekit_api_key"),
    apiSecret: await getSetting("livekit_api_secret"),
  } : null;

  const langfuseConfig = (await getSetting("langfuse_enabled")) === "true" ? {
    enabled: true,
    publicKey: await getSetting("langfuse_public_key"),
    secretKey: await getSetting("langfuse_secret_key"),
    baseUrl: await getSetting("langfuse_base_url"),
  } : null;

  let languages: string[] = [];
  try {
    if (agent.languages) {
      languages = JSON.parse(agent.languages);
    }
  } catch {
    languages = agent.languages?.split(",").map((l) => l.trim()) || ["en"];
  }

  return {
    name: agent.name,
    description: agent.description,
    sttProvider: agent.sttProvider,
    sttConfig: agent.sttConfig ? JSON.parse(agent.sttConfig) : {},
    ttsProvider: agent.ttsProvider,
    ttsConfig: agent.ttsConfig ? JSON.parse(agent.ttsConfig) : {},
    voiceId: agent.voiceId,
    llmProvider: agent.llmProvider,
    llmModel: agent.llmModel,
    llmConfig: agent.llmConfig ? JSON.parse(agent.llmConfig) : {},
    visionEnabled: agent.visionEnabled === 1,
    screenShareEnabled: agent.screenShareEnabled === 1,
    transcribeEnabled: agent.transcribeEnabled === 1,
    languages,
    avatarModel: agent.avatarModel,
    systemPrompt: agent.systemPrompt,
    mcpGatewayUrl: agent.mcpGatewayUrl,
    mcpConfig: agent.mcpConfig ? JSON.parse(agent.mcpConfig) : {},
    maxConcurrentSessions: agent.maxConcurrentSessions || 10,
    resourceLimits: agent.resourceLimits ? JSON.parse(agent.resourceLimits) : {},
    livekitConfig,
    langfuseConfig,
  };
}

/**
 * Register agent in shared runtime
 */
async function registerAgentInRuntime(agent: Agent): Promise<{
  success: boolean;
  message: string;
  resources?: string[];
}> {
  const runtimeApiUrl = process.env.AGENT_RUNTIME_API_URL || 
    'http://agent-runtime.livekit.svc.cluster.local:80';
  const runtimeApiKey = process.env.AGENT_RUNTIME_API_KEY || '';
  
  try {
    const config = await serializeAgentConfig(agent);
    
    const response = await fetch(`${runtimeApiUrl}/api/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': runtimeApiKey ? `Bearer ${runtimeApiKey}` : '',
      },
      body: JSON.stringify({
        agentId: agent.id,
        tenantId: agent.tenantId,
        config,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Runtime registration failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: 'Agent registered in shared runtime',
      resources: ['Agent Runtime Registration'],
    };
  } catch (error: any) {
    console.error('Runtime registration error:', error);
    return {
      success: false,
      message: `Runtime registration failed: ${error.message}`,
    };
  }
}

/**
 * Deploy dedicated pod (existing logic)
 */
async function deployDedicatedPod(agent: Agent): Promise<{
  success: boolean;
  message: string;
  resources?: string[];
}> {
  try {
    const { appsV1Api, coreV1Api } = getK8sClient();
    const namespace = agent.deploymentNamespace || "agents";

    // Generate manifest
    const manifestData = await generateK8sManifests(agent, DeploymentMode.DEDICATED);
    const resources: string[] = [];

    // Combine all manifests into a single YAML string
    const allManifests = [
      manifestData.deployment,
      manifestData.service,
      manifestData.configMap,
      manifestData.secret
    ].join("\n---\n");

    // Parse YAML manifest into separate documents
    const docs = allManifests.split("---\n").filter((doc: string) => doc.trim());

    for (const doc of docs) {
      const resource = yaml.load(doc) as any;
      if (!resource || !resource.kind) continue;

      const resourceName = resource.metadata?.name || `agent-${agent.id}`;

      try {
        switch (resource.kind) {
          case "Deployment":
            // Try to get existing deployment
            try {
              await appsV1Api.readNamespacedDeployment({ name: resourceName, namespace });
              // If exists, update it
              await appsV1Api.replaceNamespacedDeployment({
                name: resourceName,
                namespace,
                body: resource
              });
              resources.push(`Deployment/${resourceName} (updated)`);
            } catch {
              // If doesn't exist, create it
              await appsV1Api.createNamespacedDeployment({ namespace, body: resource });
              resources.push(`Deployment/${resourceName} (created)`);
            }
            break;

          case "Service":
            try {
              await coreV1Api.readNamespacedService({ name: resourceName, namespace });
              await coreV1Api.replaceNamespacedService({
                name: resourceName,
                namespace,
                body: resource
              });
              resources.push(`Service/${resourceName} (updated)`);
            } catch {
              await coreV1Api.createNamespacedService({ namespace, body: resource });
              resources.push(`Service/${resourceName} (created)`);
            }
            break;

          case "ConfigMap":
            try {
              await coreV1Api.readNamespacedConfigMap({ name: resourceName, namespace });
              await coreV1Api.replaceNamespacedConfigMap({
                name: resourceName,
                namespace,
                body: resource
              });
              resources.push(`ConfigMap/${resourceName} (updated)`);
            } catch {
              await coreV1Api.createNamespacedConfigMap({ namespace, body: resource });
              resources.push(`ConfigMap/${resourceName} (created)`);
            }
            break;

          case "Secret":
            try {
              await coreV1Api.readNamespacedSecret({ name: resourceName, namespace });
              await coreV1Api.replaceNamespacedSecret({
                name: resourceName,
                namespace,
                body: resource
              });
              resources.push(`Secret/${resourceName} (updated)`);
            } catch {
              await coreV1Api.createNamespacedSecret({ namespace, body: resource });
              resources.push(`Secret/${resourceName} (created)`);
            }
            break;

          default:
            console.warn(`Unknown resource kind: ${resource.kind}`);
        }
      } catch (error: any) {
        console.error(`Failed to apply ${resource.kind}/${resourceName}:`, error);
        throw new Error(
          `Failed to apply ${resource.kind}/${resourceName}: ${error.message}`
        );
      }
    }

    return {
      success: true,
      message: `Successfully deployed agent to Kubernetes`,
      resources,
    };
  } catch (error: any) {
    console.error("Deployment error:", error);
    return {
      success: false,
      message: `Deployment failed: ${error.message}`,
    };
  }
}

/**
 * Deploy an agent to Kubernetes cluster or register in shared runtime
 */
export async function deployAgent(agent: Agent): Promise<{
  success: boolean;
  message: string;
  resources?: string[];
}> {
  // Check deployment mode
  if (agent.deploymentMode === 'shared') {
    // Register in Agent Runtime
    return await registerAgentInRuntime(agent);
  } else {
    // Deploy dedicated pod (current logic)
    return await deployDedicatedPod(agent);
  }
}

/**
 * Undeploy an agent from Kubernetes cluster
 */
export async function undeployAgent(agentId: number): Promise<{
  success: boolean;
  message: string;
  resources?: string[];
}> {
  try {
    const { appsV1Api, coreV1Api } = getK8sClient();
    const namespace = "agents";
    const resourceName = `agent-${agentId}`;
    const resources: string[] = [];

    // Delete deployment
    try {
      await appsV1Api.deleteNamespacedDeployment({
        name: resourceName,
        namespace: namespace
      });
      resources.push(`Deployment/${resourceName}`);
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.error("Failed to delete deployment:", error);
      }
    }

    // Delete service
    try {
      await coreV1Api.deleteNamespacedService({
        name: resourceName,
        namespace: namespace
      });
      resources.push(`Service/${resourceName}`);
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.error("Failed to delete service:", error);
      }
    }

    // Delete configmap
    try {
      await coreV1Api.deleteNamespacedConfigMap({
        name: `${resourceName}-config`,
        namespace: namespace
      });
      resources.push(`ConfigMap/${resourceName}-config`);
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.error("Failed to delete configmap:", error);
      }
    }

    // Delete secret
    try {
      await coreV1Api.deleteNamespacedSecret({
        name: `${resourceName}-secrets`,
        namespace: namespace
      });
      resources.push(`Secret/${resourceName}-secrets`);
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.error("Failed to delete secret:", error);
      }
    }

    return {
      success: true,
      message: `Successfully undeployed agent from Kubernetes`,
      resources,
    };
  } catch (error: any) {
    console.error("Undeployment error:", error);
    return {
      success: false,
      message: `Undeployment failed: ${error.message}`,
    };
  }
}

/**
 * Get deployment status for an agent
 */
export async function getAgentDeploymentStatus(agentId: number): Promise<{
  deployed: boolean;
  status?: string;
  replicas?: {
    desired: number;
    ready: number;
    available: number;
  };
  pods?: Array<{
    name: string;
    status: string;
    ready: boolean;
    restarts: number;
    age: string;
  }>;
  error?: string;
}> {
  try {
    const { appsV1Api, coreV1Api } = getK8sClient();
    const namespace = "agents";
    const deploymentName = `agent-${agentId}`;

    // Get deployment
    let deployment;
    try {
      deployment = await appsV1Api.readNamespacedDeployment({
        name: deploymentName,
        namespace: namespace
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { deployed: false };
      }
      throw error;
    }

    // Get pods for this deployment
    const podResponse = await coreV1Api.listNamespacedPod({
      namespace: namespace,
      labelSelector: `app=agent-${agentId}`
    });

    const pods = podResponse.items.map((pod) => {
      const containerStatuses = pod.status?.containerStatuses || [];
      const ready = containerStatuses.every((c) => c.ready);
      const restarts = containerStatuses.reduce(
        (sum, c) => sum + (c.restartCount || 0),
        0
      );

      const age = pod.metadata?.creationTimestamp
        ? getAge(new Date(pod.metadata.creationTimestamp))
        : "unknown";

      return {
        name: pod.metadata?.name || "unknown",
        status: pod.status?.phase || "Unknown",
        ready,
        restarts,
        age,
      };
    });

    const status = deployment.status;
    const replicas = {
      desired: status?.replicas || 0,
      ready: status?.readyReplicas || 0,
      available: status?.availableReplicas || 0,
    };

    // Determine overall status
    let overallStatus = "Unknown";
    if (replicas.available === replicas.desired && replicas.desired > 0) {
      overallStatus = "Running";
    } else if (replicas.ready > 0) {
      overallStatus = "Progressing";
    } else {
      overallStatus = "Pending";
    }

    return {
      deployed: true,
      status: overallStatus,
      replicas,
      pods,
    };
  } catch (error: any) {
    console.error("Failed to get deployment status:", error);
    return {
      deployed: false,
      error: error.message,
    };
  }
}

/**
 * Get logs for an agent's pod
 */
export async function getAgentLogs(
  agentId: number,
  tailLines: number = 100
): Promise<{
  success: boolean;
  logs?: string;
  error?: string;
}> {
  try {
    const { coreV1Api } = getK8sClient();
    const namespace = "agents";

    // Find pods for this agent
    const podResponse = await coreV1Api.listNamespacedPod({
      namespace: namespace,
      labelSelector: `app=agent-${agentId}`
    });

    if (podResponse.items.length === 0) {
      return {
        success: false,
        error: "No pods found for this agent",
      };
    }

    // Get logs from the first pod
    const podName = podResponse.items[0].metadata?.name;
    if (!podName) {
      return {
        success: false,
        error: "Pod name not found",
      };
    }

    const logResponse = await coreV1Api.readNamespacedPodLog({
      name: podName,
      namespace: namespace,
      tailLines: tailLines
    });

    return {
      success: true,
      logs: typeof logResponse === 'string' ? logResponse : String(logResponse),
    };
  } catch (error: any) {
    console.error("Failed to get logs:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}



/**
 * Calculate age from timestamp
 */
function getAge(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
