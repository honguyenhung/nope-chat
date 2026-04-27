/**
 * Request Validation Middleware
 * Chặn các request độc hại trước khi vào handler
 */

// Blacklist các patterns nguy hiểm
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc.
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /\.\.\/\.\.\//g, // Path traversal
  /union.*select/gi, // SQL injection
  /drop.*table/gi,
  /insert.*into/gi,
  /delete.*from/gi,
];

// Suspicious headers
const SUSPICIOUS_HEADERS = [
  'x-forwarded-host',
  'x-original-url',
  'x-rewrite-url',
];

/**
 * Validate request body for malicious content
 */
export function validateRequestBody(req, res, next) {
  const body = JSON.stringify(req.body);
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(body)) {
      console.warn(`🚨 Blocked malicious request from ${req.ip}: ${pattern}`);
      return res.status(400).json({ 
        error: 'Invalid request content',
        code: 'MALICIOUS_CONTENT'
      });
    }
  }
  
  next();
}

/**
 * Validate request headers
 */
export function validateRequestHeaders(req, res, next) {
  // Check for suspicious headers
  for (const header of SUSPICIOUS_HEADERS) {
    if (req.headers[header]) {
      console.warn(`🚨 Suspicious header from ${req.ip}: ${header}`);
      return res.status(400).json({ 
        error: 'Invalid request headers',
        code: 'SUSPICIOUS_HEADERS'
      });
    }
  }
  
  // Validate User-Agent
  const userAgent = req.headers['user-agent'];
  if (!userAgent || userAgent.length < 10) {
    console.warn(`🚨 Missing or invalid User-Agent from ${req.ip}`);
    return res.status(400).json({ 
      error: 'Invalid User-Agent',
      code: 'INVALID_USER_AGENT'
    });
  }
  
  next();
}

/**
 * Validate request size
 */
export function validateRequestSize(maxSize = 1024 * 1024) { // 1MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      console.warn(`🚨 Request too large from ${req.ip}: ${contentLength} bytes`);
      return res.status(413).json({ 
        error: 'Request too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize
      });
    }
    
    next();
  };
}

/**
 * Validate request method
 */
export function validateRequestMethod(allowedMethods = ['GET', 'POST']) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      console.warn(`🚨 Invalid method from ${req.ip}: ${req.method}`);
      return res.status(405).json({ 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        allowed: allowedMethods
      });
    }
    
    next();
  };
}

/**
 * Combined security middleware
 */
export function securityMiddleware(req, res, next) {
  validateRequestHeaders(req, res, () => {
    validateRequestBody(req, res, next);
  });
}
