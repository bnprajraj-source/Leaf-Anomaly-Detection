import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leaf_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('leaf_token')
      window.location.href = '/login'
    }
    const status = error.response?.status
    let msg = error.response?.data?.detail || error.message || 'Unknown error'
    if (status === 503) {
      msg = 'Backend server is starting up. Please wait a moment and try again.'
    } else if (status === 0 || !error.response) {
      msg = 'Cannot connect to backend server. Please start the server first.'
    }
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

// ---------------------------------------------------------------------------
// Authentication (Python FastAPI backend)
// ---------------------------------------------------------------------------

export async function registerUser(name, email, password) {
  const response = await apiClient.post('/auth/signup', {
    email,
    password,
    full_name: name,
  })
  const data = response.data
  return { token: data.access_token, user: data.user }
}

export async function loginUser(email, password) {
  const response = await apiClient.post('/auth/login', { email, password })
  const data = response.data
  return { token: data.access_token, user: data.user }
}

export async function getMe() {
  const response = await apiClient.get('/auth/me')
  return response.data
}

// ---------------------------------------------------------------------------
// ML Prediction (Python backend)
// ---------------------------------------------------------------------------

export async function predictLeafAnomaly(imageFile) {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await apiClient.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function checkHealth() {
  const response = await apiClient.get('/health')
  return response.data
}

// ---------------------------------------------------------------------------
// History & Stats (Python backend — same service as predictions)
// ---------------------------------------------------------------------------

export async function getPredictionHistory(params = {}) {
  const response = await apiClient.get('/history', { params })
  return response.data
}

export async function getPredictionRecord(recordId) {
  const response = await apiClient.get(`/history/${recordId}`)
  return response.data
}

export async function deletePredictionRecord(recordId) {
  const response = await apiClient.delete(`/history/${recordId}`)
  return response.data
}

export async function clearPredictionHistory() {
  const response = await apiClient.delete('/history')
  return response.data
}

export async function getStatistics() {
  const response = await apiClient.get('/stats')
  return response.data
}

export default apiClient
