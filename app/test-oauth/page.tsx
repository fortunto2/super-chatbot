'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TestOAuthPage(): React.ReactElement {
  const [urlInfo, setUrlInfo] = useState<any>(null);
  const [oauthHistory, setOauthHistory] = useState<string[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture all URL information
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    
    const info = {
      fullUrl: currentUrl,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      searchParams: Array.from(url.searchParams.entries()),
      allParams: {
        code: url.searchParams.get('code'),
        state: url.searchParams.get('state'),
        access_token: url.searchParams.get('access_token'),
        token_type: url.searchParams.get('token_type'),
        expires_in: url.searchParams.get('expires_in'),
        scope: url.searchParams.get('scope'),
        error: url.searchParams.get('error'),
        error_description: url.searchParams.get('error_description'),
      }
    };
    
    setUrlInfo(info);
    console.log('🔍 OAuth Test - URL Info:', info);

    // Track navigation history for OAuth debugging
    const timestamp = new Date().toLocaleTimeString();
    const historyEntry = `${timestamp}: ${currentUrl}`;
    setOauthHistory(prev => [...prev, historyEntry]);
  }, []);

  const testDirectOAuth = () => {
    const authUrl = 'http://localhost:8000/api/v1/auth/login?redirect_url=' + 
      encodeURIComponent('http://localhost:3000/test-oauth');
    
    console.log('🔗 Testing direct OAuth:', authUrl);
    
    // Log the attempt
    const timestamp = new Date().toLocaleTimeString();
    setOauthHistory(prev => [...prev, `${timestamp}: STARTING OAuth to ${authUrl}`]);
    
    window.location.href = authUrl;
  };

  const testAlternativeCallback = () => {
    // Try without URL encoding
    const authUrl = 'http://localhost:8000/api/v1/auth/login?redirect_url=http://localhost:3000/test-oauth';
    
    console.log('🔗 Testing alternative OAuth (no encoding):', authUrl);
    window.location.href = authUrl;
  };

  const testWithFragment = () => {
    // Some OAuth providers use fragment (#) instead of query (?)
    const authUrl = 'http://localhost:8000/api/v1/auth/login?redirect_url=' + 
      encodeURIComponent('http://localhost:3000/test-oauth#oauth-callback');
    
    console.log('🔗 Testing with fragment:', authUrl);
    window.location.href = authUrl;
  };

  const testOpenInNewTab = () => {
    const authUrl = 'http://localhost:8000/api/v1/auth/login?redirect_url=' + 
      encodeURIComponent('http://localhost:3000/test-oauth');
    
    console.log('🔗 Opening OAuth in new tab:', authUrl);
    window.open(authUrl, '_blank');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OAuth Parameters Test</h1>
      
      <div className="mb-6 space-y-2">
        <button 
          onClick={testDirectOAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        >
          Test Direct OAuth Flow
        </button>
        
        <button 
          onClick={testAlternativeCallback}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
        >
          Test No URL Encoding
        </button>
        
        <button 
          onClick={testWithFragment}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
        >
          Test With Fragment
        </button>
        
        <button 
          onClick={testOpenInNewTab}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Open in New Tab
        </button>
      </div>

      {oauthHistory.length > 0 && (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">OAuth Navigation History:</h3>
          <ul className="space-y-1 text-sm">
            {oauthHistory.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      {urlInfo && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Full URL:</h3>
            <code className="text-sm break-all">{urlInfo.fullUrl}</code>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">URL Parts:</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Pathname:</strong> {urlInfo.pathname}</li>
              <li><strong>Search:</strong> {urlInfo.search || 'none'}</li>
              <li><strong>Hash:</strong> {urlInfo.hash || 'none'}</li>
            </ul>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">All Search Parameters:</h3>
            {urlInfo.searchParams.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {urlInfo.searchParams.map(([key, value]: [string, string]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No parameters found</p>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">OAuth Specific Parameters:</h3>
            <ul className="space-y-1 text-sm">
              {Object.entries(urlInfo.allParams).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {String(value) || 'null'}
                </li>
              ))}
            </ul>
          </div>

          {urlInfo.hash && (
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Hash Fragment (might contain OAuth data):</h3>
              <code className="text-sm break-all">{urlInfo.hash}</code>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Debug Instructions:</h3>
        <ol className="text-sm space-y-1">
          <li>1. Click one of the OAuth test buttons above</li>
          <li>2. Complete the login process on SuperDuperAI/Auth0</li>
          <li>3. Note where you end up and what parameters are in the URL</li>
          <li>4. Check browser developer tools Network tab for redirects</li>
          <li>5. Look for any error messages or console logs</li>
        </ol>
      </div>
    </div>
  );
} 