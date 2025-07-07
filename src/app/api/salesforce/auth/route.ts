import { getSalesforceAccessToken } from "../../../lib/salesforceAuth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await getSalesforceAccessToken(); //Get access token
    return NextResponse.json(
      {
        accessToken: response.data.access_token,
        instanceUrl: response.data.instance_url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Salesforce JWT Auth Error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
