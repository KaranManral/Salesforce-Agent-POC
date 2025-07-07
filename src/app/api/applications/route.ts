// This API route handles job applications by creating or finding a candidate and submitting a job application in Salesforce.
// It authenticates with Salesforce, checks for an existing candidate, creates one if needed, and then creates a job application record.
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSalesforceAccessToken } from "@/app/lib/salesforceAuth";

export async function POST(request: NextRequest) {
  try {
    // Get Salesforce access token and instance URL
    const response = await getSalesforceAccessToken();
    const accessToken = await response.data.access_token;
    const instanceUrl = await response.data.instance_url;

    // Parse application data from the request body
    const applicationData = await request.json();

    // Check if the candidate already exists in Salesforce by email using SOQL query
    const soql = `SELECT Id FROM Candidate__c WHERE Email__c='${applicationData.email.trim()}' LIMIT 1`;
    const queryRes = await axios.get(
      `${instanceUrl}/services/data/v64.0/query`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q: soql },
      }
    );

    let candidateId: string = "";

    if (queryRes && queryRes.data) {
      // If candidate does not exist, create a new Candidate__c record
      if (queryRes.data.totalSize === 0) {
        const newCandidate = {
          First_Name__c: applicationData.firstName,
          Last_Name__c: applicationData.lastName,
          Mobile__c: applicationData.mobile,
          Email__c: applicationData.email,
          Zip_Postal_Code__c: applicationData.postalCode,
          Years_of_Experience__c: applicationData.yearsExperience,
          Phone__c: applicationData.phone,
          Education__c: applicationData.education,
          Fax__c: applicationData.fax,
          SSN__c: applicationData.ssn,
          Street__c: applicationData.street,
          City__c: applicationData.city,
          State_Province__c: applicationData.stateProvince,
          Country__c: applicationData.country,
          Current_Employer__c: applicationData.currentEmployer,
          Currently_Employed__c: applicationData.currentlyEmployed,
          US_Citizen__c: applicationData.usCitizen,
          Visa_Required__c: applicationData.visaRequired,
          Skills__c: applicationData.skills,
          Resume__c: applicationData.resume,
        };

        try {
          // Create the candidate in Salesforce
          const res = await axios.post(
            `${instanceUrl}/services/data/v64.0/sobjects/Candidate__c/`,
            newCandidate,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Created Candidate ID:", res.data.id);
          candidateId = res.data.id;
        } catch (error) {
          console.error("Error creating candidate:", error);
        }
      } else {
        // Use the existing candidate's ID
        candidateId = queryRes.data.records[0].Id;
        console.log("Existing Candidate ID:", candidateId);
      }

      // Prepare the job application record
      const newJobApplication = {
        Candidate__c: candidateId,
        Position__c: applicationData.jobId,
        Picklist__c: "New",
        Cover_Letter__c: applicationData.coverLetter,
      };

      try {
        // Create the job application in Salesforce
        const res = await axios.post(
          `${instanceUrl}/services/data/v64.0/sobjects/Job_Application__c/`,
          newJobApplication,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Created Job Application ID:", res.data.id);
      } catch (error) {
        console.log("Error Creating job applications: " + error);
      }
    } else {
      // Candidate query failed
      throw "Candidate object not fetched";
    }

    // Return success response
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Handle errors and return a 500 response
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
