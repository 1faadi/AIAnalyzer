"use client"

interface AnnotatedImageProps {
  src: string
  alt?: string
  boundingBoxes?: any[] // Keep for compatibility but won't be used
}

export function AnnotatedImage({ src, alt }: AnnotatedImageProps) {
  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-muted">
      <img
        src={src || "/placeholder.svg"}
        alt={alt || "Analysis frame"}
        className="w-full h-auto"
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          e.currentTarget.src = "/warehouse-hallway-with-potential-safety-issues.jpg"
        }}
      />
    </div>
  )
}