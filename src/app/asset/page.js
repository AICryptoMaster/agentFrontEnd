'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import AssetCard from './component/AssetCard';
import styles from './page.module.css';

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
  InputGroup, 
  InputLeftElement,
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
import { Radio, RadioGroup, Stack, Select } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { config } from 'wagmiConfig';
import { useAccountEffect, useAccount, useChainId } from 'wagmi';
import { readContract, watchContractEvent, getBlockNumber, getToken } from '@wagmi/core'
import { writeContract, waitForTransactionReceipt, sendTransaction, multicall } from '@wagmi/core';
import { parseEther, erc20Abi, zeroAddress } from 'viem';
import { getSearchParam, displayReadableNumber } from 'utils/tool';
import { formatTime2Second, formatTimeWithoutYear } from 'utils/dateFormartter';
import { formatAddress } from 'utils/addressFormatter';
import { decompressEthAddress, compressEthAddress } from 'utils/base62';
import Typed from 'typed.js';
import DeployFactory from 'contracts/deployFactory.json';
import Points from '@/contracts/points.json';
import Fair314 from '@/contracts/fair314.json';
import BigNumber from 'bignumber.js';
import { MulticallAddress, ZeroAddress } from 'globalConfig';

export default function Page() {  
  const account = useAccount();
  const chainId = useChainId({config})
  const [ address, setAddress ] = useState(account?.address);
  const [connector, setConnector ] = useState(null);
  const [assetName, setAssetName] = useState('');
  const [minMints, setMinMints] = useState(0);
  const [maxMints, setMaxMints] = useState(0);
  const [mintPeroid, setMintPeroid] = useState(0);
  const [userBasePoints, setUserBasePoints] = useState(0);
  const [userL1Points, setUserL1Points] = useState(0);
  const [userL2Points, setUserL2Points] = useState(0);
  const [totalBasePoints, setTotalBasePoints] = useState(0);
  const [totalL1Points, setTotalL1Points] = useState(0);
  const [totalL2Points, setTotalL2Points] = useState(0);
  const [launcherAddr, setLauncherAddr] = useState(account ? account.address : '');
  const [startIssuing, setStartIssuing] = useState(false);
  const [startMinting, setStartMinting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [startSettingReferrer, setStartSettingReferrer] = useState(false);
  const [deployContractAddr, setDeployContractAddr] = useState('')
  const [pointsContractAddr, setPointsContractAddr] = useState('')
  const [totalAssetsNum, setTotalAssetsNum] = useState(0);
  const [assetsInfo, setAssetsInfo] = useState([]);
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
  const [tokenStatus, setTokenStatus] = useState('1')

  const [paidToken, setPaidToken] = useState(null)
  const [feePerLaunch, setFeePerLaunch] = useState(new BigNumber(0))
  const [mintFee, setMintFee] = useState(new BigNumber('0.0005').shiftedBy(18));  // eth
  const [mintTokenSymbol, setMintTokenSymbol] = useState('ETH');
  const [tokensCurrentMints, setTokensCurrentMints] = useState({});
  const [tokensTotalVolume, setTokensTokenVolume] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [refreshId, setRefreshId] = useState(0)
  const [curStatusAssetNum, setCurStatusAssetNum] = useState(0)
  const [pageSize, setPageSize] =  useState(10)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);

  const [isMobile, setIsMobile] = useState(false);

  const referrerMinPoints = 600;

  const phase1 = React.useRef(null);
  const toast = useToast();
  const router = useRouter();

  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isOpenMint, onOpen: onOpenMint, onClose: onCloseMint } = useDisclosure()
  const { isOpen: isOpenRefSetting, onOpen: onOpenRefSetting, onClose: onCloseRefSetting } = useDisclosure()

  //console.log('#######', account, address)
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 800); // 你可以根据需要调整这个断点
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useAccountEffect({
    onConnect(data) {
      console.log('Connected!', data)
      setAddress(data.address);
      setLauncherAddr(data.address);
      setConnector(data.connector);
      setMyRefCode(compressEthAddress(data.address));
    },
    onDisconnect() {
      // console.log('Disconnected!')
    },
  })

  useEffect(() => {
    if (config == null) return;
    console.log('##############', config);

    setDeployContractAddr(DeployFactory.address[config.state.chainId]);
    setPointsContractAddr(Points.address[config.state.chainId]);

    if (config.state.chainId == 56 || config.state.chainId == 97) { // bnb
      setMintFee(new BigNumber('0.0005').shiftedBy(18));
      setMintTokenSymbol('BNB');
    }
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

      if (referrerAddr != ZeroAddress) {
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
    if (config == null || deployContractAddr == '' || address == null) return;

    readContract(config, {
      address: deployContractAddr,
      abi: DeployFactory.abi,
      functionName: 'feePerLaunch',
      args: []
    }).then((feePerLaunch) => {
      setFeePerLaunch(new BigNumber(feePerLaunch));
    })

    readContract(config, {
      address: deployContractAddr,
      abi: DeployFactory.abi,
      functionName: 'paidToken',
      args: []
    }).then((tokenAddr) => {
      if (tokenAddr != ZeroAddress) {
        getToken(config, {
          address: tokenAddr
        }).then(token => {
          setPaidToken(token);
        })
      }
    })
  }, [config, deployContractAddr, address])

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
    let status = 1;  // 0: fail, 1: in mint, 2: waiting to claim, 3: success
    const now = new Date().getTime() / 1000;
    const endTime = fair314Info.endTime;
    const mintCount = fair314Info.mintCount;
    if (now > endTime && mintCount < deployInfo.minMints) {
      status = 0;  // fail
    }
    if (now < endTime && mintCount < deployInfo.maxMints) {
      status = 1;  // minting
    }
    if (now < endTime && mintCount == deployInfo.maxMints) {
      status = 2;  // waiting to claim
    }
    if (now > endTime && mintCount >= deployInfo.minMints) {
      status = 3;  // success
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
    if (deployContractAddr == '') return;

    readContract(config, {
      address: deployContractAddr,
      abi: DeployFactory.abi,
      functionName: 'total314AssetsNum',
      args: []
    }).then((result) => {
      console.log('total314AssetsNum', result);
      // setTotalAssetsNum(Number(result));
      if (Number(result) > 0) {
        readContract(config, {
          account: address == null ? zeroAddress : address,
          address: deployContractAddr,
          abi: DeployFactory.abi,
          functionName: 'get314Assets',
          args: [0, Number(result)]
        }).then((result) => {
          let assetsInMinging = 0;
          const assetInfoList = result[0].map((deployInfo, index) => {
            tokensCurrentMints[deployInfo.fair314] = Number(result[1][index].mintCount);
            const assetInfo = mergeAssetInfo(deployInfo, result[1][index]);
            if (assetInfo.status == 1) assetsInMinging++;
            return assetInfo;
          })

          console.log('assetInfos', assetInfoList);
          setCurStatusAssetNum(assetsInMinging);
          setTokensCurrentMints(JSON.parse(JSON.stringify(tokensCurrentMints)));
          setAssetsInfo(assetInfoList);
        })
      }
    })
  }, [deployContractAddr, updateAssets, address])

  useEffect(() => {
    if (searchKeyword == '') {
      setFilteredAssets(assetsInfo);
    } else {
      setFilteredAssets(assetsInfo.filter(asset => asset.name.toLowerCase().includes(searchKeyword.toLowerCase())));
    }
  }, [searchKeyword, assetsInfo]);

  useEffect(() => {
    setCurStatusAssetNum(filteredAssets.length);
  }, [filteredAssets]);

  useState(() => {
    let assetsNum = 0;
    assetsInfo.forEach(assetInfo => {
      if (tokenStatus == '0' && assetInfo.status == 0) assetsNum++;
      if (tokenStatus == '1' && assetInfo.status == 1) assetsNum++;
      if (tokenStatus == '2' && (assetInfo.status == 2 || assetInfo.status == 3)) assetsNum++;
    })
    setCurStatusAssetNum(assetsNum);
  }, [tokenStatus])

  useEffect(() => {
    if (assetsInfo.length == 0) return;
    
    if (refreshId > 0) {
      clearInterval(refreshId);
    }
    setRefreshId(setInterval(() => {
      const currentPageAssets = assetsInfo.slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize);
      const tokenAddrs = currentPageAssets.map(token => token.fair314);
      const contracts = []
      tokenAddrs.forEach(tokenAddr => {
        contracts.push({
          address: tokenAddr,
          abi: Fair314.abi,
          functionName: 'mintCounter',
          args: [],
        })
      })
      
      multicall(config, {
        contracts,
        multicallAddress: MulticallAddress[chainId], 
      }).then(mintCounts => {
        tokenAddrs.forEach((tokenAddr, index) => {
          tokensCurrentMints[tokenAddr] = Number(mintCounts[index].result);
        })
        setTokensCurrentMints(JSON.parse(JSON.stringify(tokensCurrentMints)));
      })
    }, 10000));
  }, [assetsInfo, currentPageNo])

  useEffect(() => {
    if (isMobile) {
      setPageSize(assetsInfo.length);
    } else {
      setPageSize(10);
    }
  }, [isMobile, assetsInfo]);

  useEffect(() => {
    if (assetsInfo.length == 0 || tokenStatus != '2') return;
    console.log('debug', tokenStatus)
    
    const currentPageAssets = assetsInfo.filter(assetInfo => assetInfo.status == 2 || assetInfo.status == 3)
                                        .slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize);
    const tokenAddrs = currentPageAssets.map(token => token.fair314);
    
    getBlockNumber(config).then(blockNumber => {
      const volumeInvokes = []
      tokenAddrs.forEach(tokenAddr => {
        volumeInvokes.push({
          address: tokenAddr,
          abi: Fair314.abi,
          functionName: 'getTotalVolumeAtBlock',
          args: [blockNumber],
        })
      })
      
      multicall(config, {
        contracts: volumeInvokes,
        multicallAddress: MulticallAddress[chainId], 
      }).then(totalVolumes => {
        tokenAddrs.forEach((tokenAddr, index) => {
          tokensTotalVolume[tokenAddr] = new BigNumber(totalVolumes[index].result).toString();
        })
        setTokensTokenVolume(JSON.parse(JSON.stringify(tokensTotalVolume)));
      })
    });
    
    const reservesInvokes = []
    tokenAddrs.forEach(tokenAddr => {
      reservesInvokes.push({
        address: tokenAddr,
        abi: Fair314.abi,
        functionName: 'getReserves',
        args: [],
      })
    })
    
    multicall(config, {
      contracts: reservesInvokes,
      multicallAddress: MulticallAddress[chainId], 
    }).then(result => {
      tokenAddrs.forEach((tokenAddr, index) => {
        const quoteTokenAmount = result[index].result[0];
        const baseTokenAmount = result[index].result[1];
        if (new BigNumber(quoteTokenAmount).toNumber() > 0) {
          tokenPrices[tokenAddr] = new BigNumber(quoteTokenAmount).dividedBy(new BigNumber(baseTokenAmount)).toFixed(8);

        }
      })
      setTokenPrices(JSON.parse(JSON.stringify(tokenPrices)));
    })
  }, [assetsInfo, currentPageNo, tokenStatus])

  useEffect(() => {
    if (curAssetInfo == null) return;

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
    const content = `🔥🔥 MEMECOIN SEASON 🔥🔥 \n\nFair314 is a brand-new memecoin launch platform that inherits the strengths of INSCRIPTION🔯 and the X314 protocol📜. \n\nBoth launchers and traders will receive incentives. \n\nCome on!🚀🚀🚀 \n\n👉 https://fair314.xyz?ref=${myRefCode}`;
    const retweetLink = `https://twitter.com/intent/tweet?text=${encodeURI(content)}`; 
    window.open(retweetLink, '_tab');
  }

  const launchToken = async () => {
    console.log(assetName, minMints, maxMints, mintPeroid, launcherAddr);

    setStartIssuing(true);
    //console.log(config, address, blastContractAddr, deployContractAddr)
    if (paidToken != null) {
      readContract(config, {
        address: paidToken.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, deployContractAddr]
      }).then(async (result) => { 
        const approvedAmount = new BigNumber(result);
        let approveResult = true;
        if (approvedAmount.isLessThan(feePerLaunch)) {
          approveResult = await executeTx({
            account: address,
            address: paidToken.address,
            abi: erc20Abi,
            functionName: 'approve',
            args: [deployContractAddr, '0x' + feePerLaunch.toString(16)],
          }, "Approved successfully", "Fail to approve");    
        }
        if (approveResult) {
          const launchResult = await executeTx({
            account: address,
            address: deployContractAddr,
            abi: DeployFactory.abi,
            functionName: 'launchToken',
            args: [assetName, minMints, maxMints, mintPeroid, launcherAddr],
          }, "Launch token successfully", "Fail to launch token");
          if (launchResult) {
            setUpdateAssets(!updateAssets);
            setUpdatePoints(!updatePoints);
            onClose();
          }
        }
        setStartIssuing(false);
      })
    } else {
      const launchResult = await executeTx({
        account: address,
        address: deployContractAddr,
        abi: DeployFactory.abi,
        functionName: 'launchToken',
        args: [assetName, minMints, maxMints, mintPeroid, launcherAddr],
        value: '0x' + feePerLaunch.toString(16)
      }, "Launch token successfully", "Fail to launch token");
      if (launchResult) {
        setUpdateAssets(!updateAssets);
        setUpdatePoints(!updatePoints);
        onClose();
      }
      setStartIssuing(false);
    }
  }

  const mint = () => {
    setStartMinting(true);
    let mintCount = 0;
    for (let i = 0; i < repeatTxs; i++) {
      sendTransaction(config, {
        to: curAssetInfo.fair314,
        value: '0x' + mintFee.toString(16),
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
        description:`You have no ${mintTokenSymbol} to refund.`,
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

  const claimBlast = async () => {
    await executeTx({
      account: address,
      address: ClaimBlast.address[chainId],
      abi: ClaimBlast.abi,
      functionName: 'claim',
      args: [],
    }, "Claim Blast on testnet successfully", "Fail to claim Blast on testnet");  
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

  const handleSearch = (event) => {
    setSearchKeyword(event.target.value);
  };

  return (
    <Box className={`${styles.page} flex-col`}>
      {/* <Box className={`${styles['section_1']} flex-col align-center`}> */}
        {/* <Box className={`${styles['platform_title']}`}>   
        Fair314 Meme Coins launch Platform     
        </Box> */}
        <Box className={`${styles['box_12']} flex-col align-center`}>                                       
          <Box className={`${styles['tokens_activity']}`}>
            <span className={`${styles['text_43']}`}>Assets</span> 
            <RadioGroup className={`${styles['select_status']}`} onChange={setTokenStatus} value={tokenStatus}>
              <Box className={`${styles['status_radio_group']}`}>
                <Radio value='1'><Box className={`${styles['mint_status']}`}>In Minting</Box></Radio>
                <Radio value='2'><Box className={`${styles['mint_status']}`}>Launch Successful</Box></Radio>
                <Radio value='0'><Box className={`${styles['mint_status']}`}>Launch Failed</Box></Radio>
              </Box>
            </RadioGroup>  
          </Box>
          {
            tokenStatus == '1' && 
            <Box className={`${styles['mint_toolip']} flex-col justify-start`}>
              <span className={`${styles['text_44']}`}>
              Each minting costs {mintFee.shiftedBy(-18).toString()} {mintTokenSymbol}. If the launch is successful, all minting fees will be used to provide liquidity, otherwise, refunded.
              </span>        
            </Box>
          }
          <Box className={`${styles['search_line']} flex-col justify-start`}>
            <Box className={styles.searchContainer}>
              <InputGroup>
                <InputLeftElement pointerEvents='none'>
                  <SearchIcon color='gray.300' />
                </InputLeftElement>
                <Input
                  placeholder='Search tokens'
                  value={searchKeyword}
                  onChange={handleSearch}
                  className={styles.searchInput}
                />
              </InputGroup>
          </Box>
          </Box>          
          {
            tokenStatus == '1' && 
            <TableContainer className={`${styles['group_12']} flex-col align-center`}>
              <Table variant={isMobile ? "unstyled" : "simple"}>
                {filteredAssets.length == 0 && <TableCaption>No Data</TableCaption>}
                <Thead>
                  <Tr>
                    <Th className={`${styles['none_mobile']}`}>Name</Th>
                    <Th className={`${styles['none_mobile']}`}>Contract</Th>
                    <Th className={`${styles['none_mobile']}`}>Launcher</Th>
                    <Th className={`${styles['none_mobile']}`}>End Time</Th>
                    <Th className={`${styles['none_mobile']}`}>Min ~ Max Mints </Th>
                    <Th className={`${styles['none_mobile']}`}>Minted</Th>
                    <Th className={`${styles['none_mobile']}`}>Your Mints</Th>
                    <Th className={`${styles['none_mobile']}`}>Total Supply</Th>
                    <Th className={`${styles['none_mobile']}`}></Th>
                  </Tr>
                </Thead>
                <Tbody className={`${styles['form_content']}`}>
                {
                filteredAssets.length > 0 && 
                  filteredAssets.filter(assetInfo => assetInfo.status == 1).slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize).map(assetInfo => (
                    <Tr>
                      <Td className={`${styles['none_mobile']}`} style={{color: 'whitesmoke', fontFamily: "Fugaz One"}}>
                      {assetInfo.name}
                      </Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.fair314, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.launcher, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatTimeWithoutYear(assetInfo.endTime * 1000)}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.minMints} ~ {assetInfo.maxMints}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{tokensCurrentMints[assetInfo.fair314]}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.yourMintAmount}</Td>
                      <Td className={`${styles['none_mobile']}`}>{new BigNumber(assetInfo.totalSupply).shiftedBy(-18).toString()}</Td>
                      <Td className={`${styles['none_mobile']}`}>
                        <Button className={`${styles['mint_btn']}`} 
                            onClick={() => openMintDialog(assetInfo)}>Mint</Button> 
                      </Td>

                      <Td className={`${styles['only_mobile']}`}>
                        <AssetCard
                          key={assetInfo.fair314}
                          assetInfo={assetInfo}
                          tokenStatus={tokenStatus}
                          mintTokenSymbol={mintTokenSymbol}
                          tokensCurrentMints={tokensCurrentMints}
                          onMint={openMintDialog}
                        />
                      </Td>
                    </Tr>
                  )) 
                }
                </Tbody>
              </Table>
            </TableContainer>
          }
          {
            (tokenStatus == '2' || tokenStatus == '3') && 
            <TableContainer className={`${styles['group_12']} flex-col align-center`}>
              <Table variant={isMobile ? "unstyled" : "simple"}>
                {filteredAssets.length == 0 && <TableCaption>No Data</TableCaption>}
                <Thead>
                  <Tr>
                    <Th className={`${styles['none_mobile']}`}>Name</Th>
                    <Th className={`${styles['none_mobile']}`}>Contract</Th>
                    <Th className={`${styles['none_mobile']}`}>Launcher</Th>
                    <Th className={`${styles['none_mobile']}`}>Minted</Th>
                    <Th className={`${styles['none_mobile']}`}>Your Mints</Th>
                    <Th className={`${styles['none_mobile']}`}>Total Supply</Th>
                    <Th className={`${styles['none_mobile']}`}>Volume(E)</Th>
                    <Th className={`${styles['none_mobile']}`}>Price(E)</Th>
                    <Th className={`${styles['none_mobile']}`}></Th>
                  </Tr>
                </Thead>
                <Tbody className={`${styles['form_content']}`}>
                {
                filteredAssets.length > 0 && 
                  filteredAssets.filter(assetInfo => assetInfo.status == 2 || assetInfo.status == 3).slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize).map(assetInfo => (
                    <Tr>
                      <Td className={`${styles['none_mobile']}`} style={{color: 'whitesmoke', fontFamily: "Fugaz One"}}>
                      {assetInfo.name}
                      </Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.fair314, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.launcher, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{tokensCurrentMints[assetInfo.fair314]}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.yourMintAmount}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{new BigNumber(assetInfo.totalSupply).shiftedBy(-18).toString()}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{new BigNumber(tokensTotalVolume[assetInfo.fair314]).shiftedBy(-18).toFixed(3)}</Td>
                      <Td className={`${styles['none_mobile']}`}>{displayReadableNumber(tokenPrices[assetInfo.fair314])}</Td>
                      <Td className={`${styles['none_mobile']}`}>
                      {                          
                          assetInfo.status == 2 ?
                            <Tooltip label={"Claim can only be made after the end time."}>
                              <Box disabled={true} variant='outline' style={{color: 'whitesmoke', fontFamily: "Fugaz One"}} >
                                Wait to Claim</Box> 
                            </Tooltip>
                            :
                            assetInfo.yourMintAmount > 0 ?
                              <Tooltip label={"The token minted can only become a tradable ERC20 after being claimed."}>
                                <Button className={`${styles['mint_btn']}`} 
                                  onClick={() => claim(assetInfo)}
                                  isLoading={isClaiming} 
                                  loadingText="Claiming">Claim</Button>
                              </Tooltip> 
                              :
                              <Button className={`${styles['mint_btn']}`} onClick={() => { router.push(`/asset/${assetInfo.fair314}`)}}>Trade</Button> 
                        }
                      </Td>
                      
                      <Td className={`${styles['only_mobile']}`}>
                        <AssetCard
                          key={assetInfo.fair314}
                          assetInfo={assetInfo}
                          tokenStatus={tokenStatus}
                          mintTokenSymbol={mintTokenSymbol}
                          tokensCurrentMints={tokensCurrentMints}
                          tokensTotalVolume={tokensTotalVolume}
                          tokenPrices={tokenPrices}
                          onClaim={claim}
                          onTrade={(assetInfo) => router.push(`/asset/${assetInfo.fair314}`)}
                          isClaiming={isClaiming}
                          displayReadableNumber={displayReadableNumber}
                        />
                      </Td>
                    </Tr>
                  )) 
                }
                </Tbody>
              </Table>
            </TableContainer>
          }
          {
            tokenStatus == '0' && 
            <TableContainer className={`${styles['group_12']} flex-col align-center`}>
              <Table variant={isMobile ? "unstyled" : "simple"}>
                {filteredAssets.length == 0 && <TableCaption>No Data</TableCaption>}
                <Thead>
                  <Tr>
                    <Th className={`${styles['none_mobile']}`}>Name</Th>
                    <Th className={`${styles['none_mobile']}`}>Contract</Th>
                    <Th className={`${styles['none_mobile']}`}>Launcher</Th>
                    <Th className={`${styles['none_mobile']}`}>Min Mints</Th>
                    <Th className={`${styles['none_mobile']}`}>Max Mints</Th>
                    <Th className={`${styles['none_mobile']}`}>Minted</Th>
                    <Th className={`${styles['none_mobile']}`}>Your Mints</Th>
                    <Th className={`${styles['none_mobile']}`}>Total Supply</Th>
                    <Th className={`${styles['none_mobile']}`}></Th>
                  </Tr>
                </Thead>
                <Tbody className={`${styles['form_content']}`}>
                {
                filteredAssets.length > 0 && 
                  filteredAssets.filter(assetInfo => assetInfo.status == 0).slice(pageSize * (currentPageNo - 1), pageSize * (currentPageNo - 1) + pageSize).map(assetInfo => (
                    <Tr>
                      <Td className={`${styles['none_mobile']}`} style={{color: 'whitesmoke', fontFamily: "Fugaz One"}}>
                      {assetInfo.name}
                      </Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.fair314, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: assetInfo.launcher, len: 4})}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.minMints}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.maxMints}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{tokensCurrentMints[assetInfo.fair314]}</Td>
                      <Td className={`${styles['none_mobile']}`} style={{color: '#04E7FE'}}>{assetInfo.yourMintAmount}</Td>
                      <Td className={`${styles['none_mobile']}`}>{new BigNumber(assetInfo.totalSupply).shiftedBy(-18).toString()}</Td>                      
                      <Td className={`${styles['none_mobile']}`}>
                        {
                          assetInfo.yourMintAmount > 0 &&
                          <Tooltip label={"The launch has been failed, and you can refund all of your minting fee."}>
                            <Button className={`${styles['mint_btn']}`} 
                              onClick={() => refund(assetInfo)}
                              isLoading={isRefunding} 
                              loadingText="Refunding">Refund</Button> 
                          </Tooltip>
                        }
                      </Td>
                      <Td className={`${styles['only_mobile']}`}>
                        <AssetCard
                          key={assetInfo.fair314}
                          assetInfo={assetInfo}
                          tokenStatus={tokenStatus}
                          mintTokenSymbol={mintTokenSymbol}
                          tokensCurrentMints={tokensCurrentMints}
                          onRefund={refund}
                          isRefunding={isRefunding}
                        />
                      </Td>
                    </Tr>
                  )) 
                }
                </Tbody>
              </Table>
            </TableContainer>
          }
          {
            curStatusAssetNum > pageSize              
            && 
            <Box className={`${styles['box_15']} flex-row justify-center align-center`}>
                <span className={`${styles['text_95']}`}>Page {currentPageNo} of {Math.ceil(curStatusAssetNum / pageSize)}</span>
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
                  onClick={() => setCurrentPageNo(currentPageNo < Math.ceil(curStatusAssetNum / pageSize) ? currentPageNo + 1 : Math.ceil(curStatusAssetNum / pageSize))}>
                  <Image
                    className={`${styles['thumbnail_4']}`}
                    src={
                      require('assets/img/psccza0brbhkdc6eyemor0vgreltwniggrbf3f6e856-1514-45cf-80f8-6ddcf2f0a9cc.png')
                    }
                  />
                </Box>
                <Box className={`${styles['image-wrapper_4']} flex-row`} onClick={() => setCurrentPageNo(Math.ceil(curStatusAssetNum / pageSize))}>
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
        </Box>
      {/* </Box> */}
      
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={`${styles['modal_layout']}`}
      >
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader className={`${styles['modal_head']}`}>
            Launch Token<span style={{fontSize: '12px'}}>({`${feePerLaunch.shiftedBy(-18).toString()} ${paidToken?.symbol} / Launch`})</span>
          </ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel className={`${styles['form_content']}`}>Asset name</FormLabel>
              <Input className={`${styles['form_content']}`} value={assetName} onChange={(e) => updateAssetName(e.target.value)}/>
              <FormLabel className={`${styles['form_tip']}`}>
                Length 4 ~ 12, characters composed of A~Z0~9.
                <Box className={`${styles['form_tip']}`}>Assets with a name length of 3 will be open in the future.</Box>
              </FormLabel>
              
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Minimum Mints</FormLabel>              
              <NumberInput className={`${styles['form_content']}`} step={1000} onChange={(v) => setMinMints(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper className={`${styles['form_content']}`}/>
                  <NumberDecrementStepper className={`${styles['form_content']}`}/>
                </NumberInputStepper>
              </NumberInput>
              <FormLabel className={`${styles['form_tip']}`}>The lower limit of successful asset launch.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Maximum Mints</FormLabel>             
              <NumberInput className={`${styles['form_content']}`} step={1000} onChange={(v) => setMaxMints(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper className={`${styles['form_content']}`}/>
                  <NumberDecrementStepper className={`${styles['form_content']}`}/>
                </NumberInputStepper>
              </NumberInput>
              <FormLabel className={`${styles['form_tip']}`}>The upper limit of successful asset launch.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Mintable Peroid (days)</FormLabel>             
              <NumberInput className={`${styles['form_content']}`} step={1} onChange={(v) => setMintPeroid(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper className={`${styles['form_content']}`}/>
                  <NumberDecrementStepper className={`${styles['form_content']}`}/>
                </NumberInputStepper>
              </NumberInput>
              <FormLabel className={`${styles['form_tip']}`}>Only after it expires, tokens can be claimed and traded.</FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['launch_tooltip']}`}>
              👉 Each mint consumes {mintFee.shiftedBy(-18).toString()} {mintTokenSymbol} and receives 1000 Tokens.
              </FormLabel>
              <FormLabel className={`${styles['launch_tooltip']}`}>
              👉 The entire launch process will automatically end after {mintPeroid} days or when the total number of mints reaches the maximum limit.
              </FormLabel>
              <FormLabel className={`${styles['launch_tooltip']}`}>
              👉 If the minimum mints are not reached after {mintPeroid} days, the launch will fail, and minters can claim all ETH consumed when minting.
              </FormLabel>
              <FormLabel className={`${styles['launch_tooltip']}`}>
              👉 Once the launch is successful, the Token contract will automatically generate liquidity for users to trade, with the number of Tokens being equal to the number of tokens minted and the amount of ETH being the sum of all minting fees.
              </FormLabel>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button className={`${styles['mint_btn']}`} 
                    mr={3} 
                    onClick={() => launchToken()}
                    isLoading={startIssuing} 
                    loadingText="Launching">
              Launch
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
              <FormLabel className={`${styles['form_content']}`}>Repeat Transactions</FormLabel>              
              <NumberInput className={`${styles['form_content']}`} min={1} step={1} onChange={(v) => setRepeatTxs(v)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper className={`${styles['form_content']}`}/>
                  <NumberDecrementStepper className={`${styles['form_content']}`}/>
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button className={`${styles['mint_btn']}`} 
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
          <ModalHeader className={`${styles['modal_head']}`}>Set Inviter</ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel className={`${styles['form_content']}`}>Inviter Code</FormLabel>              
              <Input className={`${styles['form_content']}`} value={referrerCode} onChange={(e) => setReferrerCode(e.target.value)}/>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Button className={`${styles['mint_btn']}`} 
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