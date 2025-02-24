export const checkPetraWallet = () => {
  if (!window.petra) {
    const installUrl = "https://petra.app/";
    
    const shouldInstall = window.confirm(
      "Petra Wallet is required to mint tickets. Would you like to install it now?"
    );
    
    if (shouldInstall) {
      window.open(installUrl, '_blank');
    }
    
    return false;
  }
  return true;
};

export const isPetraInstalled = () => {
  return typeof window.petra !== 'undefined';
};
