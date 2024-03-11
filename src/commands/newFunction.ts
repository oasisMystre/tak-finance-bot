import { Telegraf } from "telegraf";

import { readFileSync } from "../lib/utils";
import { NEW_FUNCTION_COMMAND } from "../constants";

export default function newFunctionCommand(bot: Telegraf) {
  bot.hears(NEW_FUNCTION_COMMAND, async (ctx) => {
    await ctx.replyWithMarkdownV2(
      readFileSync("./src/md/new-function.md")
    );
  });
}
