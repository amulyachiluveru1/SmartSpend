from app.config import Config
import os

def test_config_loaded():
    """Test that configuration loads correctly"""
    config = Config()
    
    assert hasattr(config, 'SECRET_KEY')
    assert hasattr(config, 'SQLALCHEMY_DATABASE_URI')
    assert hasattr(config, 'FRONTEND_URL')
    
    assert config.SECRET_KEY is not None
    assert config.SQLALCHEMY_DATABASE_URI is not None