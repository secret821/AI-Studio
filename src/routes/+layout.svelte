<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Toast from '$lib/components/Toast.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	
	// 判断当前路由
	$: isLogin = $page.url.pathname === '/login';
	$: isChat = $page.url.pathname === '/chat';
	$: isImageGenerator = $page.url.pathname === '/image-generator';
	$: isMarketReport = $page.url.pathname === '/market-report';
</script>

<!-- Toast 组件（全局） -->
<Toast />

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	{#if !isLogin}
		<!-- 吸顶导航栏 -->
		<nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
			<div class="page-container">
				<div class="flex items-center justify-between h-14">
					<!-- Logo -->
					<a 
						href="/"
						class="flex shrink-0 items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<div class="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<span class="hidden text-base font-semibold text-gray-900 sm:inline">
							AI Studio
						</span>
						<span class="text-sm font-semibold text-gray-900 sm:hidden">AI</span>
					</a>

					<!-- 导航链接 -->
					<div class="ml-2 flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto sm:gap-2">
						<a
							href="/market-report"
							class="relative shrink-0 rounded-md px-2.5 py-1.5 transition-colors sm:px-3 {isMarketReport
								? 'bg-gray-100 text-gray-900'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<div class="flex items-center gap-1.5 whitespace-nowrap">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
								<span class="hidden text-sm font-medium sm:inline">市场日报</span>
							</div>
						</a>
						<a
							href="/chat"
							class="relative shrink-0 rounded-md px-2.5 py-1.5 transition-colors sm:px-3 {isChat 
								? 'bg-gray-100 text-gray-900' 
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<div class="flex items-center gap-1.5 whitespace-nowrap">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
								<span class="hidden text-sm font-medium sm:inline">聊天</span>
							</div>
						</a>
						
						<a
							href="/image-generator"
							class="relative shrink-0 rounded-md px-2.5 py-1.5 transition-colors sm:px-3 {isImageGenerator 
								? 'bg-gray-100 text-gray-900' 
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<div class="flex items-center gap-1.5 whitespace-nowrap">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<span class="hidden text-sm font-medium sm:inline">图片生成</span>
							</div>
						</a>

						<div class="ml-1 flex shrink-0 items-center gap-2 border-l border-gray-200 pl-2 sm:ml-2 sm:pl-3">
							<span class="hidden text-xs text-gray-500 md:inline">已登录：{data.username}</span>
							<form method="POST" action="/logout">
								<button
									type="submit"
									class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 sm:px-3"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									<span class="hidden sm:inline">退出</span>
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</nav>
	{/if}

	<!-- 主内容区域 -->
	<main class="{isLogin ? '' : 'pt-14'} min-h-screen">
		<slot />
	</main>
</div>
