// This API route fetches job details from Salesforce and returns them as JSON.
// It authenticates with Salesforce, queries for job positions, and maps the results to a simplified structure.
import { NextResponse } from 'next/server';
import { getSalesforceAccessToken } from '../../lib/salesforceAuth';
import { SalesforceJobRecord } from '@/app/types';
import axios from 'axios';

export async function GET() {
  try {
    // Get Salesforce access token and instance URL
    const response = await getSalesforceAccessToken();
    const accessToken = await response.data.access_token;
    const instanceUrl = await response.data.instance_url;

    // Query Salesforce for job positions using SOQL
    const res = await axios.get(
      `${instanceUrl}/services/data/v64.0/query`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: `SELECT 
        Id, Name, Job_Description__c, Location__c, Type__c, Status__c,
        Min_Pay__c, Max_Pay__c, Open_Date__c, Close_Date__c,
        Skills_Required__c,Responsibilities__c,
        Company_Name__r.Name, CreatedDate
      FROM Position__c
      ORDER BY CreatedDate DESC`
        }//__c represents custom object and __r represents related objects.
      }
    );

    // Map Salesforce job records to a simplified job object
    const jobs = res.data.records.map((r: SalesforceJobRecord) => ({
      id: r.Id,
      title: r.Name,
      company: r.Company_Name__r.Name,
      location: r.Location__c,
      description: r.Job_Description__c,
      type: r.Type__c,
      postDate: r.Open_Date__c,
      responsibilities: r.Responsibilities__c,
      skills: r.Skills_Required__c,
      salary_min: r.Min_Pay__c,
      salary_max: r.Max_Pay__c,
      created_at: r.CreatedDate
    }));

    // Return the jobs as a JSON response
    return NextResponse.json(jobs);
  } catch (err) {
    // Handle errors and return a 500 response
    console.error('💥 /api/jobs error:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
