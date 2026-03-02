<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
</script>

<svelte:head>
	<title>AI Studio - 欢迎</title>
</svelte:head>

<div class="page-shell flex items-start justify-center pt-10 sm:pt-14 pb-8 sm:pb-10">
	<div class="page-container text-center">
		<!-- Logo 和标题 -->
		<div class="mb-12 sm:mb-14">
			<div 
				in:scale={{ duration: 500, start: 0.5, easing: cubicOut }}
				class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl hover:shadow-blue-100 transition-shadow duration-300"
			>
				<svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<h1 
				in:fly={{ y: -20, duration: 600, delay: 200, easing: cubicOut }}
				class="text-3xl sm:text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
			>
				欢迎来到 AI Studio
			</h1>
			<p 
				in:fly={{ y: 20, duration: 600, delay: 400, easing: cubicOut }}
				class="text-base sm:text-lg text-gray-600 font-light"
			>
				强大的 AI 工具集，让创作更简单
			</p>
		</div>

		<!-- 功能卡片 -->
		<div class="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
			<!-- 聊天卡片 -->
			<a 
				href="/chat"
				in:fly={{ x: -50, duration: 600, delay: 500, easing: cubicOut }}
				class="group relative surface-card p-6 sm:p-7 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-200 overflow-hidden"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100/60 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-all duration-300 shadow-md">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					
					<h2 class="text-2xl font-bold text-gray-800 mb-3">AI 聊天</h2>
					<p class="text-gray-600 mb-5 leading-relaxed text-sm sm:text-base">
						与智能 AI 助手对话，获取帮助和建议
					</p>
					
					<div class="flex flex-wrap justify-center gap-2 text-xs sm:text-sm mb-5">
						<span class="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 Groq</span>
						<span class="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 Gemini</span>
						<span class="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 智谱 AI</span>
					</div>
					
					<div class="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center text-base">
						开始聊天
						<svg class="w-5 h-5 ml-1.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
				</div>
			</a>

			<!-- 图片生成卡片 -->
			<a 
				href="/image-generator"
				in:fly={{ x: 50, duration: 600, delay: 500, easing: cubicOut }}
				class="group relative surface-card p-6 sm:p-7 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-purple-200 overflow-hidden"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-100/60 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				
				<div class="relative z-10">
					<div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-all duration-300 shadow-md">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					
					<h2 class="text-2xl font-bold text-gray-800 mb-3">图片提示词生成</h2>
					<p class="text-gray-600 mb-5 leading-relaxed text-sm sm:text-base">
						上传图片，AI 智能生成详细的描述提示词
					</p>
					
					<div class="flex flex-wrap justify-center gap-2 text-xs sm:text-sm mb-5">
						<span class="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">📸 图片分析</span>
						<span class="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">✨ AI 提示词</span>
						<span class="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">🔗 掘金集成</span>
					</div>
					
					<div class="text-purple-600 font-semibold group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center text-base">
						开始创作
						<svg class="w-5 h-5 ml-1.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
				</div>
			</a>
		</div>

		<!-- 底部特性说明 -->
		<div 
			in:fade={{ duration: 600, delay: 800 }}
			class="mt-12 grid md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto"
		>
			<div 
				in:fly={{ y: 30, duration: 500, delay: 900, easing: cubicOut }}
				class="group flex items-start gap-3 p-5 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-md"
			>
				<div class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
					<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-1.5 text-base">完全免费</h3>
					<p class="text-gray-600 leading-relaxed text-sm">支持多种免费 AI 模型，无需付费即可使用</p>
				</div>
			</div>
			
			<div 
				in:fly={{ y: 30, duration: 500, delay: 1000, easing: cubicOut }}
				class="group flex items-start gap-3 p-5 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-md"
			>
				<div class="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-1.5 text-base">极速响应</h3>
					<p class="text-gray-600 leading-relaxed text-sm">使用 Groq 等高速 AI 服务，响应迅速</p>
				</div>
			</div>
			
			<div 
				in:fly={{ y: 30, duration: 500, delay: 1100, easing: cubicOut }}
				class="group flex items-start gap-3 p-5 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-md"
			>
				<div class="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
					<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-1.5 text-base">灵活配置</h3>
					<p class="text-gray-600 leading-relaxed text-sm">支持多种 AI 模型，可随时切换</p>
				</div>
			</div>
		</div>
	</div>
</div>
