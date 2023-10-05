import {Router} from 'express'
import {ethers} from "ethers";
import {ForwarderAbi} from "./ethers/ForwarderAbi";
import {registerUser} from "./ethers/functions";
import {ForwarderAddress, PROVIDER_URL, REGISTRATOR_WALLET_SECRET_KEY} from "./ethers/config";
import {sendNewBatch} from "./services";
import {RegisterRequest, SendBatchRequest} from "../types";

const addressRoute = Router()

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const registratorWallet = new ethers.Wallet(REGISTRATOR_WALLET_SECRET_KEY);
const signer = registratorWallet.connect(provider);

addressRoute.post('/register', async (req: RegisterRequest, res) => {
    try {
        if (!req.body.payload.request || !req.body) {
            throw new Error('Missing payload');
        }

        const {request, signature} = req.body.payload;
        const forwarder = new ethers.Contract(ForwarderAddress, ForwarderAbi, signer);
        const tx = await registerUser(forwarder, request, signature);

        return res.json({
            txHash: tx.hash
        })
    } catch (error) {
        console.error('Error:', error);
        if (error.message) {
            res.status(500).json({success: false, error: error.message});
        } else {
            return res.status(500).json({success: false, error: 'Internal Server Error'});
        }
    }
})

addressRoute.get('/send-batch/:index', async (req: SendBatchRequest, res) => {
    try {
        const data = await sendNewBatch(req.params.index, provider)
        return res.status(200).json({success: true, ...data});
    } catch (error) {
        console.error('Error:', error);
        if (error.message) {
            res.status(500).json({success: false, error: error.message});
        } else {
            return res.status(500).json({success: false, error: 'Internal Server Error'});
        }
    }
})




export default addressRoute