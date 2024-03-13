import { ethers } from "ethers";

import { Message } from "telegraf/types";
import { Context, Telegraf } from "telegraf";

import Application from "../lib";
import { cleanText, readFileSync } from "../lib/utils";
import { STATUS_COMMAND } from "../constants";

export default function statusCommand(bot: Telegraf) {
  const echo = async function (ctx: Context) {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/status.md"));
  };

  bot.command(STATUS_COMMAND, async (ctx) => {
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 2) return echo(ctx);

    const [, txHash] = actions;
    /// validation
    if (!ethers.isAddress(txHash))
      return ctx.reply("Invalid transaction hash. Provide a valid hash.");

    const transaction =
      await Application.instance.wallet.provider.getTransaction(txHash);
    await ctx.replyWithMarkdownV2(
      cleanText(
        readFileSync("./src/md/status-info.md", "utf-8")
          .replace(/%confimations%/, transaction.confirmations.toString())
          .replace(/%isMined%/, transaction.isMined.toString())
          .replace(
            /%maxFeePerGas%/,
            ethers.formatUnits(transaction.maxFeePerGas)
          )
          .replace(/%gasPrice%/, ethers.formatUnits(transaction.gasPrice))
      )
    );
  });
}
