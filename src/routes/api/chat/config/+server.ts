import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { 
	DEFAULT_CONFIG, 
	SERVICE_TYPES, 
	MODELS, 
	type ChatServiceType,
	getModelCapabilities, 
	getSupportedFileTypes,
	supportsFileInput,
	getAvailableModels
} from '$lib/config/api';

export const GET: RequestHandler = async () => {
	try {
		// 从环境变量读取聊天服务类型
		const chatServiceType = (env.CHAT_SERVICE_TYPE || DEFAULT_CONFIG.CHAT_SERVICE) as ChatServiceType;

		// 获取当前模型的默认模型
		let currentModel: string;
		switch (chatServiceType) {
			case SERVICE_TYPES.CHAT.DEEPSEEK:
				currentModel = MODELS.CHAT.DEEPSEEK;
				break;
			case SERVICE_TYPES.CHAT.OPENAI:
				currentModel = MODELS.CHAT.OPENAI_GPT35;
				break;
			case SERVICE_TYPES.CHAT.GROQ:
				currentModel = MODELS.CHAT.GROQ_LLAMA3_70B;
				break;
			case SERVICE_TYPES.CHAT.GEMINI:
				currentModel = MODELS.CHAT.GEMINI_FLASH;
				break;
			case SERVICE_TYPES.CHAT.GLM:
				currentModel = MODELS.CHAT.GLM_4_FLASH;
				break;
			default:
				currentModel = MODELS.CHAT.GROQ_LLAMA3_70B;
		}

		// 获取模型能力配置
		const capabilities = getModelCapabilities(currentModel);
		
		// 获取支持的文件类型（用于 file input 的 accept 属性）
		const acceptTypes = getSupportedFileTypes(currentModel);
		
		// 检查是否支持文件输入
		const fileInputSupported = supportsFileInput(currentModel);

		// 获取服务名称
		const serviceNames: Record<string, string> = {
			[SERVICE_TYPES.CHAT.GROQ]: 'Groq',
			[SERVICE_TYPES.CHAT.GEMINI]: 'Google Gemini',
			[SERVICE_TYPES.CHAT.GLM]: '智谱 AI',
			[SERVICE_TYPES.CHAT.OPENAI]: 'OpenAI',
			[SERVICE_TYPES.CHAT.DEEPSEEK]: 'DeepSeek'
		};

		// 获取所有可用模型
		const availableModels = getAvailableModels();

		return json({
			// 当前模型信息
			currentModel: currentModel,
			serviceType: chatServiceType,
			serviceName: serviceNames[chatServiceType] || chatServiceType,
			modelName: capabilities.name,
			modelDescription: capabilities.description,
			// 文件输入支持
			fileInputSupported,
			acceptTypes, // 用于 file input 的 accept 属性
			// 图片能力
			supportsImage: capabilities.supportsImage,
			supportedImageTypes: capabilities.supportedImageTypes,
			// 文档能力
			supportsDocument: capabilities.supportsDocument,
			supportedDocumentTypes: capabilities.supportedDocumentTypes,
			// 所有可用模型列表
			availableModels
		});
	} catch (error) {
		console.error('Config API Error:', error);
		return json({ 
			error: '获取配置失败' 
		}, { status: 500 });
	}
};
