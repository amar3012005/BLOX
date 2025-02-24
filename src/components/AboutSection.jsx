import React, { useState, useEffect } from 'react';
import { Info, X, Camera, Star, Timer } from 'lucide-react';
import { generateTicketBackground } from '../services/ticketGenerator';
import { useUser } from '../context/UserContext';
import { AptosClient } from 'aptos';
import html2canvas from 'html2canvas';
import { saveTicketToCSV } from '../utils/csvHelper';
import { useLocation } from 'react-router-dom'; // Add useLocation import
import { handleResell, getWalletBalance, calculateRoyalty } from '../utils/ticketMarket';

const ConcertBooking = () => { // Update component name
  const { user } = useUser();
  const routerLocation = useLocation();
  const { venue } = routerLocation.state || { venue: 'LONDON' };
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showBidding, setShowBidding] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidTimeLeft, setBidTimeLeft] = useState(5);
  const [bidInterval, setBidInterval] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null); // Add this state

  const vipseatPrice = finalPrice || 5000.00; // Use finalPrice if available, otherwise use default
  const regularseatPrice = 1000.00;

  const startBidding = (seatId) => {
    const basePrice = seatId.startsWith('A') || seatId.startsWith('B') ? vipseatPrice : regularseatPrice;
    setSelectedSeat(seatId); // Add this line to track selected seat
    setCurrentBid(basePrice);
    setShowBidding(true);
    setBidTimeLeft(5);
    
    // Start bid timer
    const interval = setInterval(() => {
      setBidTimeLeft((prev) => {
        if (prev <= 1) {
          // Increase bid by 10%
          setCurrentBid(current => Math.floor(current * 1.1));
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    setBidInterval(interval);
  };

  const handleSeatClick = (seatId) => {
    if (seatId.startsWith('A') || seatId.startsWith('B')) {
      startBidding(seatId);
    } else {
      setSelectedSeat(seatId);
      setShowTicket(true);
    }
  };

  const ensureTestnetConnection = async (petra) => {
    try {
      const network = await petra.network();
      if (network !== 'testnet') {
        await petra.network().setNetwork('testnet');
        console.log('Switched to testnet');
      }
      return true;
    } catch (error) {
      console.error('Network switch error:', error);
      return false;
    }
  };

  const CONTRACT_CONFIG = {
    moduleAddress: "0x75f785ec1076fa2ce6050a7c2f4bd91585dee446d666d56696c6da927365e6e6",
    moduleName: "ticket",
    functionName: "mint_ticket",
    nodeUrl: "https://fullnode.testnet.aptoslabs.com/v1"
  };

  const TicketPopup = () => {
    const [ticketBg, setTicketBg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [nftStatus, setNftStatus] = useState(null);

    useEffect(() => {
      let mounted = true;

      const generateBg = async () => {
        try {
          const bgImage = await generateTicketBackground(selectedSeat);
          if (mounted) {
            setTicketBg(bgImage);
          }
        } catch (error) {
          console.error('Failed to generate background:', error);
        }
      };

      generateBg();

      return () => {
        mounted = false;
      };
    }, []);

    const handleConnectWallet = async () => {
      try {
        setIsLoading(true);
        setNftStatus({ message: 'Connecting wallet...' });
        
        if (typeof window.aptos === "undefined") {
          throw new Error("Please install Petra wallet!");
        }

        const petra = window.aptos;
        await ensureTestnetConnection(petra);
        const response = await petra.connect();
        
        if (!response.address) {
          throw new Error("Failed to connect wallet");
        }

        setWalletAddress(response.address);
        setWalletConnected(true);
        setNftStatus({ 
          message: 'Wallet connected successfully! Click Mint to continue.'
        });
        
      } catch (error) {
        console.error('Wallet connection failed:', error);
        setNftStatus({ error: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    const handleMintNFT = async () => {
      try {
        setIsLoading(true);
        setNftStatus({ message: 'Capturing ticket...' });
    
        // 1. Capture ticket image
        const ticketElement = document.querySelector('.ticket-container');
        const canvas = await html2canvas(ticketElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#000000'
        });
    
        // 2. Upload image first
        setNftStatus({ message: 'Uploading to IPFS...' });
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        const file = new File([blob], 'ticket.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', file);
    
        const uploadResponse = await fetch('http://localhost:3003/api/upload', {
          method: 'POST',
          body: formData
        });
    
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
    
        const { imageUrl, ipfsHash } = await uploadResponse.json();
    
        // 3. Then mint NFT
        setNftStatus({ message: 'Minting NFT...' });
        const petra = window.aptos;
        
        const transaction = {
          function: `${CONTRACT_CONFIG.moduleAddress}::${CONTRACT_CONFIG.moduleName}::mint_ticket`,
          type_arguments: [],
          arguments: [parseInt(selectedSeat.replace(/[A-Z]/g, ''))],
          type: "entry_function_payload"
        };
    
        // 4. Submit transaction
        const pendingTx = await petra.signAndSubmitTransaction(transaction);
        setNftStatus({ message: 'Confirming transaction...' });
    
        // 5. Wait for confirmation
        const client = new AptosClient(CONTRACT_CONFIG.nodeUrl);
        const txnResult = await client.waitForTransactionWithResult(pendingTx.hash);
    
        // After successful mint, save to CSV
        await saveTicketToCSV({
          id: pendingTx.hash,
          seatId: selectedSeat,
          imageUrl,
          txHash: pendingTx.hash,
          venue,
          price: vipseatPrice,
          date: "2025",
          walletAddress: walletAddress,
          status: 'active'
        });

        if (txnResult.success) {
          console.log('NFT Minted Successfully, saving to CSV...');
          
          const ticketDetails = {
            id: pendingTx.hash,
            seatId: selectedSeat,
            imageUrl: imageUrl,
            txHash: pendingTx.hash,
            venue: venue,
            price: selectedSeat.startsWith('A') || selectedSeat.startsWith('B') ? vipseatPrice : regularseatPrice,
            date: "2025",
            walletAddress: walletAddress,
            status: 'active',
            mintedAt: new Date().toISOString()
          };
  
          console.log('Saving ticket details:', ticketDetails);
          const saveResult = await saveTicketToCSV(ticketDetails);
          console.log('Ticket save result:', saveResult);
  
          if (saveResult.success) {
            setNftStatus({
              success: true,
              message: 'NFT Minted and Saved Successfully!',
              txHash: pendingTx.hash,
              tokenData: txnResult,
              imageUrl
            });
          } else {
            throw new Error('Failed to save ticket data');
          }
        }
    
      } catch (error) {
        console.error('Minting error:', error);
        setNftStatus({ 
          error: error.message || 'Failed to mint NFT'
        });
      } finally {
        setIsLoading(false);
      }
    };

    const NFTSuccessView = ({ txHash, tokenData, imageUrl, walletAddress }) => (
      <div className="space-y-6 p-2">
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                NFT Minted Successfully!
              </h3>
              <p className="text-gray-400">Your ticket has been minted as an NFT on the Aptos blockchain</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-black/50 rounded-lg border border-blue-500/20 p-4">
              <h4 className="text-blue-400 text-sm font-bold mb-3">NFT METADATA</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Collection</span>
                  <span className="text-white">Concert Tickets</span> {/* Update collection */}
                </div>
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Token Name</span>
                  <span className="text-white">COLDPLAY LIVE #{selectedSeat}</span> {/* Update token name */}
                </div>
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Seat</span>
                  <span className="text-white">{selectedSeat}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">2025</span> {/* Update date */}
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white">19:30</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Owner</span>
                  <span className="text-white font-mono text-xs">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-black/50 rounded-lg border border-blue-500/20 p-4">
              <h4 className="text-blue-400 text-sm font-bold mb-3">BLOCKCHAIN DETAILS</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">Aptos Testnet</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-500/10">
                  <span className="text-gray-400">Contract</span>
                  <span className="text-white font-mono">{CONTRACT_CONFIG.moduleAddress.slice(0, 6)}...{CONTRACT_CONFIG.moduleAddress.slice(-4)}</span>
                </div>
                <div className="group py-2">
                  <div className="text-gray-400 mb-1">Transaction Hash</div>
                  <a 
                    href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors break-all font-mono text-xs"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-black/50 rounded-lg border border-blue-500/20 p-4">
              <h4 className="text-blue-400 text-sm font-bold mb-3">QUICK LINKS</h4>
              <div className="space-y-3">
                <a 
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors"
                >
                  <span className="text-sm text-white">View on IPFS</span>
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {walletAddress && (
                  <a 
                    href={`https://explorer.aptoslabs.com/account/${walletAddress}/tokens?network=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors"
                  >
                    <span className="text-sm text-white">View in Wallet</span>
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-black/50 rounded-lg border border-blue-500/20 p-4">
              <h4 className="text-blue-400 text-sm font-bold mb-3">IMPORTANT NOTICE</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                This NFT serves as your digital ticket. Present the QR code at the entrance.
                The ticket is non-transferable and linked to your wallet address.
              </p>
            </div>

            <button
              onClick={() => setShowTicket(false)}
              className="w-full py-3 px-4 mt-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 
                       hover:from-green-500/30 hover:to-blue-500/30
                       text-white font-bold rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50">
        <div className="relative max-w-lg w-full mx-4">
          <div className="ticket-container bg-zinc-900 p-6 rounded-lg border border-blue-500/30">
            <div className="relative border border-blue-500/20 rounded-md overflow-hidden">
              <div className="bg-zinc-800 p-2 flex justify-between items-center border-b border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-500">STAGE_01</span> {/* Update stage */}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-blue-500">VIP</span> {/* Update category */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div className="relative">
                  <div className="aspect-[3/4] relative overflow-hidden rounded border border-blue-500/20">
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: ticketBg ? `url(${ticketBg})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-blue-500 border border-blue-500/20">
                    LIVE
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-blue-500 border border-blue-500/20">
                    WORLD TOUR
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-wider text-white">COLDPLAY LIVE</h2> {/* Update title */}
                    <div className="text-blue-500 text-sm mt-1">19:30 • 2025</div> {/* Update date */}
                  </div>

                  <div className="bg-zinc-800/50 p-3 rounded border border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">SEAT</div>
                        <div className="text-xl font-bold text-blue-500">{selectedSeat}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">PRICE</div>
                        <div className="text-xl font-bold text-blue-500">₹{vipseatPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-800/50 p-2 rounded border border-blue-500/20">
                      <div className="text-gray-400">RUNTIME</div>
                      <div className="text-blue-500">120 MIN</div> {/* Update runtime */}
                    </div>
                    <div className="bg-zinc-800/50 p-2 rounded border border-blue-500/20">
                      <div className="text-gray-400">STATUS</div>
                      <div className="text-green-500">VALID</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-4">
                    <Info className="w-4 h-4" />
                    <span>Digital ticket. Present at entrance.</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0" />
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-500/5 rounded border border-blue-500/10">
            {nftStatus?.error ? (
              <div className="text-red-500 text-sm mb-4">{nftStatus.error}</div>
            ) : nftStatus?.success ? (
              <NFTSuccessView 
                txHash={nftStatus.txHash} 
                tokenData={nftStatus.tokenData}
                imageUrl={nftStatus.imageUrl}
                walletAddress={walletAddress}
              />
            ) : (
              <button
                onClick={walletConnected ? handleMintNFT : handleConnectWallet}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                         rounded text-white font-bold tracking-wider
                         hover:from-blue-600 hover:to-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{nftStatus?.message || 'Processing...'}</span>
                  </div>
                ) : walletConnected ? (
                  'MINT NFT TICKET'
                ) : (
                  'CONNECT WALLET'
                )}
              </button>
            )}

            {walletConnected && !nftStatus?.success && (
              <div className="mt-2 text-xs text-blue-400 text-center">
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}

            {nftStatus?.message && !nftStatus.error && !nftStatus.success && (
              <div className="mt-2 text-sm text-blue-400 text-center animate-pulse">
                {nftStatus.message}
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowTicket(false)}
            className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  // Update SeatRow component to receive selectedSeat as prop
  const SeatRow = ({ row, start, end, unavailable = [], onSelect }) => {
    const getSeatColor = (seatId) => {
      if (selectedSeat === seatId) return 'bg-blue-500 border-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      return 'bg-black border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    };

    return (
      <div className="flex items-center gap-3">
        <div className="w-6 text-gray-500 font-['Share_Tech_Mono']">{row}</div>
        <div className="flex gap-2">
          {Array.from({ length: end - start + 1 }, (_, i) => {
            const seatNum = start + i;
            const seatId = `${row}${seatNum}`;
            const isUnavailable = unavailable.includes(seatNum);
            
            return (
              <button
                key={seatId}
                disabled={isUnavailable}
                onClick={() => onSelect(seatId)}
                className={`w-8 h-8 text-xs border rounded-sm transition-all duration-300 ${
                  isUnavailable 
                    ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed' 
                    : getSeatColor(seatId)
                }`}
              >
                {seatNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Move SeatRow inside the component to access selectedSeat
  const renderSeatRow = (row, start, end, unavailable = []) => (
    <SeatRow 
      key={row} 
      row={row} 
      start={start} 
      end={end} 
      unavailable={unavailable}
      onSelect={handleSeatClick}
    />
  );

  const BiddingContainer = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-8 max-w-md w-full border border-blue-500/20">
        <div className="text-center space-y-6">
          {/* Bid Timer */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl font-bold text-blue-400">{bidTimeLeft}</div>
            </div>
            <Timer className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full text-blue-500/20" />
          </div>

          {/* Current Bid */}
          <div>
            <div className="text-gray-400">Current Bid</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ₹{currentBid.toFixed(2)}
            </div>
          </div>

          {/* Next Bid Preview */}
          <div className="text-sm text-gray-400">
            Next bid will be ₹{(currentBid * 1.1).toFixed(2)}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                clearInterval(bidInterval);
                setFinalPrice(currentBid); // Update final price instead of vipseatPrice
                setShowTicket(true);
                setShowBidding(false);
              }}
              className="py-3 bg-blue-500/10 hover:bg-blue-500/20 
                       text-blue-400 rounded-lg flex items-center justify-center gap-2
                       transition-all font-bold"
            >
              Bid Now at ₹{currentBid.toFixed(2)}
            </button>
            <button
              onClick={() => {
                clearInterval(bidInterval);
                setShowBidding(false);
              }}
              className="py-3 bg-red-500/10 hover:bg-red-500/20 
                       text-red-400 rounded-lg flex items-center justify-center gap-2
                       transition-all"
            >
              Cancel
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Bid increases by 10% every 5 seconds
          </div>
        </div>
      </div>
    </div>
  );

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (bidInterval) {
        clearInterval(bidInterval);
      }
    };
  }, [bidInterval]);

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {user && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 border-b border-blue-500/20 p-4 z-40">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <img 
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-blue-500/20"
            />
            <div>
              <div className="text-blue-400 text-xs">LOGGED IN AS</div>
              <div className="text-white font-bold">{user.name}</div>
            </div>
          </div>
        </div>
      )}

      <div className="relative py-12 px-4 mt-16">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#111_1px,transparent_1px),linear-gradient(-45deg,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-blue-900/5" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-['Orbitron'] tracking-widest mb-2">
              COLDPLAY<span className="text-blue-500">_LIVE</span>
            </h1>
            <div className="text-blue-400 text-sm tracking-[0.3em] mb-4">
              {venue} • STAGE_01 • 19:30 • 2025
            </div>
            <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>

          {/* Enhanced Stage Representation */}
          <div className="relative mb-20">
            <div className="h-3 bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20 rounded-full
                          shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse" />
            <div className="text-center text-sm text-blue-400 mt-4 font-['Share_Tech_Mono']">MAIN_STAGE</div>
            {/* Stage Decorative Lines */}
            <div className="absolute -left-4 top-0 w-8 h-8 border-l-2 border-t-2 border-blue-500/30" />
            <div className="absolute -right-4 top-0 w-8 h-8 border-r-2 border-t-2 border-blue-500/30" />
          </div>

          {/* Enhanced Seating Layout */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* VIP Section */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-lg -z-10" />
              <div className="bg-black/40 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <h2 className="text-purple-400 font-['Share_Tech_Mono'] tracking-wider">VIP SECTION</h2>
                  <div className="text-xs text-purple-400/60">₹{vipseatPrice.toFixed(2)}</div>
                </div>
                <div className="space-y-3">
                  {renderSeatRow("A", 1, 23, [5, 6, 7, 8, 9, 10])}
                  {renderSeatRow("B", 1, 24, [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])}
                </div>
              </div>
            </div>

            {/* Regular Section */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-lg -z-10" />
              <div className="bg-black/40 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h2 className="text-blue-400 font-['Share_Tech_Mono'] tracking-wider">REGULAR SECTION</h2>
                  <div className="text-xs text-blue-400/60">₹{regularseatPrice.toFixed(2)}</div>
                </div>
                <div className="space-y-3">
                  {['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(row => (
                    <SeatRow 
                      key={row} 
                      row={row} 
                      start={6} 
                      end={24} 
                      unavailable={[18, 19, 20]} 
                      onSelect={handleSeatClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="fixed top-8 right-8 bg-black/90 backdrop-blur-sm border border-blue-500/20 p-6 rounded-lg">
            <div className="text-sm mb-4 font-['Share_Tech_Mono'] text-blue-400">SEAT_STATUS</div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-black border border-blue-500/30 rounded-sm" />
                <span className="text-xs text-gray-400">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded-sm animate-pulse" />
                <span className="text-xs text-gray-400">SELECTED</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-800 border border-gray-700 opacity-50 rounded-sm" />
                <span className="text-xs text-gray-400">UNAVAILABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show ticket popup when a seat is selected */}
      {showBidding && <BiddingContainer />}
      {showTicket && <TicketPopup />}
    </div>
  );
};

export default ConcertBooking;