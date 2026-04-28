import pytest
from app import create_app, db
from app.models import User, Category, Expense
from datetime import datetime

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db_session(app):
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_user(db_session):
    import time
    username = f'testuser_{int(time.time())}'
    user = User(username=username, email=f'{username}@example.com')
    user.set_password('password')
    db_session.session.add(user)
    db_session.session.commit()
    return user

@pytest.fixture
def test_category(db_session, test_user):
    category = Category(
        user_id=test_user.id,
        name='Test Category',
        color='#3b82f6'
    )
    db_session.session.add(category)
    db_session.session.commit()
    return category

@pytest.fixture
def auth_client(client, test_user):
    response = client.post('/api/auth/login', json={
        'username': test_user.username,
        'password': 'password'
    })
    token = response.json['access_token']
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client

def test_create_expense(auth_client, test_category):
    response = auth_client.post('/api/expenses/', json={
        'amount': 50.00,
        'category_id': test_category.id,
        'description': 'Test expense',
        'date': datetime.now().strftime('%Y-%m-%d')
    })
    assert response.status_code == 201
    data = response.json
    assert data['amount'] == 50.00
    assert data['category_id'] == test_category.id

def test_get_expenses(auth_client, test_category):
    auth_client.post('/api/expenses/', json={
        'amount': 75.00,
        'category_id': test_category.id,
        'description': 'Another test',
        'date': datetime.now().strftime('%Y-%m-%d')
    })
    
    response = auth_client.get('/api/expenses/')
    assert response.status_code == 200
    data = response.json
    assert len(data['items']) > 0