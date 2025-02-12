'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { ChakraProviders } from "./chakraProviders.js";
import { WagmiProvider } from 'wagmi';
import { config } from "wagmiConfig";
import Header from 'components/header/header';
import Footer from 'components/footer/footer';
import { VStack  } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import styles from './page.module.css';

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient()
export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={`${styles['all_page']} flex-col align-center`}>    
        <ChakraProviders>
          <WagmiProvider config={config} reconnectOnMount={true}> 
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider locale="en-US"
                  theme={darkTheme({
                    accentColor: 'linear-gradient(to right, rgba(4, 231, 254, 1), rgba(20, 110, 232, 1))',
                    accentColorForeground: 'black',  
                    fontWeight: 'lighter'
                  })}>
                 <div>
                    <Header />
                    {children}
                    <Footer />
                  </div>                 
                </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ChakraProviders>
      </body>
    </html>
  );
}
