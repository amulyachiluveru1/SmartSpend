import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../services/goals'
import GoalCard from '../components/GoalCard'
import GoalForm from '../components/forms/GoalForm'
import ConfirmationModal from '../components/ConfirmationModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  HiOutlinePlus, 
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineFire,
  HiOutlineStar,  // Replaced HiOutlineTrophy with HiOutlineStar
  HiOutlineFlag    // Alternative icon for goals
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [deletingGoal, setDeletingGoal] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const data = await getGoals()
      setGoals(data)
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    try {
      await createGoal(data)
      toast.success('Goal created successfully!')
      fetchGoals()
      setShowForm(false)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Creation failed')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      await updateGoal(id, data)
      toast.success('Goal updated successfully!')
      fetchGoals()
      setEditingGoal(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteGoal(deletingGoal.id)
      toast.success('Goal deleted')
      fetchGoals()
    } catch (error) {
      toast.error('Deletion failed')
    } finally {
      setDeletingGoal(null)
    }
  }

  const calculateStats = () => {
    const total = goals.length
    const completed = goals.filter(g => g.completed).length
    const active = total - completed
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
    const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0)
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
    
    return { total, completed, active, totalTarget, totalCurrent, overallProgress }
  }

  const stats = calculateStats()
  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.completed
    if (filter === 'completed') return goal.completed
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track and achieve your financial aspirations</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => setShowForm(true)}>
          <HiOutlinePlus className="text-lg" />
          New Goal
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Total Goals</p>
              <p className="stat-value-large">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HiOutlineFlag className="text-2xl text-primary" /> {/* Changed from HiOutlineTrophy */}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Active Goals</p>
              <p className="stat-value-large text-warning">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
              <HiOutlineFire className="text-2xl text-warning" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Completed</p>
              <p className="stat-value-large text-success">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
              <HiOutlineSparkles className="text-2xl text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Overall Progress</p>
              <p className="stat-value-large">{stats.overallProgress.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <HiOutlineTrendingUp className="text-2xl text-accent" />
            </div>
          </div>
          <progress 
            className="progress progress-accent w-full mt-4" 
            value={stats.totalCurrent} 
            max={stats.totalTarget}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-base-100 p-2 rounded-2xl shadow-lg">
        {['all', 'active', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-4 rounded-xl capitalize transition-all duration-200 ${
              filter === f 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                : 'hover:bg-base-200 text-base-content/70'
            }`}
          >
            {f} ({f === 'all' ? stats.total : f === 'active' ? stats.active : stats.completed})
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-3xl shadow-lg">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">No goals found</h3>
          <p className="text-base-content/60 mb-6">
            {filter === 'all' 
              ? "You haven't created any goals yet" 
              : filter === 'active' 
                ? "No active goals at the moment" 
                : "No completed goals yet"}
          </p>
          <button 
            className="btn btn-primary gap-2"
            onClick={() => setShowForm(true)}
          >
            <HiOutlinePlus className="text-lg" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditingGoal(goal)}
              onDelete={() => setDeletingGoal(goal)}
            />
          ))}
        </div>
      )}

      {/* Forms and Modals */}
      {showForm && (
        <GoalForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingGoal && (
        <GoalForm
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={(data) => handleUpdate(editingGoal.id, data)}
        />
      )}

      {deletingGoal && (
        <ConfirmationModal
          title="Delete Goal"
          message={`Are you sure you want to delete "${deletingGoal.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingGoal(null)}
        />
      )}
    </div>
  )
}