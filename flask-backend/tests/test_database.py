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
def db_session(app):
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

def test_database_connection(app):
    """Test database connection and model creation"""
    with app.app_context():
        import time
        unique_id = int(time.time())
        username = f"testuser_db_{unique_id}"
        
        user = User(
            username=username,
            email=f"{username}@example.com"
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        
        retrieved = User.query.filter_by(username=username).first()
        assert retrieved is not None
        assert retrieved.check_password("password123") is True

def test_user_model_relationships(db_session):
    """Test User model relationships"""
    import time
    unique_id = int(time.time())
    
    user = User(
        username=f"relation_test_{unique_id}",
        email=f"relation_{unique_id}@example.com"
    )
    user.set_password("password")
    db_session.session.add(user)
    db_session.session.commit()

    category = Category(
        user_id=user.id,
        name="Test Category",
        color="#3b82f6"
    )
    db_session.session.add(category)
    db_session.session.commit()

    expense = Expense(
        user_id=user.id,
        category_id=category.id,
        amount=99.99,
        description="Test expense",
        date=datetime.utcnow().date()
    )
    db_session.session.add(expense)
    db_session.session.commit()

    assert len(user.expenses) == 1
    assert len(user.categories) == 1
    assert expense.category.name == "Test Category"
    assert expense.user.username == user.username