import { buildApp } from "./app";
import { config } from "./config";

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: config.PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
