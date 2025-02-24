import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AptosClient } from 'aptos';

const TicketBooking = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);

  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintingError, setMintingError] = useState(null);

  const { movieName, duration } = location.state || {};
  const TICKET_PRICE = 200; // Price in INR per seat

  // Contract configuration for Aptos Testnet
  const MODULE_ADDRESS = "e4b8efcee4100fb4713d070bb76f7a9c1ce6fdacf38b2be349263f64951c469c";
  const MODULE_NAME = "ticket";
  const FUNCTION_NAME = "mint_ticket";

  useEffect(() => {
    const loadMovieInfo = async () => {
      try {
        setMovieInfo({
          name: movieName,
          duration,
          showTime: "19:30",
          screen: "SCREEN_01"
        });
        setIsLoaded(true);
      } catch (error) {
        setError(error.message);
      }
    };

    loadMovieInfo();
  }, [movieName, duration]);

  const handleSeatSelect = (seatId) => {
    setSelectedSeats(prev => 
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  const mintNFTTicket = async () => {
    try {
      setMinting(true);
      setMintingError(null);

      if (typeof window.aptos === "undefined") {
        throw new Error("Please install Petra wallet!");
      }

      const petra = window.aptos;
      
      // Ensure we're on testnet
      const network = await petra.network();
      if (network !== 'testnet') {
        await petra.network().setNetwork('testnet');
      }

      const transaction = {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}`,
        type_arguments: [],
        arguments: [
          userAddress,
          JSON.stringify({
            movieId,
            movieName,
            seats: selectedSeats,
            showTime: "19:30",
            date: new Date().toISOString().split('T')[0],
            price: TICKET_PRICE * selectedSeats.length
          })
        ]
      };

      console.log("Submitting transaction:", transaction);
      
      const pendingTx = await petra.signAndSubmitTransaction(transaction);
      console.log("Transaction submitted:", pendingTx);
      
      const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');
      await client.waitForTransaction(pendingTx.hash);

      return true;
    } catch (error) {
      console.error("Error minting NFT ticket:", error);
      setMintingError(error.message);
      return false;
    } finally {
      setMinting(false);
    }
  };

  const handleCheckout = async () => {
    if (selectedSeats.length > 0) {
      const mintingSuccess = await mintNFTTicket();
      if (mintingSuccess) {
        navigate('/confirmation', {
          state: {
            movieName,
            seats: selectedSeats,
            totalAmount: TICKET_PRICE * selectedSeats.length,
            ticketMinted: true
          }
        });
      }
    }
  };

  // ...existing seat rendering code from AboutSection...
  // ...existing UI components for seat selection...

  return (
    <div className="bg-black min-h-screen p-4">
      {/* Copy over your seat selection UI from AboutSection */}
      {/* Update the checkout button to handle NFT minting */}
    </div>
  );
};

export default TicketBooking;
