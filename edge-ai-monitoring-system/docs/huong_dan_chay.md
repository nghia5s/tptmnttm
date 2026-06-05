# Huong dan chay

## 1. Chay backend

```powershell
cd edge-ai-monitoring-system\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mo trinh duyet tai:

```text
http://127.0.0.1:5000
```

## 2. Chay voi Arduino that

1. Cai thu vien Arduino `DHT sensor library by Adafruit` va `Adafruit Unified Sensor`.
2. Dau cam bien theo `docs/so_do_noi_day.md`: LDR `DO -> D3`, am thanh `A0 -> A1`, nuoc mua `S -> A2`, DHT `OUT -> D2`.
3. Nap file `arduino/edge_ai_sensor/edge_ai_sensor.ino` vao Arduino.
4. Xac dinh cong Serial, vi du `COM4`.
5. Chay backend voi bien moi truong:

```powershell
$env:SERIAL_PORT="COM4"
python app.py
```

Dashboard khong tu sinh du lieu ao. Neu Arduino chua gui du lieu Serial hop le, dashboard se hien thi trang thai cho phan cung.

Co the bo qua bien `SERIAL_PORT`; backend se tu uu tien cong USB/Arduino. Tren may hien tai Arduino thuong la `COM4`. Neu gap loi `Access is denied`, dong Arduino IDE Serial Monitor hoac ung dung khac dang doc cong COM.

## 3. Hardware Edge AI

Panel AI tren dashboard lay ket qua tu Arduino:

- `edge_model`: ten model tren phan cung.
- `weather_condition`: ket qua troi dang mua/nang/nhieu may.
- `weather_confidence`: do tin cay cua ket qua thoi tiet.
- `ai_risk_level`: muc rui ro AI.
- `ai_summary`: tom tat ngan.
- `ai_recommendation`: de xuat hanh dong.

Backend khong can Ollama. Neu panel AI dang cho du lieu, hay nap firmware moi va kiem tra Serial JSON co cac field tren.

## 4. API

- `GET /api/health`: kiem tra backend.
- `GET /api/latest`: lay mau du lieu moi nhat.
- `GET /api/history`: lay lich su du lieu gan day.
- `GET /api/ai-analysis`: lay nhan xet AI do Arduino suy luan tren phan cung.
