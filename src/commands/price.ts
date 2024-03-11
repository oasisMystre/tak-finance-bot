import { Message } from "telegraf/types";
import { Context, Telegraf } from "telegraf";

import { PRICE_COMMAND } from "../constants";
import { readFileSync } from "../lib/utils";
import { unsupportedToken } from "./shared";

export default function Price(bot: Telegraf) {
  const echo = async (ctx: Context) => {
    await ctx.replyWithMarkdownV2(
      "Please send, \n _/price Token_ \n E.g /Price ETH"
    );
  };

  bot.command(PRICE_COMMAND, async (ctx) => {
    const message = ctx.message as Message.TextMessage;
    const actions = message.text.split(" ");
    if (actions.length < 2) echo(ctx);
    const [, token] = actions;
    switch (token) {
      case "ETH":
        /// Todo replace
        await ctx.replyWithMarkdownV2(
          readFileSync("./src/md/price.md")
        );
        break;
      default:
        await unsupportedToken(ctx, token);
    }
  });
}
