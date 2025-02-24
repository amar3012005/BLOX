import React, { createContext, useContext, useState, useEffect } from 'react';

const TicketsContext = createContext();

export const TicketsProvider = ({ children }) => {
  const [tickets, setTickets] = useState(() => {
    const savedTickets = localStorage.getItem('savedTickets');
    return savedTickets ? JSON.parse(savedTickets) : [];
  });

  useEffect(() => {
    localStorage.setItem('savedTickets', JSON.stringify(tickets));
  }, [tickets]);

  const saveTicket = (ticketData) => {
    setTickets(prev => [...prev, { ...ticketData, id: Date.now() }]);
  };

  const removeTicket = (ticketId) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  return (
    <TicketsContext.Provider value={{ tickets, saveTicket, removeTicket }}>
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
};
