# 🚀 Heroku Deployment Guide

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure git is installed and initialized in your project

## Quick Deployment Steps

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create Heroku App

```bash
heroku create your-app-name
```

Or let Heroku generate a random name:

```bash
heroku create
```

### 3. Set Environment Variables

```bash
heroku config:set OPENAI_API_KEY=your-openai-api-key-here
heroku config:set NODE_ENV=production
```

### 4. Add Node.js Buildpack

```bash
heroku buildpacks:add heroku/nodejs
```

### 5. Deploy to Heroku

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku master
```

Or if you're on a different branch:

```bash
git push heroku main:master
```

### 6. Open Your App

```bash
heroku open
```

## Configuration Files Explained

### `Procfile`
Tells Heroku how to start your application:
```
web: node --require ts-node/register src/server-admin-user.ts
```

### `package.json` Changes
- **`heroku-postbuild`**: Automatically builds the Angular frontend after deployment
- **`engines`**: Specifies required Node.js and npm versions
- **`start` script**: Runs the server (used by Heroku's `web` process)
- **Dependencies**: Moved TypeScript and build tools to dependencies (not devDependencies)

### Server Configuration
The server now:
- Uses `process.env.PORT` (Heroku assigns a dynamic port)
- Serves Angular static files in production mode
- Routes all non-API requests to the Angular app

## Important Notes

### ⚠️ File Uploads
Heroku uses an **ephemeral filesystem** - uploaded files will be lost when:
- The app restarts (happens at least once daily)
- A new version is deployed
- The dyno sleeps/wakes

**Solutions:**
1. **AWS S3** (Recommended): Use [multer-s3](https://www.npmjs.com/package/multer-s3)
2. **Cloudinary**: For document storage
3. **Heroku Postgres**: Store document content in database

### 🔍 Monitoring

View logs:
```bash
heroku logs --tail
```

Check app status:
```bash
heroku ps
```

Restart app:
```bash
heroku restart
```

### 📊 Database (Optional)

If you need persistent storage, add Heroku Postgres:
```bash
heroku addons:create heroku-postgresql:mini
```

## Troubleshooting

### Build Fails

Check logs:
```bash
heroku logs --tail
```

### App Crashes

View error details:
```bash
heroku logs --tail
```

Common issues:
- Missing environment variables
- Port not configured correctly
- Build errors in Angular

### Frontend Not Loading

Ensure:
1. `heroku-postbuild` script ran successfully
2. Server is configured to serve static files
3. All routes redirect to index.html

## Updating Your App

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push heroku master
```

## Environment Variables

View all config vars:
```bash
heroku config
```

Add a new variable:
```bash
heroku config:set VARIABLE_NAME=value
```

Remove a variable:
```bash
heroku config:unset VARIABLE_NAME
```

## Scaling (Optional)

Upgrade to a paid dyno for better performance:
```bash
heroku ps:scale web=1:standard-1x
```

## Custom Domain (Optional)

Add your domain:
```bash
heroku domains:add www.yourdomain.com
```

## Useful Commands

```bash
# Open app in browser
heroku open

# View app info
heroku info

# Run bash on Heroku
heroku run bash

# View database info
heroku pg:info

# Access Heroku dashboard
heroku dashboard
```

## Cost Optimization

- **Free Tier**: Good for testing, sleeps after 30 min of inactivity
- **Eco Dynos ($5/month)**: Doesn't sleep, shared resources
- **Basic ($7/month)**: Dedicated resources
- **Standard ($25+/month)**: Production-grade

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use Heroku config vars for secrets
3. ✅ Enable HTTPS (automatic with Heroku)
4. ✅ Implement rate limiting for API endpoints
5. ✅ Validate all file uploads

## Next Steps

1. Set up persistent storage (S3/Cloudinary) for uploads
2. Add a database for document metadata
3. Implement user authentication
4. Add monitoring/alerting
5. Configure custom domain
6. Set up CI/CD pipeline

## Support

- Heroku Documentation: https://devcenter.heroku.com
- Heroku Support: https://help.heroku.com

---

**Your app is now ready to deploy! 🎉**

Need help? Check the logs with `heroku logs --tail`
