/*
  This part contains the implementation using the MIAW API in Salesforce.
  It handles sending messages to the Einstein Agent via In App messaging channels like omni channel and managing chat sessions.
*/
// import { NextRequest, NextResponse } from "next/server";
// import path from "path";
// import fs from "fs";
// import https from "https";
// import { getChatAgentAccessToken, sendMessage } from "@/app/lib/chatAgentAuth";
// import { randomUUID } from "crypto";

// const SF_CHAT_DOMAIN = process.env.SALESFORCE_CHAT_DOMAIN ?? "";
// const SF_ES_DEV_NAME =
//   process.env.SALESFORCE_EMBED_SERVICE_DEVELOPER_NAME ?? "";
// const SF_ORG_ID = process.env.SALESFORCE_ORG_ID ?? "";

// const ca = fs.readFileSync(path.resolve(process.cwd(), "salesforce-chain.pem"));

// const httpsAgent = new https.Agent({ ca });

// const tokenEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/authorization/unauthenticated/access-token`;

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

//     const { searchParams } = new URL(req.url);
//     const conversationId = searchParams.get("conversationId");

//     const messageEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/conversation/${conversationId}/message`;

//     console.log(messageEndpoint)

//     const msgData = JSON.stringify({
//       message: {
//         inReplyToMessageId: "",
//         id: randomUUID(),
//         messageType: "StaticContentMessage",
//         staticContent: {
//           formatType: "Text",
//           text: "Testing REST API for MIAW",
//         },
//       },
//       esDeveloperName: SF_ES_DEV_NAME,
//       isNewMessagingSession: true,
//       routingAttributes: {},
//       language: "en",
//     });
//     try {
//       const messageResponse = await sendMessage(
//         messageEndpoint,
//         accessToken,
//         httpsAgent,
//         msgData
//       );
//       console.log(messageResponse)
//       return NextResponse.json(
//         { session: "success", conversationId: conversationId },
//         { status: 200 }
//       );
//     } catch (error) {
//       console.log("Error sending message: " + error);
//       return NextResponse.json({ message: "Failed" }, { status: 500 });
//     }
//   } catch (error) {
//     console.error("Error while getting token \n" + error);
//     return NextResponse.json({ message: "Failed" }, { status: 500 });
//   }
// }

/*
  This part contains the implementation using the Einstein API in Salesforce. It communicates with the connected app in salesforce which directly communicates with the AI Agent in Salesforce.
*/

import { getSalesforceAccessV2Token } from "@/app/lib/salesforceAuthV2";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const SF_API = process.env.SF_API_HOST ?? "";

export async function POST(req: NextRequest) {
  // Extract message and variables from the request body
  const { msg, vars } = await req.json();

  // Validate message length (2000 character limit)
  if (msg && msg.length > 2000) {
    return NextResponse.json(
      { message: "error", error: "Message too long" },
      { status: 400 }
    );
  }

  // Retrieve the chat session ID from cookies
  const chatSession = req.cookies.get("chatSession")?.value;
  let sessionId = "";

  if (chatSession) {
    sessionId = JSON.parse(chatSession).sessionId;
  }

  try {
    // Get Salesforce access token for API requests
    const response = await getSalesforceAccessV2Token();
    
    const { access_token } = await response.json();

    // If no session ID, prompt the client to start a new session
    if (!sessionId)
      return NextResponse.json(
        { message: "Invalid Session ID. Start a new session." },
        { status: 200 }
      );

    try {
      // Construct the endpoint for sending a message to the chat session
      const endpoint = `${SF_API}/einstein/ai-agent/v1/sessions/${sessionId}/messages`;

      // Prepare the message payload
      const body = JSON.stringify({
        message: {
          sequenceId: Date.now().toString(),
          type: "Text",
          text: msg || "hi",
        },
        variables: vars || [],
      });

      // Send the message to the Einstein Agent
      const res = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.data;

      // Return the agent's reply/messages to the client
      return NextResponse.json({ message: "success", data: data.messages }, { status: 200 });
    } catch (error) {
      // Handle errors in sending the message
      console.log("Error sending message: " + error);
      return NextResponse.json(
        { message: "Failed to send message" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle errors in getting the access token
    console.log("Error getting access token: " + error);
    return NextResponse.json(
      { message: "Failed to get access token" },
      { status: 500 }
    );
  }
}
