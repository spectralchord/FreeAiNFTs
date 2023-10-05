import {ethers, Signer} from "ethers";
import {SubscriptionContractAbi} from "./ethers/SubscriptionContractAbi";
import axios from "axios";
import {Buffer} from 'buffer'
import {SUBSCRIPTION_TIME_INTERVAL, SUBSCRIPTIONS_CONTRACTS, SUBSCRIPTIONS_RELAYERS_KEYS} from "./ethers/config";

global.Buffer = Buffer

export const getLastBatchTime = async (contractAddress: string, provider: any) => {
    try {
        const contractInstance = new ethers.Contract(contractAddress, SubscriptionContractAbi, provider);
        const batchesCount = await contractInstance.getBatchesCount()

        if (batchesCount > 0) {
            const lastBatchInfo = await contractInstance.getBatchInfo(batchesCount - 1)
            return lastBatchInfo.timestamp;
        } else {
            return 0
        }
    } catch (e) {
        console.error(e)
        return -1
    }
}


const generateAndSendNft = async ({contractAddress, signer}: { contractAddress: string, signer: Signer }) => {
    const contract = new ethers.Contract(contractAddress, SubscriptionContractAbi, signer);

    const arrayImgUrl = []
    const bufferArrayForIpfs = []
    const metadataArray = []
    const metadataArrayForIpfs = []

    const countSubs = await contract.getSubscribersCount();

    if (parseInt(countSubs) === 0) {
        return "No subscribers"
    }

    for (let i = 0; i < countSubs; i++) {
        const userInfo = await contract.getSubscriberInfo(i);
        const preference = userInfo["preference"];
        const reqBody = {
            "prompt": preference,
            "n": 1,
            "size": "512x512"
        }

        const res = await axios.post('https://api.openai.com/v1/images/generations', JSON.stringify(reqBody), {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${process.env.OPEN_AI_KEY}`
            }
        })
        const imgUrl = res.data.data[0].url
        arrayImgUrl.push(imgUrl)
    }

    for (let i = 0; i < arrayImgUrl.length; i++) {
        const image = await fetch(arrayImgUrl[i]);
        const arrBuff = await image.arrayBuffer();
        // @ts-ignore
        let returnedB64 = new Buffer.from(arrBuff).toString('base64');
        bufferArrayForIpfs.push({path: `image-${i + 1}`, content: returnedB64})
    }

    let resImage = await axios.post(process.env.STORAGE_IPFS_WEBHOOK, JSON.stringify(bufferArrayForIpfs), {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "X-API-Key": process.env.STORAGE_IPFS_KEY,
        },
    });

    resImage.data.map((item, index) => {
        let obj = {
            name: `AI NFT`,
            description: `NFT generated using AI`,
            image: item.path.slice(34),
        }
        metadataArray.push(obj)
        metadataArrayForIpfs.push({path: `data-${index + 1}`, content: obj})
    })

    const resMetadata = await axios.post(process.env.STORAGE_IPFS_WEBHOOK, JSON.stringify(metadataArrayForIpfs), {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "X-API-Key": process.env.STORAGE_IPFS_KEY,
        },
    });

    const uriArray = resMetadata.data.map(item => item.path.slice(34))
    const tx = await contract.mintAndSendNft(uriArray, {
        gasLimit: '10000000'
    });
    return tx.hash
}

export const sendNewBatch = async (index: string, provider: any) => {
    const indexNumber = Number(index);

    if (index === null || index === undefined) {
        throw new Error('Missing index in the request params!');
    }

    if (isNaN(indexNumber) || indexNumber < 0) {
        throw new Error('Invalid index value!');
    }

    if (indexNumber > SUBSCRIPTIONS_CONTRACTS.length || indexNumber > SUBSCRIPTIONS_RELAYERS_KEYS.length || indexNumber < 1) {
        throw new Error('Index out of bounds!');
    }

    const data = {
        contract: SUBSCRIPTIONS_CONTRACTS[indexNumber - 1],
        relayer: SUBSCRIPTIONS_RELAYERS_KEYS[indexNumber - 1],
    }

    let lastBatchTime = 0

    const contractAddress = SUBSCRIPTIONS_CONTRACTS[indexNumber - 1]
    const relayerWallet = new ethers.Wallet(SUBSCRIPTIONS_RELAYERS_KEYS[indexNumber - 1]);
    const relayerSigner = relayerWallet.connect(provider);

    const contract = new ethers.Contract(contractAddress, SubscriptionContractAbi, provider);
    const countSubs = await contract.getSubscribersCount();

    if (parseInt(countSubs) == 0) {
        throw new Error('No subscribers!');
    }

    const res = await getLastBatchTime(contractAddress, provider)
    lastBatchTime = parseInt(res) * 1000
    if (lastBatchTime >= 0) {
        const nowDate = new Date().getTime()
        const delta = nowDate - lastBatchTime
        if (delta >= SUBSCRIPTION_TIME_INTERVAL) {
            console.log('Can start fetch!')
            await generateAndSendNft({contractAddress: data.contract, signer: relayerSigner})
        } else {
            console.log('Wait')
        }
    } else {
        throw new Error('Error get last batch info!');
    }
    return {
        ...data,
        lastBatchTime
    }
}
