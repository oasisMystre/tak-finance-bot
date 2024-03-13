import { ethers } from "ethers";
import { Message } from "telegraf/types";
import { Context, Markup, Telegraf } from "telegraf";

import Application from "../lib";
import { readFileSync } from "../lib/utils";

import { TIP_COMMAND } from "../constants";
import { ApplicationContext } from "../types";

export default function tipCommand(bot: Telegraf<ApplicationContext>) {
  const echo = async function (ctx: Context) {
    const username = ctx.message.from.username;
    await ctx.replyWithMarkdownV2(
      readFileSync("./src/md/tip.md").replace("%username%", username)
    );
  };

  bot.command(TIP_COMMAND, async (ctx) => {
    /// Todo validate bot input
    const userId = ctx.message.from.username;
    const message = ctx.message as Message.TextMessage;

    const actions = message.text.split(" ");
    if (actions.length < 4) return echo(ctx);
    /// Todo switch to userId
    const [, amount, token, ...usernames] = actions;
    const messages = [];
    const tips = await Application.instance.tip.tipUsers(
      ctx.wallet,
      ethers.parseUnits(amount),
      ...usernames
    );

    let index = 0;
    for (const tip of tips) {
      const username = usernames[index];
      try {
        const tx = await tip;
        messages.push("@" + username + `: Tip successful (${tx.hash})\n`);
      } catch (error) {
        messages.push(username + ": Tip failed\n");
      }

      index++;
    }

    await ctx.replyWithMarkdownV2(
      `${message.from.username} Tip details,\n` + messages,
      Markup.inlineKeyboard([
        Markup.button.url("Why failed to tip?", "https://tak.finance"),
      ])
    );
  });
}
