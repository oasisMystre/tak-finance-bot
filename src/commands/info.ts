import { Telegraf } from "telegraf";
import { ABOUT_COMMAND, HELP_COMMAND, SOCIALS_COMMAND } from "../constants";
import { readFileSync } from "../lib/utils";

export default function InfoCommand(bot: Telegraf) {
  bot.command(HELP_COMMAND, async (ctx) => {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/help.md"));
  });

  bot.command(ABOUT_COMMAND, async (ctx) => {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/about.md"));
  });

  bot.command(SOCIALS_COMMAND, async (ctx) => {
    await ctx.replyWithMarkdownV2(readFileSync("./src/md/socials.md"));
  });
}
