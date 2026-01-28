/**
 * 聊天服务抽象层
 * 支持多种聊天模型的统一接口
 */

import { API_ENDPOINTS, MODELS, SERVICE_TYPES, type ChatServiceType } from '$lib/config/api';
import { httpPost } from '$lib/utils/http';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | MessageContent[];
}

export interface MessageContent {
	type: 'text' | 'image_url';
	text?: string;
	image_url?: {
		url: string;
		detail?: 'auto' | 'low' | 'high';
	};
}

export interface ChatOptions {
	temperature?: number;
	maxTokens?: number;
	model?: string;
}

export interface ChatService {
	chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
}

/**
 * 服务配置接口
 */
interface ServiceConfig {
	endpoint: string;
	defaultModel: string;
	serviceName: string;
}

/**
 * OpenAI 兼容的聊天服务（通用实现）
 * 支持: OpenAI, DeepSeek, Groq, GLM 等使用 OpenAI 格式的服务
 */
export class OpenAICompatibleChatService implements ChatService {
	constructor(
		private apiKey: string,
		private config: ServiceConfig
	) {}

	async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
		const response = await httpPost(
			`${this.config.endpoint}/chat/completions`,
			{
				model: options?.model || this.config.defaultModel,
				messages: messages,
				temperature: options?.temperature ?? 0.7,
				max_tokens: options?.maxTokens ?? 2000
			},
			{
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				}
			}
		);

		const message = response.data?.choices?.[0]?.message?.content;
		if (!message) {
			throw new Error(`${this.config.serviceName} 返回的消息为空`);
		}

		return message;
	}
}

/**
 * Google Gemini 聊天服务（免费）
 * Gemini 使用不同的 API 格式，需要单独实现
 */
export class GeminiChatService implements ChatService {
	constructor(private apiKey: string) {}

	async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
		const model = options?.model || MODELS.CHAT.GEMINI_FLASH;
		
		// 转换消息格式为 Gemini 格式
		const contents = messages.map(msg => {
			// 如果 content 是数组（多模态：文本+图片）
			if (Array.isArray(msg.content)) {
				const parts = msg.content.map(item => {
					if (item.type === 'text') {
						return { text: item.text || '' };
					} else if (item.type === 'image_url' && item.image_url) {
						// Gemini 支持 base64 图片
						const base64Data = item.image_url.url.split(',')[1]; // 移除 data:image/xxx;base64, 前缀
						const mimeType = item.image_url.url.match(/data:(image\/[^;]+);/)?.[1] || 'image/jpeg';
						return {
							inline_data: {
								mime_type: mimeType,
								data: base64Data
							}
						};
					}
					return { text: '' };
				});
				
				return {
					role: msg.role === 'assistant' ? 'model' : 'user',
					parts
				};
			}
			
			// 如果 content 是字符串（纯文本）
			return {
				role: msg.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: msg.content as string }]
			};
		});

		// Gemini API 的正确调用方式
		const url = `${API_ENDPOINTS.CHAT.GEMINI}/models/${model}:generateContent?key=${this.apiKey}`;
		
		const response = await httpPost(
			url,
			{
				contents,
				generationConfig: {
					temperature: options?.temperature ?? 0.7,
					maxOutputTokens: options?.maxTokens ?? 2000
				}
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		const message = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!message) {
			throw new Error('Gemini 返回的消息为空');
		}

		return message;
	}
}

/**
 * 聊天服务配置映射
 */
const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
	[SERVICE_TYPES.CHAT.DEEPSEEK]: {
		endpoint: API_ENDPOINTS.CHAT.DEEPSEEK,
		defaultModel: MODELS.CHAT.DEEPSEEK,
		serviceName: 'DeepSeek'
	},
	[SERVICE_TYPES.CHAT.OPENAI]: {
		endpoint: API_ENDPOINTS.CHAT.OPENAI,
		defaultModel: MODELS.CHAT.OPENAI_GPT35,
		serviceName: 'OpenAI'
	},
	[SERVICE_TYPES.CHAT.GROQ]: {
		endpoint: API_ENDPOINTS.CHAT.GROQ,
		defaultModel: MODELS.CHAT.GROQ_LLAMA3_70B,
		serviceName: 'Groq'
	},
	[SERVICE_TYPES.CHAT.GLM]: {
		endpoint: API_ENDPOINTS.CHAT.GLM,
		defaultModel: MODELS.CHAT.GLM_4_FLASH,
		serviceName: '智谱 AI'
	}
};

/**
 * 聊天服务工厂
 */
export class ChatServiceFactory {
	static create(type: ChatServiceType, config: { apiKey: string }): ChatService {
		// Gemini 使用不同的 API 格式，单独处理
		if (type === SERVICE_TYPES.CHAT.GEMINI) {
			return new GeminiChatService(config.apiKey);
		}

		// 其他服务使用 OpenAI 兼容格式
		const serviceConfig = SERVICE_CONFIGS[type];
		if (!serviceConfig) {
			throw new Error(`不支持的聊天服务类型: ${type}`);
		}

		return new OpenAICompatibleChatService(config.apiKey, serviceConfig);
	}
}
