import { Hono } from 'hono';
import { handleSubdomainRequest } from './middleware/subdomain-router';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { getCORSConfig, getSecureHeadersConfig } from './config/security';
import { RateLimitService } from './services/rate-limit/rateLimits';
import { AppEnv } from './types/appenv';
import { setupRoutes } from './api/routes';
import { CsrfService } from './services/csrf/CsrfService';
import { SecurityError, SecurityErrorType } from 'shared/types/errors';
import { getGlobalConfigurableSettings } from './config';
import { AuthConfig, setAuthLevel } from './middleware/auth/routeAuth';
// import { initHonoSentry } from './observability/sentry';

export function createApp(env: Env): Hono<AppEnv> {
    const app = new Hono<AppEnv>();

    // Observability: Sentry error reporting & context
    // initHonoSentry(app);

    // Subdomain routing: {slug}.masidy.dev -> dispatch namespace
    app.use('*', async (c, next) => {
        const host = c.req.header('host') ?? '';
        const customDomain = env.CUSTOM_DOMAIN ?? 'masidy.dev';
        // Match {slug}.masidy.dev but not masidy.dev itself
        const subdomainMatch = host.match(new RegExp('^([a-z0-9-]+)\\.' + customDomain.replace('.', '\\.') + '$'));
        if (subdomainMatch) {
            const slug = subdomainMatch[1];
            const handled = await handleSubdomainRequest(c.req.raw, env, slug);
            if (handled) return handled;
        }
        return next();
    });

    // Apply global security middlewares (skip for WebSocket upgrades)
    app.use('*', async (c, next) => {
        // Skip secure headers for WebSocket upgrade requests
        const upgradeHeader = c.req.header('upgrade');
        if (upgradeHeader?.toLowerCase() === 'websocket') {
            return next();
        }

        // Skip secure headers for OAuth redirect endpoints to avoid
        // immutable header errors on redirect responses.
        const pathname = new URL(c.req.url).pathname;
        if (pathname.startsWith('/oauth/') || pathname === '/auth/callback') {
            return next();
        }
        // Apply secure headers
        return secureHeaders(getSecureHeadersConfig(env))(c, next);
    });
    
    // CORS configuration
    app.use('/api/*', cors(getCORSConfig(env)));
    
    // CSRF protection using double-submit cookie pattern with proper GET handling
    app.use('*', async (c, next) => {
        const method = c.req.method.toUpperCase();
        
        // Skip for WebSocket upgrades
        const upgradeHeader = c.req.header('upgrade');
        if (upgradeHeader?.toLowerCase() === 'websocket') {
            return next();
        }
        
        try {
            // Handle GET requests - establish CSRF token if needed
            if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
                await next();
                
                // Only set CSRF token for successful API responses
                if (c.req.url.startsWith('/api/') && c.res.status < 400) {
                    await CsrfService.enforce(c.req.raw, c.res);
                }
                
                return;
            }
            
            // Validate CSRF token for state-changing requests
            await CsrfService.enforce(c.req.raw, undefined);
            await next();
        } catch (error) {
            if (error instanceof SecurityError && error.type === SecurityErrorType.CSRF_VIOLATION) {
                return new Response(JSON.stringify({ 
                    error: { 
                        message: 'CSRF validation failed',
                        type: SecurityErrorType.CSRF_VIOLATION
                    }
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw error;
        }
    });

    app.use('/api/*', async (c, next) => {
        // Apply global config middleware
        const config = await getGlobalConfigurableSettings(env);
        c.set('config', config);

        // Apply global rate limit middleware. Should this be moved after setupRoutes so that maybe 'user' is available?
        await RateLimitService.enforceGlobalApiRateLimit(env, c.get('config').security.rateLimit, null, c.req.raw)
        await next();
    })

    // By default, all routes require authentication
    app.use('/api/*', setAuthLevel(AuthConfig.ownerOnly));

    // Now setup all the routes
    setupRoutes(app);

    // Add not found route to redirect to ASSETS
    // Wrap the ASSETS response in a new Response with mutable headers so
    // downstream middleware (e.g. secureHeaders) can safely modify them.
    app.notFound(async (c) => {
        const res = await c.env.ASSETS.fetch(c.req.raw);
        return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: new Headers(res.headers),
        });
    });
    return app;
}