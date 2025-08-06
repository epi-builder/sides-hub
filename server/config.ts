/**
 * Configuration validation and environment variable handling
 */

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  appEnv: string;
  database: {
    url: string;
  };
  auth: {
    replitDomains: string[];
    issuerUrl: string;
    replId: string;
    sessionSecret: string;
  };
  storage?: {
    bucketName?: string;
    projectId?: string;
  };
}

/**
 * Validates and returns server configuration
 * Throws detailed error messages for missing required environment variables
 */
export function getServerConfig(): ServerConfig {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
    REPL_ID: process.env.REPL_ID,
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_ENV: process.env.APP_ENV,
  };

  // Check for missing required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  if (errors.length > 0) {
    const errorMessage = [
      '❌ Application startup failed due to missing environment variables:',
      ...errors.map(err => `  • ${err}`),
      '',
      '📝 Required environment variables for deployment:',
      '  • DATABASE_URL: PostgreSQL connection string',
      '  • REPLIT_DOMAINS: Comma-separated list of allowed domains',
      '  • REPL_ID: Replit application identifier',
      '  • SESSION_SECRET: Secret key for session encryption',
      '  • APP_ENV: Application environment (dev/prod)',
      '',
      '🔧 Optional environment variables:',
      '  • ISSUER_URL: OpenID Connect issuer (defaults to https://replit.com/oidc)',
      '  • PORT: Server port (defaults to 5000)',
      '  • GOOGLE_CLOUD_BUCKET_NAME: For file uploads',
      '  • GOOGLE_CLOUD_PROJECT_ID: For cloud storage',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Parse REPLIT_DOMAINS
  const replitDomains = requiredVars.REPLIT_DOMAINS!
    .split(',')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);

  if (replitDomains.length === 0) {
    throw new Error('REPLIT_DOMAINS must contain at least one valid domain');
  }

  return {
    port: parseInt(process.env.PORT || '5000', 10),
    host: '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    appEnv: requiredVars.APP_ENV!,
    database: {
      url: requiredVars.DATABASE_URL!,
    },
    auth: {
      replitDomains,
      issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
      replId: requiredVars.REPL_ID!,
      sessionSecret: requiredVars.SESSION_SECRET!,
    },
    storage: {
      bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    },
  };
}

/**
 * Validates configuration values for deployment readiness
 */
export function validateDeploymentConfig(config: ServerConfig): void {
  const warnings: string[] = [];

  // Check port is valid
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}. Must be between 1 and 65535.`);
  }

  // Validate database URL format
  if (!config.database.url.startsWith('postgres://') && !config.database.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string starting with postgres:// or postgresql://');
  }

  // Validate session secret strength
  if (config.auth.sessionSecret.length < 32) {
    warnings.push('SESSION_SECRET should be at least 32 characters long for security');
  }

  // Check for production readiness
  if (config.nodeEnv === 'production') {
    if (!config.storage?.bucketName || !config.storage?.projectId) {
      warnings.push('File upload functionality may be limited without GOOGLE_CLOUD_BUCKET_NAME and GOOGLE_CLOUD_PROJECT_ID');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  • ${warning}`));
    console.warn('');
  }
}