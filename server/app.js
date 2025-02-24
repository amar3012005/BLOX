const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');                     // Add this for sync operations
const fsPromises = require('fs').promises;    // Keep this for async operations
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const { Readable } = require('stream');
const Papa = require('papaparse');

const app = express();
const PORT = 3003; // Set fixed port

// Allow all development ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003'
];

// Update CORS configuration to be more permissive
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure this file exists in the correct location
// ...existing code...

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files allowed'));
      return;
    }
    cb(null, true);
  }
}).single('file');

// Wrap upload in promise
const handleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Initialize Pinata with proper error handling
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY
});

// Add validation
pinata.testAuthentication().then((result) => {
  console.log('Pinata Authentication:', result);
}).catch((err) => {
  console.error('Pinata Authentication Failed:', err);
});

// Convert buffer to readable stream
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const CSV_FILE_PATH = path.join(dataDir, 'tickets.csv');

// Ensure data directory and CSV file exist with headers
const initializeCSV = async () => {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }

    // Create CSV file with headers if it doesn't exist
    const exists = await fsPromises.access(CSV_FILE_PATH).then(() => true).catch(() => false);
    if (!exists) {
      const headers = 'id,seatId,imageUrl,txHash,venue,price,date,walletAddress,status,mintedAt\n';
      await fsPromises.writeFile(CSV_FILE_PATH, headers);
      console.log('Created CSV file with headers');
    }
  } catch (error) {
    console.error('Failed to initialize CSV:', error);
    throw error;
  }
};

// Initialize CSV before starting server
app.use(async (req, res, next) => {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    await initializeCSV();
  }
  next();
});

// Simplified upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    await handleUpload(req, res);

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    console.log('File received:', {
      size: req.file.size,
      type: req.file.mimetype
    });

    // Convert buffer to stream
    const readableStream = bufferToStream(req.file.buffer);

    const result = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: `ticket-${Date.now()}.jpg`,
        keyvalues: {
          contentType: req.file.mimetype
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    });

    if (!result.IpfsHash) {
      throw new Error('IPFS upload failed');
    }

    const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    res.json({
      success: true,
      imageUrl,
      ipfsHash: result.IpfsHash
    });

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Endpoint to save ticket data to CSV
app.post('/api/save-ticket', async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    const fileExists = fs.existsSync(CSV_FILE_PATH);
    if (fileExists) {
      const content = await fsPromises.readFile(CSV_FILE_PATH, 'utf-8');
      if (content && !content.endsWith('\n')) {
        await fsPromises.appendFile(CSV_FILE_PATH, '\n');
      }
    }

    await fsPromises.appendFile(CSV_FILE_PATH, csvData + '\n');
    
    res.json({ 
      success: true, 
      message: 'Ticket saved successfully' 
    });

  } catch (error) {
    console.error('Save ticket error:', error);
    res.status(500).json({ 
      error: 'Failed to save ticket',
      message: error.message 
    });
  }
});

// Updated GET tickets endpoint with better error handling
app.get('/api/get-tickets', async (req, res) => {
  try {
    console.log('Reading tickets from:', CSV_FILE_PATH);
    
    // Ensure file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      await initializeCSV();
      return res.json({ tickets: [] });
    }

    const csvContent = await fsPromises.readFile(CSV_FILE_PATH, 'utf-8');
    console.log('CSV Content:', csvContent);

    const parseResult = Papa.parse(csvContent, { 
      header: true,
      skipEmptyLines: true
    });

    console.log('Parsed tickets:', parseResult.data);

    const validTickets = parseResult.data.filter(ticket => ticket.id && ticket.status === 'active');
    
    res.json({ 
      tickets: validTickets,
      count: validTickets.length
    });

  } catch (error) {
    console.error('Failed to read tickets:', error);
    res.status(500).json({ 
      error: 'Failed to read tickets',
      details: error.message 
    });
  }
});

// Add new endpoint for removing tickets
app.post('/api/remove-ticket', async (req, res) => {
  try {
    const { ticketId } = req.body;
    
    // Read current CSV content
    const csvContent = await fsPromises.readFile(CSV_FILE_PATH, 'utf-8');
    const tickets = Papa.parse(csvContent, { header: true }).data;
    
    // Filter out the ticket to remove
    const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
    
    // Convert back to CSV with headers
    const csvString = Papa.unparse({
      fields: ['id', 'seatId', 'imageUrl', 'txHash', 'venue', 'price', 'date', 'walletAddress', 'status'],
      data: updatedTickets
    });
    
    // Write back to file
    await fsPromises.writeFile(CSV_FILE_PATH, csvString + '\n');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove ticket error:', error);
    res.status(500).json({ error: 'Failed to remove ticket' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Update debug endpoint with more info
app.get('/debug', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    uploadDir,
    pinataConfigured: Boolean(process.env.PINATA_API_KEY),
    cors: {
      enabled: true,
      allowedOrigins
    }
  });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Upload failed',
    details: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Debug endpoint:', `http://localhost:${PORT}/debug`);
  console.log('Health check:', `http://localhost:${PORT}/health`);
  console.log('Upload directory:', uploadDir);
});
