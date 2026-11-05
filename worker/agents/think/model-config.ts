import { ModelSize, type AIModelConfig } from '../inferutils/config.types';

// Gemini - free quota on Google AI Studio, proper OpenAI-compatible tool calls
// Workers AI models do not support structured tool calls in the format Think requires
export const THINK_MODEL_ID = 'google-ai-studio/gemini-2.5-flash';

export const THINK_MODEL_CONFIG: AIModelConfig = {
	name: 'Gemini 2.5 Flash',
	size: ModelSize.REGULAR,
	provider: 'google-ai-studio',
	creditCost: 0,
	contextSize: 1_048_576,
};
