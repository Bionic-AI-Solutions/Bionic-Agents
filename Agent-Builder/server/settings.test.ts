import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("settings.getAll", () => {
  it("allows admin to view settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.settings.getAll();
    expect(settings).toBeDefined();
    expect(typeof settings).toBe("object");
  });

  it("denies non-admin access to settings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.settings.getAll()).rejects.toThrow("Access denied");
  });
});

describe("settings.update", () => {
  it("allows admin to update settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.update({
      key: "test_setting",
      value: "test_value",
    });

    expect(result).toEqual({ success: true });
  });

  it("denies non-admin from updating settings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.settings.update({
        key: "test_setting",
        value: "test_value",
      })
    ).rejects.toThrow("Access denied");
  });
});
