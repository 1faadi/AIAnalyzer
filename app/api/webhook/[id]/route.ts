import { NextRequest, NextResponse } from "next/server"
import { updateJobStatus } from "../../../../lib/job-manager"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const data = await request.json()
    
    console.log(`[v0] Webhook received for job ${jobId}`)
    
    // Verify it's from our Python service (basic auth check)
    const authHeader = request.headers.get("authorization")
    const expectedAuth = process.env.PYTHON_SERVICE_TOKEN
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      console.log("[v0] Webhook unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Update job with results from Python service
    const results = data.results
    updateJobStatus(jobId, "completed", results)
    
    console.log(`[v0] Job ${jobId} completed via webhook`)
    
    return NextResponse.json({ 
      success: true,
      message: "Webhook processed successfully" 
    })
    
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed" 
    }, { status: 500 })
  }
}