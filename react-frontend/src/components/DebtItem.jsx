import { HiOutlinePencil, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi'

export default function DebtItem({ debt, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-0">
      <div>
        <div className="font-medium">{debt.person}</div>
        <div className="text-sm text-base-content/70">{debt.description || 'No description'}</div>
        {debt.due_date && (
          <div className="text-xs text-base-content/50">Due: {new Date(debt.due_date).toLocaleDateString()}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${debt.is_owed ? 'text-success' : 'text-error'}`}>
          {debt.is_owed ? '+' : '-'}${debt.amount.toFixed(2)}
        </span>
        {debt.settled && <HiOutlineCheckCircle className="text-success" />}
        <button className="btn btn-sm btn-ghost" onClick={onEdit}><HiOutlinePencil /></button>
        <button className="btn btn-sm btn-ghost text-error" onClick={onDelete}><HiOutlineTrash /></button>
      </div>
    </div>
  )
}