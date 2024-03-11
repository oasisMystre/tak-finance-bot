import Injector from "../injector";
import Repository from "../repository";
import { WalletController } from "./wallet.controller";

export default class TipController extends Injector {
  constructor(repository: Repository, private wallet: WalletController) {
    super(repository);
  }

  async tipUsers(
    from: string | number,
    amount: bigint,
    receivers: (string | number)[]
  ) {
    /// Transfer individually
    // const multipier = BigInt(receivers.length);
    const wallet = await this.wallet.getWallet(from);
    // const balance = await this.wallet.getBalance(wallet);
    // const { gasPrice } = await this.wallet.provider.getFeeData();
    // const totalAmount = (amount + gasPrice) * multipier;

    // if (balance < totalAmount)
    //   throw new InsufficientBalance(gasPrice + multipier);

    const wallets = await Promise.all(
      receivers.map((wallet) => this.wallet.getWallet(wallet))
    );

    return wallets.map((receiver) =>
      this.wallet.transfer(wallet, receiver.address, amount)
    );
  }
}
