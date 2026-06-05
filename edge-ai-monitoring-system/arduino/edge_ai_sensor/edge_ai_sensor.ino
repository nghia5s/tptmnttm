/*
  Edge AI Sensor Demo
  - Doc cam bien anh sang LDR, cam bien am thanh analog,
    cam bien nhiet do/do am DHT va cam bien nuoc mua analog
  - Chay edge AI rule model ngay tren thiet bi
  - Gui du lieu JSON qua Serial de backend Flask doc

  Thu vien can cai trong Arduino IDE:
  - DHT sensor library by Adafruit
  - Adafruit Unified Sensor

  Dau noi mac dinh:
  - LDR digital DO: chan D3
  - Cam bien am thanh analog: chan A1
  - Cam bien mua analog: chan A2
  - DHT DATA: chan D2
*/

#include <DHT.h>

const int LIGHT_DO_PIN = 3;
const int SOUND_PIN = A1;
const int RAIN_PIN = A2;
const int DHT_PIN = 2;
const bool RAIN_SENSOR_WET_LOW = false;

// Doi thanh DHT22 neu ban dung DHT22/AM2302.
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

const unsigned long SEND_INTERVAL_MS = 1000;
const char EDGE_MODEL_NAME[] = "arduino_edge_rule_v1";

unsigned long lastSend = 0;

float normalize(float value, float minValue, float maxValue) {
  float clamped = constrain(value, minValue, maxValue);
  return (clamped - minValue) / (maxValue - minValue);
}

String classifyRisk(float risk) {
  if (risk >= 0.75) {
    return "danger";
  }
  if (risk >= 0.45) {
    return "warning";
  }
  return "normal";
}

String classifyWeather(float lightPercent, float humidity, float rainPercent) {
  if (rainPercent >= 60.0 || (rainPercent >= 40.0 && humidity >= 88.0 && lightPercent < 70.0)) {
    return "rainy";
  }
  if (lightPercent >= 55.0 && rainPercent < 35.0) {
    return "sunny";
  }
  if (lightPercent < 35.0 && rainPercent < 30.0) {
    return "cloudy";
  }
  return "unknown";
}

float weatherConfidence(String weatherCondition, float lightPercent, float humidity, float rainPercent) {
  if (weatherCondition == "rainy") {
    float rainEvidence = normalize(rainPercent, 60.0, 100.0);
    float humidityEvidence = humidity < 0.0 ? 0.0 : normalize(humidity, 88.0, 100.0);
    float lowLightEvidence = 1.0 - normalize(lightPercent, 30.0, 90.0);
    return constrain((rainEvidence * 0.75) + (humidityEvidence * 0.15) + (lowLightEvidence * 0.10), 0.0, 1.0);
  }
  if (weatherCondition == "sunny") {
    float lightEvidence = normalize(lightPercent, 45.0, 90.0);
    float dryEvidence = 1.0 - normalize(rainPercent, 0.0, 35.0);
    return constrain((lightEvidence * 0.65) + (dryEvidence * 0.35), 0.0, 1.0);
  }
  if (weatherCondition == "cloudy") {
    float lowLightEvidence = 1.0 - normalize(lightPercent, 20.0, 55.0);
    float dryEvidence = 1.0 - normalize(rainPercent, 0.0, 40.0);
    return constrain((lowLightEvidence * 0.55) + (dryEvidence * 0.45), 0.0, 1.0);
  }
  return 0.35;
}

String weatherLabel(String weatherCondition) {
  if (weatherCondition == "rainy") {
    return "troi dang mua";
  }
  if (weatherCondition == "sunny") {
    return "troi dang nang";
  }
  if (weatherCondition == "cloudy") {
    return "troi nhieu may";
  }
  return "chua xac dinh duoc thoi tiet";
}

String buildSummary(float lightRisk, float soundRisk, float temperatureRisk, float humidityRisk, float rainRisk, String status) {
  if (status == "danger") {
    if (rainRisk >= 0.75 || humidityRisk >= 0.75) {
      return "Nguy co cao do mua hoac do am lon";
    }
    if (temperatureRisk >= 0.75) {
      return "Nguy co cao do nhiet do bat thuong";
    }
    if (soundRisk >= 0.75) {
      return "Nguy co cao do tieng on bat thuong";
    }
    if (lightRisk >= 0.75) {
      return "Nguy co cao do anh sang yeu";
    }
    return "He thong co dau hieu nguy hiem";
  }

  if (status == "warning") {
    if (rainRisk >= 0.45 || humidityRisk >= 0.45) {
      return "Canh bao moi truong am hoac co mua";
    }
    if (temperatureRisk >= 0.45) {
      return "Canh bao nhiet do tang";
    }
    if (soundRisk >= 0.45) {
      return "Canh bao am thanh tang";
    }
    if (lightRisk >= 0.45) {
      return "Canh bao anh sang thap";
    }
    return "He thong co dau hieu can theo doi";
  }

  return "Moi truong on dinh";
}

String buildRecommendation(float lightRisk, float soundRisk, float temperatureRisk, float humidityRisk, float rainRisk, String status) {
  if (status == "danger") {
    if (rainRisk >= 0.75 || humidityRisk >= 0.75) {
      return "Kiem tra khu vuc co nuoc mua va che chan thiet bi";
    }
    if (temperatureRisk >= 0.75) {
      return "Kiem tra nguon nhiet va thong gio ngay";
    }
    if (soundRisk >= 0.75) {
      return "Kiem tra nguon gay tieng on bat thuong";
    }
    if (lightRisk >= 0.75) {
      return "Kiem tra den hoac vat can che sang";
    }
    return "Kiem tra he thong ngay";
  }

  if (status == "warning") {
    return "Theo doi them va kiem tra cam bien neu gia tri tiep tuc tang";
  }

  return "Tiep tuc giam sat dinh ky";
}

