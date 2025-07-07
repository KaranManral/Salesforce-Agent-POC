// This module provides helper functions for interacting with the MIAW API in Salesforce.
// It includes functions to obtain access tokens, create chat sessions, listen for chat events, end sessions, and send messages.
import axios from "axios";
import https from "https";

/**
 * Obtain an access token for the Einstein Agent chat API.
 * @param endpoint - The authentication endpoint URL.
 * @param httpsAgent - HTTPS agent for secure requests.
 * @param orgId - Salesforce organization ID.
 * @param devName - Einstein bot developer name.
 * @returns Axios response containing the access token.
 */
export async function getChatAgentAccessToken(
  endpoint: string,
  httpsAgent: https.Agent,
  orgId: string,
  devName: string
) {
  const body = JSON.stringify({
    orgId: orgId,
    esDeveloperName: devName,
    capabilitiesVersion: "1",
    platform: "Web",
  });

  const res = await axios.post(endpoint, body, {
    httpsAgent,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res;
}

/**
 * Create a new chat session with the Einstein Agent.
 * @param endpoint - The session creation endpoint.
 * @param accessToken - Bearer token for authentication.
 * @param httpsAgent - HTTPS agent for secure requests.
 * @param devName - Einstein bot developer name.
 * @param conversationId - Unique conversation/session ID.
 * @returns Axios response containing session details.
 */
export const createChatSession = async (
  endpoint: string,
  accessToken: string,
  httpsAgent: https.Agent,
  devName: string,
  conversationId: string
) => {
  const body = JSON.stringify({
    conversationId: conversationId,
    esDeveloperName: devName,
  });

  const res = await axios.post(endpoint, body, {
    httpsAgent,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return res;
};

/**
 * Listen for chat events (such as messages or status updates) from the Einstein Agent.
 * Streams events as Server-Sent Events (SSE) to the client.
 * @param endpoint - The chat events endpoint (URL object).
 * @param accessToken - Bearer token for authentication.
 * @param orgId - Salesforce organization ID.
 * @param httpsAgent - HTTPS agent for secure requests.
 * @returns Response object streaming events to the client.
 */
export const listenChatEvents = async (
  endpoint: URL,
  accessToken: string,
  orgId: string,
  httpsAgent: https.Agent
) => {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Open a stream to Salesforce for chat events
        const sfRes = await axios.get<import("stream").Readable>(
          endpoint.toString(),
          {
            responseType: "stream",
            httpsAgent,
            headers: {
              "X-Org-Id": orgId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // Forward data chunks to the client as they arrive
        sfRes.data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        sfRes.data.on("end", () => controller.close());
        sfRes.data.on("error", (err) => controller.error(err));
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};

/**
 * End an active chat session with the Einstein Agent.
 * @param endpoint - The session deletion endpoint (URL object).
 * @param accessToken - Bearer token for authentication.
 * @param orgId - Salesforce organization ID.
 * @param httpsAgent - HTTPS agent for secure requests.
 * @returns Axios response indicating session closure.
 */
export const endChatSession = async (
  endpoint: URL,
  accessToken: string,
  orgId: string,
  httpsAgent: https.Agent
) => {
  const res = await axios.delete(endpoint.toString(), {
    httpsAgent,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Org-Id": orgId,
    },
  });
  return res;
};

/**
 * Send a message to the Einstein Agent within an active chat session.
 * @param endpoint - The message endpoint URL.
 * @param accessToken - Bearer token for authentication.
 * @param httpsAgent - HTTPS agent for secure requests.
 * @param msgData - Message payload (stringified JSON).
 * @returns Axios response containing the agent's reply or status.
 */
export const sendMessage = async (
  endpoint: string,
  accessToken: string,
  httpsAgent: https.Agent,
  msgData: string
) => {
  const res = await axios.post(endpoint, msgData, {
    httpsAgent,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return res;
};
