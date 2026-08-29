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
const DB_VERSION = 2;

let database: IDBDatabase | null = null;

export async function initDB(): Promise<void> {
  if (database) return;

  database = await new Promise<IDBDatabase>(
    (resolve, reject) => {
      const request = indexedDB.open(
        DB_NAME,
        DB_VERSION
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        if (
          !db.objectStoreNames.contains(
            "schedules"
          )
        ) {
          const store =
            db.createObjectStore(
              "schedules",
              {
                keyPath: "id",
                autoIncrement: true,
              }
            );

          store.createIndex(
            "due_date",
            "due_date"
          );

          store.createIndex(
            "completed",
            "completed"
          );
        }

        if (
          !db.objectStoreNames.contains(
            "items"
          )
        ) {
          const store =
            db.createObjectStore(
              "items",
              {
                keyPath: "id",
                autoIncrement: true,
              }
            );

          store.createIndex(
            "category",
            "category"
          );
        }
      };

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

function getDB(): IDBDatabase {
  if (!database) {
    throw new Error(
      "DB not initialized"
    );
  }

  return database;
}

function requestResult<T>(
  request: IDBRequest<T>
): Promise<T> {
  return new Promise(
    (resolve, reject) => {
      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

function txDone(
  tx: IDBTransaction
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      tx.oncomplete = () =>
        resolve();

      tx.onerror = () =>
        reject(tx.error);

      tx.onabort = () =>
        reject(tx.error);
    }
  );
}

/* 일정 */

export async function querySchedules(): Promise<
  Schedule[]
> {
  const tx = getDB().transaction(
    "schedules",
    "readonly"
  );

  const rows =
    await requestResult(
      tx.objectStore(
        "schedules"
      ).getAll()
    );

  return rows
    .filter(
      (x) => x.completed === 0
    )
    .sort((a, b) =>
      a.due_date.localeCompare(
        b.due_date
      )
    );
}

export async function addSchedule(
  title: string,
  dueDate: string,
  priority = 2,
  category = "일정",
  itemName = ""
): Promise<void> {
  const tx = getDB().transaction(
    "schedules",
    "readwrite"
  );

  tx.objectStore(
    "schedules"
  ).add({
    title,
    due_date: dueDate,
    priority,
    category,
    item_name: itemName,
    completed: 0,
    created_at:
      new Date().toISOString(),
  });

  await txDone(tx);
}

export async function completeSchedule(
  id: number
): Promise<void> {
  const tx = getDB().transaction(
    "schedules",
    "readwrite"
  );

  const store =
    tx.objectStore(
      "schedules"
    );

  const row =
    await requestResult(
      store.get(id)
    );

  if (row) {
    row.completed = 1;
    store.put(row);
  }

  await txDone(tx);
}

export async function getAllSchedules(): Promise<
  Schedule[]
> {
  const tx = getDB().transaction(
    "schedules",
    "readonly"
  );

  return requestResult(
    tx.objectStore(
      "schedules"
    ).getAll()
  );
}

/* 가전/관리항목 */

export async function addItem(
  category: string,
  name: string,
  manufacturer = "",
  model = "",
  purchaseDate = "",
  purchasePrice = 0,
  memo = ""
): Promise<void> {
  const tx = getDB().transaction(
    "items",
    "readwrite"
  );

  tx.objectStore("items").add({
    category,
    name,
    manufacturer,
    model,
    purchase_date:
      purchaseDate,
    purchase_price:
      purchasePrice,
    memo,
    created_at:
      new Date().toISOString(),
  });

  await txDone(tx);
}

export async function getItemsByCategory(
  category: string
): Promise<Item[]> {
  const tx = getDB().transaction(
    "items",
    "readonly"
  );

  return requestResult(
    tx
      .objectStore("items")
      .index("category")
      .getAll(category)
  );
}

export async function deleteItem(
  id: number
): Promise<void> {
  const tx = getDB().transaction(
    "items",
    "readwrite"
  );

  tx.objectStore("items").delete(
    id
  );

  await txDone(tx);
}

export async function getAllItems(): Promise<
  Item[]
> {
  const tx = getDB().transaction(
    "items",
    "readonly"
  );

  return requestResult(
    tx.objectStore("items").getAll()
  );
}

export async function getItemCounts(): Promise<
  Record<string, number>
> {
  const rows =
    await getAllItems();

  const result: Record<
    string,
    number
  > = {};

  rows.forEach((x) => {
    result[x.category] =
      (result[x.category] || 0) +
      1;
  });

  return result;
}

/* 백업 */

export async function exportJson(): Promise<string> {
  return JSON.stringify(
    {
      schedules:
        await getAllSchedules(),
      items:
        await getAllItems(),
    },
    null,
    2
  );
}

export async function exportCsvSchedules(): Promise<string> {
  const rows =
    await getAllSchedules();

  const header =
    "id,title,due_date,priority";

  const body = rows.map(
    (x) =>
      `${x.id},"${x.title}",${x.due_date},${x.priority}`
  );

  return (
    "\uFEFF" +
    [header, ...body].join("\n")
  );
}
