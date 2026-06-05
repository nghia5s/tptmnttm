import json
import threading
import time
from collections import deque
from datetime import datetime

import serial
from serial.tools import list_ports

from config import Config


REQUIRED_FIELDS = {"light", "sound", "temperature", "humidity", "rain", "anomaly_score", "status"}
VALID_STATUSES = {"normal", "warning", "danger"}


class SerialSensorReader:
    def __init__(self):
        self.history = deque(maxlen=Config.MAX_HISTORY)
        self.latest = None
        self.is_running = False
        self.is_connected = False
        self.last_error = None
        self.current_port = None
        self._thread = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self.is_running = False

    def get_latest(self):
        return self.latest

    def get_history(self):
        return list(self.history)

    def get_status(self):
        return {
            "connected": self.is_connected,
            "has_data": self.latest is not None,
            "last_error": self.last_error,
            "serial_port": self.current_port,
        }

    def _read_loop(self):
        while self.is_running:
            found_connection = False
            candidates = self._candidate_ports()
            for port in candidates:
                if not self.is_running:
                    return

                try:
                    with serial.Serial(
                        port,
                        Config.SERIAL_BAUDRATE,
                        timeout=Config.SERIAL_TIMEOUT,
                    ) as connection:
                        found_connection = True
                        self.is_connected = True
                        self.current_port = port
                        self.last_error = None

                        self._read_from_connection(connection)
                except serial.SerialException as exc:
                    self.is_connected = False
                    self.last_error = f"{port}: {exc}"
                    self.current_port = None

            if not found_connection and not candidates:
                self.is_connected = False
                self.current_port = None
                self.last_error = "Không tìm thấy cổng Serial Arduino."

            if not found_connection:
                time.sleep(2)

    def _read_from_connection(self, connection):
        while self.is_running:
            raw_line = connection.readline().decode("utf-8", errors="ignore").strip()
            if not raw_line:
                continue

            try:
                payload = self._normalize_payload(json.loads(raw_line))
            except (json.JSONDecodeError, ValueError) as exc:
                self.last_error = f"{self.current_port}: dữ liệu không hợp lệ: {exc}"
                continue

            self._store_payload(payload)

    def _candidate_ports(self):
        if Config.SERIAL_PORT:
            return [Config.SERIAL_PORT]

        ports = list(list_ports.comports())
        preferred = [
            port.device
            for port in ports
            if self._looks_like_arduino(port)
        ]
        if preferred:
            return preferred
        return [port.device for port in ports]

    def _looks_like_arduino(self, port):
        text = " ".join(
            str(value or "")
            for value in (port.device, port.description, port.hwid, port.manufacturer)
        ).lower()
        return any(
            marker in text
            for marker in ("arduino", "usb serial", "ch340", "cp210", "2341:")
        )

    def _normalize_payload(self, payload):
        mapped = {
            "light": payload.get("light", payload.get("light_percent")),
            "light_risk": payload.get("light_risk"),
            "light_status": payload.get("light_status"),
            "sound": payload.get("sound", payload.get("sound_percent")),
            "sound_risk": payload.get("sound_risk"),
            "sound_status": payload.get("sound_status"),
            "temperature": payload.get("temperature", payload.get("temperature_c")),
            "temperature_risk": payload.get("temperature_risk", payload.get("temp_risk")),
            "temperature_status": payload.get("temperature_status", payload.get("temp_status")),
            "humidity": payload.get("humidity", payload.get("humidity_percent")),
            "humidity_risk": payload.get("humidity_risk"),
            "humidity_status": payload.get("humidity_status"),
            "rain": payload.get("rain", payload.get("rain_percent")),
            "rain_risk": payload.get("rain_risk"),
            "rain_status": payload.get("rain_status"),
            "weather_condition": payload.get("weather_condition"),
            "weather_confidence": payload.get("weather_confidence"),
            "anomaly_score": payload.get("anomaly_score", payload.get("score")),
            "status": payload.get("status"),
            "edge_model": payload.get("edge_model"),
            "ai_risk_level": payload.get("ai_risk_level"),
            "ai_summary": payload.get("ai_summary"),
            "ai_recommendation": payload.get("ai_recommendation"),
        }

        missing = [key for key in REQUIRED_FIELDS if mapped.get(key) is None]
        if missing:
            raise ValueError(f"thiếu field {', '.join(missing)}")

        mapped["light"] = float(mapped["light"])
        mapped["sound"] = float(mapped["sound"])
        mapped["temperature"] = float(mapped["temperature"])
        mapped["humidity"] = float(mapped["humidity"])
        mapped["rain"] = float(mapped["rain"])
        mapped["anomaly_score"] = float(mapped["anomaly_score"])
        mapped["status"] = str(mapped["status"])

        mapped["light_risk"] = self._risk_or_default(
            mapped["light_risk"],
            1 - self._normalize(mapped["light"], 20, 85),
        )
        mapped["temperature_risk"] = self._risk_or_default(
            mapped["temperature_risk"],
            self._normalize(mapped["temperature"], 35, 45),
        )
        mapped["sound_risk"] = self._risk_or_default(
            mapped["sound_risk"],
            self._normalize(mapped["sound"], 45, 90),
        )
        mapped["humidity_risk"] = self._risk_or_default(
            mapped["humidity_risk"],
            1 if mapped["humidity"] < 0 else self._normalize(mapped["humidity"], 75, 95),
        )
        mapped["rain_risk"] = self._risk_or_default(
            mapped["rain_risk"],
            self._normalize(mapped["rain"], 35, 85),
        )
        mapped["light_status"] = self._status_or_default(mapped["light_status"], self._classify_risk(mapped["light_risk"]))
        mapped["temperature_status"] = self._status_or_default(
            mapped["temperature_status"],
            self._classify_risk(mapped["temperature_risk"]),
        )
        mapped["sound_status"] = self._status_or_default(
            mapped["sound_status"],
            self._classify_risk(mapped["sound_risk"]),
        )
        mapped["humidity_status"] = self._status_or_default(
            mapped["humidity_status"],
            self._classify_risk(mapped["humidity_risk"]),
        )
        mapped["rain_status"] = self._status_or_default(
            mapped["rain_status"],
            self._classify_risk(mapped["rain_risk"]),
        )
        mapped["edge_model"] = str(mapped["edge_model"] or "arduino_edge_rule_v1")
        mapped["ai_risk_level"] = self._status_or_default(mapped["ai_risk_level"], mapped["status"])
        mapped["weather_condition"] = self._weather_or_default(mapped["weather_condition"])
        mapped["weather_confidence"] = self._risk_or_default(
            mapped["weather_confidence"],
            self._default_weather_confidence(mapped["weather_condition"]),
        )
        mapped["ai_summary"] = str(mapped["ai_summary"] or self._default_ai_summary(mapped["ai_risk_level"]))
        mapped["ai_recommendation"] = str(
            mapped["ai_recommendation"] or self._default_ai_recommendation(mapped["ai_risk_level"])
        )

        if not REQUIRED_FIELDS.issubset(mapped):
            raise ValueError("payload không đúng schema dashboard")

        return mapped

    def _risk_or_default(self, value, fallback):
        if value is None:
            return round(max(0, min(1, fallback)), 2)

        return round(max(0, min(1, float(value))), 2)

    def _status_or_default(self, value, fallback):
        if value is None:
            return fallback

        status = str(value)
        return status if status in VALID_STATUSES else fallback

    def _normalize(self, value, min_value, max_value):
        clamped = max(min_value, min(max_value, value))
        return (clamped - min_value) / (max_value - min_value)

    def _classify_risk(self, risk):
        if risk >= 0.75:
            return "danger"
        if risk >= 0.45:
            return "warning"
        return "normal"

    def _weather_or_default(self, value):
        weather = str(value or "unknown")
        return weather if weather in {"rainy", "sunny", "cloudy", "unknown"} else "unknown"

    def _default_weather_confidence(self, weather_condition):
        return 0.35 if weather_condition == "unknown" else 0.6

    def _default_ai_summary(self, risk_level):
        if risk_level == "danger":
            return "Hệ thống phát hiện nguy cơ cao từ phần cứng."
        if risk_level == "warning":
            return "Hệ thống phát hiện dấu hiệu cần theo dõi từ phần cứng."
        return "Môi trường đang ổn định theo suy luận trên phần cứng."

    def _default_ai_recommendation(self, risk_level):
        if risk_level == "danger":
            return "Kiểm tra khu vực lắp đặt và các cảm biến ngay."
        if risk_level == "warning":
            return "Theo dõi thêm và kiểm tra nếu giá trị tiếp tục tăng."
        return "Tiếp tục giám sát định kỳ."

    def _store_payload(self, payload):
        payload["timestamp"] = datetime.now().strftime("%H:%M:%S")
        self.latest = payload
        self.history.append(payload)
