import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL || ''
const cleanBase = rawBase.replace(/\/+$/, '')
const baseURL = cleanBase ? `${cleanBase}/api` : '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Transparent refresh token handling
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Intercept 401s and attempt silent refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/verify-otp') ||
      originalRequest?.url?.includes('/auth/resend-otp') ||
      originalRequest?.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(err)
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
        const { token, refreshToken: newRefreshToken } = res.data.data
        localStorage.setItem('token', token)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }
        api.defaults.headers.common.Authorization = `Bearer ${token}`
        originalRequest.headers.Authorization = `Bearer ${token}`
        processQueue(null, token)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  refresh:   (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:    (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me:        ()     => api.get('/auth/me'),
}

// ── Spaces ────────────────────────────────────────────────
export const spacesApi = {
  list:    ()         => api.get('/spaces'),
  get:     (id)       => api.get(`/spaces/${id}`),
  mastery: (id)       => api.get(`/spaces/${id}/mastery`),
  create:  (data)     => api.post('/spaces', data),
  update:  (id, data) => api.put(`/spaces/${id}`, data),
  delete:  (id)       => api.delete(`/spaces/${id}`),
}

// ── Projects ──────────────────────────────────────────────
export const projectsApi = {
  list:   (spaceId)       => api.get(`/spaces/${spaceId}/projects`),
  get:    (id)            => api.get(`/projects/${id}`),
  create: (spaceId, data) => api.post(`/spaces/${spaceId}/projects`, data),
  update: (id, data)      => api.put(`/projects/${id}`, data),
  delete: (id)            => api.delete(`/projects/${id}`),
  overview: (id)          => api.get(`/projects/${id}/overview`),
}

// ── Materials ─────────────────────────────────────────────
export const materialsApi = {
  list:   (projectId)                => api.get(`/projects/${projectId}/materials`),
  upload: (projectId, formData)      => api.post(`/projects/${projectId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  status: (projectId, materialId)    => api.get(`/projects/${projectId}/materials/${materialId}/status`),
  delete: (projectId, materialId)    => api.delete(`/projects/${projectId}/materials/${materialId}`),
}

// ── Tutor ─────────────────────────────────────────────────
export const tutorApi = {
  ask:             (projectId, data)                    => api.post(`/projects/${projectId}/tutor/ask`, data),
  conversations:   (projectId)                          => api.get(`/projects/${projectId}/tutor/conversations`),
  messages:        (projectId, conversationId)          => api.get(`/projects/${projectId}/tutor/conversations/${conversationId}/messages`),
  deleteConversation: (projectId, conversationId)       => api.delete(`/projects/${projectId}/tutor/conversations/${conversationId}`),
}

// ── Quiz ──────────────────────────────────────────────────
export const quizApi = {
  start:      (projectId, data)                => api.post(`/projects/${projectId}/quizzes`, data || {}),
  list:       (projectId)                      => api.get(`/projects/${projectId}/quizzes`),
  get:        (projectId, attemptId)           => api.get(`/projects/${projectId}/quizzes/${attemptId}`),
  answer:     (projectId, attemptId, qId, data)=> api.post(`/projects/${projectId}/quizzes/${attemptId}/questions/${qId}/answer`, data),
}

// ── Recommendations ───────────────────────────────────────
export const recommendationsApi = {
  list:     (projectId)     => api.get(`/projects/${projectId}/recommendations`),
  dismiss:  (projectId, id) => api.post(`/projects/${projectId}/recommendations/${id}/dismiss`),
  complete: (projectId, id) => api.post(`/projects/${projectId}/recommendations/${id}/complete`),
}

// ── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  overview: (spaceId) => api.get('/analytics/overview' + (spaceId ? `?spaceId=${spaceId}` : '')),
  growth:   (projectId)  => api.get(`/projects/${projectId}/growth`),
  project:  (projectId)  => api.get(`/projects/${projectId}/overview`),
}


// ── Mastery ───────────────────────────────────────────────
export const masteryApi = {
  list: (projectId) => api.get(`/projects/${projectId}/mastery`),
}

// ── Open-Ended Assessments ────────────────────────────────
export const assessmentApi = {
  submit:    (projectId, data)         => api.post(`/projects/${projectId}/assessments`, data),
  challenge: (projectId)              => api.get(`/projects/${projectId}/assessments/challenge`),
  list:      (projectId)               => api.get(`/projects/${projectId}/assessments`),
  get:       (projectId, assessmentId) => api.get(`/projects/${projectId}/assessments/${assessmentId}`),
}

// ── Admin Hub ─────────────────────────────────────────────
export const adminApi = {
  overview: () => api.get('/admin/overview'),
  users:    () => api.get('/admin/users'),
  activity: () => api.get('/admin/activity'),
  usage:    () => api.get('/admin/usage'),
  jobs:     () => api.get('/admin/jobs'),
}

// ── User Profile ──────────────────────────────────────────
export const userApi = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.post('/users/change-password', data),
}

