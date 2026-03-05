<script lang="ts">
	console.log('[市场日报] 模块加载 ✓');

	interface GoldData {
		valid: boolean; price: number; prevClose: number;
		change: number; changePct: number; unit: string;
		source: string; sourceUrl: string; isEstimate: boolean;
	}
	interface ETFItem {
		code: string; name: string; price: number;
		changePct: number; changeAmt: number;
		high: number; low: number; open: number; prevClose: number;
		goldRatio: number; // >0: 直接公式；0: 用 Au9999 近似
	}
	interface FeederFund {
		code: string; name: string; price: number;
		changePct: number; changeAmt: number; prevClose: number;
		navDate: string; gztime: string; isFeeder: boolean;
		goldRatio: number; // >0: 直接公式；0: 用 Au9999 近似
	}
	interface BankItem { bank: string; buy: number; sell: number; time: string; }
	interface BankGold { source: string; sourceUrl: string; items: BankItem[]; }
	interface SectorItem {
		rank: number; code: string; name: string;
		changePct: number; changeAmt: number; mainFlow: number; mainRatio: number;
	}

	const REFRESH_INTERVAL = 5 * 60; // 秒

	let loading         = $state(true);
	let error           = $state('');
	let gold            = $state<GoldData | null>(null);
	let goldFunds       = $state<ETFItem[]>([]);
	let feederFunds     = $state<FeederFund[]>([]);
	let bankGold        = $state<BankGold | null>(null);
	let sectors         = $state<SectorItem[]>([]);
	let analysis        = $state('');
	let analysisErr     = $state('');
	let analysisModel   = $state('');
	let updatedAt       = $state('');
	let analysisLoading = $state(false);
	let countdown       = $state(REFRESH_INTERVAL);
	let fetching        = false; // 防并发重入

	// 进入页面立即加载，之后每 5 分钟自动刷新
	$effect(() => {
		loadData();
		const dataTimer = setInterval(() => { loadData(); }, REFRESH_INTERVAL * 1000);
		const cdTimer   = setInterval(() => {
			countdown = countdown > 0 ? countdown - 1 : REFRESH_INTERVAL;
		}, 1000);
		return () => { clearInterval(dataTimer); clearInterval(cdTimer); };
	});

	async function loadData() {
		if (fetching) return;
		fetching = true;
		loading = true; error = '';
		countdown = REFRESH_INTERVAL;
		console.log('[市场日报] loadData 开始');
		const t0 = Date.now();

		const bail = setTimeout(() => {
			if (loading) { loading = false; error = '数据请求超时（30秒），请刷新重试'; }
		}, 30000);

		try {
			const res  = await fetch('/api/market-report');
			const data = await res.json();
			console.log('[市场日报] 数据:', { gold: data.gold, etfs: data.goldFunds?.length, sectors: data.sectors?.length });

			gold         = data.gold         ?? null;
			goldFunds    = data.goldFunds    ?? [];
			feederFunds  = data.feederFunds  ?? [];
			bankGold     = data.bankGold     ?? null;
			sectors   = data.sectors   ?? [];
			updatedAt = new Date(data.updatedAt || Date.now()).toLocaleTimeString('zh-CN', { hour12: false });
			loading   = false;
			console.log(`[市场日报] 主数据完成，耗时 ${Date.now() - t0}ms`);

			if (sectors.length) loadAnalysis();
		} catch (e) {
			error   = (e as Error).message;
			loading = false;
			console.error('[市场日报]', error);
		} finally {
			clearTimeout(bail);
			fetching = false;
		}
	}

	async function loadAnalysis() {
		analysisLoading = true; analysisErr = ''; analysis = '';
		try {
			const res  = await fetch('/api/market-report/analysis', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gold, sectors })
			});
			const data = await res.json();
			if (data.error) { analysisErr = data.error; analysisModel = data.model ?? ''; }
			else            { analysis = data.analysis ?? ''; analysisModel = data.model ?? ''; }
			console.log('[分析]', data.model, data.error || `${data.analysis?.length}字`);
		} catch (e) {
			analysisErr = (e as Error).message;
		} finally {
			analysisLoading = false;
		}
	}

	const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
	const clr = (n: number) => n >= 0 ? 'text-red-500' : 'text-green-600';
	const bgClr = (n: number) => n >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600';
	const yuan = (n: number) => n.toFixed(2);

	// 联接基金排序
	type FeederSortCol = 'name' | 'goldPrice' | 'changePct' | 'changeAmt';
	let feederSortCol = $state<FeederSortCol>('changePct');
	let feederSortDir = $state<1 | -1>(-1); // -1 = 降序

	function toggleFeederSort(col: FeederSortCol) {
		if (feederSortCol === col) feederSortDir = feederSortDir === -1 ? 1 : -1;
		else { feederSortCol = col; feederSortDir = col === 'name' ? 1 : -1; }
	}

	const sortedFeeders = $derived(
		[...feederFunds].sort((a, b) => {
			let va: number | string, vb: number | string;
			if (feederSortCol === 'name')           { va = a.name;          vb = b.name; }
			else if (feederSortCol === 'goldPrice') {
					va = feederGoldPrice(a); vb = feederGoldPrice(b);
				}
			else if (feederSortCol === 'changePct') { va = a.changePct;     vb = b.changePct; }
			else                                    { va = a.changeAmt;     vb = b.changeAmt; }
			if (va < vb) return feederSortDir;
			if (va > vb) return -feederSortDir;
			return 0;
		})
	);

	// 表头排序辅助
	const thCls  = (c: FeederSortCol) => feederSortCol === c ? 'text-amber-600' : 'text-gray-400';
	const thArrow = (c: FeederSortCol) => feederSortCol === c ? (feederSortDir === -1 ? ' ↓' : ' ↑') : '';

	// 联接基金参考金价
	// ① goldRatio > 0（已知倍率）：直接公式 = 净值 × 倍率
	//    华安：3.8940 × 270 = 1051.38  与支付宝完全一致
	//    博时：3.6188 × 285 = 1031.37  与支付宝完全一致
	// ② goldRatio = 0（倍率未知）：用 Au9999 × (今日净值/昨日净值) 近似
	// 错误示范：× 100（假设每份=0.01克，实际华安每份≈1/270克）
	const feederGoldPrice = (f: FeederFund): number => {
		if (f.goldRatio > 0) return parseFloat((f.price * f.goldRatio).toFixed(2));
		return gold?.valid && gold.price > 0 && f.prevClose > 0
			? parseFloat((gold.price * f.price / f.prevClose).toFixed(2))
			: 0;
	};

	const feederGoldChangeAmt = (f: FeederFund): number => {
		if (f.goldRatio > 0) return parseFloat((f.changeAmt * f.goldRatio).toFixed(2));
		const gp = feederGoldPrice(f);
		return gp > 0 ? parseFloat((gp - gold!.price).toFixed(2)) : 0;
	};

	// 上日参考金价（按上日净值换算），用于和今日参考金价直接对比
	const feederPrevGoldPrice = (f: FeederFund): number => {
		if (f.prevClose <= 0) return 0;
		if (f.goldRatio > 0) return parseFloat((f.prevClose * f.goldRatio).toFixed(2));
		const gp = feederGoldPrice(f);
		const delta = feederGoldChangeAmt(f);
		return gp > 0 ? parseFloat((gp - delta).toFixed(2)) : 0;
	};

	// ETF 参考金价：
	// ① 若后端提供稳定倍率则直接使用（当前默认不提供）
	// ② 否则使用 Au9999 × (今日份价 / 昨日份价) 动态近似，规避份额调整导致的倍率漂移
	const etfGoldPrice = (e: ETFItem): number => {
		if (e.goldRatio > 0) return parseFloat((e.price * e.goldRatio).toFixed(2));
		return gold?.valid && gold.price > 0 && e.prevClose > 0
			? parseFloat((gold.price * e.price / e.prevClose).toFixed(2))
			: 0;
	};

	const etfGoldChangeAmt = (e: ETFItem): number => {
		if (e.goldRatio > 0) return parseFloat((e.changeAmt * e.goldRatio).toFixed(2));
		const gp = etfGoldPrice(e);
		return gp > 0 ? parseFloat((gp - gold!.price).toFixed(2)) : 0;
	};
