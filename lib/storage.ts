// Storage utilities for the warehouse safety portal

export interface StorageConfig {
  maxFileSize: number
  allowedTypes: string[]
  tempDirectory: string
}

export const defaultStorageConfig: StorageConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'],
  tempDirectory: 'public/temp'
}

export function validateFile(file: File, config: StorageConfig = defaultStorageConfig): {
  valid: boolean
  error?: string
} {
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Supported types: ${config.allowedTypes.join(', ')}`
    }
  }

  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size ${formatBytes(file.size)} exceeds maximum allowed size of ${formatBytes(config.maxFileSize)}`
    }
  }

  return { valid: true }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function generateFileName(originalName: string, jobId: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  return `${jobId}_${timestamp}.${extension}`
}

export function cleanupTempFiles(directory: string, olderThanHours = 24): void {
  // This would be implemented server-side to clean up old temp files
  // For now, just a placeholder for the interface
  console.log(`Cleaning up temp files in ${directory} older than ${olderThanHours} hours`)
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isVideoFile(filename: string): boolean {
  const extension = getFileExtension(filename)
  const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
  return videoExtensions.includes(extension)
}