float readAnalogPercent(int pin) {
  int rawValue = analogRead(pin);
  return normalize(rawValue, 0, 1023) * 100.0;
}

float readLightPercent() {
  int lightState = digitalRead(LIGHT_DO_PIN);

  // Module LDR chi co DO thuong tra LOW khi sang va HIGH khi toi.
  // Quy doi tam thoi: sang = 100%, toi = 0%.
  // Neu module cua ban nguoc logic, doi HIGH/LOW o day.
  return lightState == LOW ? 100.0 : 0.0;
}

float readSoundPercent() {
  return readAnalogPercent(SOUND_PIN);
}

float readRainPercent() {
  int rawRain = analogRead(RAIN_PIN);

  // Mot so module cho gia tri thap khi uot, mot so module cho gia tri cao khi uot.
  // Voi cam bien hien tai, mac dinh S cao = uot/mua nhieu. Neu bi nguoc, doi
  // RAIN_SENSOR_WET_LOW thanh true.
  float rainPercent = normalize(rawRain, 0, 1023) * 100.0;
  if (RAIN_SENSOR_WET_LOW) {
    rainPercent = 100.0 - rainPercent;
  }
  return rainPercent;
}

float safeDhtValue(float value, float fallback) {
  if (isnan(value)) {
    return fallback;
  }
  return value;
}

void setup() {
  Serial.begin(9600);
  pinMode(LIGHT_DO_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  dht.begin();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend < SEND_INTERVAL_MS) {
    return;
  }
  lastSend = now;

  float lightPercent = readLightPercent();
  float soundPercent = readSoundPercent();
  float rainPercent = readRainPercent();
  float temperature = safeDhtValue(dht.readTemperature(), -99.0);
  float humidity = safeDhtValue(dht.readHumidity(), -1.0);

  float lightRisk = 1.0 - normalize(lightPercent, 20.0, 85.0);
  float soundRisk = normalize(soundPercent, 45.0, 90.0);
  float temperatureRisk = temperature < -50.0 ? 1.0 : normalize(temperature, 35.0, 45.0);
  float humidityRisk = humidity < 0.0 ? 1.0 : normalize(humidity, 75.0, 95.0);
  float rainRisk = normalize(rainPercent, 35.0, 85.0);

  float anomalyScore =
    (lightRisk * 0.15) +
    (soundRisk * 0.20) +
    (temperatureRisk * 0.20) +
    (humidityRisk * 0.20) +
    (rainRisk * 0.25);

  String status = classifyRisk(anomalyScore);
  String lightStatus = classifyRisk(lightRisk);
  String soundStatus = classifyRisk(soundRisk);
  String temperatureStatus = classifyRisk(temperatureRisk);
  String humidityStatus = classifyRisk(humidityRisk);
  String rainStatus = classifyRisk(rainRisk);
  String weatherCondition = classifyWeather(lightPercent, humidity, rainPercent);
  float confidence = weatherConfidence(weatherCondition, lightPercent, humidity, rainPercent);
  String aiSummary = weatherLabel(weatherCondition) + ". " + buildSummary(lightRisk, soundRisk, temperatureRisk, humidityRisk, rainRisk, status);
  String aiRecommendation = buildRecommendation(lightRisk, soundRisk, temperatureRisk, humidityRisk, rainRisk, status);

  Serial.print("{\"light\":");
  Serial.print(lightPercent, 1);
  Serial.print(",\"light_risk\":");
  Serial.print(lightRisk, 2);
  Serial.print(",\"light_status\":\"");
  Serial.print(lightStatus);
  Serial.print("\"");

  Serial.print(",\"sound\":");
  Serial.print(soundPercent, 1);
  Serial.print(",\"sound_risk\":");
  Serial.print(soundRisk, 2);
  Serial.print(",\"sound_status\":\"");
  Serial.print(soundStatus);
  Serial.print("\"");

  Serial.print(",\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"temperature_risk\":");
  Serial.print(temperatureRisk, 2);
  Serial.print(",\"temperature_status\":\"");
  Serial.print(temperatureStatus);
  Serial.print("\"");

  Serial.print(",\"humidity\":");
  Serial.print(humidity, 1);
  Serial.print(",\"humidity_risk\":");
  Serial.print(humidityRisk, 2);
  Serial.print(",\"humidity_status\":\"");
  Serial.print(humidityStatus);
  Serial.print("\"");

  Serial.print(",\"rain\":");
  Serial.print(rainPercent, 1);
  Serial.print(",\"rain_risk\":");
  Serial.print(rainRisk, 2);
  Serial.print(",\"rain_status\":\"");
  Serial.print(rainStatus);
  Serial.print("\"");
  Serial.print(",\"weather_condition\":\"");
  Serial.print(weatherCondition);
  Serial.print("\"");
  Serial.print(",\"weather_confidence\":");
  Serial.print(confidence, 2);

  Serial.print(",\"anomaly_score\":");
  Serial.print(anomalyScore, 2);
  Serial.print(",\"status\":\"");
  Serial.print(status);
  Serial.print("\"");
  Serial.print(",\"edge_model\":\"");
  Serial.print(EDGE_MODEL_NAME);
  Serial.print("\"");
  Serial.print(",\"ai_risk_level\":\"");
  Serial.print(status);
  Serial.print("\"");
  Serial.print(",\"ai_summary\":\"");
  Serial.print(aiSummary);
  Serial.print("\"");
  Serial.print(",\"ai_recommendation\":\"");
  Serial.print(aiRecommendation);
  Serial.println("\"}");
}
