import {Contract, ethers} from 'ethers';
import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useAccount, useNetwork} from "wagmi";
import {useToast} from "@/hooks/useToast";
import {CHAIN_ID, RPC_URL, SubscriptionContractAddress} from "@/share/ethersConfig";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/primitives/Card';
import {CopyIcon, UserIcon} from "lucide-react";
import {Badge} from '@/components/primitives/Badge';
import {Button} from '@/components/primitives/Button';
import {Progress} from '@/components/primitives/Progress';
import {Avatar, AvatarFallback} from '@/components/primitives/Avatar';
import {Alert, AlertDescription, AlertTitle} from '@/components/primitives/Alert';
import {shortenEthAddress} from "@/share/ethersFunctions";
import {timestampToFormattedString} from "@/share/share";
import {ReloadIcon} from "@radix-ui/react-icons";
import * as z from "zod";
import {registerName} from "@/share/register";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/primitives/Form";
import {Input} from "@/components/primitives/Input";
import BathItem from "@/pages/BathItem";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader} from "@/components/primitives/Dialog";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/primitives/Tooltip";
import {BatchNftType} from "@/pages/BatchNftList";
import {useClipboard} from "@/hooks/useClipboard";
import {SubscriptionContractAbi} from "@/share/ethersABIs";

const formSchema = z.object({
    preference: z.string().min(1).max(50),
})

const PAGE_SIZE = 4

