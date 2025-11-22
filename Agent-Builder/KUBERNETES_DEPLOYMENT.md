# Kubernetes Deployment Guide

This guide explains how to configure and use the Kubernetes deployment automation features in the LiveKit Agent Builder.

## Prerequisites

1. **Kubernetes Cluster**: You need access to a Kubernetes cluster where agents will be deployed
2. **kubectl Configuration**: The application needs access to your Kubernetes cluster configuration
3. **Namespace**: Ensure the `agents` namespace exists in your cluster

## Configuration Methods

The application supports two methods for connecting to your Kubernetes cluster:

### Method 1: Kubeconfig File (Recommended for Development)

Place your kubeconfig file in one of these standard locations:
- `~/.kube/config` (default location)
- Set `KUBECONFIG` environment variable to point to your config file

```bash
export KUBECONFIG=/path/to/your/kubeconfig.yaml
```

### Method 2: In-Cluster Configuration (For Production)

When running the application inside a Kubernetes cluster, it will automatically use the in-cluster service account credentials. No additional configuration needed.

## Setting Up the Agents Namespace

Before deploying agents, create the `agents` namespace in your cluster:

```bash
kubectl create namespace agents
```

## How It Works

### 1. Deploy an Agent

When you click "Deploy" on an agent:

1. The application generates Kubernetes manifests (Deployment, Service, ConfigMap, Secret)
2. Connects to your Kubernetes cluster using the configured credentials
3. Applies the manifests to the `agents` namespace
4. Updates the agent status to "deployed"

The deployment includes:
- **Deployment**: Runs the LiveKit agent pod
- **Service**: Exposes the agent within the cluster
- **ConfigMap**: Stores agent configuration
- **Secret**: Stores sensitive data (API keys, credentials)

### 2. Monitor Deployment Status

Click the "Status" button on a deployed agent to view:

- **Overall Status**: Running, Progressing, or Pending
- **Replica Information**: Desired vs. ready replicas
- **Pod Details**: Individual pod status, readiness, and restart counts
- **Real-time Logs**: Last 100 lines from the agent pod

The status page auto-refreshes every 5 seconds to show live updates.

### 3. Undeploy an Agent

Click "Undeploy" to remove all Kubernetes resources associated with the agent:
- Deletes the Deployment
- Deletes the Service
- Deletes the ConfigMap
- Deletes the Secret

## Troubleshooting

### Connection Errors

If you see "Failed to load Kubernetes configuration":

1. **Check kubeconfig**: Ensure your kubeconfig file exists and is valid
   ```bash
   kubectl cluster-info
   ```

2. **Check permissions**: Ensure your service account has the required permissions:
   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
     name: agent-deployer
     namespace: agents
   rules:
   - apiGroups: ["apps"]
     resources: ["deployments"]
     verbs: ["get", "list", "create", "update", "patch", "delete"]
   - apiGroups: [""]
     resources: ["services", "configmaps", "secrets", "pods", "pods/log"]
     verbs: ["get", "list", "create", "update", "patch", "delete"]
   ```

3. **Check namespace**: Ensure the `agents` namespace exists
   ```bash
   kubectl get namespace agents
   ```

### Deployment Failures

If an agent fails to deploy:

1. **Check the logs**: View the pod logs in the Status page
2. **Check pod events**: 
   ```bash
   kubectl describe pod -n agents -l app=agent-{id}
   ```
3. **Check resource limits**: Ensure your cluster has enough resources
4. **Verify secrets**: Ensure LiveKit and LangFuse settings are configured

### Pod Not Starting

Common issues:

1. **Image pull errors**: Ensure the agent Docker image is accessible
2. **ConfigMap/Secret errors**: Check that all required environment variables are set
3. **Resource constraints**: Check if the cluster has enough CPU/memory

## Security Best Practices

1. **Use RBAC**: Limit permissions to only what's needed for agent deployment
2. **Namespace isolation**: Keep agents in a dedicated namespace
3. **Secret management**: Never commit secrets to version control
4. **Network policies**: Restrict network access to/from agent pods
5. **Resource limits**: Set CPU and memory limits on agent deployments

## Advanced Configuration

### Custom Namespace

To deploy agents to a different namespace, update the `deploymentNamespace` field in the agent configuration.

### Resource Limits

Edit the generated manifest to add resource limits:

```yaml
resources:
  limits:
    cpu: "1000m"
    memory: "1Gi"
  requests:
    cpu: "500m"
    memory: "512Mi"
```

### Multiple Replicas

For high availability, increase the replica count in the deployment manifest.

## API Reference

### Deploy Agent

```typescript
const result = await trpc.agents.deploy.mutate({ id: agentId });
// Returns: { success: boolean, status: string, message: string, resources: string[] }
```

### Undeploy Agent

```typescript
const result = await trpc.agents.undeploy.mutate({ id: agentId });
// Returns: { success: boolean, message: string, resources: string[] }
```

### Get Deployment Status

```typescript
const status = await trpc.agents.getDeploymentStatus.query({ id: agentId });
// Returns: { deployed: boolean, status?: string, replicas?: {...}, pods?: [...] }
```

### Get Pod Logs

```typescript
const logs = await trpc.agents.getLogs.query({ id: agentId, tailLines: 100 });
// Returns: { success: boolean, logs?: string, error?: string }
```

## Next Steps

1. Configure your LiveKit and LangFuse settings in the Settings page
2. Create an agent with your desired configuration
3. Deploy the agent to your Kubernetes cluster
4. Monitor the deployment status and logs
5. Test the agent using the widget or test page
