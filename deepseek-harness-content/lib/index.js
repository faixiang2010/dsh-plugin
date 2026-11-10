// src/shared.ts
/** 宿主端与浏览器端共用的接口约定。 */
/** 总结接口在宿主上的绝对路径（connection 精确路由以 /api 开头）。 */
const ROUTE_PATH = "/api/dawei-summary/summarize";
// src/index.ts
/**
* 宿主半边：提供 /api/dawei-summary/summarize，用会话里的模型把整段对话
* 提炼成关键信息。浏览器半边只负责收集原文与展示，不接触模型调用。
*/
const name = "deepseek-harness-content";
/** connection 提供路由注册；llm 提供模型调用。 */
const inject = ["llm", "connection"];
const DEFAULTS = {
	maxOutputTokens: 800,
	timeoutMs: 9e4,
	maxInputChars: 16e3
};
/** 系统提示：限定只输出三段要点，避免模型写成长篇。 */
const SYSTEM_PROMPT = [
	"你是会话记录助手。请阅读用户与 AI 助手的对话，提炼出关键信息。",
	"严格按下面三节输出 Markdown，不要输出其它内容：",
	"## 我的诉求",
	"## 关键结论",
	"## 待办与未决",
	"要求：",
	"1. 站在“用户”一侧：诉求、约束、决定、偏好、对方案的纠错都要记录；助手的话只作为结论背景。",
	"2. 每节用无序列表，1-5 条，每条不超过 40 个字，写成结论式的短句。",
	"3. 某一节确实没有内容时写“- 无”。",
	"4. 不要复述原话，不要寒暄，不要编造对话里没有的信息。"
].join("\n");
/** 构造 JSON 响应。 */
function json(status, body) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
/** 把任意异常压成一句能给用户看的话。 */
function describeError(error) {
	if (error instanceof Error) return error.message;
	return String(error);
}
/** 解析模型路由：显式配置优先，否则取第一个 provider 的第一个模型。 */
async function resolveRoute(ctx, config) {
	if (config.provider !== void 0 && config.model !== void 0) return {
		provider: config.provider,
		model: config.model
	};
	if (config.provider !== void 0 || config.model !== void 0) throw new Error("provider 与 model 必须同时配置");
	const providers = ctx.llm.listProviders();
	if (providers.length === 0) throw new Error("宿主没有注册任何模型提供方");
	for (const provider of providers) {
		const first = (await ctx.llm.listModels(provider.id))[0];
		if (first !== void 0) return {
			provider: provider.id,
			model: first.id
		};
	}
	throw new Error("没有可用的模型，请在插件配置里指定 provider 与 model");
}
/** 截断过长的会话记录，保留最近的部分。 */
function clipTranscript(transcript, limit) {
	return transcript.length <= limit ? transcript : `（前文已省略）\n${transcript.slice(-limit)}`;
}
/** 调一次模型并拼出完整文本。 */
async function complete(ctx, config, route, transcript, signal) {
	const maxTokens = config.maxOutputTokens ?? DEFAULTS.maxOutputTokens;
	const call = await ctx.llm.prepareCall({
		...route,
		maxTokens
	}, signal);
	const messages = [{
		role: "user",
		content: [{
			type: "text",
			text: transcript
		}]
	}];
	let text = "";
	for await (const chunk of call.stream({
		...call.config,
		system: SYSTEM_PROMPT,
		messages,
		signal
	})) {
		if (chunk.type === "text-delta") text += chunk.text;
		if (chunk.type === "finish") {
			const reason = chunk.reason;
			if (reason.kind === "error" || reason.kind === "aborted") throw new Error(`${reason.failure.code}: ${reason.failure.message}`);
		}
	}
	return text.trim();
}
/** 处理一次总结请求。 */
async function handleSummarize(ctx, config, request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json(400, {
			ok: false,
			error: "请求体不是合法 JSON"
		});
	}
	const raw = typeof body.transcript === "string" ? body.transcript.trim() : "";
	if (raw === "") return json(400, {
		ok: false,
		error: "会话内容为空"
	});
	const transcript = clipTranscript(raw, config.maxInputChars ?? DEFAULTS.maxInputChars);
	const timeout = config.timeoutMs ?? DEFAULTS.timeoutMs;
	const signal = AbortSignal.any([AbortSignal.timeout(timeout), request.signal]);
	try {
		const route = await resolveRoute(ctx, config);
		const summary = await complete(ctx, config, route, transcript, signal);
		if (summary === "") return json(502, {
			ok: false,
			error: "模型没有返回内容"
		});
		return json(200, {
			ok: true,
			summary,
			provider: route.provider,
			model: route.model
		});
	} catch (error) {
		const message = describeError(error);
		ctx.logger?.warn(`[deepseek-harness-content] 总结失败：${message}`);
		return json(502, {
			ok: false,
			error: message
		});
	}
}
/** 注册路由；插件卸载时自动摘除。 */
function apply(ctx, config = {}) {
	ctx.effect(() => {
		const dispose = ctx.connection.fetch.register({
			path: ROUTE_PATH,
			methods: ["POST"],
			requestBody: "buffered",
			fetch: (request) => handleSummarize(ctx, config, request)
		});
		return () => {
			dispose();
		};
	}, "deepseek-harness-content: summarize route");
	ctx.logger?.info("[deepseek-harness-content] 总结接口已挂载");
}
export { apply, inject, name };
