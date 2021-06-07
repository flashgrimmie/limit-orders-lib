import { useMemo } from "react";
import { GelatoLimitOrders, Order } from "@gelatonetwork/limit-orders-lib";
import useGasPrice from "../useGasPrice";
import useGelatoLimitOrdersHandlers, {
  GelatoLimitOrdersHandlers,
} from "./useGelatoLimitOrdersHandlers";
import {
  DerivedOrderInfo,
  useDerivedOrderInfo,
  useOrderState,
} from "../../state/gorder/hooks";
import useGelatoLimitOrdersHistory, {
  GelatoLimitOrdersHistory,
} from "./useGelatoLimitOrdersHistory";
import { OrderState } from "../../state/gorder/reducer";
import { useWeb3 } from "../../web3";

export default function useGelatoLimitOrders(): {
  library: GelatoLimitOrders | undefined;
  gasPrice: number | undefined;
  handlers: GelatoLimitOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: OrderState;
  history: GelatoLimitOrdersHistory;
} {
  const { chainId, library: provider } = useWeb3();
  const derivedOrderInfo = useDerivedOrderInfo();

  const gasPrice = useGasPrice();

  const library = useMemo(
    () =>
      chainId && provider
        ? new GelatoLimitOrders(chainId, provider?.getSigner())
        : undefined,
    [chainId, provider]
  );

  const history = useGelatoLimitOrdersHistory();

  const orderState = useOrderState();

  const handlers = useGelatoLimitOrdersHandlers();

  return {
    library,
    gasPrice,
    history,
    handlers,
    derivedOrderInfo,
    orderState,
  };
}