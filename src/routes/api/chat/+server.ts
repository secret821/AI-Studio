import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { ChatServiceFactory } from '$lib/services/chat';
import { 
	DEFAULT_CONFIG, 
	SERVICE_TYPES, 
	MODELS,
	type ChatServiceType, 
	getModelCapabilities,
	getServiceTypeByModel
} from '$lib/config/api';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message, image, modelId } = await request.json();

		if (!message && !image) {
			return json({ error: '消息不能为空' }, { status: 400 });
		}

		// 如果前端传了 modelId，使用前端指定的模型；否则使用环境变量配置
		let currentModel: string;
		let chatServiceType: ChatServiceType;
		
		if (modelId) {
			// 前端指定了模型，根据模型ID获取服务类型
			currentModel = modelId;
			const serviceType = getServiceTypeByModel(modelId);
			if (!serviceType) {
				return json({ error: `不支持的模型: ${modelId}` }, { status: 400 });
			}
			chatServiceType = serviceType;
		} else {
			// 使用环境变量配置的默认服务和模型
			chatServiceType = (env.CHAT_SERVICE_TYPE || DEFAULT_CONFIG.CHAT_SERVICE) as ChatServiceType;
			
			// 根据服务类型获取默认模型
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
		}
		
		// 根据服务类型获取对应的 API Key
		let apiKey: string | undefined;
		let serviceName: string;
		
		switch (chatServiceType) {
			case SERVICE_TYPES.CHAT.OPENAI:
				apiKey = env.OPENAI_API_KEY;
				serviceName = 'OpenAI';
				break;
			case SERVICE_TYPES.CHAT.DEEPSEEK:
				apiKey = env.DEEPSEEK_API_KEY;
				serviceName = 'DeepSeek';
				break;
			case SERVICE_TYPES.CHAT.GROQ:
				apiKey = env.GROQ_API_KEY;
				serviceName = 'Groq';
				break;
			case SERVICE_TYPES.CHAT.GEMINI:
				apiKey = env.GEMINI_API_KEY;
				serviceName = 'Google Gemini';
				break;
			case SERVICE_TYPES.CHAT.GLM:
				apiKey = env.GLM_API_KEY;
				serviceName = '智谱 AI';
				break;
			default:
				return json({ error: `不支持的聊天服务类型: ${chatServiceType}` }, { status: 400 });
		}

		if (!apiKey) {
			return json({ 
				error: `${serviceName} API Key 未配置，请在 .env 文件中添加对应的 API Key` 
			}, { status: 500 });
		}

		// 获取当前模型的能力配置
		const capabilities = getModelCapabilities(currentModel);
		
		// 创建聊天服务实例
		const chatService = ChatServiceFactory.create(chatServiceType, { apiKey });

		// 构建消息内容（支持图片）
		let messageContent: string | any[];
		let warningMessage = '';
		
		if (image && capabilities.supportsImage) {
			// 如果有图片且支持图片输入，构建多模态内容
			messageContent = [
				{
					type: 'text',
					text: message || '请分析这张图片'
				},
				{
					type: 'image_url',
					image_url: {
						url: image, // base64 data URL
						detail: 'auto'
					}
				}
			];
		} else if (image && !capabilities.supportsImage) {
			// 如果有图片但不支持图片输入，忽略图片，只发送文本（兜底逻辑）
			messageContent = message || '你好';
			warningMessage = `提示：当前使用的 ${serviceName} (${capabilities.name}) 不支持图片识别功能，已忽略图片。如需使用图片识别，请切换到 Gemini 或 OpenAI GPT-4o 服务。`;
		} else {
			// 只有文本消息
			messageContent = message;
		}

		// 发送消息
		const responseMessage = await chatService.chat([
			{ role: 'user', content: messageContent }
		]);

		// 如果有警告信息，将其添加到响应中
		const finalMessage = warningMessage 
			? `${warningMessage}\n\n${responseMessage}` 
			: responseMessage;

		return json({ message: finalMessage });
	} catch (error) {
		console.error('Chat API Error:', error);
		const errorMessage = error instanceof Error ? error.message : '聊天失败，请稍后重试';
		return json({ error: errorMessage }, { status: 500 });
	}
};
