/**
 * 图片生成服务
 * 使用 OpenAI DALL-E 3 生成图片
 */

import { API_ENDPOINTS, MODELS } from '$lib/config/api';

export interface ImageGeneratorService {
	generate(prompt: string, options?: ImageGenerateOptions): Promise<string>;
}

export interface ImageGenerateOptions {
	width?: number;
	height?: number;
	quality?: 'standard' | 'hd';
	style?: string;
	model?: string;
}

/**
 * OpenAI DALL-E 图片生成服务
 */
export class OpenAIImageGenerator implements ImageGeneratorService {
	constructor(private apiKey: string) {}

	async generate(prompt: string, options?: ImageGenerateOptions): Promise<string> {
		const { default: OpenAI } = await import('openai');
		
		const client = new OpenAI({
			apiKey: this.apiKey,
			baseURL: API_ENDPOINTS.CHAT.OPENAI
		});

		const size = this.getSize(options?.width, options?.height);
		
		const response = await client.images.generate({
			model: options?.model || MODELS.IMAGE_GENERATION.DALL_E_3,
			prompt: prompt,
			n: 1,
			size: size as '1024x1024' | '1792x1024' | '1024x1792',
			quality: options?.quality || 'standard'
		});

		const imageUrl = response.data?.[0]?.url;

		if (!imageUrl) {
			throw new Error('未能生成图片');
		}

		return imageUrl;
	}

	private getSize(width?: number, height?: number): string {
		// DALL-E 3 只支持特定尺寸
		if (width && height) {
			if (width > height) return '1792x1024';
			if (height > width) return '1024x1792';
		}
		return '1024x1024';
	}
}

/**
 * 图片生成服务工厂
 */
export class ImageGeneratorFactory {
	static create(apiKey: string): ImageGeneratorService {
		if (!apiKey) {
			throw new Error('OpenAI API Key 是必需的');
		}
		return new OpenAIImageGenerator(apiKey);
	}
}
