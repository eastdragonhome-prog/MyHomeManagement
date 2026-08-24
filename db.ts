export type Schedule = {
  id: number;
  title: string;
  due_date: string;
  priority: number;
  category: string;
  item_name: string;
  completed: number;
  created_at: string;
};

export type Item = {
  id: number;
  category: string;
  name: string;
  manufacturer: string;
  model: string;
  purchase_date: string;
  purchase_price: number;
  memo: string;
  created_at: string;
};

const DB_NAME = "our-home-management";
const DB_VERSION = 1;

let database: IDBDatabase | null = null;

export async function initDB(): Promise<void> {
  if (database) return;

  database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("schedules")) {
        const store = db.createObjectStore("schedules", {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("due_date", "due_date");
        store.createIndex("completed", "completed");
      }

      if (!db.objectStoreNames.contains("items")) {
        const store = db.createObjectStore("items", {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("category", "category");
      }

      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requireDB(): IDBDatabase {
  if (!database) {
    throw new Error("DB가 아직 초기화되지 않았습니다.");
  }

  return database;
}

function requestResult<T>(
  request: IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function querySchedules(): Promise<Schedule[]> {
  const db = requireDB();

  const transaction = db.transaction(
    "schedules",
    "readonly"
  );

  const store = transaction.objectStore("schedules");

  const result = await requestResult(
    store.getAll()
  );

  return result
    .filter((item: Schedule) => item.completed === 0)
    .sort((a: Schedule, b: Schedule) => {
      const dateCompare =
        a.due_date.localeCompare(b.due_date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.priority - b.priority;
    });
}

export async function addSchedule(
  title: string,
  dueDate: string,
  priority = 2,
  category = "일정",
  itemName = ""
): Promise<void> {
  const db = requireDB();

  const transaction = db.transaction(
    "schedules",
    "readwrite"
  );

  transaction.objectStore("schedules").add({
    title,
    due_date: dueDate,
    priority,
    category,
    item_name: itemName,
    completed: 0,
    created_at: new Date().toISOString(),
  });

  await transactionComplete(transaction);
}

export async function completeSchedule(
  id: number
): Promise<void> {
  const db = requireDB();

  const transaction = db.transaction(
    "schedules",
    "readwrite"
  );

  const store = transaction.objectStore("schedules");

  const item = await requestResult(
    store.get(id)
  );

  if (item) {
    item.completed = 1;
    store.put(item);
  }

  await transactionComplete(transaction);
}

export async function deleteSchedule(
  id: number
): Promise<void> {
  const db = requireDB();

  const transaction = db.transaction(
    "schedules",
    "readwrite"
  );

  transaction.objectStore("schedules").delete(id);

  await transactionComplete(transaction);
}

export async function getItemCounts(): Promise<
  Record<string, number>
> {
  const db = requireDB();

  const transaction = db.transaction(
    "items",
    "readonly"
  );

  const items = await requestResult(
    transaction.objectStore("items").getAll()
  );

  const counts: Record<string, number> = {};

  for (const item of items as Item[]) {
    counts[item.category] =
      (counts[item.category] ?? 0) + 1;
  }

  return counts;
}

export async function addItem(
  category: string,
  name: string,
  manufacturer = "",
  model = "",
  purchaseDate = "",
  purchasePrice = 0,
  memo = ""
): Promise<void> {
  const db = requireDB();

  const transaction = db.transaction(
    "items",
    "readwrite"
  );

  transaction.objectStore("items").add({
    category,
    name,
    manufacturer,
    model,
    purchase_date: purchaseDate,
    purchase_price: purchasePrice,
    memo,
    created_at: new Date().toISOString(),
  });

  await transactionComplete(transaction);
}

export async function getAllItems(): Promise<Item[]> {
  const db = requireDB();

  const transaction = db.transaction(
    "items",
    "readonly"
  );

  return requestResult(
    transaction.objectStore("items").getAll()
  );
}

export async function exportJson(): Promise<string> {
  const schedules = await getAllSchedules();
  const items = await getAllItems();

  return JSON.stringify(
    {
      app: "우리집 통합관리",
      schema_version: 1,
      exported_at: new Date().toISOString(),
      data: {
        schedules,
        items,
      },
    },
    null,
    2
  );
}

export async function getAllSchedules(): Promise<
  Schedule[]
> {
  const db = requireDB();

  const transaction = db.transaction(
    "schedules",
    "readonly"
  );

  return requestResult(
    transaction.objectStore("schedules").getAll()
  );
}

export async function exportCsvSchedules(): Promise<string> {
  const rows = await getAllSchedules();

  const header =
    "id,title,due_date,priority,category,item_name,completed,created_at";

  const body = rows.map((r) =>
    [
      r.id,
      csv(r.title),
      r.due_date,
      r.priority,
      csv(r.category),
      csv(r.item_name),
      r.completed,
      r.created_at,
    ].join(",")
  );

  return "\uFEFF" + [header, ...body].join("\n");
}

function csv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function transactionComplete(
  transaction: IDBTransaction
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error);
  });
}
