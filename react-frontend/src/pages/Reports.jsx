import { useState, useEffect } from 'react'
import { getSpendingByCategory, getSpendingOverTime, getSummary, exportReport } from '../services/reports'
import { LineChart, PieChart, BarChart } from '../components/Charts'
import AIInsightsPanel from '../components/insights/AIInsightsPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  HiOutlineCalendar, 
  HiOutlineDownload, 
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineDocumentReport,
  HiOutlineDocumentText,
  HiOutlinePrinter
} from 'react-icons/hi'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function Reports() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [viewType, setViewType] = useState('daily')
  const [chartType, setChartType] = useState('line')
  const [pieData, setPieData] = useState([])
  const [lineData, setLineData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState({ csv: false, pdf: false })
  const [categoryTrends, setCategoryTrends] = useState({})
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  // Category colors for consistent display
  const categoryColors = {
    'Food': '#3b82f6',
    'Entertainment': '#8b5cf6',
    'Education': '#10b981',
    'Transport': '#f59e0b',
    'Utilities': '#ef4444',
    'Shopping': '#ec4899',
    'Health': '#14b8a6',
    'Other': '#6b7280'
  }

  useEffect(() => {
    fetchData()
  }, [year, month, viewType])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('Fetching reports data for:', { year, month, viewType })
      
      // Calculate date range based on selected month
      const start = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
      const end = format(new Date(year, month, 0), 'yyyy-MM-dd')
      
      setDateRange({ start, end })

      const [pieResponse, lineResponse, summaryResponse] = await Promise.all([
        getSpendingByCategory(year, month).catch(err => {
          console.error('Error fetching categories:', err)
          return []
        }),
        getSpendingOverTime(
          viewType === 'daily' ? 'day' : viewType === 'weekly' ? 'week' : 'month',
          start,
          end
        ).catch(err => {
          console.error('Error fetching trend:', err)
          return []
        }),
        getSummary().catch(err => {
          console.error('Error fetching summary:', err)
          return null
        })
      ])

      console.log('Raw category data:', pieResponse)
      console.log('Raw trend data:', lineResponse)
      console.log('Raw summary:', summaryResponse)

      // Transform category data for pie chart
      if (pieResponse && pieResponse.length > 0) {
        const transformedCategories = pieResponse.map(cat => ({
          name: cat.name || cat.category_name || 'Unknown',
          value: parseFloat(cat.amount || cat.total || 0),
          color: categoryColors[cat.name] || cat.color || '#6b7280'
        }))
        console.log('Transformed category data:', transformedCategories)
        setPieData(transformedCategories)
        
        // Calculate category trends (compare with last month)
        await calculateCategoryTrends(year, month)
      } else {
        setPieData([])
      }

      // Transform trend data for line/bar chart
      if (lineResponse && lineResponse.length > 0) {
        const transformedTrend = lineResponse.map(item => {
          // Handle different date formats from API
          const dateStr = item.period || item.date || item.day
          let formattedDate = dateStr
          
          try {
            if (dateStr) {
              const date = new Date(dateStr)
              if (!isNaN(date.getTime())) {
                formattedDate = format(date, viewType === 'daily' ? 'MMM d' : 'MMM d')
              }
            }
          } catch (e) {
            console.warn('Error formatting date:', dateStr)
          }
          
          return {
            name: formattedDate,
            amount: parseFloat(item.total || item.amount || 0),
            date: dateStr
          }
        })
        console.log('Transformed trend data:', transformedTrend)
        setLineData(transformedTrend)
      } else {
        setLineData([])
      }

      setSummary(summaryResponse)

    } catch (error) {
      console.error('Failed to load reports', error)
      toast.error('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const calculateCategoryTrends = async (currentYear, currentMonth) => {
    try {
      // Get last month's data
      const lastMonthDate = subMonths(new Date(currentYear, currentMonth - 1, 1), 1)
      const lastMonthYear = lastMonthDate.getFullYear()
      const lastMonth = lastMonthDate.getMonth() + 1
      
      const lastMonthData = await getSpendingByCategory(lastMonthYear, lastMonth).catch(() => [])
      
      if (lastMonthData.length > 0 && pieData.length > 0) {
        const trends = {}
        
        // Create a map of last month's data
        const lastMonthMap = {}
        lastMonthData.forEach(item => {
          const name = item.name || item.category_name
          const amount = parseFloat(item.amount || item.total || 0)
          lastMonthMap[name] = amount
        })
        
        // Calculate trends for current categories
        pieData.forEach(item => {
          const currentAmount = item.value
          const lastAmount = lastMonthMap[item.name] || 0
          
          if (lastAmount > 0) {
            const change = ((currentAmount - lastAmount) / lastAmount) * 100
            trends[item.name] = change.toFixed(1)
          } else {
            trends[item.name] = currentAmount > 0 ? '100' : '0'
          }
        })
        
        setCategoryTrends(trends)
      }
    } catch (error) {
      console.error('Error calculating category trends:', error)
    }
  }

  const generateCSV = () => {
    const totalSpent = pieData.reduce((acc, item) => acc + item.value, 0)
    const daysInMonth = new Date(year, month, 0).getDate()
    const avgDaily = totalSpent / daysInMonth
    const topCategory = pieData.length > 0 
      ? pieData.reduce((max, item) => item.value > max.value ? item : max, pieData[0])
      : null

    // Generate CSV content
    let csvContent = "Financial Report\n"
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n`
    csvContent += `Period: ${new Date(year, month-1, 1).toLocaleString('default', { month: 'long' })} ${year}\n\n`
    
    csvContent += "SUMMARY\n"
    csvContent += `Total Spent,$${totalSpent.toFixed(2)}\n`
    csvContent += `Average Daily,$${avgDaily.toFixed(2)}\n`
    csvContent += `Top Category,${topCategory?.name || 'N/A'}\n`
    csvContent += `Top Category Amount,$${topCategory?.value?.toFixed(2) || '0'}\n`
    csvContent += `vs Last Month,${summary?.change_percent > 0 ? '+' : ''}${summary?.change_percent?.toFixed(1)}%\n\n`
    
    csvContent += "CATEGORY BREAKDOWN\n"
    csvContent += "Category,Amount,Percentage,Trend\n"
    
    pieData.forEach(item => {
      const percentage = ((item.value / totalSpent) * 100).toFixed(1)
      const trend = categoryTrends[item.name] || '0'
      const trendSymbol = parseFloat(trend) > 0 ? '+' : ''
      csvContent += `${item.name},$${item.value.toFixed(2)},${percentage}%,${trendSymbol}${trend}%\n`
    })
    
    csvContent += "\nDAILY SPENDING\n"
    csvContent += "Date,Amount\n"
    lineData.forEach(item => {
      csvContent += `${item.name || item.date},$${item.amount.toFixed(2)}\n`
    })

    return csvContent
  }

  const generatePDF = async () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    const totalSpent = pieData.reduce((acc, item) => acc + item.value, 0)
    const daysInMonth = new Date(year, month, 0).getDate()
    const avgDaily = totalSpent / daysInMonth
    const topCategory = pieData.length > 0 
      ? pieData.reduce((max, item) => item.value > max.value ? item : max, pieData[0])
      : null
    
    // Add title
    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246) // Blue-600
    doc.text('Financial Report', pageWidth / 2, 20, { align: 'center' })
    
    // Add date and period
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' })
    doc.text(`Period: ${new Date(year, month-1, 1).toLocaleString('default', { month: 'long' })} ${year}`, pageWidth / 2, 35, { align: 'center' })
    
    // Summary section
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Summary', 14, 50)
    
    const summaryData = [
      ['Total Spent', `$${totalSpent.toFixed(2)}`],
      ['Average Daily', `$${avgDaily.toFixed(2)}`],
      ['Top Category', topCategory?.name || 'N/A'],
      ['Top Category Amount', topCategory ? `$${topCategory.value.toFixed(2)}` : 'N/A'],
      ['vs Last Month', `${summary?.change_percent > 0 ? '+' : ''}${summary?.change_percent?.toFixed(1)}%`]
    ]
    
    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Category breakdown table
    doc.text('Category Breakdown', 14, doc.lastAutoTable.finalY + 20)
    
    const categoryData = pieData.map(item => [
      item.name,
      `$${item.value.toFixed(2)}`,
      `${((item.value / totalSpent) * 100).toFixed(1)}%`,
      `${parseFloat(categoryTrends[item.name] || 0) > 0 ? '+' : ''}${categoryTrends[item.name] || '0'}%`
    ])
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Category', 'Amount', 'Percentage', 'Trend']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Spending trend data
    if (lineData.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Daily Spending Trend', 14, 20)
      
      const trendData = lineData.map(item => [
        item.name || item.date,
        `$${item.amount.toFixed(2)}`
      ])
      
      autoTable(doc, {
        startY: 25,
        head: [['Date', 'Amount']],
        body: trendData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      })
    }
    
    return doc
  }

  const handleExportCSV = async () => {
    setExporting(prev => ({ ...prev, csv: true }))
    try {
      const csvContent = generateCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `financial_report_${year}_${month}.csv`)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(prev => ({ ...prev, csv: false }))
    }
  }

  const handleExportPDF = async () => {
    setExporting(prev => ({ ...prev, pdf: true }))
    try {
      const doc = await generatePDF()
      doc.save(`financial_report_${year}_${month}.pdf`)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleExport = async (format) => {
    if (format === 'CSV') {
      await handleExportCSV()
    } else if (format === 'PDF') {
      await handleExportPDF()
    }
  }

  const handleRefresh = () => {
    fetchData()
    toast.success('Reports refreshed')
  }

  if (loading) return <LoadingSpinner />

  const totalSpent = pieData.reduce((acc, item) => acc + item.value, 0)
  const daysInMonth = new Date(year, month, 0).getDate()
  const avgDaily = totalSpent / daysInMonth
  const topCategory = pieData.length > 0 
    ? pieData.reduce((max, item) => item.value > max.value ? item : max, pieData[0])
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Financial Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              Analyze your spending patterns and trends
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button 
              onClick={() => handleExport('PDF')}
              disabled={exporting.pdf || pieData.length === 0}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              {exporting.pdf ? (
                <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlineDocumentText className="text-lg md:text-xl" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={() => handleExport('CSV')}
              disabled={exporting.csv || pieData.length === 0}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              {exporting.csv ? (
                <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlineDocumentReport className="text-lg md:text-xl" />
              )}
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              <HiOutlineRefresh className={`text-lg md:text-xl ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Spent Card */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <HiOutlineChartBar className="text-xl md:text-2xl text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {new Date(year, month-1, 1).toLocaleString('default', { month: 'long' })} {year}
            </div>
          </div>

          {/* Average Daily Card */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Average Daily</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  ${avgDaily.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HiOutlineTrendingUp className="text-xl md:text-2xl text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Based on {daysInMonth} days
            </div>
          </div>

          {/* Top Category Card */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  {topCategory?.name || 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <HiOutlineChartPie className="text-xl md:text-2xl text-green-600 dark:text-green-400" />
              </div>
            </div>
            {topCategory && (
              <div className="mt-3 md:mt-4 text-xs md:text-sm text-green-600 dark:text-green-400">
                ${topCategory.value.toFixed(2)} ({((topCategory.value / totalSpent) * 100).toFixed(1)}%)
              </div>
            )}
          </div>

          {/* vs Last Month Card */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">vs Last Month</p>
                <p className={`text-xl md:text-2xl lg:text-3xl font-bold mt-2 ${summary?.change_percent > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {summary?.change_percent > 0 ? '+' : ''}{summary?.change_percent?.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {summary?.change_percent > 0 ? (
                  <HiOutlineTrendingUp className="text-xl md:text-2xl text-red-600 dark:text-red-400" />
                ) : (
                  <HiOutlineTrendingDown className="text-xl md:text-2xl text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {summary?.last_month_total ? `$${summary.last_month_total.toFixed(2)} last month` : 'No data'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('daily')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                  viewType === 'daily' 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewType('weekly')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                  viewType === 'weekly' 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewType('monthly')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                  viewType === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <select 
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select 
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, m-1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold">Spending Trend</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    chartType === 'line' 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    chartType === 'bar' 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
            {lineData.length > 0 ? (
              <div className="h-[250px] md:h-[300px]">
                {chartType === 'line' ? <LineChart data={lineData} /> : <BarChart data={lineData} />}
              </div>
            ) : (
              <div className="h-[250px] md:h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <HiOutlineChartBar className="text-4xl md:text-5xl mb-3 opacity-50" />
                <p className="text-sm md:text-base">No spending data available for this period</p>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Category Breakdown</h3>
            {pieData.length > 0 ? (
              <div className="h-[250px] md:h-[300px]">
                <PieChart data={pieData} />
              </div>
            ) : (
              <div className="h-[250px] md:h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <HiOutlineChartPie className="text-4xl md:text-5xl mb-3 opacity-50" />
                <p className="text-sm md:text-base">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Details Table */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold">Category Details</h3>
            <button 
              onClick={() => handleExport('PDF')}
              disabled={pieData.length === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              <HiOutlinePrinter className="text-lg" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pieData.map((item) => {
                  const trendValue = categoryTrends[item.name] || '0'
                  const trendNum = parseFloat(trendValue)
                  const trendPositive = trendNum > 0
                  const percentage = ((item.value / totalSpent) * 100).toFixed(1)
                  
                  return (
                    <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">${item.value.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{percentage}%</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm flex items-center gap-1 ${
                          trendPositive ? 'text-green-600' : trendNum < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {trendPositive ? '↑' : trendNum < 0 ? '↓' : '→'} 
                          {Math.abs(trendNum)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {pieData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No category data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="mt-6">
          <AIInsightsPanel />
        </div>
      </div>
    </div>
  )
}