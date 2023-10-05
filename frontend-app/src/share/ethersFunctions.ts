export function shortenEthAddress(ethAddress: string, length = 6) {
    if (!ethAddress || ethAddress.length !== 42) throw new Error('Invalid Ethereum address');
    return `${ethAddress.substring(0, length)}...${ethAddress.substring(ethAddress.length - length)}`;
}