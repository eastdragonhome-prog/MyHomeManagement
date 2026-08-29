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

type InitialItem = Omit<Item, "id" | "created_at">;

const DB_NAME = "our-home-management";
const DB_VERSION = 2;

let database: IDBDatabase | null = null;

const INITIAL_ITEMS: InitialItem[] = [
  {
    category: "집관리",
    name: "LG 에어컨 2in1 응축기 교체 수리",
    manufacturer: "LG",
    model: "수리",
    purchase_date: "2026-08-03",
    purchase_price: 419500,
    memo: "응축기 누설 · 응축기 교체 · 냉매가스 충전 · ID: EVT-2026-08-03-AIRCON-REPAIR",
  },
  {
    category: "가전",
    name: "쿠쿠 인스퓨어 리모컨 비데",
    manufacturer: "쿠쿠",
    model: "인스퓨어",
    purchase_date: "2026-05-07",
    purchase_price: 137740,
    memo: "자가설치 · 5년 보증 · ID: EVT-2026-05-07-BIDET-INSTALL",
  },
  {
    category: "집관리",
    name: "이누스 투피스 치마형 양변기",
    manufacturer: "이누스",
    model: "투피스 치마형",
    purchase_date: "2026-05-06",
    purchase_price: 159000,
    memo: "설치요청 옵션 · ID: EVT-2026-05-06-TOILET-INSTALL",
  },
  {
    category: "집관리",
    name: "자동분사 스텐 욕실스프레이건 세트",
    manufacturer: "",
    model: "5M 세트",
    purchase_date: "2026-05-06",
    purchase_price: 13700,
    memo: "ID: EVT-2026-05-06-SPRAYER-PURCHASE",
  },
  {
    category: "집관리",
    name: "힘펠 제로크 환풍기",
    manufacturer: "힘펠",
    model: "제로크",
    purchase_date: "2026-04-07",
    purchase_price: 119000,
    memo: "4월 13일 설치 완료 · ID: EVT-2026-04-07-VENTILATION-INSTALL",
  },
  {
    category: "가전",
    name: "마루 스마트 자동급식기",
    manufacturer: "디클펫",
    model: "AT-310",
    purchase_date: "2026-02-11",
    purchase_price: 49900,
    memo: "버튼형 · 화이트 · ID: EVT-2026-02-11-FEEDER-PURCHASE",
  },
  {
    category: "가전",
    name: "앤커 사운드코어 리버티4 NC",
    manufacturer: "앤커",
    model: "리버티4 NC",
    purchase_date: "2026-01-28",
    purchase_price: 63040,
    memo: "화이트 · 24개월 보장 · ID: EVT-2026-01-28-EARBUDS-PURCHASE",
  },
  {
    category: "가전",
    name: "쿠쿠 에코웨일 음식물처리기",
    manufacturer: "쿠쿠",
    model: "에코웨일",
    purchase_date: "2025-07-10",
    purchase_price: 448000,
    memo: "그레이스 화이트 · ID: EVT-2025-07-10-FOODWASTE-PURCHASE",
  },
  {
    category: "가전",
    name: "쿠쿠 식기세척기",
    manufacturer: "쿠쿠",
    model: "식기세척기",
    purchase_date: "2025-07-10",
    purchase_price: 448000,
    memo: "안심케어 보험 가입 · ID: EVT-2025-07-10-DISHWASHER-PURCHASE",
  },
  {
    category: "가전",
    name: "LG 트롬 오브제 워시타워",
    manufacturer: "LG",
    model: "FH25ESX · 2025년형",
    purchase_date: "2025-05-24",
    purchase_price: 3289980,
    memo: "ID: EVT-2025-05-24-WASHTOWER-PURCHASE",
  },
  {
    category: "집관리",
    name: "다빈치 LED 전등교체",
    manufacturer: "다빈치",
    model: "LED 전등",
    purchase_date: "2022-12-08",
    purchase_price: 136700,
    memo: "2건 합계 · ID: EVT-2022-12-08-LIGHT-REPLACEMENT",
  },
  {
    category: "집관리",
    name: "다빈치 LED 거실용 조명",
    manufacturer: "다빈치",
    model: "LED 거실용 조명",
    purchase_date: "2022-12-05",
    purchase_price: 43400,
    memo: "네이버페이 · ID: EVT-2022-12-05-LIVING-LIGHT-PURCHASE",
  },
  {
    category: "가전",
    name: "레노버 로봇청소기 T1S Pro",
    manufacturer: "레노버",
    model: "T1S Pro",
    purchase_date: "2022-07-20",
    purchase_price: 176570,
    memo: "큐텐 구매 · ID: EVT-2022-07-20-ROBOTVAC-PURCHASE",
  },
  {
    category: "문서",
    name: "이은찬 휴대폰",
    manufacturer: "A모바일(LGU+)",
    model: "4.5GB + 1Mbps",
    purchase_date: "2024-08-21",
    purchase_price: 6000,
    memo: "통신 계약 · 월요금 6,000원 · 종료일 없음 · 민감정보 표시 숨김 · ID: TEL-CONTRACT-001",
  },
  {
    category: "문서",
    name: "이서현 휴대폰",
    manufacturer: "A모바일(LGU+)",
    model: "4.5GB + 1Mbps",
    purchase_date: "2024-08-26",
    purchase_price: 6000,
    memo: "통신 계약 · 월요금 6,000원 · 종료일 없음 · 민감정보 표시 숨김 · ID: TEL-CONTRACT-002",
  },
  {
    category: "문서",
    name: "이동용 휴대폰",
    manufacturer: "에스원 안심모바일(LGU+)",
    model: "100GB + 5Mbps",
    purchase_date: "2026-05-23",
    purchase_price: 11500,
    memo: "통신 계약 · 월요금 11,500원 · 종료일 2026-12-23 · 7개월 할인 · 민감정보 표시 숨김 · ID: TEL-CONTRACT-003",
  },
  {
    category: "문서",
    name: "성은아 휴대폰",
    manufacturer: "에스원 안심모바일(LGU+)",
    model: "100GB + 5Mbps",
    purchase_date: "2026-05-23",
    purchase_price: 11500,
    memo: "통신 계약 · 월요금 11,500원 · 종료일 2026-12-23 · 7개월 할인 · 민감정보 표시 숨김 · ID: TEL-CONTRACT-004",
  },
  {
    category: "문서",
    name: "가정 인터넷",
    manufacturer: "브로드밴드",
    model: "인터넷",
    purchase_date: "2026-08-20",
    purchase_price: 14300,
    memo: "통신 계약 · 월요금 14,300원 · 종료일 2029-08-20 · 3년 할인 · 민감정보 표시 숨김 · ID: TEL-CONTRACT-005",
  },
  {
    category: "증여",
    name: "첫째 아들 증여 신고",
    manufacturer: "",
    model: "증여",
    purchase_date: "2025-12-30",
    purchase_price: 16323618,
    memo: "사용자 제공 신고 사실 기록 · 민감정보 표시 숨김 · ID: GFT-CHILD-001",
  },
  {
    category: "증여",
    name: "둘째 딸 증여 신고",
    manufacturer: "",
    model: "증여",
    purchase_date: "2025-12-30",
    purchase_price: 16318585,
    memo: "사용자 제공 신고 사실 기록 · 민감정보 표시 숨김 · ID: GFT-CHILD-002",
  },
  {
    category: "가족",
    name: "장인어른 생신",
    manufacturer: "장인어른",
    model: "음력 12월 19일",
    purchase_date: "",
    purchase_price: 0,
    memo: "음력 · 윤달 아니오 · ID: BDAY-INLAW-FATHER",
  },
  {
    category: "가족",
    name: "장모님 생신",
    manufacturer: "장모님",
    model: "음력 2월 6일",
    purchase_date: "",
    purchase_price: 0,
    memo: "음력 · 윤달 아니오 · ID: BDAY-INLAW-MOTHER",
  },
  {
    category: "가족",
    name: "아버지 생신",
    manufacturer: "아버지",
    model: "음력 11월 9일",
    purchase_date: "",
    purchase_price: 0,
    memo: "음력 · 윤달 아니오 · ID: BDAY-FATHER",
  },
  {
    category: "가족",
    name: "어머니 생신",
    manufacturer: "어머니",
    model: "음력 2월 29일",
    purchase_date: "",
    purchase_price: 0,
    memo: "음력 · 윤달 아니오 · ID: BDAY-MOTHER",
  },
  {
    category: "가족",
    name: "내 생일",
    manufacturer: "본인",
    model: "음력 12월 24일",
    purchase_date: "",
    purchase_price: 0,
    memo: "음력 · 윤달 아니오 · ID: BDAY-SELF",
  },
  {
    category: "가족",
    name: "부인 생일",
    manufacturer: "부인",
    model: "양력 6월 5일",
    purchase_date: "",
    purchase_price: 0,
    memo: "양력 생일 · ID: BDAY-SPOUSE",
  },
  {
    category: "가족",
    name: "아들 생일",
    manufacturer: "아들",
    model: "양력 11월 19일",
    purchase_date: "",
    purchase_price: 0,
    memo: "양력 생일 · ID: BDAY-SON",
  },
  {
    category: "가족",
    name: "딸 생일",
    manufacturer: "딸",
    model: "양력 5월 5일",
    purchase_date: "",
    purchase_price: 0,
    memo: "양력 생일 · ID: BDAY-DAUGHTER",
  },
  {
    category: "가족",
    name: "마루",
    manufacturer: "말티푸",
    model: "수컷",
    purchase_date: "2025-10-04",
    purchase_price: 0,
    memo: "반려동물 · 체중 3kg 이상 · 중성화 완료",
  },
  {
    category: "자동차",
    name: "내 차량",
    manufacturer: "차량번호 미등록",
    model: "현재 주행거리 미등록",
    purchase_date: "",
    purchase_price: 0,
    memo: "초기 차량 정보",
  },
];

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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await seedInitialData();
}

