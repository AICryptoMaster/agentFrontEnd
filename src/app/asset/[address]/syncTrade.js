import { parseAbiItem } from 'viem';
import { BigNumber } from 'bignumber.js';


const gapBlockNumber = 1800 * 2;  // 2 hours
const blockInterval = 2;
const vecelBaseUrl = 'https://tg4aegls2m51r02s.public.blob.vercel-storage.com/trade/';

export async function syncTrades(publicClient, fair314Addr, tradeStartTime, curBlockNumber) {
    const curTime = parseInt(new Date().getTime() / 1000 + '');
    console.log('trade', tradeStartTime)
    let startBlock = Math.floor(curBlockNumber - (curTime - tradeStartTime) / blockInterval);
    let tradeLogs = []

    let tradeLogInfo = await getTradeFile(fair314Addr);
    if (tradeLogInfo != null) {
        console.log(`downloaded trade data, lastest block number:${tradeLogInfo.lastBlockNumber}, data length:${tradeLogInfo.trades.length}, 
                    data: ${JSON.stringify(tradeLogInfo.trades)}`)
        startBlock = tradeLogInfo.lastBlockNumber + 1;
        tradeLogs = tradeLogInfo.trades;
    } else {
        console.log('No trade data.')
        tradeLogInfo = {}
    }
    console.log(`All range of Fair314(${fair314Addr}): ${startBlock} ~ ${curBlockNumber}`)
    for (let fromBlock = startBlock; fromBlock < curBlockNumber; fromBlock += gapBlockNumber) {
        let toBlock = fromBlock + gapBlockNumber;
        if (toBlock > curBlockNumber) {
            toBlock = curBlockNumber;
        }
        console.log('sync events', fromBlock, toBlock)
        const logs = await syncEvents4OneFair314(publicClient, fair314Addr, fromBlock, toBlock);
        if (logs.length > 0) {
            console.log(`get ${logs.length} new events.`);
            tradeLogs.push(...logs);
        }
    }

    return tradeLogs;
}

async function syncEvents4OneFair314(publicClient, fair314Addr, fromBlock, toBlock) {    
    const event = parseAbiItem("event Trade(address indexed trader, bool bSell, uint256 inAmount, uint256 outAmount, uint256 timestamp)");
    const logs = await publicClient.getLogs({
        address: fair314Addr,
        event,
        fromBlock: '0x' + new BigNumber(fromBlock).toString(16),
        toBlock: '0x' + new BigNumber(toBlock).toString(16),
    })
    const tradeLogs = []
    // logs is from older(0 index) to newer(last index)
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
    return tradeLogs;
}

async function getTradeFile(fair314Addr) {
    try {
        const url = vecelBaseUrl + fair314Addr + '.json' + '?r=' + new Date().getTime();     
        console.log('trade data url:', url) 
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch the file:', fair314Addr);        
        return null;
      }
}