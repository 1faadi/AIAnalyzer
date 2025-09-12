import { type NextRequest, NextResponse } from "next/server"
import { getJob, updateJobStatus } from "../../../../lib/job-manager"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

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

async function processVideoWithAI(videoPath: string, jobId: string): Promise<ProcessingResults> {
  try {
    console.log("[v0] Starting enhanced video processing pipeline...")
    console.log("[v0] Video path:", videoPath)
    
    // Step 1: Extract frames using the enhanced OpenCV script
    console.log("[v0] Step 1: Extracting frames with similarity filtering...")
    const framesDir = path.join(process.cwd(), "public", "temp")
    const extractResult = await runPythonScript("extract_frames_opencv.py", [videoPath, framesDir, "0.80"])
    
    if (!extractResult.success) {
      throw new Error(`Frame extraction failed: ${extractResult.error}`)
    }
    
    console.log("[v0] Frames extracted successfully:", extractResult.total_frames_extracted)
    
    // Step 2: Run AI analysis using the enhanced script
    console.log("[v0] Step 2: Running enhanced AI analysis with YOLO...")
    const apiKey = process.env.OPENROUTER_API_KEY || ""
    if (!apiKey) {
      console.log("[v0] Warning: No OpenRouter API key found, using mock analysis")
      return createMockResults(extractResult.frames || [])
    }
    
    const analysisResult = await runPythonScript("analyze_frames_openrouter.py", [framesDir, apiKey, jobId])
    
    if (!analysisResult.success) {
      console.log("[v0] AI analysis failed, using extracted frames only:", analysisResult.error)
      return createMockResults(extractResult.frames || [])
    }
    
    console.log("[v0] Enhanced analysis completed successfully")
    
    // Return the enhanced results
    return {
      incorrectParking: analysisResult.analysis?.incorrectParking || false,
      wasteMaterial: analysisResult.analysis?.wasteMaterial || false,
      explanation: analysisResult.analysis?.explanation || "Analysis completed successfully",
      frames: analysisResult.analysis?.frames || []
    }
    
  } catch (error) {
    console.error("[v0] Video processing error:", error)
    throw error
  }
}

// Helper function to run Python scripts
async function runPythonScript(scriptName: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", scriptName)
    const pythonProcess = spawn("python", [scriptPath, ...args])
    
    let output = ""
    let errorOutput = ""
    
    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })
    
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`[v0] Python script failed with code ${code}:`, errorOutput)
        reject(new Error(`Python script failed: ${errorOutput}`))
        return
      }
      
      try {
        const result = JSON.parse(output)
        resolve(result)
      } catch (parseError) {
        console.error(`[v0] Failed to parse Python output:`, output)
        reject(new Error(`Failed to parse Python script output: ${parseError}`))
      }
    })
    
    pythonProcess.on("error", (error) => {
      console.error(`[v0] Python process error:`, error)
      reject(error)
    })
  })
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
    }))
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
      // Find the video file in the temp directory
      const tempDir = path.join(process.cwd(), "public", "temp")
      const videoFiles = fs.readdirSync(tempDir).filter(f => f.includes(jobId) && f.includes(job.filename.replace(/[^a-zA-Z0-9.]/g, '_')))
      
      if (videoFiles.length === 0) {
        throw new Error("Video file not found in temp directory")
      }
      
      const videoPath = path.join(tempDir, videoFiles[0])
      console.log("[v0] Found video file:", videoPath)

      const results = await processVideoWithAI(videoPath, jobId)

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
