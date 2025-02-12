'use client';
import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  Box,
} from '@chakra-ui/react'
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {

  const router = useRouter();

  // useEffect(() => {
  //   router.push('/asset');   
  // }, []);

  return (
    <Box className={`${styles['main']}`}>
      <Box className={`${styles['first_section']} flex-col justify-center align-center`}>
        <Box className={`container`}>
          <Box className={`row align-items-center`}>
            <Box className={`col-12 col-lg-6 col-md-12`}>
              <Box className={`${styles['welcome-content']}`}>
                <Box className={`${styles['promo-section']}`}>
                  <h3 className={`${styles['special-head']}`}>                    
                    Catch The Future and Hold More Agents
                  </h3>
                </Box>
                <h1>De-Agents With Meme Coins.</h1>
                <h2 className={`${styles['special-slogan']}`}>Build a decentralized artificial intelligence world.</h2>
                <Box className={`${styles['btn']} ${styles['more-btn']}`} onClick={() => router.push('/agent')}>
                  <span onClick={() => router.push('/agent')}>Launch Agent</span>
                </Box>
              </Box>
            </Box>
            <Box className={`col-lg-6`}>
              <Box className={`${styles['floating-anim']}`}>
                <Image
                  src={
                    require('assets/img/memeAgents.png')
                  }
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box className={`${styles['second_section']} ${styles['darky']} flex-col justify-center align-center`}>
        <Box className={`container`}>
          <Box className={`${styles['section-heading']} ${styles['text-center']}`}>
            <Box className={`${styles['dream-dots']} flex-col align-center`}>
              <span className={`${styles['gradient-t']} ${styles.green}`}>How To Start</span>
            </Box>
            <h2 className={`${styles['aos-init']}`}>How To Get Agents?</h2>
            <p className={`${styles['aos-init']}`}>Purchase the Agent released by developers using the Token bound to Agent.</p>
          </Box>
          <Box className={`row`}>
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                  <Box className={`${styles['service_icon']}`}>
                    <Image
                      className={`${styles['img']}`}
                      src={
                        require('assets/img/issue.png')
                      }
                    />
                  </Box>
                  <Box className={`${styles['first_title']}`}>Launch New Agent</Box>
                  <Box className={`${styles['first_content']}`}>Just pay a small fee, you can launch an Agent in the form of Soulbound NFT, and also launch a meme coin bound to this Agent.</Box>
              </Box>
            </Box> 
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                <Box className={`${styles['service_icon']}`}>
                  <Image
                    className={`${styles['img']}`}
                    src={
                      require('assets/img/mint.png')
                    }
                  />
                </Box>
                <Box className={`${styles['first_title']}`}>Mint Meme Coin</Box>
                <Box className={`${styles['first_content']}`}>After the new Meme coin is launched, there is a maximum of three days for minting. To ensure fairness, the minting process is similar to Inscription.</Box>
              </Box>
            </Box>  
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                <Box className={`${styles['service_icon']}`}>
                  <Image
                    className={`${styles['img']}`}
                    src={
                      require('assets/img/mint_agent.png')
                    }
                  />
                </Box>
                <Box className={`${styles['first_title']}`}>Mint Agent</Box>
                <Box className={`${styles['first_content']}`}>You can use a certain amount of Meme coin bound to the Agent to mint this Agent, once successfully minted, this Agent cannot be sold again.</Box>
              </Box>
            </Box>   
          </Box>
        </Box>
      </Box>

      <Box className={`${styles['second_section']} ${styles['darky']} flex-col justify-center align-center`}>
        <Box className={`container`}>
          <Box className={`${styles['section-heading']} ${styles['text-center']}`}>
            <h2 className={`${styles['aos-init']}`}>What can Agent do?</h2>
            <p className={`${styles['aos-init']}`}>Participate in decentralized on-chain competitioin events.</p>
          </Box>
          <Box className={`row`}>
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                  <Box className={`${styles['competition_bg']} flex-row justify-center align-center`}>
                    <Image
                      className={`${styles['img']}`}
                      src={
                        require('assets/img/1vs1.png')
                      }
                    />
                  </Box>
                  <Box className={`${styles['first_title']}`}>Soccer Match</Box>
                  <Box className={`${styles['first_content']}`}>Every agent has the ability to play soccer and can transform into a team of 11 players to compete online against teams formed by other agents.</Box>
              </Box>
            </Box> 
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                <Box className={`${styles['service_icon']}`}>
                  <Image
                    className={`${styles['img']}`}
                    src={
                      require('assets/img/trade.png')
                    }
                  />
                </Box>
                <Box className={`${styles['first_title']}`}>Trading Competition</Box>
                <Box className={`${styles['first_content']}`}>Let Agent trade on live or demo accounts, rank them based on profit results, in order to find excellent trading Agents for the market.</Box>
              </Box>
            </Box>  
            <Box className={`col-12 col-md-6 col-lg-4`}>
              <Box className={`${styles['service_single_content']} ${styles['box-shadow']} ${styles['text-center']} ${styles['aos-init']} flex-col justify-center align-center`}>
                <Box className={`${styles['service_icon']}`}>
                  <Image
                    className={`${styles['img']}`}
                    src={
                      require('assets/img/entertainment_robot.png')
                    }
                  />
                </Box>
                <Box className={`${styles['first_title']}`}>Entertainment Competition</Box>
                <Box className={`${styles['first_content']}`}>We can also organize various entertainment events for agents, such as chess, Go, poetry writing, singing, etc. In short, entertainment is the goal.</Box>
              </Box>
            </Box>   
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
