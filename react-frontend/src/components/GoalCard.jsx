import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'

export default function GoalCard({ goal, onEdit, onDelete }) {
  const progress = Math.min(goal.progress, 100)
  const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h3 className="card-title">{goal.name}</h3>
          <div className="space-x-2">
            <button className="btn btn-sm btn-ghost" onClick={onEdit}><HiOutlinePencil /></button>
            <button className="btn btn-sm btn-ghost text-error" onClick={onDelete}><HiOutlineTrash /></button>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-sm">
            <span>${goal.current_amount.toFixed(2)}</span>
            <span>${goal.target_amount.toFixed(2)}</span>
          </div>
          <progress className="progress progress-primary w-full" value={goal.current_amount} max={goal.target_amount}></progress>
        </div>
        <p className="text-sm text-base-content/70 mt-2">Deadline: {deadline}</p>
        {goal.completed && <div className="badge badge-success mt-2">Completed!</div>}
      </div>
    </div>
  )
}