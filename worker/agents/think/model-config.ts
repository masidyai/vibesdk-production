import { ModelSize, type AIModelConfig } from '../inferutils/config.types';

// Kimi K2.7 Code - Workers AI, FREE, supports structured tool calls
export const THINK_MODEL_ID = 'workers-ai/@cf/moonshotai/kimi-k2.7-code';

export const THINK_MODEL_CONFIG: AIModelConfig = {
	name: 'Kimi K2.7 Code',
	size: ModelSize.REGULAR,
	provider: 'workers-ai',
	creditCost: 0,
	contextSize: 128000,
};
