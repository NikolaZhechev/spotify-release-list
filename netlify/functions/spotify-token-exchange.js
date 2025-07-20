// netlify/functions/spotify-token-exchange.js
const fetch = require('node-fetch'); // Required for making HTTP requests

exports.handler = async function(event, context) {
    // Define CORS headers to allow requests from any origin (for Tampermonkey)
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allow all origins for simplicity with Tampermonkey
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
    };

    // Handle preflight (OPTIONS) requests for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: '',
        };
    }

    // Only allow POST requests for the main logic
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: headers, // Include CORS headers in error responses too
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body.' })
        };
    }

    const { code, redirect_uri, code_verifier, refresh_token } = requestBody;

    // Retrieve environment variables securely from Netlify
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: 'Server configuration error: Client ID or Client Secret missing.' })
        };
    }

    let params = new URLSearchParams();
    let tokenUrl = 'https://accounts.spotify.com/api/token';
    let spotifyHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    };

    if (code && code_verifier) {
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirect_uri);
        params.append('client_id', CLIENT_ID);
        params.append('code_verifier', code_verifier);
    } else if (refresh_token) {
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refresh_token);
        params.append('client_id', CLIENT_ID);
    } else {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'Invalid request: missing code/code_verifier or refresh_token.' })
        };
    }

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: spotifyHeaders,
            body: params
        });

        const data = await response.json();

        if (response.ok) {
            return {
                statusCode: 200,
                headers: headers, // Include CORS headers in success response
                body: JSON.stringify(data)
            };
        } else {
            console.error('Spotify API Error:', data);
            return {
                statusCode: response.status,
                headers: headers, // Include CORS headers in error response
                body: JSON.stringify({ error: data.error, error_description: data.error_description })
            };
        }
    } catch (error) {
        console.error('Network or other error:', error);
        return {
            statusCode: 500,
            headers: headers, // Include CORS headers in error response
            body: JSON.stringify({ error: 'Failed to communicate with Spotify API.', details: error.message })
        };
    }
};
