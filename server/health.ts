/**
 * Health check utilities for startup dependency validation
 */

import { storage } from './storage';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: Date;
}

/**
 * Performs database connectivity check
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    // Try to perform a simple database operation
    await storage.getProjects({ search: '', tags: undefined, techStack: undefined, sortBy: 'recent' });
    
    return {
      service: 'database',
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Performs authentication service health check
 */
export async function checkAuthService(issuerUrl: string): Promise<HealthCheckResult> {
  try {
    // Try to reach the OIDC discovery endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${issuerUrl}/.well-known/openid_configuration`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        service: 'auth',
        status: 'healthy',
        message: 'Authentication service reachable',
        timestamp: new Date(),
      };
    } else {
      return {
        service: 'auth',
        status: 'unhealthy',
        message: `Authentication service returned ${response.status}`,
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      service: 'auth',
      status: 'unhealthy',
      message: `Authentication service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Runs comprehensive health checks for all critical services
 */
export async function performStartupHealthChecks(issuerUrl: string): Promise<{
  allHealthy: boolean;
  results: HealthCheckResult[];
}> {
  console.log('🔍 Running startup health checks...');
  
  const healthChecks = await Promise.allSettled([
    checkDatabase(),
    checkAuthService(issuerUrl),
  ]);

  const results: HealthCheckResult[] = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const serviceName = index === 0 ? 'database' : 'auth';
      return {
        service: serviceName,
        status: 'unhealthy' as const,
        message: `Health check failed: ${result.reason}`,
        timestamp: new Date(),
      };
    }
  });

  const allHealthy = results.every(result => result.status === 'healthy');

  // Log results
  results.forEach(result => {
    const emoji = result.status === 'healthy' ? '✅' : '❌';
    console.log(`${emoji} ${result.service}: ${result.message}`);
  });

  return { allHealthy, results };
}

/**
 * Creates a graceful shutdown handler
 */
export function createGracefulShutdownHandler(server: any) {
  const shutdown = (signal: string) => {
    console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
    
    server.close((err: any) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}