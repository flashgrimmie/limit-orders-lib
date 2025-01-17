import { useCallback, useState } from "react";
import { useWeb3 } from "../web3";
import useInterval from "./useInterval";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  MATIC = 137,
  FANTOM = 250,
}

export default function useGasPrice(): number | undefined {
  const { chainId, library } = useWeb3();
  const [gasPrice, setGasPrice] = useState<number>();

  const gasPriceCallback = useCallback(() => {
    library
      ?.getGasPrice()
      .then((gasPrice) => {
        // add 20%
        setGasPrice(gasPrice.mul(120).div(100).toNumber());
      })
      .catch((error) =>
        console.error(`Failed to get gas price for chainId: ${chainId}`, error)
      );
  }, [chainId, library]);

  useInterval(
    gasPriceCallback,
    chainId && isEthereumChain(chainId) ? 15000 : 60000
  );

  return gasPrice;
}
