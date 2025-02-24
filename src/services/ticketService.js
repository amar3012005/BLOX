class TicketService {
  async fetchTickets() {
    try {
      const response = await fetch('http://localhost:3003/api/get-tickets');
      const data = await response.json();
      
      if (!response.ok) throw new Error('Failed to fetch tickets');
      
      // Transform and validate the data
      return data.tickets
        .filter(ticket => ticket.status === 'active')
        .map(ticket => ({
          ...ticket,
          formattedDate: new Date(ticket.mintedAt).toLocaleDateString(),
          shortAddress: `${ticket.walletAddress.slice(0, 6)}...${ticket.walletAddress.slice(-4)}`,
          explorerUrl: `https://explorer.aptoslabs.com/txn/${ticket.txHash}?network=testnet`
        }));
    } catch (error) {
      console.error('Ticket fetch error:', error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
