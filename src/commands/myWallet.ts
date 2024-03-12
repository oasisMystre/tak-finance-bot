import { TransactionResponse, ethers } from "ethers";

import type { Message } from "telegraf/types";
import { Context, Markup, Telegraf } from "telegraf";

import Application from "../lib";
import {
  BALANCE_COMMAND,
  DEPOSIT_ACTION,
  DEPOSIT_COMMAND,
  MY_WALLET_COMMAND,
  PRIVATE_KEY_ACTION,
  WITHDRAW_ACTION,
  WITHDRAW_COMMAND,
} from "../constants";
import { cleanText, readFileSync } from "../lib/utils";
import { unsupportedToken } from "./shared";
import { InsufficientBalance } from "../lib/controllers/exceptions";
import { SupportedAddress } from "../data/addressList";

export default function MyWalletCommand(bot: Telegraf) {
  const echoBalance = async (ctx: Context, balance: bigint) => {
    await ctx.replyWithMarkdownV2(
      cleanText(
        readFileSync("./src/md/wallet.md", "utf-8").replace(
          /%balance%/,
          ethers.formatUnits(balance)
        )
      ),
      Markup.inlineKeyboard([
        Markup.button.callback("Withdraw", WITHDRAW_ACTION),
        Markup.button.callback("Deposit", DEPOSIT_ACTION),
        Markup.button.callback("Export Wallet", PRIVATE_KEY_ACTION),
      ])
    );
  };

  const echoEthBalance = async (ctx: Context) => {
    const userId = ctx.message.from.username;
    const controller = Application.instance.wallet;
    const wallet = await controller.getWallet(userId);
    const balance = await controller.getBalance(wallet);
    await echoBalance(ctx, balance);
  };

  bot.hears(MY_WALLET_COMMAND, echoEthBalance);

  const echoDeposit = async function (ctx: Context) {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/deposit.md"));
  };

  const echoWithdraw = async function (ctx: Context) {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/withdraw.md"));
  };

  bot.action(DEPOSIT_ACTION, echoDeposit);
  bot.action(WITHDRAW_ACTION, echoWithdraw);
  bot.action(PRIVATE_KEY_ACTION, async (ctx) => {
    const userId = ctx.from.username;
    const wallet = await Application.instance.wallet.getWallet(userId);
    await ctx.replyWithMarkdownV2(
      readFileSync("./src/md/private.md").replace(
        /%private_key%/,
        wallet.privateKey
      )
    );
  });

  bot.command(DEPOSIT_COMMAND, async (ctx) => {
    /// fix: data input validation
    const userId = ctx.message.from.username;
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 2) return echoDeposit(ctx);

    const [, token] = actions; /// milestone: can send from other chain
    const wallet = await Application.instance.wallet.getWallet(userId);
    await ctx.replyWithMarkdownV2("Please deposit to _" + wallet.address + "_");
  });

  bot.command(WITHDRAW_COMMAND, async (ctx) => {
    /// fix: data input validation
    const userId = ctx.message.from.username;
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");

    if (actions.length < 4) return echoWithdraw(ctx);

    let [, amount, token, address] = actions;
    token = token.toLowerCase();
    const wallet = await Application.instance.wallet.getWallet(userId);

    /// Only ETH is supported for now
    let tx: TransactionResponse;

    try {
      if (token === "eth") {
        tx = await Application.instance.wallet.transfer(
          wallet,
          address,
          ethers.parseUnits(amount)
        );
      } else if (Object.keys(SupportedAddress).includes(token)) {
        const address = SupportedAddress[token];
        const contract = Application.instance.wallet.getContract(address);
        const decimals = await contract.decimals();
        const dia = ethers.parseUnits(amount, decimals);
        tx = await Application.instance.wallet.transfer(
          wallet,
          address,
          contract,
          dia
        );
      } else return unsupportedToken(ctx, token);
    } catch (error) {
      return ctx.replyWithMarkdownV2((error as Error).message);
    }

    ctx.replyWithMarkdownV2(
      readFileSync("./src/md/transaction-processing.md").replace(
        /%tx%/,
        tx.hash
      )
    );
  });

  bot.command(BALANCE_COMMAND, async (ctx) => {
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 2) return echoEthBalance(ctx);
    const [, token] = actions;

    switch (token) {
      case "ETH":
        await echoEthBalance(ctx);
        break;
      default:
        await unsupportedToken(ctx, token);
        break;
    }
  });
}
