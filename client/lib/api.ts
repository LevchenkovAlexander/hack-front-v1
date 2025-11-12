// client/lib/api.ts

import type {
  GenerateOrderRequest,
  GenerateOrderResponse,
  SubmitTaskBody,
  SubmitTaskResponse,
  Task,
} from "@shared/api";

// Базовый URL из .env
const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  console.warn("VITE_API_URL не задан! Используется fallback.");
}

/**
 * Универсальная функция для POST-запросов
 */
const post = async <T>(endpoint: string, body: any): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
};

/**
 * Универсальная функция для GET-запросов
 */
const get = async <T>(endpoint: string): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
};

/**
 * API функции
 */

// === Инициализация пользователя ===
export const initializeUser = async (userId: string): Promise<string> => {
  return get<string>(`/api/start/${userId}`);
};

// === Получить информацию о пользователе ===
export const getUser = async (userId: string): Promise<{
  id: number;
  username: string | null;
  freeTime: number | null;
}> => {
  return get<{ id: number; username: string | null; freeTime: number | null }>(
    `/api/user/${userId}`
  );
};

// === Получить задачи пользователя ===
export const getUserTasks = async (userId: string): Promise<Task[]> => {
  return get<Task[]>(`/api/user/${userId}/tasks`);
};

// === Добавить задачу ===
export const postTask = async (task: SubmitTaskBody): Promise<SubmitTaskResponse> => {
  return post<SubmitTaskResponse>("/api/task", task);
};

// === Сохранить свободные часы ===
export const postFreeHours = async (body: {
  freeHours: number;
  Uid: string;
}): Promise<void> => {
  await post("/api/free-hours", body);
};

// === Обновить результат задачи ===
export const postResult = async (body: {
  Uid: string;
  number: number;
  percent: number;
}): Promise<void> => {
  await post("/api/result", body);
};

// === Генерация порядка задач ===
export const generateOrderApi = async (
  body: GenerateOrderRequest
): Promise<Response> => {
  const url = `${API_BASE}/api/generate-order`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

// === Health check ===
export const healthCheck = async (): Promise<{
  status: string;
  localtonet: string;
  time: string;
}> => {
  return get<{ status: string; localtonet: string; time: string }>("/api/health");
};