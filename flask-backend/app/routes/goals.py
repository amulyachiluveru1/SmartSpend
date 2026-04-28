from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Goal
from datetime import datetime

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = get_jwt_identity()
    goals = Goal.query.filter_by(user_id=user_id).all()
    return jsonify([g.to_dict() for g in goals]), 200

@goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    target_amount = data.get('target_amount')
    current_amount = data.get('current_amount', 0)
    deadline = data.get('deadline')

    if not name or not target_amount:
        return jsonify({'error': 'Name and target amount are required'}), 400

    try:
        target_amount = float(target_amount)
        current_amount = float(current_amount)
    except:
        return jsonify({'error': 'Invalid amount'}), 400

    goal = Goal(
        user_id=user_id,
        name=name,
        target_amount=target_amount,
        current_amount=current_amount,
        deadline=datetime.strptime(deadline, '%Y-%m-%d').date() if deadline else None
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201

@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    data = request.get_json()
    if 'name' in data:
        goal.name = data['name']
    if 'target_amount' in data:
        goal.target_amount = float(data['target_amount'])
    if 'current_amount' in data:
        goal.current_amount = float(data['current_amount'])
        if goal.current_amount >= goal.target_amount:
            goal.completed = True
    if 'deadline' in data:
        goal.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date() if data['deadline'] else None
    if 'completed' in data:
        goal.completed = data['completed']

    db.session.commit()
    return jsonify(goal.to_dict()), 200

@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Goal deleted'}), 200