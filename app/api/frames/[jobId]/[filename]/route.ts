import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { jobId: string; filename: string } }) {
  try {
    const { jobId, filename } = params
    const framePath = path.join(process.cwd(), "uploads", jobId, "frames", filename)

    if (!existsSync(framePath)) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 })
    }

    const imageBuffer = await readFile(framePath)

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Frame serving error:", error)
    return NextResponse.json({ error: "Failed to serve frame" }, { status: 500 })
  }
}
