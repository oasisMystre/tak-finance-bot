import QRCode from "qrcode";
import { TransactionResponse, ethers } from "ethers";

import type { Message } from "telegraf/types";
import { Context, Input, Markup, Telegraf } from "telegraf";

import Application from "../lib";
import { cleanText, readFileSync } from "../lib/utils";

import { unsupportedToken } from "./shared";
import { ApplicationContext } from "../types";
import { SupportedAddress } from "../data/addressList";
import {
  BALANCE_COMMAND,
  DEPOSIT_ACTION,
  DEPOSIT_COMMAND,
  MY_WALLET_COMMAND,
  PRIVATE_KEY_ACTION,
  WITHDRAW_ACTION,
  WITHDRAW_COMMAND,
} from "../constants";

export default function MyWalletCommand(bot: Telegraf<ApplicationContext>) {
  const echoBalance = async (ctx: Context, balance: bigint) => {
    const inlines = [
      Markup.button.callback("Deposit", DEPOSIT_ACTION),
      Markup.button.callback(
        "Withdraw",
        WITHDRAW_ACTION,
        ctx.chat.type !== "private"
      ),
      Markup.button.callback(
        "Export Wallet",
        PRIVATE_KEY_ACTION,
        ctx.chat.type !== "private"
      ),
    ];

    await ctx.replyWithMarkdownV2(
      cleanText(
        readFileSync("./src/md/wallet.md", "utf-8").replace(
          /%balance%/,
          ethers.formatUnits(balance)
        )
      ),
      Markup.inlineKeyboard(inlines)
    );
  };

  const echoEthBalance = async (ctx: ApplicationContext) => {
    const controller = Application.instance.wallet;
    const balance = await controller.getBalance(ctx.wallet);
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
    await ctx.replyWithMarkdownV2(
      readFileSync("./src/md/private.md").replace(
        /%private_key%/,
        ctx.wallet.privateKey
      )
    );
  });

  bot.command(DEPOSIT_COMMAND, async (ctx) => {
    /// fix: data input validation
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 2) return echoDeposit(ctx);

    const [, token] = actions; /// milestone: can send from other chain
    await ctx.replyWithPhoto(
      Input.fromBuffer(await QRCode.toBuffer(ctx.wallet.address)),
      {
        parse_mode: "Markdown",
        caption: "Please deposit to _" + ctx.wallet.address + "_",
      }
    );
  });

  bot.command(WITHDRAW_COMMAND, async (ctx) => {
    if (ctx.chat.type === "private") {
      /// fix: data input validation
      const message = ctx.message as Message.TextMessage;
      const actions = message.text.split(" ");

      if (actions.length < 4) return echoWithdraw(ctx);

      let [, amount, token, address] = actions;
      token = token.toLowerCase();

      /// Only ETH is supported for now
      let tx: TransactionResponse;

      try {
        if (token === "eth") {
          tx = await Application.instance.wallet.transfer(
            ctx.wallet,
            address,
            ethers.parseUnits(amount)
          );
        } else if (Object.keys(SupportedAddress).includes(token)) {
          const address = SupportedAddress[token];
          const contract = Application.instance.wallet.getContract(address);
          const decimals = await contract.decimals();
          const dia = ethers.parseUnits(amount, decimals);
          tx = await Application.instance.wallet.transfer(
            ctx.wallet,
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
    }

    return;
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
