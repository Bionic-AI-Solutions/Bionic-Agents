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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("livekit.getToken", () => {
  it("generates LiveKit token for valid agent", async () => {
    // Set up LiveKit configuration
    const { setSetting } = await import("./settings");
    await setSetting("livekit_url", "wss://test.livekit.io");
    await setSetting("livekit_api_key", "APItest123");
    await setSetting("livekit_api_secret", "secrettest123");

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an agent first
    const agent = await caller.agents.create({
      name: "Test Agent",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
    });

    // Get LiveKit token
    const result = await caller.livekit.getToken({
      agentId: agent.id,
      participantName: "Test User",
    });

    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("roomName");
    expect(result).toHaveProperty("agentName");
    expect(result.url).toBe("wss://test.livekit.io");
    expect(result.roomName).toBe(`agent-${agent.id}-room`);
    expect(result.agentName).toBe("Test Agent");
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
  });

  it("fails when LiveKit is not configured", async () => {
    // Clear LiveKit configuration
    const { setSetting } = await import("./settings");
    await setSetting("livekit_url", "");
    await setSetting("livekit_api_key", "");
    await setSetting("livekit_api_secret", "");

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an agent
    const agent = await caller.agents.create({
      name: "Test Agent 2",
      sttProvider: "deepgram",
      ttsProvider: "elevenlabs",
      llmProvider: "openai",
    });

    // Try to get token - should fail
    await expect(
      caller.livekit.getToken({
        agentId: agent.id,
        participantName: "Test User",
      })
    ).rejects.toThrow();
  });

  it("fails for non-existent agent", async () => {
    // Set up LiveKit configuration
    const { setSetting } = await import("./settings");
    await setSetting("livekit_url", "wss://test.livekit.io");
    await setSetting("livekit_api_key", "APItest123");
    await setSetting("livekit_api_secret", "secrettest123");

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Try to get token for non-existent agent
    await expect(
      caller.livekit.getToken({
        agentId: 999999,
        participantName: "Test User",
      })
    ).rejects.toThrow("Agent not found");
  });
});
