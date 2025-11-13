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

// Заголовок для обхода предупреждения LocalToNet
const LOCALTONET_HEADER = {
  "localtonet-skip-warning": "true",
};

/**
 * Нормализует базовый URL API, убирая завершающий слэш
 */
function normalizeApiBase(base: string | undefined): string {
  if (!base) return '';
  return base.replace(/\/$/, '');
}

/**
 * Формирует полный URL для API запроса
 */
function buildApiUrl(endpoint: string): string {
  if (!API_BASE) {
    if (endpoint.startsWith('/api/')) return endpoint;
    if (endpoint.startsWith('/api')) return endpoint;
    if (endpoint.startsWith('/')) return `/api${endpoint}`;
    return `/api/${endpoint}`;
  }

  const normalizedBase = normalizeApiBase(API_BASE);
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  } else if (cleanEndpoint === 'api') {
    cleanEndpoint = '';
  }

  const baseEndsWithApi = normalizedBase.endsWith('/api');
  return cleanEndpoint
    ? baseEndsWithApi
      ? `${normalizedBase}/${cleanEndpoint}`
      : `${normalizedBase}/api/${cleanEndpoint}`
    : baseEndsWithApi
    ? normalizedBase
    : `${normalizedBase}/api`;
}

/**
 * Универсальная функция для POST-запросов
 */
const post = async <T>(endpoint: string, body: any): Promise<T> => {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...LOCALTONET_HEADER,
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
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...LOCALTONET_HEADER,
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
  const url = buildApiUrl("/generate-order");
  console.log("API Request URL:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "localtonet-skip-warning": "true", // ← ОБЯЗАТЕЛЬНО!
      },
      body: JSON.stringify(body),
    });
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error("CORS Error: Запрос заблокирован браузером. Убедитесь, что:");
      console.error("1. API сервер настроен для обработки CORS запросов");
      console.error("2. Или используйте прокси через Vercel API routes");
      console.error("URL:", url);
    }
    throw error;
  }
};

// === Health check ===
export const healthCheck = async (): Promise<{
  status: string;
  localtonet: string;
  time: string;
}> => {
  return get<{ status: string; localtonet: string; time: string }>("/api/health");
};