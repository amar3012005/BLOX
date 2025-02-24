import { ethers } from 'ethers';

const NETWORK = process.env.REACT_APP_NETWORK || 'sepolia';

/**
 * Get contract address from environment or localStorage
 */
export const getContractAddress = async () => {
  try {
    // Get the hardcoded address first (from deployment)
    const contractAddress = '0x5731aA075AD88708Ad9CC58475fd583C9bAa424E'; // Replace with your deployed contract address
    
    console.log('Using contract address:', contractAddress);
    return contractAddress;

  } catch (error) {
    console.error('Error getting contract address:', error);
    throw error;
  }
};

/**
 * Verify contract exists at address
 */
export const verifyContract = async (address, abi) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);
    const exists = code !== '0x';
    console.log('Contract exists:', exists, 'at address:', address);
    return exists;
  } catch (error) {
    console.error('Error verifying contract:', error);
    return false;
  }
};

/**
 * Save contract address to local storage
 */
export const cacheContractAddress = (address) => {
  localStorage.setItem(`contract_${NETWORK}_address`, address);
};
