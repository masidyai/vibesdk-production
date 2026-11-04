/**
 * CustomDomainController — add/verify/list/remove custom domains for apps.
 */
import { BaseController } from '../baseController';
import type { RouteContext } from '../../types/route-context';
import { CustomDomainService } from '../../../database/services/CustomDomainService';
import { AppService } from '../../../database';

export class CustomDomainController extends BaseController {

    /** GET /api/apps/:appId/domains */
    static async listDomains(
        _req: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext,
    ): Promise<Response> {
        const user = routeContext.user;
        if (!user) return CustomDomainController.createErrorResponse('Unauthorized', 401);

        const appId = routeContext.pathParams.appId;
        const svc = new CustomDomainService(env);
        const domains = await svc.getDomainsForApp(appId);
        return CustomDomainController.createSuccessResponse({ domains });
    }

    /** POST /api/apps/:appId/domains */
    static async addDomain(
        request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext,
    ): Promise<Response> {
        const user = routeContext.user;
        if (!user) return CustomDomainController.createErrorResponse('Unauthorized', 401);

        const appId = routeContext.pathParams.appId;

        // Verify ownership
        const appService = new AppService(env);
        const app = await appService.getAppDetails(appId, user.id);
        if (!app) return CustomDomainController.createErrorResponse('App not found', 404);
        if (app.userId !== user.id) return CustomDomainController.createErrorResponse('Unauthorized', 403);

        const body = await CustomDomainController.parseJsonBody<{ domain?: string }>(request);
        if (!body.success) return body.response!;
        const domain = body.data?.domain?.trim();
        if (!domain) return CustomDomainController.createErrorResponse('domain is required', 400);

        try {
            const svc = new CustomDomainService(env);
            const record = await svc.addDomain(appId, user.id, domain);
            const customDomain = (env as { CUSTOM_DOMAIN?: string }).CUSTOM_DOMAIN ?? 'masidy.dev';
            return CustomDomainController.createSuccessResponse({
                domain: record,
                instructions: {
                    cname: {
                        type: 'CNAME',
                        host: record.domain,
                        value: customDomain,
                        description: `Add a CNAME record pointing ${record.domain} → ${customDomain}`,
                    },
                    txt: {
                        type: 'TXT',
                        host: `_masidy-verify.${record.domain}`,
                        value: record.verificationToken,
                        description: 'Or add this TXT record to verify ownership',
                    },
                },
            });
        } catch (error) {
            return CustomDomainController.createErrorResponse(
                error instanceof Error ? error.message : 'Failed to add domain',
                400,
            );
        }
    }

    /** POST /api/apps/:appId/domains/:domainId/verify */
    static async verifyDomain(
        _req: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext,
    ): Promise<Response> {
        const user = routeContext.user;
        if (!user) return CustomDomainController.createErrorResponse('Unauthorized', 401);

        const { domainId } = routeContext.pathParams as { appId: string; domainId: string };
        const customDomain = (env as { CUSTOM_DOMAIN?: string }).CUSTOM_DOMAIN ?? 'masidy.dev';
        const svc = new CustomDomainService(env);
        const result = await svc.verifyDomain(domainId, user.id, customDomain);
        return CustomDomainController.createSuccessResponse(result);
    }

    /** DELETE /api/apps/:appId/domains/:domainId */
    static async removeDomain(
        _req: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext,
    ): Promise<Response> {
        const user = routeContext.user;
        if (!user) return CustomDomainController.createErrorResponse('Unauthorized', 401);

        const { domainId } = routeContext.pathParams as { domainId: string };
        const svc = new CustomDomainService(env);
        const ok = await svc.removeDomain(domainId, user.id);
        if (!ok) return CustomDomainController.createErrorResponse('Domain not found', 404);
        return CustomDomainController.createSuccessResponse({ message: 'Domain removed' });
    }
}