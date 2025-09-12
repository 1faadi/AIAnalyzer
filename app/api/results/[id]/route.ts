import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

interface JobMetadata {
  id: string
  filename: string
  size: number
  uploadedAt: string
  status: string
  videoPath: string
  results?: {
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
      }>
    }>
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const jobDir = path.join(process.cwd(), "uploads", jobId)
    const metadataPath = path.join(jobDir, "metadata.json")

    if (!existsSync(metadataPath)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Read job metadata
    const metadataContent = await readFile(metadataPath, "utf-8")
    const metadata: JobMetadata = JSON.parse(metadataContent)

    return NextResponse.json({
      jobId: metadata.id,
      status: metadata.status,
      filename: metadata.filename,
      uploadedAt: metadata.uploadedAt,
      results: metadata.results || null,
    })
  } catch (error) {
    console.error("Results error:", error)
    return NextResponse.json({ error: "Failed to get results" }, { status: 500 })
  }
}
