import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Job {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  customerId: string
  customerName: string
  location: string
  startDate: string
  endDate?: string
  assignedTo: string[]
  priority: 'low' | 'medium' | 'high'
  budget: number
  actualCost?: number
  progress: number
  createdAt: string
  updatedAt: string
}

interface JobsState {
  jobs: Job[]
  selectedJob: Job | null
  filter: {
    status: string
    priority: string
    search: string
  }
  isLoading: boolean
  error: string | null
}

const initialState: JobsState = {
  jobs: [],
  selectedJob: null,
  filter: {
    status: 'all',
    priority: 'all',
    search: '',
  },
  isLoading: false,
  error: null,
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.jobs.push(action.payload)
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id)
      if (index !== -1) {
        state.jobs[index] = action.payload
      }
    },
    deleteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload)
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload
    },
    setFilter: (state, action: PayloadAction<Partial<JobsState['filter']>>) => {
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
  setJobs,
  addJob,
  updateJob,
  deleteJob,
  setSelectedJob,
  setFilter,
  setLoading,
  setError,
} = jobsSlice.actions

export default jobsSlice.reducer