function getDB(): IDBDatabase {
  if (!database) throw new Error("DB not initialized");
  return database;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/* 기존 항목을 유지하며, 없는 초기 목록만 한 번씩 저장합니다. */
async function seedInitialData(): Promise<void> {
  const db = getDB();
  const readTx = db.transaction("items", "readonly");
  const existingItems = await requestResult(
    readTx.objectStore("items").getAll()
  );
  const existingKeys = new Set(
    existingItems.map((item) => `${item.category}:${item.name}`)
  );
  const missingItems = INITIAL_ITEMS.filter(
    (item) => !existingKeys.has(`${item.category}:${item.name}`)
  );

  if (!missingItems.length) return;

  const tx = db.transaction("items", "readwrite");
  const store = tx.objectStore("items");
  const createdAt = new Date().toISOString();

  missingItems.forEach((item) => {
    store.add({ ...item, created_at: createdAt });
  });

  await txDone(tx);
}

export async function querySchedules(): Promise<Schedule[]> {
  const tx = getDB().transaction("schedules", "readonly");
  const rows = await requestResult(tx.objectStore("schedules").getAll());
  return rows
    .filter((x) => x.completed === 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export async function addSchedule(title: string, dueDate: string, priority = 2, category = "일정", itemName = ""): Promise<void> {
  const tx = getDB().transaction("schedules", "readwrite");
  tx.objectStore("schedules").add({
    title, due_date: dueDate, priority, category, item_name: itemName,
    completed: 0, created_at: new Date().toISOString(),
  });
  await txDone(tx);
}

export async function completeSchedule(id: number): Promise<void> {
  const tx = getDB().transaction("schedules", "readwrite");
  const store = tx.objectStore("schedules");
  const row = await requestResult(store.get(id));
  if (row) { row.completed = 1; store.put(row); }
  await txDone(tx);
}

export async function getAllSchedules(): Promise<Schedule[]> {
  const tx = getDB().transaction("schedules", "readonly");
  return requestResult(tx.objectStore("schedules").getAll());
}

export async function addItem(category: string, name: string, manufacturer = "", model = "", purchaseDate = "", purchasePrice = 0, memo = ""): Promise<void> {
  const tx = getDB().transaction("items", "readwrite");
  tx.objectStore("items").add({
    category, name, manufacturer, model, purchase_date: purchaseDate,
    purchase_price: purchasePrice, memo, created_at: new Date().toISOString(),
  });
  await txDone(tx);
}

export async function getItemsByCategory(category: string): Promise<Item[]> {
  const tx = getDB().transaction("items", "readonly");
  const rows = await requestResult(tx.objectStore("items").index("category").getAll(category));
  return rows.sort((a, b) => (b.purchase_date || "").localeCompare(a.purchase_date || ""));
}

export async function getAllItems(): Promise<Item[]> {
  const tx = getDB().transaction("items", "readonly");
  return requestResult(tx.objectStore("items").getAll());
}

export async function deleteItem(id: number): Promise<void> {
  const tx = getDB().transaction("items", "readwrite");
  tx.objectStore("items").delete(id);
  await txDone(tx);
}

export async function updateItem(id: number, name: string, model = "", purchasePrice = 0, manufacturer = "", purchaseDate = "", memo = ""): Promise<void> {
  const tx = getDB().transaction("items", "readwrite");
  const store = tx.objectStore("items");
  const row = await requestResult(store.get(id));
  if (row) {
    row.name = name; row.model = model; row.purchase_price = purchasePrice;
    row.manufacturer = manufacturer; row.purchase_date = purchaseDate; row.memo = memo;
    store.put(row);
  }
  await txDone(tx);
}

export async function getItemCounts(): Promise<Record<string, number>> {
  const rows = await getAllItems();
  return rows.reduce<Record<string, number>>((result, item) => {
    result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, {});
}

export async function exportJson(): Promise<string> {
  return JSON.stringify({ schedules: await getAllSchedules(), items: await getAllItems() }, null, 2);
}

export async function exportCsvSchedules(): Promise<string> {
  const rows = await getAllSchedules();
  const header = "id,title,due_date,priority";
  const body = rows.map((x) => `${x.id},"${x.title.replace(/"/g, '""')}",${x.due_date},${x.priority}`);
  return "\uFEFF" + [header, ...body].join("\n");
}
