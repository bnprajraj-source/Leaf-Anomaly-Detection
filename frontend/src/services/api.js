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

// ---------------------------------------------------------------------------
// Batch Prediction (Python backend)
// ---------------------------------------------------------------------------

export async function predictBatch(imageFiles) {
  const formData = new FormData()
  imageFiles.forEach((file) => {
    formData.append('files', file)
  })

  const response = await apiClient.post('/predict/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Health Check (Python backend)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Export History as CSV
// ---------------------------------------------------------------------------

export async function exportHistoryCSV(params = {}) {
  const response = await apiClient.get('/history/export/csv', {
    params,
    responseType: 'blob',
  })
  // Trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `leaf_anomaly_history_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return true
}

// ---------------------------------------------------------------------------
// Statistics (Python backend)
// ---------------------------------------------------------------------------

export async function getStatistics() {
  const response = await apiClient.get('/stats')
  return response.data
}

// ---------------------------------------------------------------------------
// User Profile (Python backend)
// ---------------------------------------------------------------------------

export async function updateProfile(fullName, email) {
  const payload = {}
  if (fullName !== undefined) payload.full_name = fullName
  if (email !== undefined) payload.email = email

  const response = await apiClient.put('/auth/update-profile', payload)
  return response.data
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Auth — Logout, Delete Account, User Stats
// ---------------------------------------------------------------------------

export async function logoutUser() {
  const response = await apiClient.post('/auth/logout')
  localStorage.removeItem('leaf_token')
  return response.data
}

export async function deleteAccount(password) {
  const response = await apiClient.delete('/auth/delete-account', {
    data: { password },
  })
  localStorage.removeItem('leaf_token')
  return response.data
}

export async function getUserStats() {
  const response = await apiClient.get('/auth/user-stats')
  return response.data
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export async function submitFeedback(predictionId, rating, comment = null, correct = null) {
  const params = { prediction_id: predictionId, rating }
  if (comment) params.comment = comment
  if (correct !== null) params.correct = correct

  const response = await apiClient.post('/feedback', null, { params })
  return response.data
}

export async function getFeedbackList(params = {}) {
  const response = await apiClient.get('/feedback', { params })
  return response.data
}

export async function getFeedbackForPrediction(predictionId) {
  const response = await apiClient.get(`/feedback/${predictionId}`)
  return response.data
}

export async function deleteFeedback(feedbackId) {
  const response = await apiClient.delete(`/feedback/${feedbackId}`)
  return response.data
}

// ---------------------------------------------------------------------------
// Disease Information
// ---------------------------------------------------------------------------

export async function getDiseases() {
  const response = await apiClient.get('/diseases')
  return response.data
}

export async function getDiseaseInfo(diseaseName) {
  const response = await apiClient.get(`/diseases/${diseaseName}`)
  return response.data
}

export async function getDiseaseTreatment(diseaseName) {
  const response = await apiClient.get(`/diseases/${diseaseName}/treatment`)
  return response.data
}

export async function getDiseasePrevention(diseaseName) {
  const response = await apiClient.get(`/diseases/${diseaseName}/prevention`)
  return response.data
}

// ---------------------------------------------------------------------------
// Advanced Analytics
// ---------------------------------------------------------------------------

export async function getPredictionTrends(period = 'daily', days = 30) {
  const response = await apiClient.get('/analytics/trends', {
    params: { period, days },
  })
  return response.data
}

export async function comparePeriods(startDate1, endDate1, startDate2, endDate2) {
  const response = await apiClient.get('/analytics/comparison', {
    params: {
      start_date_1: startDate1,
      end_date_1: endDate1,
      start_date_2: startDate2,
      end_date_2: endDate2,
    },
  })
  return response.data
}

export async function getConfidenceDistribution(days = 30) {
  const response = await apiClient.get('/analytics/confidence', {
    params: { days },
  })
  return response.data
}

export async function getDiseaseFrequency(startDate = null, endDate = null) {
  const params = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate

  const response = await apiClient.get('/analytics/diseases', { params })
  return response.data
}

export async function getAnalyticsSummary(startDate = null, endDate = null) {
  const params = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate

  const response = await apiClient.get('/analytics/summary', { params })
  return response.data
}

// ---------------------------------------------------------------------------
// Plant Health Tracking
// ---------------------------------------------------------------------------

export async function registerPlant(name, species = null, locationId = null, notes = null) {
  const params = { name }
  if (species) params.species = species
  if (locationId) params.location_id = locationId
  if (notes) params.notes = notes

  const response = await apiClient.post('/plants', null, { params })
  return response.data
}

export async function getPlants(params = {}) {
  const response = await apiClient.get('/plants', { params })
  return response.data
}

export async function getPlant(plantId) {
  const response = await apiClient.get(`/plants/${plantId}`)
  return response.data
}

export async function updatePlant(plantId, updates = {}) {
  const params = {}
  if (updates.name !== undefined) params.name = updates.name
  if (updates.species !== undefined) params.species = updates.species
  if (updates.location_id !== undefined) params.location_id = updates.location_id
  if (updates.notes !== undefined) params.notes = updates.notes

  const response = await apiClient.put(`/plants/${plantId}`, null, { params })
  return response.data
}

export async function deletePlant(plantId) {
  const response = await apiClient.delete(`/plants/${plantId}`)
  return response.data
}

export async function recordPlantScan(plantId, predictionId) {
  const response = await apiClient.post(`/plants/${plantId}/scan`, null, {
    params: { prediction_id: predictionId },
  })
  return response.data
}

export async function getPlantHistory(plantId, params = {}) {
  const response = await apiClient.get(`/plants/${plantId}/history`, { params })
  return response.data
}

export async function getPlantStats(plantId) {
  const response = await apiClient.get(`/plants/${plantId}/stats`)
  return response.data
}

// ---------------------------------------------------------------------------
// Location Management
// ---------------------------------------------------------------------------

export async function createLocation(name, type = 'garden', address = null, lat = null, lng = null, notes = null) {
  const params = { name, location_type: type }
  if (address) params.address = address
  if (lat) params.latitude = lat
  if (lng) params.longitude = lng
  if (notes) params.notes = notes

  const response = await apiClient.post('/locations', null, { params })
  return response.data
}

export async function getLocations(params = {}) {
  const response = await apiClient.get('/locations', { params })
  return response.data
}

export async function getLocation(locationId) {
  const response = await apiClient.get(`/locations/${locationId}`)
  return response.data
}

export async function updateLocation(locationId, updates = {}) {
  const params = {}
  if (updates.name !== undefined) params.name = updates.name
  if (updates.type !== undefined) params.location_type = updates.type
  if (updates.address !== undefined) params.address = updates.address
  if (updates.latitude !== undefined) params.latitude = updates.latitude
  if (updates.longitude !== undefined) params.longitude = updates.longitude
  if (updates.notes !== undefined) params.notes = updates.notes

  const response = await apiClient.put(`/locations/${locationId}`, null, { params })
  return response.data
}

export async function deleteLocation(locationId) {
  const response = await apiClient.delete(`/locations/${locationId}`)
  return response.data
}

export async function getLocationStats(locationId) {
  const response = await apiClient.get(`/locations/${locationId}/stats`)
  return response.data
}

// ---------------------------------------------------------------------------
// Treatment Tracking
// ---------------------------------------------------------------------------

export async function recordTreatment(plantId, diseaseName, treatmentType, options = {}) {
  const params = { plant_id: plantId, disease_name: diseaseName, treatment_type: treatmentType }
  if (options.productName) params.product_name = options.productName
  if (options.dosage) params.dosage = options.dosage
  if (options.notes) params.notes = options.notes
  if (options.startDate) params.start_date = options.startDate
  if (options.frequencyDays) params.frequency_days = options.frequencyDays
  if (options.totalApplications) params.total_applications = options.totalApplications

  const response = await apiClient.post('/treatments', null, { params })
  return response.data
}

export async function getTreatments(params = {}) {
  const response = await apiClient.get('/treatments', { params })
  return response.data
}

export async function getActiveTreatments() {
  const response = await apiClient.get('/treatments/active')
  return response.data
}

export async function getTreatment(treatmentId) {
  const response = await apiClient.get(`/treatments/${treatmentId}`)
  return response.data
}

export async function updateTreatment(treatmentId, updates = {}) {
  const params = {}
  if (updates.status !== undefined) params.status = updates.status
  if (updates.effectiveness_rating !== undefined) params.effectiveness_rating = updates.effectiveness_rating
  if (updates.notes !== undefined) params.notes = updates.notes
  if (updates.applications_completed !== undefined) params.applications_completed = updates.applications_completed

  const response = await apiClient.put(`/treatments/${treatmentId}`, null, { params })
  return response.data
}

export async function deleteTreatment(treatmentId) {
  const response = await apiClient.delete(`/treatments/${treatmentId}`)
  return response.data
}

export async function getTreatmentProgress(treatmentId) {
  const response = await apiClient.get(`/treatments/${treatmentId}/progress`)
  return response.data
}

export async function getTreatmentStats() {
  const response = await apiClient.get('/treatments/stats')
  return response.data
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(params = {}) {
  const response = await apiClient.get('/notifications', { params })
  return response.data
}

export async function getUnreadCount() {
  const response = await apiClient.get('/notifications/unread-count')
  return response.data
}

export async function markNotificationRead(notificationId) {
  const response = await apiClient.put(`/notifications/${notificationId}/read`)
  return response.data
}

export async function deleteNotification(notificationId) {
  const response = await apiClient.delete(`/notifications/${notificationId}`)
  return response.data
}

export async function clearNotifications() {
  const response = await apiClient.delete('/notifications')
  return response.data
}

// ---------------------------------------------------------------------------
// QR Code
// ---------------------------------------------------------------------------

export async function getPredictionQRBase64(predictionId) {
  const response = await apiClient.get(`/qr/prediction/${predictionId}/base64`)
  return response.data
}

export function getPredictionQRUrl(predictionId) {
  return `${API_BASE_URL}/qr/prediction/${predictionId}`
}

export function getPlantQRUrl(plantId) {
  return `${API_BASE_URL}/qr/plant/${plantId}`
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function generateReport(options = {}) {
  const params = {}
  if (options.report_type) params.report_type = options.report_type
  if (options.date_from) params.date_from = options.date_from
  if (options.date_to) params.date_to = options.date_to
  if (options.format) params.format = options.format

  const response = await apiClient.post('/reports/generate', null, { params })
  return response.data
}

export async function listReports(params = {}) {
  const response = await apiClient.get('/reports', { params })
  return response.data
}

export async function getReports(params = {}) {
  const response = await apiClient.get('/reports', { params })
  return response.data
}

export async function getReportStats() {
  const response = await apiClient.get('/reports/stats')
  return response.data
}

export async function downloadReport(reportId) {
  const response = await apiClient.get(`/reports/download/${reportId}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `leaf_report_${reportId.slice(-8)}.html`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return true
}

export async function deleteReport(reportId) {
  const response = await apiClient.delete(`/reports/${reportId}`)
  return response.data
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export async function getAuditLogs(params = {}) {
  const response = await apiClient.get('/audit', { params })
  return response.data
}

export async function getAuditStats(days = 30) {
  const response = await apiClient.get('/audit/stats', { params: { days } })
  return response.data
}

export async function clearAuditLogs() {
  const response = await apiClient.delete('/audit')
  return response.data
}

// ---------------------------------------------------------------------------
// Weather & Conditions Logging
// ---------------------------------------------------------------------------

export async function logWeather(conditions) {
  const response = await apiClient.post('/weather/log', null, { params: conditions })
  return response.data
}

export async function getWeatherLogs(params = {}) {
  const response = await apiClient.get('/weather', { params })
  return response.data
}

export async function getWeatherCorrelation(days = 90) {
  const response = await apiClient.get('/weather/correlation', { params: { days } })
  return response.data
}

export async function getWeatherSummary(days = 30) {
  const response = await apiClient.get('/weather/summary', { params: { days } })
  return response.data
}

export async function deleteWeatherLog(weatherId) {
  const response = await apiClient.delete(`/weather/${weatherId}`)
  return response.data
}

// ---------------------------------------------------------------------------
// Image Gallery
// ---------------------------------------------------------------------------

export async function getGallery(params = {}) {
  const response = await apiClient.get('/gallery', { params })
  return response.data
}

export async function getGalleryImage(imageId) {
  const response = await apiClient.get(`/gallery/${imageId}`)
  return response.data
}

export async function compareImages(imageIds) {
  const response = await apiClient.post('/gallery/compare', { image_ids: imageIds })
  return response.data
}

export async function getGalleryStats() {
  const response = await apiClient.get('/gallery/stats/overview')
  return response.data
}

export async function deleteGalleryImage(imageId) {
  const response = await apiClient.delete(`/gallery/${imageId}`)
  return response.data
}

// ---------------------------------------------------------------------------
// Batch Operations
// ---------------------------------------------------------------------------

export async function bulkUpdatePlants(plantIds, updates = {}) {
  const params = { plant_ids: plantIds }
  if (updates.health_status) params.health_status = updates.health_status
  if (updates.location_id) params.location_id = updates.location_id

  const response = await apiClient.post('/batch/plants/update', params)
  return response.data
}

export async function bulkDeletePlants(plantIds) {
  const response = await apiClient.post('/batch/plants/delete', { plant_ids: plantIds })
  return response.data
}

export async function bulkTagPlants(plantIds, tags) {
  const response = await apiClient.post('/batch/plants/tag', { plant_ids: plantIds, tags })
  return response.data
}

export async function bulkDeletePredictions(predictionIds) {
  const response = await apiClient.post('/batch/predictions/delete', { prediction_ids: predictionIds })
  return response.data
}

export async function exportAllData(options = {}) {
  const params = {}
  if (options.include_predictions !== undefined) params.include_predictions = options.include_predictions
  if (options.include_plants !== undefined) params.include_plants = options.include_plants
  if (options.include_treatments !== undefined) params.include_treatments = options.include_treatments
  if (options.include_weather !== undefined) params.include_weather = options.include_weather

  const response = await apiClient.get('/batch/export', { params, responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `leaf_data_export_${Date.now()}.json`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return true
}

// ---------------------------------------------------------------------------
// Seasonal Analysis
// ---------------------------------------------------------------------------

export async function getSeasonalAnalysis(year = null) {
  const params = year ? { year } : {}
  const response = await apiClient.get('/seasonal/analysis', { params })
  return response.data
}

export async function getMonthlyBreakdown(year = null) {
  const params = year ? { year } : {}
  const response = await apiClient.get('/seasonal/monthly', { params })
  return response.data
}

export async function getMonthlyData(year = null) {
  const params = year ? { year } : {}
  const response = await apiClient.get('/seasonal/monthly', { params })
  return response.data
}

export async function getBestWorstPeriods(days = 365) {
  const response = await apiClient.get('/seasonal/best-worst', { params: { days } })
  return response.data
}

export async function getBestAndWorstPlants(year = null) {
  const params = year ? { year } : {}
  const response = await apiClient.get('/seasonal/best-worst', { params })
  return response.data
}

// ---------------------------------------------------------------------------
// Tags & Labels
// ---------------------------------------------------------------------------

export async function createTag(name, color = null, description = null) {
  const params = { name }
  if (color) params.color = color
  if (description) params.description = description

  const response = await apiClient.post('/tags', null, { params })
  return response.data
}

export async function getTags(params = {}) {
  const response = await apiClient.get('/tags', { params })
  return response.data
}

export async function getTag(tagId) {
  const response = await apiClient.get(`/tags/${tagId}`)
  return response.data
}

export async function updateTag(tagId, updates = {}) {
  const params = {}
  if (updates.name !== undefined) params.name = updates.name
  if (updates.color !== undefined) params.color = updates.color
  if (updates.description !== undefined) params.description = updates.description

  const response = await apiClient.put(`/tags/${tagId}`, null, { params })
  return response.data
}

export async function deleteTag(tagId) {
  const response = await apiClient.delete(`/tags/${tagId}`)
  return response.data
}

export async function addPlantsToTag(tagId, plantIds) {
  const response = await apiClient.post(`/tags/${tagId}/plants`, { plant_ids: plantIds })
  return response.data
}

export async function removePlantsFromTag(tagId, plantIds) {
  const response = await apiClient.delete(`/tags/${tagId}/plants`, { data: { plant_ids: plantIds } })
  return response.data
}

// ---------------------------------------------------------------------------
// Growth Stage Tracking
// ---------------------------------------------------------------------------

export async function recordGrowthStage(plantId, stage, options = {}) {
  const params = { plant_id: plantId, stage }
  if (options.height_cm) params.height_cm = options.height_cm
  if (options.leaf_count) params.leaf_count = options.leaf_count
  if (options.notes) params.notes = options.notes

  const response = await apiClient.post('/growth/stages', null, { params })
  return response.data
}

export async function getGrowthStages(params = {}) {
  const response = await apiClient.get('/growth/stages', { params })
  return response.data
}

export async function getGrowthTimeline(plantId) {
  const response = await apiClient.get(`/growth/timeline/${plantId}`)
  return response.data
}

export async function getCurrentGrowthStage(plantId) {
  const response = await apiClient.get(`/growth/current/${plantId}`)
  return response.data
}

export async function getAvailableGrowthStages() {
  const response = await apiClient.get('/growth/available-stages')
  return response.data
}

// ---------------------------------------------------------------------------
// Irrigation & Watering
// ---------------------------------------------------------------------------

export async function logWatering(plantId, options = {}) {
  const params = { plant_id: plantId }
  if (options.amount_ml) params.amount_ml = options.amount_ml
  if (options.method) params.method = options.method
  if (options.duration_seconds) params.duration_seconds = options.duration_seconds
  if (options.notes) params.notes = options.notes

  const response = await apiClient.post('/irrigation/log', null, { params })
  return response.data
}

export async function getIrrigationLogs(params = {}) {
  const response = await apiClient.get('/irrigation', { params })
  return response.data
}

export async function getWateringSchedule() {
  const response = await apiClient.get('/irrigation/schedule')
  return response.data
}

export async function setWateringSchedule(plantId, intervalDays, options = {}) {
  const params = { plant_id: plantId, interval_days: intervalDays }
  if (options.amount_ml) params.amount_ml = options.amount_ml
  if (options.method) params.method = options.method

  const response = await apiClient.post('/irrigation/schedule/set', null, { params })
  return response.data
}

export async function getIrrigationStats(days = 30) {
  const response = await apiClient.get('/irrigation/stats', { params: { days } })
  return response.data
}

// ---------------------------------------------------------------------------
// Fertilizer Tracking
// ---------------------------------------------------------------------------

export async function logFertilizer(plantId, options = {}) {
  const params = { plant_id: plantId }
  if (options.fertilizer_type) params.fertilizer_type = options.fertilizer_type
  if (options.product_name) params.product_name = options.product_name
  if (options.npk_ratio) params.npk_ratio = options.npk_ratio
  if (options.amount_grams) params.amount_grams = options.amount_grams
  if (options.amount_ml) params.amount_ml = options.amount_ml
  if (options.method) params.method = options.method
  if (options.notes) params.notes = options.notes

  const response = await apiClient.post('/fertilizer/log', null, { params })
  return response.data
}

export async function getFertilizerLogs(params = {}) {
  const response = await apiClient.get('/fertilizer', { params })
  return response.data
}

export async function getFertilizerSchedule() {
  const response = await apiClient.get('/fertilizer/schedule')
  return response.data
}

export async function getFertilizerStats(days = 90) {
  const response = await apiClient.get('/fertilizer/stats', { params: { days } })
  return response.data
}

// ---------------------------------------------------------------------------
// Soil Analysis
// ---------------------------------------------------------------------------

export async function logSoilAnalysis(plantId, analysis = {}) {
  const params = {}
  if (plantId) params.plant_id = plantId
  if (analysis.ph !== undefined) params.ph = analysis.ph
  if (analysis.nitrogen !== undefined) params.nitrogen = analysis.nitrogen
  if (analysis.phosphorus !== undefined) params.phosphorus = analysis.phosphorus
  if (analysis.potassium !== undefined) params.potassium = analysis.potassium
  if (analysis.moisture_percent !== undefined) params.moisture_percent = analysis.moisture_percent
  if (analysis.temperature_celsius !== undefined) params.temperature_celsius = analysis.temperature_celsius
  if (analysis.notes) params.notes = analysis.notes

  const response = await apiClient.post('/soil/log', null, { params })
  return response.data
}

export async function getSoilLogs(params = {}) {
  const response = await apiClient.get('/soil', { params })
  return response.data
}

export async function getSoilStats() {
  const response = await apiClient.get('/soil/stats')
  return response.data
}

// ---------------------------------------------------------------------------
// Harvest Tracking
// ---------------------------------------------------------------------------

export async function logHarvest(plantId, options = {}) {
  const params = { plant_id: plantId }
  if (options.quantity !== undefined) params.quantity = options.quantity
  if (options.unit) params.unit = options.unit
  if (options.quality) params.quality = options.quality
  if (options.notes) params.notes = options.notes

  const response = await apiClient.post('/harvest/log', null, { params })
  return response.data
}

export async function getHarvests(params = {}) {
  const response = await apiClient.get('/harvest', { params })
  return response.data
}

export async function getHarvestStats(days = 365) {
  const response = await apiClient.get('/harvest/stats', { params: { days } })
  return response.data
}

// ---------------------------------------------------------------------------
// Expense Tracking
// ---------------------------------------------------------------------------

export async function logExpense(options = {}) {
  const params = {}
  if (options.amount !== undefined) params.amount = options.amount
  if (options.category) params.category = options.category
  if (options.description) params.description = options.description
  if (options.plant_id) params.plant_id = options.plant_id
  if (options.location_id) params.location_id = options.location_id
  if (options.payment_method) params.payment_method = options.payment_method
  if (options.date) params.date = options.date
  if (options.notes) params.notes = options.notes

  const response = await apiClient.post('/expenses/log', null, { params })
  return response.data
}

export async function getExpenses(params = {}) {
  const response = await apiClient.get('/expenses', { params })
  return response.data
}

export async function getExpenseSummary(days = 365) {
  const response = await apiClient.get('/expenses/summary', { params: { days } })
  return response.data
}

export async function getBudgetOverview(monthlyBudget = null) {
  const params = monthlyBudget ? { monthly_budget: monthlyBudget } : {}
  const response = await apiClient.get('/expenses/budget', { params })
  return response.data
}

// ---------------------------------------------------------------------------
// CSV Import
// ---------------------------------------------------------------------------

export async function getImportTemplate() {
  const response = await apiClient.get('/import/template', { responseType: 'blob' })
  return new Blob([response.data])
}

export async function validateImportCSV(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/import/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function importPlantsFromCSV(file, dryRun = false) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/import/plants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { dry_run: dryRun },
  })
  return response.data
}

export default apiClient
