export type Schedule = {
  id: number;
  title: string;
  due_date: string;
  priority: number;
  category?: string;
  item_name?: string;
  completed: number;
  created_at: string;
};

const STORAGE_KEY = "our-home-management-schedules";
const DB_VERSION = 1;

let schedules: Schedule[] = [];

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      schedules = JSON.parse(saved);
    } else {
      schedules = [];
    }
  } catch {
    schedules = [];
  }
}

function save() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(schedules)
  );
}

export async function initDB(): Promise<void> {
  load();
}

export function querySchedules(): Schedule[] {
  return [...schedules]
    .filter((item) => item.completed === 0)
    .sort((a, b) => {
      const dateCompare =
        a.due_date.localeCompare(b.due_date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.priority - b.priority;
    });
}

export function addSchedule(
  title: string,
  dueDate: string,
  priority = 2,
  category = "일정",
  itemName = ""
): Schedule {
  const nextId =
    schedules.length > 0
      ? Math.max(...schedules.map((item) => item.id)) + 1
      : 1;

  const item: Schedule = {
    id: nextId,
    title,
    due_date: dueDate,
    priority,
    category,
    item_name: itemName,
    completed: 0,
    created_at: new Date().toISOString(),
  };

  schedules.push(item);
  save();

  return item;
}

export function completeSchedule(id: number) {
  schedules = schedules.map((item) =>
    item.id === id
      ? {
          ...item,
          completed: 1,
        }
      : item
  );

  save();
}

export function restoreSchedule(id: number) {
  schedules = schedules.map((item) =>
    item.id === id
      ? {
          ...item,
          completed: 0,
        }
      : item
  );

  save();
}

export function deleteSchedule(id: number) {
  schedules = schedules.filter(
    (item) => item.id !== id
  );

  save();
}

export function getAllSchedules(): Schedule[] {
  return [...schedules];
}

export function exportJson(): string {
  return JSON.stringify(
    {
      app: "우리집 통합관리",
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      data: {
        schedules: schedules,
      },
    },
    null,
    2
  );
}

export function exportCsvSchedules(): string {
  const header =
    "id,title,due_date,priority,category,item_name,completed,created_at";

  const rows = schedules.map((item) =>
    [
      item.id,
      csvEscape(item.title),
      item.due_date,
      item.priority,
      csvEscape(item.category ?? ""),
      csvEscape(item.item_name ?? ""),
      item.completed,
      item.created_at,
    ].join(",")
  );

  return "\uFEFF" + [header, ...rows].join("\n");
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function clearAllData() {
  schedules = [];
  save();
}

export function importJson(json: string) {
  const parsed = JSON.parse(json);

  if (
    !parsed ||
    !parsed.data ||
    !Array.isArray(parsed.data.schedules)
  ) {
    throw new Error("올바른 우리집 통합관리 백업 파일이 아닙니다.");
  }

  schedules = parsed.data.schedules;
  save();
}
