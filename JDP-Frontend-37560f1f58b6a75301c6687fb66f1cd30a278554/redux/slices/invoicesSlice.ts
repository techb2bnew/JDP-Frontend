import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Invoice } from '../../types/invoice'

interface InvoicesState {
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  filter: {
    status: string
    type: string
    search: string
    dateRange: {
      start: string
      end: string
    }
  }
  isLoading: boolean
  error: string | null
}

const initialState: InvoicesState = {
  invoices: [],
  selectedInvoice: null,
  filter: {
    status: 'all',
    type: 'all',
    search: '',
    dateRange: {
      start: '',
      end: '',
    },
  },
  isLoading: false,
  error: null,
}

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.push(action.payload)
    },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex(invoice => invoice.id === action.payload.id)
      if (index !== -1) {
        state.invoices[index] = action.payload
      }
    },
    deleteInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(invoice => invoice.id !== action.payload)
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload
    },
    setFilter: (state, action: PayloadAction<Partial<InvoicesState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const {
  setInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  setSelectedInvoice,
  setFilter,
  setLoading,
  setError,
} = invoicesSlice.actions

export default invoicesSlice.reducer