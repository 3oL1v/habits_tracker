import { Bot, GrammyError, InlineKeyboard } from "grammy";
import { env } from "./env";

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
const webAppUrl = new URL(env.WEBAPP_URL);
const isLocalWebAppUrl = ["localhost", "127.0.0.1"].includes(webAppUrl.hostname);

function buildAppKeyboard() {
  if (isLocalWebAppUrl) {
    return new InlineKeyboard().url("Open Habit Tracker", env.WEBAPP_URL);
  }

  return new InlineKeyboard().webApp("Open Habit Tracker", env.WEBAPP_URL);
}

const welcomeText = [
  "Habit Tracker Mini App is ready.",
  "",
  "Open the Mini App to manage daily habits and your monthly sleep log.",
  ...(isLocalWebAppUrl
    ? ["", "Local mode: the button opens your browser on this computer."]
    : [])
].join("\n");

bot.command("start", async (context) => {
  await context.reply(welcomeText, {
    reply_markup: buildAppKeyboard()
  });
});

bot.command("app", async (context) => {
  await context.reply(isLocalWebAppUrl ? "Open Habit Tracker in your browser:" : "Open Habit Tracker:", {
    reply_markup: buildAppKeyboard()
  });
});

bot.catch((error) => {
  console.error("Telegram bot error", error.error);
});

async function bootstrap() {
  await bot.api.setMyCommands([
    { command: "start", description: "Open the Habit Tracker bot" },
    { command: "app", description: "Open the Mini App" }
  ]);

  if (isLocalWebAppUrl) {
    console.log(
      `Bot started in local URL mode: ${env.WEBAPP_URL}. Menu button is skipped because Telegram Mini App mode expects a public URL.`
    );
  } else {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "Open Habit Tracker",
        web_app: {
          url: env.WEBAPP_URL
        }
      }
    });
  }

  await bot.start({
    onStart: () => {
      console.log(`Bot started with Mini App URL: ${env.WEBAPP_URL}`);
    }
  });
}

void bootstrap().catch((error: unknown) => {
  if (error instanceof GrammyError && error.method === "getUpdates" && error.error_code === 409) {
    console.error(
      "Telegram bot polling conflict: another bot instance is already running. Stop all duplicate bot processes or deployments that use the same TELEGRAM_BOT_TOKEN."
    );
    return;
  }

  console.error("Telegram bot startup failed", error);
  process.exit(1);
});
