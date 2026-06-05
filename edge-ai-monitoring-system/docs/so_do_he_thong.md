# So do he thong

```text
Cam bien / Arduino
        |
        | JSON qua Serial USB
        v
Backend Flask
  - serial_reader.py doc du lieu
  - app.py cung cap API
        |
        | HTTP / JSON
        v
Frontend Dashboard
  - index.html
  - style.css
  - main.js
```

## Luong du lieu

1. Arduino doc LDR, cam bien am thanh, DHT va cam bien nuoc mua roi tinh `anomaly_score`.
2. Arduino chay edge AI rule model de phan loai mua/nang va tao `ai_summary`, `ai_recommendation`.
3. Arduino gui chuoi JSON qua Serial.
4. Backend doc Serial, luu gia tri moi nhat va lich su gan day.
5. Frontend goi `/api/latest`, `/api/history` va `/api/ai-analysis` de cap nhat dashboard.
