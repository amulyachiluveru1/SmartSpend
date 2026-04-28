import { useState, useEffect } from 'react'
import { getDebts, createDebt, updateDebt, deleteDebt } from '../services/debts'
import DebtItem from '../components/DebtItem'
import DebtForm from '../components/Forms/DebtForm'
import ConfirmationModal from '../components/ConfirmationModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  HiOutlinePlus, 
  HiOutlineCreditCard, 
  HiOutlineTrendingDown,
  HiOutlineTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineChartPie
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState(null)
  const [deletingDebt, setDeletingDebt] = useState(null)
  const [filter, setFilter] = useState('all') // all, owed, owe, settled

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    setLoading(true)
    try {
      const data = await getDebts()
      setDebts(data)
    } catch (error) {
      toast.error('Failed to load debts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    try {
      await createDebt(data)
      toast.success('Debt entry created successfully!')
      fetchDebts()
      setShowForm(false)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Creation failed')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      await updateDebt(id, data)
      toast.success('Debt updated successfully!')
      fetchDebts()
      setEditingDebt(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDebt(deletingDebt.id)
      toast.success('Debt deleted')
      fetchDebts()
    } catch (error) {
      toast.error('Deletion failed')
    } finally {
      setDeletingDebt(null)
    }
  }

  const calculateStats = () => {
    const totalOwed = debts
      .filter(d => d.is_owed && !d.settled)
      .reduce((sum, d) => sum + d.amount, 0)
    
    const totalOwe = debts
      .filter(d => !d.is_owed && !d.settled)
      .reduce((sum, d) => sum + d.amount, 0)
    
    const totalSettled = debts
      .filter(d => d.settled)
      .reduce((sum, d) => sum + d.amount, 0)
    
    const netPosition = totalOwed - totalOwe
    const overdueCount = debts.filter(d => {
      if (!d.due_date || d.settled) return false
      return new Date(d.due_date) < new Date()
    }).length

    return { totalOwed, totalOwe, totalSettled, netPosition, overdueCount }
  }

  const stats = calculateStats()

  const filteredDebts = debts.filter(debt => {
    if (filter === 'owed') return debt.is_owed && !debt.settled
    if (filter === 'owe') return !debt.is_owed && !debt.settled
    if (filter === 'settled') return debt.settled
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Debts & IOUs</h1>
          <p className="page-subtitle">Track money you owe and money owed to you</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => setShowForm(true)}>
          <HiOutlinePlus className="text-lg" />
          Add Debt
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Owed to me</p>
              <p className="stat-value-large text-success">${stats.totalOwed.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
              <HiOutlineTrendingUp className="text-2xl text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">I owe</p>
              <p className="stat-value-large text-error">${stats.totalOwe.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center">
              <HiOutlineTrendingDown className="text-2xl text-error" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Net Position</p>
              <p className={`stat-value-large ${stats.netPosition >= 0 ? 'text-success' : 'text-error'}`}>
                ${stats.netPosition.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <HiOutlineCurrencyDollar className="text-2xl text-accent" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Settled</p>
              <p className="stat-value-large">${stats.totalSettled.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center">
              <HiOutlineCheckCircle className="text-2xl text-base-content/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-base-100 p-2 rounded-2xl shadow-lg">
        {[
          { id: 'all', label: 'All Debts' },
          { id: 'owed', label: 'Owed to me' },
          { id: 'owe', label: 'I owe' },
          { id: 'settled', label: 'Settled' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 py-2 px-4 rounded-xl transition-all duration-200 ${
              filter === f.id 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                : 'hover:bg-base-200 text-base-content/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Overdue Warning */}
      {stats.overdueCount > 0 && (
        <div className="alert alert-warning shadow-lg">
          <HiOutlineExclamationCircle className="text-2xl" />
          <span>
            You have {stats.overdueCount} overdue {stats.overdueCount === 1 ? 'debt' : 'debts'}. 
            Please review and take action.
          </span>
        </div>
      )}

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-3xl shadow-lg">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold mb-2">No debts found</h3>
          <p className="text-base-content/60 mb-6">
            {filter === 'all' 
              ? "You haven't added any debts yet" 
              : filter === 'owed' 
                ? "No one owes you money right now" 
                : filter === 'owe'
                  ? "You don't owe anyone right now"
                  : "No settled debts yet"}
          </p>
          <button 
            className="btn btn-primary gap-2"
            onClick={() => setShowForm(true)}
          >
            <HiOutlinePlus className="text-lg" />
            Add Your First Debt
          </button>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="divide-y divide-base-200">
            {filteredDebts.map(debt => (
              <DebtItem
                key={debt.id}
                debt={debt}
                onEdit={() => setEditingDebt(debt)}
                onDelete={() => setDeletingDebt(debt)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary Chart */}
      {(stats.totalOwed > 0 || stats.totalOwe > 0) && (
        <div className="bg-base-100 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6">Debt Summary</h3>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Owed to me</span>
                    <span className="font-medium text-success">${stats.totalOwed.toFixed(2)}</span>
                  </div>
                  <progress 
                    className="progress progress-success w-full" 
                    value={stats.totalOwed} 
                    max={stats.totalOwed + stats.totalOwe}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>I owe</span>
                    <span className="font-medium text-error">${stats.totalOwe.toFixed(2)}</span>
                  </div>
                  <progress 
                    className="progress progress-error w-full" 
                    value={stats.totalOwe} 
                    max={stats.totalOwed + stats.totalOwe}
                  />
                </div>
              </div>
            </div>
            <div className="w-32 h-32 rounded-full bg-base-200 flex items-center justify-center">
              <div className="text-center">
                <HiOutlineChartPie className="text-3xl text-primary mx-auto mb-1" />
                <span className="text-xs text-base-content/60">Net</span>
                <p className={`font-bold ${stats.netPosition >= 0 ? 'text-success' : 'text-error'}`}>
                  ${Math.abs(stats.netPosition).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms and Modals */}
      {showForm && (
        <DebtForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingDebt && (
        <DebtForm
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onSubmit={(data) => handleUpdate(editingDebt.id, data)}
        />
      )}

      {deletingDebt && (
        <ConfirmationModal
          title="Delete Debt"
          message={`Are you sure you want to delete this debt with ${deletingDebt.person}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingDebt(null)}
        />
      )}
    </div>
  )
}