import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { ImageGeneratorFactory } from '$lib/services/image-generator';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, width, height } = await request.json();

		if (!prompt) {
			return json({ error: '提示词不能为空' }, { status: 400 });
		}

		// 检查 API key 是否配置
		if (!env.OPENAI_API_KEY) {
			return json({ error: 'OpenAI API Key 未配置' }, { status: 500 });
		}

		// 创建图片生成服务实例
		const generator = ImageGeneratorFactory.create(env.OPENAI_API_KEY);

		// 生成图片
		const imageUrl = await generator.generate(prompt, {
			width: width || 1024,
			height: height || 1024,
			quality: 'standard'
		});

		return json({ imageUrl });
	} catch (error) {
		console.error('Generate Image API Error:', error);
		const errorMessage = error instanceof Error ? error.message : '图片生成失败，请稍后重试';
		return json({ error: errorMessage }, { status: 500 });
	}
};
