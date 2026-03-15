// ============================================================
// config.js - 全域設定檔（只需修改這裡）
// ============================================================
const CONFIG = {
  // ⚙️ 請填入你的 GAS Web App URL
  GAS_URL: "https://script.google.com/macros/s/AKfycbz7zIfQ3CBNQCFRalaC3daYKS0B8U_WRcC053fGTAmyjaGtsfOeZ_xEluMyKUd9bt4w/exec",

  // ⚙️ 組別數量
  GROUP_COUNT: 9,

  // ⚙️ 組別名稱（可自訂）
  GROUP_NAMES: {
    1: "第一組", 2: "第二組", 3: "第三組",
    4: "第四組", 5: "第五組", 6: "第六組",
    7: "第七組", 8: "第八組", 9: "第九組"
  },

  // ⚙️ 警示閾值
  THRESHOLD: {
    temp:      { warn_low: 22, warn_high: 28, danger_low: 18, danger_high: 32 },
    humi:      { warn_low: 60, warn_high: 80, danger_low: 50, danger_high: 90 },
    soil:      { warn_low: 40, warn_high: 75, danger_low: 30, danger_high: 85 },
    soil_temp: { warn_low: 20, warn_high: 28, danger_low: 18, danger_high: 30 }
  },

  // ⚙️ 自動刷新間隔（毫秒）
  REFRESH_INTERVAL: 60000, // 60秒

  // ⚙️ 離線判斷（分鐘）
  OFFLINE_MINS: 60,

  // 狀態對應設定
  STATUS_MAP: {
    normal:  { label: "正常", color: "#22c55e", bg: "#f0fdf4", icon: "🟢" },
    warning: { label: "注意", color: "#f59e0b", bg: "#fffbeb", icon: "🟡" },
    danger:  { label: "警示", color: "#ef4444", bg: "#fef2f2", icon: "🔴" },
    offline: { label: "離線", color: "#9ca3af", bg: "#f9fafb", icon: "⚫" }
  }
};

// ============================================================
// 共用工具函式
// ============================================================

// 取得狀態（考慮離線）
function getStatus(item) {
  if (!item.is_online) return "offline";
  return item.status || "normal";
}

// 判斷單一數值的狀態
function getValueStatus(type, value) {
  const t = CONFIG.THRESHOLD[type];
  if (!t) return "normal";
  if (value < t.danger_low || value > t.danger_high) return "danger";
  if (value < t.warn_low   || value > t.warn_high)   return "warning";
  return "normal";
}

// 格式化時間
function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

// 從 GAS 讀取資料（含 JSONP 處理 CORS）
function fetchGAS(params) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Date.now();
    const url = CONFIG.GAS_URL + "?" + new URLSearchParams(params) + "&callback=" + cbName;
    const script = document.createElement("script");

    const timer = setTimeout(() => {
      delete window[cbName];
      document.body.removeChild(script);
      reject(new Error("Timeout"));
    }, 10000);

    window[cbName] = (data) => {
      clearTimeout(timer);
      delete window[cbName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.src = url;
    script.onerror = () => {
      clearTimeout(timer);
      delete window[cbName];
      document.body.removeChild(script);
      reject(new Error("Script load error"));
    };
    document.body.appendChild(script);
  });
}