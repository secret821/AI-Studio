<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
</script>

<svelte:head>
	<title>AI Studio - 欢迎</title>
</svelte:head>

<div class="fixed inset-0 top-14 overflow-y-auto flex items-center justify-center px-4 bg-gray-50">
	<div class="max-w-6xl mx-auto text-center">
		<!-- Logo 和标题 -->
		<div class="mb-16">
			<div 
				in:scale={{ duration: 500, start: 0.5, easing: cubicOut }}
				class="w-20 h-20 bg-gradient-to-br mt-4 from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl hover:shadow-purple-200 transition-shadow duration-300 animate-pulse hover:animate-none"
			>
				<svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<h1 
				in:fly={{ y: -20, duration: 600, delay: 200, easing: cubicOut }}
				class="text-6xl font-extrabold mb-5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
			>
				欢迎来到 AI Studio
			</h1>
			<p 
				in:fly={{ y: 20, duration: 600, delay: 400, easing: cubicOut }}
				class="text-2xl text-gray-600 font-light"
			>
				强大的 AI 工具集，让创作更简单
			</p>
		</div>

		<!-- 功能卡片 -->
		<div class="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
			<!-- 聊天卡片 -->
			<a 
				href="/chat"
				in:fly={{ x: -50, duration: 600, delay: 500, easing: cubicOut }}
				class="group relative bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:scale-[1.02] border-2 border-gray-100 hover:border-blue-300 overflow-hidden"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-purple-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				<div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
				
				<div class="relative z-10">
					<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
						<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					
					<h2 class="text-3xl font-bold text-gray-800 mb-4">AI 聊天</h2>
					<p class="text-gray-600 mb-6 leading-relaxed">
						与智能 AI 助手对话，获取帮助和建议
					</p>
					
					<div class="flex flex-wrap justify-center gap-2 text-sm mb-6">
						<span class="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 Groq</span>
						<span class="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 Gemini</span>
						<span class="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">🆓 智谱 AI</span>
					</div>
					
					<div class="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center text-lg">
						开始聊天
						<svg class="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
				</div>
			</a>

			<!-- 图片生成卡片 -->
			<a 
				href="/image-generator"
				in:fly={{ x: 50, duration: 600, delay: 500, easing: cubicOut }}
				class="group relative bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:scale-[1.02] border-2 border-gray-100 hover:border-purple-300 overflow-hidden"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-100 to-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				<div class="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
				
				<div class="relative z-10">
					<div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
						<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					
					<h2 class="text-3xl font-bold text-gray-800 mb-4">图片提示词生成</h2>
					<p class="text-gray-600 mb-6 leading-relaxed">
						上传图片，AI 智能生成详细的描述提示词
					</p>
					
					<div class="flex flex-wrap justify-center gap-2 text-sm mb-6">
						<span class="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">📸 图片分析</span>
						<span class="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">✨ AI 提示词</span>
						<span class="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">🔗 掘金集成</span>
					</div>
					
					<div class="text-purple-600 font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center text-lg">
						开始创作
						<svg class="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
				</div>
			</a>
		</div>

		<!-- 底部特性说明 -->
		<div 
			in:fade={{ duration: 600, delay: 800 }}
			class="mt-20 grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto"
		>
			<div 
				in:fly={{ y: 30, duration: 500, delay: 900, easing: cubicOut }}
				class="group flex items-start gap-4 p-6 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-lg"
			>
				<div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-2 text-lg">完全免费</h3>
					<p class="text-gray-600 leading-relaxed">支持多种免费 AI 模型，无需付费即可使用</p>
				</div>
			</div>
			
			<div 
				in:fly={{ y: 30, duration: 500, delay: 1000, easing: cubicOut }}
				class="group flex items-start gap-4 p-6 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-lg"
			>
				<div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-2 text-lg">极速响应</h3>
					<p class="text-gray-600 leading-relaxed">使用 Groq 等高速 AI 服务，响应迅速</p>
				</div>
			</div>
			
			<div 
				in:fly={{ y: 30, duration: 500, delay: 1100, easing: cubicOut }}
				class="group flex items-start gap-4 p-6 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-lg"
			>
				<div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
					</svg>
				</div>
				<div>
					<h3 class="font-bold text-gray-800 mb-2 text-lg">灵活配置</h3>
					<p class="text-gray-600 leading-relaxed">支持多种 AI 模型，可随时切换</p>
				</div>
			</div>
		</div>
	</div>
</div>
