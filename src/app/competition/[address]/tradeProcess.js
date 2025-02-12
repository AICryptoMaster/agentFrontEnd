import { BigNumber } from 'bignumber.js'
import moment from 'moment';

// trade: trader, bSell, inAmount, outAmount, time, txhash
function convertTrade(trade) {
    const { bSell, inAmount, outAmount } = trade;

    let price = bSell ? new BigNumber(outAmount).dividedBy(new BigNumber(inAmount)) : new BigNumber(inAmount).dividedBy(new BigNumber(outAmount));
    price = price.toFixed(9);

    let volume = bSell ? new BigNumber(outAmount) : new BigNumber(inAmount);
    return {price, bSell, volume}
}

function processBatchTxs(batchTrades, timestamp, timeFormat) {
    let open;
    let close;
    let high = 0;
    let low = 10000000;
    let sellVolume = new BigNumber(0);
    let buyVolume = new BigNumber(0);
    //let timestamps = []
    batchTrades.forEach((trade, index) => {
        trade = convertTrade(trade);
        const price = parseFloat(trade.price);
        if (index == 0) {
            open = price
        }
        if (index == batchTrades.length - 1) {
            close = price
        }
        if (price > high) {
            high = price
        }
        if (price < low) {
            low = price
        }
        if (trade.bSell) {
            sellVolume = sellVolume.plus(trade.volume);
        } else {
            buyVolume = buyVolume.plus(trade.volume);
        }
        //timestamps.push(trade.timestamp);
    })
    sellVolume = parseFloat(sellVolume.shiftedBy(-18).toFixed(3));
    buyVolume = parseFloat(buyVolume.shiftedBy(-18).toFixed(3));

    let time = timestamp//moment(new Date(timestamp)).format(timeFormat)
    return {open, close, high, low, sellVolume, buyVolume, time, value: close}
}

// tradeList should from newest[at index 0] to oldest[at last index]
function generateChartData(tradeList, period) {
    if (tradeList.length == 0) return [];

    // console.log(lastestTx.time, lastTime * 1000);

    const oneDay = 24 * 60 * 60;  // s
    const oneHour = 60 * 60;
    const oneMinute = 60;
    let timeFormat = 'YYYY-MM-DD';
    if (period < oneDay && period >= oneHour) timeFormat = 'YYYY-MM-DD HH:00:00';
    if (period < oneHour && period >= oneMinute) timeFormat = 'YYYY-MM-DD HH:mm:00';
    if (period < oneMinute) timeFormat = 'YYYY-MM-DD HH:mm:ss';


    const now = new Date().getTime();
    let lastestTime = (now - now % 1000) / 1000;
    let lastTime = lastestTime - lastestTime % period;

    let chartData = []
    let curBatchTxs = []
    let tradeIndex = 0;
    const lastTx = tradeList[tradeList.length - 1];
    let snapTime = lastTime;
    for (; tradeIndex < tradeList.length;) {
        const trade = tradeList[tradeIndex];
        if (trade.time / 1000 >= snapTime) {
            curBatchTxs.push(trade);
            tradeIndex++;
        } else {
            if (curBatchTxs.length > 0) {
                const oneBatch = processBatchTxs(curBatchTxs.reverse(), snapTime * 1000, timeFormat);
                chartData.push(oneBatch);
                console.log(`${moment(new Date(snapTime * 1000)).format(timeFormat)}: original trade data: ${curBatchTxs.length},
                             chart data: ${JSON.stringify(oneBatch)}`);
                curBatchTxs = [];
            } else {
                chartData.push({time: snapTime * 1000});
            }
            snapTime -= period;
        }
    }

    if (curBatchTxs.length > 0) {
        const oneBatch = processBatchTxs(curBatchTxs.reverse(), snapTime * 1000, timeFormat);
        chartData.push(oneBatch);
        console.log(`${moment(new Date(snapTime * 1000)).format(timeFormat)}: original trade data: ${curBatchTxs.length},
                     chart data: ${JSON.stringify(oneBatch)}`);
        curBatchTxs = [];
    }
    chartData.reverse();
    return chartData;
}

// tradeList should from newest[at index 0] to oldest[at last index]
export function generateChartDataWithPeroid(tradeList, period) {            
    const chartData = generateChartData(tradeList, period);    
    return chartData;
}

