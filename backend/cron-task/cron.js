const cron = require('node-cron');
const ethers = require('ethers');
const {
    SUBSCRIPTION_CONTRACT_ABI,
    SUBSCRIPTION_TIME_INTERVAL,
    SUBSCRIPTIONS_CONTRACTS,
    RPC_URL
} = require("./constants");

const PROVIDER_URL = new ethers.providers.JsonRpcProvider(RPC_URL);

const main = async (taskNr) => {
    try {
        const contractAddress = SUBSCRIPTIONS_CONTRACTS[taskNr - 1]

        const res = await getLastBatchTime(contractAddress)
        const lastBatchTime = parseInt(res) * 1000

        if (lastBatchTime >= 0) {
            const nowDate = new Date().getTime()
            const delta = nowDate - lastBatchTime
            if (delta >= SUBSCRIPTION_TIME_INTERVAL) {
                console.log('Can start fetch!')
                const res = fetch(`http://77.232.38.111:5000/api/send-batch/${taskNr}`)
                    .then(response => {
                        console.log(response.json())
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Request failed');
                        }
                    })
                    .then(data => {
                        console.log(data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            } else {
                console.log('Wait')
            }
        } else {
            throw new Error('Error get last batch info!');
        }
    } catch (e) {
        console.log("ERROR main")
        console.error(e)
    }
}


const getLastBatchTime = async (contractAddress) => {
    try {
        const contractInstance = new ethers.Contract(contractAddress, SUBSCRIPTION_CONTRACT_ABI, PROVIDER_URL);
        const batchesCount = await contractInstance.getBatchesCount()

        if (batchesCount > 0) {
            const lastBatchInfo = await contractInstance.getBatchInfo(batchesCount - 1)
            return lastBatchInfo.timestamp;
        } else {
            return 0
        }
    } catch (e) {
        console.log("ERROR getLastBatchTime")
        console.error(e)
    }
}

if (process.argv.length === 2) {
    console.error('Expected at least one argument!');
    process.exit(1);
} else {
    const taskNr = parseInt(process.argv[2])
    if (taskNr > 0 && taskNr <= SUBSCRIPTIONS_CONTRACTS.length) {
        cron.schedule("0 */5 * * * *", async () =>{
            await main(taskNr)
        });
    } else {
        console.error('Incorrect cron task nr !');
        process.exit(1);
    }
}