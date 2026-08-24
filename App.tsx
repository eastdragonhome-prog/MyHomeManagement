import { useEffect, useMemo, useState } from "react";
import {
  addSchedule,
  completeSchedule,
  exportCsvSchedules,
  exportJson,
  initDB,
  querySchedules,
  type Schedule,
} from "./db";

const MENU = [
  { id: "home", label: "홈", icon: "⌂" },
  { id: "schedule", label: "일정", icon: "▣" },
  { id: "all", label: "전체목록", icon: "☷" },
  { id: "appliance", label: "가전", icon: "▤" },
  { id: "vehicle", label: "자동차", icon: "▰" },
  { id: "telecom", label: "통신", icon: "◉" },
  { id: "insurance", label: "보험", icon: "◇" },
  { id: "maru", label: "마루", icon: "♡" },
  { id: "homecare", label: "집관리", icon: "⌂" },
  { id: "gift", label: "증여", icon: "₩" },
  { id: "documents", label: "문서", icon: "□" },
];

function getDDay(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  return Math.ceil(
    (target.getTime() - today.getTime()) / 86400000
  );
}

function download(
  filename: string,
  content: string,
  type = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState("home");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modal, setModal] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState(2);

  useEffect(() => {
    initDB().then(() => {
      setReady(true);
      refresh();
    });
  }, []);

  function refresh() {
    setSchedules(querySchedules());
  }

  function saveSchedule() {
    if (!title.trim() || !date) return;

    addSchedule(title.trim(), date, priority);

    setTitle("");
    setDate("");
    setPriority(2);
    setModal(false);

    refresh();
  }

  function finish(id: number) {
    completeSchedule(id);
    refresh();
  }

  const sections = useMemo(() => {
    return {
      urgent: schedules.filter((s) => getDDay(s.due_date) <= 0),
      seven: schedules.filter(
        (s) => getDDay(s.due_date) > 0 && getDDay(s.due_date) <= 7
      ),
      thirty: schedules.filter(
        (s) => getDDay(s.due_date) > 7 && getDDay(s.due_date) <= 30
      ),
    };
  }, [schedules]);

  if (!ready) {
    return (
      <div className="loading">
        <div>
          <strong>우리집 통합관리</strong>
          <p>데이터베이스 준비 중...</p>
        </div>
      </div>
    );
  }

  const currentMenu =
    MENU.find((item) => item.id === menu) ?? MENU[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">⌂</div>
          <div>
            <strong>우리집</strong>
            <span>통합관리</span>
          </div>
        </div>

        <nav className="side-menu">
          {MENU.map((item) => (
            <button
              key={item.id}
              className={menu === item.id ? "selected" : ""}
              onClick={() => setMenu(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="quick-button" onClick={() => setModal(true)}>
          <span>＋</span>
          빠른 등록
        </button>

        <div className="offline-status">
          <span className="status-dot" />
          오프라인 사용 가능
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="breadcrumb">우리집 통합관리</div>
            <h1>{currentMenu.label}</h1>
          </div>

          <div className="top-actions">
            <button
              onClick={() =>
                download(
                  "우리집_통합관리.json",
                  exportJson(),
                  "application/json"
                )
              }
            >
              JSON 백업
            </button>

            <button
              onClick={() =>
                download(
                  "우리집_일정.csv",
                  exportCsvSchedules(),
                  "text/csv;charset=utf-8"
                )
              }
            >
              CSV
            </button>

            <button
              className="main-button"
              onClick={() => setModal(true)}
            >
              ＋ 등록
            </button>
          </div>
        </header>

        {menu === "home" && (
          <Dashboard
            sections={sections}
            schedules={schedules}
            onFinish={finish}
          />
        )}

        {menu === "schedule" && (
          <SchedulePage
            schedules={schedules}
            onFinish={finish}
          />
        )}

        {menu !== "home" && menu !== "schedule" && (
          <CategoryPage
            title={currentMenu.label}
            icon={currentMenu.icon}
            onAdd={() => setModal(true)}
          />
        )}
      </main>

      {modal && (
        <ScheduleModal
          title={title}
          date={date}
          priority={priority}
          setTitle={setTitle}
          setDate={setDate}
          setPriority={setPriority}
          onClose={() => setModal(false)}
          onSave={saveSchedule}
        />
      )}
    </div>
  );
}

function Dashboard({
  sections,
  schedules,
  onFinish,
}: {
  sections: {
    urgent: Schedule[];
    seven: Schedule[];
    thirty: Schedule[];
  };
  schedules: Schedule[];
  onFinish: (id: number) => void;
}) {
  const total =
    sections.urgent.length +
    sections.seven.length +
    sections.thirty.length;

  return (
    <div className="dashboard">
      <section className="welcome">
        <div>
          <p className="welcome-label">TODAY</p>
          <h2>이번 달에 해야 할 일을<br />한눈에 확인하세요.</h2>
        </div>

        <div className="today-count">
          <strong>{total}</strong>
          <span>개의 예정된 일정</span>
        </div>
      </section>

      <section className="summary-grid">
        <SummaryCard
          title="오늘 해야 할 일"
          value={sections.urgent.length}
          description="오늘 또는 기한이 지난 일정"
          type="danger"
        />

        <SummaryCard
          title="7일 이내"
          value={sections.seven.length}
          description="이번 주에 처리할 일정"
          type="warning"
        />

        <SummaryCard
          title="30일 이내"
          value={sections.thirty.length}
          description="미리 준비할 일정"
          type="normal"
        />
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>다가오는 일정</h2>
            <p>가장 가까운 일정부터 표시합니다.</p>
          </div>

          <span>{schedules.length}건</span>
        </div>

        <div className="schedule-list">
          {schedules.slice(0, 10).map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              onFinish={onFinish}
            />
          ))}

          {schedules.length === 0 && (
            <EmptyState
              title="등록된 일정이 없습니다."
              description="＋ 등록 버튼으로 첫 번째 일정을 추가해보세요."
            />
          )}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>관리 현황</h2>
            <p>우리집 주요 관리 항목</p>
          </div>
        </div>

        <div className="category-grid">
          <CategoryStat name="가전" count="0" />
          <CategoryStat name="자동차" count="0" />
          <CategoryStat name="보험" count="0" />
          <CategoryStat name="통신" count="0" />
          <CategoryStat name="마루" count="0" />
          <CategoryStat name="집관리" count="0" />
          <CategoryStat name="증여" count="0" />
          <CategoryStat name="문서" count="0" />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  type,
}: {
  title: string;
  value: number;
  description: string;
  type: string;
}) {
  return (
    <div className={`summary-card ${type}`}>
      <div className="summary-title">{title}</div>
      <div className="summary-number">
        {value}
        <small>건</small>
      </div>
      <p>{description}</p>
    </div>
  );
}

function ScheduleRow({
  schedule,
  onFinish,
}: {
  schedule: Schedule;
  onFinish: (id: number) => void;
}) {
  const dday = getDDay(schedule.due_date);

  let badge = `D-${dday}`;
  let badgeClass = "normal";

  if (dday <= 0) {
    badge = dday === 0 ? "오늘" : "지연";
    badgeClass = "danger";
  } else if (dday <= 7) {
    badgeClass = "warning";
  }

  return (
    <article className="schedule-row">
      <div className={`dday ${badgeClass}`}>{badge}</div>

      <div className="schedule-info">
        <h3>{schedule.title}</h3>

        <p>
          {schedule.category || "일정"}
          {schedule.item_name
            ? ` · ${schedule.item_name}`
            : ""}
        </p>
      </div>

      <time>{schedule.due_date}</time>

      <button
        className="finish-button"
        onClick={() => onFinish(schedule.id)}
      >
        완료
      </button>
    </article>
  );
}

function SchedulePage({
  schedules,
  onFinish,
}: {
  schedules: Schedule[];
  onFinish: (id: number) => void;
}) {
  return (
    <div className="content-section">
      <div className="section-heading">
        <div>
          <h2>전체 일정</h2>
          <p>등록된 일정과 해야 할 일을 관리합니다.</p>
        </div>

        <span>{schedules.length}건</span>
      </div>

      <div className="schedule-list">
        {schedules.map((schedule) => (
          <ScheduleRow
            key={schedule.id}
            schedule={schedule}
            onFinish={onFinish}
          />
        ))}

        {schedules.length === 0 && (
          <EmptyState
            title="일정이 없습니다."
            description="새로운 일정을 등록해보세요."
          />
        )}
      </div>
    </div>
  );
}

function CategoryPage({
  title,
  icon,
  onAdd,
}: {
  title: string;
  icon: string;
  onAdd: () => void;
}) {
  return (
    <div className="category-page">
      <div className="category-hero">
        <div className="large-icon">{icon}</div>

        <div>
          <h2>{title}</h2>
          <p>
            {title} 관련 정보를 등록하고 기록과 일정을
            관리합니다.
          </p>
        </div>

        <button className="main-button" onClick={onAdd}>
          ＋ 등록
        </button>
      </div>

      <div className="empty-panel">
        <div className="empty-symbol">＋</div>
        <h2>아직 등록된 항목이 없습니다.</h2>
        <p>
          관리할 {title} 정보를 등록하면 이곳에서
          확인할 수 있습니다.
        </p>
        <button className="main-button" onClick={onAdd}>
          첫 항목 등록
        </button>
      </div>
    </div>
  );
}

function CategoryStat({
  name,
  count,
}: {
  name: string;
  count: string;
}) {
  return (
    <div className="category-stat">
      <span>{name}</span>
      <strong>{count}</strong>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">＋</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ScheduleModal({
  title,
  date,
  priority,
  setTitle,
  setDate,
  setPriority,
  onClose,
  onSave,
}: {
  title: string;
  date: string;
  priority: number;
  setTitle: (value: string) => void;
  setDate: (value: string) => void;
  setPriority: (value: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="modal-background" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p>QUICK ADD</p>
            <h2>일정 등록</h2>
          </div>

          <button onClick={onClose}>×</button>
        </div>

        <label>
          할 일
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 자동차보험 갱신"
            autoFocus
          />
        </label>

        <label>
          날짜
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label>
          우선순위
          <select
            value={priority}
            onChange={(event) =>
              setPriority(Number(event.target.value))
            }
          >
            <option value={1}>긴급</option>
            <option value={2}>보통</option>
            <option value={3}>낮음</option>
          </select>
        </label>

        <div className="modal-buttons">
          <button onClick={onClose}>취소</button>
          <button className="main-button" onClick={onSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
        }
