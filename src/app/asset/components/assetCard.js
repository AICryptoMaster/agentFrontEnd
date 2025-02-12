import React from 'react';
import { Box, Button, Tooltip } from '@chakra-ui/react';
import { formatAddress } from 'utils/addressFormatter';
import { formatTimeWithoutYear } from 'utils/dateFormartter';
import BigNumber from 'bignumber.js';
import styles from './AssetCard.module.css';

const AssetCard = ({ assetInfo, tokenStatus, mintTokenSymbol, tokensCurrentMints, tokensTotalVolume, tokenPrices, onMint, onClaim, onRefund, onTrade, isClaiming, isRefunding, displayReadableNumber }) => {
  return (
    <Box className={styles.card}>
      <Box className={styles.header}>
        <span className={styles.name}>{assetInfo.name}</span>
        <span className={styles.contract}>{formatAddress({address: assetInfo.fair314, len: 4})}</span>
      </Box>
      <Box className={styles.content}>
        <Box className={styles.row}>
          <span className={styles.label}>Launcher:</span>
          <span className={styles.value}>{formatAddress({address: assetInfo.launcher, len: 4})}</span>
        </Box>
        {tokenStatus === '1' && (
          <>
            <Box className={styles.row}>
              <span className={styles.label}>End Time:</span>
              <span className={styles.value}>{formatTimeWithoutYear(assetInfo.endTime * 1000)}</span>
            </Box>
            <Box className={styles.row}>
              <span className={styles.label}>Min ~ Max Mints:</span>
              <span className={styles.value}>{assetInfo.minMints} ~ {assetInfo.maxMints}</span>
            </Box>
          </>
        )}
        <Box className={styles.row}>
          <span className={styles.label}>Current Mints:</span>
          <span className={styles.value}>{tokensCurrentMints[assetInfo.fair314]}</span>
        </Box>
        <Box className={styles.row}>
          <span className={styles.label}>Your Mints:</span>
          <span className={styles.value}>{assetInfo.yourMintAmount}</span>
        </Box>
        <Box className={styles.row}>
          <span className={styles.label}>Total Supply:</span>
          <span className={styles.value}>{new BigNumber(assetInfo.totalSupply).shiftedBy(-18).toString()}</span>
        </Box>
        {(assetInfo.status === 2 || assetInfo.status === 3) && (
          <>
            <Box className={styles.row}>
              <span className={styles.label}>Volume({mintTokenSymbol}):</span>
              <span className={styles.value}>{new BigNumber(tokensTotalVolume[assetInfo.fair314]).shiftedBy(-18).toFixed(3)}</span>
            </Box>
            <Box className={styles.row}>
              <span className={styles.label}>Price({mintTokenSymbol}):</span>
              <span className={styles.value}>{displayReadableNumber(tokenPrices[assetInfo.fair314])}</span>
            </Box>
          </>
        )}
      </Box>
      <Box className={styles.footer}>
        {assetInfo.status === 1 && (
          <Button className={styles.actionButton} onClick={() => onMint(assetInfo)}>Mint</Button>
        )}
        {assetInfo.status === 2 && (
          <Tooltip label="Claim can only be made after the end time.">
            <Box className={styles.disabledButton}>Wait to Claim</Box>
          </Tooltip>
        )}
        {assetInfo.status === 3 && assetInfo.yourMintAmount > 0 && (
          <Tooltip label="The token minted can only become a tradable ERC20 after being claimed.">
            <Button 
              className={styles.actionButton}
              onClick={() => onClaim(assetInfo)}
              isLoading={isClaiming}
              loadingText="Claiming"
            >
              Claim
            </Button>
          </Tooltip>
        )}
        {assetInfo.status === 3 && assetInfo.yourMintAmount === 0 && (
          <Button className={styles.actionButton} onClick={() => onTrade(assetInfo)}>Trade</Button>
        )}
        {assetInfo.status === 0 && assetInfo.yourMintAmount > 0 && (
          <Tooltip label="The launch has been failed, and you can refund all of your minting fee.">
            <Button 
              className={styles.actionButton}
              onClick={() => onRefund(assetInfo)}
              isLoading={isRefunding}
              loadingText="Refunding"
            >
              Refund
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default AssetCard;