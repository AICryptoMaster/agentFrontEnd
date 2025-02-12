'use client';

import React, {useEffect, useState, useContext} from 'react';
import Image from 'next/image'
import Link from 'next/link'

import styles from './page.module.css';
import { 
    Input,
    Progress,
    Button,
    useToast,
    Box,
    Spinner
} from '@chakra-ui/react';
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react'
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { Center, Wrap, Tooltip } from '@chakra-ui/react'

import { ChevronDownIcon, QuestionIcon } from '@chakra-ui/icons'
import copy from 'copy-to-clipboard';
import { formatAddress } from 'utils/addressFormatter';
import B2NetworkLogo from 'assets/img/b2network.png';
import { chainOptions, chainOptionsTestnet, obtHost, VPBaseURL_Mainnet, VPBaseURL_Testnet, VPContractAddr_Mainnet, VPContractAddr_Testnet } from 'globalConfig';
import { getChainId, sendTransaction } from '@wagmi/core';
import { mainnets } from 'wagmiConfig';
import BigNumber from 'bignumber.js';
import { toHex } from 'viem';
import { getSearchParam, convertNumberToPercentage } from 'utils/tool';
import { useAccount, useChainId } from 'wagmi';
import { WagmiContext } from 'wagmi';

// const mintData = 'coming soon'//`data:,{"p":"layer2-20","op":"claim","tick":"$L2","amt":"1000"}`;
// const mintDataHex = 'coming soon'//'0x646174613a2c7b2270223a226c61796572322d3230222c226f70223a22636c61696d222c227469636b223a22244c32222';

