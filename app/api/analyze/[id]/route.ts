import { type NextRequest, NextResponse } from "next/server"
import { getJob, updateJobStatus } from "../../../../lib/job-storage"

interface AnalysisResults {
  incorrectParking: boolean
  wasteMaterial: boolean
  explanation: string
  frameDetails?: Array<{
    frameIndex: number
    timestamp: string
    detailedObservations: string
    safetyIssues: Array<{
      type: string
      severity: string
      description: string
      location: string
      impact: string
      gridCells?: string
      boundingBox?: {
        x: number
        y: number
        w: number
        h: number
      }
    }>
    pathwayClearance: string
    emergencyAccess: string
  }>
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

async function analyzeFramesWithAI(frames: any[]): Promise<AnalysisResults> {
  try {
    const { spawn } = require('child_process')
    const path = require('path')
    
    console.log(`[v0] Starting Python AI analysis for ${frames.length} frames...`)
    
    // Get frames directory and API key
    const framesDir = path.join(process.cwd(), 'public', 'temp')
    const apiKey = process.env.OPENROUTER_API_KEY
    const jobId = `job_${Date.now()}`
    
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured")
    }
    
    console.log(`[v0] Calling Python OpenRouter analysis script...`)
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'analyze_frames_openrouter.py')
    const pythonProcess = spawn('python', [scriptPath, framesDir, apiKey, jobId])
    
    let output = ""
    let errorOutput = ""
    
    pythonProcess.stdout.on("data", (data: any) => {
      output += data.toString()
    })
    
    pythonProcess.stderr.on("data", (data: any) => {
      errorOutput += data.toString()
      console.log(`[v0] Python analysis: ${data.toString().trim()}`)
    })
    
    const result = await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code: number | null) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve(result)
          } catch (parseError) {
            console.error("[v0] Failed to parse Python analysis output:", output)
            reject(new Error("Failed to parse Python analysis output"))
          }
        } else {
          console.error("[v0] Python analysis failed:", errorOutput)
          reject(new Error(`Python analysis failed: ${errorOutput}`))
        }
      })
    }) as any
    
    if (!result.success) {
      throw new Error(result.error || "Python analysis failed")
    }
    
    console.log(`[v0] Python analysis completed successfully: ${result.frames_analyzed} frames analyzed`)
    
    // Use the updated Python analysis format
    const analysis = result.analysis
    
    // The Python script now directly provides frames with bounding boxes
    const processedFrames = analysis.frames || frames.map((frame: any) => ({
      time: frame.time,
      imageUrl: frame.imageUrl,
      boundingBoxes: [],
    }))

    return {
      incorrectParking: analysis.incorrectParking || false,
      wasteMaterial: analysis.wasteMaterial || false,
      explanation: analysis.explanation || "AI analysis completed successfully.",
      frameDetails: analysis.frameDetails || [],
      frames: processedFrames,
    }
    
  } catch (error) {
    console.error("[v0] AI analysis error:", error)
    // Return basic results with extracted frames
    return {
      incorrectParking: false,
      wasteMaterial: false,
      explanation: `AI analysis failed: ${error instanceof Error ? error.message : String(error)}. Frames extracted successfully.`,
      frameDetails: [],
      frames: frames.map((frame) => ({
        time: frame.time,
        imageUrl: frame.imageUrl,
        boundingBoxes: [],
      })),
    }
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] AI Analysis API called for job:", params.id)

    const jobId = params.id
    const job = getJob(jobId)

    if (!job) {
      console.log("[v0] Job not found for analysis:", jobId)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!job.results?.frames) {
      console.log("[v0] No frames found for analysis:", jobId)
      return NextResponse.json({ error: "No frames found for analysis" }, { status: 400 })
    }

    console.log("[v0] Starting AI analysis for", job.results.frames.length, "frames")

    // Perform AI analysis on the extracted frames
    const analysisResults = await analyzeFramesWithAI(job.results.frames)

    // Update job with AI analysis results
    updateJobStatus(jobId, "completed", analysisResults)

    console.log("[v0] AI analysis completed successfully")

    return NextResponse.json({
      success: true,
      message: "AI analysis completed",
      results: analysisResults,
    })
  } catch (error) {
    console.error("[v0] AI analysis error:", error)
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 })
  }
}
