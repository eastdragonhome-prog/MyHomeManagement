import { useEffect, useMemo, useState } from "react";
import {
  addSchedule,
  completeSchedule,
  exportCsvSchedules,
  exportJson,
  getItemCounts,
  initDB,
  querySchedules,
  addItem,
  getItemsByCategory,
  deleteItem,
  type Schedule,
  type Item,
} from "./db";
const MENU = [
  ["home", "⌂", "홈"],
  ["schedule", "▣", "일정"],
  ["appliance", "▤", "가전"],
  ["vehicle", "▰", "자동차"],
  ["telecom", "◉", "휴대폰/통신"],
  ["insurance", "◇", "보험"],
  ["maru", "♡", "마루"],
  ["homecare", "⌂", "집관리"],
  ["gift", "₩", "자녀 증여"],
  ["documents", "□", "문서"],
] as const;

const CATEGORY_MAP: Record<string, string> = {
  appliance: "가전",
  vehicle: "자동차",
  telecom: "휴대폰/통신",
  insurance: "보험",
  maru: "마루",
  homecare: "집관리",
  gift: "자녀 증여",
  documents: "문서",
};

function dday(date: string) {
  const a = new Date();
  a.setHours(0, 0, 0, 0);

  const b = new Date(`${date}T00:00:00`);

  return Math.ceil(
    (b.getTime() - a.getTime()) / 86400000
  );
}

