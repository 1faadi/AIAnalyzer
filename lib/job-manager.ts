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

// Global job storage that persists across Next.js API route hot reloads
declare global {
  var globalJobStorage: Map<string, JobStatus> | undefined
}

// Initialize global storage if it doesn't exist
if (!global.globalJobStorage) {
  global.globalJobStorage = new Map<string, JobStatus>()
}

// Simple job storage using Node.js global object
class JobStorage {
  private getStorage(): Map<string, JobStatus> {
    if (!global.globalJobStorage) {
      global.globalJobStorage = new Map<string, JobStatus>()
    }
    return global.globalJobStorage
  }

  setJob(id: string, job: JobStatus): void {
    const storage = this.getStorage()
    storage.set(id, job)
    console.log(`[JobStorage] Set job ${id}, total jobs: ${storage.size}`)
  }

  getJob(id: string): JobStatus | null {
    const storage = this.getStorage()
    console.log(`[JobStorage] Getting job ${id}, total jobs: ${storage.size}`)
    const job = storage.get(id) || null
    console.log(`[JobStorage] Job ${id} found: ${job ? 'yes' : 'no'}`)
    if (job) {
      console.log(`[JobStorage] Job ${id} status: ${job.status}`)
    }
    return job
  }

  deleteJob(id: string): boolean {
    const storage = this.getStorage()
    const result = storage.delete(id)
    console.log(`[JobStorage] Deleted job ${id}, success: ${result}, remaining jobs: ${storage.size}`)
    return result
  }

  getAllJobs(): JobStatus[] {
    const storage = this.getStorage()
    return Array.from(storage.values())
  }

  size(): number {
    const storage = this.getStorage()
    return storage.size
  }
}

// Create singleton instance
const jobStorage = new JobStorage()

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
    // Since we're using static cached data, bypass actual upload
    // Create a mock job directly
    const jobId = createJob(file.name)
    
    console.log('Created mock job for demo:', jobId)
    
    // Immediately update to completed with static results
    const staticResults = {
      incorrectParking: true,
      wasteMaterial: true,
      explanation: "Comprehensive analysis of 12 unique frames using combined computer vision and AI grid-based analysis. Multiple safety violations detected including vehicle parking issues and debris accumulation that could obstruct emergency vehicle access.",
      frames: [
        { "time": "00:00", "imageUrl": "/warehouse-frames/frame_0_00m00s.jpg", "boundingBoxes": [] },
        { "time": "00:01", "imageUrl": "/warehouse-frames/frame_12_00m14s.jpg", "boundingBoxes": [] },
        { "time": "00:02", "imageUrl": "/warehouse-frames/frame_14_00m16s.jpg", "boundingBoxes": [] },
        { "time": "00:03", "imageUrl": "/warehouse-frames/frame_16_00m21s.jpg", "boundingBoxes": [] },
        { "time": "00:04", "imageUrl": "/warehouse-frames/frame_1_00m06s.jpg", "boundingBoxes": [] },
        { "time": "00:05", "imageUrl": "/warehouse-frames/frame_23_00m46s.jpg", "boundingBoxes": [] },
        { "time": "00:06", "imageUrl": "/warehouse-frames/frame_30_01m00s.jpg", "boundingBoxes": [] },
        { "time": "00:07", "imageUrl": "/warehouse-frames/frame_39_00m41s.jpg", "boundingBoxes": [] },
        { "time": "00:08", "imageUrl": "/warehouse-frames/frame_40_00m42s.jpg", "boundingBoxes": [] },
        { "time": "00:09", "imageUrl": "/warehouse-frames/frame_50_00m52s.jpg", "boundingBoxes": [] },
        { "time": "00:10", "imageUrl": "/warehouse-frames/frame_61_01m11s.jpg", "boundingBoxes": [] },
        { "time": "00:11", "imageUrl": "/warehouse-frames/frame_6_00m34s.jpg", "boundingBoxes": [] }
      ],
      frameDetails: [
        {
          "frameIndex": 0, "timestamp": "00:00",
          "detailedObservations": "The image shows two large warehouse buildings with metal roofs. There are trees and vegetation visible along the bottom edge of the image. The area between the buildings appears clear, with no visible obstructions.",
          "safetyIssues": [],
          "pathwayClearance": "The pathway between the buildings is clear, with no visible obstructions.",
          "emergencyAccess": "Emergency vehicle access appears unobstructed."
        },
        {
          "frameIndex": 1, "timestamp": "00:01",
          "detailedObservations": "This frame shows a continuation of the warehouse rooftops. There is a narrow pathway between the buildings, which appears clear. Trees are visible along the pathway.",
          "safetyIssues": [],
          "pathwayClearance": "The pathway is narrow but clear, allowing for emergency access.",
          "emergencyAccess": "Emergency vehicle access is possible through the clear pathway."
        },
        {
          "frameIndex": 2, "timestamp": "00:02",
          "detailedObservations": "The image shows the end of the warehouse buildings with a clear pathway between them. There is a vehicle visible at the bottom right corner.",
          "safetyIssues": [{ "type": "vehicle", "severity": "low", "description": "A truck is visible at the bottom right corner, which could obstruct pathways if not parked properly.", "location": "bottom right corner", "impact": "Could hinder emergency vehicle access if parked incorrectly." }],
          "pathwayClearance": "The pathway is clear, but the truck's position should be monitored.",
          "emergencyAccess": "Emergency access is currently unobstructed, but the truck's position should be checked."
        },
        {
          "frameIndex": 4, "timestamp": "00:04",
          "detailedObservations": "A narrow alley between two warehouse buildings with visible debris and vegetation.",
          "safetyIssues": [{ "type": "debris", "severity": "high", "description": "Accumulation of debris in the alleyway.", "location": "center", "impact": "Could hinder emergency personnel movement." }],
          "pathwayClearance": "Pathway is obstructed by debris.",
          "emergencyAccess": "Severely limited due to debris."
        }
      ],
      mitigationStrategies: [
        {
          "type": "vehicle_parking_violation", "severity": "critical", "urgency": "immediate",
          "description": "Multiple vehicles detected blocking emergency access routes",
          "timeline": "Immediate action required within 30 minutes",
          "responsible_party": "Security/Facilities Management"
        },
        {
          "type": "waste_debris_cleanup", "severity": "high", "urgency": "immediate",
          "description": "Significant debris and waste material obstructing pathways",
          "timeline": "Complete cleaning within 2 hours",
          "responsible_party": "Cleaning/Maintenance Staff"
        }
      ]
    }
    
    // Update job to completed immediately
    updateJobStatus(jobId, "completed", staticResults)
    
    return jobId
  } catch (error) {
    console.error('Job creation error:', error)
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
      
      // If job is pending, start processing
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