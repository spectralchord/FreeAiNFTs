import React, {useEffect, useState} from "react";
import {Card, CardFooter, CardHeader} from "@/components/primitives/Card";
import {ReloadIcon} from "@radix-ui/react-icons";
import {Badge} from "@/components/primitives/Badge";
import {Button} from "@/components/primitives/Button";
import {Contract} from "ethers";

export type BatchNftType = {
    image: string,
    description: string,
    name: string,
    id?: number,
    owner?: string
}

const PAGE_SIZE = 4

const BatchNftList = ({firstTokenId, uris, setSelectedNft, readContr}: { readContr: Contract, firstTokenId: number | string, uris: string[], setSelectedNft: any }) => {
    const [data, setData] = useState<BatchNftType[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const getData = async (min: number, max: number, initialData: any) => {
        if (uris?.length !== 0) {
            try {
                setIsLoading(true)
                const arr = []
                for (let i = max; i >= Math.max(min, 0); i--) {
                    const res = await fetch(uris[i])
                    const data = await res.json()
                    const owner = await readContr.ownerOf(Number(firstTokenId) + i)
                    arr.push({
                        ...data,
                        owner: owner,
                        id: Number(firstTokenId) + i,
                        image: 'http://77.232.38.111:3009/https://ipfs.moralis.io:2053/ipfs/' + data?.image
                    })
                }
                setData([...initialData, ...arr])
                setIsLoading(false)
            } catch (e) {
                console.log(e)
                setIsLoading(false)
            }
        }
    }

    const loadMore = async () => {
        getData(Math.max(uris.length - data?.length - PAGE_SIZE, 0), uris.length - data?.length - 1, data)
    }

    useEffect(() => {
        getData(uris.length - PAGE_SIZE, uris.length - 1, [])
    }, []);

    return <>
        {isLoading && data?.length == 0 &&
            <Card>
                <CardHeader className={'flex items-center justify-center'}>
                    <ReloadIcon className="mr-2 h-8 w-8 animate-spin"/>
                </CardHeader>
            </Card>
        }

        {data?.length != 0 &&
            <Card className={'m-5 border-amber-300 dark:bg-gray-800'}>
                <CardHeader className={'grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 md:gap-2'}>
                    {data?.map(item =>
                        <Card>
                            <CardHeader className={'flex w-full flex-col gap-1 p-4'}>
                                <img onClick={() => setSelectedNft(item)}
                                     className={'mx-auto h-28 w-28 cursor-pointer rounded-xl bg-gray-300'}
                                     src={item.image} alt={''}/>
                                <div className={'flex flex-col justify-center'}>
                                    <Badge className={'mx-auto w-max'}>
                                        {`#${item.id}`}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    )}
                </CardHeader>
                {data?.length !== uris.length && data?.length !== 0 &&
                    <CardFooter>
                        <div className={'mx-auto flex items-center justify-center'}>
                            <Button disabled={isLoading} onClick={loadMore}>
                                {isLoading && <ReloadIcon className="mr-2 h-5 w-5 animate-spin"/>}
                                Load more
                            </Button>
                        </div>
                    </CardFooter>
                }
            </Card>
        }
    </>
}

export default BatchNftList