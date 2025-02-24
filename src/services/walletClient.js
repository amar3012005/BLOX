import { ethers } from 'ethers';
import { getContractAddress, verifyContract, cacheContractAddress } from '../utils/contractUtils';

// Updated ABI to match our contract
const NFT_CONTRACT_ABI = [
  "function mintTicket(string memory eventName, string memory seatNumber, uint256 price) public payable returns (uint256)",
  "function getTicket(uint256 tokenId) public view returns (tuple(string eventName, string seatNumber, uint256 price, uint256 timestamp))",
  "event TicketMinted(address indexed owner, uint256 indexed tokenId, string eventName, string seatNumber)"
];

// Network configurations
const NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
  }
};

const CURRENT_NETWORK = NETWORKS.sepolia;

// Add network switching
const switchNetwork = async (provider) => {
  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: CURRENT_NETWORK.chainId }
    ]);
  } catch (error) {
    if (error.code === 4902) {
      await provider.send('wallet_addEthereumChain', [{
        chainId: CURRENT_NETWORK.chainId,
        rpcUrls: [CURRENT_NETWORK.rpcUrl],
        chainName: CURRENT_NETWORK.name,
      }]);
    } else {
      throw error;
    }
  }
};

// Update connect wallet function
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Ensure correct network
    await switchNetwork(provider);
    
    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    return { address: accounts[0], signer };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    throw error;
  }
};

export const mintTicket = async (signer, eventName, seatNumber, price) => {
  try {
    // Get deployed contract address
    const contractAddress = await getContractAddress();
    console.log('Got contract address:', contractAddress);
    
    if (!contractAddress) {
      throw new Error('No contract address available');
    }

    // Verify contract exists
    const isValid = await verifyContract(contractAddress, NFT_CONTRACT_ABI);
    console.log('Contract validation:', isValid);
    
    if (!isValid) {
      throw new Error(`No contract found at address ${contractAddress}`);
    }

    // Cache verified address
    cacheContractAddress('TicketNFT', contractAddress);

    const contract = new ethers.Contract(
      contractAddress,
      NFT_CONTRACT_ABI,
      signer
    );

    // Convert price to Wei
    const priceInWei = ethers.parseEther(price.toString());

    // Mint the ticket
    const tx = await contract.mintTicket(
      eventName,
      seatNumber,
      priceInWei
    );

    console.log('Minting transaction submitted:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Find the TicketMinted event
    const event = receipt.events.find(e => e.event === 'TicketMinted');
    const tokenId = event.args.tokenId;

    return {
      success: true,
      hash: tx.hash,
      tokenId: tokenId.toString(),
      tokenData: {
        owner: event.args.owner,
        eventName,
        seatNumber,
        price: price.toString()
      }
    };

  } catch (error) {
    console.error('Detailed minting error:', error);
    throw new Error(`Minting failed: ${error.message}`);
  }
};
