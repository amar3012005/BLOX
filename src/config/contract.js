export const CONTRACT_CONFIG = {
  moduleAddress: "YOUR_DEPLOYED_MODULE_ADDRESS", // Update this after deployment
  moduleName: "nft_ticket",
  nodeUrl: "https://fullnode.testnet.aptoslabs.com/v1"
};

// Helper to validate module exists
export const validateModule = async (client, address, moduleName) => {
  try {
    await client.getAccountModule(address, moduleName);
    return true;
  } catch {
    return false;
  }
};
