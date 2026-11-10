window.__ModuleLoader__.load({
	id: "deepseek-harness-content",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/shared.ts
		/** 浏览器端使用的相对地址；相对路径在 Web 与桌面壳里都能落到当前 Host。 */
		const ROUTE_URL = "api/dawei-summary/summarize";
		// src/client/storage.ts
		const PREFIX = "dsh.dawei-summary.v2:";
		const EMPTY_STATE = {
			v: 2,
			auto: true,
			entries: []
		};
		function keyOf(sessionId) {
			return `${PREFIX}${sessionId}`;
		}
		/** 宽进：坏数据直接退回空状态。 */
		function parse(raw) {
			if (raw === null || raw === "") return EMPTY_STATE;
			try {
				const value = JSON.parse(raw);
				if (value.v !== 2 || !Array.isArray(value.entries)) return EMPTY_STATE;
				const entries = value.entries.filter((entry) => typeof entry?.round === "number" && typeof entry.at === "number" && typeof entry.summary === "string");
				return {
					v: 2,
					auto: value.auto !== false,
					entries: entries.slice(-30)
				};
			} catch {
				return EMPTY_STATE;
			}
		}
		function loadState(sessionId) {
			try {
				return parse(window.localStorage.getItem(keyOf(sessionId)));
			} catch {
				return EMPTY_STATE;
			}
		}
		function saveState(sessionId, state) {
			try {
				const trimmed = {
					...state,
					entries: state.entries.slice(-30)
				};
				window.localStorage.setItem(keyOf(sessionId), JSON.stringify(trimmed));
			} catch {}
		}
		/** 追加一条总结；同一轮次重复生成时覆盖旧的那条。 */
		function appendEntry(state, entry) {
			const kept = state.entries.filter((existing) => existing.round < entry.round);
			return {
				...state,
				entries: [...kept, entry].slice(-30)
			};
		}
		// src/client/transcript.ts
		/** 只取文本块。 */
		function textOf(blocks) {
			if (blocks === void 0) return "";
			return blocks.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n").trim();
		}
		/** 是否是流式过程中的半成品助手消息。append 表示内容还没落定。 */
		function isPartialAssistant(surfaceOp) {
			if (surfaceOp === "append") return true;
			if (surfaceOp !== null && typeof surfaceOp === "object" && "op" in surfaceOp) return surfaceOp.op === "append";
			return false;
		}
		/** 收集对话消息；只保留我方发言与助手最终回复。 */
		function collectMessages(entries) {
			const messages = [];
			for (const entry of entries) {
				if (entry.type !== "event") continue;
				const event = entry.event;
				if (event === void 0) continue;
				if (event.type === "user/message") {
					if (event.data?.source?.kind !== "user") continue;
					const text = textOf(event.data.content);
					if (text !== "") messages.push({
						role: "user",
						text
					});
					continue;
				}
				if (event.type === "assistant/message") {
					if (isPartialAssistant(event.surfaceOp)) continue;
					const text = textOf(event.data?.message?.content);
					if (text !== "") messages.push({
						role: "assistant",
						text
					});
				}
			}
			return messages;
		}
		/** 把消息拼成对话文本，并给出完成的轮次。 */
		function buildTranscript(entries) {
			const messages = collectMessages(entries);
			const userCount = messages.filter((message) => message.role === "user").length;
			return {
				messages,
				rounds: messages[messages.length - 1]?.role === "assistant" ? userCount : Math.max(0, userCount - 1),
				text: messages.map((message) => `${message.role === "user" ? "【我】" : "【助手】"}${message.text}`).join("\n\n")
			};
		}
		// src/client/controller.ts
		/**
		* 一个会话一个控制器：盯住事件窗口，发现新完成的轮次就请求宿主做一次
		* 整段会话的关键信息总结，并把结果落到本地。
		*/
		/** 同一会话复用同一个控制器，避免重复订阅与并发请求。 */
		const controllers = /* @__PURE__ */ new WeakMap();
		/** 流结束后静置这么久再总结，避开仍在追加的流式片段。 */
		const SETTLE_MS = 2e3;
		function describeError(error) {
			if (error instanceof Error) return error.message;
			return String(error);
		}
		/** 把宿主响应转成可展示的结果。 */
		async function requestSummary(transcript, round) {
			const response = await fetch(ROUTE_URL, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					transcript,
					round
				})
			});
			if (response.status === 404) throw new Error("宿主端未启用：插件需要以 bundle 方式安装并重载");
			const payload = await response.json();
			if (!response.ok || payload.ok !== true || typeof payload.summary !== "string") throw new Error(payload.error ?? `宿主返回 ${response.status}`);
			return {
				round,
				at: Date.now(),
				summary: payload.summary,
				provider: payload.provider,
				model: payload.model
			};
		}
		/** 会话 id 只用于本地存储分桶。 */
		function controllerFor(binding, sessionId) {
			const cached = controllers.get(binding);
			if (cached !== void 0) return cached;
			let persisted = loadState(sessionId);
			let state = {
				entries: persisted.entries,
				auto: persisted.auto,
				running: false,
				rounds: 0
			};
			const listeners = /* @__PURE__ */ new Set();
			const publish = () => {
				for (const listener of listeners) listener();
			};
			const update = (patch) => {
				state = {
					...state,
					...patch
				};
				publish();
			};
			let revision = -1;
			let scheduled;
			let inFlight = false;
			const schedule = () => {
				if (scheduled !== void 0) clearTimeout(scheduled);
				scheduled = setTimeout(() => {
					scheduled = void 0;
					if (!inFlight) run();
				}, SETTLE_MS);
			};
			const run = () => {
				if (inFlight) return;
				const transcript = buildTranscript(binding.eventSource.getSnapshot().entries);
				if (transcript.rounds <= 0 || transcript.text.trim() === "") {
					update({ error: "还没有可总结的对话" });
					return;
				}
				inFlight = true;
				update({
					running: true,
					error: void 0
				});
				requestSummary(transcript.text, transcript.rounds).then((entry) => {
					persisted = appendEntry({
						...persisted,
						auto: state.auto
					}, entry);
					saveState(sessionId, persisted);
					update({
						entries: persisted.entries,
						running: false
					});
				}).catch((error) => {
					update({
						running: false,
						error: describeError(error)
					});
				}).finally(() => {
					inFlight = false;
				});
			};
			const sync = () => {
				const snapshot = binding.eventSource.getSnapshot();
				if (snapshot.revision === revision) return;
				revision = snapshot.revision;
				const transcript = buildTranscript(snapshot.entries);
				const latest = persisted.entries[persisted.entries.length - 1];
				const behind = transcript.rounds > (latest?.round ?? 0);
				update({ rounds: transcript.rounds });
				if (state.auto && behind && transcript.rounds > 0) schedule();
			};
			const controller = {
				hooks: { summary: {
					getSnapshot: () => state,
					subscribe: (listener) => {
						listeners.add(listener);
						return () => {
							listeners.delete(listener);
						};
					}
				} },
				summarize: () => {
					run();
				},
				clear: () => {
					persisted = {
						...persisted,
						entries: []
					};
					saveState(sessionId, persisted);
					update({
						entries: [],
						error: void 0
					});
				},
				setAuto: (auto) => {
					persisted = {
						...persisted,
						auto
					};
					saveState(sessionId, persisted);
					update({ auto });
					if (auto) schedule();
				}
			};
			controllers.set(binding, controller);
			binding.eventSource.subscribe(sync);
			sync();
			return controller;
		}
		// src/client/DaweiSummaryView.tsx
		/** 「大伟总结」面板：展示模型对整段会话生成的关键信息。 */
		function formatTime(time) {
			const date = new Date(time);
			if (Number.isNaN(date.getTime())) return "--:--";
			const pad = (value) => String(value).padStart(2, "0");
			return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
		}
		/** 极简 Markdown：只认二级标题和无序列表，其余按段落渲染。 */
		function renderSummary(markdown) {
			const nodes = [];
			let bullets = [];
			const flush = () => {
				if (bullets.length === 0) return;
				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
					className: "dws-bullets",
					children: bullets.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item }, `${index}-${item.slice(0, 8)}`))
				}, `ul-${nodes.length}`));
				bullets = [];
			};
			markdown.split("\n").forEach((line, index) => {
				const text = line.trim();
				if (text === "") return;
				if (text.startsWith("## ")) {
					flush();
					nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
						className: "dws-section",
						children: text.slice(3)
					}, `h-${index}`));
					return;
				}
				const bullet = /^[-*]\s+(.*)$/.exec(text) ?? /^\d+[.、)]\s+(.*)$/.exec(text);
				if (bullet !== null) {
					bullets.push(bullet[1]);
					return;
				}
				flush();
				nodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dws-para",
					children: text
				}, `p-${index}`));
			});
			flush();
			return nodes;
		}
		function EntryCard({ entry, index }) {
			const [open, setOpen] = (0, react.useState)(index === 0);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: "dws-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dws-card-head",
						onClick: () => setOpen(!open),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dws-round",
								children: [
									"第 ",
									entry.round,
									" 轮"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dws-meta-text",
								children: formatTime(entry.at)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dws-chevron",
								children: open ? "收起" : "展开"
							})
						]
					}),
					open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dws-body",
						children: renderSummary(entry.summary)
					}),
					open && (entry.provider !== void 0 || entry.model !== void 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dws-model",
						children: [
							entry.provider ?? "?",
							" / ",
							entry.model ?? "?"
						]
					})
				]
			});
		}
		function DaweiSummaryView({ useSummary, summarize, clear, setAuto }) {
			const state = useSummary((value) => value);
			const latestFirst = [...state.entries].reverse();
			const upToDate = state.rounds > 0 && (state.entries[state.entries.length - 1]?.round ?? 0) >= state.rounds;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dws-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dws-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dws-head-main",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dws-title",
								children: "大伟总结"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dws-sub",
								children: state.running ? "正在让模型通读整段会话…" : `已完成 ${state.rounds} 轮对话 · 历史 ${state.entries.length} 条 · 存在本机`
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dws-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dws-btn",
								onClick: summarize,
								disabled: state.running || state.rounds === 0,
								children: state.running ? "总结中…" : upToDate ? "重新总结" : "立即总结"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dws-btn",
								onClick: clear,
								disabled: state.running || state.entries.length === 0,
								children: "清空"
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: "dws-switch",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: state.auto,
							onChange: (event) => setAuto(event.target.checked)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "每轮结束后自动总结" })]
					}),
					state.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dws-error",
						children: state.error
					}),
					state.entries.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dws-empty",
						children: state.running ? "模型正在通读这段会话，稍等…" : "这个会话还没有总结。点「立即总结」，让模型把整段对话里的关键信息提炼出来。"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dws-list",
						children: latestFirst.map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EntryCard, {
							entry,
							index
						}, `${entry.round}-${entry.at}`))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dws-foot",
						children: "总结由会话所用的模型生成，可能不完整；只保存在这台电脑的浏览器本地。"
					})
				]
			});
		}
		// src/client/styles.ts
		/** 「大伟总结」面板的全部样式，运行时以 <style> 注入。 */
		const STYLES = `
.dws-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 20px 32px;
  color: inherit;
  font-size: 13px;
  line-height: 1.65;
}
.dws-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0 12px;
  background: var(--dws-head-bg, transparent);
  border-bottom: 1px solid rgba(127, 127, 127, 0.18);
}
.dws-head-main { flex: 1 1 auto; min-width: 0; }
.dws-title { font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
.dws-sub { margin-top: 2px; font-size: 12px; opacity: 0.62; }
.dws-actions { display: flex; gap: 8px; flex: 0 0 auto; }
.dws-btn {
  appearance: none;
  padding: 4px 10px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.dws-btn:hover:not(:disabled) { background: rgba(127, 127, 127, 0.12); }
.dws-btn:disabled { opacity: 0.45; cursor: default; }
.dws-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.72;
  cursor: pointer;
  user-select: none;
}
.dws-switch input { accent-color: var(--dsw-alias-brand-primary, #4a7dff); }
.dws-error {
  margin-top: 12px;
  padding: 8px 10px;
  border: 1px solid rgba(220, 80, 80, 0.42);
  border-radius: 6px;
  background: rgba(220, 80, 80, 0.08);
  font-size: 12px;
  word-break: break-word;
}
.dws-list { display: flex; flex-direction: column; gap: 10px; padding-top: 14px; }
.dws-card {
  border: 1px solid rgba(127, 127, 127, 0.18);
  border-radius: 8px;
  background: var(--dws-card-bg, rgba(127, 127, 127, 0.045));
  overflow: hidden;
}
.dws-card-head {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.dws-card-head:hover { background: rgba(127, 127, 127, 0.08); }
.dws-round { font-weight: 600; }
.dws-meta-text { opacity: 0.55; }
.dws-chevron { margin-left: auto; font-size: 11px; opacity: 0.55; }
.dws-body { padding: 0 12px 10px; }
.dws-section {
  margin: 10px 0 4px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
}
.dws-section:first-child { margin-top: 2px; }
.dws-bullets { margin: 0; padding-left: 18px; }
.dws-bullets li { margin: 2px 0; word-break: break-word; }
.dws-para { margin: 4px 0; word-break: break-word; }
.dws-model {
  padding: 0 12px 10px;
  font-size: 11px;
  opacity: 0.4;
}
.dws-empty {
  margin-top: 28px;
  padding: 24px 16px;
  border: 1px dashed rgba(127, 127, 127, 0.3);
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.8;
}
.dws-foot { margin-top: 18px; font-size: 11px; opacity: 0.42; }
`;
		// src/client/index.tsx
		/** 大伟总结：在会话视图标签条上加一个「大伟总结」入口。 */
		const name = "deepseek-harness-content";
		/** 只依赖槽位服务与会话服务；两者都由 DSH 客户端内置提供。 */
		const inject = ["slots", "sessions"];
		/** 拿不到会话绑定时的空数据源，保证标签仍然可渲染。 */
		const EMPTY = {
			hooks: { summary: {
				getSnapshot: () => ({
					entries: [],
					auto: false,
					running: false,
					rounds: 0
				}),
				subscribe: () => () => {}
			} },
			summarize: () => {},
			clear: () => {},
			setAuto: () => {}
		};
		/** 注入面板样式；重复加载时只保留一份。 */
		function mountStyles() {
			const id = "deepseek-harness-content:styles";
			const existing = document.getElementById(id);
			if (existing !== null) return () => {
				existing.remove();
			};
			const element = document.createElement("style");
			element.id = id;
			element.textContent = STYLES;
			document.head.appendChild(element);
			return () => {
				element.remove();
			};
		}
		function apply(ctx) {
			ctx.effect(mountStyles, "deepseek-harness-content: styles");
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "dawei-summary",
				order: 100,
				label: () => "大伟总结",
				inject: (sessionId) => {
					const binding = ctx.sessions.binding(sessionId);
					return binding === void 0 ? EMPTY : controllerFor(binding, sessionId);
				}
			}, DaweiSummaryView));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
