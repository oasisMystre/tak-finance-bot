import { ethers } from "ethers";

import { Message } from "telegraf/types";
import { Context, Telegraf } from "telegraf";

import Application from "../lib";
import { readFileSync } from "../lib/utils";
import { STATUS_COMMAND } from "../constants";

export default function statusCommand(bot: Telegraf) {
  const echo = async function (ctx: Context) {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/status.md"));
  };

  bot.command(STATUS_COMMAND, async (ctx) => {
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 1) return echo(ctx);

    const [, txHash] = actions;
    const transaction =
      await Application.instance.wallet.provider.getTransaction(txHash);
    await ctx.replyWithMarkdownV2(
      readFileSync("./src/md/status-info.md")
        .replace(/%confimations%/, transaction.confirmations.toString())
        .replace(/%isMined%/, transaction.isMined.toString())
        .replace(/%maxFeePerGas%/, ethers.formatUnits(transaction.maxFeePerGas))
        .replace(/%gasPrice%/, ethers.formatUnits(transaction.gasPrice))
    );
  });
}