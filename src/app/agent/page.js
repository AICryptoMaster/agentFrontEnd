'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Textarea,
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
import DeployFactory from '@/contracts/deployFactory.json';
import Points from '@/contracts/points.json';
import Fair314 from '@/contracts/fair314.json';
import BigNumber from 'bignumber.js';
import { MulticallAddress, ZeroAddress } from 'globalConfig';

export default function Page() {  
  const account = useAccount();
  const chainId = useChainId({config})
  const [ address, setAddress ] = useState(account?.address);
  const [connector, setConnector ] = useState(null);
  const [agentName, setAgentName] = useState('');
  const [agentInfo, setAgentInfo] = useState('');
  const [downlink, setDownlink] = useState('');
  const [hashValue, setHashValue] = useState("");
  const [maxMints, setMaxMints] = useState(0);
  const [mintPeroid, setMintPeroid] = useState(0);
  const [userBasePoints, setUserBasePoints] = useState(0);
  const [userL1Points, setUserL1Points] = useState(0);
  const [userL2Points, setUserL2Points] = useState(0);
  const [totalBasePoints, setTotalBasePoints] = useState(0);
  const [totalL1Points, setTotalL1Points] = useState(0);
  const [totalL2Points, setTotalL2Points] = useState(0);
  const [launcherAddr, setLauncherAddr] = useState(account ? account.address : '');
  const [startLaunching, setStartLaunching] = useState(false);
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

  const [paidToken, setPaidToken] = useState({
    symbol: 'ETH'
  })
  const [feePerLaunch, setFeePerLaunch] = useState(new BigNumber(0))
  const [mintFee, setMintFee] = useState(new BigNumber('0.0001').shiftedBy(18));  // eth
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

  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  //console.log('#######', account, address)
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 800); // 你可以根据需要调整这个断点
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  React.useEffect(() => {
    // The first asset launch platform that combines smart inscription with x314, achieving ultimate fairness and efficiency.
    const typed1 = new Typed(phase1.current, {
      strings: [`Agent ⚔️ Agent\nAgent = Soulbound NFT\nMeme Coin Launched with Agent`],
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

  const updateAgentName = (name) => {
    if (name.length > 12 || (!/^[a-zA-Z0-9]+$/.test(name) && name.length > 0)) return;

    setAgentName(name.toUpperCase());
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
    console.log(agentName, minMints, maxMints, mintPeroid, launcherAddr);

    setStartLaunching(true);
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
            args: [agentName, minMints, maxMints, mintPeroid, launcherAddr],
          }, "Launch token successfully", "Fail to launch token");
          if (launchResult) {
            setUpdateAssets(!updateAssets);
            setUpdatePoints(!updatePoints);
            onClose();
          }
        }
        setStartLaunching(false);
      })
    } else {
      const launchResult = await executeTx({
        account: address,
        address: deployContractAddr,
        abi: DeployFactory.abi,
        functionName: 'launchToken',
        args: [agentName, minMints, maxMints, mintPeroid, launcherAddr],
        value: '0x' + feePerLaunch.toString(16)
      }, "Launch token successfully", "Fail to launch token");
      if (launchResult) {
        setUpdateAssets(!updateAssets);
        setUpdatePoints(!updatePoints);
        onClose();
      }
      setStartLaunching(false);
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

  const calculateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const uploadToServer = async (file, fileType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch('/api/fileUpload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: error.message,
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return null;
    }
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }

      // 验证文件大小 (例如限制为 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size should be less than 2MB',
          status: 'error',
          position: 'bottom-right',
          isClosable: true,
        });
        return;
      }

      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // 上传到服务器
      const logoUrl = await uploadToServer(file, 'logo');
      if (logoUrl) {
        // 存储 logo URL 到状态中（如果需要）
        setLogoUrl(logoUrl);
      }
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      const hash = await calculateFileHash(file);
      setHashValue(hash);
      
      // 读取文件内容
      const reader = new FileReader();
      reader.onload = (e) => {
        setAgentInfo(e.target.result);
      };
      reader.readAsText(file);

      // 上传到服务器
      const fileUrl = await uploadToServer(file, 'content');
      if (fileUrl) {
        // 存储文件 URL 到状态中（如果需要）
        setFileUrl(fileUrl);
      }
    }
  };

  return (
    <Box className={`${styles.page} flex-col`}>
      {/* <Box className={`${styles['section_1']} flex-col align-center`}> */}
        {/* <Box className={`${styles['platform_title']}`}>   
        Fair314 Meme Coins launch Platform     
        </Box> */}
        <Box className={`${styles['box_12']} flex-col align-center`}>                  
          <Box className={`${styles['box_13']} flex-col align-center`}>
            <Box className={`flex-row`}>
              <Box className={`${styles['text_wrapper_1']} flex-col justify-center align-center`} onClick={onOpen}>
                <span className={`${styles['text_5']}`} onClick={onOpen}>Launch Agent</span>
              </Box>
            </Box>
            {
              chainId == 168587773 && <Button variant='link' onClick={claimBlast}>Claim Blast on testnet</Button>
            }
            <Box ref={phase1} className={`${styles['platform_desc']} flex-col align-center`}>        
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
                  <Box className={`flex-col align-center`} style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
                    <span className={`${styles['deploy_desc']}`}>
                      <b>👉 Cost of Each Launch: </b>{feePerLaunch.shiftedBy(-18).toString()} {paidToken?.symbol} / Launch
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Each Launch: </b>will build an Agent in the form of a Soulbound NFT
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 Each Launch: </b>will also issue a Meme Coin with a total supply of 100 million tokens
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 How to get an Agent? </b> 
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ Requires payment of 10,000 Meme Coins for each Agent.
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ 15% of the cost fee goes to the Launcher, 5% goes to the platform, and 80% is burned.
                    </span>
                    <span className={`${styles['deploy_desc']}`} style={{marginTop: '0px'}}>
                      <b>👉 How to get Meme Coins? </b> 
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ Each mint will consume 0.0005 {mintTokenSymbol}.
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ After a Meme Coin is launched with an Agent, users can mint Meme Coins by sending specified transactions to the contract.
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ One mint gets you 1000 Meme Coins. The mint period is 3 days, after which minting is no longer possible.
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ When the total number of mints reaches 50,000, no more minting is allowed, and the contract will automatically form an LP with all collected mint fees and remaining Meme Coins, which will be added to Uniswap V3 pool. The LP will then be burned.
                    </span>
                    <span className={`${styles['deploy_desc_detail']}`} style={{marginTop: '0px'}}>
                      ℹ️ When the total number of mints don't reach 50,000, each user can claim back all mint fees
                    </span>                    
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
                                      

          <Box className={`${styles['tokens_activity']}`}>
            <Box className={`${styles['text_43']}`}>Agents</Box> 
            
            <Box className={styles.searchContainer}>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <SearchIcon color='gray.300' />
                  </InputLeftElement>
                  <Input
                    placeholder='Search Agents'
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
                    <Th className={`${styles['none_mobile']}`}>Version</Th>
                    <Th className={`${styles['none_mobile']}`}>Launch Time</Th>
                    <Th className={`${styles['none_mobile']}`}>Owner</Th>
                    <Th className={`${styles['none_mobile']}`}>Total Minted</Th>
                    <Th className={`${styles['none_mobile']}`}>Your Mints</Th>
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
            Launch Agent<span style={{fontSize: '12px'}}>({`${feePerLaunch.shiftedBy(-18).toString()} ${paidToken?.symbol} / Launch`})</span>
          </ModalHeader>
          <ModalBody pb={6} style={{background: 'rgb(20, 20, 20)'}}>
            <FormControl>
              <FormLabel className={`${styles['form_content']}`}>Agent name</FormLabel>
              <Input className={`${styles['form_content']}`} value={agentName} onChange={(e) => updateAgentName(e.target.value)}/>
              <FormLabel className={`${styles['form_tip']}`}>
                Length 3 ~ 18, characters composed of A~Z0~9. Token uses the same name.
              </FormLabel>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Agent File</FormLabel>              
              <Box className={`${styles['agent_file']} flex-col justify-center align-center`} onClick={() => handleFileChange()}>
                <span className={`${styles['text_agent_file']}`}>
                  Upload Agent File
                </span>
              </Box>
              {selectedFileName && (
                <>
                  <FormLabel className={`${styles['form_tip']}`}>
                    File: {selectedFileName}
                  </FormLabel>
                  <FormLabel className={`${styles['form_tip']}`}>
                    Hash: {hashValue}
                  </FormLabel>
                </>
              )}
            </FormControl>


            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Agent Logo</FormLabel>              
              <Box className={`${styles['agent_file']} flex-col justify-center align-center`} onClick={() => handleLogoChange()}>
                <span className={`${styles['text_agent_file']}`}>Upload Agent Logo</span>
              </Box>
              {
                logoPreview &&
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={200}
                    height={200}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      marginTop: '10px'
                    }}
                  />
              }
            </FormControl>

            <FormControl mt={4}>
              <FormLabel className={`${styles['form_content']}`}>Description</FormLabel>             
              <Textarea 
                className={`${styles['form_content']}`} 
                value={agentInfo} 
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setAgentInfo(e.target.value)
                  }
                }}
                placeholder="Enter description (max 100 characters)"
                maxLength={100}
              />
              <FormLabel className={`${styles['form_tip']}`}>
                {agentInfo.length}/100 characters
              </FormLabel>
            </FormControl>
          </ModalBody>

          <ModalFooter style={{background: 'rgb(20, 20, 20)'}}>
            <Box className={`${styles['launch_btn']} flex-col justify-center align-center`} onClick={onOpen}>
              <span className={`${styles['text_agent_file']}`} onClick={() => launchToken()}>{startLaunching ? "Launching" : "Launch"}</span>
            </Box>

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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="*.*"
      />

      <input
        type="file"
        ref={logoInputRef}
        style={{ display: 'none' }}
        onChange={handleLogoChange}
        accept="image/*"
      />
    </Box>
  );
}