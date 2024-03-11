import { Wallet, ethers } from "ethers";

import Injector from "../injector";
import Repository from "../repository";
import { ERC20_ABI } from "../../abis";
import { InsufficientBalance } from "./exceptions";

type CloudWallet = {
  privateKey: string;
};

type WalletControllerParams = {
  infuraURL: string;
};

export class WalletController extends Injector {
  provider: ethers.JsonRpcProvider;

  constructor(repository: Repository, params: WalletControllerParams) {
    super(repository);
    this.provider = new ethers.JsonRpcProvider(params.infuraURL);
  }

  private async getOrCreateCloudWallet(identifier: string | number) {
    const { firestore, format } = this.repository.firebase;

    const ref = firestore.collection("wallets").doc(identifier.toString());
    const snapshot = await ref.get();

    if (snapshot.exists) return format<CloudWallet>(snapshot);
    else {
      const wallet = ethers.Wallet.createRandom();
      await ref.create({
        privateKey: wallet.privateKey,
      });

      const snapshot = await ref.get();
      return format<CloudWallet>(snapshot);
    }
  }

  async getWallet(identifier: string | number) {
    const cloudWallet = await this.getOrCreateCloudWallet(identifier);
    return new ethers.Wallet(cloudWallet.privateKey, this.provider);
  }

  getBalance(wallet: ethers.Wallet): Promise<bigint>;
  getBalance(wallet: ethers.Wallet, contract: ethers.Contract): Promise<bigint>;
  getBalance(wallet: ethers.Wallet, ...args: any[]): Promise<bigint> {
    if (args.length > 0) {
      const [contract] = args;
      return contract.balanceOf(wallet.address);
    } else return this.provider.getBalance(wallet.address);
  }

  transfer(
    from: Wallet,
    to: string | ethers.Addressable,
    dia: bigint,
    isChecked?: boolean
  ): Promise<ethers.TransactionResponse>;
  transfer(
    from: Wallet,
    contract: ethers.Contract,
    dia: bigint,
    isChecked?: boolean
  ): Promise<ethers.TransactionResponse>;
  async transfer(
    from: Wallet,
    to: string | ethers.Addressable,
    ...args: any[]
  ): Promise<ethers.TransactionResponse> {
    if (args.length > 2) {
      const [contract, dia, isChecked] = args;
      if (isChecked) {
        const { gasPrice } = await this.provider.getFeeData();
        const balance = await this.getBalance(from, contract);
        const totalAmount = dia + gasPrice;
        if (balance < totalAmount) throw new InsufficientBalance(gasPrice);
      }

      return contract.transfer(to, dia, from);
    } else {
      const [dia, isChecked] = args;
      if (isChecked) {
      }
      return from.sendTransaction({
        to: to,
        value: dia,
      });
    }
  }

  getContract(target: ethers.Addressable | string) {
    return new ethers.Contract(target, ERC20_ABI, this.provider);
  }
}
