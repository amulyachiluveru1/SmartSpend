import pytest
from app import create_app, db
from app.models import User
import time

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def test_register_user(client):
    """Test user registration endpoint"""
    unique_id = int(time.time())
    response = client.post('/api/auth/register', json={
        "username": f"testuser_{unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "Test123!"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'User created successfully'

def test_login_user(client):
    """Test user login endpoint"""
    unique_id = int(time.time())
    username = f"testuser_{unique_id}"
    email = f"test_{unique_id}@example.com"
    
    client.post('/api/auth/register', json={
        "username": username,
        "email": email,
        "password": "Test123!"
    })
    
    response = client.post('/api/auth/login', json={
        "username": username,
        "password": "Test123!"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "user" in data