import pytest
from app import create_app, db
from app.models import User, Category

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    return app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Create a clean database session for testing."""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    import time
    username = f'testuser_{int(time.time())}'
    user = User(
        username=username,
        email=f'{username}@example.com'
    )
    user.set_password('password123')
    db_session.session.add(user)
    db_session.session.commit()
    return user

@pytest.fixture
def test_category(db_session, test_user):
    """Create a test category."""
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
    """Get an authenticated client."""
    response = client.post('/api/auth/login', json={
        'username': test_user.username,
        'password': 'password123'
    })
    token = response.get_json()['access_token']
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client