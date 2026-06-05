const sensorConfigs = [
  { key: "light", label: "Ánh sáng", unit: "%", min: 0, max: 100, color: "#057a8c" },
  { key: "sound", label: "Âm thanh", unit: "%", min: 0, max: 100, color: "#7c3aed" },
  { key: "temperature", label: "Nhiệt độ", unit: "°C", min: 0, max: 50, color: "#d26a00" },
  { key: "humidity", label: "Độ ẩm", unit: "%", min: 0, max: 100, color: "#087443" },
  { key: "rain", label: "Nước mưa", unit: "%", min: 0, max: 100, color: "#155eef" },
];

const fields = {
  status: document.querySelector("#statusBadge"),
  updatedAt: document.querySelector("#updatedAt"),
  serialPort: document.querySelector("#serialPort"),
  dataState: document.querySelector("#dataState"),
  weatherState: document.querySelector("#weatherState"),
  historyBody: document.querySelector("#historyBody"),
  sampleCount: document.querySelector("#sampleCount"),
  serialDetail: document.querySelector("#serialDetail"),
  connectionDetail: document.querySelector("#connectionDetail"),
  errorDetail: document.querySelector("#errorDetail"),
  aiModel: document.querySelector("#aiModel"),
  aiState: document.querySelector("#aiState"),
  aiSummary: document.querySelector("#aiSummary"),
  aiWeather: document.querySelector("#aiWeather"),
  aiRecommendation: document.querySelector("#aiRecommendation"),
  sensorTrendChart: document.querySelector("#sensorTrendChart"),
  chartSampleCount: document.querySelector("#chartSampleCount"),
  riskBars: document.querySelector("#riskBars"),
};

const sensorFields = Object.fromEntries(
  sensorConfigs.map((sensor) => [
    sensor.key,
    {
      value: document.querySelector(`#${sensor.key}Value`),
      risk: document.querySelector(`#${sensor.key}Risk`),
      status: document.querySelector(`#${sensor.key}Status`),
      meter: document.querySelector(`#${sensor.key}Meter`),
      riskMeter: document.querySelector(`#${sensor.key}RiskMeter`),
    },
  ])
);

function statusLabel(status) {
  const labels = {
    normal: "Bình thường",
    warning: "Cảnh báo",
    danger: "Nguy hiểm",
    waiting: "Chờ phần cứng",
    unknown: "Không rõ",
  };
  return labels[status] || "Không rõ";
}

function weatherLabel(condition) {
  const labels = {
    rainy: "Trời đang mưa",
    sunny: "Trời đang nắng",
    cloudy: "Trời nhiều mây",
    unknown: "Chưa xác định",
  };
  return labels[condition] || "Chưa xác định";
}

