import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Profile {
  id: string
  type: 'admin' | 'staff' | 'labour_lead' | 'supplier'
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  permissions: string[]
  department?: string
  role?: string
  createdAt: string
  updatedAt: string
}

interface ProfilesState {
  profiles: Profile[]
  selectedProfile: Profile | null
  filter: {
    type: string
    status: string
    search: string
  }
  isLoading: boolean
  error: string | null
}

const initialState: ProfilesState = {
  profiles: [],
  selectedProfile: null,
  filter: {
    type: 'all',
    status: 'all',
    search: '',
  },
  isLoading: false,
  error: null,
}

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<Profile[]>) => {
      state.profiles = action.payload
    },
    addProfile: (state, action: PayloadAction<Profile>) => {
      state.profiles.push(action.payload)
    },
    updateProfile: (state, action: PayloadAction<Profile>) => {
      const index = state.profiles.findIndex(profile => profile.id === action.payload.id)
      if (index !== -1) {
        state.profiles[index] = action.payload
      }
    },
    deleteProfile: (state, action: PayloadAction<string>) => {
      state.profiles = state.profiles.filter(profile => profile.id !== action.payload)
    },
    setSelectedProfile: (state, action: PayloadAction<Profile | null>) => {
      state.selectedProfile = action.payload
    },
    setFilter: (state, action: PayloadAction<Partial<ProfilesState['filter']>>) => {
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
  setProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  setSelectedProfile,
  setFilter,
  setLoading,
  setError,
} = profilesSlice.actions

export default profilesSlice.reducer