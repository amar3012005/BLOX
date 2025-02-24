import { AptosClient } from 'aptos';
import { validateResalePrice, MARKET_CONFIG, calculatePriceDistribution } from './marketplaceConfig';
import { convertInrToApt } from './currencyUtils';

export const calculateRoyalty = (price) => {
  const ROYALTY_PERCENTAGE = 10;
  return (price * ROYALTY_PERCENTAGE) / 100;
};

export const handleResell = async (ticket, resalePrice, walletAddress) => {
  try {
    // Convert prices to APT
    const originalPriceInApt = convertInrToApt(ticket.price);
    const resalePriceInApt = convertInrToApt(resalePrice);
    
    // Validate price against maximum markup
    validateResalePrice(originalPriceInApt, resalePriceInApt);

    // Calculate fees
    const fees = calculatePriceDistribution(resalePriceInApt);

    // Create marketplace listing
    const listing = {
      id: `${ticket.id}-${Date.now()}`,
      ticketId: ticket.id,
      seller: walletAddress,
      originalPrice: ticket.price,
      resalePrice: resalePrice,
      royaltyAmount: fees.royalty,
      platformFee: fees.platformFee,
      sellerReceives: fees.sellerReceives,
      status: 'listed',
      createdAt: new Date().toISOString()
    };

    // Store listing in local storage
    const listings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
    listings.push(listing);
    localStorage.setItem('marketplaceListings', JSON.stringify(listings));

    return {
      success: true,
      listing,
      fees,
      message: `Ticket listed for ${resalePrice} with ${MARKET_CONFIG.ROYALTY_PERCENTAGE}% royalty`
    };
  } catch (error) {
    throw error;
  }
};

export const getWalletBalance = async (address, contractConfig) => {
  try {
    const client = new AptosClient(contractConfig.nodeUrl);
    const resources = await client.getAccountResources(address);
    const coinResource = resources.find(r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
    return coinResource?.data?.coin?.value || 0;
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    return 0;
  }
};

export const getMarketplaceListings = () => {
  return JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
};

export const purchaseTicket = async (listing, buyerAddress) => {
  try {
    const listings = getMarketplaceListings();
    const updatedListings = listings.map(l => 
      l.id === listing.id ? { ...l, status: 'sold', buyerAddress, soldAt: new Date().toISOString() } : l
    );
    localStorage.setItem('marketplaceListings', JSON.stringify(updatedListings));
    
    return {
      success: true,
      message: 'Purchase successful',
      transaction: {
        listingId: listing.id,
        buyer: buyerAddress,
        price: listing.resalePrice,
        fees: {
          royalty: listing.royaltyAmount,
          platformFee: listing.platformFee
        }
      }
    };
  } catch (error) {
    throw error;
  }
};
