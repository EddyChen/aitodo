class ApiClient {
  constructor() {
    this.baseURL = '/api'
    this.authToken = null
  }

  setAuthToken(token) {
    this.authToken = token
  }

  async request(method, url, data = null, options = {}) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`
    }

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data)
    }

    // Handle GET request parameters
    if (data && method === 'GET') {
      const params = new URLSearchParams()
      Object.entries(data.params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value)
        }
      })
      url += params.toString() ? `?${params.toString()}` : ''
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, config)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.authToken = null
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          throw new Error('登录已过期，请重新登录')
        }
        
        const errorData = await response.json().catch(() => ({ error: '网络错误' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  async get(url, options = {}) {
    return this.request('GET', url, options, options)
  }

  async post(url, data, options = {}) {
    return this.request('POST', url, data, options)
  }

  async put(url, data, options = {}) {
    return this.request('PUT', url, data, options)
  }

  async delete(url, options = {}) {
    return this.request('DELETE', url, null, options)
  }
}

export const api = new ApiClient() 