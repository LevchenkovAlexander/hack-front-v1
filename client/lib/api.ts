// client/lib/api.ts

import type {
  GenerateOrderRequest,
  GenerateOrderResponse,
  SubmitTaskBody,
  SubmitTaskResponse,
  Task,
} from "@shared/api";

// Базовый URL из .env
// Если не задан, используются относительные пути (прокси через Vercel)
const API_BASE = import.meta.env.VITE_API_URL;

// В production на Vercel рекомендуется НЕ задавать VITE_API_URL,
// чтобы использовать прокси через Vercel rewrites для обхода CORS
if (API_BASE) {
  console.log("VITE_API_URL задан:", API_BASE);
  console.warn("⚠️ Если возникают проблемы с CORS, удалите VITE_API_URL для использования прокси через Vercel");
} else {
  console.log("VITE_API_URL не задан. Используются относительные пути через Vercel прокси.");
}

/**
 * Нормализует базовый URL API, убирая завершающий слэш
 */
function normalizeApiBase(base: string | undefined): string {
  if (!base) return '';
  // Убираем завершающий слэш
  return base.replace(/\/$/, '');
}

/**
 * Формирует полный URL для API запроса
 * Убирает дублирование /api в URL
 * Если API_BASE не задан, использует относительный путь (через Vercel прокси)
 */
function buildApiUrl(endpoint: string): string {
  // Если API_BASE не задан, используем относительный путь
  // Vercel будет проксировать через rewrites в vercel.json
  if (!API_BASE) {
    // Убеждаемся, что endpoint начинается с /api
    if (endpoint.startsWith('/api/')) {
      return endpoint;
    } else if (endpoint.startsWith('/api')) {
      return endpoint;
    } else if (endpoint.startsWith('/')) {
      return `/api${endpoint}`;
    } else {
      return `/api/${endpoint}`;
    }
  }
  
  const normalizedBase = normalizeApiBase(API_BASE);
  
  // Нормализуем endpoint - убираем начальный слэш для упрощения
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Убираем /api из начала endpoint, если он есть
  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  } else if (cleanEndpoint === 'api') {
    cleanEndpoint = '';
  }
  
  // Проверяем, заканчивается ли базовый URL на /api
  const baseEndsWithApi = normalizedBase.endsWith('/api');
  
  // Формируем финальный URL
  let finalUrl: string;
  if (baseEndsWithApi) {
    // Базовый URL уже содержит /api, просто добавляем endpoint
    finalUrl = cleanEndpoint 
      ? `${normalizedBase}/${cleanEndpoint}`
      : normalizedBase;
  } else {
    // Базовый URL не содержит /api, добавляем /api и endpoint
    finalUrl = cleanEndpoint 
      ? `${normalizedBase}/api/${cleanEndpoint}`
      : `${normalizedBase}/api`;
  }
  
  return finalUrl;
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
  
  // Логируем URL для отладки
  console.log("API Request URL:", url);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response;
  } catch (error) {
    // Если это CORS ошибка, выводим понятное сообщение
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