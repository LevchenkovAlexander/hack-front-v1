// client/pages/Index.tsx
import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import DatePicker from "../components/DatePicker";
import { Task, GenerateOrderRequest, GenerateOrderResponse, SubmitTaskResponse } from "@shared/api";
import { postTask, postFreeHours, postResult, generateOrderApi } from "../lib/api";
import { loadState, saveState, setUserId, getUserIdFromLaunchParams } from "../lib/storage";

export default function Index() {
  // === ИНИЦИАЛИЗАЦИЯ USER ID ===
  useEffect(() => {
    const launchUserId = getUserIdFromLaunchParams();
    if (launchUserId) {
      console.log('Received userId from bot:', launchUserId);
      setUserId(launchUserId);
      setUserIdState(launchUserId);
    } else if (window.WebApp?.initDataUnsafe?.user?.id) {
      const id = String(window.WebApp.initDataUnsafe.user.id);
      console.log('User ID from MAX WebApp:', id);
      setUserId(id);
      setUserIdState(id);
    }
  }, []);

  // === ЗАГРУЗКА СОСТОЯНИЯ ===
  const stored = loadState();
  const [tasks, setTasks] = useState<Task[]>(stored.tasks ?? []);
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(stored.orderedTasks ?? []);
  const [freeHours, setFreeHours] = useState<number | "">(stored.freeHours ?? "");
  const [savedFreeHours, setSavedFreeHours] = useState<number | "">(stored.savedFreeHours ?? "");
  const [resultNumber, setResultNumber] = useState<string>(stored.resultNumber ?? "");
  const [resultPercent, setResultPercent] = useState<number | "">(stored.resultPercent ?? "");
  const [newName, setNewName] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState<string>("");
  const [newComplexity, setNewComplexity] = useState<number | "">("");
  const [userId, setUserIdState] = useState<string | null>(null);

  // === СОХРАНЕНИЕ В LOCALSTORAGE ===
  useEffect(() => {
    saveState({ tasks, orderedTasks, freeHours, savedFreeHours, resultNumber, resultPercent });
  }, [tasks, orderedTasks, freeHours, savedFreeHours, resultNumber, resultPercent]);

  // === АНИМАЦИЯ ===
  const [animationStage, setAnimationStage] = useState<'idle' | 'out' | 'in'>('idle');

  // === ВРЕМЯ ===
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // === ГЕНЕРАЦИЯ ПОРЯДКА ===
  const generateOrder = async () => {
    if (animationStage !== 'idle') return;
    setAnimationStage('out');
    setTimeout(async () => {
      const body: GenerateOrderRequest = { 
        tasks, 
        freeHours: typeof freeHours === "number" ? freeHours : undefined 
      };
      try {
        const res = await generateOrderApi(body);
        const data = (await res.json()) as GenerateOrderResponse;
        if (data?.orderedTasks) {
          setOrderedTasks(data.orderedTasks);
          setTasks(data.orderedTasks);
          setAnimationStage('in');
          setTimeout(() => setAnimationStage('idle'), 350);
        } else {
          setAnimationStage('idle');
        }
      } catch (e) {
        console.error("Ошибка генерации порядка:", e);
        setAnimationStage('idle');
      }
    }, 250);
  };

  // === ОТПРАВКА ЗАДАЧИ ===
  const submitTask = async (task: Task) => {
    try {
      const data = await postTask(task);
      if (data?.ok && data.taskId) {
        setTasks(prev => prev.map(t => t === task ? { ...t, id: data.taskId } : t));
      }
    } catch (e) {
      console.error("Ошибка отправки задачи:", e);
    }
  };

  // === СОХРАНЕНИЕ СВОБОДНЫХ ЧАСОВ ===
  const saveFreeHours = async () => {
    if (freeHours === "" || !userId) return;
    const hours = typeof freeHours === "number" ? freeHours : Number(freeHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 24) return;
    setSavedFreeHours(hours);
    try {
      await postFreeHours({ freeHours: hours, Uid: userId });
    } catch (e) {
      console.error("Ошибка сохранения часов:", e);
    }
    setFreeHours("");
  };

  // === ДОБАВЛЕНИЕ ЗАДАЧИ ===
  const addTask = async () => {
    const complexity = typeof newComplexity === "number" ? newComplexity : Number(newComplexity);
    if (!newName || !Number.isInteger(complexity) || complexity <= 0) return;

    const t: Task = {
      id: `${Date.now()}`,
      name: newName,
      deadline: newDeadline || undefined,
      complexityHours: complexity,
    };
    setTasks(p => [...p, t]);
    setNewName("");
    setNewDeadline("");
    setNewComplexity("");
    await submitTask(t);
  };

  // === ОТПРАВКА РЕЗУЛЬТАТА ===
  const submitResult = async () => {
    if (!userId) return;
    const num = Number(resultNumber);
    const percent = typeof resultPercent === "number" ? resultPercent : Number(resultPercent);
    if (!Number.isInteger(num) || num < 1 || !Number.isInteger(percent) || percent < 0 || percent > 100) return;

    try {
      await postResult({ Uid: userId, number: num, percent });
      setResultNumber("");
      setResultPercent("");
    } catch (e) {
      console.error("Ошибка отправки результата:", e);
    }
  };

  // === СТИЛИ ===
  const container = "max-w-md mx-auto p-4 space-y-4";
  const roundedBox = "rounded-3xl bg-white p-3 mb-4 shadow-sm";
  const arrowButton = (onClick: () => void) => (
    <button onClick={onClick} style={{border: '2px solid #6b4b3a', backgroundColor: '#ffffff', boxShadow: '0 8px 20px rgba(0,0,0,0.08)'}} className="mt-3 rounded-full px-6 py-2">
      →
    </button>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4 sm:justify-center"
      style={{
        backgroundImage: "ur[](https://cdn.builder.io/api/v1/image/assets%2Fa1d657657dfb4e0aa4a68f589f87e3a0%2F17f04e980d504a84979a4d65d993b393)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundColor: "#c6864f",
        backgroundBlendMode: "multiply",
        fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
        color: "#2b1f1f",
      }}
    >
      <div className="absolute top-3 left-3" style={{fontFamily: 'Roboto, Inter, system-ui', fontSize: 14, color: '#2b1f1f', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: 9999, boxShadow: '0 6px 18px rgba(0,0,0,0.08)'}}>{dateStr}</div>
      <div className="absolute top-3 right-3" style={{fontFamily: 'Roboto, Inter, system-ui', fontSize: 14, color: '#2b1f1f', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: 9999, boxShadow: '0 6px 18px rgba(0,0,0,0.08)'}}>{timeStr}</div>

      <div className={container}>
        {/* === ЗАДАЧИ === */}
        <div className={`${roundedBox}`} style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", padding: "12px", boxShadow: '0 18px 48px rgba(0,0,0,0.12)' }}>
          <div style={{ font: '400 28px/36px Roboto', marginBottom: '8px', textAlign: 'center', color: '#2b1f1f' }}>Мои задачи на день</div>

          <div
            className={`bg-white p-2 h-48 sm:h-36 overflow-auto transition-all duration-300 ease-in-out transform ${
              animationStage === "out" ? "opacity-0 -translate-y-3" : animationStage === "in" ? "opacity-100 translate-y-0" : "opacity-100"
            }`}
            style={{ borderRadius: "30px", border: "1px solid rgba(75,45,36,0.06)", padding: "8px 0 8px 7px" }}
          >
            <ol className="text-left list-inside" style={{ paddingRight: 8 }}>
              {orderedTasks.length > 0 ? (
                orderedTasks.map((t, i) => {
                  const complexity = t.complexityHours ?? (t as any).complexity ?? (t as any).hours ?? '-';
                  return (
                    <li key={t.id ?? i} className="py-2 text-base sm:text-lg" style={{ display: "flex", padding: "6px 0", alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, width: 24 }}>{i + 1}</div>
                      <div style={{ marginLeft: 8, wordBreak: 'break-word', color: '#2b1f1f' }}>
                        <div style={{ fontWeight: 600 }}>{t.name || 'Без названия'}</div>
                        <div style={{ fontSize: 13, color: '#4a2f2b', marginTop: 6 }}>Дедлайн: {t.deadline || '-'}</div>
                        <div style={{ fontSize: 13, color: '#4a2f2b', marginTop: 4 }}>Сложность: {complexity}</div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <div style={{ padding: 12, color: '#6b5a57' }}>пока тут пусто</div>
              )}
            </ol>
          </div>

          <div className="flex justify-center mt-3">
            <button
              onClick={generateOrder}
              disabled={animationStage !== "idle"}
              style={{ border: "1px solid rgba(75,45,36,0.06)", padding: "8px 24px", borderRadius: 9999, backgroundColor: "#ffffff", boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
              className={animationStage !== "idle" ? "opacity-50 pointer-events-none" : ""}
            >
              <span style={{ font: '400 18px/25px Roboto', color: '#2b1f1f' }}>Сгенерировать порядок задач</span>
            </button>
          </div>
        </div>

        {/* === СВОБОДНЫЕ ЧАСЫ И РЕЗУЛЬТАТ === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Свободные часы */}
          <div className={`${roundedBox} p-4`} style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
            <div style={{ font: '400 18px Roboto', marginBottom: 8, textAlign: "center", color: '#2b1f1f' }}>Свободные часы сегодня</div>
            <input
              type="number" placeholder="Часы" min={1} max={24} step={1}
              value={freeHours as any}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setFreeHours("");
                const n = Number(v);
                if (Number.isInteger(n) && n >= 1 && n <= 24) setFreeHours(n);
              }}
              style={{ borderRadius: 9999, width: "100%", padding: "8px", border: "1px solid rgba(75,45,36,0.06)", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            />
            <div style={{ marginTop: 8, padding: '6px 12px', border: '1px solid rgba(75,45,36,0.06)', borderRadius: 9999, backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
              {savedFreeHours === "" ? "Не указано" : `${savedFreeHours} ч`}
            </div>
            <button onClick={saveFreeHours} style={{ marginTop: 12, width: "100%", padding: "8px 24px", borderRadius: 9999, border: "1px solid rgba(75,45,36,0.06)", backgroundColor: "#ffffff", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
              →
            </button>
          </div>

          {/* Результат */}
          <div className={`${roundedBox} p-4`} style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
            <div style={{ font: '400 18px Roboto', marginBottom: 8, textAlign: "center", color: '#2b1f1f' }}>Результат работы</div>
            <input type="number" placeholder="Номер задания" min={1} value={resultNumber}
              onChange={(e) => { const v = e.target.value; if (v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1)) setResultNumber(v); }}
              style={{ borderRadius: 9999, width: "100%", padding: "8px", border: "1px solid rgba(75,45,36,0.06)", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            />
            <input type="number" placeholder="Процент" min={0} max={100} value={resultPercent as any}
              onChange={(e) => { const v = e.target.value; if (v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100)) setResultPercent(v === "" ? "" : Number(v)); }}
              style={{ borderRadius: 9999, width: "100%", marginTop: 8, padding: "8px", border: "1px solid rgba(75,45,36,0.06)", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            />
            <button onClick={submitResult} style={{ marginTop: 12, width: "100%", padding: "8px 24px", borderRadius: 9999, border: "1px solid rgba(75,45,36,0.06)", backgroundColor: "#ffffff", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
              →
            </button>
          </div>
        </div>

        {/* === ДОБАВИТЬ ЗАДАЧУ === */}
        <div className={`${roundedBox} p-4`} style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", boxShadow: '0 10px 30px rgba(75,45,36,0.12)' }}>
          <div style={{ font: "400 18px/28px Roboto", marginBottom: 12, textAlign: "center", color: '#2b1f1f' }}>Добавить задачу</div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div style={{ fontSize: 16, marginBottom: 8, color: '#2b1f1f' }}>Название</div>
              <input placeholder="Текст" value={newName} onChange={e => setNewName(e.target.value)}
                style={{ borderRadius: 9999, width: "100%", padding: "12px", border: "1px solid rgba(75,45,36,0.06)", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
              />
            </div>
            <div className="flex-1">
              <div style={{ marginBottom: 8 }}>Дедлайн</div>
              <DatePicker value={newDeadline} onChange