function download(
  name: string,
  content: BlobPart,
  type = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState("home");

  const [schedules, setSchedules] =
    useState<Schedule[]>([]);

  const [counts, setCounts] =
    useState<Record<string, number>>({});

  const [modal, setModal] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState(2);
  const [appliances, setAppliances] =
  useState<Item[]>([]);
  const [applianceName, setApplianceName] =
  useState("");

const [applianceModel, setApplianceModel] =
  useState("");

const [appliancePrice, setAppliancePrice] =
  useState("");
  
async function refresh() {
  const scheduleData =
    await querySchedules();

  const countData =
    await getItemCounts();

  const applianceData =
    await getItemsByCategory("가전");

  setSchedules(scheduleData);
  setCounts(countData);
  setAppliances(applianceData);
}

  useEffect(() => {
    initDB()
      .then(async () => {
        setReady(true);
        await refresh();
      })
      .catch((error) => {
        console.error("DB 초기화 실패:", error);
      });
  }, []);

  const groups = useMemo(
    () => ({
      urgent: schedules.filter(
        (x) => dday(x.due_date) <= 0
      ),

      seven: schedules.filter(
        (x) =>
          dday(x.due_date) > 0 &&
          dday(x.due_date) <= 7
      ),

      thirty: schedules.filter(
        (x) =>
          dday(x.due_date) > 7 &&
          dday(x.due_date) <= 30
      ),
    }),
    [schedules]
  );

  if (!ready) {
    return (
      <div className="loading">
        우리집 통합관리 준비 중...
      </div>
    );
  }
  async function saveAppliance() {
  if (!applianceName.trim()) return;

  await addItem(
    "가전",
    applianceName,
    "",
    applianceModel,
    "",
    Number(appliancePrice) || 0,
    ""
  );

  setApplianceName("");
  setApplianceModel("");
  setAppliancePrice("");

  setModal(false);

  await refresh();
  }
  async function save() {
    if (!title.trim() || !date) return;

    await addSchedule(
      title.trim(),
      date,
      priority
    );

    setTitle("");
    setDate("");
    setPriority(2);
    setModal(false);

    await refresh();
  }

  async function handleExportJson() {
    const data = await exportJson();

    download(
      "우리집_통합관리.json",
      data,
      "application/json"
    );
  }

  async function handleExportCsv() {
    const data = await exportCsvSchedules();

    download(
      "우리집_일정.csv",
      data,
      "text/csv;charset=utf-8"
    );
  }

  async function handleComplete(id: number) {
    await completeSchedule(id);
    await refresh();
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <b>⌂</b>

          <div>
            <strong>우리집</strong>
            <span>통합관리</span>
          </div>
        </div>

        <nav>
          {MENU.map(
            ([id, icon, label]) => (
              <button
                key={id}
                className={
                  menu === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMenu(id)
                }
              >
                <span>{icon}</span>
                {label}
              </button>
            )
          )}
        </nav>

        <button
          className="quick"
          onClick={() =>
            setModal(true)
          }
        >
          ＋ 빠른 등록
        </button>

        <small className="offline">
          ● 오프라인 기본 기능 사용 가능
        </small>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <small>
              우리집 통합관리
            </small>

            <h1>
              {
                MENU.find(
                  (x) => x[0] === menu
                )?.[2]
              }
            </h1>
          </div>

          <div className="actions">
            <button
              onClick={
                handleExportJson
              }
            >
              JSON
            </button>

            <button
              onClick={
                handleExportCsv
              }
            >
              CSV
            </button>

            <button
              className="primary"
              onClick={() =>
                setModal(true)
              }
            >
              ＋ 등록
            </button>
          </div>
        </header>

        {menu === "home" ? (
          <Dashboard
            groups={groups}
            schedules={schedules}
            counts={counts}
            onComplete={
              handleComplete
            }
          />
      ) : menu === "schedule" ? (
  <SchedulePage
    schedules={schedules}
    onComplete={handleComplete}
  />
) : menu === "appliance" ? (
  <AppliancePage
    items={appliances}
  />
) : (
          <CategoryPage
            label={
              CATEGORY_MAP[menu] ??
              "관리"
            }
            count={
              counts[
                CATEGORY_MAP[menu] ??
                  ""
              ] ?? 0
            }
            onAdd={() =>
              setModal(true)
            }
          />
        )}
      </main>

      {modal && (
        <div
          className="modal-bg"
          onMouseDown={() =>
            setModal(false)
          }
        >
          <div
            className="modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-title">
              <div>
                <small>
                  QUICK ADD
                </small>

                <h2>
                  일정 등록
                </h2>
              </div>

              <button
                onClick={() =>
                  setModal(false)
                }
              >
                ×
              </button>
            </div>

            <label>
              할 일

              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="예: 자동차보험 갱신"
              />
            </label>

            <label>
              날짜

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              우선순위

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    Number(
                      e.target.value
                    )
                  )
                }
              >
                <option value={1}>
                  긴급
                </option>

                <option value={2}>
                  보통
                </option>

                <option value={3}>
                  낮음
                </option>
              </select>
            </label>

            <div className="modal-actions">
              <button
                onClick={() =>
                  setModal(false)
                }
              >
                취소
              </button>

              <button
                className="primary"
                
                onClick={() =>
  menu === "appliance"
    ? saveAppliance()
    : save()
}
              >
              }
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  groups,
  schedules,
  counts,
  onComplete,
}: {
  groups: {
    urgent: Schedule[];
    seven: Schedule[];
    thirty: Schedule[];
  };

  schedules: Schedule[];

  counts: Record<string, number>;

  onComplete: (
    id: number
  ) => void;
}) {
  const categories = [
    "가전",
    "자동차",
    "휴대폰/통신",
    "보험",
    "마루",
    "집관리",
    "자녀 증여",
    "문서",
  ];

  return (
    <div>
      <section className="hero">
        <div>
          <small>TODAY</small>

          <h2>
            이번 달에 해야 할 일을
            <br />
            한눈에 확인하세요.
          </h2>
        </div>

        <div className="hero-count">
          <b>{schedules.length}</b>

          <span>
            개의 예정 일정
          </span>
        </div>
      </section>

      <section className="cards">
        <Card
          title="오늘/기한 초과"
          value={
            groups.urgent.length
          }
          desc="즉시 확인이 필요한 일정"
          cls="danger"
        />

        <Card
          title="7일 이내"
          value={
            groups.seven.length
          }
          desc="이번 주에 처리할 일정"
          cls="warning"
        />

        <Card
          title="30일 이내"
          value={
            groups.thirty.length
          }
          desc="미리 준비할 일정"
          cls="normal"
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>
              다가오는 일정
            </h2>

            <p>
              가까운 일정부터 표시합니다.
            </p>
          </div>

          <span>
            {schedules.length}건
          </span>
        </div>

        <div className="list">
          {schedules
            .slice(0, 10)
            .map((s) => (
              <Row
                key={s.id}
                item={s}
                onComplete={
                  onComplete
                }
              />
            ))}

          {!schedules.length && (
            <Empty />
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>
              관리 현황
            </h2>

            <p>
              우리집 주요 관리 항목
            </p>
          </div>
        </div>

        <div className="category-grid">
          {categories.map(
            (category) => (
              <div
                className="category"
                key={category}
              >
                <span>
                  {category}
                </span>

                <b>
                  {counts[
                    category
                  ] ?? 0}
                </b>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  desc,
  cls,
}: {
  title: string;
  value: number;
  desc: string;
  cls: string;
}) {
  return (
    <div
      className={`card ${cls}`}
    >
      <span>{title}</span>

      <b>
        {value}
        <i>건</i>
      </b>

      <small>
        {desc}
      </small>
    </div>
  );
}

function Row({
  item,
  onComplete,
}: {
  item: Schedule;
  onComplete: (
    id: number
  ) => void;
}) {
  const n = dday(
    item.due_date
  );

  const label =
    n < 0
      ? "지연"
      : n === 0
      ? "오늘"
      : `D-${n}`;

  return (
    <div className="row">
      <strong
        className={
          n <= 0
            ? "red"
            : n <= 7
            ? "yellow"
            : "blue"
        }
      >
        {label}
      </strong>

      <div>
        <b>{item.title}</b>

        <small>
          {item.category}
        </small>
      </div>

      <time>
        {item.due_date}
      </time>

      <button
        onClick={() =>
          onComplete(item.id)
        }
      >
        완료
      </button>
    </div>
  );
}

function SchedulePage({
  schedules,
  onComplete,
}: {
  schedules: Schedule[];
  onComplete: (
    id: number
  ) => void;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>
            전체 일정
          </h2>

          <p>
            등록된 해야 할 일을 관리합니다.
          </p>
        </div>

        <span>
          {schedules.length}건
        </span>
      </div>

      <div className="list">
        {schedules.map(
          (s) => (
            <Row
              key={s.id}
              item={s}
              onComplete={
                onComplete
              }
            />
          )
        )}

        {!schedules.length && (
          <Empty />
        )}
      </div>
    </section>
  );
}

function CategoryPage({
  label,
  count,
  onAdd,
}: {
  label: string;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div>
      <section className="category-hero">
        <div className="big-icon">
          □
        </div>

        <div>
          <h2>{label}</h2>

          <p>
            관리 대상과 기록, 일정,
            문서를 관리합니다.
          </p>
        </div>

        <button
          className="primary"
          onClick={onAdd}
        >
          ＋ 등록
        </button>
      </section>

      <div className="empty-panel">
        <b>{count}</b>

        <h2>
          {count
            ? "등록된 항목이 있습니다."
            : "아직 등록된 항목이 없습니다."}
        </h2>

        <p>
          다음 단계에서 상세 입력 화면을
          연결합니다.
        </p>

        <button
          className="primary"
          onClick={onAdd}
        >
          등록 시작
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <b>＋</b>

      <p>
        등록된 일정이 없습니다.
      </p>
    </div>
  );
          }

function AppliancePage({
  items,
}: {
  items: Item[];
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>가전관리</h2>
          <p>
            등록된 가전 목록
          </p>
        </div>

        <span>
          {items.length}건
        </span>
      </div>

      <div className="list">
        {items.map((x) => (
          <div
            key={x.id}
            className="row"
          >
            <div>
              <b>{x.name}</b>

              <small>
                {x.model}
              </small>
            </div>

            <time>
              {x.purchase_date}
            </time>

            <button>
              삭제
            </button>
          </div>
        ))}

        {!items.length && (
          <Empty />
        )}
      </div>
    </section>
  );
}
