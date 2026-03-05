<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>登录 - AI Studio</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-4 py-8">
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl"></div>
		<div class="absolute bottom-[-16rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-3xl"></div>
		<div class="absolute bottom-[-18rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-purple-500/15 blur-3xl"></div>
	</div>

	<div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#10131d]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
		<div class="mb-7 flex items-center gap-3">
			<div class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-900/40">
				<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-200/80">Secure Access</p>
				<h1 class="text-xl font-semibold text-white">登录 AI Studio</h1>
			</div>
		</div>

		<p class="mb-6 text-sm leading-relaxed text-slate-300">
			站点已开启访问保护。请输入授权账号后继续访问聊天、图片生成和市场日报模块。
		</p>

		<form method="POST" class="space-y-4">
			<div>
				<label for="username" class="mb-1.5 block text-sm font-medium text-slate-200">用户名</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					required
					value={form?.username ?? ''}
					class="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
					placeholder="请输入用户名"
				/>
			</div>

			<div>
				<label for="password" class="mb-1.5 block text-sm font-medium text-slate-200">密码</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
					placeholder="请输入密码"
				/>
			</div>

			{#if form?.message}
				<p class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{form.message}</p>
			{/if}

			<button
				type="submit"
				class="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-100 to-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:from-white hover:to-slate-200"
			>
				登录并进入
			</button>

			<p class="pt-1 text-center text-xs text-slate-400">
				受保护访问模式已启用
			</p>
		</form>
	</div>
</div>
