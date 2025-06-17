/**
 * API Response Middleware
 * Ensures API routes return proper JSON responses and bypass Vite routing conflicts
 */

export function ensureJSONResponse(req, res, next) {
  // Store original res.end function
  const originalEnd = res.end;
  
  // Override res.end to ensure JSON response for API routes
  res.end = function(chunk, encoding) {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      // Ensure proper JSON content-type for API routes
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json');
      }
      
      // If chunk looks like HTML, return a proper JSON error instead
      if (chunk && typeof chunk === 'string' && chunk.includes('<!DOCTYPE html>')) {
        const errorResponse = JSON.stringify({
          success: false,
          error: 'API endpoint configuration error - HTML response detected',
          path: req.path,
          timestamp: new Date().toISOString()
        });
        
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        return originalEnd.call(this, errorResponse, encoding);
      }
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

export function apiRouteProtection(req, res, next) {
  // Skip Vite middleware for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/ws/')) {
    res.locals.skipVite = true;
  }
  next();
}