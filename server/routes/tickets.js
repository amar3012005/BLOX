const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/api/save-ticket', async (req, res) => {
  try {
    const ticketData = req.body;
    const csvPath = path.join(__dirname, '../data/tickets.csv');

    // Read existing tickets
    let tickets = [];
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      tickets = Papa.parse(content, { header: true }).data;
    }

    // Check for duplicates
    const isDuplicate = tickets.some(ticket => ticket.id === ticketData.id);
    if (isDuplicate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket already exists' 
      });
    }

    // Add new ticket
    tickets.push(ticketData);

    // Write back to CSV
    const csv = Papa.unparse(tickets);
    fs.writeFileSync(csvPath, csv);

    res.json({ 
      success: true, 
      ticket: ticketData 
    });

  } catch (error) {
    console.error('Server error saving ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
