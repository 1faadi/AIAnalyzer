import { JobStatus } from './job-manager'

// Simple file-based storage for jobs
// In production, use a proper database like PostgreSQL, MongoDB, etc.

const STORAGE_KEY = 'warehouse_safety_jobs'

export function saveJob(job: JobStatus): void {
  if (typeof window === 'undefined') {
    // Server-side: use in-memory storage or database
    return
  }
  
  try {
    const existingJobs = getStoredJobs()
    const updatedJobs = existingJobs.filter(j => j.id !== job.id)
    updatedJobs.push(job)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs))
  } catch (error) {
    console.warn('Failed to save job to localStorage:', error)
  }
}

export function getStoredJobs(): JobStatus[] {
  if (typeof window === 'undefined') {
    return []
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to load jobs from localStorage:', error)
    return []
  }
}

export function getStoredJob(id: string): JobStatus | null {
  const jobs = getStoredJobs()
  return jobs.find(job => job.id === id) || null
}

export function removeStoredJob(id: string): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    const jobs = getStoredJobs()
    const filteredJobs = jobs.filter(job => job.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredJobs))
  } catch (error) {
    console.warn('Failed to remove job from localStorage:', error)
  }
}

export function clearAllJobs(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear jobs from localStorage:', error)
  }
}