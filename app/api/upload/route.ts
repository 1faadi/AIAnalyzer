import { type NextRequest, NextResponse } from "next/server"
import { generateJobId, setJob, type JobData } from "../../../lib/job-storage"

// In-memory storage for jobs (in production, use a database)
// const jobs = new Map<
//   string,
//   {
//     id: string
//     filename: string
//     size: number
//     uploadedAt: string
//     status: string
//     videoData: ArrayBuffer
//   }
// >()

// Simple ID generator (replacing uuid dependency)
// function generateJobId(): string {
//   return Date.now().toString(36) + Math.random().toString(36).substr(2)
// }

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")

    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      console.log("[v0] No file in form data")
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith("video/")) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "File must be a video" }, { status: 400 })
    }

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 })
    }

    // Generate unique job ID
    const jobId = generateJobId()
    console.log("[v0] Generated job ID:", jobId)

    // Store video data in memory
    const videoData = await file.arrayBuffer()
    console.log("[v0] Video data loaded, size:", videoData.byteLength)

    // Create job metadata
    const jobData: JobData = {
      id: jobId,
      filename: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
      videoData,
    }

    // Store in memory
    setJob(jobId, jobData)
    console.log("[v0] Job stored successfully")

    return NextResponse.json({
      success: true,
      jobId,
      message: "Video uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)

    // Provide more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: `Upload failed: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Upload failed due to unknown error",
      },
      { status: 500 },
    )
  }
}

// Export jobs for other API routes to access
// export { jobs }
