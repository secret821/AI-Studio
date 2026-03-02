<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Toast from '$lib/components/Toast.svelte';
	
	// 判断当前路由
	$: isChat = $page.url.pathname === '/chat';
	$: isImageGenerator = $page.url.pathname === '/image-generator';
</script>

<!-- Toast 组件（全局） -->
<Toast />

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<!-- 吸顶导航栏 - 更简洁现代的设计 -->
	<nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
		<div class="page-container">
			<div class="flex items-center justify-between h-14">
				<!-- Logo -->
				<a 
					href="/"
					class="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<span class="text-base font-semibold text-gray-900">
						AI Studio
					</span>
				</a>

				<!-- 导航链接 -->
				<div class="flex items-center gap-1">
					<a
						href="/chat"
						class="relative px-3 py-1.5 rounded-md transition-colors {isChat 
							? 'bg-gray-100 text-gray-900' 
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<div class="flex items-center gap-1.5">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
							<span class="text-sm font-medium">聊天</span>
						</div>
					</a>
					
					<a
						href="/image-generator"
						class="relative px-3 py-1.5 rounded-md transition-colors {isImageGenerator 
							? 'bg-gray-100 text-gray-900' 
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<div class="flex items-center gap-1.5">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span class="text-sm font-medium">图片生成</span>
						</div>
					</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- 主内容区域 -->
	<main class="pt-14 min-h-screen">
		<slot />
	</main>
</div>
