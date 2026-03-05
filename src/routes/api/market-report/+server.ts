import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
type SectorRow = {
	rank: number;
	code: string;
	name: string;
	changePct: number;
	changeAmt: number;
	mainFlow: number;
	mainRatio: number;
};

let sectorCache: { items: SectorRow[]; updatedAt: number } = { items: [], updatedAt: 0 };

// ──────────────────────────────────────────────
// 通用超时 fetch
// ──────────────────────────────────────────────
async function fetchTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
	const ctrl  = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), ms);
	try {
		return await fetch(url, { ...init, signal: ctrl.signal });
	} finally {
		clearTimeout(timer);
	}
}

// ──────────────────────────────────────────────
// 现货黄金 Au9999
// ──────────────────────────────────────────────
async function trySinaGold() {
	console.log('[Gold-Sina] 请求中...');
	const res  = await fetchTimeout(
		'https://hq.sinajs.cn/list=Au9999',
		{ headers: { 'User-Agent': UA, Referer: 'https://finance.sina.com.cn/' } },
		6000
	);
	const text = await res.text();
	console.log('[Gold-Sina] 原始:', text.slice(0, 120));
	const m = text.match(/hq_str_Au9+\d*="([^"]+)"/);
	if (!m) return null;
	const parts = m[1].split(',');
	if (parts.length < 5) return null;
	const price = parseFloat(parts[0]);
	// Au9999 单价应在 200–5000 元/克，过滤掉乱码或日期误匹配
	if (!price || price < 200 || price > 5000) {
		console.warn('[Gold-Sina] 价格不合理，丢弃:', price, 'parts[0]=', parts[0]);
		return null;
	}
	return {
		valid: true, price,
		prevClose: parseFloat(parts[2]) || price,
		change:    parseFloat(parts[3]) || 0,
		changePct: parseFloat(parts[4]) || 0,
		unit: '克', source: '新浪财经 · 上海黄金交易所 Au9999',
		sourceUrl: 'https://finance.sina.com.cn/futuremarket/',
		isEstimate: false
	};
}

