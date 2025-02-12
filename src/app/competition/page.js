'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

import { Checkbox } from '@chakra-ui/react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Tooltip,
  Box,
} from '@chakra-ui/react'
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from '@chakra-ui/react'
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'
import { config } from 'wagmiConfig';
import { useAccountEffect, useConnect } from 'wagmi';
import { readContract, watchContractEvent, getAccount } from '@wagmi/core'
import { writeContract, waitForTransactionReceipt, sendTransaction, multicall } from '@wagmi/core';
import { parseEther } from 'viem';
import { getSearchParam } from 'utils/tool';
import { formatTime2Second, formatTimeWithoutYear } from 'utils/dateFormartter';
import { formatAddress } from 'utils/addressFormatter';
import { decompressEthAddress, compressEthAddress } from 'utils/base62';
import Typed from 'typed.js';
import DeployFactory from 'contracts/deployFactory.json';
import Points from 'contracts/points.json';
import Fair314 from 'contracts/fair314.json';
import BlastToken from 'contracts/blast.json';
import BigNumber from 'bignumber.js';

export default function Page() {  
  const [ address, setAddress ] = useState(null);
  const [connector, setConnector ] = useState(null);
  const [assetName, setAssetName] = useState('');
  const [minMints, setMinMints] = useState(0);
  const [maxMints, setMaxMints] = useState(0);
  const [userBasePoints, setUserBasePoints] = useState(0);
  const [userL1Points, setUserL1Points] = useState(0);
  const [userL2Points, setUserL2Points] = useState(0);
  const [totalBasePoints, setTotalBasePoints] = useState(0);
  const [totalL1Points, setTotalL1Points] = useState(0);
  const [totalL2Points, setTotalL2Points] = useState(0);
  const [issuerAddr, setIssuerAddr] = useState('');
  const [startIssuing, setStartIssuing] = useState(false);
  const [startMinting, setStartMinting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [startSettingReferrer, setStartSettingReferrer] = useState(false);
  const [deployContractAddr, setDeployContractAddr] = useState('')
  const [fair314ContractAddr, setFair314ContractAddr] = useState('')
  const [pointsContractAddr, setPointsContractAddr] = useState('')
  const [blastContractAddr, setBlastContractAddr] = useState('')
  const [totalAssetsNum, setTotalAssetsNum] = useState(0);
  const [assetsInfo, setAssetsInfo] = useState([]);
  const [showTooltip, setShowTooltip] = React.useState({})
  const [repeatTxs, setRepeatTxs] = useState(1);
  const [curAssetInfo, setCurAssetInfo] = useState(null);
  const [updateAssets, setUpdateAssets] = useState(false);
  const [updateOneAsset, setUpdateOneAsset] = useState(false);
  const [currentPageNo, setCurrentPageNo] = useState(1);
  const [myRefCode, setMyRefCode] = useState('');
  const [myReferrer, setMyReferrer] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [referrerCode, setReferrerCode] = useState('');
  const [updatePoints, setUpdatePoints] = useState(false);

  const [mintFee, setMintFee] = useState('0.001');

  const pageSize = 10;
  const referrerMinPoints = 600;

  const phase1 = React.useRef(null);
  const toast = useToast();
  const router = useRouter();

  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isOpenMint, onOpen: onOpenMint, onClose: onCloseMint } = useDisclosure()
  const { isOpen: isOpenRefSetting, onOpen: onOpenRefSetting, onClose: onCloseRefSetting } = useDisclosure()

  React.useEffect(() => {
    // The first asset issuance platform that combines smart inscription with x314, achieving ultimate fairness and efficiency.
    const typed1 = new Typed(phase1.current, {
      strings: [`X314's trading rules\nInscription's minting rules\nIssuer obtains 30% trading fee\nTrading champion obtains 50% trading fee`],
      typeSpeed: 50,
      showCursor: true,
    });

    return () => {
      typed1.destroy();
    };
  }, []);

  useAccountEffect({
    onConnect(data) {
      console.log('Connected!', data)
      setAddress(data.address);
      setIssuerAddr(data.address);
      setConnector(data.connector);
      setMyRefCode(compressEthAddress(data.address));
    },
    onDisconnect() {
      // console.log('Disconnected!')
    },
  })

  useEffect(() => {
    if (config == null) return;

    setDeployContractAddr(DeployFactory.address[config.state.chainId]);
    setPointsContractAddr(Points.address[config.state.chainId]);
    setBlastContractAddr(BlastToken.address[config.state.chainId]);
  }, [config])

  useEffect(() => {
    if (config == null || pointsContractAddr == '' || address == null) return;

    readContract(config, {
      address: pointsContractAddr,
      abi: Points.abi,
      functionName: 'referee2Referrer',
      args: [address]
    }).then((referrerAddr) => {
      console.log('referee2Referrer', referrerAddr);

      if (referrerAddr != '0x0000000000000000000000000000000000000000') {
        setMyReferrer(referrerAddr);
      } else {
        setMyReferrer('');/// use router to get the parameter's value from the url
        const referrerCode = getSearchParam('ref');
        if (referrerCode != null) {
          localStorage.setItem('referrerCode', referrerCode);
          setReferrerCode(referrerCode);
        }
      }
    })

    readContract(config, {
      address: pointsContractAddr,
      abi: Points.abi,
      functionName: 'authorizedReferrers',
      args: [address]
    }).then((isAuthorized) => {
      setIsAuthorized(isAuthorized);
    })
  }, [config, pointsContractAddr, address])

  useEffect(() => {
    if (address == null || pointsContractAddr == '') return;

    readContract(config, {
      address: pointsContractAddr,
      abi: Points.abi,
      functionName: 'userTotalPoints',
      args: [address, 0]
    }).then((result) => {
      console.log('userTotalPoints', result);
      setUserBasePoints(Number(result[0]));
      setUserL1Points(Number(result[1]));
      setUserL2Points(Number(result[2]));
    })

    readContract(config, {
      address: pointsContractAddr,
      abi: Points.abi,
      functionName: 'totalPoints',
      args: [0]
    }).then((result) => {
      console.log('totalPoints', result);
      setTotalBasePoints(Number(result[0]));
      setTotalL1Points(Number(result[1]));
      setTotalL2Points(Number(result[2]));
    })
  }, [pointsContractAddr, updatePoints, address])

  const mergeAssetInfo = (deployInfo, fair314Info) => {
    let status = 1;  // 0: fail, 1: in mint, 2: success
    const now = new Date().getTime() / 1000;
    const endTime = fair314Info.endTime;
    const mintCount = fair314Info.mintCount;
    if (now > endTime && mintCount < deployInfo.minMints) {
      status = 0;
    }
    if (now < endTime && mintCount < deployInfo.maxMints) {
      status = 1;
    }
    if ((now < endTime && mintCount == deployInfo.maxMints)
    || (now > endTime && mintCount >= deployInfo.minMints)) {
      status = 2;
    }
    const assetInfo = {...deployInfo, ...fair314Info, status}
    assetInfo.minMints = Number(assetInfo.minMints);
    assetInfo.maxMints = Number(assetInfo.maxMints);
    assetInfo.mintCount = Number(assetInfo.mintCount);
    assetInfo.endTime = Number(assetInfo.endTime);
    assetInfo.yourMintAmount = Number(assetInfo.yourMintAmount);
    assetInfo.totalSupply = Number(assetInfo.totalSupply);
    return assetInfo;
  }

  useEffect(() => {
    console.log('address 1', address);
    if (address == null || deployContractAddr == '') return;

    readContract(config, {
      address: deployContractAddr,
      abi: DeployFactory.abi,
      functionName: 'total314AssetsNum',
      args: []
    }).then((result) => {
      console.log('total314AssetsNum', result);
      setTotalAssetsNum(Number(result));
      if (Number(result) > 0) {
        readContract(config, {
          account: address,
          address: deployContractAddr,
          abi: DeployFactory.abi,
          functionName: 'get314Assets',
          args: [0, Number(result)]
        }).then((result) => {
          const assetInfoList = result[0].map((deployInfo, index) => {
            return mergeAssetInfo(deployInfo, result[1][index]);
          })
          console.log('assetInfos', assetInfoList);
          setAssetsInfo(assetInfoList);
        })
      }
    })
  }, [deployContractAddr, updateAssets, address])

  useEffect(() => {
    if (curAssetInfo == null) return;

    console.log('update', curAssetInfo.name)
    readContract(config, {
      account: address,
      address: deployContractAddr,
      abi: DeployFactory.abi,
      functionName: 'get314AssetByName',
      args: [curAssetInfo.name]
    }).then(assetInfo => {
      console.log('get314AssetByName', assetInfo)
      assetInfo = mergeAssetInfo(assetInfo[0], assetInfo[1]);
      const newAssetsInfo = assetsInfo.map(asset => {
        if (asset.name == assetInfo.name) {
          return assetInfo
        }
        return asset;
      })
      setAssetsInfo(newAssetsInfo);
    })

  }, [updateOneAsset])

  const updateAssetName = (name) => {
    if (name.length > 12 || (!/^[a-zA-Z0-9]+$/.test(name) && name.length > 0)) return;

    setAssetName(name.toUpperCase());
  }

  const retweet = () => {
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
    const content = `Fair314 is a new asset issuance platform. The assets issued through this platform combine the fairness of inscription and the efficiency and anti-MEV characteristics of the X314 protocol. In addition, trading champions can receive 50% of the transaction fees on the second day. Come and give it a try! https://fair314.xyz?ref=${myRefCode}`;
    const retweetLink = `https://twitter.com/intent/tweet?text=${encodeURI(content)}`; 
    window.open(retweetLink, '_tab');
  }

  const issueAsset = async () => {
    console.log(assetName, minMints, maxMints, issuerAddr);

    setStartIssuing(true);

    console.log(config, address, blastContractAddr, deployContractAddr)
    readContract(config, {
      address: blastContractAddr,
      abi: BlastToken.abi,
      functionName: 'allowance',
      args: [address, deployContractAddr]
    }).then(async (result) => { 
      const approvedAmount = new BigNumber(result);
      let approveResult = true;
      if (approvedAmount.isLessThan(new BigNumber(1000).shiftedBy(18))) {
        approveResult = await executeTx({
          account: address,
          address: blastContractAddr,
          abi: BlastToken.abi,
          functionName: 'approve',
          args: [deployContractAddr, '0x' + new BigNumber(1000).shiftedBy(18).toString(16)],
        }, "Approve Blast token successfully", "Fail to approve Blast token");    
      }
      if (approveResult) {
        const issueResult = await executeTx({
          account: address,
          address: deployContractAddr,
          abi: DeployFactory.abi,
          functionName: 'deploy',
          args: [assetName, minMints, maxMints, issuerAddr],
        }, "Issue asset successfully", "Fail to issue asset");
        if (issueResult) {
          setUpdateAssets(!updateAssets);
          setUpdatePoints(!updatePoints);
          onClose();
        }
      }
      setStartIssuing(false);
    })
  }

  const mint = () => {
    setStartMinting(true);
    let mintCount = 0;
    for (let i = 0; i < repeatTxs; i++) {
      sendTransaction(config, {
        to: curAssetInfo.fair314,
        value: parseEther(mintFee),
        data: '', 
        connector
      }).then(async (hash) => {
        await waitForTransactionReceipt(config, { hash });
        mintCount++;
        if (mintCount == repeatTxs) {
          setUpdateOneAsset(!updateOneAsset);
          setUpdatePoints(!updatePoints);
          setStartMinting(false);
          onCloseMint();
        }
      }).catch(error => {
        mintCount++;
        if (mintCount == repeatTxs) {
          setUpdateOneAsset(!updateOneAsset);
          setStartMinting(false);
          onCloseMint();
        }
      })
    }
  }

  const openMintDialog = (assetInfo) => {
    onOpenMint();
    setCurAssetInfo(assetInfo);
  }

  const setReferrer = async () => {
    if (referrerAddr == '') {
      toast({
        title: 'Failed',
        description: 'Invalid referrer address',
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }

    setStartSettingReferrer(true);
    
    await executeTx({
      account: address,
      address: pointsContractAddr,
      abi: Points.abi,
      functionName: 'setReferrer',
      args: [referrerAddr],
    }, "Set referrer successfully", "Fail to set referrer");  

    setStartSettingReferrer(false);
  }

  const copyReferLink = () => {
    if (userBasePoints < referrerMinPoints) {
      toast({
        title: 'Failed',
        description: 'Your base points have not reached the minimum requirement(600 points) for referral link',
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    navigator.clipboard.writeText(window.location.href + '?ref=' + myRefCode);
    toast({
      title: 'Success',
      description: 'Copied referral link',
      status: 'success',
      position: 'bottom-right',
      isClosable: true,
    });
  }

  const claim = async (assetInfo) => {
    setCurAssetInfo(assetInfo);

    setIsClaiming(true);

    await executeTx({
      account: address,
      address: assetInfo.fair314,
      abi: Fair314.abi,
      functionName: 'claimAll',
      args: [],
    }, "Claim token successfully", "Fail to claim token");  

    setIsClaiming(false);
    setUpdateOneAsset(!updateOneAsset);
  }

  const refund = async (assetInfo) => {
    const mintAmount = await readContract(config, {
      address: assetInfo.fair314,
      abi: Fair314.abi,
      functionName: 'userMintAmount',
      args: [address]
    });
    console.log('mintAmount', mintAmount)

    if (Number(mintAmount) == 0) {
      toast({
        title: 'Warning',
        description: "You have no ETH to refund.",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }

    setIsRefunding(true);

    await executeTx({
      account: address,
      address: assetInfo.fair314,
      abi: Fair314.abi,
      functionName: 'refund',
      args: [],
    }, "Refund minting fee successfully", "Fail to refund minting fee");  

    setIsRefunding(false);
  }

  const executeTx = async (parameters, successInfo, failInfo) => {
    try {      
      parameters.connector = connector;
      const hash = await writeContract(config, parameters);
      const receipt = await waitForTransactionReceipt(config, { hash });
      if (receipt.status != 'success') {
        return false;
      }
      toast({
        title: 'Success',
        description: successInfo,
        status: 'success',
        position: 'bottom-right',
        isClosable: true,
      });
      return true;
    } catch (error) {
      console.log(error)
      toast({
        title: 'Failed',
        description: failInfo + ":" + error.message,
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return false;
    }
  }

  return (
    <Box className={`${styles.page} flex-col`}>
      <Box className={`${styles['section_1']} flex-col align-center`}>
        <Box className={`${styles['platform_title']}`}>   
        Fair314 Asset Issuance Platform     
        </Box>
        <Box ref={phase1} className={`${styles['platform_desc']}`}>        
        </Box>
        <Box className={`${styles['box_12']} flex-col align-center`}>                  
          <Box className={`${styles['box_13']} flex-col align-center`}>
            <Box className={`flex-row`}>
              <Box className={`${styles['text-wrapper_1']} flex-col justify-around align-center`} onClick={onOpen}>
                <span className={`${styles['text_5']}`} onClick={onOpen}>Issue My Asset</span>
              </Box>
            </Box>
            <Accordion className={`${styles['rules']}`} allowMultiple>
              <AccordionItem>
                <h2>
                  <AccordionButton _expanded={{ bg: 'gray', color: 'white' }}>
                    <Box as='span' flex='1' textAlign='left'>
                      Detailed Rules
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel>
                  <Box className={`flex-col align-center`}>
                    <span className={`${styles['deploy_desc']}`}>
                      <b>👉 Cost of Issuer: </b>1000 Blast / Issue
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Earn of Issuer: </b>extract 50% from the buyer's 0.3% tax.
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Mint: </b>0.001 ETH/Mint, 1000 Blast/Mint, end after 3 days or maxinum minting quantity. 
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     ⚠️ If the minimum mints quantity is not reached within 3 days, the asset issuance will fail, and you can claim all mint fees incurred。
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Trading Rules: </b>
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 Buy Fair314 assets by sending ETH to the contract address.
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 Sell Fair314 assets by sending them to the contract address and receiving ETH in return.
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 One EOA can only make one transaction per minute to prevent MEV bots.
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Liquidity: </b>automatically provided by the Fair314 contract, no one has the authority to add or remove.
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 Bonding Curve: X * Y = K
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 X tokens from the ETH provided by users when minting.
                    </span>  
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                     🔔 Y tokens are Fair314 and generated by the contract itself, with the quantity equal to the total mint amount.
                    </span>                  
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Tax of Seller: </b>0.5% burned tax of base token
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Tax of Buyer: </b>0.3% tax of quote token. 
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Trading Champion of Round #N: </b>extract 50% from the buyer's 0.3% tax in Round #N+1.
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Defination of Trading Champion: </b>The user with the largest trade volume of buying the base token in each round.
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 How long is each round? </b> 24 Hours.
                    </span>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Box className={`${styles['activity']} flex-col justify-start`}>
            <span className={`${styles['text_43']}`}>Points</span>
            <Box className={`flex-row justify-start align-center`}>
              <span className={`${styles['text_44']}`}>
              When players participate in asset issuing and trading, and other valid behaviors defined by the platform, points will be earned.
              </span>
            </Box>            
          </Box>

          <Box className={`${styles['group_3']}`}>
            <Box className={`${styles['text-wrapper_30']} flex-col`}>
              <span className={`${styles['text_7']}`}>Your Base Points / L1 Reward Points / L2 Reward Points</span>         
              <span className={`${styles['text_8']}`}>{userBasePoints} / {userL1Points} / {userL2Points}</span>
              <span className={`${styles['text_9']}`}>
              The more points you have, the more platform assets or rewards you can obtain in the future.
              </span>
              <Box className={`${styles['referrer_share_x']} flex-row justify-start`}>
                {
                  (myReferrer == '' && !isAuthorized)
                  ?
                  <Tooltip label={"Only by becoming a referee first can one become a referrer."}>
                    <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} onClick={() => { onOpenRefSetting() }}>Set Referrer</Button> 
                  </Tooltip>
                  :
                  <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} onClick={() => { copyReferLink() }}>Copy Referral Link</Button>
                }
                <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} onClick={() => retweet()}>Share on X</Button> 
              </Box>
            </Box>
            <Image
              className={`${styles['image_3']}`}
              src={
                require('assets/img/pskks2bxv7mhfx96xg3yvwfhc0om9jho9z6ad83bd3-c281-4fc6-9a34-f6dda341c62a.png')
              }
            />
            <Box className={`${styles['text-wrapper_30']} flex-col`}>
              <Box className={`${styles['earn_points']} flex-row justify-start align-center`}>
                <span className={`${styles['earn_points_question']}`}>How to earn Points?</span>
              </Box>
              <span className={`${styles['points_rule']}`}>👉 1000 Points / Issue</span>
              <span className={`${styles['points_rule']}`}>👉 3 Points / Mint</span>
              <span className={`${styles['points_rule']}`}>👉 3 Points / 0.001 ETH volume when selling asset</span>
              <span className={`${styles['points_rule']}`}>👉 6 Points / 0.001 ETH volume when buying asset</span>
              <span className={`${styles['points_rule']}`}>👉 5% Reward Points from Level 1 Referee</span>
              <span className={`${styles['points_rule']}`}>👉 1% Reward Points from Level 2 Referee</span>
              {/* <span className={`${styles['text_9']}`}>
              All points obtained by all players.
              </span> */}
            </Box>
          </Box>                                        

          <Box className={`${styles['activity']} flex-col justify-start`}>
            <span className={`${styles['text_43']}`}>Assets</span>
            <Box className={`flex-row justify-start align-center`}>
              <span className={`${styles['text_44']}`}>
              Please mint the assets before the deadline and before reaching the maximum minting limit.
              </span>
            </Box>    
            <span className={`${styles['mint_tooltip']}`}>
            If the asset issuance fails, all minting fees will be refunded. Each minting costs 0.001 ETH.
            </span>        
          </Box>
          
          <TableContainer className={`${styles['group_12']} flex-col align-center`}>
            <Table variant='simple'>
              {assetsInfo.length == 0 && <TableCaption>No Data</TableCaption>}
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Contract</Th>
                  <Th>Issuer</Th>
                  <Th>End Time</Th>
                  <Th>Min Mints</Th>
                  <Th>Max Mints</Th>
                  <Th>Current Mints</Th>
                  <Th>Total Supply</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody style={{color: 'white'}}>
              {
              assetsInfo.length > 0 && 
                assetsInfo.slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize).map(assetInfo => (
                  <Tr>
                    <Td>
                    {assetInfo.name}
                    </Td>
                    <Td>{formatAddress({address: assetInfo.fair314, len: 4})}</Td>
                    <Td>{formatAddress({address: assetInfo.issuer, len: 4})}</Td>
                    <Td>{formatTimeWithoutYear(assetInfo.endTime * 1000)}</Td>
                    <Td style={{color: '#04E7FE'}}>{assetInfo.minMints}</Td>
                    <Td style={{color: '#04E7FE'}}>{assetInfo.maxMints}</Td>
                    <Td style={{color: '#04E7FE'}}>{assetInfo.mintCount}</Td>
                    <Td>{new BigNumber(assetInfo.totalSupply).shiftedBy(-18).toString()}</Td>
                    <Td>
                     {
                        assetInfo.status == 0 ? 
                        <Tooltip label={"The asset issuance has been failed, and you can refund all of your minting fee."}>
                          <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                            onClick={() => refund(assetInfo)}
                            isLoading={isRefunding} 
                            loadingText="Refunding">Refund</Button> 
                        </Tooltip>
                        :
                        assetInfo.status == 1 ?
                        <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                          onClick={() => openMintDialog(assetInfo)}>Mint</Button> 
                        :
                        assetInfo.yourMintAmount > 0 ?
                        <Tooltip label={"The Fair314 asset minted can only become a tradable ERC20 after being claimed."}>
                          <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                            onClick={() => claim(assetInfo)}
                            isLoading={isClaiming} 
                            loadingText="Claiming">Claim</Button>
                        </Tooltip> 
                        :
                        <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} onClick={() => { router.push(`/asset/${assetInfo.fair314}`)}}>Trade</Button> 
                      }
                    </Td>
                  </Tr>
                )) 
              }
              </Tbody>
            </Table>
            {
              assetsInfo.length > pageSize              
              && 
              <Box className={`${styles['box_15']} flex-row justify-center align-center`}>
                  <span className={`${styles['text_95']}`}>Page {currentPageNo} of {Math.ceil(totalAssetsNum / pageSize)}</span>
                  <Box className={`${styles['image-wrapper_1']} flex-row`} onClick={() => setCurrentPageNo(1)}>
                    <Image
                      className={`${styles['thumbnail_1']}`}
                      src={
                        require('assets/img/psgpcff5ezebidz14ynqt5nntmla8ig5ntb3396e85-51f5-4a0d-98d2-6da77438e5f0.png')
                      }
                    />
                    <Image
                      className={`${styles['thumbnail_2']}`}
                      src={
                        require('assets/img/psvp8s7nc3xv94kyk6suslfjrwg9ayl4sad3beb3f-2932-46fd-a4e6-1a633368ca8b.png')
                      }
                    />
                  </Box>
                  <Box className={`${styles['image-wrapper_2']} flex-col`} onClick={() => setCurrentPageNo(currentPageNo > 1 ? currentPageNo - 1 : 1)}>
                    <Image
                      className={`${styles['thumbnail_3']}`}
                      src={
                        require('assets/img/psgpcff5ezebidz14ynqt5nntmla8ig5ntb3396e85-51f5-4a0d-98d2-6da77438e5f0.png')
                      }
                    />
                  </Box>
                  <Box className={`${styles['image-wrapper_3']} flex-col`}
                    onClick={() => setCurrentPageNo(currentPageNo < Math.ceil(totalAssetsNum / pageSize) ? currentPageNo + 1 : Math.ceil(totalAssetsNum / pageSize))}>
                    <Image
                      className={`${styles['thumbnail_4']}`}
                      src={
                        require('assets/img/psccza0brbhkdc6eyemor0vgreltwniggrbf3f6e856-1514-45cf-80f8-6ddcf2f0a9cc.png')
                      }
                    />
                  </Box>
                  <Box className={`${styles['image-wrapper_4']} flex-row`} onClick={() => setCurrentPageNo(Math.ceil(totalAssetsNum / pageSize))}>
                    <Image
                      className={`${styles['thumbnail_5']}`}
                      src={
                        require('assets/img/psjsl26h87bpehptgchyqaacvk3ha22n3w60384fe0-f89e-4dfe-9478-b790672c22ca.png')
                      }
                    />
                    <Image
                      className={`${styles['thumbnail_6']}`}
                      src={
                        require('assets/img/pstduw9i449cszrt0oluxvln26fd27n605j97ded29c-dc3a-4243-aa8e-b49424d22bca.png')
                      }
                    />
                  </Box>
              </Box>
            }
          </TableContainer>
        </Box>
      </Box>
      
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={`${styles['modal_layout']}`}
      >
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader className={`${styles['modal_head']}`}>Issue My Asset</ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel style={{color: 'white'}}>Asset name</FormLabel>
              <Input style={{color: 'white'}} value={assetName} onChange={(e) => updateAssetName(e.target.value)}/>
              <FormLabel style={{color: 'gray', fontSize: 12}}>Length 4 ~ 12, characters composed of A~Z0~9.</FormLabel>
              <FormLabel style={{color: 'gray', fontSize: 12}}>Assets with a name length of 3 will be open in the future.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel style={{color: 'white'}}>Minimum Mints</FormLabel>              
              <NumberInput style={{color: 'white'}} step={1000} onChange={(v) => setMinMints(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper style={{color: 'white'}}/>
                  <NumberDecrementStepper style={{color: 'white'}}/>
                </NumberInputStepper>
              </NumberInput>
              <FormLabel style={{color: 'gray', fontSize: 12}}>The lower limit of successful asset issuance.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel style={{color: 'white'}}>Maximum Mints</FormLabel>             
              <NumberInput style={{color: 'white'}} step={1000} onChange={(v) => setMaxMints(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper style={{color: 'white'}}/>
                  <NumberDecrementStepper style={{color: 'white'}}/>
                </NumberInputStepper>
              </NumberInput>
              <FormLabel style={{color: 'gray', fontSize: 12}}>The upper limit of successful asset issuance.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel style={{color: 'white', fontSize: 14}}>
              👉 Each mint consumes 0.001 ETH and receives 1000 Tokens. The duration of the issuance is 3 days. 
              </FormLabel>
              <FormLabel style={{color: 'white', fontSize: 14}}>
              👉 The issuance will automatically end after 3 days or when the total number of mints reaches the maximum limit.
              </FormLabel>
              <FormLabel style={{color: 'white', fontSize: 14}}>
              👉 If the minimum mints are not reached within 3 days, the issuance will fail, and minters can claim all ETH consumed when minting.
              </FormLabel>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                    mr={3} 
                    onClick={() => issueAsset()}
                    isLoading={startIssuing} 
                    loadingText="Issuing">
              Issue
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isOpenMint}
        onClose={onCloseMint}
        className={`${styles['modal_layout']}`}
      >
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader className={`${styles['modal_head']}`}>Mint Asset</ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel style={{color: 'white'}}>Repeat Transactions</FormLabel>              
              <NumberInput style={{color: 'white'}} min={1} step={1} onChange={(v) => setRepeatTxs(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper style={{color: 'white'}}/>
                  <NumberDecrementStepper style={{color: 'white'}}/>
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                    mr={3} 
                    onClick={() => mint()}
                    isLoading={startMinting} 
                    loadingText="Minting">
              Mint
            </Button>
            <Button onClick={onCloseMint}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isOpenRefSetting}
        onClose={onCloseRefSetting}
        className={`${styles['modal_layout']}`}
      >
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader className={`${styles['modal_head']}`}>Set Referrer</ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel style={{color: 'white'}}>Referrer Code</FormLabel>              
              <Input style={{color: 'white'}} value={referrerCode} onChange={(e) => setReferrerCode(e.target.value)}/>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button style={{background: 'linear-gradient(-90deg, #156CE8 0%, #04E7FE 100%)', border: '0px'}} 
                    mr={3} 
                    onClick={() => setReferrer()}
                    isLoading={startSettingReferrer} 
                    loadingText="Setting">
              Set
            </Button>
            <Button onClick={onCloseRefSetting}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}