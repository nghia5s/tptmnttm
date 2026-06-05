import os


class Config:
    """Application configuration loaded from environment variables."""

    SERIAL_PORT = os.getenv("SERIAL_PORT")
    SERIAL_BAUDRATE = int(os.getenv("SERIAL_BAUDRATE", "9600"))
    SERIAL_TIMEOUT = float(os.getenv("SERIAL_TIMEOUT", "1"))
    MAX_HISTORY = int(os.getenv("MAX_HISTORY", "60"))
    HOST = os.getenv("FLASK_HOST", "127.0.0.1")
    PORT = int(os.getenv("FLASK_PORT", "5000"))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
