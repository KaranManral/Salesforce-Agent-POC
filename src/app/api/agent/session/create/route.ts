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
import { NextRequest, NextResponse } from "next/server";

const SF_DOMAIN = process.env.SF_DOMAIN_V2 ?? "";
const SF_API = process.env.SF_API_HOST ?? "";
const SF_AGENT_ID = process.env.SF_AGENT_ID ?? "";
const SF_GET_CANDIDATE_AND_JOB_DETAILS_FLOW_NAME =
  process.env.GET_CANDIDATE_AND_JOB_DETAILS_FLOW_NAME ?? "";
const SF_CHECK_CANDIDATE_RESPONSE_FLOW_NAME =
  process.env.CHECK_CANDIDATE_RESPONSE_FLOW_NAME ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const jobApplicationNumber: string = body.jobApplicationNumber ?? "";
  const termsAndConditionAgreed: string =
    body.termsAndConditionAgreed === true ? "true" : "false";
  try {
    // Get Salesforce access token for API requests
    const response = await getSalesforceAccessV2Token();
    const { access_token } = await response.json();

    try {
      // If jobApplicationNumber is provided, set the flow endpoint to get candidate and job details
      const getCandidateDetailsFlowEndpoint = `${SF_DOMAIN}/services/data/v64.0/actions/custom/flow/${SF_GET_CANDIDATE_AND_JOB_DETAILS_FLOW_NAME}`;

      const flowData = {
        inputs: [
          {
            ApplicationNumber: jobApplicationNumber,
          },
        ],
      };

      // Call the flow to get candidate and job details
      interface FlowResponse {
        actionName: string;
        errors: Array<{
          statusCode: string;
          message: string;
          fields: string[];
        }> | null;
        invocationId: string | null;
        isSuccess: boolean;
        outcome: string | null;
        outputValues: {
          JobLocation?: string | null;
          JobTravelRequired?: boolean | null;
          Flow__InterviewGuid?: string | null;
          JobResponsibilities?: string | null;
          FirstName?: string | null;
          JobName?: string | null;
          CandidateCountry?: string | null;
          CandidateEmail?: string | null;
          JobSkillRequired?: string | null;
          SuggestionsText?: unknown;
          CompanyName?: string | null;
          JobDescription?: string | null;
          JobType?: string | null;
          CandidateId?: string | null;
          PreScreeningQuestions?: string | null;
          LastName?: string | null;
          JobId?: string | null;
          Flow__InterviewStatus?: string | null;
          [key: string]: unknown;
        };
        sortOrder: number;
        version: number;
      }

      const flowResponse = (await axios.post<FlowResponse[]>(
        getCandidateDetailsFlowEndpoint,
        flowData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      )).data;

      if (!flowResponse[0].isSuccess) {
        // If the flow execution fails, return an error response
        return NextResponse.json(
          { message: "Flow execution failed", sessionId: "" },
          { status: 500 }
        );
      }

      if(!flowResponse[0].outputValues.CandidateId || !flowResponse[0].outputValues.JobId) {
        // If candidate or job ID is not found, return an error response
        return NextResponse.json(
          { message: "Invalid Job Application number", sessionId: "" },
          { status: 400 }
        );
      }

      try {
        const checkCandidateResponseFlowEndpoint = `${SF_DOMAIN}/services/data/v64.0/actions/custom/flow/${SF_CHECK_CANDIDATE_RESPONSE_FLOW_NAME}`;

        const checkCandidateResponseData = {
          inputs: [
            {
              Candidate_Id:
                flowResponse[0].outputValues.CandidateId ??
                "",
            },
          ],
        };

        // Call the flow to check if candidate response is available
        interface FlowError {
          statusCode: string;
          message: string;
          fields: string[];
        }

        interface CheckCandidateResponse {
          actionName: string;
          errors: FlowError[] | null;
          invocationId: string | null;
          isSuccess: boolean;
          outcome: string | null;
          outputValues: {
            Flow__InterviewGuid?: string;
            Flow__InterviewStatus?: string;
            AllowUser?: string;
            [key: string]: unknown;
          };
          sortOrder: number;
          version: number;
        }

        const checkResponse: Array<CheckCandidateResponse> = (await axios.post(
          checkCandidateResponseFlowEndpoint,
          checkCandidateResponseData,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        )).data;

        if (!checkResponse[0].isSuccess) {
          // If the check flow execution fails, return an error response
          return NextResponse.json(
            {
              message: "Check Candidate Response Flow execution failed",
              sessionId: "",
            },
            { status: 500 }
          );
        }
        
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
              {
                name: "Job_Application_Number",
                type: "Text",
                value: jobApplicationNumber, // Pass the job application number to the session
              },
              {
                name: "JobLocation",
                type: "Text",
                value: flowResponse[0].outputValues.JobLocation ?? "", // Get job location from
              },
              {
                name: "JobTravelRequired",
                type: "Boolean",
                value: flowResponse[0].outputValues.JobTravelRequired ?? "", // Get travel requirement from flow
              },
              {
                name: "JobResponsibilities",
                type: "Text",
                value: flowResponse[0].outputValues.JobResponsibilities ?? "", // Get job responsibilities from
              },
              {
                name: "CandidateFirstName",
                type: "Text",
                value: flowResponse[0].outputValues.FirstName ?? "", // Get candidate first name from flow
              },
              {
                name: "CandidateLastName",
                type: "Text",
                value: flowResponse[0].outputValues.LastName ?? "", // Get candidate last name from flow
              },
              {
                name: "PositionName",
                type: "Text",
                value: flowResponse[0].outputValues.JobName ?? "", // Get position name from
              },
              {
                name: "CandidateCountry",
                type: "Text",
                value: flowResponse[0].outputValues.CandidateCountry ?? "", // Get candidate country from flow
              },
              {
                name: "CandidateEmail",
                type: "Text",
                value: flowResponse[0].outputValues.CandidateEmail ?? "", // Get candidate email from flow
              },
              {
                name: "JobSkills",
                type: "Text",
                value: flowResponse[0].outputValues.JobSkillRequired ?? "", // Get job skills
              },
              {
                name: "CompanyName",
                type: "Text",
                value: flowResponse[0].outputValues.CompanyName ?? "", // Get company name from flow
              },
              {
                name: "JobDescription",
                type: "Text",
                value: flowResponse[0].outputValues.JobDescription ?? "", // Get job description from
              },
              {
                name: "JobType",
                type: "Text",
                value: flowResponse[0].outputValues.JobType ?? "", // Get job type from flow
              },
              {
                name: "Customer_Id",
                type: "Text",
                value: flowResponse[0].outputValues.CandidateId ?? "", // Get customer ID from flow
              },
              {
                name: "Job_Id",
                type: "Text",
                value: flowResponse[0].outputValues.JobId ?? "", // Get job ID from flow
              },
              {
                name: "T_C_Agreed",
                type: "Text",
                value: termsAndConditionAgreed,
              },
              {
                name: "allowUser",
                type: "Text",
                value: checkResponse[0].outputValues.AllowUser ?? "false", // Get allow user flag from check response
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
            { message: "Session creation failed", sessionId: "" },
            { status: 500 }
          );
        }
      } catch (error) {
        // Handle errors in checking candidate response
        console.log("Error checking candidate response: " + error);
        return NextResponse.json(
          {
            message: "Check Candidate Response Flow execution failed",
            sessionId: "",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      // Handle errors in calling the flow
      console.log("Error calling flow to get candidate data: " + error);
      return NextResponse.json(
        {
          message: "Get Candidate and Job Details Flow execution failed",
          sessionId: "",
        },
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
