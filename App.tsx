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
  updateItem,
  type Schedule,
  type Item,
} from "./db";

const MENU = [
  ["home", "⌂", "홈"],
  ["schedule", "▣", "일정"],
  ["appliance", "▤", "가전"],
  ["vehicle", "▰", "자동차"],
  ["insurance", "◇", "보험"],
  ["homecare", "⌂", "집관리"],
  ["family", "♧", "가족"],
  ["gift", "₩", "증여"],
  ["documents", "□", "문서"],
] as const;

const CATEGORY_MAP: Record<string, string> = {
  appliance: "가전",
  vehicle: "자동차",
  insurance: "보험",
  homecare: "집관리",
  family: "가족",
  gift: "증여",
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

  const [appliances, setAppliances] =
    useState<Item[]>([]);

  const [vehicles, setVehicles] =
    useState<Item[]>([]);

  const [categoryItems, setCategoryItems] =
    useState<Item[]>([]);

  const [modal, setModal] =
    useState(false);

  const [selectedAppliance, setSelectedAppliance] =
    useState<Item | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Item | null>(null);

  const [selectedCategoryItem, setSelectedCategoryItem] =
    useState<Item | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  /* 일정 입력 */
  const [title, setTitle] =
    useState("");

  const [date, setDate] =
    useState("");

  const [priority, setPriority] =
    useState(2);

  /* 공통 입력 */
  const [itemName, setItemName] =
    useState("");

  const [itemManufacturer, setItemManufacturer] =
    useState("");

  const [itemModel, setItemModel] =
    useState("");

  const [itemPurchaseDate, setItemPurchaseDate] =
    useState("");

  const [itemPrice, setItemPrice] =
    useState("");

  const [itemMemo, setItemMemo] =
    useState("");

  /* 가전 입력 */
  const [applianceName, setApplianceName] =
    useState("");

  const [applianceManufacturer, setApplianceManufacturer] =
    useState("");

  const [applianceModel, setApplianceModel] =
    useState("");

  const [appliancePurchaseDate, setAppliancePurchaseDate] =
    useState("");

  const [appliancePrice, setAppliancePrice] =
    useState("");

  const [applianceMemo, setApplianceMemo] =
    useState("");

  /* 자동차 입력 */
  const [vehicleName, setVehicleName] =
    useState("");

  const [vehicleManufacturer, setVehicleManufacturer] =
    useState("");

  const [vehicleModel, setVehicleModel] =
    useState("");

  const [vehiclePurchaseDate, setVehiclePurchaseDate] =
    useState("");

  const [vehiclePrice, setVehiclePrice] =
    useState("");

  const [vehicleMemo, setVehicleMemo] =
    useState("");

  async function refresh() {
    const scheduleData =
      await querySchedules();

    const countData =
      await getItemCounts();

    const applianceData =
      await getItemsByCategory("가전");

    const vehicleData =
      await getItemsByCategory("자동차");

    setSchedules(scheduleData);
    setCounts(countData);
    setAppliances(applianceData);
    setVehicles(vehicleData);

    if (CATEGORY_MAP[menu]) {
      const data =
        await getItemsByCategory(
          CATEGORY_MAP[menu]
        );

      setCategoryItems(data);
    }
  }

  async function refreshCategory(category: string) {
    const data =
      await getItemsByCategory(category);

    setCategoryItems(data);
  }

  useEffect(() => {
    initDB()
      .then(async () => {
        setReady(true);

        const scheduleData =
          await querySchedules();

        const countData =
          await getItemCounts();

        const applianceData =
          await getItemsByCategory("가전");

        const vehicleData =
          await getItemsByCategory("자동차");

        setSchedules(scheduleData);
        setCounts(countData);
        setAppliances(applianceData);
        setVehicles(vehicleData);
      })
      .catch((error) => {
        console.error(
          "DB 초기화 실패:",
          error
        );
      });
  }, []);

  useEffect(() => {
    if (
      ready &&
      CATEGORY_MAP[menu]
    ) {
      refreshCategory(
        CATEGORY_MAP[menu]
      );
    }
  }, [menu, ready]);

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

  function resetScheduleForm() {
    setTitle("");
    setDate("");
    setPriority(2);
  }

  function resetApplianceForm() {
    setApplianceName("");
    setApplianceManufacturer("");
    setApplianceModel("");
    setAppliancePurchaseDate("");
    setAppliancePrice("");
    setApplianceMemo("");
  }

  function resetVehicleForm() {
    setVehicleName("");
    setVehicleManufacturer("");
    setVehicleModel("");
    setVehiclePurchaseDate("");
    setVehiclePrice("");
    setVehicleMemo("");
  }

  function resetCategoryForm() {
    setItemName("");
    setItemManufacturer("");
    setItemModel("");
    setItemPurchaseDate("");
    setItemPrice("");
    setItemMemo("");
    setEditingId(null);
  }

  function openAddModal() {
    setEditingId(null);

    setSelectedAppliance(null);
    setSelectedVehicle(null);
    setSelectedCategoryItem(null);

    resetScheduleForm();
    resetApplianceForm();
    resetVehicleForm();
    resetCategoryForm();

    setModal(true);
  }

  function openApplianceEdit(
    appliance: Item
  ) {
    setEditingId(appliance.id);

    setApplianceName(
      appliance.name || ""
    );

    setApplianceManufacturer(
      appliance.manufacturer || ""
    );

    setApplianceModel(
      appliance.model || ""
    );

    setAppliancePurchaseDate(
      appliance.purchase_date || ""
    );

    setAppliancePrice(
      appliance.purchase_price !== undefined &&
      appliance.purchase_price !== null
        ? String(appliance.purchase_price)
        : ""
    );

    setApplianceMemo(
      appliance.memo || ""
    );

    setSelectedAppliance(null);
    setSelectedVehicle(null);
    setSelectedCategoryItem(null);

    setMenu("appliance");
    setModal(true);
  }

  function openVehicleEdit(
    vehicle: Item
  ) {
    setEditingId(vehicle.id);

    setVehicleName(
      vehicle.name || ""
    );

    setVehicleManufacturer(
      vehicle.manufacturer || ""
    );

    setVehicleModel(
      vehicle.model || ""
    );

    setVehiclePurchaseDate(
      vehicle.purchase_date || ""
    );

    setVehiclePrice(
      vehicle.purchase_price !== undefined &&
      vehicle.purchase_price !== null
        ? String(vehicle.purchase_price)
        : ""
    );

    setVehicleMemo(
      vehicle.memo || ""
    );

    setSelectedAppliance(null);
    setSelectedVehicle(null);
    setSelectedCategoryItem(null);

    setMenu("vehicle");
    setModal(true);
  }

  function openCategoryEdit(
    item: Item
  ) {
    setEditingId(item.id);

    setItemName(
      item.name || ""
    );

    setItemManufacturer(
      item.manufacturer || ""
    );

    setItemModel(
      item.model || ""
    );

    setItemPurchaseDate(
      item.purchase_date || ""
    );

    setItemPrice(
      item.purchase_price !== undefined &&
      item.purchase_price !== null
        ? String(item.purchase_price)
        : ""
    );

    setItemMemo(
      item.memo || ""
    );

    setSelectedAppliance(null);
    setSelectedVehicle(null);
    setSelectedCategoryItem(null);

    setModal(true);
  }

  async function saveAppliance() {
    if (!applianceName.trim()) {
      return;
    }

    const price =
      Number(appliancePrice) || 0;

    if (editingId !== null) {
      await updateItem(
        editingId,
        applianceName.trim(),
        applianceModel.trim(),
        price,
        applianceManufacturer.trim(),
        appliancePurchaseDate,
        applianceMemo.trim()
      );
    } else {
      await addItem(
        "가전",
        applianceName.trim(),
        applianceManufacturer.trim(),
        applianceModel.trim(),
        appliancePurchaseDate,
        price,
        applianceMemo.trim()
      );
    }

    resetApplianceForm();
    setEditingId(null);
    setModal(false);

    await refresh();
  }

  async function saveVehicle() {
    if (!vehicleName.trim()) {
      return;
    }

    const price =
      Number(vehiclePrice) || 0;

    if (editingId !== null) {
      await updateItem(
        editingId,
        vehicleName.trim(),
        vehicleModel.trim(),
        price,
        vehicleManufacturer.trim(),
        vehiclePurchaseDate,
        vehicleMemo.trim()
      );
    } else {
      await addItem(
        "자동차",
        vehicleName.trim(),
        vehicleManufacturer.trim(),
        vehicleModel.trim(),
        vehiclePurchaseDate,
        price,
        vehicleMemo.trim()
      );
    }

    resetVehicleForm();
    setEditingId(null);
    setModal(false);

    await refresh();
  }

  /*
   * 보험 / 집관리 / 가족 / 증여 / 문서
   * 공통 등록
   *
   * 중요:
   * 이 함수는 일정 등록(saveSchedule)이 아닙니다.
   */
  async function saveCategoryItem() {
    const category =
      CATEGORY_MAP[menu];

    if (!category) {
      return;
    }

    if (!itemName.trim()) {
      return;
    }

    const price =
      Number(itemPrice) || 0;

    if (editingId !== null) {
      await updateItem(
        editingId,
        itemName.trim(),
        itemModel.trim(),
        price,
        itemManufacturer.trim(),
        itemPurchaseDate,
        itemMemo.trim()
      );
    } else {
      await addItem(
        category,
        itemName.trim(),
        itemManufacturer.trim(),
        itemModel.trim(),
        itemPurchaseDate,
        price,
        itemMemo.trim()
      );
    }

    resetCategoryForm();
    setModal(false);

    await refresh();
  }

  async function saveSchedule() {
    if (!title.trim() || !date) {
      return;
    }

    await addSchedule(
      title.trim(),
      date,
      priority
    );

    resetScheduleForm();
    setModal(false);

    await refresh();
  }

  async function handleDeleteAppliance(
    id: number
  ) {
    if (
      !window.confirm(
        "이 가전을 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    await deleteItem(id);

    setSelectedAppliance(null);

    await refresh();
  }

  async function handleDeleteVehicle(
    id: number
  ) {
    if (
      !window.confirm(
        "이 자동차를 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    await deleteItem(id);

    setSelectedVehicle(null);

    await refresh();
  }

  async function handleDeleteCategoryItem(
    id: number
  ) {
    if (
      !window.confirm(
        "이 항목을 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    await deleteItem(id);

    setSelectedCategoryItem(null);

    await refresh();
  }

  async function handleExportJson() {
    const data =
      await exportJson();

    download(
      "우리집_통합관리.json",
      data,
      "application/json"
    );
  }

  async function handleExportCsv() {
    const data =
      await exportCsvSchedules();

    download(
      "우리집_일정.csv",
      data,
      "text/csv;charset=utf-8"
    );
  }

  async function handleComplete(
    id: number
  ) {
    await completeSchedule(id);
    await refresh();
  }

  if (!ready) {
    return (
      <div className="loading">
        우리집 통합관리 준비 중...
      </div>
    );
  }

  const currentCategory =
    CATEGORY_MAP[menu];

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
                onClick={() => {
                  setMenu(id);
                  setModal(false);

                  setSelectedAppliance(null);
                  setSelectedVehicle(null);
                  setSelectedCategoryItem(null);
                }}
              >
                <span>{icon}</span>
                {label}
              </button>
            )
          )}
        </nav>

        <button
          className="quick"
          onClick={openAddModal}
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
                  (x) =>
                    x[0] === menu
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
              onClick={openAddModal}
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
            onComplete={
              handleComplete
            }
          />

        ) : menu === "appliance" ? (

          <AppliancePage
            items={appliances}
            onSelect={
              setSelectedAppliance
            }
            onDelete={
              handleDeleteAppliance
            }
          />

        ) : menu === "vehicle" ? (

          <VehiclePage
            items={vehicles}
            onSelect={
              setSelectedVehicle
            }
            onDelete={
              handleDeleteVehicle
            }
          />

        ) : (

          <CategoryPage
            label={
              currentCategory ??
              "관리"
            }
            count={
              counts[
                currentCategory ??
                  ""
              ] ?? 0
            }
            items={categoryItems}
            onSelect={
              setSelectedCategoryItem
            }
            onDelete={
              handleDeleteCategoryItem
            }
            onAdd={openAddModal}
          />

        )}

      </main>

      {/* =========================
          가전 상세
          ========================= */}

      {selectedAppliance && (
        <div
          className="modal-bg"
          onClick={() =>
            setSelectedAppliance(null)
          }
        >

          <div
            className="modal appliance-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>
                <small>
                  APPLIANCE DETAIL
                </small>

                <h2>
                  {
                    selectedAppliance.name
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedAppliance(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <DetailField
              label="제조사"
              value={
                selectedAppliance.manufacturer
              }
            />

            <DetailField
              label="모델명"
              value={
                selectedAppliance.model
              }
            />

            <DetailField
              label="구매일"
              value={
                selectedAppliance.purchase_date
              }
            />

            <DetailField
              label="구매금액"
              value={
                selectedAppliance.purchase_price
                  ? `${selectedAppliance.purchase_price.toLocaleString()}원`
                  : ""
              }
            />

            <DetailField
              label="메모"
              value={
                selectedAppliance.memo
              }
              memo
            />

            <div className="modal-actions">

              <button
                onClick={() =>
                  openApplianceEdit(
                    selectedAppliance
                  )
                }
              >
                수정
              </button>

              <button
                className="primary"
                onClick={() =>
                  handleDeleteAppliance(
                    selectedAppliance.id
                  )
                }
              >
                삭제
              </button>

              <button
                onClick={() =>
                  setSelectedAppliance(
                    null
                  )
                }
              >
                닫기
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          자동차 상세
          ========================= */}

      {selectedVehicle && (
        <div
          className="modal-bg"
          onClick={() =>
            setSelectedVehicle(null)
          }
        >

          <div
            className="modal appliance-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>
                <small>
                  VEHICLE DETAIL
                </small>

                <h2>
                  {
                    selectedVehicle.name
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedVehicle(null)
                }
              >
                ×
              </button>

            </div>

            <DetailField
              label="제조사"
              value={
                selectedVehicle.manufacturer
              }
            />

            <DetailField
              label="모델명"
              value={
                selectedVehicle.model
              }
            />

            <DetailField
              label="구매일"
              value={
                selectedVehicle.purchase_date
              }
            />

            <DetailField
              label="구매금액"
              value={
                selectedVehicle.purchase_price
                  ? `${selectedVehicle.purchase_price.toLocaleString()}원`
                  : ""
              }
            />

            <DetailField
              label="메모"
              value={
                selectedVehicle.memo
              }
              memo
            />

            <div className="modal-actions">

              <button
                onClick={() =>
                  openVehicleEdit(
                    selectedVehicle
                  )
                }
              >
                수정
              </button>

              <button
                className="primary"
                onClick={() =>
                  handleDeleteVehicle(
                    selectedVehicle.id
                  )
                }
              >
                삭제
              </button>

              <button
                onClick={() =>
                  setSelectedVehicle(null)
                }
              >
                닫기
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          공통 카테고리 상세
          ========================= */}

      {selectedCategoryItem && (
        <div
          className="modal-bg"
          onClick={() =>
            setSelectedCategoryItem(null)
          }
        >

          <div
            className="modal appliance-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>
                <small>
                  {
                    selectedCategoryItem.category
                      ?.toUpperCase()
                  } DETAIL
                </small>

                <h2>
                  {
                    selectedCategoryItem.name
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedCategoryItem(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <DetailField
              label="분류"
              value={
                selectedCategoryItem.category
              }
            />

            <DetailField
              label="제조사/기관"
              value={
                selectedCategoryItem.manufacturer
              }
            />

            <DetailField
              label="모델/구분"
              value={
                selectedCategoryItem.model
              }
            />

            <DetailField
              label="날짜"
              value={
                selectedCategoryItem.purchase_date
              }
            />

            <DetailField
              label="금액"
              value={
                selectedCategoryItem.purchase_price
                  ? `${selectedCategoryItem.purchase_price.toLocaleString()}원`
                  : ""
              }
            />

            <DetailField
              label="메모"
              value={
                selectedCategoryItem.memo
              }
              memo
            />

            <div className="modal-actions">

              <button
                onClick={() =>
                  openCategoryEdit(
                    selectedCategoryItem
                  )
                }
              >
                수정
              </button>

              <button
                className="primary"
                onClick={() =>
                  handleDeleteCategoryItem(
                    selectedCategoryItem.id
                  )
                }
              >
                삭제
              </button>

              <button
                onClick={() =>
                  setSelectedCategoryItem(
                    null
                  )
                }
              >
                닫기
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          등록 / 수정 모달
          ========================= */}

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
                  {menu === "appliance"
                    ? editingId !== null
                      ? "EDIT APPLIANCE"
                      : "ADD APPLIANCE"
                    : menu === "vehicle"
                    ? editingId !== null
                      ? "EDIT VEHICLE"
                      : "ADD VEHICLE"
                    : menu === "schedule"
                    ? "ADD SCHEDULE"
                    : editingId !== null
                    ? "EDIT ITEM"
                    : "ADD ITEM"}
                </small>

                <h2>
                  {menu === "appliance"
                    ? editingId !== null
                      ? "가전 수정"
                      : "가전 등록"
                    : menu === "vehicle"
                    ? editingId !== null
                      ? "자동차 수정"
                      : "자동차 등록"
                    : menu === "schedule"
                    ? "일정 등록"
                    : editingId !== null
                    ? `${currentCategory} 수정`
                    : `${currentCategory} 등록`}
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

            {/* =========================
                가전 등록 / 수정
                ========================= */}

            {menu === "appliance" ? (

              <>

                <label>
                  제품명
                </label>

                <div className="input-row">
                  <input
                    value={applianceName}
                    onChange={(e) =>
                      setApplianceName(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  제조사
                </label>

                <div className="input-row">
                  <input
                    value={
                      applianceManufacturer
                    }
                    onChange={(e) =>
                      setApplianceManufacturer(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  모델명
                </label>

                <div className="input-row">
                  <input
                    value={applianceModel}
                    onChange={(e) =>
                      setApplianceModel(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  구매일
                </label>

                <div className="input-row">
                  <input
                    className="appliance-date-input"
                    type="date"
                    value={
                      appliancePurchaseDate
                    }
                    onChange={(e) =>
                      setAppliancePurchaseDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  구매금액
                </label>

                <div className="input-row">
                  <input
                    type="number"
                    value={
                      appliancePrice
                    }
                    onChange={(e) =>
                      setAppliancePrice(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  메모
                </label>

                <div className="input-row memo-row">
                  <textarea
                    rows={6}
                    value={
                      applianceMemo
                    }
                    onChange={(e) =>
                      setApplianceMemo(
                        e.target.value
                      )
                    }
                    placeholder="메모를 입력하세요"
                  />
                </div>

              </>

            ) : menu === "vehicle" ? (

              /* =========================
                 자동차 등록 / 수정
                 ========================= */

              <>

                <label>
                  차량명
                </label>

                <div className="input-row">
                  <input
                    value={vehicleName}
                    onChange={(e) =>
                      setVehicleName(
                        e.target.value
                      )
                    }
                    placeholder="예: 쏘렌토"
                  />
                </div>

                <label>
                  제조사
                </label>

                <div className="input-row">
                  <input
                    value={
                      vehicleManufacturer
                    }
                    onChange={(e) =>
                      setVehicleManufacturer(
                        e.target.value
                      )
                    }
                    placeholder="예: 기아"
                  />
                </div>

                <label>
                  모델명
                </label>

                <div className="input-row">
                  <input
                    value={vehicleModel}
                    onChange={(e) =>
                      setVehicleModel(
                        e.target.value
                      )
                    }
                    placeholder="예: MQ4"
                  />
                </div>

                <label>
                  구매일
                </label>

                <div className="input-row">
                  <input
                    type="date"
                    value={
                      vehiclePurchaseDate
                    }
                    onChange={(e) =>
                      setVehiclePurchaseDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  구매금액
                </label>

                <div className="input-row">
                  <input
                    type="number"
                    value={
                      vehiclePrice
                    }
                    onChange={(e) =>
                      setVehiclePrice(
                        e.target.value
                      )
                    }
                    placeholder="원"
                  />
                </div>

                <label>
                  메모
                </label>

                <div className="input-row memo-row">
                  <textarea
                    rows={6}
                    value={
                      vehicleMemo
                    }
                    onChange={(e) =>
                      setVehicleMemo(
                        e.target.value
                      )
                    }
                    placeholder="차량 관련 메모를 입력하세요"
                  />
                </div>

              </>

            ) : menu === "schedule" ? (

              /* =========================
                 일정 등록
                 ========================= */

              <>

                <label>
                  할 일

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
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

              </>

            ) : (

              /* =========================
                 보험 / 집관리 / 가족 /
                 증여 / 문서 등록
                 ========================= */

              <>

                <div className="category-form-title">
                  {currentCategory}
                </div>

                <label>
                  이름 / 항목명
                </label>

                <div className="input-row">
                  <input
                    value={itemName}
                    onChange={(e) =>
                      setItemName(
                        e.target.value
                      )
                    }
                    placeholder={
                      currentCategory === "보험"
                        ? "예: 실손보험"
                        : currentCategory === "집관리"
                        ? "예: 보일러"
                        : currentCategory === "가족"
                        ? "예: 홍길동"
                        : currentCategory === "증여"
                        ? "예: 첫째 자녀"
                        : "예: 가족관계증명서"
                    }
                  />
                </div>

                <label>
                  제조사 / 기관
                </label>

                <div className="input-row">
                  <input
                    value={
                      itemManufacturer
                    }
                    onChange={(e) =>
                      setItemManufacturer(
                        e.target.value
                      )
                    }
                    placeholder="선택 입력"
                  />
                </div>

                <label>
                  모델 / 구분
                </label>

                <div className="input-row">
                  <input
                    value={itemModel}
                    onChange={(e) =>
                      setItemModel(
                        e.target.value
                      )
                    }
                    placeholder="선택 입력"
                  />
                </div>

                <label>
                  날짜
                </label>

                <div className="input-row">
                  <input
                    type="date"
                    value={
                      itemPurchaseDate
                    }
                    onChange={(e) =>
                      setItemPurchaseDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <label>
                  금액
                </label>

                <div className="input-row">
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) =>
                      setItemPrice(
                        e.target.value
                      )
                    }
                    placeholder="원"
                  />
                </div>

                <label>
                  메모
                </label>

                <div className="input-row memo-row">
                  <textarea
                    rows={6}
                    value={itemMemo}
                    onChange={(e) =>
                      setItemMemo(
                        e.target.value
                      )
                    }
                    placeholder={`${currentCategory} 관련 메모를 입력하세요`}
                  />
                </div>

              </>

            )}

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
                onClick={() => {

                  if (
                    menu === "appliance"
                  ) {

                    saveAppliance();

                  } else if (
                    menu === "vehicle"
                  ) {

                    saveVehicle();

                  } else if (
                    menu === "schedule"
                  ) {

                    /*
                     * 일정은 오직 여기서만
                     * saveSchedule() 실행
                     */
                    saveSchedule();

                  } else {

                    /*
                     * 보험 / 집관리 / 가족 /
                     * 증여 / 문서
                     *
                     * 일정 등록이 아니라
                     * 각 카테고리 데이터 저장
                     */
                    saveCategoryItem();

                  }

                }}
              >
                저장
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================
   Detail Field
   ========================= */

function DetailField({
  label,
  value,
  memo = false,
}: {
  label: string;
  value?: string | number | null;
  memo?: boolean;
}) {
  return (
    <div className="detail-field">

      <span>
        {label}
      </span>

      <div
        className={
          memo
            ? "detail-value detail-memo"
            : "detail-value"
        }
      >
        {value !== undefined &&
        value !== null &&
        String(value).trim()
          ? String(value)
          : "-"}
      </div>

    </div>
  );
}


/* =========================
   Dashboard
   ========================= */

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
    "보험",
    "집관리",
    "가족",
    "증여",
    "문서",
  ];

  return (
    <div>

      <section className="hero">

        <div>
          <small>
            TODAY
          </small>

          <h2>
            이번 달에 해야 할 일을
            <br />
            한눈에 확인하세요.
          </h2>
        </div>

        <div className="hero-count">

          <b>
            {schedules.length}
          </b>

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


/* =========================
   Card
   ========================= */

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

      <span>
        {title}
      </span>

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


/* =========================
   Schedule Row
   ========================= */

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

        <b>
          {item.title}
        </b>

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


/* =========================
   Schedule Page
   ========================= */

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


/* =========================
   Category Page
   ========================= */

type CategoryPageProps = {
  label: string;
  count: number;
  items?: Item[];
  onSelect?: (item: Item) => void;
  onDelete?: (id: number) => void | Promise<void>;
  onAdd: () => void;
};

function CategoryPage({
  label,
  count,
  items = [],
  onSelect,
  onDelete,
}: CategoryPageProps) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>{label} 목록</h2>
          <p>등록된 {label} 목록</p>
        </div>

        <span>{count}건</span>
      </div>

      <div className="list">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="row"
              onClick={() => onSelect?.(item)}
              style={{
                cursor: onSelect ? "pointer" : "default",
              }}
            >
              <div>
                <b>{item.name}</b>

                <small>
                  {item.manufacturer}
                  {item.manufacturer && item.model ? " · " : ""}
                  {item.model}
                </small>
              </div>

              <time>{item.purchase_date}</time>

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDelete(item.id);
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          ))
        ) : (
          <EmptyItem
            text={`등록된 ${label}이 없습니다.`}
          />
        )}
      </div>
    </section>
  );
}

/* =========================
   Empty
   ========================= */

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


/* =========================
   Appliance Page
   ========================= */

function AppliancePage({
  items,
  onSelect,
  onDelete,
}: {
  items: Item[];

  onSelect: (
    item: Item
  ) => void;

  onDelete: (
    id: number
  ) => void;
}) {
  return (
    <section className="section">

      <div className="section-head">

        <div>

          <h2>
            가전관리
          </h2>

          <p>
            등록된 가전 목록
          </p>

        </div>

        <span>
          {items.length}건
        </span>

      </div>

      <div className="list">

        {items.map(
          (x) => (
            <div
              key={x.id}
              className="row"
              onClick={() =>
                onSelect(x)
              }
              style={{
                cursor: "pointer",
              }}
            >

              <div>

                <b>
                  {x.name}
                </b>

                <small>
                  {x.model}
                </small>

              </div>

              <time>
                {x.purchase_date}
              </time>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(x.id);
                }}
              >
                삭제
              </button>

            </div>
          )
        )}

        {!items.length && (
          <EmptyItem
            text="등록된 가전이 없습니다."
          />
        )}

      </div>

    </section>
  );
}


/* =========================
   Vehicle Page
   ========================= */

function VehiclePage({
  items,
  onSelect,
  onDelete,
}: {
  items: Item[];

  onSelect: (
    item: Item
  ) => void;

  onDelete: (
    id: number
  ) => void;
}) {
  return (
    <section className="section">

      <div className="section-head">

        <div>

          <h2>
            자동차관리
          </h2>

          <p>
            등록된 자동차 목록
          </p>

        </div>

        <span>
          {items.length}건
        </span>

      </div>

      <div className="list">

        {items.map(
          (x) => (
            <div
              key={x.id}
              className="row"
              onClick={() =>
                onSelect(x)
              }
              style={{
                cursor: "pointer",
              }}
            >

              <div>

                <b>
                  {x.name}
                </b>

                <small>
                  {x.manufacturer}
                  {x.manufacturer &&
                  x.model
                    ? " · "
                    : ""}
                  {x.model}
                </small>

              </div>

              <time>
                {x.purchase_date}
              </time>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(x.id);
                }}
              >
                삭제
              </button>

            </div>
          )
        )}

        {!items.length && (
          <EmptyItem
            text="등록된 자동차가 없습니다."
          />
        )}

      </div>

    </section>
  );
}


/* =========================
   Empty Item
   ========================= */

function EmptyItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="empty">

      <b>＋</b>

      <p>
        {text}
      </p>

    </div>
  );
}
