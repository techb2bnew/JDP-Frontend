import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import appSlice from './slices/appSlice'
import jobsSlice from './slices/jobsSlice'
import profilesSlice from './slices/profilesSlice'
import invoicesSlice from './slices/invoicesSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    app: appSlice,
    jobs: jobsSlice,
    profiles: profilesSlice,
    invoices: invoicesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch