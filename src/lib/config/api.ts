/**
 * API 配置常量
 * 统一管理所有 API 端点和模型配置
 */

// ==================== API 端点配置 ====================

export const API_ENDPOINTS = {
	// 聊天服务
	CHAT: {
		DEEPSEEK: 'https://api.deepseek.com',
		OPENAI: 'https://api.openai.com/v1',
		GROQ: 'https://api.groq.com/openai/v1',
		GEMINI: 'https://generativelanguage.googleapis.com/v1',
		GLM: 'https://open.bigmodel.cn/api/paas/v4'
	},
	// 图片生成服务
	IMAGE_GENERATION: {
		OPENAI: 'https://api.openai.com/v1/images/generations'
	},
	// 图片分析服务
	IMAGE_ANALYSIS: {
		OPENAI: 'https://api.openai.com/v1/chat/completions'
	}
} as const;

// ==================== 模型配置 ====================

export const MODELS = {
	// 聊天模型
	CHAT: {
		DEEPSEEK: 'deepseek-chat',
		OPENAI_GPT4: 'gpt-4',
		OPENAI_GPT35: 'gpt-3.5-turbo',
		// Groq 模型 (已更新为最新可用模型)
		GROQ_LLAMA3_70B: 'llama-3.3-70b-versatile', // 新版本 Llama 3.3
		GROQ_LLAMA3_8B: 'llama-3.1-8b-instant',
		GROQ_MIXTRAL: 'mixtral-8x7b-32768',
		GROQ_GEMMA2: 'gemma2-9b-it', // 新增 Gemma 2
		GEMINI_FLASH: 'gemini-1.5-flash',
		GEMINI_PRO: 'gemini-1.5-pro',
		GLM_4: 'glm-4',
		GLM_4_FLASH: 'glm-4-flash'
	},
	// 图片分析模型
	IMAGE_ANALYSIS: {
		GPT4_VISION: 'gpt-4o-mini',
		GPT4O: 'gpt-4o'
	},
	// 图片生成模型
	IMAGE_GENERATION: {
		DALL_E_3: 'dall-e-3',
		DALL_E_2: 'dall-e-2'
	}
} as const;

// ==================== 模型能力配置 ====================

/**
 * 定义每个模型支持的文件类型和能力
 */
export interface ModelCapabilities {
	// 模型名称
	name: string;
	// 是否支持图片输入
	supportsImage: boolean;
	// 支持的图片 MIME 类型
	supportedImageTypes: string[];
	// 是否支持文档输入
	supportsDocument: boolean;
	// 支持的文档 MIME 类型
	supportedDocumentTypes: string[];
	// 模型描述
	description: string;
}

