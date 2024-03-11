import { Context, Markup } from "telegraf";
import { readFileSync } from "../lib/utils";

export const unsupportedToken = function (ctx: Context, token: string) {
  return ctx.replyWithMarkdownV2(
    readFileSync("./src/md/unsupported-token.md").replace(
      /%token%/,
      token
    ),
    Markup.inlineKeyboard([
      Markup.button.url("Check supported Tokens", "https://tak.finance"),
    ])
  );
};
