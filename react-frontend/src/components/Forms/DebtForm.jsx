import { useForm } from 'react-hook-form'
import { 
  HiOutlineX, 
  HiOutlineUser, 
  HiOutlineCurrencyDollar, 
  HiOutlineCalendar, 
  HiOutlinePencil, 
  HiOutlineCheckCircle,
  HiOutlineSwitchHorizontal
} from 'react-icons/hi'

export default function DebtForm({ debt, onClose, onSubmit }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: debt || {
      person: '',
      amount: '',
      is_owed: true,  // Default to true (boolean)
      description: '',
      due_date: '',
      settled: false  // Default to false (boolean)
    }
  })

  const isOwed = watch('is_owed')
  const amount = watch('amount')

  // Handle radio change to ensure boolean value
  const handleIsOwedChange = (value) => {
    setValue('is_owed', value === 'true' ? true : false)
  }

  const onSubmitForm = (data) => {
    // Ensure is_owed and settled are proper booleans
    const formattedData = {
      ...data,
      is_owed: data.is_owed === true || data.is_owed === 'true' ? true : false,
      settled: data.settled === true || data.settled === 'true' ? true : false,
      amount: parseFloat(data.amount)
    }
    onSubmit(formattedData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HiOutlineSwitchHorizontal className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {debt ? 'Edit Debt' : 'Track a New Debt'}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {debt ? 'Update debt details' : 'Record money you owe or are owed'}
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
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-5">
          {/* Direction Toggle Cards */}
          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer transition-all duration-200 ${isOwed === true ? 'ring-2 ring-green-500 scale-105' : 'opacity-70 hover:opacity-100'}`}>
              <input
                type="radio"
                value="true"
                {...register('is_owed')}
                onChange={(e) => handleIsOwedChange(e.target.value)}
                className="hidden"
              />
              <div className={`p-4 rounded-xl border-2 text-center ${isOwed === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-3xl mb-2">💰</div>
                <div className="font-medium text-green-600 dark:text-green-400">They owe me</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Money to collect</div>
              </div>
            </label>

            <label className={`cursor-pointer transition-all duration-200 ${isOwed === false ? 'ring-2 ring-orange-500 scale-105' : 'opacity-70 hover:opacity-100'}`}>
              <input
                type="radio"
                value="false"
                {...register('is_owed')}
                onChange={(e) => handleIsOwedChange(e.target.value)}
                className="hidden"
              />
              <div className={`p-4 rounded-xl border-2 text-center ${isOwed === false ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-3xl mb-2">💳</div>
                <div className="font-medium text-orange-600 dark:text-orange-400">I owe them</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Money to pay</div>
              </div>
            </label>
          </div>

          {/* Person/Entity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <HiOutlineUser className="text-blue-500" />
              Person / Entity <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 pl-10
                  ${errors.person 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-700' 
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800'}`}
                placeholder="e.g., John, Bank, Friend"
                {...register('person', { required: 'Person is required' })}
              />
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            {errors.person && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.person.message}
              </p>
            )}
          </div>

          {/* Amount & Due Date - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <HiOutlineCurrencyDollar className="text-blue-500" />
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 pl-10
                    ${errors.amount 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200'}`}
                  placeholder="0.00"
                  {...register('amount', { 
                    required: 'Amount is required', 
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                />
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <HiOutlineCalendar className="text-blue-500" />
                Due Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 pl-10"
                  {...register('due_date')}
                />
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <HiOutlinePencil className="text-blue-500" />
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 pl-10"
                placeholder="e.g., Lunch, Rent, Loan"
                {...register('description')}
              />
              <HiOutlinePencil className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
          </div>

          {/* Settled Toggle */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <HiOutlineCheckCircle className="text-green-600 dark:text-green-400 text-lg" />
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Mark as settled</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Debt has been paid/collected</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('settled')}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Preview Card */}
          {amount && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Summary</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOwed === true ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isOwed === true ? 'They owe you' : 'You owe them'}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${parseFloat(amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {debt ? 'Update Debt' : 'Save Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}