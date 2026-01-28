/**
 * 模型选择 Store
 * 使用 Svelte 5 runes 管理当前选中的模型
 */

import { getModelCapabilities } from '$lib/config/api';

export type AvailableModel = {
	id: string;
	name: string;
	serviceType: string;
	serviceName: string;
	description: string;
	supportsImage: boolean;
	supportsDocument: boolean;
	isFree: boolean;
	speed: 'fast' | 'normal' | 'slow';
};

class ModelStore {
	currentModelId = $state<string>('llama-3.3-70b-versatile'); // 默认模型
	availableModels = $state<AvailableModel[]>([]);
	
	// 获取当前选中的模型详情
	get currentModel(): AvailableModel | undefined {
		return this.availableModels.find(m => m.id === this.currentModelId);
	}
	
	// 获取当前模型支持的文件类型（用于 file input 的 accept 属性）
	get acceptTypes(): string {
		const capabilities = getModelCapabilities(this.currentModelId);
		const allTypes = [
			...capabilities.supportedImageTypes,
			...capabilities.supportedDocumentTypes
		];
		return allTypes.join(',');
	}
	
	// 设置可用模型列表
	setAvailableModels(models: AvailableModel[]) {
		this.availableModels = models;
	}
	
	// 切换模型
	selectModel(modelId: string) {
		const model = this.availableModels.find(m => m.id === modelId);
		if (model) {
			this.currentModelId = modelId;
		}
	}
}

export const modelStore = new ModelStore();
