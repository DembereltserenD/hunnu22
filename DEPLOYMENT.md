# Vercel Deployment Guide

## Pre-deployment Checklist ✅

### Build Status

- ✅ TypeScript compilation successful
- ✅ All import/export errors fixed
- ✅ Static generation warnings handled (useSearchParams properly wrapped)
- ✅ Build completes without errors

### Environment Variables Required

Set these in your Vercel dashboard under Project Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ebxuzzzdcljwkpzoeudr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieHV6enpkY2xqd2twem9ldWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc0MTYsImV4cCI6MjA3NTMzMzQxNn0.nonHXIxlcorEYUcStQ7Q-UNVBuo6R3hvAdGFzjGxWqE
SUPABASE_SERVICE_ROLE_KEY=[Add your service role key if needed]
```

### Configuration Files

- ✅ `vercel.json` - Deployment configuration
- ✅ `next.config.js` - Next.js configuration
- ✅ `package.json` - Build scripts configured

### Database Setup

- ✅ Supabase migrations ready in `supabase/migrations/`
- ✅ Database connection configured

## Deployment Steps

1. **Connect Repository to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js framework

2. **Configure Environment Variables**

   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add all required environment variables listed above

3. **Deploy**

   - Vercel will automatically deploy on every push to main branch
   - First deployment will take a few minutes

4. **Run Database Migrations**
   - After deployment, run Supabase migrations if needed
   - Ensure your database schema matches the application requirements

## Known Issues & Solutions

### useSearchParams Warnings

- ✅ **Fixed**: Components using `useSearchParams` are properly wrapped with `Suspense`
- ✅ **Fixed**: Error handling in `use-entity-filters.ts` hook for static generation

### TypeScript Errors

- ✅ **Fixed**: Duplicate identifier errors in admin pages
- ✅ **Fixed**: Malformed export statements
- ✅ **Fixed**: Unused imports cleaned up

### Build Optimization

- ✅ Static pages: 15 routes pre-rendered
- ✅ Dynamic pages: 13 routes server-rendered on demand
- ✅ Bundle size optimized (87.3 kB shared JS)

## Post-Deployment Verification

After deployment, verify these features work:

- [ ] Admin dashboard loads without errors
- [ ] CRUD operations for apartments, buildings, workers
- [ ] Phone issues management
- [ ] Real-time features with Supabase
- [ ] Offline functionality
- [ ] Authentication flows

## Performance Monitoring

Monitor these metrics in Vercel dashboard:

- Build times
- Function execution times
- Core Web Vitals
- Error rates

## Support

If you encounter deployment issues:

1. Check Vercel build logs
2. Verify environment variables are set correctly
3. Ensure Supabase connection is working
4. Check browser console for client-side errors
