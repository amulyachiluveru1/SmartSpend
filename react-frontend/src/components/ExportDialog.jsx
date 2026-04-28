import { useState } from 'react'
import { exportExpenses } from '../services/importexport'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

export default function ExportDialog({ onClose }) {
  const [format, setFormat] = useState('csv')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleExport = async () => {
    try {
      const blob = await exportExpenses(format, startDate || undefined, endDate || undefined)
      saveAs(blob, `expenses_${new Date().toISOString().slice(0,10)}.${format}`)
      toast.success('Export successful')
      onClose()
    } catch (error) {
      toast.error('Export failed')
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Export Expenses</h3>
        <div className="form-control mt-4">
          <label className="label">Format</label>
          <select className="select select-bordered" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">Start Date</label>
            <input type="date" className="input input-bordered" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label">End Date</label>
            <input type="date" className="input input-bordered" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleExport}>Export</button>
        </div>
      </div>
    </div>
  )
}