export default function Page() {
    const [selectedChain, setSelectedChain] = useState({ chainId: 223, idCode: 9046, testIdCode: 9546, label: "B2 Network",  logo: B2NetworkLogo})
    const [tableSelected, setTableSelected] = useState('TopAssets');
    const [receivedNetworkData, setReceivedNetworkData] = useState([])
    const [pointRankingData, setPointRankingData] = useState([])
    const [mintRankingData, setMintRankingData] = useState([])
    const [totalPointNumber, setTotalPointNumber] = useState(0)
    const [totalMintNumber, setTotalMintNumber] = useState(0)
    const [currentPageNo, setCurrentPageNo] = useState(1)
    const [currentDataSize, setCurrentDataSize] = useState(0)
    const [showPageSelector, setShowPageSelector] = useState(false);
    const [repeatTimes, setRepeatTimes] = useState(1);
    const [isMinting, setIsMinting] = useState(false)
    const [deployInfo, setDeployInfo] = useState({})
    const [openMint, setOpenMint] = useState(false)
    const [openRetweet, setOpenRetweet] = useState(false)
    const [vpBaseUrl, setVpBaseUrl] = useState('');
    const [pointContractAddr, setPointContractAddr] = useState(VPContractAddr_Mainnet);
    const [pointsInfo, setPointsInfo] = useState(null);
    const [receiptAddr, setReceiptAddr] = useState('0x0a88bc5c32b684d467b43c06d9e0899efeaf59df')
    const [protocol, setProtocol] = useState('layer2-rune')
    const [runeName, setRuneName] = useState('RUNE20·STATUE·MOON')
    const [runeMintData, setRuneMintData] = useState(`data:,{"r": "${protocol}", "op": "claim", "amt": "1000", "tick": "${runeName}"}`)
    const [isMainnet, setIsMainnet] = useState(true);
    const [numberOfRetweet, setNumberOfRetweet] = useState(0);
    const [curChainOptions, setCurChainOptions] = useState(chainOptions);
    const [curNetworks, setCurNetworks] = useState(mainnets);
    const [config, setConfig] = useState(useContext(WagmiContext));
    const [mintWord, setMintWord] = useState('Bid')

    const [currentRound, setCurrentRound] = useState(0)
    const [allRounds, setAllRounds] = useState([3,2,1,0])
    const [highestBid, setHighestBid] = useState(0)
    const [highestBidder, setHighestBidder] = useState('0x000000000000000000000000000000000000000000000000')
    const [leftEth, setLeftEth] = useState(0)
    const [leftReward, setLeftReward] = useState(0)
    const [tokenSymbol, setTokenSymbol] = useState('BST')
    const [minBidGap, setMinBidGap] = useState(1)
    const [leftHour, setLeftHour] = useState('00')
    const [leftMinute, setLeftMinute] = useState('00')
    const [leftSecond, setLeftSecond] = useState('00')
    
    // console.log('chainId config', config)
    const { address } = useAccount({config});
    let chainId = config.state.chainId;
    // console.log('chainId 1', chainId)

    const pageSize = 10;
    const toast = useToast();
    const content = `I received a 500-point reward from Bitcoin Layer 2 Rune with serial number 0. After minting completion, holding points will receive $STONE airdrops for trading.@StatueRune https://statuerune.com`;
    const retweetLink = `https://twitter.com/intent/tweet?text=${encodeURI(content)}`;
    const mintFee = 0.00023;  // btc
    const mintFeeOfETH = 0.00023;  // eth
    const bobNetworkChainId = 60808;

    useEffect(() => {
      const retweet = getSearchParam('retweet');
      if (retweet == '1') {
        setOpenRetweet(true)
      }
      const mint = getSearchParam('mint');
      if (mint == '1') {
        setOpenMint(true)
      }
      const testnet = getSearchParam('testnet');
      if (testnet == '1') {
        setVpBaseUrl(VPBaseURL_Testnet);
        setPointContractAddr(VPContractAddr_Testnet);
        setReceiptAddr('0x19b6250c9ff3a4f4fc21a1fa3bec3849ca80db69');
        setProtocol('runes');
        setRuneName('RUNE•A');
        setIsMainnet(false);
        //setCurChainOptions(chainOptionsTestnet);
        //console.log('chainId testnet', testnets)
        //setCurNetworks(testnets);
        //setSelectedChain(Object.values(chainOptionsTestnet)[0]);
      } else {
        setVpBaseUrl(VPBaseURL_Mainnet);
      }
    }, [])

    useEffect(() => {
      setRuneMintData(`data:,{"r": "${protocol}", "op": "claim", "amt": "1000", "tick": "${runeName}"}`);
    }, [protocol, runeName])

    useEffect(() => {
      if (vpBaseUrl == '') return;

      const vpInfoUrl = `${vpBaseUrl}/points/info?contract=${pointContractAddr}`;
      fetch(vpInfoUrl, {}).then(resp => {
        resp.json().then(pointsInfo => {
          console.log('obt pointsInfo', pointsInfo);
          if (pointsInfo.status == 'success' && pointsInfo.result) {
            setPointsInfo(pointsInfo.result);
            //setNumberOfRetweet(pointsInfo.result.holders);
          }
        })
      })
    }, [vpBaseUrl, pointContractAddr])

    useEffect(() => {
      if (pointsInfo == null) return;

      const vpRankingUrl = `${vpBaseUrl}/points/rankings?contract=${pointContractAddr}&size=1000`;
      fetch(vpRankingUrl, {}).then(resp => {
        resp.json().then(rankingInfos => {
          console.log('obt points rankingInfos', rankingInfos);
          if (rankingInfos.status == 'success' && rankingInfos.result && rankingInfos.result.count > 0) {
            const pointData = []
            rankingInfos.result.list.forEach((rankingInfo, i) => {
              const totalPoints = new BigNumber(pointsInfo.total).toNumber();
              const quantity = new BigNumber(rankingInfo.total).toNumber();
              pointData.push({
                rank: i + 1,
                address: rankingInfo.account,
                proportion: convertNumberToPercentage(quantity, totalPoints) + '%',
                quantity
              })
            })
            setPointRankingData(pointData)
            setTotalPointNumber(pointData.length); 
          }
        })
      })
    }, [pointsInfo, pointContractAddr])

    useEffect(() => {
      const networkQuantity = {}
      if (deployInfo.mined) {
        Object.keys(chainOptions).forEach(chainName => {
          const chainInfo = chainOptions[chainName];
          const idCode = chainInfo.idCode - 9000;
          
          const quantity = deployInfo.mined[idCode] ? parseInt(deployInfo.mined[idCode].amount) : 0;
          if (!isMainnet) {
            if (chainName == 'BEVM Testnet') {
              chainName = 'BEVM Mainnet';
            }
            if (chainName == 'Bitlayer Testnet') {
              chainName = 'Bitlayer';
            }
          }
          networkQuantity[chainName] = quantity;
        })
      }

      setReceivedNetworkData(
        curNetworks.filter(v => v.name.indexOf('Testnet') == -1).map((network, index) => (
          { chainName: network.name, quantity: networkQuantity[network.name] ? networkQuantity[network.name] : 0 }
        ))
      ) 
    }, [curNetworks, deployInfo])

    useEffect(() => {
      if (obtHost == null) return;

      const getDeployInfo = () => {
        const allDeploysUri = `${obtHost}/runes/deploys?r=${protocol}`;  // https://docs.vizing.com/docs/DApp/Omni-Inscriptions/#response-arrayobject
        fetch(allDeploysUri, {}).then(resp => {
          resp.json().then(deployInfos => {
            console.log('obt runes/deploys', deployInfos);
            if (deployInfos.statusCode == 500 || deployInfos.data == null) return;

            const myDeployInfo = deployInfos.data.find(deployInfo => deployInfo.tick == runeName);
            if (myDeployInfo == null) return;
            //console.log('runes/deploys', myDeployInfo)

            setDeployInfo(myDeployInfo);
            setTotalMintNumber(myDeployInfo.accounts);
          })
        })
      }

      getDeployInfo();
      const intervalId = setInterval(() => {
        getDeployInfo();
      }, 30000);
      return () => clearInterval(intervalId); 
    }, [protocol])

    useEffect(() => {
      if (obtHost == null) return;
      
      const mintingRankingUri = `${obtHost}/runes/ranks?r=${protocol}&tick=${runeName}&page=${currentPageNo}&size=10`;  // https://docs.vizing.com/docs/DApp/Omni-Inscriptions/#3-inscriptions-ranks
      fetch(mintingRankingUri, {}).then(resp => {
        resp.json().then(rankingInfos => {
          console.log('obt runes/ranks', rankingInfos);
          //setMintRankingData(rankingInfos);
          if (rankingInfos.data == null) return;

          const mintData = []
          for (let i = 0; i < rankingInfos.data.length; i++) {
            const rankingInfo = rankingInfos.data[i];
            mintData.push({
              rank: (i + 1) + (currentPageNo - 1) * 10,
              address: rankingInfo.account,
              proportion: rankingInfo.percentage.replace(/\.?0+$/, '') + '%',
              quantity: parseInt(rankingInfo.amount)
            })
          }
          setMintRankingData(mintData)
        })
      })
    }, [protocol, runeName, currentPageNo])

    useEffect(() => {
      setCurrentPageNo(1);
      if (tableSelected == 'PointRanking') {
        setCurrentDataSize(totalPointNumber);
        setShowPageSelector(totalPointNumber > 10);
      } else if (tableSelected == 'MintingRanking') {
        setCurrentDataSize(totalMintNumber);
        setShowPageSelector(totalMintNumber > 10);
      } else {
        setCurrentDataSize(0);
        setShowPageSelector(false);
      }
    }, [tableSelected])

    const copyMintData = (data) => {
      copy(data);
      toast({
        title: 'Success',
        description: "Copied",
        status: 'success',
        position: 'bottom-right',
        isClosable: true,
      });
    }

    const mintRunes = () => {    
      if (address == null) {
        toast({
          title: 'Warning',
          description: "Please connect wallet firstly.",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }  
      if (chainId == selectedChain.chainId) {
        toast({
          title: 'Warning',
          description: "Cannot mint runes on the same chain! Please select another chain.",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }
      setMintWord('Minting');
      try {
        const value = '0x' + new BigNumber(chainId == bobNetworkChainId ? mintFeeOfETH : mintFee).shiftedBy(18).plus(selectedChain.idCode).toString(16);
        console.log(`mint rune to ${selectedChain.label}:${selectedChain.idCode} with ${new BigNumber(chainId == bobNetworkChainId ? mintFeeOfETH : mintFee).shiftedBy(18).plus(selectedChain.idCode).toString()}`);
        for (let i = 0; i < repeatTimes; i++) {
          sendTransaction(config, {
            to: receiptAddr,
            value,
            data: toHex(runeMintData), 
          }).then(hash => {
            setMintWord('Mint');
          }).catch(error => {
            setMintWord('Mint');
          })
        }     
      } catch (error) {
      }
    }

    const retweet = () => {
      if (!openRetweet) return;

      if (address == null) {
        toast({
          title: 'Warning',
          description: "Please connect wallet firstly",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }
       window.open(retweetLink, '_tab');
    }

    return (
      <div className={`${styles.page} flex-col`}>
        <div className={`${styles['section_1']} flex-col align-center`}>
          <div className={`${styles['auction_block']} flex-row`}>
            <div className={`${styles['auction_action']} flex-col align-center`}>
              <span className={`${styles['participate']}`}>Auction</span>
              <Box className={styles.countdownWrapper}>
                <Box className={styles.countdownBox}>
                  {leftHour}
                  <span className={styles.legend}>Hours</span>
                </Box>
                <Box className={styles.countdownBox} background={'gray.800'}>
                  {leftMinute}
                  <span className={styles.legend}>Minutes</span>
                </Box>
                <Box className={styles.countdownBox} background={'gray.800'}>
                  {leftSecond}
                  <span className={styles.legend}>Seconds</span>
                </Box>
              </Box>
              <div className={`${styles['round_no_row']} flex-row justify-between align-center`}>
                <span className={`${styles['auction_property']}`}>Round #</span>
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} className={`${styles['menu-button']}`}>
                    <Box className={`flex-row justify-start`}>
                        <span className={`${styles['chain_label']}`}># {allRounds[0]}</span>
                    </Box>
                  </MenuButton>
                  <MenuList className={`${styles['menu-list']}`}>
                      {allRounds.map(roundNo => {
                            return <MenuItem className={`${styles['menu-item']} flex-row`}
                              onClick={() => setSelectedChain({...option})}>
                              <span className={`${styles['chain_label']}`}># {roundNo}</span>
                          </MenuItem>
                      }).filter(v => v != null)}
                  </MenuList>
                </Menu>
              </div>

              <div className={`${styles['highest_bid_row']} flex-row justify-between align-center`}>
                <span className={`${styles['auction_property']}`}>Highest Bid</span>
                <div className={`${styles['auction_property_value']} flex-row justify-end align-center`}>                  
                  <span className={`${styles['auction_value']}`}>{highestBid}</span>
                </div>
              </div>

              <div className={`${styles['highest_bidder_row']} flex-row justify-between align-center`}>
                <span className={`${styles['auction_property']}`}>Highest Bidder</span>                  
                <div className={`${styles['auction_property_value']} flex-row justify-end align-center`}>                  
                  <span className={`${styles['auction_value']}`}>{formatAddress({address: highestBidder})}</span>
                </div>
              </div>

              <div className={`${styles['highest_bidder_row']} flex-row justify-between align-center`}>
                <span className={`${styles['auction_property']}`}>Reward & Unspent</span>                  
                <div className={`${styles['auction_property_value']} flex-row justify-end align-center`}>                  
                  <span className={`${styles['auction_value']}`}>{`${leftReward} ${tokenSymbol} & ${leftEth} ${tokenSymbol}`}</span>
                </div>
              </div>

              <div className={`${styles['mint_open']} flex-col justify-around align-center`} onClick={() => mintRunes()}>
                <span className={`${styles['mint_open_text']}`} onClick={() => mintRunes()}>{mintWord}{mintWord == 'Bidding' ? <Spinner  className={`${styles['spinner']}`}/> : ''}</span>
              </div>              
            </div>
            <div className={`${styles['tooltip_list']} flex-col align-center`}>
              <span className={`${styles['bid_tooltip']}`}>
              👉 The winner of each auction round will receive a qualification to issue an asset, and own the fees generated during the asset's trading. 
              </span>  
              <span className={`${styles['bid_tooltip']}`}>
              👉 Each auction round lasts for 24 hours, and the final bid must end at least 5 minutes before the ultimate end time.
              </span>   
              <span className={`${styles['bid_tooltip']}`}>
              {`👉 Each bid must be at least ${minBidGap} ${tokenSymbol} higher than the previous bid.`}
              </span>  
              <span className={`${styles['bid_tooltip']}`}>
              👉 10% of each bid amount will be evenly distributed among the previous bidders.
              </span>  
              <span className={`${styles['bid_tooltip']}`}>
              👉 Unsuccessful bidders can withdraw their rewards and remaining principal.
              </span>             
            </div>            
          </div>
          <Wrap className={`${styles['all_stat']}`} spacing='30px' justify='space-between'>
              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/premine.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Total Rounds</span>
                  <span className={`${styles['stat_value']}`}>{currentRound + 1}</span>
                </div>
              </Center>

              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/per_mint.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Total Bid Volume</span>
                  <span className={`${styles['stat_value']}`}>1000</span>
                </div>
              </Center>

              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/holders.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Total Bidder</span>
                  <span className={`${styles['stat_value']}`}>{deployInfo.accounts ? deployInfo.accounts : 0}</span>
                </div>
              </Center>

              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/total_supply.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Max Bid Value</span>
                  <span className={`${styles['stat_value']}`}>0</span>
                </div>
              </Center>

              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/minting_period.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Issued Assets</span>
                  <span className={`${styles['stat_value']}`}>0</span>
                </div>
              </Center>

              <Center className={`${styles['stat_box']}`}>
                <div className={`${styles['stat_inner_box']} flex-col justify-center align-center`}>
                  <Image
                    className={`${styles['stat_label']}`}
                    src={
                      require('assets/img/total_txs.png')
                    }
                  />
                  <span className={`${styles['stat_name']}`}>Max Asset Fee</span>
                  <span className={`${styles['stat_value']}`}>0</span>
                </div>
              </Center>
            </Wrap>
        </div>
        {/* </div> */}
      </div>
    );
}