/**
 * 所有模型的能力配置
 */
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
	// ==================== Gemini 系列 ====================
	'gemini-1.5-flash': {
		name: 'Gemini 1.5 Flash',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
		supportsDocument: true,
		supportedDocumentTypes: ['application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'],
		description: 'Google Gemini 快速版，支持图片和文档'
	},
	'gemini-1.5-pro': {
		name: 'Gemini 1.5 Pro',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
		supportsDocument: true,
		supportedDocumentTypes: ['application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'],
		description: 'Google Gemini 专业版，支持图片和文档'
	},

	// ==================== OpenAI GPT-4 Vision 系列 ====================
	'gpt-4o': {
		name: 'GPT-4o',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'OpenAI GPT-4o，支持图片输入'
	},
	'gpt-4o-mini': {
		name: 'GPT-4o Mini',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'OpenAI GPT-4o Mini，支持图片输入'
	},
	'gpt-4-vision-preview': {
		name: 'GPT-4 Vision',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'OpenAI GPT-4 Vision 预览版，支持图片输入'
	},
	'gpt-4': {
		name: 'GPT-4',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'OpenAI GPT-4，仅支持纯文本'
	},
	'gpt-3.5-turbo': {
		name: 'GPT-3.5 Turbo',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'OpenAI GPT-3.5 Turbo，仅支持纯文本'
	},

	// ==================== 智谱 GLM 系列 ====================
	'glm-4': {
		name: 'GLM-4',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: '智谱 GLM-4，仅支持纯文本'
	},
	'glm-4-flash': {
		name: 'GLM-4 Flash',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: '智谱 GLM-4 快速版，仅支持纯文本'
	},
	'glm-4v': {
		name: 'GLM-4V',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: '智谱 GLM-4V，支持图片输入'
	},

	// ==================== Groq 系列 ====================
	'llama-3.3-70b-versatile': {
		name: 'Llama 3.3 70B',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Llama 3.3 70B，仅支持纯文本'
	},
	'llama-3.1-8b-instant': {
		name: 'Llama 3.1 8B',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Llama 3.1 8B，仅支持纯文本'
	},
	'mixtral-8x7b-32768': {
		name: 'Mixtral 8x7B',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Mixtral 8x7B，仅支持纯文本'
	},
	'gemma2-9b-it': {
		name: 'Gemma 2 9B',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Gemma 2 9B，仅支持纯文本'
	},
	'llama-3.2-11b-vision-preview': {
		name: 'Llama 3.2 11B Vision',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Llama 3.2 11B Vision，支持图片输入'
	},
	'llama-3.2-90b-vision-preview': {
		name: 'Llama 3.2 90B Vision',
		supportsImage: true,
		supportedImageTypes: ['image/jpeg', 'image/png'],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'Groq Llama 3.2 90B Vision，支持图片输入'
	},

	// ==================== DeepSeek 系列 ====================
	'deepseek-chat': {
		name: 'DeepSeek Chat',
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: 'DeepSeek Chat，仅支持纯文本'
	}
} as const;

/**
 * 获取模型能力配置
 */
export function getModelCapabilities(model: string): ModelCapabilities {
	return MODEL_CAPABILITIES[model] || {
		name: model,
		supportsImage: false,
		supportedImageTypes: [],
		supportsDocument: false,
		supportedDocumentTypes: [],
		description: '未知模型'
	};
}

/**
 * 获取模型支持的所有文件类型（用于 file input 的 accept 属性）
 */
export function getSupportedFileTypes(model: string): string {
	const capabilities = getModelCapabilities(model);
	const allTypes = [
		...capabilities.supportedImageTypes,
		...capabilities.supportedDocumentTypes
	];
	return allTypes.join(',') || '';
}

/**
 * 检查模型是否支持文件输入
 */
export function supportsFileInput(model: string): boolean {
	const capabilities = getModelCapabilities(model);
	return capabilities.supportsImage || capabilities.supportsDocument;
}

/**
 * 模型与服务的映射关系
 */
export interface AvailableModel {
	id: string;
	name: string;
	serviceType: ChatServiceType;
	serviceName: string;
	description: string;
	supportsImage: boolean;
	supportsDocument: boolean;
	isFree: boolean; // 是否免费
	speed: 'fast' | 'normal' | 'slow'; // 速度
}

/**
 * 获取所有可用的聊天模型
 */
