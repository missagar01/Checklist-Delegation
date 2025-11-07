const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { serialNumber, date } = req.query;

  if (!serialNumber || !date) {
    return res.status(400).json({ error: 'Missing serialNumber or date parameter' });
  }

  try {
    const apiUrl = `http://139.167.179.193:90/api/v2/WebAPI/GetDeviceLogs?APIKey=205511032522&SerialNumber=${serialNumber}&FromDate=${date}&ToDate=${date}`;
    
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched logs for:', serialNumber);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in device-logs API:', error);
    res.status(500).json({ error: 'Failed to fetch device logs: ' + error.message });
  }
};