</script>

<svelte:head><title>市场日报 – AI 财经</title></svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="page-container py-6 space-y-5">

		<!-- 页头 -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold text-gray-900">市场日报</h1>
				<p class="text-xs text-gray-400 mt-0.5">黄金 · 板块资金 · AI 分析</p>
			</div>
			<div class="flex items-center gap-2 sm:gap-3">
				{#if updatedAt && !loading}
					<span class="hidden text-xs text-gray-400 sm:flex sm:items-center sm:gap-1">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						{updatedAt} · {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2,'0')} 后刷新
					</span>
				{/if}
				<button
					onclick={() => loadData()}
					disabled={loading}
					class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					<svg class="w-3.5 h-3.5 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
					{loading ? '加载中' : '刷新'}
				</button>
			</div>
		</div>

		<!-- 全局错误 -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
		{/if}

		<!-- ── 骨架屏 ── -->
		{#if loading}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each [1,2,3] as _}
					<div class="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3">
						<div class="h-3 bg-gray-100 rounded w-1/3"></div>
						<div class="h-8 bg-gray-100 rounded w-2/3"></div>
						<div class="h-3 bg-gray-100 rounded w-1/2"></div>
					</div>
				{/each}
			</div>
			<div class="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
				<div class="h-3 bg-gray-100 rounded w-1/4 mb-4"></div>
				{#each [1,2,3,4,5] as _}
					<div class="h-3 bg-gray-100 rounded mb-3"></div>
				{/each}
			</div>
		{:else}

		<!-- ══════════════════════════════════
		     黄金板块
		══════════════════════════════════ -->

		<!-- 行 1：Au9999 现货 + 黄金ETF榜 -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

			<!-- Au9999 现货卡 -->
			<div class="bg-white rounded-xl border border-gray-100 p-5 flex flex-col justify-between">
				<div class="flex items-center justify-between mb-3">
					<span class="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">现货黄金</span>
					{#if gold?.isEstimate}
						<span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">参考估算</span>
					{/if}
				</div>

				{#if gold?.valid}
					<div>
						<p class="text-3xl font-bold text-gray-900 tracking-tight">
							¥{gold.price.toFixed(2)}
							<span class="text-sm font-normal text-gray-400">/{gold.unit}</span>
						</p>
						<div class="flex items-center gap-2 mt-2">
							<span class="text-sm font-medium {clr(gold.change)}">{gold.change >= 0 ? '+' : ''}{gold.change.toFixed(2)}</span>
							<span class="text-xs px-1.5 py-0.5 rounded font-medium {bgClr(gold.changePct)}">{pct(gold.changePct)}</span>
						</div>
						<p class="text-xs text-gray-400 mt-3">昨收 ¥{gold.prevClose.toFixed(2)}</p>
					</div>
					<a href={gold.sourceUrl} target="_blank" rel="noopener"
					   class="mt-4 text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
						</svg>
						{gold.source}
					</a>
				{:else}
					<div class="flex-1 flex flex-col items-center justify-center text-center py-4">
						<svg class="w-8 h-8 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<p class="text-xs text-gray-400">暂无实时数据</p>
						<p class="text-xs text-gray-300 mt-1">市场未开盘或接口暂时不可用</p>
					</div>
				{/if}
			</div>

			<!-- 黄金 ETF 榜单 -->
			<div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
				<div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
					<span class="text-sm font-semibold text-gray-800">黄金 ETF 行情</span>
					<a href="https://data.eastmoney.com/fund/default.html" target="_blank" rel="noopener"
					   class="text-xs text-gray-400 hover:text-amber-600 transition-colors">
						来源：东方财富 ↗
					</a>
				</div>

				{#if goldFunds.length}
					<div class="mobile-scroll-x">
						<table class="mobile-data-table">
							<thead>
								<tr class="text-xs text-gray-400 border-b border-gray-50">
									<th class="text-left pl-5 py-2.5 font-medium w-36">名称 / 代码</th>
									<th class="text-right pr-4 py-2.5 font-medium">参考金价（元/克）</th>
									<th class="text-right pr-4 py-2.5 font-medium">涨跌幅</th>
									<th class="text-right pr-4 py-2.5 font-medium">涨跌（元/克）</th>
									<th class="text-right pr-5 py-2.5 font-medium hidden sm:table-cell">ETF 份价</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-50">
								{#each [...goldFunds].sort((a,b) => b.changePct - a.changePct) as etf}
									<tr class="hover:bg-gray-50 transition-colors">
										<td class="pl-5 py-2.5">
											<p class="font-medium text-gray-900 text-xs">{etf.name}</p>
											<p class="text-xs text-gray-400">{etf.code}</p>
										</td>
										<td class="text-right pr-4 py-2.5 font-mono font-medium text-gray-900 text-xs">
											{#if etfGoldPrice(etf) > 0}¥{etfGoldPrice(etf).toFixed(2)}{:else}–{/if}
										</td>
										<td class="text-right pr-4 py-2.5">
											<span class="text-xs font-medium px-1.5 py-0.5 rounded {bgClr(etf.changePct)}">{pct(etf.changePct)}</span>
										</td>
										<td class="text-right pr-4 py-2.5 text-xs font-medium {clr(etfGoldChangeAmt(etf))}">
											{#if etfGoldPrice(etf) > 0}
												{etfGoldChangeAmt(etf) >= 0 ? '+' : ''}{etfGoldChangeAmt(etf).toFixed(2)}
											{:else}–{/if}
										</td>
										<td class="text-right pr-5 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{yuan(etf.price)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="flex items-center justify-center h-32 text-xs text-gray-400">
						暂无 ETF 数据（市场未开盘或接口暂时不可用）
					</div>
				{/if}
			</div>
		</div>

		<!-- 行 2：黄金联接基金（支付宝同款，天天基金估算净值） -->
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
				<div>
					<span class="text-sm font-semibold text-gray-800">黄金联接基金</span>
					<span class="ml-2 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">支付宝同款</span>
				</div>
				<a href="https://fund.eastmoney.com/" target="_blank" rel="noopener"
				   class="text-xs text-gray-400 hover:text-amber-600 transition-colors">
					来源：天天基金（fundgz.1234567.com.cn）↗
				</a>
			</div>

			{#if feederFunds.length}
				<div class="mobile-scroll-x">
					<table class="mobile-data-table">
						<thead>
							<tr class="text-xs border-b border-gray-50">
								<th class="text-left pl-5 py-2.5 font-medium cursor-pointer select-none hover:text-amber-600 transition-colors {thCls('name')}"
								    onclick={() => toggleFeederSort('name')}>
									基金名称{thArrow('name')}
								</th>
								<th class="text-right pr-4 py-2.5 font-medium cursor-pointer select-none hover:text-amber-600 transition-colors {thCls('goldPrice')}"
								    onclick={() => toggleFeederSort('goldPrice')}>
									参考金价（元/克）{thArrow('goldPrice')}
								</th>
								<th class="text-right pr-4 py-2.5 font-medium cursor-pointer select-none hover:text-amber-600 transition-colors {thCls('changePct')}"
								    onclick={() => toggleFeederSort('changePct')}>
									估算涨幅{thArrow('changePct')}
								</th>
								<th class="text-right pr-4 py-2.5 font-medium cursor-pointer select-none hover:text-amber-600 transition-colors {thCls('changeAmt')}"
								    onclick={() => toggleFeederSort('changeAmt')}>
									涨跌额（/克）{thArrow('changeAmt')}
								</th>
								<th class="text-right pr-5 py-2.5 font-medium text-gray-400">
									净值 / 上日净值
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-50">
							{#each sortedFeeders as f}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="pl-5 py-2.5">
										<p class="font-medium text-gray-900 text-xs">{f.name}</p>
										<p class="text-xs text-gray-400">
											{f.code}
											{#if f.gztime}
												<span class="ml-1 text-gray-300">· {f.gztime}</span>
											{/if}
										</p>
									</td>
									<!-- 参考金价：优先净值×固定倍率，否则使用 Au9999 × (今日净值/昨日净值) -->
									<td class="text-right pr-4 py-2.5">
										{#if feederGoldPrice(f) > 0}
											<p class="font-mono font-semibold text-gray-900 text-xs">¥{feederGoldPrice(f).toFixed(2)}</p>
											<p class="text-xs text-gray-400">
												净值 {f.price.toFixed(4)}{f.gztime ? ` · ${f.gztime}` : (f.navDate ? ` · ${f.navDate}` : '')}
											</p>
										{:else}
											<p class="text-xs text-gray-300">待现货数据</p>
											<p class="text-xs text-gray-400">
												净值 {f.price.toFixed(4)}{f.gztime ? ` · ${f.gztime}` : (f.navDate ? ` · ${f.navDate}` : '')}
											</p>
										{/if}
									</td>
									<td class="text-right pr-4 py-2.5">
										<span class="text-xs font-medium px-1.5 py-0.5 rounded {bgClr(f.changePct)}">{pct(f.changePct)}</span>
									</td>
									<td class="text-right pr-4 py-2.5 text-xs font-medium {clr(feederGoldChangeAmt(f))}">
										{#if feederGoldPrice(f) > 0}
											{feederGoldChangeAmt(f) >= 0 ? '+' : ''}{feederGoldChangeAmt(f).toFixed(2)}
										{:else}–{/if}
									</td>
									<td class="text-right pr-5 py-2.5">
										<p class="text-xs text-gray-700 font-mono">{f.price.toFixed(4)}</p>
										<p class="text-xs text-gray-300">{f.prevClose.toFixed(4)}{f.navDate ? `（净值日 ${f.navDate}）` : ''}</p>
										<p class="text-xs font-mono text-gray-500">
											{#if feederGoldPrice(f) > 0}
												今 ¥{feederGoldPrice(f).toFixed(2)} / 昨 ¥{feederPrevGoldPrice(f).toFixed(2)}
											{:else}
												参考金价 –
											{/if}
										</p>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<p class="px-5 py-2.5 text-xs text-gray-300 border-t border-gray-50">
					参考金价优先使用“净值 × 基金固定倍率”（如华安 000217 按 ×270），若该基金无已知倍率则回退为 Au9999 × (今日估算净值 / 昨日净值)。
					估算净值交易时段实时计算，非交易时段为上一交易日净值。
					<a href="https://fund.eastmoney.com/QDII_jjjz_1.html" target="_blank" rel="noopener" class="text-gray-400 hover:text-amber-600 transition-colors ml-1">查看全部 ↗</a>
				</p>
			{:else}
				<div class="flex items-center justify-center h-20 text-xs text-gray-400">
					暂无联接基金数据
				</div>
			{/if}
		</div>

		<!-- 行 3：银行黄金 -->
		{#if bankGold?.items?.length}
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
				<span class="text-sm font-semibold text-gray-800">银行黄金报价</span>
				<a href={bankGold.sourceUrl} target="_blank" rel="noopener"
				   class="text-xs text-gray-400 hover:text-amber-600 transition-colors">
					来源：{bankGold.source} ↗
				</a>
			</div>
			<div class="mobile-scroll-x">
				<table class="mobile-data-table">
					<thead>
						<tr class="text-xs text-gray-400 border-b border-gray-50">
							<th class="text-left pl-5 py-2.5 font-medium">银行</th>
							<th class="text-right pr-4 py-2.5 font-medium">买入价（¥/克）</th>
							<th class="text-right pr-4 py-2.5 font-medium">卖出价（¥/克）</th>
							<th class="text-right pr-5 py-2.5 font-medium hidden sm:table-cell">更新时间</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-50">
						{#each bankGold.items as row}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="pl-5 py-2.5 font-medium text-gray-900 text-xs">{row.bank}</td>
								<td class="text-right pr-4 py-2.5 text-xs font-mono text-green-600">{row.buy.toFixed(2)}</td>
								<td class="text-right pr-4 py-2.5 text-xs font-mono text-red-500">{row.sell.toFixed(2)}</td>
								<td class="text-right pr-5 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{row.time}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
			<div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
				</svg>
			</div>
			<div>
				<p class="text-xs font-medium text-gray-700">银行黄金报价暂不可用</p>
				<p class="text-xs text-gray-400 mt-0.5">
					可参考
					<a href="https://www.icbc.com.cn/icbc/html/goldtrade.htm" target="_blank" rel="noopener" class="text-amber-600 hover:underline">工商银行</a>、
					<a href="https://www.abchina.com/cn/PersonalBanking/GoldBusiness/" target="_blank" rel="noopener" class="text-amber-600 hover:underline">农业银行</a>、
					<a href="https://www.cmbchina.com/personal/gold/" target="_blank" rel="noopener" class="text-amber-600 hover:underline">招商银行</a>
					官网获取最新金价
				</p>
			</div>
		</div>
		{/if}

		<!-- ══════════════════════════════════
		     板块资金流向榜
		══════════════════════════════════ -->
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
				<span class="text-sm font-semibold text-gray-800">板块资金流向榜</span>
				<a href="https://data.eastmoney.com/bkzj/hy.html" target="_blank" rel="noopener"
				   class="text-xs text-gray-400 hover:text-blue-500 transition-colors">
					来源：东方财富 ↗
				</a>
			</div>

			{#if sectors.length}
				<div class="mobile-scroll-x">
					<table class="mobile-data-table">
						<thead>
							<tr class="text-xs text-gray-400 border-b border-gray-50">
								<th class="text-left pl-5 py-2.5 font-medium w-8">#</th>
								<th class="text-left py-2.5 font-medium">板块</th>
								<th class="text-right pr-4 py-2.5 font-medium">涨跌幅</th>
								<th class="text-right pr-4 py-2.5 font-medium">主力净流入</th>
								<th class="text-right pr-5 py-2.5 font-medium hidden sm:table-cell">净占比</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-50">
							{#each [...sectors].sort((a,b) => b.mainFlow - a.mainFlow).slice(0, 20) as s}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="pl-5 py-2.5 text-xs text-gray-300">{s.rank}</td>
									<td class="py-2.5 font-medium text-gray-900 text-xs">{s.name}</td>
									<td class="text-right pr-4 py-2.5">
										<span class="text-xs font-medium px-1.5 py-0.5 rounded {bgClr(s.changePct)}">{pct(s.changePct)}</span>
									</td>
									<td class="text-right pr-4 py-2.5 text-xs font-medium {clr(s.mainFlow)}">
										{s.mainFlow >= 0 ? '+' : ''}{s.mainFlow.toFixed(2)} 亿
									</td>
									<td class="text-right pr-5 py-2.5 text-xs text-gray-400 hidden sm:table-cell">
										{s.mainRatio.toFixed(2)}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="flex items-center justify-center h-24 text-xs text-gray-400">暂无板块数据</div>
			{/if}
		</div>

		<!-- ══════════════════════════════════
		     AI 市场分析
		══════════════════════════════════ -->
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
				<div class="flex items-center gap-2">
					<span class="text-sm font-semibold text-gray-800">AI 市场分析</span>
					{#if analysisModel}
						<span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{analysisModel}</span>
					{/if}
				</div>
				{#if analysisLoading}
					<span class="flex items-center gap-1.5 text-xs text-blue-500">
						<span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay:.15s"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay:.3s"></span>
						生成中
					</span>
				{/if}
			</div>

			<div class="px-5 py-4">
				{#if analysisLoading}
					<div class="space-y-2.5 animate-pulse">
						{#each [1,2,3,4] as _}
							<div class="h-3 bg-gray-100 rounded" style="width:{75 + Math.random()*20}%"></div>
						{/each}
					</div>
				{:else if analysis}
					<div class="text-sm text-gray-700 leading-relaxed space-y-3">
						{#each analysis.split('\n').filter(p => p.trim()) as para}
							<p>{para}</p>
						{/each}
					</div>
				{:else if analysisErr}
					<div class="flex items-start gap-3 text-sm">
						<svg class="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
						<div>
							<p class="font-medium text-gray-700">AI 分析暂时不可用</p>
							<p class="text-xs text-gray-400 mt-0.5">{analysisErr}</p>
						</div>
					</div>
				{:else if !sectors.length}
					<p class="text-sm text-gray-400">等待板块数据加载后自动生成分析…</p>
				{/if}
			</div>
		</div>

		<!-- 页脚 -->
		<p class="text-center text-xs text-gray-300 pb-4">
			数据来源：
			<a href="https://finance.sina.com.cn" target="_blank" rel="noopener" class="hover:text-gray-500 transition-colors">新浪财经</a> ·
			<a href="https://www.sge.com.cn" target="_blank" rel="noopener" class="hover:text-gray-500 transition-colors">上海黄金交易所</a> ·
			<a href="https://data.eastmoney.com" target="_blank" rel="noopener" class="hover:text-gray-500 transition-colors">东方财富</a> ·
			<a href="https://xxapi.cn" target="_blank" rel="noopener" class="hover:text-gray-500 transition-colors">行行查 xxapi.cn</a>
			· 仅供参考，不构成投资建议
		</p>

		{/if}
	</div>
</div>
