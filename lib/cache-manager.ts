import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface CachedResult {
  videoHash: string
  filename: string
  cachedAt: string
  results: {
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
}

export class CacheManager {
  private cacheDir: string

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache', 'analysis-results')
    this.ensureCacheDir()
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
      console.log(`[CacheManager] Created cache directory: ${this.cacheDir}`)
    }
  }

  /**
   * Generate a hash for a video file to use as cache key
   */
  async generateVideoHash(videoPath: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(videoPath)
      const hash = crypto.createHash('sha256')
      hash.update(fileBuffer)
      return hash.digest('hex')
    } catch (error) {
      console.error('[CacheManager] Error generating video hash:', error)
      throw new Error('Failed to generate video hash')
    }
  }

  /**
   * Generate a hash for video file content and metadata for cache key
   */
  async generateVideoHashWithMetadata(videoPath: string): Promise<string> {
    try {
      const stats = fs.statSync(videoPath)
      const fileBuffer = fs.readFileSync(videoPath)
      
      // Combine file content hash with size and modification time for more unique identification
      const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
      const metadataString = `${stats.size}-${stats.mtime.getTime()}-${path.basename(videoPath)}`
      const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex')
      
      return `${contentHash.substring(0, 32)}-${metadataHash.substring(0, 16)}`
    } catch (error) {
      console.error('[CacheManager] Error generating video hash with metadata:', error)
      throw new Error('Failed to generate video hash with metadata')
    }
  }

  /**
   * Check if cached results exist for a video hash
   */
  async hasCachedResults(videoHash: string): Promise<boolean> {
    const cacheFilePath = path.join(this.cacheDir, `${videoHash}.json`)
    return fs.existsSync(cacheFilePath)
  }

  /**
   * Retrieve cached results for a video hash
   */
  async getCachedResults(videoHash: string): Promise<CachedResult | null> {
    try {
      const cacheFilePath = path.join(this.cacheDir, `${videoHash}.json`)
      
      if (!fs.existsSync(cacheFilePath)) {
        console.log(`[CacheManager] No cached results found for hash: ${videoHash}`)
        return null
      }

      const cachedData = fs.readFileSync(cacheFilePath, 'utf8')
      const parsedData: CachedResult = JSON.parse(cachedData)
      
      console.log(`[CacheManager] Retrieved cached results for hash: ${videoHash}, cached at: ${parsedData.cachedAt}`)
      return parsedData
    } catch (error) {
      console.error('[CacheManager] Error retrieving cached results:', error)
      return null
    }
  }

  /**
   * Save analysis results to cache
   */
  async saveCachedResults(
    videoHash: string, 
    filename: string, 
    results: CachedResult['results']
  ): Promise<void> {
    try {
      const cacheData: CachedResult = {
        videoHash,
        filename,
        cachedAt: new Date().toISOString(),
        results
      }

      const cacheFilePath = path.join(this.cacheDir, `${videoHash}.json`)
      fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf8')
      
      console.log(`[CacheManager] Saved analysis results to cache: ${cacheFilePath}`)
    } catch (error) {
      console.error('[CacheManager] Error saving cached results:', error)
      throw new Error('Failed to save cached results')
    }
  }

  /**
   * Get all cached results (for management/cleanup)
   */
  async getAllCachedResults(): Promise<CachedResult[]> {
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir)
        .filter(file => file.endsWith('.json'))
      
      const cachedResults: CachedResult[] = []
      
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(this.cacheDir, file)
          const data = fs.readFileSync(filePath, 'utf8')
          const cachedResult: CachedResult = JSON.parse(data)
          cachedResults.push(cachedResult)
        } catch (error) {
          console.error(`[CacheManager] Error reading cache file ${file}:`, error)
        }
      }
      
      return cachedResults.sort((a, b) => 
        new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
      )
    } catch (error) {
      console.error('[CacheManager] Error getting all cached results:', error)
      return []
    }
  }

  /**
   * Clear cache entry for a specific video hash
   */
  async clearCachedResults(videoHash: string): Promise<boolean> {
    try {
      const cacheFilePath = path.join(this.cacheDir, `${videoHash}.json`)
      
      if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath)
        console.log(`[CacheManager] Cleared cached results for hash: ${videoHash}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('[CacheManager] Error clearing cached results:', error)
      return false
    }
  }

  /**
   * Clear all cached results (for cleanup)
   */
  async clearAllCache(): Promise<number> {
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir)
        .filter(file => file.endsWith('.json'))
      
      for (const file of cacheFiles) {
        const filePath = path.join(this.cacheDir, file)
        fs.unlinkSync(filePath)
      }
      
      console.log(`[CacheManager] Cleared ${cacheFiles.length} cached results`)
      return cacheFiles.length
    } catch (error) {
      console.error('[CacheManager] Error clearing all cache:', error)
      return 0
    }
  }

  /**
   * Clean up old cache entries (older than specified days)
   */
  async cleanupOldCache(maxAgeInDays: number = 30): Promise<number> {
    try {
      const maxAge = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000)
      const cacheFiles = fs.readdirSync(this.cacheDir)
        .filter(file => file.endsWith('.json'))
      
      let cleanedCount = 0
      
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(this.cacheDir, file)
          const data = fs.readFileSync(filePath, 'utf8')
          const cachedResult: CachedResult = JSON.parse(data)
          
          const cachedTime = new Date(cachedResult.cachedAt).getTime()
          
          if (cachedTime < maxAge) {
            fs.unlinkSync(filePath)
            cleanedCount++
          }
        } catch (error) {
          console.error(`[CacheManager] Error processing cache file ${file} for cleanup:`, error)
        }
      }
      
      console.log(`[CacheManager] Cleaned up ${cleanedCount} old cache entries`)
      return cleanedCount
    } catch (error) {
      console.error('[CacheManager] Error during cache cleanup:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    totalSizeBytes: number
    oldestEntry?: string
    newestEntry?: string
  }> {
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir)
        .filter(file => file.endsWith('.json'))
      
      let totalSizeBytes = 0
      let oldestEntry: string | undefined
      let newestEntry: string | undefined
      let oldestTime = Date.now()
      let newestTime = 0
      
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(this.cacheDir, file)
          const stats = fs.statSync(filePath)
          totalSizeBytes += stats.size
          
          const data = fs.readFileSync(filePath, 'utf8')
          const cachedResult: CachedResult = JSON.parse(data)
          const cachedTime = new Date(cachedResult.cachedAt).getTime()
          
          if (cachedTime < oldestTime) {
            oldestTime = cachedTime
            oldestEntry = cachedResult.cachedAt
          }
          
          if (cachedTime > newestTime) {
            newestTime = cachedTime
            newestEntry = cachedResult.cachedAt
          }
        } catch (error) {
          console.error(`[CacheManager] Error processing cache file ${file} for stats:`, error)
        }
      }
      
      return {
        totalEntries: cacheFiles.length,
        totalSizeBytes,
        oldestEntry,
        newestEntry
      }
    } catch (error) {
      console.error('[CacheManager] Error getting cache stats:', error)
      return {
        totalEntries: 0,
        totalSizeBytes: 0
      }
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager()
export default cacheManager
