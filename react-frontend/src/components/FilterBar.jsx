import { useState, useEffect } from 'react'
import { getCategories } from '../services/categories'

export default function FilterBar({ onFilterChange }) {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
    min_amount: '',
    max_amount: '',
    search: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    onFilterChange(filters)
  }

  const clearFilters = () => {
    const cleared = {
      start_date: '',
      end_date: '',
      category_id: '',
      min_amount: '',
      max_amount: '',
      search: ''
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  return (
    <div className="bg-base-100 p-4 rounded-lg shadow mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <input
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={handleChange}
          className="input input-bordered input-sm"
          placeholder="Start Date"
        />
        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleChange}
          className="input input-bordered input-sm"
          placeholder="End Date"
        />
        <select name="category_id" value={filters.category_id} onChange={handleChange} className="select select-bordered select-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="number"
          name="min_amount"
          value={filters.min_amount}
          onChange={handleChange}
          className="input input-bordered input-sm"
          placeholder="Min $"
        />
        <input
          type="number"
          name="max_amount"
          value={filters.max_amount}
          onChange={handleChange}
          className="input input-bordered input-sm"
          placeholder="Max $"
        />
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          className="input input-bordered input-sm"
          placeholder="Search description"
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn btn-sm btn-ghost" onClick={clearFilters}>Clear</button>
        <button className="btn btn-sm btn-primary" onClick={applyFilters}>Apply Filters</button>
      </div>
    </div>
  )
}