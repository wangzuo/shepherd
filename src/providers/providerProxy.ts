import { store } from '@src/ducks';
import { getManualMode } from '@src/ducks/providerBalancer/balancerConfig/selectors';
import {
  IProviderCall,
  PROVIDER_CALL,
  ProviderCallFailedAction,
  ProviderCallFlushedAction,
  providerCallRequested,
  ProviderCallSucceededAction,
} from '@src/ducks/providerBalancer/providerCalls';

import { subscribeToAction } from '@src/ducks/subscribe';
import { triggerOnMatchingCallId } from '@src/ducks/subscribe/utils';
import { IProvider, Reject, Resolve } from '@src/types';
import { logger } from '@src/utils/logging';
import { allRPCMethods } from './constants';
import RpcProvider from './rpc';

const respondToCallee = (resolve: Resolve, reject: Reject) => (
  action:
    | ProviderCallFailedAction
    | ProviderCallSucceededAction
    | ProviderCallFlushedAction,
) => {
  if (action.type === PROVIDER_CALL.SUCCEEDED) {
    const { providerCall, result } = action.payload;

    logger.log(`CallId: ${providerCall.callId} Pid: ${providerCall.providerId}
     ${providerCall.rpcMethod} ${providerCall.rpcArgs}
     Result: ${result}`);

    resolve(action.payload.result);
  } else {
    reject(Error(action.payload.error));
  }
};

const generateCallId = (() => {
  let callId = 0;
  return () => {
    const currValue = callId;
    callId += 1;
    return currValue;
  };
})();

const makeProviderCall = (
  rpcMethod: keyof RpcProvider,
  rpcArgs: string[],
): IProviderCall => {
  const isManual = getManualMode(store.getState());

  const providerCall: IProviderCall = {
    callId: generateCallId(),
    numOfRetries: 0,
    rpcArgs,
    rpcMethod,
    minPriorityProviderList: [],
    ...(isManual ? { providerWhiteList: [isManual] } : {}),
  };

  return providerCall;
};

const dispatchRequest = (providerCall: IProviderCall) => {
  // make the request to the load balancer
  const networkReq = providerCallRequested(providerCall);
  store.dispatch(networkReq);
  return networkReq.payload.callId;
};

const waitForResponse = (callId: number) =>
  new Promise((resolve, reject) =>
    store.dispatch(
      subscribeToAction({
        trigger: triggerOnMatchingCallId(callId, false),
        callback: respondToCallee(resolve, reject),
      }),
    ),
  );

const providerCallDispatcher = (rpcMethod: keyof RpcProvider) => (
  ...rpcArgs: string[]
) => {
  const providerCall = makeProviderCall(rpcMethod, rpcArgs);
  const callId = dispatchRequest(providerCall);
  return waitForResponse(callId);
};

const handler: ProxyHandler<IProvider> = {
  get: (target, methodName: keyof RpcProvider) => {
    if (!allRPCMethods.includes(methodName)) {
      return target[methodName];
    }
    return providerCallDispatcher(methodName);
  },
};

export const createProviderProxy = () => new Proxy({} as IProvider, handler);
