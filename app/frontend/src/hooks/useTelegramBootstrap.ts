import { useEffect, useState } from "react";
import { api, ApiUser, setAuthToken } from "../lib/api";
import { getTelegramWebApp } from "../lib/telegram";

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
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();
      webApp?.setHeaderColor?.("#fbf6f3");
      webApp?.setBackgroundColor?.("#fbf6f3");

      try {
        const storedToken = window.localStorage.getItem(SESSION_TOKEN_KEY);
        let user: ApiUser | null = null;

        if (webApp?.initData) {
          const session = await api.authWithTelegram(webApp.initData);
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
          throw new Error("Telegram init data is missing. Open the app inside Telegram or enable local dev auth.");
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
