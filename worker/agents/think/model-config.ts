import { ModelSize, type AIModelConfig } from '../inferutils/config.types';

// Use Cloudflare Workers AI - FREE with Workers Paid plan
// Best coding model available on Workers AI
export const THINK_MODEL_ID = 'workers-ai/@cf/qwen/qwen2.5-coder-32b-instruct';

export const THINK_MODEL_CONFIG: AIModelConfig = {
	name: 'Qwen 2.5 Coder 32B',
	size: ModelSize.REGULAR,
	provider: 'workers-ai',
	creditCost: 0,
	contextSize: 32000,
};
