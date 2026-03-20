import { Bot, InlineKeyboard } from "grammy";
import { env } from "./env";

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

function buildAppKeyboard() {
  return new InlineKeyboard().webApp("Open Habit Tracker", env.WEBAPP_URL);
}

const welcomeText = [
  "Habit Tracker Mini App is ready.",
  "",
  "Open the Mini App to manage daily habits and your monthly sleep log."
].join("\n");

bot.command("start", async (context) => {
  await context.reply(welcomeText, {
    reply_markup: buildAppKeyboard()
  });
});

bot.command("app", async (context) => {
  await context.reply("Open Habit Tracker:", {
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

  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Open Habit Tracker",
      web_app: {
        url: env.WEBAPP_URL
      }
    }
  });

  await bot.start({
    onStart: () => {
      console.log(`Bot started with Mini App URL: ${env.WEBAPP_URL}`);
    }
  });
}

void bootstrap();
