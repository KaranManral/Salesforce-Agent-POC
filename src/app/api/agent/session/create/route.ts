/*
  This API route creates a new chat session in Salesforce using the MIAW API.
*/

// import { NextRequest, NextResponse } from "next/server";
// import {
//   createChatSession,
//   getChatAgentAccessToken,
// } from "@/app/lib/chatAgentAuth";
// import { randomUUID } from "crypto";
// import https from "https";
// import fs from "fs";
// import path from "path";

// const SF_ES_DEV_NAME =
//   process.env.SALESFORCE_EMBED_SERVICE_DEVELOPER_NAME ?? "";
// const SF_CHAT_DOMAIN = process.env.SALESFORCE_CHAT_DOMAIN ?? "";
// const SF_ORG_ID = process.env.SALESFORCE_ORG_ID ?? "";
// const conversationId = randomUUID();

// const ca = fs.readFileSync(path.resolve(process.cwd(), "salesforce-chain.pem"));

// const httpsAgent = new https.Agent({ ca });

// const tokenEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/authorization/unauthenticated/access-token`;
// const sessionEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/conversation`;

// export async function POST(req: NextRequest) {
//   try {
//     const responseToken = await getChatAgentAccessToken(
//       tokenEndpoint,
//       httpsAgent,
//       SF_ORG_ID,
//       SF_ES_DEV_NAME
//     );
//     const accessToken = await responseToken.data.accessToken;
//     // const deviceId = await responseToken.data.context.deviceId;
//     // const endUser = await responseToken.data.context.endUser;
//     try {
//       const res = await createChatSession(
//         sessionEndpoint,
//         accessToken,
//         httpsAgent,
//         SF_ES_DEV_NAME,
//         conversationId,
//       );
//       console.log(res);
//       return NextResponse.json(
//         { session:"success",conversationId: conversationId },
//         { status: 200 }
//       );
//     } catch (error) {
//       console.log("Error creating session: " + error);
//       return NextResponse.json({ session: "Failed" }, { status: 500 });
//     }
//   } catch (error) {
//     console.error("Error while getting token \n" + error);
//     return NextResponse.json({ message: "Failed" }, { status: 500 });
//   }
// }

/*
  This API route creates a new chat session in Salesforce using the Einstein AI Agent API.
*/

import { getSalesforceAccessV2Token } from "@/app/lib/salesforceAuthV2";
import axios from "axios";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const SF_DOMAIN = process.env.SF_DOMAIN_V2 ?? "";
const SF_API = process.env.SF_API_HOST ?? "";
const SF_AGENT_ID = process.env.SF_AGENT_ID ?? "";

export async function POST() {
  try {
    // Get Salesforce access token for API requests
    const response = await getSalesforceAccessV2Token();
    const { access_token } = await response.json();

    try {
      // Construct the endpoint for creating a new chat session
      const endpoint = `${SF_API}/einstein/ai-agent/v1/agents/${SF_AGENT_ID}/sessions`;

      // Prepare the session creation payload
      const data = JSON.stringify({
        externalSessionKey: randomUUID(), // Unique session id for tracking
        instanceConfig: {
          endpoint: SF_DOMAIN, // Salesforce instance domain
        },
        tz: "America/Los_Angeles", // Timezone for the session
        variables: [
          {
            name: "$Context.EndUserLanguage",
            type: "Text",
            value: "en_US",
          },
        ],
        featureSupport: "Streaming", // Enable streaming support
        streamingCapabilities: {
          chunkTypes: ["Text"],
        },
        bypassUser: true, // Bypass user authentication for demo/testing
      });

      // Create the chat session in Salesforce
      const res = await axios.post(endpoint, data, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      });
      const { messages, sessionId } = await res.data;
      // Prepare the session object to store in a cookie
      const session = {
        status: "success",
        messages: messages,
        sessionId: sessionId,
      };
      // Set the session cookie and return the session info
      const response = NextResponse.json(session, { status: 200 });
      response.cookies.set("chatSession", JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return response;
    } catch (error) {
      // Handle errors in creating the session
      console.log("Error creating session: " + error);
      return NextResponse.json(
        { message: "failed", sessionId: "" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle errors in getting the access token
    console.log("Error getting access token: " + error);
    return NextResponse.json(
      { message: "failed", access_token: "" },
      { status: 500 }
    );
  }
}
