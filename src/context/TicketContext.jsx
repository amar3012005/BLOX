import React, { createContext, useContext, useState, useEffect } from 'react';
import { AptosClient } from 'aptos';

const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);

  const addTicket = (newTicket) => {
    setTickets(prev => [...prev, newTicket]);
  };

  const fetchTickets = async () => {
    try {
      if (typeof window.aptos !== "undefined") {
        const petra = window.aptos;
        const account = await petra.account();
        
        if (account) {
          const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');
          const resources = await client.getAccountResources(account.address);
          const ticketResource = resources.find(r => r.type.includes('::ticket::'));
          
          if (ticketResource && ticketResource.data.tickets) {
            setTickets(ticketResource.data.tickets);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <TicketContext.Provider value={{ tickets, addTicket, fetchTickets }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);
