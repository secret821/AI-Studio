<script lang="ts">
	import { toast, type Toast } from '$lib/stores/toast.svelte';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	function getToastStyles(type: Toast['type']) {
		const styles = {
			success: 'bg-green-500 text-white',
			error: 'bg-red-500 text-white',
			warning: 'bg-yellow-500 text-white',
			info: 'bg-blue-500 text-white'
		};
		return styles[type] || styles.info;
	}

	function getIcon(type: Toast['type']) {
		const icons = {
			success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>`,
			error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>`,
			warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>`,
			info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>`
		};
		return icons[type] || icons.info;
	}
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
	{#each toast.toasts as t (t.id)}
		<div
			animate:flip={{ duration: 200, easing: cubicOut }}
			in:fly={{ duration: 200, y: 20, easing: cubicOut }}
			out:fade={{ duration: 150 }}
			class="pointer-events-auto"
		>
			<div class="rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-md backdrop-blur-sm border border-white/20">
				<div class="{getToastStyles(t.type)} px-4 py-3">
					<div class="flex items-center gap-3">
						<div class="flex-shrink-0">
							{@html getIcon(t.type)}
						</div>
						<div class="flex-1 text-sm font-medium">
							{t.message}
						</div>
						<button
							class="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
							onclick={() => toast.remove(t.id)}
							aria-label="关闭通知"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