export function getAvailableModels(): AvailableModel[] {
	return [
		// Groq 系列（免费、快速）
		{
			id: MODELS.CHAT.GROQ_LLAMA3_70B,
			name: 'Llama 3.3 70B',
			serviceType: SERVICE_TYPES.CHAT.GROQ,
			serviceName: 'Groq',
			description: 'Meta 最新大模型，速度极快（免费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.GROQ_LLAMA3_8B,
			name: 'Llama 3.1 8B',
			serviceType: SERVICE_TYPES.CHAT.GROQ,
			serviceName: 'Groq',
			description: '轻量快速模型（免费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.GROQ_MIXTRAL,
			name: 'Mixtral 8x7B',
			serviceType: SERVICE_TYPES.CHAT.GROQ,
			serviceName: 'Groq',
			description: 'Mixtral 混合专家模型（免费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.GROQ_GEMMA2,
			name: 'Gemma 2 9B',
			serviceType: SERVICE_TYPES.CHAT.GROQ,
			serviceName: 'Groq',
			description: 'Google Gemma 2（免费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'fast'
		},
		
		// Gemini 系列（免费、支持多模态）
		{
			id: MODELS.CHAT.GEMINI_FLASH,
			name: 'Gemini 1.5 Flash',
			serviceType: SERVICE_TYPES.CHAT.GEMINI,
			serviceName: 'Google',
			description: 'Google 最新模型，支持图片和文档（免费）',
			supportsImage: true,
			supportsDocument: true,
			isFree: true,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.GEMINI_PRO,
			name: 'Gemini 1.5 Pro',
			serviceType: SERVICE_TYPES.CHAT.GEMINI,
			serviceName: 'Google',
			description: 'Google 专业版，功能强大（免费）',
			supportsImage: true,
			supportsDocument: true,
			isFree: true,
			speed: 'normal'
		},
		
		// 智谱 AI 系列（有免费额度）
		{
			id: MODELS.CHAT.GLM_4_FLASH,
			name: 'GLM-4 Flash',
			serviceType: SERVICE_TYPES.CHAT.GLM,
			serviceName: '智谱AI',
			description: '智谱快速版，中文能力强（有免费额度）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.GLM_4,
			name: 'GLM-4',
			serviceType: SERVICE_TYPES.CHAT.GLM,
			serviceName: '智谱AI',
			description: '智谱标准版，中文能力强（有免费额度）',
			supportsImage: false,
			supportsDocument: false,
			isFree: true,
			speed: 'normal'
		},
		
		// OpenAI 系列（付费）
		{
			id: MODELS.CHAT.OPENAI_GPT35,
			name: 'GPT-3.5 Turbo',
			serviceType: SERVICE_TYPES.CHAT.OPENAI,
			serviceName: 'OpenAI',
			description: 'OpenAI 经典模型（付费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: false,
			speed: 'fast'
		},
		{
			id: MODELS.CHAT.OPENAI_GPT4,
			name: 'GPT-4',
			serviceType: SERVICE_TYPES.CHAT.OPENAI,
			serviceName: 'OpenAI',
			description: 'OpenAI 强大模型（付费）',
			supportsImage: false,
			supportsDocument: false,
			isFree: false,
			speed: 'normal'
		},
		{
			id: 'gpt-4o',
			name: 'GPT-4o',
			serviceType: SERVICE_TYPES.CHAT.OPENAI,
			serviceName: 'OpenAI',
			description: 'OpenAI 多模态模型，支持图片（付费）',
			supportsImage: true,
			supportsDocument: false,
			isFree: false,
			speed: 'normal'
		},
		
		// DeepSeek 系列（付费）
		{
			id: MODELS.CHAT.DEEPSEEK,
			name: 'DeepSeek Chat',
			serviceType: SERVICE_TYPES.CHAT.DEEPSEEK,
			serviceName: 'DeepSeek',
			description: 'DeepSeek 模型（需要余额）',
			supportsImage: false,
			supportsDocument: false,
			isFree: false,
			speed: 'normal'
		}
	];
}

/**
 * 根据模型ID获取服务类型
 */
export function getServiceTypeByModel(modelId: string): ChatServiceType | null {
	const models = getAvailableModels();
	const model = models.find(m => m.id === modelId);
	return model?.serviceType || null;
}

// ==================== 服务类型 ====================

export const SERVICE_TYPES = {
	CHAT: {
		DEEPSEEK: 'deepseek',
		OPENAI: 'openai',
		GROQ: 'groq',
		GEMINI: 'gemini',
		GLM: 'glm'
	}
} as const;

// ==================== HTTP 配置 ====================

export const HTTP_TIMEOUT = 60000; // 60 秒
export const HTTP_RETRIES = 3;
export const HTTP_RETRY_DELAY_MS = 1000; // 1 秒

// ==================== 默认配置 ====================

export const DEFAULT_CONFIG = {
	// 默认聊天服务（推荐使用免费的 Groq）
	CHAT_SERVICE: SERVICE_TYPES.CHAT.GROQ,
	// 请求超时时间（毫秒）
	REQUEST_TIMEOUT: HTTP_TIMEOUT,
	// 重试次数
	MAX_RETRIES: HTTP_RETRIES
} as const;

// ==================== 类型导出 ====================

export type ChatServiceType = typeof SERVICE_TYPES.CHAT[keyof typeof SERVICE_TYPES.CHAT];
