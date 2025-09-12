# Vercel + Railway Deployment Guide

## Step 1: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables
vercel env add OPENROUTER_API_KEY
vercel env add PYTHON_SERVICE_URL
vercel env add PYTHON_SERVICE_TOKEN
```

## Step 2: Create Python Service on Railway

```bash
# Create new Railway project
railway login
railway new warehouse-python-api

# Deploy Python service
railway up

# Set environment variables
railway variables set OPENROUTER_API_KEY=your_key
railway variables set WEBHOOK_SECRET=your_secret
```

## Step 3: Update Frontend Code

```typescript
// Update app/page.tsx handleStartAnalysis
const handleStartAnalysis = async () => {
  try {
    // Call Vercel API which proxies to Railway
    const response = await fetch(`/api/process-external/${jobId}`, {
      method: 'POST'
    })
    
    if (response.ok) {
      router.push(`/processing/${jobId}`)
    }
  } catch (error) {
    console.error("Analysis failed:", error)
  }
}
```

## Step 4: Test the Flow

1. Upload video → Vercel API
2. Store in cloud → Vercel Blob
3. Trigger processing → Railway Python service
4. Receive results → Vercel webhook
5. Display results → Vercel frontend

## Benefits

- ✅ No timeout issues
- ✅ Proper separation of concerns  
- ✅ Scalable architecture
- ✅ Cost effective
- ✅ Easy to maintain