// 来源 2：东方财富 · AU9999 直连行情（优先真实现货，避免长期估算值）
async function tryEastMoneyGold() {
	console.log('[Gold-EastMoney] 请求中...');

	// 118.AU9999 来自东财行情页路由：/q/118.AU9999.html
	const secIds = ['118.AU9999', '100.AU9999', '102.AU9999'];
	const fields = 'f43,f2,f58,f57,f60,f169,f170,f44,f45,f46';

	const parseScaled = (value: unknown) => {
		const n = parseFloat(String(value));
		if (!isFinite(n) || n <= 0) return 0;
		// 极少数接口会返回放大100倍的价格
		return n > 10000 ? parseFloat((n / 100).toFixed(2)) : n;
	};

	for (const secid of secIds) {
		try {
			const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&ut=bd1d9428105693ce1f93d01cba3f8ee5&fltt=2&invt=2&fields=${fields}`;
			const res = await fetchTimeout(
				url,
				{ headers: { 'User-Agent': UA, Referer: 'https://quote.eastmoney.com/' } },
				8000
			);
			const data = await res.json();
			const d = data?.data;
			if (!d) continue;

			const price = parseScaled(d.f43) || parseScaled(d.f2) || parseScaled(d.f60);
			if (!price || price < 200 || price > 5000) continue;

			const prevClose = parseScaled(d.f60) || price;
			const changeRaw = parseFloat(String(d.f169));
			const change = isFinite(changeRaw)
				? (Math.abs(changeRaw) > 100 ? parseFloat((changeRaw / 100).toFixed(2)) : changeRaw)
				: parseFloat((price - prevClose).toFixed(2));
			const changePctRaw = parseFloat(String(d.f170));
			const changePct = isFinite(changePctRaw)
				? (Math.abs(changePctRaw) > 100 ? parseFloat((changePctRaw / 100).toFixed(2)) : changePctRaw)
				: (prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0);

			console.log(`[Gold-EastMoney] 命中 secid=${secid}, price=${price}`);
			return {
				valid: true,
				price,
				prevClose,
				change,
				changePct,
				unit: '克',
				source: '东方财富 · 上海黄金交易所 AU9999',
				sourceUrl: 'https://quote.eastmoney.com/globalfuture/AU9999.html?jump_to_web=true',
				isEstimate: false
			};
		} catch {
			// 尝试下一个 secid
		}
	}

	return null;
}

// 来源 2：东方财富 · 华安黄金ETF(518880) 反推 Au9999（兜底）
// 当前行情口径下，ETF 份价通常接近“元/克”的 1/100 量级，采用 ×100 作为兜底近似。
// 说明：该口径仅在 Sina 与联接基金都不可用时使用，避免出现异常高值。
const ETF_GOLD_PER_SHARE = 0.01; // 克/份（兜底近似口径）

async function tryGoldETF() {
	console.log('[Gold-ETF] 华安 518880 (兜底近似换算)...');
	const res  = await fetchTimeout(
		'https://push2.eastmoney.com/api/qt/stock/get?secid=1.518880&ut=bd1d9428105693ce1f93d01cba3f8ee5&fltt=2&invt=2&fields=f43,f2,f58,f169,f170,f60',
		{ headers: { 'User-Agent': UA, Referer: 'https://quote.eastmoney.com/' } },
		8000
	);
	const data = await res.json();
	const d    = data?.data;
	const safe = (v: unknown) => { const n = parseFloat(String(v)); return isFinite(n) ? n : 0; };
	const etfPrice = safe(d?.f43) || safe(d?.f2) || safe(d?.f60);
	if (!etfPrice) return null;
	const goldPrice = parseFloat((etfPrice / ETF_GOLD_PER_SHARE).toFixed(2));
	const prevETF   = safe(d?.f60) || etfPrice;
	const prevGold  = parseFloat((prevETF / ETF_GOLD_PER_SHARE).toFixed(2));
	console.log(`[Gold-ETF] ETF=${etfPrice}, 换算金价=${goldPrice}`);
	return {
		valid: true, price: goldPrice,
		prevClose: prevGold,
		change:    parseFloat((goldPrice - prevGold).toFixed(2)),
		changePct: safe(d?.f170),
		unit: '克', source: '东方财富 · 华安黄金ETF(518880) 估算（每份≈0.003704克）',
		sourceUrl: 'https://quote.eastmoney.com/sh518880.html',
		isEstimate: true
	};
}

// 来源 2：天天基金 · 华安黄金ETF联接C(000217) 反推 Au9999
// 该基金在支付宝等平台展示口径稳定，可作为比 ETF 更稳妥的兜底。
async function tryFeederGold() {
	try {
		const res = await fetchTimeout(
			`http://fundgz.1234567.com.cn/js/000217.js?rt=${Date.now()}`,
			{ headers: { 'User-Agent': UA, Referer: 'https://fund.eastmoney.com/' } },
			6000
		);
		const text = await res.text();
		const m = text.match(/jsonpgz\((\{.*?\})\)/s);
		if (!m) return null;
		const d = JSON.parse(m[1]);
		const safe = (v: unknown) => { const n = parseFloat(String(v)); return isFinite(n) ? n : 0; };
		const gsz = safe(d.gsz);
		const dwjz = safe(d.dwjz);
		const nav = gsz > 0 ? gsz : dwjz;
		if (!nav) return null;

		const ratio = 270;
		const price = parseFloat((nav * ratio).toFixed(2));
		const prevClose = parseFloat((dwjz * ratio).toFixed(2));
		const change = parseFloat((price - prevClose).toFixed(2));
		const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

		return {
			valid: true,
			price,
			prevClose,
			change,
			changePct,
			unit: '克',
			source: '天天基金 · 华安黄金ETF联接C(000217) 估算（净值×270）',
			sourceUrl: 'https://fund.eastmoney.com/000217.html',
			isEstimate: true
		};
	} catch {
		return null;
	}
}

