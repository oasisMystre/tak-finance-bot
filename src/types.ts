import { ethers } from "ethers";
import { Context } from "telegraf";

export interface ApplicationContext extends Context {
  wallet: ethers.Wallet;
}
