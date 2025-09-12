import { NextRequest, NextResponse } from "next/server"
import { getJob, updateJobStatus } from "../../../../lib/job-manager"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const job = getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    updateJobStatus(jobId, "processing")

    // Send to external Python service (Railway/Heroku)
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "https://your-python-service.railway.app"
    
    const response = await fetch(`${pythonServiceUrl}/api/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PYTHON_SERVICE_TOKEN}`
      },
      body: JSON.stringify({
        jobId,
        videoUrl: job.videoUrl, // Upload video to cloud storage first
        webhookUrl: `${process.env.VERCEL_URL}/api/webhook/${jobId}`
      })
    })

    if (!response.ok) {
      throw new Error("External processing service failed")
    }

    return NextResponse.json({
      success: true,
      message: "Processing started on external service"
    })

  } catch (error) {
    console.error("External processing error:", error)
    updateJobStatus(params.id, "failed")
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
