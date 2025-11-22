import type { Agent } from "../drizzle/schema";
import { getLivekitConfig, getLangfuseConfig } from "./settings";

export enum DeploymentMode {
  DEDICATED = 'dedicated',  // One pod per agent
  SHARED = 'shared'         // Use shared runtime
}

export interface K8sManifest {
  deployment: string;
  service: string;
  configMap: string;
  secret: string;
}

/**
 * Generate Kubernetes manifests for deploying a LiveKit agent
 * Supports both dedicated (one pod per agent) and shared (runtime) modes
 */
export async function generateK8sManifests(
  agent: Agent,
  mode: DeploymentMode = DeploymentMode.SHARED
): Promise<K8sManifest> {
  if (mode === DeploymentMode.DEDICATED || agent.deploymentMode === 'dedicated') {
    return generateDedicatedManifests(agent);
  } else {
    return generateSharedRegistration(agent);
  }
}

/**
 * Generate manifests for dedicated deployment (one pod per agent)
 */
async function generateDedicatedManifests(agent: Agent): Promise<K8sManifest> {
  const livekitConfig = await getLivekitConfig();
  const langfuseConfig = await getLangfuseConfig();
  
  if (!livekitConfig) {
    throw new Error("LiveKit configuration not found. Please configure LiveKit settings first.");
  }
  const agentName = `agent-${agent.id}`;
  const namespace = agent.deploymentNamespace || "agents";

  // Parse languages array
  let languages: string[] = [];
  try {
    if (agent.languages) {
      languages = JSON.parse(agent.languages);
    }
  } catch {
    languages = agent.languages?.split(",").map((l) => l.trim()) || ["en"];
  }

  // Deployment manifest
  const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${agentName}
  namespace: ${namespace}
  labels:
    app: ${agentName}
    agent-id: "${agent.id}"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${agentName}
  template:
    metadata:
      labels:
        app: ${agentName}
        agent-id: "${agent.id}"
    spec:
      terminationGracePeriodSeconds: 600
      containers:
      - name: agent
        image: livekit/agents:latest
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
        env:
        - name: AGENT_ID
          value: "${agent.id}"
        - name: AGENT_NAME
          value: "${agent.name}"
        - name: LIVEKIT_URL
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LIVEKIT_URL
        - name: LIVEKIT_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LIVEKIT_API_KEY
        - name: LIVEKIT_API_SECRET
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LIVEKIT_API_SECRET
        ${langfuseConfig?.enabled ? `- name: LANGFUSE_PUBLIC_KEY
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LANGFUSE_PUBLIC_KEY
        - name: LANGFUSE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LANGFUSE_SECRET_KEY
        - name: LANGFUSE_BASE_URL
          valueFrom:
            secretKeyRef:
              name: ${agentName}-secrets
              key: LANGFUSE_BASE_URL` : ""}
        - name: STT_PROVIDER
          valueFrom:
            configMapKeyRef:
              name: ${agentName}-config
              key: STT_PROVIDER
        - name: TTS_PROVIDER
          valueFrom:
            configMapKeyRef:
              name: ${agentName}-config
              key: TTS_PROVIDER
        - name: LLM_PROVIDER
          valueFrom:
            configMapKeyRef:
              name: ${agentName}-config
              key: LLM_PROVIDER
        - name: LLM_MODEL
          valueFrom:
            configMapKeyRef:
              name: ${agentName}-config
              key: LLM_MODEL
        - name: SYSTEM_PROMPT
          valueFrom:
            configMapKeyRef:
              name: ${agentName}-config
              key: SYSTEM_PROMPT
        - name: VISION_ENABLED
          value: "${agent.visionEnabled}"
        - name: SCREEN_SHARE_ENABLED
          value: "${agent.screenShareEnabled}"
        - name: TRANSCRIBE_ENABLED
          value: "${agent.transcribeEnabled}"
        - name: LANGUAGES
          value: "${languages.join(",")}"
        ${agent.voiceId ? `- name: VOICE_ID
          value: "${agent.voiceId}"` : ""}
        ${agent.avatarModel ? `- name: AVATAR_MODEL
          value: "${agent.avatarModel}"` : ""}
        ${agent.mcpGatewayUrl ? `- name: MCP_GATEWAY_URL
          value: "${agent.mcpGatewayUrl}"` : ""}
`;

  // Service manifest
  const service = `apiVersion: v1
kind: Service
metadata:
  name: ${agentName}
  namespace: ${namespace}
  labels:
    app: ${agentName}
spec:
  selector:
    app: ${agentName}
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
`;

  // ConfigMap manifest
  const configMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${agentName}-config
  namespace: ${namespace}
data:
  STT_PROVIDER: "${agent.sttProvider}"
  TTS_PROVIDER: "${agent.ttsProvider}"
  LLM_PROVIDER: "${agent.llmProvider}"
  LLM_MODEL: "${agent.llmModel || "gpt-4o-mini"}"
  SYSTEM_PROMPT: |
    ${agent.systemPrompt || "You are a helpful AI assistant."}
`;

  // Secret manifest (base64 encoded values)
  const secret = `apiVersion: v1
kind: Secret
metadata:
  name: ${agentName}-secrets
  namespace: ${namespace}
type: Opaque
data:
  LIVEKIT_URL: ${Buffer.from(livekitConfig.url).toString("base64")}
  LIVEKIT_API_KEY: ${Buffer.from(livekitConfig.apiKey).toString("base64")}
  LIVEKIT_API_SECRET: ${Buffer.from(livekitConfig.apiSecret).toString("base64")}
  ${langfuseConfig?.enabled ? `LANGFUSE_PUBLIC_KEY: ${Buffer.from(langfuseConfig.publicKey).toString("base64")}
  LANGFUSE_SECRET_KEY: ${Buffer.from(langfuseConfig.secretKey).toString("base64")}
  LANGFUSE_BASE_URL: ${Buffer.from(langfuseConfig.baseUrl).toString("base64")}` : ""}
`;

  return {
    deployment,
    service,
    configMap,
    secret,
  };
}

