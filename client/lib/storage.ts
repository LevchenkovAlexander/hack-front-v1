const STORAGE_PREFIX = "mobile_task_app_v1";

// Добавляем функцию для получения userId из параметров запуска
export function getUserIdFromLaunchParams(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Пытаемся получить userId из URL параметров (переданных ботом)
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || urlParams.get('user_id');
  
  return userId;
}

export function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  // Сначала проверяем параметры запуска
  const launchUserId = getUserIdFromLaunchParams();
  if (launchUserId) {
    // Сохраняем полученный userId для будущего использования
    setUserId(launchUserId);
    return launchUserId;
  }
  
  // Затем проверяем явно установленный userId
  const explicit = localStorage.getItem('user_id');
  if (explicit) return explicit;
  
  // Иначе генерируем гостевой ID
  let uuid = localStorage.getItem('user_uuid');
  if (!uuid) {
    uuid = `guest_${generateUuid()}`;
    try {
      localStorage.setItem('user_uuid', uuid);
    } catch (e) {}
  }
  return uuid;
}

// Остальные функции остаются без изменений
export function setUserId(userId: string) {
  if (typeof window === 'undefined') return;
  if (!userId) return;
  try {
    const prevKey = getStorageKey();
    const prevRaw = localStorage.getItem(prevKey);
    localStorage.setItem('user_id', userId);
    const newKey = `${STORAGE_PREFIX}_${userId}`;
    if (prevRaw && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, prevRaw);
    }
  } catch (e) {
    console.error('setUserId error', e);
  }
}

export function getStorageKey() {
  return `${STORAGE_PREFIX}_${getUserId()}`;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveState(state: any) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
  } catch (e) {}
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}