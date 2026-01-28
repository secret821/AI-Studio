import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { imageUrl } = await request.json();

		if (!imageUrl) {
			return json({ error: '图片URL不能为空' }, { status: 400 });
		}

		// 代理下载图片
		const response = await fetch(imageUrl);
		
		if (!response.ok) {
			throw new Error('获取图片失败');
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64 = buffer.toString('base64');

		return json({ 
			data: base64,
			contentType: response.headers.get('content-type') || 'image/png'
		});
	} catch (error) {
		console.error('Download Image Proxy Error:', error);
		return json({ error: '图片下载失败' }, { status: 500 });
	}
};
