import "dotenv/config";
import { fastify } from "fastify";
import { Markup, Telegraf } from "telegraf";
import admin, { ServiceAccount } from "firebase-admin";

import { readFileSync } from "./lib/utils";
import tipCommand from "./commands/tip";
import infoCommand from "./commands/info";
import statusCommand from "./commands/status";
import MyWalletCommand from "./commands/myWallet";
import newFunctionCommand from "./commands/newFunction";
import serviceAccount from "../assets/serviceAccount.json";
import {
  ABOUT_COMMAND,
  BALANCE_COMMAND,
  DEPOSIT_COMMAND,
  HELP_COMMAND,
  MY_WALLET_COMMAND,
  NEW_FUNCTION_COMMAND,
  PRICE_COMMAND,
  SOCIALS_COMMAND,
  START_COMMAND,
  STATUS_COMMAND,
  TIP_COMMAND,
  TOKENS_COMMAND,
  WITHDRAW_COMMAND,
} from "./constants";
import { ApplicationContext } from "./types";
import Application from "./lib";

/// Create Wallet
function createBot(accessToken: string) {
  const bot = new Telegraf<ApplicationContext>(accessToken);

  bot.use(async (ctx, next) => {
    ctx.wallet = await Application.instance.wallet.getWallet(ctx.from.username);
    await next();
  });

  bot.telegram.setMyCommands([
    {
      command: START_COMMAND,
      description: "Use /start to update the BOT to the latest version",
    },
    {
      command: TIP_COMMAND,
      description: "Tip a user individually or from group",
    },
    {
      command: BALANCE_COMMAND,
      description: "Check token or coin balance",
    },
    {
      command: WITHDRAW_COMMAND,
      description: "Withdraw token or coin from wallet",
    },
    {
      command: DEPOSIT_COMMAND,
      description: "Deposit token or coin to wallet",
    },
    // {
    //   command: PRICE_COMMAND,
    //   description: "Check token or coin price",
    // },
    {
      command: STATUS_COMMAND,
      description: "Get Transaction Status from txHash",
    },
    {
      command: TOKENS_COMMAND,
      description: "List all supported token on TakFinance",
    },
    {
      command: HELP_COMMAND,
      description: "Answers to your question",
    },
    {
      command: ABOUT_COMMAND,
      description: "What is this bot about?",
    },
    {
      command: SOCIALS_COMMAND,
      description: "Check our socials and website",
    },
  ]);

  bot.start(async (ctx) => {
    ctx.replyWithMarkdownV2(
      readFileSync("./src/md/start.md"),
      ctx.chat.type == "group"
        ? Markup.removeKeyboard()
        : Markup.keyboard([MY_WALLET_COMMAND, NEW_FUNCTION_COMMAND])
    );
  });

  infoCommand(bot);
  tipCommand(bot);
  statusCommand(bot);
  MyWalletCommand(bot);
  newFunctionCommand(bot);

  return bot;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

function testRun() {
  const bot = createBot(process.env.TELEGRAM_ACCESS_TOKEN);
  console.log("Bot starting....");
  bot.launch();
  process.once("SIGINT", () => bot.stop);
}

async function productionRun() {
  const app = fastify({
    logger: true,
  });
  const bot = createBot(process.env.TELEGRAM_ACCESS_TOKEN!);

  const webhook = (await bot.createWebhook({
    domain: process.env.RENDER_EXTERNAL_HOSTNAME,
  })) as any;

  app.post(`/telegraf/${bot.secretPathComponent()}`, webhook);

  const port = Number(process.env.PORT);
  try {
    await app.listen({ port, host: process.env.HOST });
    console.log("Listening on port", port);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if ("RENDER" in process.env) productionRun();
else testRun();
