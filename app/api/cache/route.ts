import { type NextRequest, NextResponse } from "next/server"
import cacheManager from "../../../lib/cache-manager"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await cacheManager.getCacheStats()
        return NextResponse.json({
          success: true,
          stats
        })

      case 'list':
        const allCached = await cacheManager.getAllCachedResults()
        return NextResponse.json({
          success: true,
          cachedResults: allCached.map(result => ({
            videoHash: result.videoHash,
            filename: result.filename,
            cachedAt: result.cachedAt,
            hasResults: !!result.results
          }))
        })

      default:
        const cacheStats = await cacheManager.getCacheStats()
        return NextResponse.json({
          success: true,
          message: "Cache API endpoint",
          stats: cacheStats
        })
    }
  } catch (error) {
    console.error("[Cache API] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Cache operation failed"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const videoHash = searchParams.get('hash')

    if (action === 'clear-all') {
      const clearedCount = await cacheManager.clearAllCache()
      return NextResponse.json({
        success: true,
        message: `Cleared ${clearedCount} cached results`
      })
    }

    if (action === 'cleanup') {
      const maxAge = parseInt(searchParams.get('maxAge') || '30')
      const clearedCount = await cacheManager.cleanupOldCache(maxAge)
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${clearedCount} old cached results`
      })
    }

    if (action === 'clear' && videoHash) {
      const cleared = await cacheManager.clearCachedResults(videoHash)
      if (cleared) {
        return NextResponse.json({
          success: true,
          message: `Cleared cached results for hash: ${videoHash}`
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Cache entry not found"
        }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action or missing parameters"
    }, { status: 400 })
  } catch (error) {
    console.error("[Cache API] Delete error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Cache delete operation failed"
    }, { status: 500 })
  }
}
