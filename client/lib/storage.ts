const STORAGE_PREFIX = "mobile_task_app_v1";

// Тестовый Uid для разработки (временно используется вместо получения из Max API)
const TEST_UID = 123456789n;

/**
 * Получает Uid пользователя.
 * ВАЖНО: На данный момент возвращает тестовый Uid для разработки.
 * В будущем будет получать Uid из Max API или URL параметров.
 * 
 * @returns {bigint} Uid пользователя (всегда not null)
 */
export function getUid(): bigint {
  // === ВРЕМЕННО ОТКЛЮЧЕНО: Получение Uid из URL параметров ===
  // Эта логика будет включена когда Max API будет готово предоставлять Uid
  /*
  const launchUid = getUserIdFromLaunchParams();
  if (launchUid) {
    setUserId(launchUid);
    return launchUid;
  }
  
  const explicit = localStorage.getItem('user_id');
  if (explicit) return BigInt(explicit);
  
  // Ошибка: не удалось получить Uid
  console.error("ОШИБКА: Не удалось получить Uid пользователя из URL параметров или localStorage.");
  throw new Error("Uid пользователя не найден. Проверьте URL параметры или Max API.");
  */
  
  // === ТЕКУЩАЯ РЕАЛИЗАЦИЯ: Возвращаем тестовый Uid ===
  return TEST_UID;
}

/**
 * Получает Uid из параметров запуска (URL параметры).
 * ВАЖНО: На данный момент функция отключена, но код сохранен для будущего использования.
 * 
 * @returns {bigint | null} Uid из URL параметров или null
 */
export function getUserIdFromLaunchParams(): bigint | null {
  if (typeof window === 'undefined') return null;
  
  // Пытаемся получить userId из URL параметров (переданных ботом)
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || urlParams.get('user_id');
  
  return userId ? BigInt(userId) : null;
}

/**
 * @deprecated Используйте getUid() вместо этой функции
 * Оставлена для обратной совместимости
 */
export function getUserId(): bigint {
  return getUid();
}

// Остальные функции остаются без изменений
export function setUserId(userId: bigint) {
  if (typeof window === 'undefined') return;
  if (!userId) return;
  try {
    const prevKey = getStorageKey();
    const prevRaw = localStorage.getItem(prevKey);
    localStorage.setItem('user_id', userId.toString());
    const newKey = `${STORAGE_PREFIX}_${userId.toString()}`;
    if (prevRaw && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, prevRaw);
    }
  } catch (e) {
    console.error('setUserId error', e);
  }
}

export function getStorageKey() {
  return `${STORAGE_PREFIX}_${getUid().toString()}`;
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

// function generateUuid() {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === 'x' ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }
