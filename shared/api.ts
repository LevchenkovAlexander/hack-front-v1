/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Локальное представление задачи (для UI)
export interface Task {
    id?: string; // опциональный ID для локального хранения
    name: string;
    deadline?: string; // в формате "dd.MM.yyyy"
    complexityHours: number;
}

// Представление задачи для API
export interface TaskForApi {
    name: string;
    deadline?: string; // в формате "dd.MM.yyyy"
    estimatedHours: number;
}

export interface GenerateOrderRequest {
  Uid: bigint; // Uid пользователя (всегда not null)
  tasks: TaskForApi[];
  freeHours?: number; // свободные часы сегодня
}

export interface GenerateOrderResponse {
  orderedTasks: Task[]; // возвращаются задачи в том же формате, что и локальные
  message?: string;
}

// Тело запроса для отправки задачи
export interface SubmitTaskBody {
  Uid: bigint;
  name: string;
  deadline?: string;
  estimatedHours: number;
}

export interface SubmitTaskResponse {
  ok: boolean;
  taskId?: string;
}
