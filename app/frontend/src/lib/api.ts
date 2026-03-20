export interface ApiUser {
  id: string;
  telegramId: string;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  area: string;
  difficulty: "easy" | "medium" | "hard";
  targetMinutes: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  completedOnDate: boolean;
  streak: number;
  totalCompletedCount: number;
}

export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

interface MeResponse {
  user: ApiUser;
}

export interface HomeSummary {
  greetingName: string;
  today: string;
  metrics: {
    activeHabitsCount: number;
    completedHabitsTodayCount: number;
    completionRate: number;
  };
  topHabit: {
    id: string;
    title: string;
    icon: string;
    streak: number;
  } | null;
  lastSleep: SleepEntry | null;
}

interface HabitsResponse {
  referenceDate: string;
  habits: Habit[];
}

interface SleepMonthResponse {
  month: string;
  entries: SleepEntry[];
  recentEntries: SleepEntry[];
}

export interface HabitPayload {
  title: string;
  icon: string;
  area: string;
  difficulty: Habit["difficulty"];
  targetMinutes?: number | null;
  isArchived?: boolean;
}

export interface SleepPayload {
  date: string;
  bedtime: string;
  wakeTime: string;
}

const API_BASE_URL: string = typeof import.meta.env.VITE_API_BASE_URL === "string"
  ? import.meta.env.VITE_API_BASE_URL
  : "/api";
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  authWithTelegram(initData: string) {
    return request<AuthResponse>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData })
    });
  },
  devLogin() {
    return request<AuthResponse>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({})
    });
  },
  getMe() {
    return request<MeResponse>("/auth/me");
  },
  getHomeSummary(date: string) {
    return request<HomeSummary>(`/home/summary?date=${encodeURIComponent(date)}`);
  },
  getHabits(date: string, status: "active" | "archived" | "all") {
    return request<HabitsResponse>(
      `/habits?date=${encodeURIComponent(date)}&status=${encodeURIComponent(status)}`
    );
  },
  createHabit(payload: HabitPayload) {
    return request<{ habit: Habit }>("/habits", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateHabit(habitId: string, payload: Partial<HabitPayload>) {
    return request<{ habit: Habit }>(`/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  toggleHabit(habitId: string, date: string, completed?: boolean) {
    return request<{ habit: Habit; date: string }>(`/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ date, completed })
    });
  },
  deleteHabit(habitId: string) {
    return request<{ success: boolean }>(`/habits/${habitId}`, {
      method: "DELETE"
    });
  },
  getSleepMonth(month: string) {
    return request<SleepMonthResponse>(`/sleep?month=${encodeURIComponent(month)}`);
  },
  createSleep(payload: SleepPayload) {
    return request<{ entry: SleepEntry }>("/sleep", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateSleep(entryId: string, payload: SleepPayload) {
    return request<{ entry: SleepEntry }>(`/sleep/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  deleteSleep(entryId: string) {
    return request<{ success: boolean }>(`/sleep/${entryId}`, {
      method: "DELETE"
    });
  }
};


