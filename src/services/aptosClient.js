import { AptosClient } from 'aptos';
import { checkPetraWallet, isPetraInstalled } from '../utils/walletHelpers';

const client = new AptosClient(process.env.REACT_APP_APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1');
const MODULE_ADDRESS = process.env.REACT_APP_MODULE_ADDRESS;

export const connectWallet = async () => {
  if (!isPetraInstalled()) {
    checkPetraWallet();
    throw new Error('Please install Petra Wallet and refresh the page');
  }

  try {
    await window.petra.connect();
    const account = await window.petra.account();
    return {
      address: account.address,
      publicKey: account.publicKey
    };
  } catch (error) {
    console.error('Error connecting to Petra Wallet:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
};

export const mintTicketNFT = async (eventName, seatNumber, price) => {
  if (!window.petra) {
    throw new Error('Petra Wallet not found');
  }

  try {
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::ticket::mint_ticket`,
      type_arguments: [],
      arguments: [
        MODULE_ADDRESS,
        eventName,
        seatNumber,
        price.toString()
      ]
    };

    const transaction = await window.petra.signAndSubmitTransaction(payload);
    return await client.waitForTransactionWithResult(transaction.hash);
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error(error.message || 'Failed to mint NFT');
  }
};

export const getWalletBalance = async (address) => {
  try {
    const resources = await client.getAccountResources(address);
    const accountResource = resources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
    return accountResource?.data?.coin?.value || '0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
};
