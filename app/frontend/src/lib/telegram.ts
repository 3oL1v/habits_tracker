export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export async function waitForTelegramWebApp(timeoutMs = 4000): Promise<TelegramWebApp | null> {
  const startedAt = Date.now();

  return await new Promise((resolve) => {
    const check = () => {
      const webApp = getTelegramWebApp();

      if (webApp) {
        resolve(webApp);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

export async function waitForTelegramInitData(timeoutMs = 4000): Promise<string> {
  const startedAt = Date.now();

  return await new Promise((resolve) => {
    const check = () => {
      const webApp = getTelegramWebApp();
      const initData = webApp?.initData?.trim();

      if (initData) {
        resolve(initData);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve("");
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}
