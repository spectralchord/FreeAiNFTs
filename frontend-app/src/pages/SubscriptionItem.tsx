import React, {useEffect, useState} from 'react';
import {Button} from "@/components/primitives/Button"
import {Contract, ethers} from "ethers";
import {useAccount} from "wagmi";
import {RPC_URL} from '@/share/ethersConfig';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/primitives/Card';
import {ArrowRight} from "lucide-react";
import {Badge} from "@/components/primitives/Badge";
import {Progress} from "@/components/primitives/Progress";
import {Link} from "react-router-dom";
import {ReloadIcon} from "@radix-ui/react-icons";
import {SubscriptionContractAbi} from "@/share/ethersABIs";

type SubscriptionItemProps = {
    index: number,
    subscriptionContract: string
}

const SubscriptionItem = ({subscriptionContract, index}: SubscriptionItemProps) => {
    const {isConnected, address} = useAccount()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscribersCount, setSubscribersCount] = useState(0)
    const [maxSubscribers, setMaxSubscribers] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [readContr, setReadContr] = useState<Contract | null>(null)

    const getData = async () => {
        try {
            setIsLoading(true)
            const getSubscribersCount = await readContr?.getSubscribersCount()
            setSubscribersCount(parseInt(getSubscribersCount))

            const getMaxSubscribers = await readContr?.getMaxSubscribers()
            setMaxSubscribers(parseInt(getMaxSubscribers))
            if (parseInt(getSubscribersCount) !== 0) getUsers(parseInt(getSubscribersCount))
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false)
        }
    };

    const getUsers = async (subscribersCount: number) => {
        setIsLoadingUsers(true)
        try {
            const arr = []
            for (let i = 0; i < subscribersCount; i++) {
                const subscriberInfo = await readContr?.getSubscriberInfo(i)
                arr.push({
                    address: subscriberInfo[0],
                    preference: subscriberInfo[1],
                    timestamp: parseInt(subscriberInfo[2]),
                })
            }
            setUsers(arr)
            setIsLoadingUsers(false)
        } catch (e) {
            console.log(e)
            setIsLoadingUsers(false)
        }
    }

    const getSubscriptionStatus = async () => {
        const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = metamaskProvider.getSigner();
        const walletAddress = await signer.getAddress()
        const subscribedStatus = await readContr?.isSubscribed(walletAddress)
        setIsSubscribed(subscribedStatus)
    }

    useEffect(() => {
        if (readContr) {
            getData()
            if (address) getSubscriptionStatus()
        }
    }, [address, readContr])

    useEffect(() => {
        const customHttpProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const cRead = new ethers.Contract(subscriptionContract, SubscriptionContractAbi, customHttpProvider);
        setReadContr(cRead)
    }, [])

    return (
        <div className={'flex flex-col gap-3'}>
            <Card>
                {isLoading
                    ? <CardHeader className={'flex items-center justify-center'}>
                        <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                    </CardHeader>
                    : <>
                        <CardHeader className={'flex w-full flex-row flex-wrap justify-between'}>
                            <div>
                                <CardTitle>
                                    Subscription #{index + 1}
                                </CardTitle>
                            </div>
                            {isConnected && !isLoading &&
                                <>
                                    {isSubscribed
                                        ? <Badge className={'h-min w-min'}>
                                            Subscribed
                                        </Badge>
                                        : subscribersCount >= maxSubscribers &&
                                        <Badge>No positions left</Badge>
                                    }
                                </>
                            }
                        </CardHeader>
                        <CardContent>
                            <p>Subscribers: {subscribersCount} / {maxSubscribers} max</p>
                        </CardContent>
                        <CardFooter>
                            <div className={'flex w-full flex-col items-end justify-end gap-2'}>
                                <Progress value={subscribersCount * 100 / maxSubscribers}/>
                                <Button variant={'outline'} size={'sm'} asChild>
                                    <Link to={`/${subscriptionContract}`}
                                          className={'flex items-center justify-center gap-2'}>
                                        Details
                                        <ArrowRight size={15}/>
                                    </Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </>
                }
            </Card>
        </div>
    );
};

export default SubscriptionItem;