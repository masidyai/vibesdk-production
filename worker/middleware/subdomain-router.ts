/**
 * Subdomain router — handles {slug}.masidy.dev requests.
 *
 * Looks up the app by slug in D1, then proxies the request to the
 * app's deployed Worker in the Workers for Platforms dispatch namespace.
 * Returns null if the slug is not found so the main app continues.
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { isDispatcherAvailable } from '../utils/dispatcherUtils';

export async function handleSubdomainRequest(
request: Request,
env: Env,
slug: string,
): Promise<Response | null> {
if (!isDispatcherAvailable(env)) {
return null;
}

try {
const db = drizzle(env.DB, { schema });
const app = await db
.select({
id: schema.apps.id,
deploymentId: schema.apps.deploymentId,
visibility: schema.apps.visibility,
})
.from(schema.apps)
.where(eq(schema.apps.slug, slug))
.get();

if (!app?.deploymentId) {
return new Response('App not found', { status: 404 });
}

// Only serve public apps via subdomain (private apps still accessible via /app/:id)
if (app.visibility !== 'public') {
return new Response('This app is private', { status: 403 });
}

const worker = env.DISPATCHER.get(app.deploymentId);
// Forward the request to the deployed Worker, rewriting the URL to use the
// canonical origin so the Worker's fetch handler sees a clean URL.
const url = new URL(request.url);
const forwardUrl = new URL(url.pathname + url.search, `https://${slug}.masidy.dev`);
const forwarded = new Request(forwardUrl.toString(), request);
return worker.fetch(forwarded);
} catch (error) {
console.error('[subdomain-router] error', error);
return null;
}
}