# GitHub Secrets Configuration

This document describes the GitHub repository secrets required for GitHub Actions workflows.

## Required Secrets

### GITHUB_CLIENT_SECRET
- **Description**: GitHub OAuth client secret for authentication and API access
- **Value**: `b3787c824f1380a28acab1c4e042987a1fd6986c`
- **Usage**: Used in GitHub Actions workflows for authenticating with GitHub APIs

## Repository Information

- **Repository URL**: `https://github.com/Bionic-AI-Solutions/Agent-Builder.git`
- **Owner**: `Bionic-AI-Solutions`
- **Repository Name**: `Agent-Builder`

## How to Add Secrets

### Via GitHub Web Interface (Recommended)

1. Navigate to: https://github.com/Bionic-AI-Solutions/Agent-Builder
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name: `GITHUB_CLIENT_SECRET`
5. Enter the secret value: `b3787c824f1380a28acab1c4e042987a1fd6986c`
6. Click **Add secret**

### Via GitHub CLI

```bash
gh secret set GITHUB_CLIENT_SECRET --repo Bionic-AI-Solutions/Agent-Builder --body "b3787c824f1380a28acab1c4e042987a1fd6986c"
```

## Using Secrets in Workflows

Secrets are accessed in GitHub Actions workflows using the `secrets` context:

```yaml
env:
  GITHUB_CLIENT_SECRET: ${{ secrets.GITHUB_CLIENT_SECRET }}
```

Or directly in steps:

```yaml
- name: Use GitHub Secret
  run: |
    echo "Secret is configured"
    # Use ${{ secrets.GITHUB_CLIENT_SECRET }} in your commands
```

## Security Notes

- ⚠️ **Never commit secrets to the repository**
- ⚠️ **Never log or print secret values in workflow outputs**
- ✅ Secrets are automatically masked in workflow logs
- ✅ Only repository collaborators with admin access can view/manage secrets
- ✅ Secrets are encrypted at rest and in transit

## Verification

After adding the secret, verify it's available by checking:
- Repository Settings → Secrets and variables → Actions
- The secret should appear in the list (value will be masked)

