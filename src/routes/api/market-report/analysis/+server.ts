import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface SectorData { rank: number; name: string; changePct: number; mainFlow: number; }
interface GoldData  { valid: boolean; price: number; change: number; changePct: number; unit: string; }

function fmt(s: SectorData): string {
	const pct   = `${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%`;
	const dir   = s.mainFlow >= 0 ? '流入' : '流出';
	const flow  = Math.abs(s.mainFlow).toFixed(2);
	return `${s.name}（${pct}，净${dir}${flow}亿）`;
}

interface Provider { url: string; model: string; key: string; label: string; }

// 按优先级依次尝试，任意一个成功即返回
async function callLLMWithFallback(prompt: string): Promise<{ text: string; label: string; error: string }> {
	const providers: Provider[] = [
		env.GROQ_API_KEY     && { url: 'https://api.groq.com/openai/v1/chat/completions',        model: 'llama-3.3-70b-versatile', key: env.GROQ_API_KEY,     label: 'Groq · Llama 3.3 70B'    },
		env.GLM_API_KEY      && { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',  model: 'glm-4-flash',             key: env.GLM_API_KEY,      label: '智谱 · GLM-4 Flash'       },
		env.DEEPSEEK_API_KEY && { url: 'https://api.deepseek.com/chat/completions',              model: 'deepseek-chat',           key: env.DEEPSEEK_API_KEY, label: 'DeepSeek · deepseek-chat' },
	].filter(Boolean) as Provider[];

	let lastErr = '未配置任何 LLM API Key';

	for (const p of providers) {
		try {
			console.log(`[Analysis] 尝试 ${p.label}...`);
			const ctrl  = new AbortController();
			const timer = setTimeout(() => ctrl.abort(), 45000);

			const res = await fetch(p.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
				body: JSON.stringify({
					model: p.model,
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.65,
					max_tokens: 900
				}),
				signal: ctrl.signal
			});
			clearTimeout(timer);

			if (!res.ok) {
				const errBody = await res.text().catch(() => '');
				lastErr = `${p.label} 返回 ${res.status}`;
				console.warn(`[Analysis] ${lastErr}:`, errBody.slice(0, 120));
				continue; // 切换下一个
			}

			const data = await res.json();
			const text: string = data.choices?.[0]?.message?.content ?? '';
			if (!text) { lastErr = `${p.label} 返回空内容`; continue; }

			console.log(`[Analysis] ✓ ${p.label}，字数=${text.length}`);
			return { text, label: p.label, error: '' };
		} catch (e) {
			lastErr = `${p.label}: ${(e as Error).message}`;
			console.warn('[Analysis]', lastErr);
		}
	}

	return { text: '', label: '', error: lastErr };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { gold, sectors } = (await request.json()) as { gold: GoldData | null; sectors: SectorData[] };

		console.log(`[Analysis] sectors=${sectors?.length ?? 0}`);
		if (!sectors?.length) return json({ analysis: '', model: '', error: '板块数据为空' });

		const sorted = [...sectors].sort((a, b) => b.mainFlow - a.mainFlow);
		const topIn  = sorted.slice(0, 5);
		const topOut = sorted.slice(-5).reverse();
		const kws    = ['半导体', '有色金属', '贵金属', '黄金', '储能', '新能源', '军工', '人工智能', '芯片'];
		const notable = sectors.filter(s => kws.some(k => s.name.includes(k))).slice(0, 6);

		const goldLine = gold?.valid && gold.price > 0
			? `Au9999现货黄金：¥${gold.price.toFixed(2)}/${gold.unit}，今日${gold.change >= 0 ? '上涨' : '下跌'}${Math.abs(gold.change).toFixed(2)}元（${gold.changePct >= 0 ? '+' : ''}${gold.changePct.toFixed(2)}%）`
			: '黄金现货数据暂未获取（市场可能未开盘）';

		const prompt = `你是资深A股市场分析师。根据以下今日实时数据，用中文撰写专业市场日报分析（约280字）。

【黄金行情】
${goldLine}

【板块主力净流入 TOP5】
${topIn.map((s, i) => `${i + 1}. ${fmt(s)}`).join('\n')}

【板块主力净流出 TOP5】
${topOut.map((s, i) => `${i + 1}. ${fmt(s)}`).join('\n')}

${notable.length ? `【重点关注板块】\n${notable.map(fmt).join('\n')}` : ''}

请按以下结构输出（段落间空一行，不要输出标题或序号）：
第一段：黄金走势分析，结合国际宏观背景简要点评（2句）。
第二段：今日主力资金流向分析——哪些方向得到青睐，哪些遭到抛售，市场风格判断（3句）。
第三段：值得关注的投资方向，给出2-3个具体板块并简述逻辑（每个板块一句）。
第四段：风险提示（1句话）。
要求：专业简洁，数据驱动，段落清晰，语言流畅。`;

		const { text, label, error } = await callLLMWithFallback(prompt);
		return json({ analysis: text, model: label, error });
	} catch (e) {
		const msg = (e as Error).message;
		console.error('[Analysis] 异常:', msg);
		return json({ analysis: '', model: '', error: msg });
	}
};
