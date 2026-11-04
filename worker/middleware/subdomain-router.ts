/**
 * Subdomain router — handles both {slug}.masidy.dev and custom domain requests.
 *
 * For {slug}.masidy.dev: looks up app by slug in D1.
 * For custom domains: looks up app by domain in custom_domains table.
 * Returns null if no match so the main app continues handling the request.
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { isDispatcherAvailable } from '../utils/dispatcherUtils';

async function proxyToWorker(
request: Request,
env: Env,
deploymentId: string,
originUrl: string,
): Promise<Response> {
const worker = env.DISPATCHER.get(deploymentId);
const url = new URL(request.url);
const forwardUrl = new URL(url.pathname + url.search, originUrl);
const forwarded = new Request(forwardUrl.toString(), request);
return worker.fetch(forwarded);
}

export async function handleSubdomainRequest(
request: Request,
env: Env,
slug: string,
): Promise<Response | null> {
if (!isDispatcherAvailable(env)) return null;

try {
const db = drizzle(env.DB, { schema });
const app = await db
.select({ id: schema.apps.id, deploymentId: schema.apps.deploymentId, visibility: schema.apps.visibility })
.from(schema.apps)
.where(eq(schema.apps.slug, slug))
.get();

if (!app?.deploymentId) return new Response('App not found', { status: 404 });
if (app.visibility !== 'public') return new Response('This app is private', { status: 403 });

const customDomain = (env as { CUSTOM_DOMAIN?: string }).CUSTOM_DOMAIN ?? 'masidy.dev';
return proxyToWorker(request, env, app.deploymentId, `https://${slug}.${customDomain}`);
} catch {
return null;
}
}

export async function handleCustomDomainRequest(
request: Request,
env: Env,
host: string,
): Promise<Response | null> {
if (!isDispatcherAvailable(env)) return null;

try {
const db = drizzle(env.DB, { schema });
const domainRecord = await db
.select({ appId: schema.customDomains.appId, verified: schema.customDomains.verified })
.from(schema.customDomains)
.where(eq(schema.customDomains.domain, host))
.get();

if (!domainRecord?.verified) return null;

const app = await db
.select({ deploymentId: schema.apps.deploymentId, visibility: schema.apps.visibility })
.from(schema.apps)
.where(eq(schema.apps.id, domainRecord.appId))
.get();

if (!app?.deploymentId) return new Response('App not found', { status: 404 });
if (app.visibility !== 'public') return new Response('This app is private', { status: 403 });

return proxyToWorker(request, env, app.deploymentId, `https://${host}`);
} catch {
return null;
}
}