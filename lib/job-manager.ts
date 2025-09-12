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

// In-memory storage for demo purposes
// In production, use a proper database
const jobs = new Map<string, JobStatus>()

export function createJob(filename: string): string {
  const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const job: JobStatus = {
    id,
    status: 'pending',
    filename,
    uploadedAt: new Date().toISOString()
  }
  jobs.set(id, job)
  return id
}

export function getJob(id: string): JobStatus | null {
  return jobs.get(id) || null
}

export function updateJobStatus(
  id: string, 
  status: JobStatus['status'], 
  results?: JobStatus['results']
): void {
  const job = jobs.get(id)
  if (job) {
    job.status = status
    if (results) {
      job.results = results
    }
    jobs.set(id, job)
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
  return Array.from(jobs.values())
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id)
}