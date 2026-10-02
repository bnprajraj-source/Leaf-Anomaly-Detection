import importlib
import os


def reload_config(monkeypatch, **env):
    for key in [
        "FRONTEND_URL",
        "BACKEND_URL",
        "CORS_ORIGINS",
        "APP_ENV",
    ]:
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    import app.config as config_module
    return importlib.reload(config_module)


def test_frontend_url_uses_environment(monkeypatch):
    config = reload_config(monkeypatch, FRONTEND_URL="https://app.example.com")
    assert config.FRONTEND_URL == "https://app.example.com"


def test_cors_origins_are_parsed_from_env(monkeypatch):
    config = reload_config(
        monkeypatch,
        CORS_ORIGINS="https://app.example.com, http://localhost:5173",
    )
    assert "https://app.example.com" in config.CORS_ORIGINS
    assert "http://localhost:5173" in config.CORS_ORIGINS


def test_health_response_includes_runtime_details(monkeypatch):
    config = reload_config(monkeypatch, APP_ENV="production")
    assert hasattr(config, "FRONTEND_URL")
    assert isinstance(config.CORS_ORIGINS, list)
    assert config.APP_ENV == "production"
