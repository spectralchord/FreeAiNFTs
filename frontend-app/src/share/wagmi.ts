import {configureChains, createConfig, mainnet} from "wagmi";
import {publicProvider} from "wagmi/providers/public";
import {InjectedConnector} from "wagmi/connectors/injected";

export const {chains, publicClient, webSocketPublicClient} = configureChains(
    [mainnet],
    [publicProvider()],
);

export const config = createConfig({
    autoConnect: true,
    publicClient,
    connectors: [new InjectedConnector()],
    webSocketPublicClient,
});