import {Contract, ethers} from 'ethers';
import {signMetaTxRequest} from './signer';
import {apiRegister} from "@/apis";
import {ForwarderAddress} from "@/share/ethersConfig";
import {ForwarderAbi, SubscriptionContractAbi} from "@/share/ethersABIs";

export const sendMetaTx = async (signer: any, preference: string, contractAddress: string) => {
    const from = await signer.getAddress();
    const forwarder = new Contract(ForwarderAddress, ForwarderAbi, signer);
    const notSubscription = new Contract(contractAddress, SubscriptionContractAbi, signer);
    const data = ethers.utils.defaultAbiCoder.encode(["string"], [preference]);
    const aftSubscriptionAddr = notSubscription.address;
    const request = await signMetaTxRequest(signer.provider, forwarder, {
        to: aftSubscriptionAddr,
        from,
        data
    });
    await apiRegister(request)
};

export const registerName = async ({preference, contractAddress}: { preference: string, contractAddress: string | undefined }) => {
    if (!window.ethereum) throw new Error(User wallet not found);
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = await provider.getSigner();
    if (contractAddress)
        return sendMetaTx(signer, preference, contractAddress);
};
