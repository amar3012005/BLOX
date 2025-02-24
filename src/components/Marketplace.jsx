import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMarketplaceListings, purchaseTicket, handleResell } from '../utils/ticketMarket';
import { MARKET_CONFIG, calculatePriceDistribution } from '../utils/marketplaceConfig';
import { sendPayment } from '../utils/payments';
import { Clock, DollarSign, Tag, Users, Shield, Award, X } from 'lucide-react';
import { AptosClient } from 'aptos';
import { convertInrToApt, formatAptAmount } from '../utils/currencyUtils';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState(null);
  const [resellTicket, setResellTicket] = useState(null);
  const [isReselling, setIsReselling] = useState(false);
  const [resellPrice, setResellPrice] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [purchasedListing, setPurchasedListing] = useState(null); // Add this new state
  const location = useLocation();
  const { ticket } = location.state || {};

  const handleConnectWallet = async () => {
    try {
      if (typeof window.aptos === "undefined") {
        throw new Error("Please install Petra wallet!");
      }
      const petra = window.aptos;
      const response = await petra.connect();
      if (!response.address) {
        throw new Error("Failed to connect wallet");
      }
      setWalletAddress(response.address);
      setWalletConnected(true);
      return true;
    } catch (error) {
      setStatus({ error: error.message });
      return false;
    }
  };

  useEffect(() => {
    if (ticket) {
      setIsReselling(true);
      // Initialize resell form with ticket data including image
      setResellTicket({
        ...ticket,
        originalPrice: ticket.price,
        imageUrl: ticket.imageUrl, // Ensure imageUrl is included
        ticketId: ticket.seatId
      });
    }
    loadListings();
  }, [ticket]);

  const loadListings = () => {
    const activeListings = getMarketplaceListings().filter(l => l.status === 'listed');
    setListings(activeListings);
    setLoading(false);
  };

  const handlePurchase = async (listing) => {
    try {
      if (!window.aptos) {
        throw new Error('Please install Petra wallet');
      }

      if (!walletConnected) {
        await handleConnectWallet();
      }

      setStatus({ loading: true, message: 'Processing purchase...' });
      const petra = window.aptos;
      
      const priceInApt = convertInrToApt(listing.resalePrice);
      const priceInOctas = Math.floor(priceInApt * 100_000_000).toString();

      // Format seller address to ensure it starts with '0x'
      const sellerAddress = listing.seller.startsWith('0x') 
        ? listing.seller 
        : `0x${listing.seller}`;

      const transaction = {
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [sellerAddress, priceInOctas], // Use formatted address
        type: "entry_function_payload"
      };
      const pendingTx = await petra.signAndSubmitTransaction(transaction);
      setStatus({ message: 'Confirming transaction...' });

      const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');
      const txResult = await client.waitForTransactionWithResult(pendingTx.hash);

      if (!txResult.success) {
        throw new Error('Transaction failed');
      }

      // Update listing status and ownership
      const result = await purchaseTicket(listing, walletAddress);
      
      if (result.success) {
        setStatus({ 
          success: true, 
          message: 'Purchase successful! NFT transferred to your wallet.',
          hash: pendingTx.hash
        });
        setPurchasedListing(listing.id); // Set the purchased listing ID
        loadListings();
      }

    } catch (error) {
      setStatus({ 
      });
    }
  };

  const handleResellSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await handleResell({
        ...resellTicket,
        price: parseFloat(resellPrice),
        imageUrl: resellTicket.imageUrl, // Include the image URL
        walletAddress: ticket.walletAddress
      });

      if (result.success) {
        setIsReselling(false);
        loadListings();
      }
    } catch (error) {
      console.error('Resell failed:', error);
    }
  };

  const ResellForm = () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-blue-500/20">
        <h2 className="text-xl font-bold mb-4">Resell Ticket</h2>
        
        {/* Add ticket preview */}
        {resellTicket?.imageUrl && (
          <div className="mb-6">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img 
                src={resellTicket.imageUrl} 
                alt="Ticket Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="mt-2 text-sm text-gray-400 text-center">
              Seat {resellTicket.ticketId}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Original Price</label>
            <div className="text-blue-400">₹{ticket?.price || 0}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Set Resell Price</label>
            <input
              type="number"
              value={resellPrice}
              onChange={(e) => setResellPrice(e.target.value)}
              className="w-full bg-black/50 border border-blue-500/20 rounded p-2 text-white"
              placeholder="Enter price in ₹"
            />
          </div>

          {resellPrice && (
            <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Royalty ({MARKET_CONFIG.ROYALTY_PERCENTAGE}%)</span>
                <span className="text-blue-400">₹{(parseFloat(resellPrice) * MARKET_CONFIG.ROYALTY_PERCENTAGE / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Platform Fee ({MARKET_CONFIG.PLATFORM_FEE_PERCENTAGE}%)</span>
                <span className="text-blue-400">₹{(parseFloat(resellPrice) * MARKET_CONFIG.PLATFORM_FEE_PERCENTAGE / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleResellSubmit}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
            >
              Confirm Listing
            </button>
            <button
              onClick={() => setIsReselling(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const NFTModal = ({ listing, onClose }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black max-w-3xl w-full rounded-xl border border-blue-500/20 p-8">
        <div className="flex flex-col gap-6">
          
          {/* NFT Details */}
          <div className="space-y-6">
            <div>
              
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                <h3 className="text-sm font-bold text-blue-400 mb-3">LISTING DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Original Price</span>
                    <span className="text-white">₹{listing.originalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resale Price</span>
                    <span className="text-blue-400">₹{listing.resalePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seller</span>
                    <span className="text-purple-400 font-mono">
                      {`${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                <h3 className="text-sm font-bold text-blue-400 mb-3">FEE BREAKDOWN</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Royalty</span>
                    <span className="text-purple-400">₹{listing.royaltyAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="text-green-400">₹{listing.platformFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seller Receives</span>
                    <span className="text-blue-400">₹{listing.sellerReceives}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase(listing)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                       rounded-lg text-white font-bold hover:from-blue-600 
                       hover:to-blue-700 transition-all"
            >
              Purchase NFT
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const ListingCard = ({ listing, onPurchase, walletAddress, status }) => (
    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-lg border border-blue-500/20 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-blue-400 mb-2 flex items-center gap-2">
          <Tag className="w-3 h-3" />
          LISTED {new Date(listing.createdAt).toLocaleDateString()}
        </div>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-2xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            COLDPLAY_LIVE
          </h3>
          
        </div>
      </div>

      {/* Price Info */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
          <div>
            <div className="text-gray-400 text-sm">Original Price</div>
            <div className="text-lg text-white">
              {formatAptAmount(convertInrToApt(listing.originalPrice))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Resale Price</div>
            <div className="text-xl font-bold text-blue-400">
              {formatAptAmount(convertInrToApt(listing.resalePrice))}
            </div>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-sm p-2 rounded bg-blue-500/5">
          <div className="flex items-center gap-2 text-gray-400">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Royalty</span>
          </div>
          <span className="text-purple-400">
            {formatAptAmount(convertInrToApt(listing.royaltyAmount))}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm p-2 rounded bg-blue-500/5">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Platform Fee</span>
          </div>
          <span className="text-green-400">₹{listing.platformFee}</span>
        </div>
        <div className="flex items-center justify-between text-sm p-2 rounded bg-blue-500/5">
          <div className="flex items-center gap-2 text-gray-400">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span>Seller Receives</span>
          </div>
          <span className="text-blue-400">₹{listing.sellerReceives}</span>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={() => onPurchase(listing)}
        disabled={listing.seller === walletAddress || status?.loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 
                   hover:from-blue-600 hover:to-blue-700 rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300 flex items-center justify-center gap-2"
      >
        {status?.loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>{status.message}</span>
          </div>
        ) : listing.seller === walletAddress ? (
          'Your Listing'
        ) : (
          'Purchase Ticket'
        )}
      </button>

      {/* Status Messages */}
      {status?.error && (
        <div className="mt-2 text-red-400 text-sm text-center">
          {status.message}
        </div>
      )}
      {status?.success && purchasedListing === listing.id && (
        <div className="mt-2 text-green-400 text-sm text-center">
          Purchase successful! 
          <a 
            href={`https://explorer.aptoslabs.com/txn/${status.hash}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 ml-2"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Marketplace
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse and purchase verified resale tickets with guaranteed authenticity and fair pricing.
          </p>
        </div>

        {/* Enhanced Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <Shield className="w-6 h-6 text-green-400" />,
              title: "Verified Authentic",
              description: "All tickets are verified through blockchain"
            },
            {
              icon: <Tag className="w-6 h-6 text-blue-400" />,
              title: "Fair Pricing",
              description: `Max markup: ${MARKET_CONFIG.MAX_MARKUP_PERCENTAGE}% above original`
            },
            {
              icon: <Award className="w-6 h-6 text-purple-400" />,
              title: "Artist Royalties",
              description: `${MARKET_CONFIG.ROYALTY_PERCENTAGE}% royalty on each resale`
            }
          ].map((item, index) => (
            <div key={index} className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-3">
                {item.icon}
                <h3 className="font-bold text-lg">{item.title}</h3>
              </div>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onPurchase={handlePurchase} 
              walletAddress={walletAddress} 
              status={status} 
            />
          ))}
        </div>
      </div>

      {isReselling && <ResellForm />}
      {selectedNFT && (
        <NFTModal 
          listing={selectedNFT} 
          onClose={() => setSelectedNFT(null)} 
        />
      )}
    </div>
  );
};

export default Marketplace;
