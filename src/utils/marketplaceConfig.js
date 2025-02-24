export const MARKET_CONFIG = {
  MAX_MARKUP_PERCENTAGE: 30, // Maximum allowed markup from original price
  ROYALTY_PERCENTAGE: 10, // Royalty percentage for organizers
  PLATFORM_FEE_PERCENTAGE: 2.5, // Platform fee
  INITIAL_OWNER: "0x75f785ec1076fa2ce6050a7c2f4bd91585dee446d666d56696c6da927365e6e6"
};

export const validateResalePrice = (originalPrice, resalePrice) => {
  const maxAllowedPrice = originalPrice * (1 + MARKET_CONFIG.MAX_MARKUP_PERCENTAGE / 100);
  if (resalePrice > maxAllowedPrice) {
    throw new Error(`Price cannot exceed ${MARKET_CONFIG.MAX_MARKUP_PERCENTAGE}% of original price`);
  }
  return true;
};

export const calculatePriceDistribution = (resalePrice) => {
  const royalty = (resalePrice * MARKET_CONFIG.ROYALTY_PERCENTAGE) / 100;
  const platformFee = (resalePrice * MARKET_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
  const sellerReceives = resalePrice - royalty - platformFee;
  
  return {
    total: resalePrice,
    royalty,
    platformFee,
    sellerReceives,
    distributions: {
      seller: sellerReceives,
      owner: royalty,
      platform: platformFee
    }
  };
};
