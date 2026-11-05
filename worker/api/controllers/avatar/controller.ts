/**
 * Avatar upload controller.
 * POST /api/auth/avatar — upload a profile picture to R2.
 */
import { BaseController } from '../baseController';
import type { RouteContext } from '../../types/route-context';
import { UserService } from '../../../database/services/UserService';

export class AvatarController extends BaseController {
    static async uploadAvatar(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        routeContext: RouteContext,
    ): Promise<Response> {
        const user = routeContext.user;
        if (!user) return AvatarController.createErrorResponse('Unauthorized', 401);

        try {
            const contentType = request.headers.get('Content-Type') ?? '';
            if (!contentType.startsWith('image/')) {
                return AvatarController.createErrorResponse('Only image files are allowed', 400);
            }

            const bytes = await request.arrayBuffer();
            if (bytes.byteLength > 5 * 1024 * 1024) {
                return AvatarController.createErrorResponse('Image too large (max 5MB)', 400);
            }

            const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
            const key = `avatars/${user.id}.${ext}`;

            await (env as unknown as { TEMPLATES_BUCKET: R2Bucket }).TEMPLATES_BUCKET.put(key, bytes, {
                httpMetadata: { contentType },
            });

            // Store a public-accessible URL - use the Worker's own URL to serve it
            const avatarUrl = `/api/auth/avatar/${user.id}`;
            const userService = new UserService(env);
            await userService.updateUserProfile(user.id, { avatarUrl });

            return AvatarController.createSuccessResponse({ avatarUrl, message: 'Avatar updated' });
        } catch (error) {
            return AvatarController.handleError(error, 'upload avatar');
        }
    }

    static async getAvatar(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        routeContext: RouteContext,
    ): Promise<Response> {
        const userId = routeContext.pathParams.userId;
        const exts = ['png', 'jpg', 'webp'];
        for (const ext of exts) {
            const obj = await (env as unknown as { TEMPLATES_BUCKET: R2Bucket }).TEMPLATES_BUCKET.get(`avatars/${userId}.${ext}`);
            if (obj) {
                return new Response(obj.body, {
                    headers: {
                        'Content-Type': obj.httpMetadata?.contentType ?? `image/${ext}`,
                        'Cache-Control': 'public, max-age=86400',
                    },
                });
            }
        }
        return new Response('Not found', { status: 404 });
    }
}