/**
 * Generate registration manifest for shared runtime deployment
 * No K8s resources needed - just register in runtime
 */
async function generateSharedRegistration(agent: Agent): Promise<K8sManifest> {
  const livekitConfig = await getLivekitConfig();
  const langfuseConfig = await getLangfuseConfig();
  
  if (!livekitConfig) {
    throw new Error("LiveKit configuration not found. Please configure LiveKit settings first.");
  }
  
  const agentName = `agent-${agent.id}`;
  const namespace = agent.deploymentNamespace || "agents";

  // Parse languages array
  let languages: string[] = [];
  try {
    if (agent.languages) {
      languages = JSON.parse(agent.languages);
    }
  } catch {
    languages = agent.languages?.split(",").map((l) => l.trim()) || ["en"];
  }

  // ConfigMap for agent configuration (stored for reference, not deployed)
  const configMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${agentName}-config
  namespace: ${namespace}
data:
  STT_PROVIDER: "${agent.sttProvider}"
  TTS_PROVIDER: "${agent.ttsProvider}"
  LLM_PROVIDER: "${agent.llmProvider}"
  LLM_MODEL: "${agent.llmModel || "gpt-4o-mini"}"
  SYSTEM_PROMPT: |
    ${agent.systemPrompt || "You are a helpful AI assistant."}
`;

  // Secret manifest (base64 encoded values)
  const secret = `apiVersion: v1
kind: Secret
metadata:
  name: ${agentName}-secrets
  namespace: ${namespace}
type: Opaque
data:
  LIVEKIT_URL: ${Buffer.from(livekitConfig.url).toString("base64")}
  LIVEKIT_API_KEY: ${Buffer.from(livekitConfig.apiKey).toString("base64")}
  LIVEKIT_API_SECRET: ${Buffer.from(livekitConfig.apiSecret).toString("base64")}
  ${langfuseConfig?.enabled ? `LANGFUSE_PUBLIC_KEY: ${Buffer.from(langfuseConfig.publicKey).toString("base64")}
  LANGFUSE_SECRET_KEY: ${Buffer.from(langfuseConfig.secretKey).toString("base64")}
  LANGFUSE_BASE_URL: ${Buffer.from(langfuseConfig.baseUrl).toString("base64")}` : ""}
`;

  // No deployment or service needed for shared mode
  return {
    deployment: '', // Empty - no deployment
    service: '',    // Empty - no service
    configMap,
    secret,
  };
}

/**
 * Combine all manifests into a single YAML file
 */
export function combineManifests(manifests: K8sManifest): string {
  return `${manifests.secret}
---
${manifests.configMap}
---
${manifests.deployment}
---
${manifests.service}
`;
}

/**
 * Generate kubectl apply command
 */
export function generateDeployCommand(agentId: number, namespace: string = "agents"): string {
  return `kubectl apply -f agent-${agentId}-manifest.yaml -n ${namespace}`;
}

/**
 * Generate kubectl delete command
 */
export function generateDeleteCommand(agentId: number, namespace: string = "agents"): string {
  return `kubectl delete deployment,service,configmap,secret -l agent-id=${agentId} -n ${namespace}`;
}
