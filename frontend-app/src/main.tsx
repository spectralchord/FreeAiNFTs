import React from "react";
import ReactDOM from "react-dom/client";
import {WagmiConfig} from "wagmi";
import {config} from "./share/wagmi";
import AppRoutes from "@/components/AppRoutes";
import {Toaster} from "./components/primitives/Toaster";
import {ThemeProvider} from "@/providers/ThemeProvider";
import './index.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <WagmiConfig config={config}>
            <AppRoutes/>
            <Toaster/>
        </WagmiConfig>
    </ThemeProvider>
);
