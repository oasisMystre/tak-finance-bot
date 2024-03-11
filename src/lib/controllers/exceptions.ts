import { ethers } from "ethers";

export class InsufficientBalance extends Error {
    constructor(amount: bigint) {
      super(
        "Can't send due to insufficient fund to cover transaction. Make sure your have amount equal or greater than ♢" +
          ethers.formatUnits(amount) +
          " for gas fee plus total transfer amount"
      );
    }
  }