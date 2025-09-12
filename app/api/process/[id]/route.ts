import { type NextRequest, NextResponse } from "next/server"
import { getJob, updateJobStatus } from "../../../../lib/job-manager"

interface ProcessingResults {
  incorrectParking: boolean
  wasteMaterial: boolean
  explanation: string
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
  frameDetails?: any[]
  mitigationStrategies?: any[]
}

async function processVideoWithExternalService(videoUrl: string, jobId: string): Promise<ProcessingResults> {
  try {
    console.log("[v0] Starting external video processing...")
    console.log("[v0] Video URL:", videoUrl)
    
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "https://warehouse-safety-python.onrender.com"
    const webhookUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/webhook/${jobId}`
    
    console.log("[v0] Calling Python service at:", pythonServiceUrl)
    
    const response = await fetch(`${pythonServiceUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: videoUrl,
        jobId: jobId,
        webhookUrl: webhookUrl
      }),
      // Render free tier allows up to 15 minutes
      signal: AbortSignal.timeout(900000) // 15 minutes
    })
    
    if (!response.ok) {
      throw new Error(`Python service failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    console.log("[v0] External processing completed successfully")
    
    return result.results || {
      incorrectParking: false,
      wasteMaterial: false,
      explanation: "External processing completed",
      frames: [],
      frameDetails: [],
      mitigationStrategies: []
    }
    
  } catch (error) {
    console.error("[v0] External processing error:", error)
    throw error
  }
}

// Helper function to upload video to cloud storage
async function uploadVideoToCloud(videoData: Buffer, filename: string, jobId: string): Promise<string> {
  try {
    // For now, we'll use a simple approach - in production, use proper cloud storage
    const tempFilename = `${jobId}_${filename}`
    const videoUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/temp/${tempFilename}`
    
    // Note: In production, upload to AWS S3, Cloudinary, or similar
    // For demo, we'll pass the local URL (this won't work in production)
    console.log("[v0] Video URL for processing:", videoUrl)
    
    return videoUrl
  } catch (error) {
    console.error("[v0] Video upload failed:", error)
    throw error
  }
}

// Helper function to create mock results when AI analysis fails
function createMockResults(frames: any[]): ProcessingResults {
  return {
    incorrectParking: false,
    wasteMaterial: false,
    explanation: `Frame extraction completed. ${frames.length} frames ready for analysis.`,
    frames: frames.map(frame => ({
      time: frame.time || "00:00",
      imageUrl: frame.imageUrl || `/temp/${frame.filename}`,
      boundingBoxes: []
    })),
    frameDetails: [],
    mitigationStrategies: []
  }
}


export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Processing API called for job:", params.id)

    const jobId = params.id
    const job = getJob(jobId)

    if (!job) {
      console.log("[v0] Job not found for processing:", jobId)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    updateJobStatus(jobId, "processing")
    console.log("[v0] Job status updated to processing")

    try {
      // Get video URL for external processing
      const videoUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/temp/${jobId}_${job.filename.replace(/[^a-zA-Z0-9.]/g, '_')}`
      console.log("[v0] Processing video via external service:", videoUrl)

      const results = await processVideoWithExternalService(videoUrl, jobId)

      const formattedResults = {
        incorrectParking: results.incorrectParking,
        wasteMaterial: results.wasteMaterial,
        explanation: results.explanation,
        frames: results.frames,
        frameDetails: results.frameDetails || [],
        mitigationStrategies: results.mitigationStrategies || []
      }

      // Update job with results
      updateJobStatus(jobId, "completed", formattedResults)

      console.log("[v0] Processing completed successfully")

      return NextResponse.json({
        success: true,
        message: "Processing completed",
        results: formattedResults,
      })
    } catch (analysisError) {
      console.error("[v0] Analysis error:", analysisError)
      updateJobStatus(jobId, "failed")
      return NextResponse.json({ error: `Analysis failed: ${analysisError instanceof Error ? analysisError.message : String(analysisError)}` }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Processing error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
