## Update Plan for useDashboard.ts

After analyzing the current implementation, I've identified the key updates needed to match the suggested React Query version:

### 1. **Update Import Paths**
   - Change analytics import from relative path to absolute path using `@/` alias
   - This ensures consistent imports across the codebase

### 2. **Update Query Key**
   - Change from `['dashboard-stats']` to `['dashboard-overview']` for better consistency with suggested naming

### 3. **Add Client Check in useEffect**
   - Add `typeof window !== 'undefined'` check before calling `TRACK_PAGE_VIEW`
   - This ensures the tracking function only runs on the client side

### 4. **Adjust Network Delay**
   - Change from 500ms to 300ms to match the suggested implementation

### 5. **Maintain Existing Mock Data**
   - Keep the comprehensive mock data that's already implemented
   - The suggested version uses empty arrays, but our current implementation has realistic mock data that's better for development and testing

### 📁 File to Modify
- `/Users/laichangcheng/Documents/文稿 - 来长城的MacBook Air/trae/L2C/slideboard-frontend/src/features/dashboard/hooks/useDashboard.ts`

### ✅ Expected Benefits
- More consistent import structure
- Better query key naming
- Enhanced client-side safety for tracking
- Matches the suggested implementation while preserving useful mock data

This update will ensure the useDashboard hook is fully aligned with the suggested React Query best practices while maintaining its current strengths.