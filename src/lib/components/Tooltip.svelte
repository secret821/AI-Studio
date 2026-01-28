<script lang="ts">
	import { createTooltip, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		text: string;
		children: import('svelte').Snippet;
		positioning?: 'top' | 'bottom' | 'left' | 'right';
	}

	let { text, children, positioning = 'top' }: Props = $props();

	const {
		elements: { trigger, content, arrow },
		states: { open }
	} = createTooltip({
		positioning: {
			placement: positioning
		},
		openDelay: 0,
		closeDelay: 0,
		closeOnPointerDown: false,
		forceVisible: true
	});
</script>

<button {...$trigger} class="inline-flex">
	{@render children()}
</button>

{#if $open}
	<div
		{...$content}
		transition:fade={{ duration: 100 }}
		class="z-[100] rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
	>
		<div {...$arrow} />
		{text}
	</div>
{/if}
