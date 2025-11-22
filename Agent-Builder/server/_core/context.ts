import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Development mode: Bypass authentication if BYPASS_AUTH is set
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NODE_ENV === "development";
  
  if (bypassAuth) {
    // Return a mock admin user for development
    try {
      const { getUserByOpenId, upsertUser } = await import("../db");
      
      // Try to get or create a dev user
      const devOpenId = "dev-user-bypass-auth";
      user = await getUserByOpenId(devOpenId);
      
      if (!user) {
        // Create a dev user if it doesn't exist
        try {
          await upsertUser({
            openId: devOpenId,
            name: "Dev User",
            email: "dev@bionicaisolutions.com",
            loginMethod: "dev-bypass",
            role: "admin",
          });
          user = await getUserByOpenId(devOpenId);
        } catch (dbError) {
          console.warn("[Auth] Could not create dev user in database, using mock user:", dbError);
        }
      }
      
      // If still no user (database unavailable), create a mock user object
      if (!user) {
        user = {
          id: 1,
          openId: devOpenId,
          name: "Dev User",
          email: "dev@bionicaisolutions.com",
          loginMethod: "dev-bypass",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as User;
      }
      
      console.log("[Auth] Development mode: Using bypass authentication");
    } catch (error) {
      // If database is unavailable, use a mock user
      console.warn("[Auth] Database unavailable, using mock user for development:", error);
      user = {
        id: 1,
        openId: "dev-user-bypass-auth",
        name: "Dev User",
        email: "dev@bionicaisolutions.com",
        loginMethod: "dev-bypass",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    }
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