async function fetchGoldPrice() {
	const t0 = Date.now();
	// 优先级：新浪 Au9999 → 东方财富 Au9999 → 华安联接基金估算 → 华安ETF近似兜底
	const result = (await trySinaGold().catch(() => null))
		?? (await tryEastMoneyGold().catch(() => null))
		?? (await tryFeederGold().catch(() => null))
		?? (await tryGoldETF().catch(() => null));
	console.log(`[Gold] ${result ? result.source : '全部失败'}，耗时 ${Date.now() - t0}ms，价格=${result?.price}`);
	return result;
}

// ──────────────────────────────────────────────
// 黄金 ETF 榜单（东方财富，9支）
// ──────────────────────────────────────────────
// 场内 ETF 金价倍率（与联接基金同一套逻辑）
// ETF 的折算比例存在份额调整等因素，不做硬编码倍率。
// 页面侧统一使用 Au9999 × (今日份价/昨收份价) 做动态近似，避免倍率漂移导致失真。
const ETF_GOLD_RATIO: Record<string, number> = {};

const GOLD_ETFS = [
	{ code: '518880', market: 1, name: '华安黄金ETF' },
	{ code: '518800', market: 1, name: '工银黄金ETF' },
	{ code: '518600', market: 1, name: '国泰黄金ETF' },
	{ code: '518660', market: 1, name: '建信黄金ETF' },
	{ code: '159937', market: 0, name: '易方达黄金ETF' },
	{ code: '159934', market: 0, name: '博时黄金ETF' },
	{ code: '159876', market: 0, name: '广发黄金ETF' },
	{ code: '159812', market: 0, name: '大成黄金ETF' },
	{ code: '159775', market: 0, name: '汇添富黄金ETF' },
];

