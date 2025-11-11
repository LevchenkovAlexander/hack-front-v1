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

export interface Task {
    Uid: bigint;
    name: string;
    deadline: string; // в формате "dd.MM.yyyy"
    complexityHours: number;
}

export interface GenerateOrderRequest {
  tasks: Task[];
  freeHoursToday?: number;
}

export interface GenerateOrderResponse {
  orderedTasks: Task[];
  message?: string;
}

export interface SubmitTaskRequest {
  task: Task;
}

export interface SubmitTaskResponse {
  ok: boolean;
  taskId?: string;
}
