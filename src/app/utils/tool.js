import BigNumber from 'bignumber.js';
import {
  Box,
} from '@chakra-ui/react';
import { config } from 'wagmiConfig';

export function getSearchParam(param) {
    const currentURL = window.location.href;
    const url = new URL(currentURL);
    const searchParams = new URLSearchParams(url.search);
    if (searchParams.size > 0) {
      const value = searchParams.get(param);
      return value;
    }
    return null;
}

export function isEmpty(v) {
    return v == null || v == undefined || v == '';
}

export function convertNumberToPercentage(number, totalNumber) {
  const percentage = (number / totalNumber) * 100;
  const formattedPercentage = percentage.toFixed(2);
  return formattedPercentage;
}

export function displayReadableNumber(number, noBox) {
  const str = new BigNumber(number).toString(10).replace(/\.?0*$/, '');
  
  const match = str.match(/\.0+/);
  let zeroCount = 0;
  if (match) {
      zeroCount = match[0].length - 1;
  }

  if (noBox) return new BigNumber(number).toFixed(zeroCount + 3).toString().replace(/\.?0*$/, '');

  return <Box style={{color: 'rgb(2, 229, 254)'}}>{new BigNumber(number).toFixed(zeroCount + 3).toString().replace(/\.?0*$/, '')}</Box>
}

export function goToTx(txHash) {
  const chain = config?.chains.filter(chainInfo => chainInfo.id == config?.state.chainId)[0];

  window.open(chain?.blockExplorers.default.url + '/tx/' + txHash, '_tab');
}