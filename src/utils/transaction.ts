import { isHexString } from 'ethereumjs-util';
import { minBy } from 'lodash';
import BigNumber from 'bignumber.js';
import { CHAINS, GASPRICE_RANGE, KEYRING_CATEGORY_MAP } from 'consts';
import { GasLevel, Tx } from 'background/service/openapi';
import { findChain } from './chain';

export const validateGasPriceRange = (tx: Tx) => {
  const chain = findChain({
    id: tx.chainId,
  });
  if (!chain) return true;
  const range = GASPRICE_RANGE[chain.enum];
  if (!range) return true;
  const [min, max] = range;
  if (Number((tx as Tx).gasPrice || tx.maxFeePerGas) / 1e9 < min)
    throw new Error('GasPrice too low');
  if (Number((tx as Tx).gasPrice || tx.maxFeePerGas) / 1e9 > max)
    throw new Error('GasPrice too high');
  return true;
};

export const convert1559ToLegacy = (tx) => {
  return {
    chainId: tx.chainId,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    data: tx.data,
    gas: tx.gas,
    gasPrice: tx.maxFeePerGas,
    nonce: tx.nonce,
  };
};

export const convertLegacyTo1559 = (tx: Tx) => {
  return {
    chainId: tx.chainId,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    data: tx.data,
    gas: tx.gas,
    maxFeePerGas: tx.gasPrice,
    maxPriorityFeePerGas: tx.gasPrice,
    nonce: tx.nonce,
  };
};

export const is1559Tx = (tx: Tx) => {
  if (!('maxFeePerGas' in tx) || !('maxPriorityFeePerGas' in tx)) return false;
  return isHexString(tx.maxFeePerGas!) && isHexString(tx.maxPriorityFeePerGas!);
};

export function getKRCategoryByType(type?: string) {
  return KEYRING_CATEGORY_MAP[type as any] || null;
}

// return maxPriorityPrice or maxGasPrice
export const calcMaxPriorityFee = (
  gasList: GasLevel[],
  target: GasLevel,
  chainId: number,
  useMaxFee: boolean
) => {
  if (target.priority_price && target.priority_price !== null) {
    return target.priority_price;
  }

  return target.price;
};

export function makeTransactionId(
  fromAddr: string,
  nonce: number | string,
  chainEnum: string
) {
  if (typeof nonce === 'number') {
    nonce = `0x${nonce.toString(16)}`;
  } else if (typeof nonce === 'string') {
    nonce = nonce.startsWith('0x') ? nonce : `0x${nonce}`;
  }
  return `${fromAddr}_${nonce}_${chainEnum}`;
}
