from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Expense, Category
from sqlalchemy import func
from datetime import datetime, date, timedelta

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/spending-by-category', methods=['GET'])
@jwt_required()
def spending_by_category():
    user_id = int(get_jwt_identity())
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month:
        return jsonify({'error': 'Year and month required'}), 400

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year+1, 1, 1)
    else:
        end_date = date(year, month+1, 1)

    results = db.session.query(
        Category.name,
        Category.color,
        func.sum(Expense.amount).label('total')
    ).join(Expense, Expense.category_id == Category.id)\
     .filter(Expense.user_id == user_id,
             Expense.date >= start_date,
             Expense.date < end_date)\
     .group_by(Category.id).all()

    data = [{'name': r.name, 'color': r.color, 'total': float(r.total)} for r in results]
    return jsonify(data), 200

@reports_bp.route('/spending-over-time', methods=['GET'])
@jwt_required()
def spending_over_time():
    user_id = int(get_jwt_identity())
    interval = request.args.get('interval', 'day')
    start = request.args.get('start_date')
    end = request.args.get('end_date')

    if not start or not end:
        return jsonify({'error': 'Start and end dates required'}), 400

    try:
        start_date = datetime.strptime(start, '%Y-%m-%d').date()
        end_date = datetime.strptime(end, '%Y-%m-%d').date()
    except:
        return jsonify({'error': 'Invalid date format'}), 400

    if interval == 'day':
        date_trunc = func.date_trunc('day', Expense.date)
    elif interval == 'week':
        date_trunc = func.date_trunc('week', Expense.date)
    elif interval == 'month':
        date_trunc = func.date_trunc('month', Expense.date)
    else:
        return jsonify({'error': 'Invalid interval'}), 400

    results = db.session.query(
        date_trunc.label('period'),
        func.sum(Expense.amount).label('total')
    ).filter(Expense.user_id == user_id,
             Expense.date >= start_date,
             Expense.date <= end_date)\
     .group_by('period')\
     .order_by('period').all()

    data = [{'period': r.period.isoformat(), 'total': float(r.total)} for r in results]
    return jsonify(data), 200

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()
    
    first_day_month = date(today.year, today.month, 1)
    
    if today.month == 1:
        last_month_year = today.year - 1
        last_month = 12
    else:
        last_month_year = today.year
        last_month = today.month - 1
    
    first_day_last_month = date(last_month_year, last_month, 1)
    
    if last_month == 12:
        last_day_last_month = date(last_month_year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day_last_month = date(last_month_year, last_month + 1, 1) - timedelta(days=1)

    current_month_total = db.session.query(func.sum(Expense.amount))\
        .filter(Expense.user_id == user_id,
                Expense.date >= first_day_month).scalar() or 0

    last_month_total = db.session.query(func.sum(Expense.amount))\
        .filter(Expense.user_id == user_id,
                Expense.date >= first_day_last_month,
                Expense.date <= last_day_last_month).scalar() or 0

    thirty_days_ago = today - timedelta(days=30)
    avg_daily = db.session.query(func.avg(Expense.amount))\
        .filter(Expense.user_id == user_id,
                Expense.date >= thirty_days_ago).scalar() or 0

    if last_month_total > 0:
        change_percent = ((current_month_total - last_month_total) / last_month_total) * 100
    else:
        change_percent = 0

    return jsonify({
        'current_month_total': float(current_month_total),
        'last_month_total': float(last_month_total),
        'average_daily': float(avg_daily),
        'change_percent': float(change_percent)
    }), 200