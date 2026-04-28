from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Debt
from datetime import datetime

debts_bp = Blueprint('debts', __name__)

def to_bool(value):
    """Convert various representations to boolean"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)

@debts_bp.route('/', methods=['GET'])
@jwt_required()
def get_debts():
    user_id = int(get_jwt_identity())
    debts = Debt.query.filter_by(user_id=user_id).all()
    return jsonify([d.to_dict() for d in debts]), 200

@debts_bp.route('/', methods=['POST'])
@jwt_required()
def create_debt():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    person = data.get('person')
    amount = data.get('amount')
    is_owed = data.get('is_owed', True)
    description = data.get('description', '')
    due_date = data.get('due_date')

    if not person or not amount:
        return jsonify({'error': 'Person and amount are required'}), 400

    try:
        amount = float(amount)
    except:
        return jsonify({'error': 'Invalid amount'}), 400

    # Convert is_owed to boolean regardless of input type
    is_owed_bool = to_bool(is_owed)

    debt = Debt(
        user_id=user_id,
        person=person,
        amount=amount,
        is_owed=is_owed_bool,
        description=description,
        due_date=datetime.strptime(due_date, '%Y-%m-%d').date() if due_date else None
    )
    db.session.add(debt)
    db.session.commit()
    return jsonify(debt.to_dict()), 201

@debts_bp.route('/<int:debt_id>', methods=['PUT'])
@jwt_required()
def update_debt(debt_id):
    user_id = int(get_jwt_identity())
    debt = Debt.query.filter_by(id=debt_id, user_id=user_id).first()
    if not debt:
        return jsonify({'error': 'Debt not found'}), 404

    data = request.get_json()
    if 'person' in data:
        debt.person = data['person']
    if 'amount' in data:
        try:
            debt.amount = float(data['amount'])
        except:
            return jsonify({'error': 'Invalid amount'}), 400
    if 'is_owed' in data:
        debt.is_owed = to_bool(data['is_owed'])
    if 'description' in data:
        debt.description = data['description']
    if 'due_date' in data:
        debt.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
    if 'settled' in data:
        debt.settled = to_bool(data['settled'])

    db.session.commit()
    return jsonify(debt.to_dict()), 200

@debts_bp.route('/<int:debt_id>', methods=['DELETE'])
@jwt_required()
def delete_debt(debt_id):
    user_id = int(get_jwt_identity())
    debt = Debt.query.filter_by(id=debt_id, user_id=user_id).first()
    if not debt:
        return jsonify({'error': 'Debt not found'}), 404

    db.session.delete(debt)
    db.session.commit()
    return jsonify({'message': 'Debt deleted'}), 200