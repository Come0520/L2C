## Codebase Cleanup Plan

### 1. Remove Legacy Auth Routes
- **Files to delete**: 
  - `src/app/api/auth/login/route.ts` (mock login implementation with TODO)
  - `src/app/api/auth/register/route.ts` (mock register implementation with TODO)
- **Reason**: These are legacy mock implementations that are no longer needed, as indicated by the task request.

### 2. TODO Comments Analysis
- **Found 7 TODO comments** in the codebase:
  - 2 in auth routes (will be deleted with the files)
  - 5 in `collaborate/[id]/page.tsx` (complex implementation TODOs for API calls)
- **Action**: Only the TODOs in the auth routes will be removed since they're part of the legacy files. The remaining TODOs in the collaborate page require actual API implementation, which is beyond the scope of simple cleanup tasks.

### 3. Implementation Steps
1. Delete the legacy auth route files
2. Verify the deletion was successful
3. Confirm no other simple TODOs need resolution

### Expected Outcome
- Cleaned up legacy authentication routes
- Removed 2 unnecessary TODO comments
- Maintained the integrity of the collaborate page functionality
- Codebase is more streamlined and maintainable