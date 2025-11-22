import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("agents.create", () => {
  it("creates a new agent with valid configuration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.create({
      name: "Test Agent",
      description: "A test voice agent",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
      llmModel: "gpt-4o-mini",
      visionEnabled: 0,
      screenShareEnabled: 0,
      transcribeEnabled: 0,
      systemPrompt: "You are a helpful assistant.",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("requires name field", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agents.create({
        name: "",
        sttProvider: "deepgram",
        ttsProvider: "elevenlabs",
        llmProvider: "openai",
      } as any)
    ).rejects.toThrow();
  });
});

describe("agents.list", () => {
  it("returns empty array for user with no agents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("agents.update", () => {
  it("updates agent configuration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an agent
    const created = await caller.agents.create({
      name: "Test Agent",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
    });

    // Then update it
    const result = await caller.agents.update({
      id: created.id,
      name: "Updated Agent",
      description: "Updated description",
    });

    expect(result.success).toBe(true);
  });
});

describe("agents.generateManifest", () => {
  it("generates Kubernetes manifest for an agent", async () => {
    // Set up LiveKit configuration first
    const { setSetting } = await import("./settings");
    await setSetting("livekit_url", "wss://test.livekit.io");
    await setSetting("livekit_api_key", "test-api-key");
    await setSetting("livekit_api_secret", "test-api-secret");
    await setSetting("langfuse_enabled", "false");
    
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an agent first
    const created = await caller.agents.create({
      name: "Test Agent",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
    });

    // Generate manifest
    const result = await caller.agents.generateManifest({
      id: created.id,
    });

    expect(result).toHaveProperty("manifest");
    expect(result.manifest).toContain("apiVersion: apps/v1");
    expect(result.manifest).toContain("kind: Deployment");
    expect(result.manifest).toContain(`agent-${created.id}`);
  });
});

describe("agents.generateWidget", () => {
  it("generates widget snippet for an agent", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an agent first
    const created = await caller.agents.create({
      name: "Test Agent",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
    });

    // Generate widget
    const result = await caller.agents.generateWidget({
      id: created.id,
      theme: "light",
      position: "bottom-right",
      primaryColor: "#3b82f6",
    });

    expect(result).toHaveProperty("snippet");
    expect(result.snippet).toContain("LiveKit Agent Widget");
    expect(result.snippet).toContain("window.LiveKitAgentWidget");
    expect(result.config).toEqual({
      theme: "light",
      position: "bottom-right",
      primaryColor: "#3b82f6",
    });
  });
});
