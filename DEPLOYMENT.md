# 🚀 Vercel + Render Hybrid Deployment Guide

## Architecture
- **Frontend**: Next.js app deployed to Vercel (FREE)
- **Backend**: Python API deployed to Render (FREE - 750 hours/month)

## 📋 Prerequisites
1. GitHub account
2. Vercel account (free)
3. Render account (free)
4. OpenRouter API key

## 🏗️ Part 1: Deploy Python Backend to Render

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 2. Deploy Python Service
```bash
# Navigate to python-backend directory
cd python-backend

# Initialize git (if not already)
git init
git add .
git commit -m "Initial Python backend"

# Push to GitHub (create new repo: warehouse-safety-python)
git remote add origin https://github.com/yourusername/warehouse-safety-python.git
git push -u origin main
```

### 3. Connect to Render
1. In Render dashboard, click "New Web Service"
2. Connect your GitHub repo: `warehouse-safety-python`
3. Configure:
   - **Name**: `warehouse-safety-python`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free`

### 4. Set Environment Variables in Render
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `PORT`: `10000` (auto-set by Render)

### 5. Deploy & Get URL
- Click "Deploy"
- Wait for deployment (5-10 minutes)
- Copy your service URL: `https://warehouse-safety-python.onrender.com`

## 🌐 Part 2: Deploy Frontend to Vercel

### 1. Prepare Frontend
```bash
# In main project directory
npm install
npm run build  # Test build locally
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: warehouse-safety-portal
# - Directory: ./
# - Override settings? N
```

### 3. Set Environment Variables in Vercel
```bash
# Set environment variables
vercel env add OPENROUTER_API_KEY
vercel env add PYTHON_SERVICE_URL
vercel env add PYTHON_SERVICE_TOKEN

# Or via Vercel dashboard:
# - Go to Project Settings > Environment Variables
# - Add each variable for Production, Preview, Development
```

**Environment Variables:**
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `PYTHON_SERVICE_URL`: `https://warehouse-safety-python.onrender.com`
- `PYTHON_SERVICE_TOKEN`: Generate a secure token for webhook auth

### 4. Update Python Service
In Render dashboard, add environment variable:
- `WEBHOOK_AUTH_TOKEN`: Same token as `PYTHON_SERVICE_TOKEN`

## 🔄 Workflow After Deployment

1. **User uploads video** → Vercel handles upload
2. **User clicks "Start Analysis"** → Vercel calls Render Python service
3. **Render processes video** → YOLO + AI analysis (up to 15 minutes)
4. **Render sends results** → Webhook back to Vercel (optional)
5. **User sees results** → Vercel displays analysis

## 💰 Cost Breakdown

| Service | Plan | Cost | Usage Limit |
|---------|------|------|-------------|
| **Vercel** | Hobby | FREE | 100GB bandwidth |
| **Render** | Free | FREE | 750 hours/month |
| **Total** | | **$0/month** | Plenty for development |

## 🧪 Testing Your Deployment

### Test Python Backend
```bash
curl https://warehouse-safety-python.onrender.com/
# Should return: {"status": "healthy", "message": "Warehouse Safety Python Backend"}
```

### Test Full Flow
1. Visit your Vercel URL
2. Upload a video
3. Click "Start Analysis"
4. Check Vercel function logs
5. Check Render service logs

## 🐛 Troubleshooting

### Common Issues:

1. **Python service timeout**
   - Render free tier has 15min limit
   - Your processing takes 2-3min, should be fine

2. **Video upload issues**
   - Large videos might timeout on Vercel
   - Consider video compression

3. **CORS errors**
   - Check Flask-CORS is enabled
   - Verify Vercel domain in CORS settings

4. **Webhook fails**
   - Check webhook URL is accessible
   - Verify auth token matches

## 🔧 Development vs Production

### Development (Local)
```bash
# Run frontend locally
npm run dev

# Run Python backend locally
cd python-backend
pip install -r requirements.txt
python app.py
```

### Production
- Frontend: Automatic deploy on git push to main
- Backend: Automatic deploy on git push to python repo

## 🚀 Going Live Checklist

- [ ] Python backend deployed to Render
- [ ] Frontend deployed to Vercel  
- [ ] Environment variables set correctly
- [ ] Test video upload and analysis
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)

**Your app is now live and FREE! 🎉**
