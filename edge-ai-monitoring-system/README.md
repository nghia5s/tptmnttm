# Edge AI Monitoring System

Project demo he thong giam sat Edge AI gom firmware Arduino, backend Flask va dashboard web.

## Cau truc

```text
edge-ai-monitoring-system/
├── arduino/
│   └── edge_ai_sensor/
│       └── edge_ai_sensor.ino
├── backend/
│   ├── app.py
│   ├── serial_reader.py
│   ├── requirements.txt
│   └── config.py
├── frontend/
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── main.js
├── docs/
│   ├── so_do_he_thong.md
│   ├── mo_ta_du_an.md
│   ├── so_do_noi_day.md
│   └── huong_dan_chay.md
└── README.md
```

## Chay nhanh

```powershell
cd edge-ai-monitoring-system\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Sau do mo `http://127.0.0.1:5000`.

Dashboard chi hien thi du lieu khi backend doc duoc du lieu that tu Arduino. Neu chua cam hoac chua chay phan cung, dashboard se giu trang thai cho du lieu.

Firmware hien tai doc cac cam bien:

- Anh sang LDR digital `DO`: `D3`
- Am thanh analog: `A1`
- Nuoc mua analog: `A2`
- Nhiet do/do am DHT: `D2`

Xem so do dau day chi tiet tai `docs/so_do_noi_day.md`.

Trong Arduino IDE can cai `DHT sensor library by Adafruit` va `Adafruit Unified Sensor`. Mac dinh sketch dung `DHT11`; neu dung DHT22/AM2302, doi `DHT_TYPE` trong `arduino/edge_ai_sensor/edge_ai_sensor.ino`.

Firmware chay model AI don gian ngay tren Arduino theo trong so/rule, sau do gui do bat thuong va trang thai rieng cho tung module cam bien:

- `light_risk`: do bat thuong rieng cua cam bien anh sang, tu 0 den 1.
- `light_status`: trang thai cam bien anh sang.
- `sound_risk`: do bat thuong rieng cua cam bien am thanh, tu 0 den 1.
- `sound_status`: trang thai cam bien am thanh.
- `temperature_risk`: do bat thuong rieng cua cam bien nhiet do, tu 0 den 1.
- `temperature_status`: trang thai cam bien nhiet do.
- `humidity_risk`: do bat thuong rieng cua cam bien do am, tu 0 den 1.
- `humidity_status`: trang thai cam bien do am.
- `rain_risk`: do bat thuong rieng cua cam bien nuoc mua, tu 0 den 1.
- `rain_status`: trang thai cam bien nuoc mua.
- `edge_model`: ten model dang chay tren phan cung.
- `weather_condition`: ket qua phan loai thoi tiet tren phan cung, gom `rainy`, `sunny`, `cloudy`, `unknown`.
- `weather_confidence`: do tin cay cua phan loai thoi tiet, tu 0 den 1.
- `ai_risk_level`: muc rui ro do Arduino suy luan.
- `ai_summary`: tom tat ngan do Arduino tao.
- `ai_recommendation`: de xuat hanh dong do Arduino tao.

Nap lai `arduino/edge_ai_sensor/edge_ai_sensor.ino` de Arduino gui dung schema moi cho dashboard.

```powershell
$env:SERIAL_PORT="COM4"
python app.py
```

Neu khong dat `SERIAL_PORT`, backend se tu tim cong USB/Arduino, vi du `COM4`. Neu dashboard bao loi `Access is denied`, hay dong Arduino IDE Serial Monitor hoac chuong trinh khac dang giu cong COM roi chay lai backend.

## Hardware Edge AI

Dashboard co panel `AI phan tich` nhan ket qua suy luan truc tiep tu Arduino. Backend khong goi Ollama hoac model AI tren may tinh nua; backend chi doc Serial va tra ket qua do phan cung gui len.

Model hien tai la `arduino_edge_rule_v1`, phu hop voi Arduino pho thong vi dung rule/trong so nhe. Model nay doc anh sang, do am va nuoc mua de phan loai nhanh `troi dang mua`, `troi dang nang`, `troi nhieu may` hoac `chua xac dinh`. Neu dung ESP32 hoac board co RAM/Flash lon hon, co the thay phan rule trong firmware bang TinyML/TensorFlow Lite Micro.
