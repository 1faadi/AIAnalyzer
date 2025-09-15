"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Database, Trash2, RefreshCw, Clock, HardDrive, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CacheStats {
  totalEntries: number
  totalSizeBytes: number
  oldestEntry?: string
  newestEntry?: string
}

interface CachedResult {
  videoHash: string
  filename: string
  cachedAt: string
  hasResults: boolean
}

export default function CachePage() {
  const router = useRouter()
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [cachedResults, setCachedResults] = useState<CachedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCacheData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats and cached results
      const [statsResponse, listResponse] = await Promise.all([
        fetch('/api/cache?action=stats'),
        fetch('/api/cache?action=list')
      ])

      if (!statsResponse.ok || !listResponse.ok) {
        throw new Error('Failed to fetch cache data')
      }

      const statsData = await statsResponse.json()
      const listData = await listResponse.json()

      if (statsData.success) {
        setStats(statsData.stats)
      }

      if (listData.success) {
        setCachedResults(listData.cachedResults)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cache data')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached results?')) {
      return
    }

    try {
      const response = await fetch('/api/cache?action=clear-all', {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        alert(result.message)
        fetchCacheData()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      alert(`Error clearing cache: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const cleanupOldCache = async () => {
    if (!confirm('Are you sure you want to cleanup cache entries older than 30 days?')) {
      return
    }

    try {
      const response = await fetch('/api/cache?action=cleanup&maxAge=30', {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        alert(result.message)
        fetchCacheData()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      alert(`Error cleaning up cache: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const clearSpecificCache = async (videoHash: string) => {
    if (!confirm(`Are you sure you want to clear cache for hash: ${videoHash}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/cache?action=clear&hash=${videoHash}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        alert(result.message)
        fetchCacheData()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      alert(`Error clearing cache: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    fetchCacheData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading cache data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCacheData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Cache Management</h1>
                <p className="text-sm text-muted-foreground">View and manage cached analysis results</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="hidden sm:flex"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Cache Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
                <p className="text-xs text-muted-foreground">Cached analysis results</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(stats?.totalSizeBytes || 0)}</div>
                <p className="text-xs text-muted-foreground">Storage used</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oldest Entry</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {stats?.oldestEntry ? formatDate(stats.oldestEntry) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">First cached result</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Newest Entry</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {stats?.newestEntry ? formatDate(stats.newestEntry) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Latest cached result</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Cache Actions</CardTitle>
              <CardDescription>Manage your cached analysis results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={fetchCacheData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={cleanupOldCache} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cleanup Old (30+ days)
                </Button>
                <Button onClick={clearCache} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cached Results List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cached Results
                <Badge variant="outline">{cachedResults.length} entries</Badge>
              </CardTitle>
              <CardDescription>
                Individual cached analysis results stored on the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cachedResults.length > 0 ? (
                <div className="space-y-4">
                  {cachedResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-foreground">{result.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            Hash: <code className="bg-muted px-1 rounded text-xs">{result.videoHash}</code>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cached: {formatDate(result.cachedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.hasResults ? "default" : "secondary"}>
                            {result.hasResults ? "Has Results" : "No Results"}
                          </Badge>
                          <Button
                            onClick={() => clearSpecificCache(result.videoHash)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cached results found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
