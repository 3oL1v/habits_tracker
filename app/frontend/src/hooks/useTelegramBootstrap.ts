import { useEffect, useState } from "react";
import { api, ApiUser, setAuthToken } from "../lib/api";
import { getTelegramWebApp, waitForTelegramInitData, waitForTelegramWebApp } from "../lib/telegram";

const SESSION_TOKEN_KEY = "habit-tracker-session-token";

interface BootstrapState {
  status: "loading" | "ready" | "error";
  user: ApiUser | null;
  errorMessage: string | null;
}

export function useTelegramBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({
    status: "loading",
    user: null,
    errorMessage: null
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const webApp = await waitForTelegramWebApp();
      webApp?.ready();
      webApp?.expand();
      webApp?.setHeaderColor?.("#fbf6f3");
      webApp?.setBackgroundColor?.("#fbf6f3");

      try {
        const storedToken = window.localStorage.getItem(SESSION_TOKEN_KEY);
        let user: ApiUser | null = null;
        const initData = await waitForTelegramInitData();

        if (initData) {
          const session = await api.authWithTelegram(initData);
          window.localStorage.setItem(SESSION_TOKEN_KEY, session.token);
          setAuthToken(session.token);
          user = session.user;
        } else if (storedToken) {
          setAuthToken(storedToken);
        } else if (import.meta.env.VITE_DEV_AUTH === "true") {
          const session = await api.devLogin();
          window.localStorage.setItem(SESSION_TOKEN_KEY, session.token);
          setAuthToken(session.token);
          user = session.user;
        } else {
          const availableWebApp = getTelegramWebApp();
          const hasTelegramContext = Boolean(availableWebApp ?? window.Telegram);
          throw new Error(
            hasTelegramContext
              ? "Telegram Mini App launched, but init data did not arrive. Close the webview, reopen it from a fresh /start message, and try again."
              : "Telegram Mini App SDK is missing. Open the app from Telegram or enable local dev auth."
          );
        }

        if (!user) {
          const me = await api.getMe();
          user = me.user;
        }

        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          user,
          errorMessage: null
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          user: null,
          errorMessage: error instanceof Error ? error.message : "Failed to initialize the app"
        });
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
