<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import copy from 'copy-to-clipboard';
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

	type ImageTask = {
		id: string;
		file: File;
		preview: string;
		status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'error';
		prompt?: string;
		generatedImageUrl?: string;
		error?: string;
		isGeneratingImage?: boolean;
	};

	let images = $state<ImageTask[]>([]);
	let isProcessing = $state(false);
	let isDownloading = $state(false);
	let downloadProgress = $state('');
	let fileInput: HTMLInputElement;

	// Melt UI Dialog for clear confirmation
	const {
		elements: { trigger, overlay, content: dialogContent, title: dialogTitle, description, close, portalled },
		states: { open: dialogOpen }
	} = createDialog();

	async function analyzeAndGenerate(task: ImageTask) {
		try {
			const dimensions = await getImageDimensions(task.file);
			
			const analyzeResponse = await fetch('/api/analyze-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageBase64: task.preview.split(',')[1],
					width: dimensions.width,
					height: dimensions.height
				})
			});

			if (!analyzeResponse.ok) {
				throw new Error('图片分析失败');
			}

			const { prompt } = await analyzeResponse.json();

			const index = images.findIndex(img => img.id === task.id);
			if (index !== -1) {
				images[index].status = 'completed';
				images[index].prompt = prompt;
			}
		} catch (error) {
			const index = images.findIndex(img => img.id === task.id);
			if (index !== -1) {
				images[index].status = 'error';
				images[index].error = error instanceof Error ? error.message : '未知错误';
			}
		}
	}

	async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve({ width: img.width, height: img.height });
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		Array.from(files).forEach((file) => {
			if (!file.type.startsWith('image/')) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const preview = e.target?.result as string;
				const newTask: ImageTask = {
					id: Math.random().toString(36).substr(2, 9),
					file,
					preview,
					status: 'pending'
				};
				images = [...images, newTask];
			};
			reader.readAsDataURL(file);
		});

		target.value = '';
	}

	async function processImages() {
		if (isProcessing) return;
		isProcessing = true;

		for (const task of images) {
			if (task.status === 'pending') {
				task.status = 'analyzing';
				await analyzeAndGenerate(task);
			}
		}

		isProcessing = false;
	}

	function removeImage(id: string) {
		images = images.filter(img => img.id !== id);
	}

	function clearAll() {
		images = [];
		$dialogOpen = false;
	}

	async function retryAnalysis(task: ImageTask) {
		const index = images.findIndex(img => img.id === task.id);
		if (index !== -1) {
			images[index].status = 'analyzing';
			images[index].error = undefined;
			await analyzeAndGenerate(task);
		}
	}

	async function generateImage(task: ImageTask) {
		if (!task.prompt) return;
		
		const index = images.findIndex(img => img.id === task.id);
		if (index === -1) return;

		try {
			images[index].isGeneratingImage = true;
			
			const dimensions = await getImageDimensions(task.file);
			
			const generateResponse = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: task.prompt,
					width: dimensions.width,
					height: dimensions.height
				})
			});

			if (!generateResponse.ok) {
				const errorData = await generateResponse.json();
				throw new Error(errorData.error || '图片生成失败');
			}

			const { imageUrl } = await generateResponse.json();
			
			images[index].generatedImageUrl = imageUrl;
			images[index].isGeneratingImage = false;
			toast.success('图片生成成功！');
		} catch (error) {
			if (index !== -1) {
				images[index].isGeneratingImage = false;
			}
			console.error('生成图片失败:', error);
			toast.error(error instanceof Error ? error.message : '图片生成失败');
		}
	}

	async function downloadImage(imageUrl: string, fileName: string) {
		try {
			const response = await fetch('/api/download-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageUrl })
			});

			if (!response.ok) throw new Error('下载失败');

			const { data, contentType } = await response.json();
			
			const byteCharacters = atob(data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: contentType });
			
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			toast.success('图片下载成功');
		} catch (error) {
			console.error('下载失败:', error);
			toast.error('下载失败，请重试');
		}
	}

	let completedCount = $derived(images.filter(img => img.status === 'completed').length);

	function copyImageUrl(imageUrl: string) {
		const success = copy(imageUrl);
		if (success) {
			toast.success('图片链接已复制到剪贴板');
		} else {
			toast.error('复制失败，请重试');
		}
	}

	function copyFileName(fileName: string) {
		const success = copy(fileName);
		if (success) {
			toast.success('文件名已复制到剪贴板');
		} else {
			toast.error('复制失败，请重试');
		}
	}
</script>

