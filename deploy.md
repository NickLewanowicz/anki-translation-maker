# 🚀 One-Click Railway Deployment

## Super Simple: Deploy Everything to Railway

### 🚂 Deploy Full-Stack App to Railway:

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your `anki-translation-maker` repository**
4. **Railway will automatically:**
   - Detect the Dockerfile
   - Build frontend + backend together
   - Deploy everything as one app
5. **Add your environment variable:**
   ```
   REPLICATE_API_TOKEN=r8_your_token_here
   ```
6. **Done!** You'll get one URL like: `https://your-app.up.railway.app`

### 🎯 That's it!

- Frontend served at: `https://your-app.up.railway.app`
- API available at: `https://your-app.up.railway.app/api/*`
- Everything works together seamlessly

## 💰 Cost Breakdown (FREE)

- **Railway**: $5/month credit (more than enough for personal use)
- **Replicate**: Pay-per-use (very cheap - ~$0.01 per deck generation)

## 🔧 Environment Variables Needed

Only one required:

```bash
REPLICATE_API_TOKEN=r8_xxx  # Get from replicate.com/account/api-tokens
```

## 🎯 After Deployment

1. Visit your Railway URL
2. Generate a test deck with audio
3. Import the .apkg file into Anki
4. Celebrate! 🎉

## 🔍 Troubleshooting

### If deployment fails:

- Check Railway build logs in dashboard
- Verify your Dockerfile is correct
- Make sure all dependencies are in package.json

### If app doesn't work:

- Check Railway runtime logs
- Verify REPLICATE_API_TOKEN is set correctly
- Test the API endpoint: `https://your-app.up.railway.app/api/health`

### If Anki import fails:

- Make sure you're using Anki Desktop (not AnkiWeb)
- Check that the .apkg file downloaded completely
- Try generating a smaller deck first (3-5 cards)
