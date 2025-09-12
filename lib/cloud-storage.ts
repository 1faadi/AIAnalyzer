// Upload to Vercel Blob Storage or AWS S3
export async function uploadVideoToCloud(file: File, jobId: string): Promise<string> {
  // Option A: Vercel Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`videos/${jobId}-${file.name}`, file, {
      access: 'public',
    })
    return blob.url
  }
  
  // Option B: AWS S3 (more reliable)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('jobId', jobId)
  
  const response = await fetch('/api/upload-s3', {
    method: 'POST',
    body: formData
  })
  
  const { url } = await response.json()
  return url
}

export async function uploadFramesToCloud(frames: Buffer[], jobId: string): Promise<string[]> {
  const uploadPromises = frames.map(async (frame, index) => {
    const { put } = await import('@vercel/blob')
    const blob = await put(`frames/${jobId}-frame-${index}.jpg`, frame, {
      access: 'public',
    })
    return blob.url
  })
  
  return Promise.all(uploadPromises)
}
