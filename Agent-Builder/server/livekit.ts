import { AccessToken } from "livekit-server-sdk";
import { getSetting } from "./settings";

/**
 * Generate a LiveKit access token for a participant to join a room
 */
export async function generateLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity?: string
): Promise<string> {
  const livekitApiKey = await getSetting("livekit_api_key");
  const livekitApiSecret = await getSetting("livekit_api_secret");

  if (!livekitApiKey || !livekitApiSecret) {
    throw new Error("LiveKit API credentials not configured");
  }

  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: participantIdentity || `user-${Date.now()}`,
    name: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}

/**
 * Get LiveKit server URL from settings
 */
export async function getLiveKitUrl(): Promise<string> {
  const url = await getSetting("livekit_url");
  if (!url) {
    throw new Error("LiveKit URL not configured");
  }
  return url;
}