function formatNumber(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "--";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function meterPercent(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return clamp(((numeric - min) / (max - min)) * 100, 0, 100);
}

function setMeter(element, percent) {
  if (element) {
    element.style.width = `${percent}%`;
  }
}

function setModuleStatus(element, status) {
  if (!element) {
    return;
  }
  const normalized = status || "unknown";
  element.className = `module-status ${normalized}`;
  element.textContent = statusLabel(normalized);
}

function setStatusBadge(status) {
  fields.status.className = `status-badge ${status}`;
  fields.status.innerHTML = `
    <span class="status-dot"></span>
    <span>${statusLabel(status)}</span>
  `;
}

function serialStatusText(health) {
  if (!health) {
    return "Chưa có dữ liệu từ phần cứng";
  }
  if (health.connected && health.serial_port) {
    return `Đang đọc từ ${health.serial_port}`;
  }
  return health.last_error || "Chưa có dữ liệu từ phần cứng";
}

function setHardwareStatus(health, hasData) {
  const port = health?.serial_port || "--";
  const connected = Boolean(health?.connected);
  const error = health?.last_error || "--";

  fields.serialPort.textContent = port;
  fields.serialDetail.textContent = port;
  fields.connectionDetail.textContent = connected ? "Đang đọc Serial" : "Chưa kết nối";
  fields.errorDetail.textContent = error;
  fields.dataState.textContent = hasData ? "Đang nhận dữ liệu" : "Chờ phần cứng";
}

function setWaiting(health) {
  sensorConfigs.forEach((sensor) => {
    const target = sensorFields[sensor.key];
    target.value.textContent = "--";
    target.risk.textContent = "--";
    setModuleStatus(target.status, "waiting");
    setMeter(target.meter, 0);
    setMeter(target.riskMeter, 0);
  });

  fields.updatedAt.textContent = serialStatusText(health);
  fields.weatherState.textContent = "--";
  setStatusBadge("waiting");
  setHardwareStatus(health, false);
}

function setLatest(data, health) {
  if (!data) {
    setWaiting(health);
    return;
  }

  sensorConfigs.forEach((sensor) => {
    const target = sensorFields[sensor.key];
    const riskKey = `${sensor.key}_risk`;
    const statusKey = `${sensor.key}_status`;

    target.value.textContent = formatNumber(data[sensor.key]);
    target.risk.textContent = formatNumber(data[riskKey], 2);
    setModuleStatus(target.status, data[statusKey]);
    setMeter(target.meter, meterPercent(data[sensor.key], sensor.min, sensor.max));
    setMeter(target.riskMeter, meterPercent(data[riskKey], 0, 1));
  });

  fields.updatedAt.textContent = data.timestamp || "--";
  fields.weatherState.textContent = `${weatherLabel(data.weather_condition)} - tin cậy ${formatNumber(Number(data.weather_confidence) * 100, 0)}%`;
  setStatusBadge(data.status || "unknown");
  setHardwareStatus(health, true);
}

function chartPoint(value, index, total, min, max) {
  const width = 650;
  const height = 190;
  const left = 52;
  const top = 22;
  const x = total <= 1 ? left + width : left + (index / (total - 1)) * width;
  const percent = meterPercent(value, min, max) / 100;
  const y = top + height - percent * height;
  return [x, y];
}

function buildLinePath(points) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function buildAreaPath(points) {
  if (!points.length) {
    return "";
  }
  const baseY = 212;
  return `${buildLinePath(points)} L ${points[points.length - 1][0].toFixed(1)} ${baseY} L ${points[0][0].toFixed(1)} ${baseY} Z`;
}

function renderSensorTrend(items) {
  const chart = fields.sensorTrendChart;
  if (!chart) {
    return;
  }

  const samples = items.slice(-24);
  const hasEnoughData = samples.length >= 2;
  chart.parentElement.classList.toggle("has-data", hasEnoughData);

  if (!hasEnoughData) {
    chart.innerHTML = "";
    return;
  }

  const gridLines = [22, 69.5, 117, 164.5, 212]
    .map((y) => `<line class="chart-grid-line" x1="52" x2="702" y1="${y}" y2="${y}"></line>`)
    .join("");

  const labels = [
    '<text class="chart-axis-label" x="16" y="27">max</text>',
    '<text class="chart-axis-label" x="19" y="122">mid</text>',
    '<text class="chart-axis-label" x="20" y="216">min</text>',
  ].join("");

  const paths = sensorConfigs
    .map((line) => {
      const points = samples.map((item, index) =>
        chartPoint(item[line.key], index, samples.length, line.min, line.max)
      );
      const path = buildLinePath(points);
      const area = buildAreaPath(points);
      const lastPoint = points[points.length - 1];

      return `
        <path class="chart-area" d="${area}" fill="${line.color}"></path>
        <path class="chart-line" d="${path}" stroke="${line.color}"></path>
        <circle class="chart-point" cx="${lastPoint[0].toFixed(1)}" cy="${lastPoint[1].toFixed(1)}" r="4" fill="${line.color}"></circle>
      `;
    })
    .join("");

  chart.innerHTML = `${gridLines}${labels}${paths}`;
}

function renderRiskBars(items) {
  if (!fields.riskBars) {
    return;
  }

  const samples = items.slice(-6).reverse();
  if (fields.chartSampleCount) {
    fields.chartSampleCount.textContent = `${samples.length} điểm`;
  }

  if (!samples.length) {
    fields.riskBars.innerHTML = '<p class="chart-empty">Chưa có risk để hiển thị</p>';
    return;
  }

  fields.riskBars.innerHTML = samples
    .map((item, index) => {
      const score = Number.isFinite(Number(item.anomaly_score)) ? Number(item.anomaly_score) : 0;
      const width = meterPercent(score, 0, 1);
      const label = index === 0 ? "Mới nhất" : `Mẫu ${index + 1}`;

      return `
        <div class="risk-bar">
          <span class="risk-bar-label">${label}</span>
          <span class="risk-track"><span class="risk-fill" style="width: ${width}%"></span></span>
          <span class="risk-bar-value">${formatNumber(score, 2)}</span>
          <span class="risk-bar-time">${item.timestamp || "--"}</span>
        </div>
      `;
    })
    .join("");
}

function renderCharts(items) {
  renderSensorTrend(items);
  renderRiskBars(items);
}

function setHistory(items) {
  items = Array.isArray(items) ? items : [];
  fields.sampleCount.textContent = `${items.length} mẫu`;
  renderCharts(items);

  if (!items.length) {
    fields.historyBody.innerHTML = `
      <tr>
        <td colspan="13" class="empty-row">Chưa có dữ liệu từ phần cứng</td>
      </tr>
    `;
    return;
  }

  fields.historyBody.innerHTML = items
    .slice()
    .reverse()
    .map((item) => `
      <tr>
        <td>${item.timestamp || "--"}</td>
        ${sensorConfigs
          .map((sensor) => `
            <td>${formatNumber(item[sensor.key])}${sensor.unit}</td>
            <td><span class="risk-value ${item[`${sensor.key}_status`]}">${formatNumber(item[`${sensor.key}_risk`], 2)}</span></td>
          `)
          .join("")}
        <td>${formatNumber(item.anomaly_score, 2)}</td>
        <td><span class="table-status ${item.status}">${statusLabel(item.status)}</span></td>
      </tr>
    `)
    .join("");
}

function setAiWaiting(message = "Chờ dữ liệu từ phần cứng") {
  fields.aiModel.textContent = "Hardware";
  fields.aiState.className = "pill waiting";
  fields.aiState.textContent = "Chờ dữ liệu";
  fields.aiSummary.textContent = message;
  fields.aiWeather.textContent = "--";
  fields.aiRecommendation.textContent = "--";
}

function setAiAnalysis(data) {
  if (!data || !data.available) {
    setAiWaiting(data?.summary || "Chưa có phân tích từ phần cứng");
    fields.aiRecommendation.textContent = data?.recommendation || "--";
    return;
  }

  const risk = data.risk_level || "unknown";
  fields.aiModel.textContent = data.model || "Hardware";
  fields.aiState.className = `pill ${risk}`;
  fields.aiState.textContent = statusLabel(risk);
  fields.aiSummary.textContent = data.summary || "Không có tóm tắt";
  fields.aiWeather.textContent = `${weatherLabel(data.weather_condition)} - độ tin cậy ${formatNumber(Number(data.weather_confidence) * 100, 0)}%`;
  fields.aiRecommendation.textContent = data.recommendation || "Không có đề xuất";
}

async function refreshDashboard() {
  try {
    const [latestResponse, historyResponse, healthResponse] = await Promise.all([
      fetch("/api/latest"),
      fetch("/api/history"),
      fetch("/api/health"),
    ]);

    const latest = await latestResponse.json();
    const history = await historyResponse.json();
    const health = await healthResponse.json();

    setLatest(latest, health);
    setHistory(history);
  } catch (error) {
    setStatusBadge("danger");
    fields.updatedAt.textContent = "Mất kết nối tới backend";
    console.error(error);
  }
}

async function refreshAiAnalysis() {
  try {
    const response = await fetch("/api/ai-analysis");
    setAiAnalysis(await response.json());
  } catch (error) {
    setAiWaiting("Mất kết nối tới API phân tích");
    console.error(error);
  }
}

refreshDashboard();
refreshAiAnalysis();
setInterval(refreshDashboard, 1000);
setInterval(refreshAiAnalysis, 5000);
