import api from './api'

export const getDebts = () => api.get('/debts/').then(res => res.data)
export const createDebt = (data) => api.post('/debts/', data).then(res => res.data)
export const updateDebt = (id, data) => api.put(`/debts/${id}`, data).then(res => res.data)
export const deleteDebt = (id) => api.delete(`/debts/${id}`).then(res => res.data)