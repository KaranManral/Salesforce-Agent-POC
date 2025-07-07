// This API route sets up a Server-Sent Events (SSE) stream to listen for chat events from the Salesforce Einstein Agent.
// It authenticates with Salesforce, constructs the event listener endpoint, and streams chat events to the client.
import https from "https";
import path from "path";
import fs from "fs";
import {
  getChatAgentAccessToken,
  listenChatEvents,
} from "@/app/lib/chatAgentAuth";

import { NextResponse } from "next/server";

// Specify the runtime as Node.js for server-side features
export const runtime = "nodejs";

// Salesforce environment variables for chat integration
const SF_CHAT_DOMAIN = process.env.SALESFORCE_CHAT_DOMAIN ?? "";
const SF_ES_DEV_NAME =
  process.env.SALESFORCE_EMBED_SERVICE_DEVELOPER_NAME ?? "";
const SF_ORG_ID = process.env.SALESFORCE_ORG_ID ?? "";

// Load the Salesforce CA certificate for secure HTTPS requests
const ca = fs.readFileSync(path.resolve(process.cwd(), "salesforce-chain.pem"));

// Create an HTTPS agent using the CA certificate
const httpsAgent = new https.Agent({ ca });

// Endpoint to obtain an unauthenticated access token for chat
const tokenEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/authorization/unauthenticated/access-token`;

export async function GET() {
  try {
    // Get an access token for the chat agent
    const responseToken = await getChatAgentAccessToken(
      tokenEndpoint,
      httpsAgent,
      SF_ORG_ID,
      SF_ES_DEV_NAME
    );
    const accessToken = await responseToken.data.accessToken;
    // const deviceId = await responseToken.data.context.deviceId;
    // const endUser = await responseToken.data.context.endUser;

    // Optionally extract query params for advanced event filtering
    // const {searchParams} = new URL(req.url);
    // const orgId = searchParams.get("orgId") ?? "";
    // const conversationId = searchParams.get('conversationId') ?? "";
    // const channelPlatformKey = searchParams.get('channelPlatformKey') ?? "";
    // const channelAddressIdentifier = searchParams.get('channelAddressIdentifier') ?? "";

    // Construct the chat event listener endpoint
    const chatEventListenerEndpoint = new URL(
      `${SF_CHAT_DOMAIN}/eventrouter/v1/sse`
    );
    // chatEventListenerEndpoint.searchParams.set('conversationId',conversationId);
    // chatEventListenerEndpoint.searchParams.set('channelPlatformKey',channelPlatformKey);
    chatEventListenerEndpoint.searchParams.set(
      "channelType",
      "embedded_messaging"
    );
    // chatEventListenerEndpoint.searchParams.set('channelAddressIdentifier',channelAddressIdentifier);

    try {
      // Start listening for chat events and stream them to the client
      const chatEventListenerResponse = await listenChatEvents(
        chatEventListenerEndpoint,
        accessToken,
        SF_ORG_ID,
        httpsAgent
      );

      return chatEventListenerResponse;
    } catch (error) {
      // Handle errors in setting up the event listener
      console.error("Error setting up event listener \n" + error);
      return NextResponse.json({ message: "Failed" }, { status: 500 });
    }
  } catch (error) {
    // Handle errors in obtaining the access token
    console.error("Error while getting token \n" + error);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
