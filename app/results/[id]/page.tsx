"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Shield, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type JobStatus } from "@/lib/job-manager"
import { AnnotatedImage } from "@/components/annotated-image"

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Use demo API for demo-job, otherwise use regular job API
        const apiUrl = jobId === 'demo-job' ? '/api/demo-results' : `/api/jobs/${jobId}`
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch job: ${response.statusText}`)
        }
        
        const status = await response.json()
        setJobStatus(status)
        
        // If job is still processing, redirect to processing page
        if (status.status === 'processing' || status.status === 'pending') {
          router.push(`/processing/${jobId}`)
          return
        }
        
        // If frames are extracted but no AI analysis done yet, redirect to frames page
        if (status.results?.frames && 
            status.results.explanation.includes("Ready for AI analysis")) {
          router.push(`/frames/${jobId}`)
          return
        }
        
      } catch (err) {
        setError("Failed to load results")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchResults()
    }
  }, [jobId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !jobStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Results not found"}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const results = jobStatus.results

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Safety Analysis Results</h1>
                <p className="text-sm text-muted-foreground">Job ID: {jobId}</p>
              </div>
            </div>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                File: {jobStatus.filename} • Uploaded: {new Date(jobStatus.uploadedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>

          {results ? (
            <>
              {/* Priority Actions Summary */}
              {(() => {
                const hasSafetyIssues = results.frameDetails?.some(frame => 
                  frame.safetyIssues && frame.safetyIssues.length > 0
                ) || false

                return hasSafetyIssues ? (
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-5 w-5" />
                        Safety Issues Detected
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        Review the detailed analysis below for specific safety concerns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-red-100 rounded-lg">
                          <div className="text-2xl font-bold text-red-800">
                            {results.frameDetails?.reduce((acc, frame) => 
                              acc + (frame.safetyIssues?.filter(issue => issue.severity === 'critical').length || 0), 0
                            ) || 0}
                          </div>
                          <div className="text-sm text-red-600">Critical Issues</div>
                        </div>
                        <div className="text-center p-3 bg-blue-100 rounded-lg">
                          <div className="text-2xl font-bold text-blue-800">
                            {results.frameDetails?.reduce((acc, frame) => 
                              acc + (frame.safetyIssues?.length || 0), 0
                            ) || 0}
                          </div>
                          <div className="text-sm text-blue-600">Total Issues</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null
              })()}

              {/* Safety Verdicts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5" />
                      Incorrect Parking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {results.incorrectParking ? (
                        <>
                          <Badge variant="destructive" className="text-base px-4 py-2">
                            <XCircle className="h-4 w-4 mr-2" />
                            VIOLATION DETECTED
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-base px-4 py-2 bg-chart-5 text-white">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            NO VIOLATIONS
                          </Badge>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5" />
                      Waste Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {results.wasteMaterial ? (
                        <>
                          <Badge variant="destructive" className="text-base px-4 py-2">
                            <XCircle className="h-4 w-4 mr-2" />
                            VIOLATION DETECTED
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-base px-4 py-2 bg-chart-5 text-white">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            NO VIOLATIONS
                          </Badge>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed text-pretty">{results.explanation}</p>
                </CardContent>
              </Card>

              {/* Detailed Frame Analysis */}
              {results.frameDetails && results.frameDetails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Detailed Frame-by-Frame Safety Analysis
                      <Badge variant="outline">{results.frameDetails.length} frame(s)</Badge>
                    </CardTitle>
                    <CardDescription>Comprehensive safety assessment for each analyzed frame</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {results.frameDetails.map((frameDetail: any, index: number) => (
                        <div key={index} className="border rounded-lg p-6 space-y-6">
                          {/* Frame Header */}
                          <div className="flex items-center justify-between border-b pb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-card-foreground">
                                Frame {frameDetail.frameIndex + 1}
                              </h3>
                              <p className="text-sm text-muted-foreground">Timestamp: {frameDetail.timestamp}</p>
                            </div>
                            {frameDetail.safetyIssues && frameDetail.safetyIssues.length > 0 && (
                              <Badge variant="destructive">
                                {frameDetail.safetyIssues.length} Issue(s) Found
                              </Badge>
                            )}
                          </div>

                          {/* Frame Image with Annotations */}
                          {results.frames && results.frames[index] && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-card-foreground">Frame Analysis</h4>
                              </div>
                              <AnnotatedImage
                                src={results.frames[index].imageUrl}
                                alt={`Frame at ${frameDetail.timestamp}`}
                              />
                            </div>
                          )}

                          {/* Detailed Observations */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-card-foreground mb-2">Detailed Observations</h4>
                              <p className="text-foreground leading-relaxed bg-muted p-4 rounded-lg">
                                {frameDetail.detailedObservations}
                              </p>
                            </div>

                            {/* Safety Issues */}
                            {frameDetail.safetyIssues && frameDetail.safetyIssues.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-card-foreground mb-3">Safety Issues Identified</h4>
                                <div className="space-y-3">
                                  {frameDetail.safetyIssues.map((issue: any, issueIndex: number) => (
                                    <div key={issueIndex} className="border-l-4 border-destructive bg-destructive/5 p-4 rounded-r-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={
                                          issue.severity === 'critical' ? 'destructive' :
                                          issue.severity === 'high' ? 'destructive' :
                                          issue.severity === 'medium' ? 'default' : 'secondary'
                                        }>
                                          {issue.severity?.toUpperCase()} - {issue.type?.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="font-medium text-foreground mb-1">{issue.description}</p>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        <strong>Location:</strong> {issue.location}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Emergency Impact:</strong> {issue.impact}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pathway & Emergency Access */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-muted p-4 rounded-lg">
                                <h5 className="font-semibold text-card-foreground mb-2">Pathway Clearance</h5>
                                <p className="text-sm text-foreground">{frameDetail.pathwayClearance}</p>
                              </div>
                              <div className="bg-muted p-4 rounded-lg">
                                <h5 className="font-semibold text-card-foreground mb-2">Emergency Access</h5>
                                <p className="text-sm text-foreground">{frameDetail.emergencyAccess}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Frame Images (if no detailed analysis available) */}
              {(!results.frameDetails || results.frameDetails.length === 0) && results.frames && results.frames.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Analysis Frames
                      <Badge variant="outline">{results.frames.length} frame(s)</Badge>
                    </CardTitle>
                    <CardDescription>Images from the safety analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {results.frames.map((frame, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-card-foreground">Timestamp: {frame.time}</h4>
                          </div>
                          <AnnotatedImage
                            src={frame.imageUrl}
                            alt={`Frame at ${frame.time}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
                      Analyze Another Video
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No analysis results available for this job.</p>
                <Button onClick={() => router.push("/")} className="mt-4" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
