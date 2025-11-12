// client/lib/api.ts

import type {
  Task,
  GenerateOrderRequest,
  GenerateOrderResponse,
  SubmitTaskResponse,
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
 * API функции
 */
export const postTask = async (task: Task): Promise<SubmitTaskResponse> => {
  return post<SubmitTaskResponse>("/api/task", task);
};

export const postFreeHours = async (body: {
  freeHours: number;
  Uid: string;
}): Promise<void> => {
  await post("/api/free-hours", body);
};

export const postResult = async (body: {
  Uid: string;
  number: number;
  percent: number;
}): Promise<void> => {
  await post("/api/result", body);
};

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