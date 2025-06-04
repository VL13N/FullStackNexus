// Environment configuration utility for accessing API keys and secrets

// Backend environment variables (Node.js)
export const getBackendEnv = () => {
  if (typeof process !== 'undefined' && process.env) {
    return {
      TAAPI_API_KEY: process.env.TAAPI_API_KEY,
      LUNARCRUSH_API_KEY: process.env.LUNARCRUSH_API_KEY,
      CRYPTORANK_API_KEY: process.env.CRYPTORANK_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || 3001
    };
  }
  return {};
};

// Frontend environment variables (Vite)
export const getFrontendEnv = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - use import.meta.env
    const env = import.meta?.env || {};
    return {
      SUPABASE_URL: env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
      API_URL: env.VITE_API_URL || '/api',
      NODE_ENV: env.NODE_ENV || 'development'
    };
  }
  return {};
};

// Validation helpers
export const validateApiKeys = () => {
  const env = getBackendEnv();
  const missing = [];
  
  const requiredKeys = [
    'TAAPI_API_KEY',
    'LUNARCRUSH_API_KEY', 
    'CRYPTORANK_API_KEY',
    'OPENAI_API_KEY'
  ];
  
  requiredKeys.forEach(key => {
    if (!env[key]) {
      missing.push(key);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

export const validateFrontendEnv = () => {
  const env = getFrontendEnv();
  const missing = [];
  
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  requiredKeys.forEach(key => {
    if (!env[key]) {
      missing.push(key);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Environment checker for startup
export const checkEnvironment = () => {
  const backend = validateApiKeys();
  const frontend = validateFrontendEnv();
  
  return {
    backend,
    frontend,
    allValid: backend.isValid && frontend.isValid
  };
};

export default {
  getBackendEnv,
  getFrontendEnv,
  validateApiKeys,
  validateFrontendEnv,
  checkEnvironment
};