import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { imageBase64, width, height } = await request.json();

		if (!imageBase64) {
			return json({ error: '图片数据不能为空' }, { status: 400 });
		}

		// 检查 API key 是否配置
		if (!env.OPENAI_API_KEY) {
			return json({ error: 'OpenAI API Key 未配置，请在 .env 文件中添加 OPENAI_API_KEY' }, { status: 500 });
		}

		// 使用 OpenAI GPT-4 Vision 来分析图片（DeepSeek 不支持图片输入）
		const client = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: 'https://api.openai.com/v1'
		});

		const systemPrompt = `请仔细分析这张图片的所有细节，然后直接输出一个用于 AI 图片生成的详细提示词。

要求：
1. 直接输出提示词内容，不要任何前缀、解释或额外说明
2. 描述要详细具体，包括：主体、风格、颜色、构图、光线、质感等
3. 使用中文输出

现在请直接输出提示词：`;

		const completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: systemPrompt
						},
						{
							type: 'image_url',
							image_url: {
								url: `data:image/jpeg;base64,${imageBase64}`
							}
						}
					]
				}
			],
			temperature: 0.7,
			max_tokens: 1000
		});

		let prompt = completion.choices[0]?.message?.content || '无法生成提示词';

		// 清理常见的前缀
		const prefixesToRemove = [
			'根据图片，',
			'这张图片',
			'图片显示',
			'提示词：',
			'提示词:',
			'Prompt:',
			'Prompt：',
			'生成提示词：',
			'以下是提示词：',
			'我生成的提示词是：',
			'这是提示词：',
		];

		for (const prefix of prefixesToRemove) {
			if (prompt.startsWith(prefix)) {
				prompt = prompt.substring(prefix.length).trim();
			}
		}

		// 移除首尾的引号
		prompt = prompt.replace(/^["']|["']$/g, '').trim();

		return json({ prompt });
	} catch (error) {
		console.error('Analyze Image API Error:', error);
		return json({ error: '图片分析失败，请稍后重试' }, { status: 500 });
	}
};
