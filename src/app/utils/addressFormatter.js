import { Tooltip, Button, Image } from '@chakra-ui/react';
import { config } from 'wagmiConfig';
import { ExternalLinkIcon } from '@chakra-ui/icons'

export const getEllipsisTxt = (str, n = 6) => {
    if (str) {
      return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
    }
    return '';
};

export const formatAddress = ({address, len = 6, bHighlight = false, tooltipPreInfo = '', urlPrefix = '', style = {}}) => {
  
  const chain = config?.chains.filter(chainInfo => chainInfo.id == config?.state.chainId)[0];

  const gotoScan = () => {
    if (chain != null)
      window.open((urlPrefix == '' ? chain?.blockExplorers.default.url + '/address/' : urlPrefix) + address, '_tab');
  }

  return <Tooltip label={tooltipPreInfo + address}>
            <Button style={style} colorScheme={bHighlight ? 'grey' : 'telegram'} variant='link' onClick={() => gotoScan()}>
              {`${getEllipsisTxt(address, len)}`}<ExternalLinkIcon mx='5px' />
            </Button> 
        </Tooltip>
};