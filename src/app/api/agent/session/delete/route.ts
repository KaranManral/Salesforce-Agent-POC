/*
  This API ends the current chat session by deleting it from Salesforce.
  It uses MIAW API to delete the session.
*/

// import https from "https";
// import path from "path";
// import fs from "fs";
// import {
//   endChatSession,
//   getChatAgentAccessToken,
// } from "@/app/lib/chatAgentAuth";
// import { NextRequest, NextResponse } from "next/server";

// const SF_CHAT_DOMAIN = process.env.SALESFORCE_CHAT_DOMAIN ?? "";
// const SF_ES_DEV_NAME =
//   process.env.SALESFORCE_EMBED_SERVICE_DEVELOPER_NAME ?? "";
// const SF_ORG_ID = process.env.SALESFORCE_ORG_ID ?? "";

// const ca = fs.readFileSync(path.resolve(process.cwd(), "salesforce-chain.pem"));

// const httpsAgent = new https.Agent({ ca });

// const tokenEndpoint = `${SF_CHAT_DOMAIN}/iamessage/api/v2/authorization/unauthenticated/access-token`;

// export async function DELETE(req: NextRequest) {
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
//     const esDevName = searchParams.get("esDevName") ?? "";

//     const chatSessionCloseEndpoint = new URL(
//       `${SF_CHAT_DOMAIN}/iamessage/api/v2/conversation/${conversationId}/close`
//     );

//     chatSessionCloseEndpoint.searchParams.set("esDeveloperName", esDevName);

//     try {
//       const res = await endChatSession(
//         chatSessionCloseEndpoint,
//         accessToken,
//         SF_ORG_ID,
//         httpsAgent
//       );

//       console.log(res);

//       return NextResponse.json({ msg: "dsf" });
//     } catch (error) {
//       console.error("Error while ending session \n" + error);
//       return NextResponse.json({ message: "Failed" }, { status: 500 });
//     }
//   } catch (error) {
//     console.error("Error while getting token \n" + error);
//     return NextResponse.json({ message: "Failed" }, { status: 500 });
//   }
// }

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
  This API ends the current chat session by deleting it from Salesforce.
  It uses Einstein AI Agent API to delete the session.
  It retrieves the session ID from cookies, gets an access token from Salesforce, and deletes the session.
*/

import { getSalesforceAccessV2Token } from "@/app/lib/salesforceAuthV2";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const SF_API = process.env.SF_API_HOST ?? "";

export async function DELETE(req: NextRequest) {
  // Retrieve the chat session ID from cookies
  const chatSession = req.cookies.get("chatSession")?.value;
  let sessionId = "";

  if(chatSession){
    sessionId = JSON.parse(chatSession).sessionId;
  }
  
  try {
    // Get Salesforce access token for API requests
    const response = await getSalesforceAccessV2Token();
    const { access_token } = await response.json();

    // If no session ID, return a message to the client
    if (!sessionId) {
      return NextResponse.json(
        { message: "Invalid Session ID" },
        { status: 200 }
      );
    }

    try {
      // Construct the endpoint for deleting the chat session
      const endpoint = `${SF_API}/einstein/ai-agent/v1/sessions/${sessionId}`;

      // Call the Salesforce API to delete/end the session
      await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "x-session-end-reason": "UserRequest",
        },
      });
      
      // Prepare the response and delete the session cookie
      const response = NextResponse.json({ message: "success" }, { status: 200 });
      response.cookies.delete("chatSession");
      return response;

    } catch (error) {
      // Handle errors in deleting the session
      console.log("Error deleting session: " + error);
      return NextResponse.json(
        { message: "Failed to delete session" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle errors in getting the access token
    console.log("Error getting access token: " + error);
    return NextResponse.json(
      { message: "Failed to get token" },
      { status: 500 }
    );
  }
}