<!-- 固定工具栏 -->
<div class="fixed top-14 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
		<!-- 左侧：标题 -->
		<h1 class="text-base font-semibold text-gray-900">
			图片提示词生成器
		</h1>

		<!-- 右侧：操作按钮 -->
		<div class="flex items-center gap-2">
			<button
				onclick={() => fileInput?.click()}
				class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
			>
				上传图片
			</button>

			{#if images.length > 0}
				<button
					onclick={processImages}
					disabled={isProcessing || images.every(img => img.status !== 'pending')}
					class="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
				>
					{#if isProcessing}
						<div class="flex items-center gap-1.5">
							<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							<span>分析中</span>
						</div>
					{:else}
						生成提示词
					{/if}
				</button>
				
				<button
					{...$trigger}
					disabled={isProcessing || isDownloading}
					class="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:text-gray-300 disabled:hover:bg-transparent"
					title="清空所有"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Clear All Dialog -->
<div {...$portalled}>
	{#if $dialogOpen}
		<div {...$overlay} transition:fade={{ duration: 150 }} class="fixed inset-0 z-[9998] bg-black/40"></div>
		<div
			{...$dialogContent}
			transition:fly={{ y: -20, duration: 200, easing: cubicOut }}
			class="fixed left-1/2 top-1/2 z-[9999] max-w-md w-full mx-4 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl border border-gray-200"
		>
			<h2 {...$dialogTitle} class="text-lg font-semibold text-gray-900 mb-2">
				清空所有图片？
			</h2>
			<p {...$description} class="text-sm text-gray-600 mb-6">
				此操作将删除所有已上传的图片和生成的提示词，且无法撤销。
			</p>
			<div class="flex gap-3 justify-end">
				<button
					{...$close}
					class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
				>
					取消
				</button>
				<button
					onclick={clearAll}
					class="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
				>
					确认清空
				</button>
			</div>
		</div>
	{/if}
</div>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	multiple
	onchange={handleFileSelect}
	class="hidden"
/>

<!-- 主内容区域 -->
<div class="fixed top-28 bottom-0 left-0 right-0 overflow-y-auto bg-gray-50">
	<div class="max-w-7xl mx-auto px-6 py-6">
		{#if images.length === 0}
			<!-- 空状态 -->
			<div class="flex flex-col items-center justify-center py-32 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">上传图片开始</h2>
				<p class="text-sm text-gray-500 mb-6">AI 将智能分析并生成图片描述提示词</p>
				<button
					onclick={() => fileInput?.click()}
					class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
				>
					选择图片
				</button>
			</div>
		{:else}
			<!-- 图片网格 -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each images as task (task.id)}
					<div 
						class="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
					>
					<!-- 删除按钮 -->
					<button
						onclick={() => removeImage(task.id)}
						class="absolute top-3 right-3 z-20 p-1.5 bg-white border border-gray-200 text-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
						title="删除"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<!-- 文件名显示区域 -->
					<div class="px-4 pt-4 pb-3 border-b border-gray-100 bg-gray-50">
						<div class="flex items-center gap-2">
							<button
								onclick={() => copyFileName(task.file.name)}
								class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
								title="复制文件名"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
							<span class="text-xs text-gray-600 truncate flex-1" title={task.file.name}>
								{task.file.name}
							</span>
						</div>
					</div>

						<!-- 原图 -->
						<div class="relative">
							<img src={task.preview} alt="原图" class="w-full h-60 object-cover" />
						</div>

						<!-- 生成的图片或状态 -->
						<div class="p-4 space-y-3">
							{#if task.status === 'analyzing'}
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-3"></div>
									<p class="text-sm font-medium text-gray-700">分析中...</p>
								</div>
							{:else if task.status === 'completed' && task.prompt}
								<div class="space-y-3">
									<!-- 提示词 -->
									<div class="bg-gray-50 rounded-md p-3 flex items-start justify-between gap-2 border border-gray-200">
										<div class="flex-1 relative group cursor-help">
											<p class="text-xs text-gray-700 line-clamp-3 leading-relaxed">{task.prompt}</p>
											<!-- Hover 显示完整提示词 -->
											<div class="absolute left-0 top-full mt-2 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
												<div class="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-xl max-w-md leading-relaxed whitespace-pre-wrap">
													{task.prompt}
												</div>
											</div>
										</div>
										
										<!-- 复制提示词按钮 -->
										<button
											onclick={(e) => {
												e.stopPropagation();
												if (task.prompt && copy(task.prompt)) {
													toast.success('提示词已复制', 2000);
												} else {
													toast.error('复制失败，请重试', 2000);
												}
											}}
											class="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
											aria-label="复制提示词"
										>
											<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										</button>
									</div>

									<!-- 操作按钮组 -->
									<div class="flex items-center gap-2">
										<!-- 跳转到掘金生成按钮 -->
										<a
											href="https://aidp.juejin.cn/agentic/api/v1/tool/text2image?prompt={encodeURIComponent(task.prompt)}"
											target="_blank"
											rel="noopener noreferrer"
											class="flex-1 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors text-center"
										>
											跳转生成
										</a>

									<!-- 生成图片按钮 -->
									<button
										onclick={() => generateImage(task)}
										disabled={task.isGeneratingImage}
										class="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
										title={task.isGeneratingImage ? '生成中...' : '生成图片'}
									>
										{#if task.isGeneratingImage}
											<div class="flex items-center gap-1.5">
												<svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												<span>生成中</span>
											</div>
										{:else}
											生成图片
										{/if}
									</button>
									</div>

									<!-- 生成的图片 -->
									{#if task.generatedImageUrl}
										<div class="relative rounded-md overflow-hidden border border-gray-200">
											<img src={task.generatedImageUrl} alt="生成的图片" class="w-full h-auto" />
											<button
												onclick={() => task.generatedImageUrl && downloadImage(task.generatedImageUrl, `ai-generated-${task.file.name}`)}
												class="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
												title="下载图片"
											>
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
												</svg>
											</button>
										</div>
									{/if}
								</div>
							{:else if task.status === 'error'}
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3">
										<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</div>
									<p class="text-sm text-red-600 mb-3">{task.error || '处理失败'}</p>
									<button
										onclick={() => retryAnalysis(task)}
										class="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
									>
										重试
									</button>
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
										<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<p class="text-sm text-gray-500">等待处理</p>
								</div>
							{/if}
						</div>
					</div>
				{/each}
		</div>
	{/if}
</div>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
