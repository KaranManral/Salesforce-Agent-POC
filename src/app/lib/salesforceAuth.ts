// This module handles Salesforce authentication using JWT Bearer Flow.
// It generates a JWT, signs it with a private key, and exchanges it for an access token from Salesforce.
import fs from 'fs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Read the private key used to sign the JWT assertion
const privateKey = fs.readFileSync('./private.key', 'utf8');

// Main function to get Salesforce access token for REST flow for editing data in Salesforce.
export async function getSalesforceAccessToken() {
  // Create a JWT assertion with required claims
  const token = jwt.sign(
    {
      iss: process.env.SALESFORCE_CONSUMER_KEY, // Salesforce connected app client ID
      sub: process.env.SALESFORCE_USERNAME,     // Salesforce username
      aud: 'https://login.salesforce.com',      // Audience (Salesforce login URL)
      exp: Math.floor(Date.now() / 1000) + 300, // Expiry (5 minutes from now)
    },
    privateKey,
    { algorithm: 'RS256' }
  );

  // Prepare parameters for the token request
  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.append('assertion', token);
  params.append('client_id', process.env.SALESFORCE_CONSUMER_KEY ?? "");
  params.append('client_secret', process.env.SALESFORCE_CLIENT_SECRET ?? "");

  // Exchange the JWT for an access token from Salesforce
  const response = await axios.post(
    'https://login.salesforce.com/services/oauth2/token', //Endpoint to hit to gain access token for REST API for data manipulation in salesforce.
    params,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  // Return the full response (including access token)
  return response;
}
