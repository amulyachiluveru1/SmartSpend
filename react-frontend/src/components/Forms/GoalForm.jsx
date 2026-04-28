import { useForm } from 'react-hook-form'
import { 
  HiOutlineX, 
  HiOutlineFlag, 
  HiOutlineCurrencyDollar, 
  HiOutlineCalendar, 
  HiOutlineChartBar,
  HiOutlineStar 
} from 'react-icons/hi'

export default function GoalForm({ goal, onClose, onSubmit }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: goal || {
      name: '',
      target_amount: '',
      current_amount: 0,
      deadline: ''
    }
  })

  const targetAmount = watch('target_amount')
  const currentAmount = watch('current_amount')
  const progress = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0

  // Get progress color based on percentage
  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HiOutlineStar className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {goal ? 'Edit Savings Goal' : 'Create New Goal'}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {goal ? 'Update your savings target' : 'Set a new financial milestone'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <HiOutlineX className="text-white text-xl" />
            </button>
          </div>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Goal Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <HiOutlineFlag className="text-green-500" />
              Goal Name <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 pl-10
                  ${errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-700' 
                    : 'border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-800'}`}
                placeholder="e.g., Emergency Fund, New Laptop, Vacation"
                {...register('name', { required: 'Goal name is required' })}
              />
              <HiOutlineFlag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Target & Current Amount - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Target Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <HiOutlineCurrencyDollar className="text-green-500" />
                Target <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 pl-10
                    ${errors.target_amount 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-200'}`}
                  placeholder="1000.00"
                  {...register('target_amount', { 
                    required: 'Target amount is required', 
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                />
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              </div>
              {errors.target_amount && (
                <p className="text-red-500 text-xs mt-1">{errors.target_amount.message}</p>
              )}
            </div>

            {/* Current Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <HiOutlineChartBar className="text-blue-500" />
                Current
              </label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 pl-10"
                  placeholder="0.00"
                  {...register('current_amount', { 
                    min: { value: 0, message: 'Amount cannot be negative' }
                  })}
                />
                <HiOutlineChartBar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Progress Bar Preview */}
          {targetAmount > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current progress</span>
                <span className="font-medium text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>${parseFloat(currentAmount || 0).toFixed(2)} saved</span>
                <span>Target: ${parseFloat(targetAmount).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <HiOutlineCalendar className="text-green-500" />
              Target Deadline <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative group">
              <input
                type="date"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-300 pl-10"
                {...register('deadline')}
              />
              <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            </div>
          </div>

          {/* Quick Goal Suggestions */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Popular goal ideas:</p>
            <div className="flex flex-wrap gap-2">
              {['Emergency Fund', 'New Laptop', 'Vacation', 'Down Payment'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[name="name"]')
                    if (input) input.value = suggestion
                  }}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}