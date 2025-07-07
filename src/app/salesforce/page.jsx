// Example: components/SalesforceConnector.js
"use client";

import { useState } from 'react';

export default function SalesforceConnector() {
  const [tokenData, setTokenData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSalesforceToken = async () => {
    setIsLoading(true);
    setError(null);
    setTokenData(null);

    try {
      // Call your OWN internal API route
      const response = await fetch('/api/salesforce/auth', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors from your API route
        throw new Error(data.message || 'Something went wrong');
      }

      setTokenData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Salesforce Connection</h2>
      <button onClick={getSalesforceToken} disabled={isLoading}>
        {isLoading ? 'Getting Token...' : 'Get Access Token'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {tokenData && (
        <div>
          <h3>Success!</h3>
          <p>
            <strong>Access Token:</strong>{' '}
            <code>{tokenData.accessToken.substring(0, 15)}...</code>
          </p>
          <p>
            <strong>Instance URL:</strong> <code>{tokenData.instance_url}</code>
          </p>
          <p>You can now use this token to make API calls to Salesforce.</p>
        </div>
      )}
    </div>
  );
}