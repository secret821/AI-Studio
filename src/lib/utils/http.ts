/**
 * 通用 HTTP 请求工具
 * 提供统一的请求封装、错误处理、超时控制
 */

import { DEFAULT_CONFIG } from '$lib/config/api';

export interface HttpRequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers?: Record<string, string>;
	body?: any;
	timeout?: number;
	retries?: number;
}

export interface HttpResponse<T = any> {
	data: T;
	status: number;
	headers: Headers;
}

export class HttpError extends Error {
	constructor(
		message: string,
		public status: number,
		public response?: any
	) {
		super(message);
		this.name = 'HttpError';
	}
}

/**
 * 带超时控制的 fetch
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit,
	timeout: number
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		if (error instanceof Error && error.name === 'AbortError') {
			throw new HttpError('请求超时', 408);
		}
		throw error;
	}
}

/**
 * 通用 HTTP 请求方法
 */
export async function httpRequest<T = any>(
	url: string,
	options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
	const {
		method = 'GET',
		headers = {},
		body,
		timeout = DEFAULT_CONFIG.REQUEST_TIMEOUT,
		retries = 0
	} = options;

	const requestHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...headers
	};

	const requestOptions: RequestInit = {
		method,
		headers: requestHeaders
	};

	if (body && method !== 'GET') {
		requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
	}

	let lastError: Error | null = null;

	// 重试逻辑
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetchWithTimeout(url, requestOptions, timeout);

			// 检查响应状态
			if (!response.ok) {
				const errorText = await response.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = errorText;
				}

				throw new HttpError(
					`HTTP ${response.status}: ${response.statusText}`,
					response.status,
					errorData
				);
			}

			// 解析响应
			const data = await response.json();

			return {
				data,
				status: response.status,
				headers: response.headers
			};
		} catch (error) {
			lastError = error as Error;

			// 如果是最后一次尝试，或者是客户端错误（4xx），不再重试
			if (
				attempt === retries ||
				(error instanceof HttpError && error.status >= 400 && error.status < 500)
			) {
				break;
			}

			// 等待后重试（指数退避）
			await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
		}
	}

	throw lastError;
}

/**
 * GET 请求
 */
export async function httpGet<T = any>(
	url: string,
	options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
	return httpRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export async function httpPost<T = any>(
	url: string,
	body?: any,
	options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
	return httpRequest<T>(url, { ...options, method: 'POST', body });
}

/**
 * PUT 请求
 */
export async function httpPut<T = any>(
	url: string,
	body?: any,
	options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
	return httpRequest<T>(url, { ...options, method: 'PUT', body });
}

/**
 * DELETE 请求
 */
export async function httpDelete<T = any>(
	url: string,
	options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
	return httpRequest<T>(url, { ...options, method: 'DELETE' });
}
