import Papa from 'papaparse';

export const saveTicketToCSV = async (ticketData) => {
  try {
    console.log('Saving ticket with image:', ticketData.imageUrl); // Debug log

    const csvData = Papa.unparse({
      fields: ['id', 'seatId', 'imageUrl', 'txHash', 'venue', 'price', 'date', 'walletAddress', 'status', 'mintedAt'],
      data: [[
        ticketData.id,
        ticketData.seatId,
        ticketData.imageUrl, // Ensure this is being passed correctly
        ticketData.txHash,
        ticketData.venue,
        ticketData.price,
        ticketData.date,
        ticketData.walletAddress,
        ticketData.status,
        ticketData.mintedAt
      ]]
    });

    const response = await fetch('http://localhost:3003/api/save-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData })
    });

    console.log('Save ticket response:', response);
    const result = await response.json();
    console.log('Save ticket result:', result);

    return result;
  } catch (error) {
    console.error('Save ticket error:', error);
    throw error;
  }
};

export const readTicketsFromCSV = async () => {
  try {
    console.log('Starting readTicketsFromCSV');
    const response = await fetch('http://localhost:3003/api/get-tickets');
    console.log('Read tickets response:', response);
    const data = await response.json();
    console.log('Tickets data:', data);
    return data.tickets || [];
  } catch (error) {
    console.error('Error reading tickets:', error);
    return [];
  }
};

export const readTicketsFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('concertTickets') || '[]');
  } catch (error) {
    console.error('Error reading tickets:', error);
    return [];
  }
};

export const removeTicketFromStorage = (ticketId) => {
  try {
    const tickets = JSON.parse(localStorage.getItem('concertTickets') || '[]');
    const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
    localStorage.setItem('concertTickets', JSON.stringify(updatedTickets));
    return true;
  } catch (error) {
    console.error('Error removing ticket:', error);
    return false;
  }
};
