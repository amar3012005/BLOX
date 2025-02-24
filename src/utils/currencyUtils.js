export const INR_TO_APT_RATE = 0.00001; // Example rate: 1 INR = 0.00001 APT
export const APT_DECIMALS = 8;

export const convertInrToApt = (inrAmount) => {
  const aptAmount = parseFloat(inrAmount) * INR_TO_APT_RATE;
  return parseFloat(aptAmount.toFixed(APT_DECIMALS));
};

export const formatAptAmount = (aptAmount) => {
  if (typeof aptAmount !== 'number' || isNaN(aptAmount)) {
    return '0.00000000 APT';
  }
  return `${aptAmount.toFixed(APT_DECIMALS)} APT`;
};
