'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { connect, disconnect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { config } from 'wagmiConfig';
import { useChainId, useAccount } from 'wagmi';
// import { chainOptions } from 'globalConfig';

export default function Header() {
  let pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false)
  const chainId = useChainId({config})
  const { address, connector, isConnected } = useAccount({config});
  const [logo, setLogo] = useState();

  // useEffect(() => {
  //   Object.keys(chainOptions).forEach(chainName => {
  //     if (chainOptions[chainName].chainId == chainId) {
  //       setLogo(chainOptions[chainName].logo);
  //     }
  //   })
  // }, [])

  const disconnectWallet = async () => {
    await disconnect(config, {
      connector, 
    })
  }

  const connectWallet = async () => {
    const result = await connect(config, { connector: injected() })
    console.log(result)
  }

  const getEllipsisTxt = (str, n = 6) => {
    if (str) {
      return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
    }
    return '';
};

  return (
    <div className={`${styles['section_1']} flex-col align-center`}>
      <div className={`${styles['block_9']} flex-row justify-between align-center`}>
        <div className={`flex-row align-center`}>
          <Link href="/" rel="noopener noreferrer" style={{textDecoration: 'none'}}>     
            <div className="flex-col align-center">
              <div
                className={`${styles['image_1']}`}
              />
              <span className={`${styles['logo_name']}`}>AI Master</span>
            </div>
          </Link>
        </div >

        <div className={`${styles['menu']} flex-row justify-around align-center`}>
          <span className={`${styles[pathname.includes('agent') ? 'agent_selected' : 'agent']}`}>
            <Link href="/agent" rel="noopener noreferrer" style={{textDecoration: 'none'}}>   
              Agent
            </Link>
          </span>
          <span className={`${styles[pathname.includes('asset') ? 'asset_selected' : 'asset']}`}>
            <Link href="/asset" rel="noopener noreferrer" style={{textDecoration: 'none'}}>   
              Assets
            </Link>
          </span>
          <span className={`${styles[pathname.includes('competition') ? 'competition_selected' : 'competition_disable']}`}>
            Competition
            <span className={`${styles['coming_soon']}`}>coming soon</span>
          </span>
          {/* <span className={`${styles[pathname.includes('leaderboard') ? 'leaderboard_selected' : 'leaderboard']}`}>
            <Link href="/leaderboard" rel="noopener noreferrer">   
              Leaderboard
            </Link>
          </span> */}
        </div >

        <div className={`${styles['text-wrapper_1']} flex-col align-center`}>
          <ConnectButton showBalance={false}/>
        </div>
        

        {
          openMenu ? 
            <Image
              className={`${styles['menu_close']}`}
              src={
                require('assets/mobileImg/menu_close.png')
              }

              onClick={() => setOpenMenu(false)}
            />
            :
            <Image
              className={`${styles['menu_open']}`}
              src={
                require('assets/mobileImg/menu_open.png')
              }
              onClick={() => setOpenMenu(true)}
            />
        }
      </div>
      <Image
        className={`${styles['image_3']}`}
        src={
          require('assets/img/h_line.png')
        }
      />
      {
        openMenu &&
        <div className={`${styles['menu_mobile']} flex-col align-start`}>
          <span className={`${styles[pathname.includes('mint') ? 'mint_selected_mobile' : 'mint_mobile']}`} onClick={() => setOpenMenu(false)}>
            <Link href="/mint" rel="noopener noreferrer">   
                Mint
            </Link>
          </span>
          <Image
            className={`${styles['image_4']}`}
            src={
              require('assets/mobileImg/menu_divid.png')
            }
          />

          <span className={`${styles[pathname.includes('myrunes') ? 'myrunes_selected_mobile' : 'myrunes_mobile']}`} onClick={() => setOpenMenu(false)}>
              <Link href="/myrunes" rel="noopener noreferrer">   
              My Runes
              </Link>
          </span>
          <Image
            className={`${styles['image_5']}`}
            src={
              require('assets/mobileImg/menu_divid.png')
            }
          />
          
          <span className={`${styles['text_3']}`}>Marketplace</span>
           <Image
            className={`${styles['image_6']}`}
            src={
              require('assets/mobileImg/menu_divid.png')
            }
          />
          {
            isConnected ? 
              <div className={`${styles['address_btn']} flex-row justify-start align-center`}>
                <Image
                  className={`${styles['image_wallet']}`}
                  src={logo}
                />
                <span className={`${styles['address_btn_text']}`}>{getEllipsisTxt(address)}</span>
                <Image
                  className={`${styles['image_wallet']}`}
                  src={
                    require('assets/img/exit.png')
                  }

                  onClick={() => disconnectWallet()}
                />
              </div>
              :
              <div className={`${styles['connect_btn']} flex-col justify-center align-center`} onClick={() => connectWallet()}>
                <span className={`${styles['connect_btn_text']}`}>Connect Wallet</span>
              </div>
          }
        </div>
      }
    </div>
  )
}
