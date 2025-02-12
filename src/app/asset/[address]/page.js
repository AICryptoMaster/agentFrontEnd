'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import Link from 'next/link'

import styles from './page.module.css';

import {
  Input,
  Button,
  useToast,
  Tooltip,
  Box,
  Checkbox,
  Text
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
import { ExternalLinkIcon, ArrowDownIcon } from '@chakra-ui/icons'
import { config } from 'wagmiConfig';
import { useAccount, usePublicClient } from 'wagmi';
import { readContract, watchContractEvent, getBalance } from '@wagmi/core'
import { writeContract, waitForTransactionReceipt, sendTransaction, multicall, getBlockNumber, getToken } from '@wagmi/core';
import { parseEther, isAddressEqual } from 'viem';
import { displayReadableNumber, goToTx } from 'utils/tool';
import { formatTimeWithoutYear } from 'utils/dateFormartter';
import { formatAddress } from 'utils/addressFormatter';
import Fair314 from 'contracts/fair314.json';
import BigNumber from 'bignumber.js';
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { usePathname } from 'next/navigation';
import { syncTrades } from './syncTrade';
import { generateChartDataWithPeroid } from './tradeProcess';
import moment from 'moment';

export default function Page() {

  const { address, chainId } = useAccount({config});
  const [assetName, setAssetName] = useState('');
  const [token, setToken] = useState(null)
  const [fair314ContractAddr, setFair314ContractAddr] = useState('')
  const [curDate, setCurDate] = useState("Now")
  const [openPrice, setOpenPrice] = useState("0")
  const [highPrice, setHighPrice] = useState("0")
  const [lowPrice, setLowPrice] = useState("0")
  const [closePrice, setClosePrice] = useState("0")
  const [volume, setVolume] = useState("0")
  const [tradeChart, setTradeChart] = useState(null)

  const [totalVolume, setTotalVolume] = useState(new BigNumber(0));
  const [volume7D, setVolume7D] = useState(new BigNumber(0));
  const [volume24H, setVolume24H] = useState(new BigNumber(0));
  const [curBlockNumber, setCurBlockNumber] = useState(0);
  const [toBlockNumber, setToBlockNumber] = useState(0);
  const [tradeData, setTradeData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [newTradeData, setNewTradeData] = useState([]);
  const [tradeTimespan, setTradeTimespan] = useState(3600);
  const [isBuy, setIsBuy] = useState(true)
  const [allTransactions, setAllTransactions] = useState([])
  const [myTransactions, setMyTransactions] = useState([])
  const [curDisplayedTxs, setCurDisplayedTxs] = useState([])
  const [curTradeRanking, setCurTradeRanking] = useState([])
  const [roundWinnersInfo, setRoundWinnersInfo] = useState([])
  const [ethBalance, setEthBalance] = useState(new BigNumber(0))
  const [fair314Balance, setFair314Balance] = useState(new BigNumber(0))
  const [amountIn, setAmountIn] = useState(0)
  const [amountOut, setAmountOut] = useState(0)
  const [fair314Reserve, setFair314Reserve] = useState(new BigNumber(0))
  const [ethReserve, setEthReserve] = useState(new BigNumber(0))
  const [tokenPrice, setTokenPrice] = useState(new BigNumber(0))
  const [newTradeUpdate, setNewTradeUpdate] = useState(false)
  const [isSwaping, setIsSwaping] = useState(false)
  const [showMyTxs, setShowMyTxs] = useState(false)
  const [isCurrentRound, setIsCurrentRound] = useState(true)
  const [tradeStartTime, setTradeStartTime] = useState(0)
  const [roundFee2Winner, setRoundFee2Winner] = useState({})

  const [previousPrice, setPreviousPrice] = useState(new BigNumber(0));
  const [priceChangePercentage, setPriceChangePercentage] = useState(null);

  const pageSize = 10;

  const phase1 = React.useRef(null);
  const toast = useToast();
  const pathname = usePathname();
  const multicallAddress = '0xca11bde05977b3631167028862be2a173976ca11';
  const oneDay = 3600 * 24;
  const red = "#EF5350"
  const green = "#26A69A"
  const baseColor = 'rgba(2, 229, 254, 0.8)'

  const publicClient = usePublicClient()

  useEffect(() => {
    const address = pathname.split('/')[2];
    //console.log('address', address)
    setFair314ContractAddr(address);
    
    publicClient.getBlockNumber().then(result => {
      setCurBlockNumber(Number(result));
    })
  }, [])

  const getPriceInfo = async () => {
    if (!config || !fair314ContractAddr) return;
  
    try {
      const priceInfo = await readContract(config, {
        address: fair314ContractAddr,
        abi: Fair314.abi,
        functionName: 'priceInfo',
      });
  
      const ethAmount = new BigNumber(priceInfo.ethAmount.toString());
      const tokenAmount = new BigNumber(priceInfo.tokenAmount.toString());
      
      const price = tokenAmount.eq(0) ? new BigNumber(0) : ethAmount.dividedBy(tokenAmount);
      
      return price;
    } catch (error) {
      console.error('Error fetching price info:', error);
      return null;
    }
  };

  useEffect(() => {
    if (config == null || fair314ContractAddr == '') return;

    getPriceInfo().then(price => {
      if (price) {
        setPreviousPrice(price);
      }
    });
  }, [config, fair314ContractAddr])

  useEffect(() => {
    if (previousPrice.eq(0) || tokenPrice == null) return;

    const percentage = tokenPrice.minus(previousPrice).dividedBy(previousPrice).times(100);
    setPriceChangePercentage(percentage);
  }, [previousPrice, tokenPrice])

  useEffect(() => {
    if (config == null || fair314ContractAddr == '' || address == null) return;

    getBalance(config, {
      address
    }).then(balance => setEthBalance(new BigNumber(Number(balance.value))));

    readContract(config, {
      address: fair314ContractAddr,
      abi: Fair314.abi,
      functionName: 'balanceOf',
      args: [address]
    }).then(balance => setFair314Balance(new BigNumber(Number(balance))));
  }, [config, fair314ContractAddr, address])


  useEffect(() => {
    if (fair314ContractAddr == '' || curBlockNumber == 0) return;

    readContract(config, {
      address: fair314ContractAddr,
      abi: Fair314.abi,
      functionName: 'endTime',
      args: []
    }).then(result => {
      const tradeStartTime = Number(result);
      setTradeStartTime(tradeStartTime);
      syncTrades(publicClient, fair314ContractAddr, tradeStartTime, curBlockNumber).then(trades => {
        setTradeData(trades);
      })
    })
  }, [fair314ContractAddr, curBlockNumber])

  useEffect(() => {
    if (config == null || fair314ContractAddr == '') return;

    watchContractEvent(config, {
      address: fair314ContractAddr,
      abi: Fair314.abi,
      eventName: 'Trade',
      chainId,
      onLogs(logs) {
        const tradeLogs = [];
        logs.forEach((log) => {
          tradeLogs.push({
            trader: log.args.trader,
            bSell: log.args.bSell,
            inAmount: '0x' + new BigNumber(log.args.inAmount).toString(16),
            outAmount: '0x' + new BigNumber(log.args.outAmount).toString(16),
            time: Number(log.args.timestamp) * 1000,
            txHash: log.transactionHash
          })
        });
        setNewTradeData(tradeLogs);
        if (tradeLogs.length > 0) setNewTradeUpdate(!newTradeUpdate);
      },
    })
  }, [config, fair314ContractAddr])

  useEffect(() => {
    if (tradeData.length == 0) return;

    const curTime = Math.floor(new Date().getTime() / 1000)
    const curRoundStartTime = curTime - (curTime - tradeStartTime) % oneDay;
    const curRoundTraderInfo = {}
    for (let i = tradeData.length - 1; i >= 0; i--) {
      if (tradeData[i].time / 1000 < curRoundStartTime) break;

      if (!tradeData[i].bSell) {
        if (curRoundTraderInfo[tradeData[i].trader] == null) {
          curRoundTraderInfo[tradeData[i].trader] = new BigNumber(tradeData[i].inAmount);
        } else {
          curRoundTraderInfo[tradeData[i].trader] = curRoundTraderInfo[tradeData[i].trader].plus(new BigNumber(tradeData[i].inAmount));
        }
      }
    }

    const curRound = Math.floor((curTime - tradeStartTime) / oneDay)
    const curRanking = Object.entries(curRoundTraderInfo).sort((a, b) => b[1].minus(a[1]).toNumber());
    setCurTradeRanking(curRanking);
    console.log('round cur ranking', curRanking)

    const roundFee2WinnerUpdated = {}
    for (let i = tradeData.length - 1; i >= 0; i--) {
      const tradeInfo = tradeData[i];
      if (tradeInfo.bSell) continue;

      const tradeTime = Math.floor(tradeInfo.time / 1000);
      const tradeRound = Math.floor((tradeTime - tradeStartTime) / oneDay);
      if (roundFee2Winner[tradeRound] != null && tradeRound < curRound - 1) break;

      const fee2Winner = new BigNumber(tradeInfo.inAmount).multipliedBy(0.0015);
      if (roundFee2WinnerUpdated[tradeRound] == null) {
        roundFee2WinnerUpdated[tradeRound] = fee2Winner;
      } else {
        roundFee2WinnerUpdated[tradeRound] = roundFee2WinnerUpdated[tradeRound].plus(fee2Winner);
      }
    }
    console.log('round Fee2Winner plus', roundFee2WinnerUpdated)
    Object.keys(roundFee2WinnerUpdated).map(tradeRound => {
      roundFee2Winner[tradeRound] = roundFee2WinnerUpdated[tradeRound];
    })

    const startRound = (curRound - 30 >= 0) ? (curRound - 30) : 0;
    let contracts = []
    for (let i = startRound; i < curRound; i++) {
      contracts.push({
        address: fair314ContractAddr,
        abi: Fair314.abi,
        functionName: 'roundWinner',
        args: [i],
      })
    }

    const roundWinner = {}
    const validRoundList = []
    multicall(config, {
      contracts,
      multicallAddress, 
    }).then(winners => {
      winners.forEach((winner, index) => {
        if (isAddressEqual(winner.result, "0x0000000000000000000000000000000000000000")) return;

        roundWinner[startRound + index] = {winner: winner.result}
        validRoundList.push(startRound + index);
      });
      //console.log('round Winner 1', JSON.stringify(roundWinner), validRoundList);

      contracts = [];
      Object.entries(roundWinner).forEach(entry => contracts.push({
        address: fair314ContractAddr,
        abi: Fair314.abi,
        functionName: 'roundUserVolume',
        args: [entry[0], entry[1].winner],
      }))
      multicall(config, {
        contracts,
        multicallAddress, 
      }).then(results => {
        console.log('round', results)
        results.forEach((volume, index) => {
          roundWinner[validRoundList[index]] = {
            ...roundWinner[validRoundList[index]], 
            volume: new BigNumber(volume.result),
            feeEarned: roundFee2Winner[validRoundList[index] + 1] ? roundFee2Winner[validRoundList[index] + 1] : new BigNumber(0)
          }    
        });        
        // console.log('round Winner 2', roundWinner);
        const roundWinnersInfo = Object.keys(roundWinner).map(round => {
          const startTime = moment(new Date((tradeStartTime + round * oneDay) * 1000)).format('YYYY-MM-DD HH:mm:ss');
          const endTime = moment(new Date((tradeStartTime + (parseInt(round) + 1) * oneDay - 1) * 1000)).format('YYYY-MM-DD HH:mm:ss');
          return {
            round,
            startTime,
            endTime,
            ...roundWinner[round]
          }
        })
        // console.log('round Winner 3', roundWinnersInfo);
        setRoundWinnersInfo(roundWinnersInfo);
      })
    })
  }, [tradeData])

  useEffect(() => {
    if (newTradeData.length > 0) {
      setTradeData([...tradeData, ...newTradeData]);
    }
  }, [newTradeData])

  useEffect(() => {
    if (address == null || tradeData.length == 0) return;
    // console.log('update my data')

    const myTrades = tradeData.map(tradeInfo => {
      if (tradeInfo.trader == address) {
        return {...tradeInfo, inAmount: new BigNumber(tradeInfo.inAmount), outAmount: new BigNumber(tradeInfo.outAmount)}
      }
    }).filter(v => v != null)    
    setMyTransactions(myTrades.length > 0 ? myTrades.slice().reverse() : []);

    const allTrades = tradeData.map(tradeInfo => {
      return {...tradeInfo, inAmount: new BigNumber(tradeInfo.inAmount), outAmount: new BigNumber(tradeInfo.outAmount)}
    })
    setAllTransactions(allTrades.length > 0 ? allTrades.slice().reverse() : []);
  }, [address, tradeData])

  useEffect(() => {
    // console.log('update display txs')
    setCurDisplayedTxs(showMyTxs ? myTransactions : allTransactions);
  }, [showMyTxs, myTransactions, allTransactions])

  useEffect(() => {
    // if (tradeData.length == 0) return;
    // console.log('update chart data')
    const chartData = generateChartDataWithPeroid(tradeData.slice().reverse(), tradeTimespan);
    setChartData(chartData);
  }, [tradeData, tradeTimespan])

  useEffect(() => {
    if (chartData.length === 0 || tradeChart != null) return;
    console.log(chartData);

    const parentElement = document.getElementById("TradeChart")
    if (parentElement == null) return;

    const chartWidth = parentElement.clientWidth
    const chartHeight = parentElement.clientHeight

    const chart = createChart(parentElement, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0, 0, 0, 0)" },
        textColor: "#d1d4dc",
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
        borderVisible: false,
        ticksVisible: true,
      },
      grid: {
        vertLines: {
          color: "rgba(42, 46, 57, 0)",
        },
        horzLines: {
          color: "rgba(42, 46, 57, 0.6)",
        },
      },
      watermark: {
        text: "FAIR314.XYZ",
        color: "rgba(2, 229, 254, 0.1)",
        visible: true,
      },
      localization: {
        locale: 'en-US',
        timeFormatter: (dateTime) => {
          return moment(new Date(dateTime)).format('YYYY-MM-DD HH:mm:ss')
        }
      },
      timeScale: {
        visible: true, 
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = new Date(time);
            return date.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
            });
        },
      }
    })

    setTradeChart(chart);
    window.addEventListener('resize', () => {
      chart.resize(parentElement.clientWidth, parentElement.clientHeight);
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: green,
      downColor: red,
      borderVisible: false,
      wickUpColor: green,
      wickDownColor: red,
      lastValueVisible: false,
      tickMarkFormatter: (time, tickMarkType, locale) => {
        const date = new Date(time);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
      }
    })

    candlestickSeries.applyOptions({
        priceFormat: {
            type: 'price',
            precision: 7,
            minMove: 0.0000001,
        },
    });

    candlestickSeries.setData(chartData);
    //setCandlestickSeries(tmpCandlestickSeries);
 
    var volumeSeries = chart.addHistogramSeries({
      color: red,
      priceFormat: {
        type: "price",
        precision: 3,
        minMove: 0.001,
      },
      priceScaleId: "",
      overlay: true,
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
      visible: true,
      autoScale: true,
      alignLabels: true,
      borderVisible: false,
      entireTextOnly: true,
      ticksVisible: false,
    })
    
    volumeSeries.setData(
      chartData.map((tx, index) => {
        const time = tx.time
        const value = tx.sellVolume + tx.buyVolume
        const color = tx.open > tx.close ? red : green
        return { time, value, color }
      })
    )

    volumeSeries.priceScale().applyOptions({
      priceFormat: {
        type: "price",
        precision: 3,
        minMove: 0.001,
      },
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    //setVolumeSeries(tmpVolumeSeries);    

    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const priceInfo = param.seriesData.get(candlestickSeries)
        const volumeInfo = param.seriesData.get(volumeSeries)
        setCurDate(moment(new Date(priceInfo?.time)).format('YYYY-MM-DD HH:mm:ss'))
        setOpenPrice(displayReadableNumber(priceInfo?.open ? priceInfo?.open : 0))
        setHighPrice(displayReadableNumber(priceInfo?.high ? priceInfo?.high : 0))
        setLowPrice(displayReadableNumber(priceInfo?.low ? priceInfo?.low : 0))
        setClosePrice(displayReadableNumber(priceInfo?.close ? priceInfo?.close : 0))
        setVolume(displayReadableNumber(volumeInfo?.value ? volumeInfo?.value : 0))
        // setCurColor(volumeInfo?.color);
      }
    })
    chart.timeScale().fitContent();
  }, [chartData])

  useEffect(() => {
    if (config == null || fair314ContractAddr == '') return;

    getToken(config, {
      address: fair314ContractAddr
    }).then(token => {
      setToken(token);
    })
  }, [config, fair314ContractAddr])

  useEffect(() => {
    if (config == null || fair314ContractAddr == '') return;

    readContract(config, {
      address: fair314ContractAddr,
      abi: Fair314.abi,
      functionName: 'getReserves',
      args: []
    }).then(result => {
      setEthReserve(new BigNumber(Number(result[0])));
      setFair314Reserve(new BigNumber(Number(result[1])));
      if (new BigNumber(Number(result[1])).toNumber() > 0) {
        setTokenPrice(new BigNumber(Number(result[0])).dividedBy(new BigNumber(Number(result[1]))));
      }
    })
  }, [config, fair314ContractAddr, newTradeUpdate])

  // get trade volume
  useEffect(() => {
    if (config == null || fair314ContractAddr == '') return;

    const blockPeriod = 2;
    getBlockNumber(config).then(blockNumber => {
      const blockNumber24HBefore = new BigNumber(blockNumber).minus(3600 * 24 / blockPeriod).toNumber();
      const blockNumber7DBefore = new BigNumber(blockNumber).minus(3600 * 24 * 7 / blockPeriod).toNumber();
      multicall(config, {
        contracts: [
          {
            address: fair314ContractAddr,
            abi: Fair314.abi,
            functionName: 'getTotalVolumeAtBlock',
            args: [blockNumber],
          },
          {
            address: fair314ContractAddr,
            abi: Fair314.abi,
            functionName: 'getTotalVolumeAtBlock',
            args: [blockNumber24HBefore],
          },
          {
            address: fair314ContractAddr,
            abi: Fair314.abi,
            functionName: 'getTotalVolumeAtBlock',
            args: [blockNumber7DBefore],
          }
        ],
        multicallAddress, 
      }).then(result => {
        console.log('multicall getTotalVolumeAtBlock', result)
        setTotalVolume(new BigNumber(result[0].result));
        setVolume24H(new BigNumber(result[0].result).minus(new BigNumber(result[1].result)));
        setVolume7D(new BigNumber(result[0].result).minus(new BigNumber(result[2].result)));
      })
    })
  }, [fair314ContractAddr])
  
  useEffect(() => {
    if (amountIn > 0) {
      const value = '0x' + new BigNumber(amountIn).shiftedBy(18).toString(16);
      readContract(config, {
        address: fair314ContractAddr,
        abi: Fair314.abi,
        functionName: 'getAmountOut',
        args: [value, isBuy]
      }).then(amountOut => setAmountOut(new BigNumber(Number(amountOut)).shiftedBy(-18).toFixed(isBuy ? 2 : 6)));
    }
  }, [amountIn])

  const sell = async () => {
    if (parseFloat(amountIn) == 0) {
      toast({
        title: 'Warning',
        description: `Please enter a valid payment amount.`,
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }

    setIsSwaping(true);

    //const amount = '0x' + new BigNumber(amountIn).shiftedBy(18).toString(16);

    await executeTx({
      account: address,
      address: fair314ContractAddr,
      abi: Fair314.abi,
      functionName: 'transfer',
      args: [fair314ContractAddr, parseEther(amountIn)],
    }, `Sell ${token.symbol} successfully`, `Fail to sell ${token.symbol}`);  

    setIsSwaping(false);
  }

  const buy = async () => {
    if (parseFloat(amountIn) == 0) {
      toast({
        title: 'Warning',
        description: `Please enter a valid payment amount.`,
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    setIsSwaping(true);

    const hash = await sendTransaction(config, {
      to: fair314ContractAddr,
      value: parseEther(amountIn),
      data: ''
    })
    const receipt = await waitForTransactionReceipt(config, { hash });
    if (receipt.status != 'success') {
      setIsSwaping(false);
      throw `Failed to buy ${token.symbol}`;
    }

    setIsSwaping(false);
    toast({
      title: 'Success',
      description: `Buy  ${token.symbol} successfully`,
      status: 'success',
      position: 'bottom-right',
      isClosable: true,
    });
  }

  const executeTx = async (parameters, successInfo, failInfo) => {
    try {      
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

  const updateAmountIn = (amount) => {
    if (amount != null && amount.length > 0 && (!/^\d*\.?\d*$/.test(amount))) return;

    setAmountIn(amount);
  }

  return (
    <Box className={`${styles.page} flex-col align-center`}>
      <Box className={`${styles['section_overview']}`}>
        <Box className={`${styles['pair_info']} flex-col align-start`}>
          <Box className={`${styles['pair_name']} flex-row justify-between align-center`}>   
            {token?.symbol} {token ? `/ ETH` : ''}
            <Box className={`${styles['token_price']} flex-row justify-start align-center`}>
              {displayReadableNumber(tokenPrice.toFixed(8))}
              <Box>E</Box>
            </Box>
            <Box className={styles.priceInfo}>
              {/* <Text color={priceChangePercentage.isPositive() ? 'green.500' : 'red.500'}>
                {priceChangePercentage.isPositive() ? '↑' : '↓'} {priceChangePercentage.abs().toFixed(2)}%
              </Text> */}
            </Box>
          </Box>
          <Box className={`flex-row justify-start align-center`}>
            <Box className={`${styles['pair_price']} flex-row align-center`}>O{openPrice} E</Box>
            <Box className={`${styles['pair_price']} flex-row align-center`}>H{highPrice} E</Box>
            <Box className={`${styles['pair_price']} flex-row align-center`}>L{lowPrice} E</Box>
            <Box className={`${styles['pair_price']} flex-row align-center`}>C{closePrice} E</Box>
            <Box className={`${styles['pair_price']} flex-row align-center`}>V{volume} E</Box>
          </Box>
          {/* <Box className={`${styles['pair_price']} flex-row justify-start align-center`}>
            <Box className={`${styles[tradeTimespan == 60 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(60)}>1 Minute</Box>
            <Box className={`${styles[tradeTimespan == 300 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(300)}>5 Minute</Box>
            <Box className={`${styles[tradeTimespan == 900 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(900)}>15 Minute</Box>
            <Box className={`${styles[tradeTimespan == 3600 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(3600)}>1 Hour</Box>
            <Box className={`${styles[tradeTimespan == 86400 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(86400)}>1 Day</Box>
            <Box className={`${styles[tradeTimespan == 604800 ? 'trade_timespan_selected' : 'trade_timespan']}`} onClick={() => setTradeTimespan(604800)}>1 Week</Box>
          </Box> */}
        </Box>
        <Box className={`${styles['volumes']} flex-row justify-between align-center`}>
          <Box className={`flex-col align-center`}>
            <Box className={`${styles['volume_title']}`}>Total Volume</Box>
            <Box className={`${styles['volume_value']}`}>{totalVolume.shiftedBy(-18).toFixed(3)} ETH</Box>
          </Box>
          <Box className={`flex-col align-center`}>
            <Box className={`${styles['volume_title']}`}>Volume 7D</Box>
            <Box className={`${styles['volume_value']}`}>{volume7D.shiftedBy(-18).toFixed(3)} ETH</Box>
          </Box>
          <Box className={`flex-col align-center`}>
            <Box className={`${styles['volume_title']}`}>Volume 24H</Box>
            <Box className={`${styles['volume_value']}`}>{volume24H.shiftedBy(-18).toFixed(3)} ETH</Box>
          </Box>
        </Box>
      </Box>
      <Box className={`${styles['section_tradeview']}`}>
        <Box id="TradeChart" className={`${styles['trade_chart']}`}/>
        
        <Box className={`${styles['swap_overview']} flex-col justify-start align-left`}>
          <Box className={`${styles['swap_grid']} flex-col justify-start align-center`}>
            <Box className={`${styles['trade_actions']}`}>
              <Box className={`flex-row justify-start align-center`}>Sell</Box>
              <Box className={`flex-row justify-between align-center`}>
                <Input className={`${styles['swap_amount_in']}`} value={amountIn} onChange={(e) => updateAmountIn(e.target.value)}></Input>
                <Box className={`${styles['swap_token_in']}`}>{isBuy ? 'ETH' : token?.symbol}</Box>
              </Box>
              <Box className={`flex-row justify-end align-center`}>Balance:{isBuy ? ethBalance.shiftedBy(-18).toFixed(3) : fair314Balance.shiftedBy(-18).toFixed(0)}</Box>
            </Box>
            <Box className={`${styles['swap_symbol']} flex-col justify-around align-center`} 
                style={{marginTop: '-15px', zIndex: 1}}
                onClick={() => setIsBuy(!isBuy)}>
              <ArrowDownIcon className={`${styles['arrowdown']}`}/>
            </Box>
            <Box className={`${styles['trade_actions']}`} style={{marginTop: '-20px'}}>
              <Box className={`flex-row justify-start align-center`}>Buy</Box>
                <Box className={`flex-row justify-between align-center`}>
                  <Input readOnly className={`${styles['swap_amount_out']}`} value={amountOut}></Input>
                  <Box className={`${styles['swap_token_in']}`}>{isBuy ? token?.symbol : 'ETH'}</Box>
                </Box>
              <Box className={`flex-row justify-end align-center`}>Balance:{isBuy ? fair314Balance.shiftedBy(-18).toFixed(0) : ethBalance.shiftedBy(-18).toFixed(3)}</Box>
            </Box>
            <Box className={`${styles['pool_info']} flex-col justify-start align-center`}>
              <Box className={`${styles['one_info']} flex-row justify-between align-center`}>
                <Box>Reserves</Box>
                <Box>{ethReserve.shiftedBy(-18).toFixed(3)} ETH + {fair314Reserve.shiftedBy(-18).toFixed(0)} {token?.symbol}</Box>
              </Box>
              <Box className={`${styles['one_info']} flex-row justify-between align-center`}>
                <Box>Fee</Box>
                <Box>{isBuy ? '0.3%' : '0.5%'}</Box>
              </Box>
            </Box>
            <Button className={`${styles['swap_btn']}`} 
                    onClick={() => isBuy ? buy() : sell()}
                    disabled={isSwaping}
                    isLoading={isSwaping} 
                    loadingText={isBuy ? 'Buying' : 'Selling'}>{isBuy ? 'Buy' : 'Sell'}</Button>
          </Box>
          <Box className={`${styles['trading_features']} flex-col justify-start align-left`}>
            <Box className={`${styles['trading_features_title']}`}>Trading Features:</Box>
            <Box className={`${styles['trading_features_content']}`}>👉 Bonding Curve: X * Y = K</Box>
            <Box className={`${styles['trading_features_content']}`}>👉 Buy {token?.symbol}: Send ETH to the address of {token?.symbol}</Box>
            <Box className={`${styles['trading_features_content']}`}>👉 Sell {token?.symbol}: Transfer {token?.symbol} to the address of {token?.symbol}</Box>
            <Box className={`${styles['trading_features_content']}`}>👉 To prevent MEV, one transaction per minute per address</Box>
          </Box>
        </Box>
      </Box>
      <Box className={`${styles['section_stat']}`}>
        <Box className={`${styles['transactions_grid']} flex-col justify-around align-start`}>
          <Box className={`${styles['my_transactions_title']}`}>
            <Checkbox colorScheme='green' onChange={(e) => {setShowMyTxs(e.target.checked)}}>Display My Transactions</Checkbox>
          </Box>   
          <Box className={`${styles['transactons']}`}>
            <TableContainer className={`${styles['table_container']}`} overflowY="scroll">
              <Table variant='unstyled'>
                {curDisplayedTxs.length == 0 && <TableCaption>No Data</TableCaption>}
                <Thead position="sticky" zIndex={1} top={0} bg="rgba(27, 27, 27, 1)">
                  <Tr>
                    <Th></Th>
                    <Th>{token?.symbol}</Th>
                    <Th>ETH</Th>
                    <Th className={`${styles['none_mobile']}`}>Price(ETH/{token?.symbol})</Th>
                    <Th className={`${styles['only_mobile']}`}>Price</Th>
                    <Th className={`${styles['none_mobile']}`}>Time</Th>
                    <Th className={`${styles['none_mobile']}`}>Trader</Th>
                  </Tr>
                </Thead>
                <Tbody style={{color: 'white'}}>
                {
                curDisplayedTxs.length > 0 && 
                  curDisplayedTxs.map(transaction => (
                    <Tr>
                      <Td 
                        style={{color: transaction.bSell ? 'firebrick' : 'green', cursor: 'pointer'}}
                        onClick={() => goToTx(transaction.txHash)}>
                      {transaction.bSell ? 'Sell' : 'Buy'}<ExternalLinkIcon mx='5px'/>
                      </Td>
                      <Td>{transaction.bSell ? transaction.inAmount.shiftedBy(-18).toFixed(transaction.bSell ? 0 : 4) : transaction.outAmount.shiftedBy(-18).toFixed(transaction.bSell ? 4 : 0)}</Td>
                      <Td>{transaction.bSell ? transaction.outAmount.shiftedBy(-18).toFixed(transaction.bSell ? 4 : 0) : transaction.inAmount.shiftedBy(-18).toFixed(transaction.bSell ? 0 : 4)}</Td>
                      <Td>{(transaction.bSell ? new BigNumber(transaction.outAmount).dividedBy(new BigNumber(transaction.inAmount)) : new BigNumber(transaction.inAmount).dividedBy(new BigNumber(transaction.outAmount))).toFixed(7)}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatTimeWithoutYear(transaction.time)}</Td>
                      <Td className={`${styles['none_mobile']}`}>{formatAddress({address: transaction.trader, style: {fontSize: '12px'}})}</Td>
                    </Tr>
                  )) 
                }
                </Tbody>
              </Table>
            </TableContainer>
          </Box>         
        </Box>
        <Box className={`${styles['leaderboard']} flex-col justify-around align-start`}>
          <Box className={`${styles['volume_ranking_title']} flex-row justify-around align-center`}>
            <Box className={`${styles[isCurrentRound ? 'trading_ranking_selected' : 'trading_ranking']}`} onClick={() => setIsCurrentRound(true)}>Current Trading Rankings</Box>
            <Box className={`${styles[isCurrentRound ? 'trading_ranking' : 'trading_ranking_selected']}`} onClick={() => setIsCurrentRound(false)}>History Trading Rankings</Box>
          </Box>   
          <Box className={`${styles['round_volume_info']}`}>
            {
              isCurrentRound ?
              <TableContainer className={`${styles['table_container']}`} overflowY="scroll">
                <Table variant='unstyled'>
                  {curTradeRanking.length == 0 && <TableCaption>No Data</TableCaption>}
                  <Thead position="sticky" zIndex={1} top={0} bg="rgba(27, 27, 27, 1)">
                    <Tr>
                      <Th>Rank</Th>
                      <Th>Trader</Th>
                      <Th>Volume(ETH)</Th>
                    </Tr>
                  </Thead>
                  <Tbody style={{color: 'white'}}>
                  {
                  curTradeRanking.length > 0 && 
                  curTradeRanking.map((tradeInfo, index) => (
                      <Tr>
                        <Td>{index + 1}</Td>
                        <Td>
                        {formatAddress({address: tradeInfo[0], len: 4})}
                        </Td>
                        <Td>
                        {displayReadableNumber(tradeInfo[1].shiftedBy(-18).toString())}
                        </Td>                            
                      </Tr>
                    )) 
                  }
                  </Tbody>
                </Table>
              </TableContainer>
              :
              <TableContainer className={`${styles['table_container']}`} overflowY="scroll">
                <Table variant='unstyled'>
                  {roundWinnersInfo.length == 0 && <TableCaption>No Data</TableCaption>}
                  <Thead position="sticky" zIndex={1} top={0} bg="rgba(27, 27, 27, 1)">
                    <Tr>
                      <Th>Round</Th>
                      <Th>Champion</Th>
                      <Th>Fee Earned</Th>
                    </Tr>
                  </Thead>
                  <Tbody style={{color: 'white'}}>
                  {
                  roundWinnersInfo.length > 0 && 
                  roundWinnersInfo.map(roundWinnerInfo => (
                      <Tr>
                        <Td>
                          <Tooltip label={`${roundWinnerInfo.startTime} ~ ${roundWinnerInfo.endTime}`}>
                            {roundWinnerInfo.round}
                          </Tooltip>
                        </Td>
                        <Td>
                        {formatAddress({address: roundWinnerInfo.winner, len: 4})}
                        </Td>
                        <Td>{displayReadableNumber(roundWinnerInfo.feeEarned.shiftedBy(-18).toString())}</Td>                            
                      </Tr>
                    )) 
                  }
                  </Tbody>
                </Table>
              </TableContainer>
            }            
            {/* <Tabs isFitted variant='enclosed'>
              <TabList>
                <Tab style={{color: baseColor}}>Current Round</Tab>
                <Tab style={{color: baseColor}}>History Rounds</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <Box className={`${styles['transactons']}`}>
                    
                  </Box>
                </TabPanel>
                <TabPanel>
                  <TableContainer className={`${styles['table_container']}`} overflowY="scroll">
                    <Table variant='unstyled'>
                      {curDisplayedTxs.length == 0 && <TableCaption>No Data</TableCaption>}
                      <Thead position="sticky" zIndex={1} top={0}>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Champion</Th>
                          <Th>Earned Fee</Th>
                        </Tr>
                      </Thead>
                      <Tbody style={{color: 'white'}}>
                      {
                      curDisplayedTxs.length > 0 && 
                        curDisplayedTxs.map(transaction => (
                          <Tr>
                            <Td>{formatTimeWithoutYear(transaction.time)}</Td>
                            <Td 
                              style={{color: transaction.bSell ? 'red' : 'green', textDecoration: 'underline', cursor: 'pointer'}}
                              onClick={() => goToTx(transaction.txHash)}>
                            {transaction.bSell ? 'Sell' : 'Buy'}
                            </Td>
                            <Td>{transaction.bSell ? transaction.inAmount.shiftedBy(-18).toFixed(transaction.bSell ? 0 : 4) : transaction.outAmount.shiftedBy(-18).toFixed(transaction.bSell ? 4 : 0)}</Td>                            
                          </Tr>
                        )) 
                      }
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </TabPanels>
            </Tabs>     */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}