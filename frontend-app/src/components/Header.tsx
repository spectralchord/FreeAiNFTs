import React from 'react';
import {Link} from "react-router-dom";
import {useAccount, useConfig, useConnect, useDisconnect} from "wagmi";
import {Navbar} from "@/components/Navbar";
import {Button} from "@/components/primitives/Button";
import {Badge} from "@/components/primitives/Badge";
import {shortenEthAddress} from "@/share/ethersFunctions";
import {useClipboard} from "@/hooks/useClipboard";
import {CopyIcon} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from './primitives/Tooltip';

const Header = () => {
    const {address, isConnecting, isConnected, isDisconnected, status} = useAccount()
    const {connectors} = useConfig()
    const {connectAsync} = useConnect({connector: connectors[0]})
    const {disconnect} = useDisconnect()
    const [_, copy, isCopied] = useClipboard()

    return (
        <div className={'mb-5 flex items-center justify-between'}>
            <div className={'flex justify-center align-middle'}>
                <Navbar/>
            </div>
            <div className={'flex items-center justify-center gap-3'}>
                {!window.ethereum &&
                    <Button
                        size={'sm'}
                        disabled={isConnecting}
                    >
                        <Link to={'https://metamask.io'} target={'_blank'}>
                            Install MetaMask
                        </Link>
                    </Button>
                }

                {window.ethereum && !address &&
                    <Button
                        disabled={isConnecting}
                        onClick={() => connectAsync()}
                    >
                        Connect
                    </Button>
                }
                {address &&
                    <Badge variant={'secondary'} className={'h-max'}>
                        <div className={'flex items-center justify-center gap-2'}>
                            <TooltipProvider>
                                <Tooltip open={isCopied}>
                                    <TooltipTrigger asChild>
                                        <Button onClick={(e) => {
                                            copy(address)
                                        }} variant={'ghost'} className={'h-min p-0'}>
                                            <CopyIcon size={15}/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isCopied ? 'Copied' : 'Copy'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div className={'text-sm'}>
                                {shortenEthAddress(address)}
                            </div>
                        </div>
                    </Badge>
                }
                {isConnected && (
                    <Button
                        size={'sm'}
                        disabled={isConnecting}
                        onClick={() => disconnect()}
                    >
                        Disconnect
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Header;