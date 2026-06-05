<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
   EDGE AI MONITORING SYSTEM
</h2>
<div align="center">
    <p align="center">
        <img src="docs/aiotlab_logo.png" alt="AIoTLab Logo" width="170"/>
        <img src="docs/fitdnu_logo.png" alt="FIT DNU Logo" width="180"/>
        <img src="docs/dnu_logo.png" alt="DaiNam University Logo" width="200"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

## 1. Gioi thieu

Edge AI Monitoring System la du an demo he thong giam sat moi truong va thiet bi tai bien mang. He thong su dung Arduino de doc du lieu cam bien, chay suy luan Edge AI nhe ngay tren phan cung, sau do gui ket qua ve backend Flask thong qua cong Serial.

Dashboard web hien thi du lieu theo thoi gian gan thuc, gom anh sang, am thanh, nhiet do, do am, nuoc mua, trang thai bat thuong va ket qua phan tich AI. Du an chi hien thi du lieu that nhan tu Arduino, khong tu sinh du lieu ao khi chua co phan cung gui len.

## 2. Cong nghe su dung

- Firmware: Arduino C/C++.
- Backend: Python Flask.
- Ket noi phan cung: Serial/USB.
- Frontend: HTML, CSS va JavaScript thuan.
- Edge AI: rule/trong so nhe chay truc tiep tren Arduino.
- Cam bien: LDR, cam bien am thanh, cam bien mua, DHT11/DHT22.

## 3. Chuc nang chinh

- Doc du lieu cam bien tu Arduino qua cong Serial.
- Giam sat anh sang, am thanh, nhiet do, do am va nuoc mua.
- Tinh diem bat thuong rieng cho tung module cam bien.
- Phan loai thoi tiet tren phan cung: `rainy`, `sunny`, `cloudy`, `unknown`.
- Hien thi trang thai `normal`, `warning`, `danger`.
- Cap nhat dashboard web theo thoi gian gan thuc.
- Hien thi panel `AI phan tich` voi muc rui ro, tom tat va de xuat hanh dong.
- Cung cap API de lay trang thai backend, du lieu moi nhat, lich su va ket qua AI.

## 4. Cau truc thu muc

```text
edge-ai-monitoring-system/
+-- arduino/
|   +-- edge_ai_sensor/
|       +-- edge_ai_sensor.ino
+-- backend/
|   +-- app.py
|   +-- config.py
|   +-- hardware_ai.py
|   +-- requirements.txt
|   +-- serial_reader.py
+-- frontend/
|   +-- templates/
|   |   +-- index.html
|   +-- static/
|       +-- css/
|       |   +-- style.css
|       +-- js/
|           +-- main.js
+-- docs/
|   +-- huong_dan_chay.md
|   +-- mo_ta_du_an.md
|   +-- so_do_he_thong.md
|   +-- so_do_noi_day.md
+-- README.md
```

## 5. Cai dat va chay nhanh

Di chuyen vao thu muc backend:

```powershell
cd edge-ai-monitoring-system\backend
```

Tao moi truong ao va cai dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Chay backend:

```powershell
python app.py
```

Sau do mo trinh duyet tai:

```text
http://127.0.0.1:5000
```

## 6. Chay voi Arduino that

Trong Arduino IDE, cai cac thu vien:

- `DHT sensor library by Adafruit`
- `Adafruit Unified Sensor`

Dau cam bien theo so do trong `edge-ai-monitoring-system/docs/so_do_noi_day.md`:

- Anh sang LDR digital `DO`: `D3`.
- Am thanh analog: `A1`.
- Nuoc mua analog: `A2`.
- Nhiet do/do am DHT: `D2`.

Nap firmware:

```text
edge-ai-monitoring-system/arduino/edge_ai_sensor/edge_ai_sensor.ino
```

Chay backend voi cong Serial cu the, vi du `COM4`:

```powershell
$env:SERIAL_PORT="COM4"
python app.py
```

Neu khong dat `SERIAL_PORT`, backend se tu tim cong USB/Arduino phu hop. Neu gap loi `Access is denied`, hay dong Arduino IDE Serial Monitor hoac ung dung khac dang giu cong COM roi chay lai backend.

## 7. API chinh

- `GET /api/health`: kiem tra trang thai backend.
- `GET /api/latest`: lay mau du lieu moi nhat tu Arduino.
- `GET /api/history`: lay lich su du lieu gan day.
- `GET /api/ai-analysis`: lay ket qua phan tich AI do Arduino suy luan tren phan cung.

## 8. Du lieu va schema Edge AI

Firmware hien tai gui cac truong phan tich rieng cho tung nhom cam bien:

- `light_risk`, `light_status`: do bat thuong va trang thai anh sang.
- `sound_risk`, `sound_status`: do bat thuong va trang thai am thanh.
- `temperature_risk`, `temperature_status`: do bat thuong va trang thai nhiet do.
- `humidity_risk`, `humidity_status`: do bat thuong va trang thai do am.
- `rain_risk`, `rain_status`: do bat thuong va trang thai nuoc mua.
- `edge_model`: ten model dang chay tren phan cung.
- `weather_condition`: ket qua phan loai thoi tiet.
- `weather_confidence`: do tin cay cua ket qua thoi tiet.
- `ai_risk_level`: muc rui ro do Arduino suy luan.
- `ai_summary`: tom tat ngan do Arduino tao.
- `ai_recommendation`: de xuat hanh dong do Arduino tao.

Dashboard se cho du lieu neu Arduino chua gui Serial JSON hop le hoac chua nap dung firmware moi.

## 9. Ghi chu

- Backend khong goi Ollama hoac model AI tren may tinh; ket qua AI duoc gui truc tiep tu Arduino.
- Model hien tai la `arduino_edge_rule_v1`, phu hop voi Arduino pho thong vi su dung rule/trong so nhe.
- Neu dung DHT22/AM2302, doi `DHT_TYPE` trong file firmware.
- Co the thay phan rule trong firmware bang TinyML/TensorFlow Lite Micro khi dung board co RAM/Flash lon hon nhu ESP32.

## 10. License

Du an duoc phat trien phuc vu muc dich hoc tap, demo IoT va Edge AI.
