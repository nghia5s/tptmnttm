class HardwareAiAnalyzer:
    def __init__(self):
        self._cache_key = None
        self._cache_value = None

    def analyze(self, payload):
        if not payload:
            return {
                "available": False,
                "summary": "Chưa có dữ liệu từ phần cứng để phân tích.",
                "recommendation": "Hãy kết nối Arduino đã nạp edge AI firmware.",
                "risk_level": "waiting",
                "model": "hardware-edge-ai",
            }

        cache_key = payload.get("timestamp")
        if cache_key and cache_key == self._cache_key:
            return self._cache_value

        analysis = {
            "available": True,
            "summary": payload.get("ai_summary", "Phần cứng đã tính điểm rủi ro."),
            "recommendation": payload.get("ai_recommendation", "Tiếp tục giám sát định kỳ."),
            "risk_level": payload.get("ai_risk_level", payload.get("status", "unknown")),
            "model": payload.get("edge_model", "arduino_edge_rule_v1"),
            "weather_condition": payload.get("weather_condition", "unknown"),
            "weather_confidence": payload.get("weather_confidence", 0),
        }
        self._cache_key = cache_key
        self._cache_value = analysis
        return analysis
