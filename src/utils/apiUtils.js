export const checkServerHealth = async () => {
  try {
    const response = await fetch('http://localhost:3003/health');
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export const validateConnection = async () => {
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    throw new Error('Server is not responding. Please try again later.');
  }
};
