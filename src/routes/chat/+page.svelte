<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { modelStore } from '$lib/stores/model.svelte';
	
	type Message = {
		role: 'user' | 'assistant';
		content: string;
		id: string;
		// 用户上传的图片（base64）
		imageUrl?: string;
		// 文件名（用于显示）
		fileName?: string;
		// 文件类型（用于显示图标）
		fileType?: string;
	};

	let messages = $state<Message[]>([]);
	let input = $state('');
	let isLoading = $state(false);
	let messagesContainer: HTMLDivElement;
	let fileInput: HTMLInputElement;
	let selectedImage = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let showModelSelector = $state(false);
	let isLoadingConfig = $state(true);
	let hasLoadedConfig = $state(false);

	// 初始化：加载可用模型列表
	$effect(() => {
		if (!hasLoadedConfig) {
			hasLoadedConfig = true;
			
			(async () => {
				try {
					const response = await fetch('/api/chat/config');
					
					if (response.ok) {
						const data = await response.json();
						
						// 设置可用模型列表
						if (data.availableModels && Array.isArray(data.availableModels)) {
							modelStore.setAvailableModels(data.availableModels);
						}
						
						// 设置默认选中的模型
						if (data.currentModel) {
							modelStore.selectModel(data.currentModel);
						}
						
						isLoadingConfig = false;
					} else {
						toast.error('加载模型列表失败');
						isLoadingConfig = false;
					}
				} catch (error) {
					toast.error('加载模型列表失败');
					isLoadingConfig = false;
				}
			})();
		}
	});

	// 监听点击外部关闭下拉菜单
	$effect(() => {
		const handleClick = (event: MouseEvent) => {
			if (showModelSelector) {
				const target = event.target as HTMLElement;
				if (!target.closest('.model-selector-container')) {
					showModelSelector = false;
				}
			}
		};
		
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});

	// 切换模型
	function handleModelChange(modelId: string) {
		modelStore.selectModel(modelId);
		showModelSelector = false;
		toast.success(`已切换到 ${modelStore.currentModel?.name}`, 2000);
	}

	// 自动滚动到底部
	function scrollToBottom() {
		if (messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	}

	// 处理文件选择
	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;
		
		const currentModel = modelStore.currentModel;
		
		// 检查文件类型是否被当前模型支持
		const isImage = file.type.startsWith('image/');
		const isDocument = file.type.startsWith('application/') || file.type.startsWith('text/');
		
		if (isImage && currentModel && !currentModel.supportsImage) {
			toast.error(`当前模型 ${currentModel.name} 不支持图片，请切换到支持的模型`);
			target.value = '';
			return;
		}
		
		if (isDocument && currentModel && !currentModel.supportsDocument) {
			toast.error(`当前模型 ${currentModel.name} 不支持文档，请切换到 Gemini 模型`);
			target.value = '';
			return;
		}
		
		if (!isImage && !isDocument) {
			toast.error('不支持的文件类型');
			target.value = '';
			return;
		}
		
		// 检查文件大小（限制10MB）
		if (file.size > 10 * 1024 * 1024) {
			toast.error('文件大小不能超过10MB');
			target.value = '';
			return;
		}
		
		// 读取文件为 base64（图片和文档都需要）
		const reader = new FileReader();
		reader.onload = (e) => {
			selectedImage = e.target?.result as string; // 所有文件都转为 base64
			selectedFile = file;
			
			if (!isImage) {
				toast.success(`已选择文件: ${file.name}`);
			}
		};
		reader.readAsDataURL(file);
		
		// 重置input
		target.value = '';
	}

	// 移除选中的图片
	function removeSelectedImage() {
		selectedImage = null;
		selectedFile = null;
	}

	async function sendMessage(userMessage: string, imageData?: string) {
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					message: userMessage,
					image: imageData, // 发送base64图片数据
					modelId: modelStore.currentModelId // 发送当前选中的模型ID
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || '请求失败');
			}
			
			const data = await response.json();
			messages = [...messages, { 
				role: 'assistant', 
				content: data.message,
				id: Math.random().toString(36).substring(2, 9)
			}];
			scrollToBottom();
		} catch (error) {
			console.error('Error:', error);
			const errorMessage = error instanceof Error ? error.message : '抱歉，发生了错误。请稍后再试。';
			messages = [...messages, { 
				role: 'assistant', 
				content: errorMessage,
				id: Math.random().toString(36).substring(2, 9)
			}];
			toast.error(errorMessage);
			scrollToBottom();
		} finally {
			isLoading = false;
		}
	}

	function handleSubmit() {
		if ((!input.trim() && !selectedImage && !selectedFile) || isLoading) return;
		
		// 确定默认消息
		let defaultMessage = '你好';
		if (selectedFile) {
			const isImage = selectedFile.type.startsWith('image/');
			defaultMessage = isImage ? '请分析这张图片' : '请分析这个文件';
		}
		
		const userMessage: Message = { 
			role: 'user', 
			content: input || defaultMessage,
			id: Math.random().toString(36).substring(2, 9),
			imageUrl: selectedFile?.type.startsWith('image/') ? selectedImage || undefined : undefined,
			fileName: selectedFile?.name,
			fileType: selectedFile?.type
		};
		
		messages = [...messages, userMessage];
		isLoading = true;
		scrollToBottom();
		
		sendMessage(input || defaultMessage, selectedImage || undefined);
		input = '';
		removeSelectedImage();
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<!-- 全屏聊天布局 -->
<div class="fixed inset-0 top-14 flex flex-col bg-white">
	<!-- 消息区域 -->
	<div 
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto px-4 py-8 pb-24"
	>
		<div class="max-w-4xl mx-auto h-full flex flex-col">
			{#if messages.length === 0}
				<div class="flex-1 flex flex-col items-center justify-center text-center px-4">
					<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900 mb-2">开始对话</h2>
					<p class="text-sm text-gray-500">输入消息，与 AI 助手开始交流</p>
				</div>
			{:else}
				<div class="space-y-6">
				{#each messages as message (message.id)}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="flex items-start gap-2 max-w-[80%]">
							{#if message.role === 'assistant'}
								<div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
									</svg>
								</div>
							{/if}
							
							<div class="rounded-lg px-4 py-2.5 text-sm {message.role === 'user'
									? 'bg-gray-900 text-white'
									: 'bg-gray-100 text-gray-900'}">
								{#if message.imageUrl}
									<img src={message.imageUrl} alt="上传的图片" class="max-w-xs rounded-lg mb-2" />
								{:else if message.fileName && message.fileType}
									<!-- 文档文件显示 -->
									<div class="flex items-center gap-2 px-3 py-2 {message.role === 'user' ? 'bg-gray-800' : 'bg-white'} rounded-lg mb-2 border {message.role === 'user' ? 'border-gray-700' : 'border-gray-200'}">
										<svg class="w-5 h-5 {message.role === 'user' ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										<span class="text-xs truncate {message.role === 'user' ? 'text-gray-300' : 'text-gray-600'}">{message.fileName}</span>
									</div>
								{/if}
								<p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
							</div>
							
							{#if message.role === 'user'}
								<div class="w-7 h-7 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
							{/if}
						</div>
					</div>
				{/each}
				
				{#if isLoading}
					<div class="flex justify-start">
						<div class="flex items-start gap-2 max-w-[80%]">
							<div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
							</div>
							<div class="rounded-lg px-4 py-2.5 bg-gray-100 text-sm">
								<div class="flex items-center gap-2">
									<div class="flex gap-1">
										<div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
										<div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
										<div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
									</div>
									<span class="text-gray-600">思考中...</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
			{/if}
		</div>
	</div>

	<!-- 吸底输入框 -->
	<div class="bg-white border-t border-gray-200">
		<div class="max-w-3xl mx-auto px-4 py-4">
			<!-- 隐藏的文件输入 -->
			<input
				type="file"
				bind:this={fileInput}
				onchange={handleFileSelect}
				accept={modelStore.acceptTypes || 'image/*'}
				class="hidden"
			/>
			
			<!-- 模型选择器 -->
			{#if !isLoadingConfig && modelStore.availableModels.length > 0}
				<div class="mb-3 relative model-selector-container">
					<button
						type="button"
						onclick={() => showModelSelector = !showModelSelector}
						class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors text-sm w-full"
					>
						<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
						</svg>
						<span class="text-gray-700 flex-1 text-left">
							{modelStore.currentModel?.name || '选择模型'}
							{#if modelStore.currentModel?.supportsImage}
								<span class="text-green-600 text-xs ml-1">✓图片</span>
							{/if}
							{#if modelStore.currentModel?.supportsDocument}
								<span class="text-blue-600 text-xs ml-1">✓文档</span>
							{/if}
						</span>
						<svg class="w-4 h-4 text-gray-500 {showModelSelector ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					<!-- 模型列表下拉 -->
					{#if showModelSelector}
						<div class="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
							{#each modelStore.availableModels as model (model.id)}
								<button
									type="button"
									onclick={() => handleModelChange(model.id)}
									class="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors {modelStore.currentModelId === model.id ? 'bg-blue-50' : ''}"
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<span class="font-medium text-gray-900">{model.name}</span>
												{#if model.isFree}
													<span class="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">免费</span>
												{/if}
												{#if model.speed === 'fast'}
													<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">⚡快速</span>
												{/if}
											</div>
											<p class="text-xs text-gray-500 mt-1">{model.description}</p>
											<div class="flex gap-2 mt-1">
												{#if model.supportsImage}
													<span class="text-xs text-green-600">✓ 图片</span>
												{/if}
												{#if model.supportsDocument}
													<span class="text-xs text-blue-600">✓ 文档</span>
												{/if}
												{#if !model.supportsImage && !model.supportsDocument}
													<span class="text-xs text-gray-400">仅文本</span>
												{/if}
											</div>
										</div>
										{#if modelStore.currentModelId === model.id}
											<svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
											</svg>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- 文件预览 -->
			{#if selectedFile}
				{#if selectedFile.type.startsWith('image/')}
					<!-- 图片预览 -->
					<div class="mb-3 relative inline-block">
						<img src={selectedImage} alt="预览" class="max-w-xs max-h-40 rounded-lg border border-gray-300" />
						<button
							type="button"
							onclick={removeSelectedImage}
							class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
							aria-label="移除文件"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{:else}
					<!-- 文档文件名显示 -->
					<div class="mb-3 flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
						<svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span class="flex-1 text-sm text-gray-700 truncate">{selectedFile.name}</span>
						<button
							type="button"
							onclick={removeSelectedImage}
							class="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
							aria-label="移除文件"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/if}
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="relative">
				<!-- 输入框容器 -->
				<div class="flex items-end gap-2 bg-white rounded-3xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow px-4 py-3">
					<!-- 左侧添加按钮 -->
					<button
						type="button"
						onclick={() => fileInput?.click()}
						class="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors {modelStore.currentModel && !modelStore.currentModel.supportsImage && !modelStore.currentModel.supportsDocument ? 'opacity-50 cursor-not-allowed' : ''}"
						title={modelStore.currentModel 
							? (modelStore.currentModel.supportsImage || modelStore.currentModel.supportsDocument
								? `上传文件（${modelStore.currentModel.name}）${modelStore.currentModel.supportsImage ? '\n✓ 图片' : ''}${modelStore.currentModel.supportsDocument ? '\n✓ 文档' : ''}` 
								: `当前 ${modelStore.currentModel.name} 不支持文件输入`)
							: '上传文件'}
						disabled={isLoading || (modelStore.currentModel && !modelStore.currentModel.supportsImage && !modelStore.currentModel.supportsDocument)}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
					</button>

					<!-- 文本输入框 -->
					<textarea
						bind:value={input}
						onkeypress={handleKeyPress}
						disabled={isLoading}
						placeholder="有问题，尽管问"
						rows="1"
						class="flex-1 resize-none bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400
							focus:outline-none disabled:text-gray-400 max-h-32 py-1"
					></textarea>

					<!-- 右侧按钮组 -->
					<div class="flex items-center gap-1 flex-shrink-0">

						<!-- 发送按钮 -->
						<button
							type="submit"
							disabled={isLoading || !input.trim()}
							class="p-1.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
							title="发送"
						>
							{#if isLoading}
								<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</form>

			<!-- 底部提示 -->
			<div class="text-xs text-gray-500 text-center mt-3 space-y-1">
				<p>AI 也可能会犯错。请核查重要信息。</p>
				{#if modelStore.currentModel}
					<p class="text-gray-400">
						当前模型：<span class="font-medium">{modelStore.currentModel.name}</span> ({modelStore.currentModel.serviceName})
						{#if modelStore.currentModel.isFree}
							<span class="text-green-600">· 免费</span>
						{/if}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