async function fetchOneETF(etf: typeof GOLD_ETFS[number]) {
	try {
		// 多取 f2（最新价）和 f3（涨跌幅%），作为 f43/f170 在收盘后返回"-"时的兜底
		const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${etf.market}.${etf.code}&ut=bd1d9428105693ce1f93d01cba3f8ee5&fltt=2&invt=2&fields=f43,f2,f57,f58,f169,f170,f3,f44,f45,f46,f60`;
		const res  = await fetchTimeout(url, { headers: { 'User-Agent': UA, Referer: 'https://quote.eastmoney.com/' } }, 8000);
		const data = await res.json();
		const d    = data?.data;
		if (!d) return null;

		// 收盘后 f43 为字符串 "-"，需兜底到 f2（最新价）或 f60（昨收）
		const safe = (v: unknown) => { const n = parseFloat(String(v)); return isFinite(n) ? n : 0; };
		const price     = safe(d.f43) || safe(d.f2) || safe(d.f60);
		const prevClose = safe(d.f60);
		if (!price) return null;

		const changePct = safe(d.f170) || safe(d.f3);
		const changeAmt = safe(d.f169) || (prevClose ? parseFloat((price - prevClose).toFixed(4)) : 0);

		return {
			code:      String(d.f57 ?? etf.code),
			name:      String(d.f58 ?? etf.name),
			price, changePct, changeAmt, prevClose,
			high: safe(d.f44) || price,
			low:  safe(d.f45) || price,
			open: safe(d.f46) || price,
			goldRatio: ETF_GOLD_RATIO[etf.code] ?? 0,
		};
	} catch {
		return null;
	}
}

async function fetchGoldETFs() {
	console.log('[GoldETF] 并行查询 9 支...');
	const t0      = Date.now();
	const results = await Promise.all(GOLD_ETFS.map(fetchOneETF));
	const valid   = results.filter(Boolean);
	console.log(`[GoldETF] 完成 ${valid.length}/${GOLD_ETFS.length}，耗时 ${Date.now() - t0}ms`);
	return valid;
}

// ──────────────────────────────────────────────
// 黄金联接基金 / 主题基金（天天基金估算净值）
// 支付宝展示的正是这类产品
// ──────────────────────────────────────────────
// 各基金的"金价倍率" = 1克黄金对应的份数的倒数
// 公式：参考金价(元/克) = 净值 × 倍率
// 倍率来源：各 ETF 上市时 Au9999 价格（该值极缓慢衰减，年误差 <0.5%）
// 已验证（支付宝截图 2026-03-04）：
//   华安C  3.8940 × 270 = 1051.38 ✓
//   博时C  3.6188 × 285 = 1031.37 ✓
const FUND_GOLD_RATIO: Record<string, number> = {
	'000216': 270, '000217': 270,   // 华安黄金ETF联接 A/C（2013上市，Au9999≈270）
	'000929': 285, '001827': 285,   // 博时黄金ETF联接 A/C（2013上市，Au9999≈285）
	// 其余基金暂无实测数据，使用 Au9999 浮动公式作为近似值
};

const GOLD_FEEDER_CODES = [
	'000216', // 华安黄金ETF联接A
	'000217', // 华安黄金ETF联接C
	'000218', // 工银黄金ETF联接A
	'000219', // 工银黄金ETF联接C
	'000929', // 博时黄金ETF联接A
	'001827', // 博时黄金ETF联接C
	'001227', // 易方达黄金主题A
	'001228', // 易方达黄金主题C
	'001474', // 华夏黄金ETF联接A
	'001475', // 华夏黄金ETF联接C
	'003930', // 南方黄金ETF联接A
	'006479', // 大成黄金ETF联接A
];

async function fetchOneFeederFund(code: string) {
	try {
		// 天天基金估算净值接口（jsonp 格式）
		const res  = await fetchTimeout(
			`http://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`,
			{ headers: { 'User-Agent': UA, Referer: 'https://fund.eastmoney.com/' } },
			6000
		);
		const text = await res.text();
		const m    = text.match(/jsonpgz\((\{.*?\})\)/s);
		if (!m) return null;
		const d        = JSON.parse(m[1]);
		const safe     = (v: unknown) => { const n = parseFloat(String(v)); return isFinite(n) ? n : 0; };
		const gsz      = safe(d.gsz);    // 今日估算净值（交易时段实时更新）
		const dwjz     = safe(d.dwjz);   // 上一交易日净值
		const price    = gsz > 0 ? gsz : dwjz;
		const changePct = safe(d.gszzl);
		if (!price) return null;
		const ratio = FUND_GOLD_RATIO[code] ?? 0;
		return {
			code:       d.fundcode || code,
			name:       d.name     || code,
			price,
			prevClose:  dwjz,
			changePct,
			changeAmt:  parseFloat((price - dwjz).toFixed(4)),
			navDate:    d.jzrq  || '',
			gztime:     d.gztime || '',
			isFeeder:   true,
			goldRatio:  ratio,   // 已知倍率直接用；0 = 未知，页面用 Au9999 近似
		};
	} catch {
		return null;
	}
}

async function fetchFeederFunds() {
	console.log('[FeederFunds] 并行查询联接基金...');
	const t0      = Date.now();
	const results = await Promise.all(GOLD_FEEDER_CODES.map(fetchOneFeederFund));
	const valid   = results.filter(Boolean);
	console.log(`[FeederFunds] ${valid.length}/${GOLD_FEEDER_CODES.length} 完成，耗时 ${Date.now() - t0}ms`);
	return valid;
}

