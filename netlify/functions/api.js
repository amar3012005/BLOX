exports.handler = async function(event, context) {
  // Redirect API calls to your backend
  const path = event.path.replace('/.netlify/functions/api', '');
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect to API' })
    };
  }
};
