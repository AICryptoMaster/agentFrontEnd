import { BigNumber } from 'bignumber.js'

// trade: trader, bSell, inAmount, outAmount, time, txhash
function convertTrade(trade) {
    const { bSell, inAmount, outAmount } = trade;

    let price = bSell ? new BigNumber(outAmount).dividedBy(new BigNumber(inAmount)) : new BigNumber(inAmount).dividedBy(new BigNumber(outAmount));
    price = price.toFixed(4);

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

    let time = moment(new Date(timestamp)).format(timeFormat)
    return {open, close, high, low, sellVolume, buyVolume, time, value: close}
}

// tradeList should from newest[at index 0] to oldest[at last index]
function generateChartData(tradeList, period) {
    if (tradeList.length == 0) return [];

    const lastestTx = tradeList[0];
    let lastestTime = (lastestTx.timestamp - lastestTx.timestamp % 1000) / 1000;
    let lastTime = lastestTime - lastestTime % period;
    console.log(lastestTime, lastTime);

    const oneDay = 24 * 60 * 60;  // s
    const oneHour = 60 * 60;
    const oneMinute = 60;
    let timeFormat = 'YYYY-MM-DD';
    if (period < oneDay && period >= oneHour) timeFormat = 'YYYY-MM-DD HH';
    if (period < oneHour && period >= oneMinute) timeFormat = 'YYYY-MM-DD HH:mm';
    if (period < oneMinute) timeFormat = 'YYYY-MM-DD HH:mm:ss';

    let chartData = []
    let curBatchTxs = []
    for (let i = 0; i < tradeList.length; i++) {
        const trade = tradeList[i];
        if (trade.timestamp / 1000 >= lastTime) {
            curBatchTxs.push(trade);
        } else {
            if (curBatchTxs.length > 0) {
                const oneBatch = processBatchTxs(curBatchTxs.reverse(), lastTime * 1000, timeFormat);
                chartData.push(oneBatch);
                curBatchTxs = [];
            }
            i--;
            lastTime = lastTime - period;
        }
    }
    if (curBatchTxs.length > 0) {
        const oneBatch = processBatchTxs(curBatchTxs.reverse(), lastTime * 1000, timeFormat);
        chartData.push(oneBatch);
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