// ──────────────────────────────────────────────
// 银行黄金价格（xxapi.cn 免费端点）
// ──────────────────────────────────────────────
async function fetchBankGold() {
	console.log('[BankGold] 请求 xxapi.cn...');
	const t0 = Date.now();
	try {
		// 无鉴权尝试 xxapi.cn
		const res  = await fetchTimeout(
			'https://api.xxapi.cn/goldprice',
			{ headers: { 'User-Agent': UA } },
			8000
		);
		const data = await res.json();
		if (!res.ok || !Array.isArray(data?.data)) {
			console.warn('[BankGold] xxapi.cn 返回异常:', JSON.stringify(data).slice(0, 80));
			return null;
		}
		console.log(`[BankGold] ✓ ${data.data.length} 条，耗时 ${Date.now() - t0}ms`);
		return {
			source: '行行查 xxapi.cn · 银行黄金实时报价',
			sourceUrl: 'https://xxapi.cn/doc/goldprice',
			items: (data.data as Record<string, unknown>[]).map(r => ({
				bank:    String(r.bank   ?? r.name ?? ''),
				buy:     parseFloat(String(r.buy  ?? r.buyPrice ?? 0)),
				sell:    parseFloat(String(r.sell ?? r.sellPrice ?? 0)),
				time:    String(r.time   ?? r.updateTime ?? ''),
			})).filter(r => r.bank && r.sell > 0)
		};
	} catch (e) {
		console.warn(`[BankGold] 失败 ${Date.now() - t0}ms:`, (e as Error).message);
		return null;
	}
}

// ──────────────────────────────────────────────
// 板块资金流向
// ──────────────────────────────────────────────
async function fetchSectors() {
	console.log('[Sectors] 请求东方财富 push2...');
	const t0 = Date.now();
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
		const params = new URLSearchParams({
			pn: '1', pz: '50', po: '1', np: '1',
			ut: 'bd1d9428105693ce1f93d01cba3f8ee5',
			fltt: '2', invt: '2', fid: 'f3',
			fs:   'm:90+t:2+f:!50',
			fields: 'f2,f3,f4,f12,f14,f62,f184,f205,f206'
		});
		const res  = await fetchTimeout(
			`https://push2.eastmoney.com/api/qt/clist/get?${params}`,
			{ headers: { 'User-Agent': UA, Referer: 'https://data.eastmoney.com/bkzj/hy.html' } },
			15000
		);
		const data = await res.json();
		const diff = data?.data?.diff;
			if (!Array.isArray(diff)) {
				console.warn(`[Sectors] 格式异常 (attempt=${attempt})`);
				continue;
			}
		console.log(`[Sectors] ✓ ${diff.length} 个，耗时 ${Date.now() - t0}ms`);
			const mapped: SectorRow[] = diff.map((item: Record<string, unknown>, idx: number) => ({
			rank:      idx + 1,
			code:      String(item.f12 ?? ''),
			name:      String(item.f14 ?? ''),
			changePct: parseFloat(String(item.f3))  || 0,
			changeAmt: parseFloat(String(item.f4))  || 0,
			mainFlow:  parseFloat(String(item.f62))  ? parseFloat(String(item.f62))  / 1e8 : 0,
			mainRatio: parseFloat(String(item.f184)) || 0,
		}));
			if (mapped.length > 0) {
				sectorCache = { items: mapped, updatedAt: Date.now() };
				return mapped;
			}
		} catch (e) {
			console.error(`[Sectors] 失败 attempt=${attempt}:`, (e as Error).message);
		}
	}

	if (sectorCache.items.length > 0) {
		console.warn(`[Sectors] 使用缓存数据 ${sectorCache.items.length} 条（缓存年龄 ${Date.now() - sectorCache.updatedAt}ms）`);
		return sectorCache.items;
	}

	return [];
}

// ──────────────────────────────────────────────
// GET 入口
// ──────────────────────────────────────────────
export const GET: RequestHandler = async () => {
	console.log('[市场日报] GET 开始');
	const t0 = Date.now();

	const [gold, goldFunds, feederFunds, bankGold, sectors] = await Promise.all([
		fetchGoldPrice(),
		fetchGoldETFs(),
		fetchFeederFunds(),
		fetchBankGold(),
		fetchSectors(),
	]);

	console.log(`[市场日报] GET 完成，耗时 ${Date.now() - t0}ms`);
	return json({ gold, goldFunds, feederFunds, bankGold, sectors, updatedAt: new Date().toISOString() });
};
