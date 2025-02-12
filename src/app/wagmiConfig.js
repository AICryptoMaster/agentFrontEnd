//import { optimism, base, linea, arbitrum, scroll, polygonZkEvm, zkSync, bevmMainnet, merlin } from '@wagmi/core/chains';
import { base, baseGoerli } from '@wagmi/core/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem';


export const isMainnet = false;

//const mainnets = [optimism, base, linea, arbitrum, scroll, polygonZkEvm, zkSync, vizing]
export const mainnets = [base]

//const testnets = [optimismSepolia, baseSepolia, lineaSepolia, arbitrumSepolia, scrollSepolia, polygonZkEvmTestnet, zkSyncSepoliaTestnet]
export const testnets = [baseGoerli];

export const config = getDefaultConfig({
  appName: 'FAIR314',
  projectId: 'YOUR_PROJECT_ID',
  chains: [...mainnets, ...testnets],
  transports: {
    [baseGoerli.id]: http('https://fair314.xyz/blast/api')
  }
})