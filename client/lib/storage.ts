// storage.ts
const STORAGE_PREFIX = "mobile_task_app_v1";
const USER_ID_KEY = "max_user_id";

// === ТИПЫ ДЛЯ MAX WebApp (обязательно!) ===
declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id?: number;
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      };
      ready?: () => void;
    };
  }
}

// === 1. ГЕНЕРАЦИЯ UID ДЛЯ РАЗРАБОТКИ ===
function generateDevUid(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// === 2. РАБОТА С UID В localStorage ===
function saveUserIdToStorage(newUid: string): void {
  try {
    const prevUid = localStorage.getItem(USER_ID_KEY);

    // Миграция данных при смене пользователя на одном устройстве
    if (prevUid && prevUid !== newUid) {
      const oldKey = `${STORAGE_PREFIX}_${prevUid}`;
      const newKey = `${STORAGE_PREFIX}_${newUid}`;
      const data = localStorage.getItem(oldKey);

      if (data && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, data);
        console.log(`Миграция данных: ${oldKey} → ${newKey}`);
      }
    }

    localStorage.setItem(USER_ID_KEY, newUid);
  } catch (e) {
    console.error("Ошибка сохранения UID", e);
  }
}

function loadUserIdFromStorage(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch (e) {
    return null;
  }
}

// === 3. ГЛАВНАЯ ФУНКЦИЯ: getUid() ===
export function getUid(): string {
  // 1. Из MAX WebApp
  if (typeof window !== "undefined" && window.WebApp?.initDataUnsafe?.user?.id) {
    const uid = window.WebApp.initDataUnsafe.user.id.toString();
    saveUserIdToStorage(uid);
    return uid;
  }

  // 2. Из localStorage
  const saved = loadUserIdFromStorage();
  if (saved) return saved;
}

// === 4. КЛЮЧ ДЛЯ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===
export function getStorageKey(): string {
  return `${STORAGE_PREFIX}_${getUid()}`;
}

// === 5. СОХРАНЕНИЕ И ЗАГРУЗКА СОСТОЯНИЯ ===
export function loadState(): any {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Ошибка загрузки состояния", e);
    return {};
  }
}

export function saveState(state: any): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
  } catch (e) {
    console.error("Ошибка сохранения состояния", e);
  }
}

// === 6. Принудительная установка UID ===
export function setUserId(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  saveUserIdToStorage(userId);
}

// === 7. Устаревшая функция (для совместимости) ===
export function getUserId(): string {
  return getUid();
}

// === 8. (Опционально) Очистка данных текущего пользователя ===
export function clearState(): void {
  try {
    localStorage.removeItem(getStorageKey());
    console.log("Данные пользователя очищены");
  } catch (e) {
    console.error("Ошибка очистки", e);
  }
}