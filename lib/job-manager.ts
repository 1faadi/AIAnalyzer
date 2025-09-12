export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filename: string
  uploadedAt: string
  results?: {
    incorrectParking: boolean
    wasteMaterial: boolean
    explanation: string
    frameDetails: any[]
    frames: Array<{
      time: string
      imageUrl: string
      boundingBoxes: Array<{
        label: string
        x: number
        y: number
        w: number
        h: number
        severity?: string
        reason?: string
        immediate_action?: boolean
        mitigation_summary?: string
        confidence?: number
        source?: string
      }>
    }>
    mitigationStrategies?: any[]
  }
}

// Singleton pattern for job storage to ensure sharing across API routes
class JobStorage {
  private static instance: JobStorage
  private jobs = new Map<string, JobStatus>()

  static getInstance(): JobStorage {
    if (!JobStorage.instance) {
      JobStorage.instance = new JobStorage()
    }
    return JobStorage.instance
  }

  setJob(id: string, job: JobStatus): void {
    this.jobs.set(id, job)
    console.log(`[JobStorage] Set job ${id}, total jobs: ${this.jobs.size}`)
  }

  getJob(id: string): JobStatus | null {
    console.log(`[JobStorage] Getting job ${id}, total jobs: ${this.jobs.size}`)
    const job = this.jobs.get(id) || null
    console.log(`[JobStorage] Job ${id} found: ${job ? 'yes' : 'no'}`)
    if (job) {
      console.log(`[JobStorage] Job ${id} status: ${job.status}`)
    }
    return job
  }

  deleteJob(id: string): boolean {
    const result = this.jobs.delete(id)
    console.log(`[JobStorage] Deleted job ${id}, success: ${result}, remaining jobs: ${this.jobs.size}`)
    return result
  }

  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values())
  }

  size(): number {
    return this.jobs.size
  }
}

// Get singleton instance
const jobStorage = JobStorage.getInstance()

export function createJob(filename: string): string {
  const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const job: JobStatus = {
    id,
    status: 'pending',
    filename,
    uploadedAt: new Date().toISOString()
  }
  jobStorage.setJob(id, job)
  return id
}

export function getJob(id: string): JobStatus | null {
  return jobStorage.getJob(id)
}

export function updateJobStatus(
  id: string, 
  status: JobStatus['status'], 
  results?: JobStatus['results']
): void {
  const job = jobStorage.getJob(id)
  if (job) {
    job.status = status
    if (results) {
      job.results = results
    }
    jobStorage.setJob(id, job)
    console.log(`[job-manager] Updated job ${id} status to ${status}`)
  } else {
    console.error(`[job-manager] Cannot update job ${id} - not found`)
  }
}

export async function getJobStatus(id: string): Promise<JobStatus> {
  const job = getJob(id)
  if (!job) {
    throw new Error('Job not found')
  }
  return job
}

export function getAllJobs(): JobStatus[] {
  return jobStorage.getAllJobs()
}

export function deleteJob(id: string): boolean {
  return jobStorage.deleteJob(id)
}

export async function uploadAndStartProcessing(file: File): Promise<string> {
  try {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('video', file)
    
    // Upload file via upload API
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      return result.jobId
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

export async function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  interval: number = 2000
): Promise<void> {
  const poll = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`)
      }
      
      const job = await response.json()
      onUpdate(job)
      
      // If job is still pending, start processing
      if (job.status === 'pending') {
        console.log('Starting processing for job:', jobId)
        fetch(`/api/process/${jobId}`, { method: 'POST' })
          .catch(error => console.error('Failed to start processing:', error))
      }
      
      // Continue polling if job is not finished
      if (job.status === 'pending' || job.status === 'processing') {
        setTimeout(poll, interval)
      }
    } catch (error) {
      console.error('Polling error:', error)
      throw error
    }
  }
  
  await poll()
}