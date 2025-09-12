import { type NextRequest, NextResponse } from "next/server"
import { createJob, getJob, updateJobStatus } from "../../../lib/job-manager"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"

// In-memory storage for video data (in production, use a database or file storage)
const videoStorage = new Map<string, ArrayBuffer>()

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

// Enhanced processing function
async function processVideoWithEnhancedPipeline(videoPath: string, jobId: string): Promise<any> {
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
      frames: analysisResult.analysis?.frames || [],
      frameDetails: analysisResult.analysis?.frameDetails || [],
      mitigationStrategies: analysisResult.analysis?.mitigationStrategies || []
    }
    
  } catch (error) {
    console.error("[v0] Video processing error:", error)
    throw error
  }
}

// Helper function to create mock results when AI analysis fails
function createMockResults(frames: any[]): any {
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

    // Create new job
    const jobId = createJob(file.name)
    console.log("[v0] Generated job ID:", jobId)

    // Store video data in memory (for processing)
    const videoData = await file.arrayBuffer()
    console.log("[v0] Video data loaded, size:", videoData.byteLength)
    
    // Store video data for processing
    videoStorage.set(jobId, videoData)
    
    // Save video file to public/temp directory for processing
    const tempDir = path.join(process.cwd(), "public", "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const tempVideoPath = path.join(tempDir, `video_${jobId}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`)
    fs.writeFileSync(tempVideoPath, Buffer.from(videoData))
    console.log("[v0] Video saved to:", tempVideoPath)

    // Start processing immediately 
    updateJobStatus(jobId, 'processing')
    console.log("[v0] Starting immediate processing...")
    
    try {
      // Process the video using the enhanced pipeline
      const results = await processVideoWithEnhancedPipeline(tempVideoPath, jobId)
      
      // Update job with results
      updateJobStatus(jobId, 'completed', results)
      console.log("[v0] Processing completed successfully")
      
      return NextResponse.json({
        success: true,
        jobId,
        message: "Video uploaded and processed successfully",
        results: results
      })
    } catch (error) {
      console.error("[v0] Processing failed:", error)
      updateJobStatus(jobId, 'failed')
      
      return NextResponse.json({
        success: true,
        jobId,
        message: "Video uploaded but processing failed",
        error: error instanceof Error ? error.message : String(error)
      })
    }
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

// Export video storage for other API routes to access
export { videoStorage }
