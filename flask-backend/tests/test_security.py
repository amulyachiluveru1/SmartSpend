from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash

def test_password_hashing():
    """Test password hashing and verification using werkzeug"""
    password = "SecurePassword123!"
    
    hashed = generate_password_hash(password)
    
    assert hashed != password
    assert check_password_hash(hashed, password) is True
    assert check_password_hash(hashed, "WrongPassword") is False

def test_user_password_methods():
    """Test User model password methods"""
    user = User(username="testuser", email="test@example.com")
    user.set_password("MySecurePass123")
    
    assert user.check_password("MySecurePass123") is True
    assert user.check_password("WrongPass") is False