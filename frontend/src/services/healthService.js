import { apiRequest } from './apiClient.js'

function getLiveness() {
  return apiRequest('/health/live/')
}

export { getLiveness }