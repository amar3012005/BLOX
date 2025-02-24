import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ExternalLink, Tag, Calendar, Globe, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../services/ticketService';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const fetchedTickets = await ticketService.fetchTickets();
      setTickets(fetchedTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTicket = async (ticketId) => {
    try {
      const response = await fetch('http://localhost:3003/api/remove-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId })
      });

      if (response.ok) {
        setTickets(tickets.filter(ticket => ticket.id !== ticketId));
      }
    } catch (error) {
      console.error('Failed to remove ticket:', error);
    }
  };

  const TicketCard = ({ ticket }) => (
    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-8">
      {/* Main Ticket Content */}
      <div className="flex gap-8">
        {/* Left: Large Image */}
        <div className="w-1/2">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <img 
              src={ticket.imageUrl} 
              alt={`Ticket ${ticket.seatId}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </div>

        {/* Right: Info and QR */}
        <div className="w-1/2 space-y-6">
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              COLDPLAY LIVE
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-xl text-gray-300">{ticket.venue}</span>
            </div>
            <div className="text-blue-400 text-xl mt-2">Seat {ticket.seatId}</div>
          </div>

          {/* Large QR Code */}
          <div className="flex justify-center">
            <a 
              href={`https://explorer.aptoslabs.com/txn/${ticket.txHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="bg-white p-4 rounded-xl hover:scale-105 transition-transform">
                <QRCodeSVG 
                  value={`https://explorer.aptoslabs.com/txn/${ticket.txHash}?network=testnet`}
                  size={180}
                  className="rounded"
                />
              </div>
              <div className="text-center mt-2 text-sm text-blue-400">
                Click to view on Explorer
              </div>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/marketplace', { state: { ticket, isReselling: true } })}
              className="py-3 bg-blue-500/10 hover:bg-blue-500/20 
                       text-blue-400 rounded-lg flex items-center justify-center gap-2
                       transition-all"
            >
              <Tag className="w-5 h-5" />
              <span>Resell</span>
            </button>
            <button
              onClick={() => removeTicket(ticket.id)}
              className="py-3 bg-red-500/10 hover:bg-red-500/20 
                       text-red-400 rounded-lg flex items-center justify-center gap-2
                       transition-all"
            >
              <Trash2 className="w-5 h-5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="animate-pulse-slow text-blue-400">Loading NFT Tickets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-12">
      <div className="max-w-[1400px] mx-auto"> {/* Increased max width */}
        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          My NFT Tickets
        </h1>
        
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-8"> {/* Single column for wider cards */}
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No tickets found</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Book Tickets
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
