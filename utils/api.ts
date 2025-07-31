// Mock API functions - in real app these would make actual API calls

export const apiClient = {
  // Auth
  login: async (email: string, password: string) => {
    // Mock login
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      user: {
        id: '1',
        email,
        name: 'Admin User',
        role: 'admin'
      }
    }
  },

  // Jobs
  getJobs: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return []
  },

  createJob: async (jobData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { id: Date.now().toString(), ...jobData }
  },

  // Profiles
  getProfiles: async (type?: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return []
  },

  // Invoices
  getInvoices: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return []
  },

  // Notifications
  getNotifications: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return []
  }
}