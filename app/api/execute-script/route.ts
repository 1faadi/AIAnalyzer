import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { script, args = [] } = await request.json()

    const scriptPath = path.join(process.cwd(), "scripts", script)

    return new Promise((resolve) => {
      // Try different Python commands
      const pythonCommands = ["python3", "python", "py"]
      let pythonProcess
      
      for (const pythonCmd of pythonCommands) {
        try {
          pythonProcess = spawn(pythonCmd, [scriptPath, ...args])
          break
        } catch (error) {
          continue
        }
      }
      
      if (!pythonProcess) {
        resolve(NextResponse.json({ error: "Python not found" }, { status: 500 }))
        return
      }

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve(NextResponse.json(result))
          } catch (parseError) {
            resolve(NextResponse.json({ error: "Failed to parse script output" }, { status: 500 }))
          }
        } else {
          resolve(
            NextResponse.json(
              {
                error: `Script execution failed: ${errorOutput}`,
              },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: `Script execution error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
