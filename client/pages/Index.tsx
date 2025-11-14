import { useEffect, useState } from "react";
import DatePicker from "../components/DatePicker";
import { Task, GenerateOrderRequest, GenerateOrderResponse } from "@shared/api";
import { postTask, postFreeHours, postResult, generateOrderApi } from "../lib/api";
import { loadState, saveState, getUid } from "../lib/storage";

export default function Index() {
  // === USER ID ===
  // Uid всегда задан (not null), получается из константы для разработки
  const userId = getUid();

  // === ВРЕМЕННО ОТКЛЮЧЕНО: Логика получения Uid из Max API ===
  // Этот код будет включен когда Max API будет готово предоставлять Uid
  /*
  useEffect(() => {
    // Пытаемся получить Uid из URL параметров
    const launchUserId = getUserIdFromLaunchParams();
    if (launchUserId) {
      setUserId(launchUserId);
      setUserIdState(launchUserId);
      console.log("Received userId from bot:", launchUserId);
      return;
    }
    
    // Пытаемся получить из Max API (WebApp)
    if (window.WebApp?.initDataUnsafe?.user?.id) {
      const id = String(window.WebApp.initDataUnsafe.user.id);
      setUserId(id);
      setUserIdState(id);
      console.log("User ID from WebApp:", id);
      return;
    }
    
    // Ошибка: не удалось получить Uid
    console.error("ОШИБКА: Не удалось получить Uid пользователя. Проверьте URL параметры или Max API.");
  }, []);
  */

  console.log("Используется Uid:", userId);

  // === STATE ===
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

  // === SAVE TO LOCALSTORAGE ===
  useEffect(() => {
    saveState({ tasks, orderedTasks, freeHours, savedFreeHours, resultNumber, resultPercent });
  }, [tasks, orderedTasks, freeHours, savedFreeHours, resultNumber, resultPercent]);

  // === ANIMATION ===
  const [animationStage, setAnimationStage] = useState<'idle' | 'out' | 'in'>('idle');

  // === TIME ===
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // === GENERATE ORDER ===
  const generateOrder = async () => {
    if (animationStage !== 'idle') {
      console.log("generateOrder: анимация уже выполняется");
      return;
    }

    console.log("generateOrder: отправка запроса...");
    setAnimationStage('out');

    setTimeout(async () => {
      const body: GenerateOrderRequest = {
        Uid: userId,
        tasks: tasks.map(t => ({
          name: t.name,
          deadline: t.deadline,
          estimatedHours: t.estimatedHours,
        })),
        ...(typeof freeHours === "number" ? { freeHours } : {}),
      };

      console.log("POST /api/generate-order →", body);

      try {
        const res = await generateOrderApi(body);
        console.log("Ответ от сервера:", res.status, res.statusText);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as GenerateOrderResponse;
        console.log("Данные от сервера:", data);

        if (data.orderedTasks) {
          setOrderedTasks(data.orderedTasks);
          setTasks(data.orderedTasks);
          setAnimationStage('in');
          setTimeout(() => setAnimationStage('idle'), 350);
        }
      } catch (e) {
        console.error("Ошибка generateOrder:", e);
        setAnimationStage('idle');
      }
    }, 250);
  };

  // === SUBMIT TASK ===
  const submitTask = async (task: Task) => {
    console.log("submitTask:", task);

    try {
      const body = {
        Uid: userId,
        name: task.name,
        deadline: task.deadline,
        estimatedHours: task.estimatedHours,
      };
      const res = await postTask(body);
      console.log("postTask response:", res);
    } catch (e) {
      console.error("Submit task failed:", e);
    }
  };

  // === SAVE FREE HOURS ===
  const saveFreeHours = async () => {
    if (freeHours === "") return;
    const hours = typeof freeHours === "number" ? freeHours : Number(freeHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 24) return;
    setSavedFreeHours(hours);
    console.log("saveFreeHours:", hours);

    try {
      await postFreeHours({ freeHours: hours, Uid: userId });
    } catch (e) {
      console.error("Save free hours failed:", e);
    }
    setFreeHours("");
  };

  // === ADD TASK ===
  const addTask = async () => {
    const complexity = typeof newComplexity === "number" ? newComplexity : Number(newComplexity);
    if (!newName || !Number.isInteger(complexity) || complexity <= 0) return;

    const t: Task = {
      id: `${Date.now()}`,
      name: newName,
      deadline: newDeadline || undefined,
      estimatedHours: complexity,
    };
    setTasks(p => [...p, t]);
    setNewName("");
    setNewDeadline("");
    setNewComplexity("");
    await submitTask(t);
  };

  // === SUBMIT RESULT ===
  const submitResult = async () => {
    const num = Number(resultNumber);
    const percent = typeof resultPercent === "number" ? resultPercent : Number(resultPercent);
    if (!Number.isInteger(num) || num < 1 || !Number.isInteger(percent) || percent < 0 || percent > 100) return;

    console.log("submitResult:", { num, percent });
    try {
      await postResult({ Uid: userId, number: num, percent });
      setResultNumber("");
      setResultPercent("");
    } catch (e) {
      console.error("Submit result failed:", e);
    }
  };

  // === STYLES ===
  const container = "max-w-md mx-auto p-4 space-y-4";
  const roundedBox = "rounded-3xl bg-white p-3 mb-4 shadow-sm";
  const smallBox = "rounded-full bg-white p-3 text-center";
  const arrowButton = (onClick: () => void) => (
    <button onClick={onClick} style={{border: '2px solid #6b4b3a', backgroundColor: '#ffffff', boxShadow: '0 8px 20px rgba(0,0,0,0.08)'}} className="mt-3 rounded-full px-6 py-2">
      →
    </button>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4 sm:justify-center"
      style={{
        backgroundImage:
          "url(https://cdn.builder.io/api/v1/image/assets%2Fa1d657657dfb4e0aa4a68f589f87e3a0%2F17f04e980d504a84979a4d65d993b393)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundColor: "#c6864f",
        backgroundBlendMode: "multiply",
        fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
        color: "#2b1f1f",
      }}
    >
      <div className="absolute top-3 left-3" style={{fontFamily: 'Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial', fontSize: 14, color: '#2b1f1f', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: 9999, boxShadow: '0 6px 18px rgba(0,0,0,0.08)'}}>{dateStr}</div>
      <div className="absolute top-3 right-3" style={{fontFamily: 'Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial', fontSize: 14, color: '#2b1f1f', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: 9999, boxShadow: '0 6px 18px rgba(0,0,0,0.08)'}}>{timeStr}</div>
      <div className={container}>
        <div
          className={`${roundedBox}`}
          style={{
            border: "1px solid rgba(75,45,36,0.06)",
            borderRadius: "30px",
            marginBottom: "0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            padding: "12px",
            boxShadow: '0 18px 48px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ font: '400 28px/36px Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial ', marginBottom: '8px', textAlign: 'center', color: '#2b1f1f' }}><p>Мои задачи на день</p></div>

          <div
            className={`bg-white p-2 h-48 sm:h-36 overflow-auto transition-all duration-300 ease-in-out transform ${
              animationStage === "out" ? "opacity-0 -translate-y-3" : animationStage === "in" ? "opacity-100 translate-y-0" : "opacity-100"
            }`}
            style={{
              borderRadius: "30px",
              overflowX: "hidden",
              overflowY: "auto",
              maxHeight: "320px",
              marginRight: "2px",
              width: "100%",
              padding: "8px 0 8px 7px",
              border: "1px solid rgba(75,45,36,0.06)",
            }}
          >
            <ol className="text-left list-inside" style={{ paddingRight: 8 }}>
              {orderedTasks && orderedTasks.length > 0 ? (
                orderedTasks.map((t, i) => {
                  const title = t.name || 'Без названия';
                  const dl = t.deadline || '-';
                  const complexity = typeof t.estimatedHours === 'number' ? String(t.estimatedHours) : '-';;
                  return (
                    <li key={t.id ?? i} className="py-2 text-base sm:text-lg" style={{ display: "flex", marginRight: "auto", flexDirection: "row", padding: "6px 0", alignItems: 'flex-start' }}>
                      <div style={{ fontFamily: "Roboto, Inter, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial", width: 24, fontWeight: 600 }}>{i + 1}</div>
                      <div style={{ marginLeft: 8, alignSelf: "center", fontFamily: "Roboto, Inter, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial", wordBreak: 'break-word', color: '#2b1f1f' }}>
                        <div style={{ fontWeight: 600, color: '#2b1f1f' }}>{title}</div>
                        <div style={{ fontSize: 13, color: '#4a2f2b', marginTop: 6, fontWeight: 500 }}>{`Дедлайн: ${dl}`}</div>
                        <div style={{ fontSize: 13, color: '#4a2f2b', marginTop: 4, fontWeight: 400 }}>{`Сложность: ${complexity}`}</div>
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
              style={{ border: "1px solid rgba(75,45,36,0.06)", padding: "8px 24px", borderRadius: 9999, backgroundColor: "#ffffff", boxShadow: '0 10px 30px rgba(0,0,0,0.08)'}}
              className={`w-full md:w-auto ${animationStage !== "idle" ? "opacity-50 pointer-events-none" : ""}`}
            >
              <span style={{ font: '400 18px/25px Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial ', color: '#2b1f1f' }}>Сгенерировать порядок задач</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div
            className={`${roundedBox} p-4`}
            style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", overflow: "hidden", backgroundColor: "#ffffff", padding: "16px", boxShadow: 'rgba(0, 0, 0, 0.08) 0px 12px 30px 0px' }}
          >
            <div style={{ font: '400 18px Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial ', marginBottom: 8, textAlign: "center", color: '#2b1f1f' }}>Свободные часы сегодня</div>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
              <input
                aria-label="Количество часов"
                type="number"
                placeholder="Часы"
                value={freeHours as any}
                min={1}
                max={24}
                step={1}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setFreeHours("");
                  const n = Number(v);
                  if (!Number.isInteger(n)) return;
                  if (n < 1 || n > 24) return;
                  setFreeHours(n);
                }}
                style={{
                  borderRadius: 9999,
                  display: "block",
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  fontFamily: "Roboto, Inter, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
                  margin: "12px 0",
                  padding: "8px",
                  border: "1px solid rgba(75,45,36,0.06)",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />

              <div style={{ marginTop: 8, padding: '6px 12px', border: '1px solid rgba(75,45,36,0.06)', borderRadius: 9999, backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', fontFamily: "Roboto, Inter, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial", color: '#2b1f1f' }}>{savedFreeHours === "" ? "Не указано" : `${savedFreeHours} ч`}</div>

              <button
                onClick={saveFreeHours}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(75,45,36,0.06)",
                  borderRadius: 9999,
                  display: "block",
                  marginTop: "12px",
                  width: "100%",
                  padding: "8px 24px",
                  textAlign: "center",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }} className="w-full md:w-20"
              >
                →
              </button>
            </div>
          </div>

          <div
            className={`${roundedBox} p-4`}
            style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", overflow: "hidden", backgroundColor: "#ffffff", padding: "16px", width: "100%", boxShadow: 'rgba(0, 0, 0, 0.08) 0px 12px 30px 0px' }}
          >
            <div style={{ font: '400 18px Roboto, Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial ', marginBottom: 8, textAlign: "center", color: '#2b1f1f' }}>Результат работы</div>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 8 }}>
              <input
                aria-label="Номер задания"
                type="number"
                min={1}
                step={1}
                placeholder="Номер задания"
                value={resultNumber}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setResultNumber("");
                  const n = Number(v);
                  if (!Number.isInteger(n) || n < 1) return;
                  setResultNumber(String(n));
                }}
                style={{
                  borderRadius: 9999,
                  display: "block",
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  margin: "0 auto",
                  padding: "8px",
                  border: "1px solid rgba(75,45,36,0.06)",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />
              <input
                aria-label="На сколько процентов выполнено"
                type="number"
                placeholder="Процент задачи"
                min={0}
                max={100}
                step={1}
                value={resultPercent as any}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setResultPercent("");
                  const n = Number(v);
                  if (!Number.isInteger(n) || n < 0 || n > 100) return;
                  setResultPercent(n);
                }}
                style={{
                  borderRadius: 9999,
                  display: "block",
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  margin: "10px 0 -1px",
                  padding: "8px",
                  border: "1px solid rgba(75,45,36,0.06)",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />
              <button
                onClick={submitResult}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(75,45,36,0.06)",
                  borderRadius: 9999,
                  display: "block",
                  marginTop: "12px",
                  width: "100%",
                  padding: "8px 24px",
                  textAlign: "center",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }} className="w-full md:w-20"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${roundedBox} p-4`}
          style={{ border: "1px solid rgba(75,45,36,0.06)", borderRadius: "30px", overflow: "hidden", margin: "0 0 16px", padding: "16px", backgroundColor: "#ffffff", boxShadow: 'rgba(75,45,36,0.12) 0px 10px 30px 0px'}}
        >
          <div style={{ font: "400 18px/28px Roboto, Inter, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial ", marginBottom: 12, textAlign: "center", color: '#2b1f1f' }}>Добавить задачу</div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="mb-2" style={{ fontSize: "16px", fontWeight: "400", lineHeight: "22.5px", marginBottom: "8px", color: '#2b1f1f' }}>Название</div>
              <input
                aria-label="Название"
                placeholder="Текст"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  border: "1px solid rgba(75,45,36,0.06)",
                  borderRadius: 9999,
                  display: "block",
                  fontWeight: 400,
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
                  padding: "12px",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />
            </div>

            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div style={{ fontWeight: '400', lineHeight: '22.5px', marginBottom: '8px' }}><p>Дедлайн</p></div>
              <DatePicker
                ariaLabel="Дедлайн"
                value={newDeadline}
                onChange={(v) => setNewDeadline(v)}
                inputStyle={{
                  border: "1px solid rgba(75,45,36,0.06)",
                  borderRadius: 9999,
                  display: "block",
                  fontWeight: 400,
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
                  padding: "12px 3px",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />
            </div>

            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="mb-2" style={{ fontSize: "16px", fontWeight: "400", lineHeight: "22.5px", marginBottom: "8px", color: '#2b1f1f' }}>Сложность</div>
              <input
                aria-label="Сложность"
                placeholder="Часы"
                type="number"
                min={1}
                step={1}
                value={newComplexity as any}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setNewComplexity("");
                  const n = Number(v);
                  if (!Number.isInteger(n) || n < 1) return;
                  setNewComplexity(n);
                }}
                style={{
                  border: "1px solid rgba(75,45,36,0.06)",
                  borderRadius: 9999,
                  display: "block",
                  fontWeight: 400,
                  textAlign: "center",
                  width: "100%",
                  backgroundColor: "#ffffff",
                  fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
                  padding: "12px 0",
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }}
              />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={addTask}
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(75,45,36,0.06)", borderRadius: 9999, width: "70%", margin: "12px 0", padding: "8px 24px", boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} className="w-full md:w-20"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}