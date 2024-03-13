import { ethers } from "ethers";

import Injector from "../injector";
import Repository from "../repository";
import { WalletController } from "./wallet.controller";

export default class TipController extends Injector {
  constructor(repository: Repository, private wallet: WalletController) {
    super(repository);
  }

  async tipUsers(
    from: ethers.Wallet,
    amount: bigint,
    ...receivers: (string | number)[]
  ) {
    const wallets = await Promise.all(
      receivers.map((wallet) => this.wallet.getWallet(wallet))
    );

    return wallets.map((receiver) =>
      this.wallet.transfer(from, receiver.address, amount)
    );
  }
}
