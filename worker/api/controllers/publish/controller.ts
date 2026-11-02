/**
 * Publish App Controller
 * POST /api/apps/:appId/publish
 * Makes the app publicly accessible at {slug}.masidy.dev
 */

import { AppService } from '../../../database/services/AppService';
import { BaseController } from '../baseController';
import type { RouteContext } from '../../types/route-context';

export class PublishController extends BaseController {
    /**
     * Publish an app — assigns a stable subdomain URL.
     * POST /api/apps/:appId/publish
     */
    static async publishApp(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        routeContext: RouteContext,
    ): Promise<Response> {
        try {
            const user = routeContext.user;
            if (!user) {
                return PublishController.createErrorResponse('Unauthorized', 401);
            }

            const appId = routeContext.pathParams.appId;
            if (!appId) {
                return PublishController.createErrorResponse('App ID required', 400);
            }

            const customDomain = (env as { CUSTOM_DOMAIN?: string }).CUSTOM_DOMAIN ?? 'masidy.dev';
            const appService = new AppService(env);
            const result = await appService.publishApp(appId, user.id, customDomain);

            return PublishController.createSuccessResponse({
                slug: result.slug,
                publishedUrl: result.publishedUrl,
                message: `App published at ${result.publishedUrl}`,
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Unauthorized') {
                return PublishController.createErrorResponse('You do not own this app', 403);
            }
            return PublishController.handleError(error, 'publish app');
        }
    }

    /**
     * Unpublish an app — clears publishedUrl, keeps slug, makes private.
     * DELETE /api/apps/:appId/publish
     */
    static async unpublishApp(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        routeContext: RouteContext,
    ): Promise<Response> {
        try {
            const user = routeContext.user;
            if (!user) {
                return PublishController.createErrorResponse('Unauthorized', 401);
            }

            const appId = routeContext.pathParams.appId;
            const appService = new AppService(env);

            const app = await appService.getAppDetails(appId, user.id);
            if (!app) {
                return PublishController.createErrorResponse('App not found', 404);
            }
            if (app.userId !== user.id) {
                return PublishController.createErrorResponse('Unauthorized', 403);
            }

            await appService.updateApp(appId, {
                visibility: 'private',
                publishedUrl: null,
            });

            return PublishController.createSuccessResponse({ message: 'App unpublished' });
        } catch (error) {
            return PublishController.handleError(error, 'unpublish app');
        }
    }
}