import {Contract, ethers} from 'ethers';
import {signMetaTxRequest} from './signer';
import {apiRegister} from "@/apis";
import {ForwarderAddress, SubscriptionContractAddress} from "@/share/ethersConfig";
import {ForwarderAbi, SubscriptionContractAbi} from "@/share/ethersABIs";

export const sendMetaTx = async (signer: any, preference: string) => {
    const from = await signer.getAddress();
    const forwarder = new Contract(ForwarderAddress, ForwarderAbi, signer);
    const notSubscription = new Contract(SubscriptionContractAddress[0], SubscriptionContractAbi, signer);
    const data = ethers.utils.defaultAbiCoder.encode(["string"], [preference]);
    const aftSubscriptionAddr = notSubscription.address;
    const request = await signMetaTxRequest(signer.provider, forwarder, {
        to: aftSubscriptionAddr,
        from,
        data
    });
    await apiRegister(request)
};

export const registerName = async ({preference}: { preference: string }) => {
    if (!window.ethereum) throw new Error(`User wallet not found`);
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = await provider.getSigner();
    return sendMetaTx(signer, preference);
};