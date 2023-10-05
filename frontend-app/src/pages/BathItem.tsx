import React, {useState} from 'react';
import {Card, CardHeader} from "@/components/primitives/Card";
import {Badge} from "@/components/primitives/Badge";
import {Button} from "@/components/primitives/Button";
import {timestampToFormattedString} from "@/share/share";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/primitives/Collapsible';
import BatchNftList, {BatchNftType} from './BatchNftList';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader} from '@/components/primitives/Dialog';
import {Contract} from "ethers";
import {shortenEthAddress} from "@/share/ethersFunctions";
import {useClipboard} from "@/hooks/useClipboard";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/primitives/Tooltip";
import {CopyIcon} from "lucide-react";

export type BatchDetailsType = {
    firstTokenId: string,
    lastTokenId: any,
    subscribers: any,
    timestamp: any,
    uris: any,
    batchNr: string | number
}

const BathItem = ({readContr, item}: { readContr: Contract, item: BatchDetailsType }) => {
    const [selectedNft, setSelectedNft] = useState<BatchNftType | null>(null)
    const [_, copy, isCopied] = useClipboard()

    return (
        <>
            <Dialog open={selectedNft !== null} onOpenChange={() => setSelectedNft(null)}>
                <DialogContent>
                    <DialogHeader>
                        <img className={'mx-auto h-72 w-72 cursor-pointer rounded-xl'}
                             src={selectedNft?.image}
                             alt={''}/>
                        <DialogDescription className={'flex flex-col gap-2 text-center font-bold'}>
                            <Badge className={'mx-auto mt-2 w-max'}>
                                Token ID: {selectedNft?.id}
                            </Badge>
                            {selectedNft && selectedNft?.owner &&
                                <TooltipProvider>
                                    <Tooltip open={isCopied}>
                                        <TooltipTrigger asChild>
                                            {/*// @ts-ignore*/}
                                            <div onClick={() => copy(selectedNft?.owner)}
                                                 className={'mx-auto flex w-max cursor-pointer items-center justify-center gap-2 font-bold'}>
                                                <CopyIcon size={15}/>
                                                Owner: {shortenEthAddress(selectedNft?.owner)}
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
                        <Button onClick={() => setSelectedNft(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Card>
                <Collapsible>
                    <CardHeader className={'flex flex-col items-start justify-start'}>
                        <div className={'flex w-full items-center justify-between'}>
                            <Badge className={'h-max w-max'}>
                                Batch nr: {item?.batchNr}
                            </Badge>

                            <CollapsibleTrigger>
                                <Button variant={'outline'} size={'sm'}>
                                    Show
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <div className={'text-center'}>
                            <span className={'font-bold'}>Receivers: </span>
                            {item?.subscribers}
                        </div>

                        <div className={'text-center'}>
                            <span className={'font-bold'}>Sent at: </span>
                            {timestampToFormattedString(item?.timestamp)}
                        </div>
                    </CardHeader>
                    <CollapsibleContent>
                        <BatchNftList
                            readContr={readContr} firstTokenId={item.firstTokenId} uris={item?.uris}
                            setSelectedNft={setSelectedNft}/>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </>
    );
};

export default BathItem