const DetailsPage = () => {
    const {id} = useParams()
    const {toast} = useToast()
    const {chain} = useNetwork()
    const {isConnected, isConnecting, address} = useAccount()

    const [users, setUsers] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscribersCount, setSubscribersCount] = useState(0)
    const [maxSubscribers, setMaxSubscribers] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingUsers, setIsLoadingUsers] = useState(true)
    const [isLoadingBatches, setIsLoadingBatches] = useState(true)
    const [readContr, setReadContr] = useState<Contract | null>(null)
    const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
    const [isLoadingSubmitPreference, setIsLoadingSubmitPreference] = useState(false)
    const [batchesCount, setBatchesCount] = useState(0)
    const [contractName, setContractName] = useState('')
    const [nfts, setNfts] = useState<any[]>([])
    const [isLoadingNfts, setIsLoadingNfts] = useState(false)
    const [nftCount, setNftCount] = useState(0)
    const [selectedMyNft, setSelectedMyNft] = useState<BatchNftType & { uri: string } | null>(null)
    const [_, copy, isCopied] = useClipboard()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            preference: "",
        },
    })

    const getData = async () => {
        try {
            setIsLoading(true)
            const getSubscribersCount = await readContr?.getSubscribersCount()
            setSubscribersCount(parseInt(getSubscribersCount))

            const getMaxSubscribers = await readContr?.getMaxSubscribers()
            setMaxSubscribers(parseInt(getMaxSubscribers))
            await getUsers(parseInt(getSubscribersCount))

            const batchesCount = await readContr?.getBatchesCount()
            setBatchesCount(parseInt(batchesCount))
            setIsLoadingNfts(true)
            await getBatches(parseInt(batchesCount) - PAGE_SIZE, parseInt(batchesCount) - 1, [])

            const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = metamaskProvider.getSigner();
            const count = await readContr?.balanceOf(signer?.getAddress())
            setNftCount(parseInt(count))

            await getNfts(parseInt(count) - PAGE_SIZE, parseInt(count) - 1, [])
        } catch (e) {
            setIsLoadingNfts(false)
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
                    address: subscriberInfo?._address,
                    preference: subscriberInfo[1],
                    timestamp: parseInt(subscriberInfo.timestamp)
                })
            }
            setUsers(arr)
            setIsLoadingUsers(false)
        } catch (e) {
            console.log(e)
            setIsLoadingUsers(false)
        }
    }

    const getBatches = async (min: number, max: number, initialData: any) => {
        try {
            const arr = []
            setIsLoadingBatches(true)
            for (let i = max; i >= Math.max(min, 0); i--) {
                const batchInfo = await readContr?.getBatchInfo(i)
                arr.push({
                    firstTokenId: parseInt(batchInfo[1]),
                    lastTokenId: parseInt(batchInfo[2]),
                    subscribers: parseInt(batchInfo[3]),
                    timestamp: parseInt(batchInfo[4]),
                    uris: batchInfo[0]?.map((item: string) => 'http://77.232.38.111:3009/https://ipfs.moralis.io:2053/ipfs/' + item),
                    batchNr: i + 1
                })
            }
            setBatches([...initialData, ...arr])
            setIsLoadingBatches(false)
        } catch (e) {
            console.log(e)
            setIsLoadingBatches(false)
        }
    }

    const getSubscriptionStatus = async () => {
        const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = metamaskProvider.getSigner();
        const walletAddress = await signer.getAddress()
        const isSubscr = await readContr?.isSubscribed(walletAddress)
        setIsSubscribed(isSubscr)
    }

    const subscribeContract = async () => {
        if ((!isConnected || isConnecting)) {
            toast({
                title: 'Error!',
                description: `Connect wallet!`,
                variant: 'destructive'
            })
        } else if (window.ethereum) {
            toast({
                title: 'Error!',
                description: `MetaMask not available!`,
                variant: 'destructive'
            })
        } else if (isConnected && chain?.id === parseInt(CHAIN_ID)) {
            setIsLoadingSubscription(true)
            try {
                const customHttpProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
                const contractRead = new ethers.Contract(id!, SubscriptionContractAbi, customHttpProvider);
                const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = metamaskProvider.getSigner();
                const contractWrite = contractRead.connect(signer)
                const tx = await contractWrite.subscribe()
                await tx.wait();
                setIsLoadingSubscription(false)
                setIsSubscribed(true)
                setSubscribersCount(subscribersCount + 1)
            } catch (e) {
                console.log(e)
                setIsLoadingSubscription(false)
            }
        } else {
            toast({
                title: 'Error!',
                description: `Switch network to BTT Chain Testnet!`,
                variant: 'destructive'
            })
        }
    }

    const getNfts = async (min: number, max: number, initialData: any,) => {
        const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = metamaskProvider.getSigner();
        try {
            setIsLoadingNfts(true)
            const arr = []
            for (let i = max; i >= Math.max(min, 0); i--) {
                const tokenId = await readContr?.tokenOfOwnerByIndex(signer?.getAddress(), i)
                const tokenUri = await readContr?.tokenURI(tokenId)
                const res = await fetch('http://77.232.38.111:3009/https://ipfs.moralis.io:2053/ipfs/' + tokenUri)
                const data = await res.json()
                arr.push({
                    id: parseInt(tokenId),
                    uri: 'http://77.232.38.111:3009/https://ipfs.moralis.io:2053/ipfs/' + data?.image,
                    description: data?.description,
                    name: data?.name,
                })
            }
            setNfts([...initialData, ...arr])
            setIsLoadingNfts(false)
        } catch (e) {
            console.log(e)
            setIsLoadingNfts(false)
        }
    }

    const getContractName = async () => {
        const name = await readContr?.name()
        setContractName(name)
    }

    useEffect(() => {
        if (readContr) {
            getContractName()
            getData()
        }
    }, [readContr])

    useEffect(() => {
        if (id !== undefined) {
            const customHttpProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const cRead = new ethers.Contract(id!, SubscriptionContractAbi, customHttpProvider);
            setReadContr(cRead)
        }
    }, [id])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isSubscribed) {
            toast({
                title: 'Error!',
                description: `You already subscribed!`,
                variant: 'destructive'
            })
        } else if ((!isConnected || isConnecting)) {
            toast({
                title: 'Error!',
                description: `Connect wallet!`,
                variant: 'destructive'
            })
        } else if (!window.ethereum) {
            toast({
                title: 'Error!',
                description: `MetaMask not available!`,
                variant: 'destructive'
            })
        } else if (isConnected && chain?.id === parseInt(CHAIN_ID)) {
            setIsLoadingSubmitPreference(true)
            try {
                await registerName({preference: values.preference})
                setIsLoadingSubmitPreference(false)
                setIsSubscribed(true)
                setSubscribersCount(subscribersCount + 1)
            } catch (e) {
                console.log(e)
                setIsLoadingSubmitPreference(false)
            }
        } else {
            toast({
                title: 'Error!',
                description: `Switch network to BTT Chain Testnet!`,
                variant: 'destructive'
            })
        }
    }

    useEffect(() => {
        if (address && readContr) getSubscriptionStatus()
    }, [address, readContr])

    return (
        <>
            <Dialog open={selectedMyNft !== null} onOpenChange={() => setSelectedMyNft(null)}>
                <DialogContent>
                    <DialogHeader>
                        <img className={'mx-auto h-72 w-72 cursor-pointer rounded-xl'}
                             src={selectedMyNft?.uri}
                             alt={''}/>
                        <DialogDescription className={'flex flex-col gap-2 text-center font-bold'}>
                            <Badge className={'mx-auto mt-2 w-max'}>
                                Token ID: {selectedMyNft?.id}
                            </Badge>
                            {selectedMyNft && selectedMyNft?.owner &&
                                <TooltipProvider>
                                    <Tooltip open={isCopied}>
                                        <TooltipTrigger asChild>
                                            {/*// @ts-ignore*/}
                                            <div onClick={() => copy(selectedNft?.owner)}
                                                 className={'mx-auto flex w-max cursor-pointer items-center justify-center gap-2 font-bold'}>
                                                <CopyIcon size={15}/>
                                                Owner: {shortenEthAddress(selectedMyNft?.owner)}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{isCopied ? 'Copied' : 'Copy'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setSelectedMyNft(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className={'flex flex-col gap-2'}>
                <Card>
                    {isLoading
                        ? <CardHeader className={'flex items-center justify-center'}>
                            <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                        </CardHeader>
                        : <>
                            <CardHeader className={'flex w-full flex-row flex-wrap justify-between'}>
                                <div>
                                    <CardTitle>
                                        Subscriptions
                                        #{SubscriptionContractAddress?.findIndex(item => item === id) + 1}
                                    </CardTitle>
                                </div>
                                {isSubscribed
                                    ? <Badge className={'h-min w-min'}>
                                        Subscribed
                                    </Badge>
                                    : subscribersCount < maxSubscribers
                                        ? <></>
                                        : <Badge>No subscription slots left</Badge>
                                }
                            </CardHeader>
                            <CardContent>
                                <p>Subscribers: {subscribersCount} / {maxSubscribers} max</p>
                            </CardContent>
                            <CardFooter>
                                <Progress value={subscribersCount * 100 / maxSubscribers}/>
                            </CardFooter>
                        </>
                    }
                </Card>

                {!isSubscribed &&
                    <Card>
                        <CardHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className={'flex flex-col gap-2'}>
                                    <FormField
                                        control={form.control}
                                        name="preference"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Preference</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Preference" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter preference.
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <div className={'mt-0 flex justify-end pt-0'}>
                                        <Button disabled={isLoadingSubmitPreference} type="submit">
                                            {isLoadingSubmitPreference &&
                                                <ReloadIcon className="mr-2 h-5 w-5 animate-spin"/>
                                            }
                                            Subscribe with this preference
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardHeader>
                    </Card>
                }

                {isLoadingUsers
                    ? <Card>
                        <CardHeader className={'flex items-center justify-center'}>
                            <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                        </CardHeader>
                    </Card>
                    : <>
                        <div className={'mt-3 text-2xl font-bold'}>Subscribers</div>
                        {users?.length !== 0
                            ? <div className={'flex flex-col gap-2'}>
                                {users?.map(item =>
                                    <Card>
                                        <CardHeader className={'flex w-full flex-row items-center justify-start gap-4'}>
                                            <Avatar className={'h-20 w-20 rounded-md'}>
                                                <AvatarFallback className={'rounded-xl'}>
                                                    <UserIcon size={40}/>
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={'flex flex-col items-start justify-start gap-2'}>
                                                <Badge>
                                                    {shortenEthAddress(item?.address)}
                                                </Badge>
                                                <div className={'text-sm'}>
                                                    <span className={'font-bold'}>Preference: {' '}</span>
                                                    {item?.preference}
                                                </div>
                                                <div className={'text-sm'}>
                                                    <span className={'font-bold'}>Subscribed at: {' '}</span>
                                                    {timestampToFormattedString(item?.timestamp)}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                )}
                            </div>
                            : <Alert>
                                <AlertTitle>
                                    No subscribers
                                </AlertTitle>
                            </Alert>
                        }
                    </>
                }

                {isLoadingNfts && nfts?.length == 0 &&
                    <Card>
                        <CardHeader className={'flex items-center justify-center'}>
                            <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                        </CardHeader>
                    </Card>
                }

                {nfts?.length != 0 && isSubscribed && <>
                    <div className={'mt-3 text-2xl font-bold'}>My latest generated NFTs</div>
                    <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 md:gap-3'}>
                        {nfts?.map(item =>
                            <Card>
                                <CardHeader className={'flex w-full flex-col gap-2'}>
                                    <img className={'mx-auto h-36 w-36 cursor-pointer rounded-xl object-cover'}
                                         src={item?.uri}
                                         onClick={() => setSelectedMyNft(item)}
                                         alt={''}/>
                                    <div className={'flex flex-col items-center justify-center gap-1'}>
                                        <Badge>
                                            {`#${item?.id}`}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}
                    </div>

                    {nfts?.length !== nftCount && nfts?.length !== 0 &&
                        <div className={'flex items-center justify-center'}>
                            <Button disabled={isLoadingNfts} onClick={() => {
                                getNfts(Math.max(nftCount - nfts?.length - PAGE_SIZE, 0), nftCount - nfts?.length - 1, nfts)
                            }}>
                                {isLoadingNfts && <ReloadIcon className="mr-2 h-5 w-5 animate-spin"/>}
                                Load more
                            </Button>
                        </div>
                    }
                </>
                }

                {!isLoadingNfts && isSubscribed && nfts?.length == 0 &&
                    <Alert>
                        <AlertTitle>
                            My latest generated NFTs
                            <Badge variant={'secondary'}>No NFTs</Badge>
                        </AlertTitle>
                    </Alert>
                }

                {isLoadingBatches && batches?.length == 0 &&
                    <Card>
                        <CardHeader className={'flex items-center justify-center'}>
                            <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                        </CardHeader>
                    </Card>
                }

                {batches?.length != 0
                    ? <>
                        <div className={'mt-3 text-2xl font-bold'}>Latest NFTs batches</div>
                        {readContr &&
                            <div className={'flex flex-col gap-2'}>
                                {batches?.map(item =>
                                    <BathItem readContr={readContr} item={item}/>
                                )}
                            </div>
                        }

                        {batches?.length !== batchesCount && batches?.length !== 0 &&
                            <div className={'flex items-center justify-center'}>
                                <Button disabled={isLoadingBatches} onClick={() => {
                                    getBatches(Math.max(batchesCount - batches?.length - PAGE_SIZE, 0), batchesCount - batches?.length - 1, batches)
                                }}>
                                    {isLoadingBatches && <ReloadIcon className="mr-2 h-5 w-5 animate-spin"/>}
                                    Load more
                                </Button>
                            </div>
                        }
                    </>
                    : !isLoadingBatches
                        ? <Alert>
                            <AlertTitle>
                                Latest NFTs batches
                            </AlertTitle>
                            <AlertDescription>
                                <Badge variant={'secondary'}>No batches</Badge>
                            </AlertDescription>
                        </Alert>
                        : <></>
                }
            </div>
        </>
    );
};

export default DetailsPage;