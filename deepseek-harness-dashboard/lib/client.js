window.__ModuleLoader__.load({
	id: "dsh-dashboard-wuhan",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/client/themes.ts
		const THEMES = [
			{
				id: "cyber-blue",
				name: "Cyber Blue",
				desc: "赛博蓝 · 默认科幻大屏",
				preview: "linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%)",
				accentPalette: [
					"#00f0ff",
					"#7c3aed",
					"#f0ab00",
					"#00ff88"
				]
			},
			{
				id: "midnight-gold",
				name: "Midnight Gold",
				desc: "暗夜金 · 高端商务光谷之光",
				preview: "linear-gradient(135deg, #f0ab00 0%, #ff6a00 100%)",
				accentPalette: [
					"#f0ab00",
					"#ff6a00",
					"#ffd86b",
					"#ff9f1c"
				]
			},
			{
				id: "aurora-green",
				name: "Aurora Green",
				desc: "极光绿 · 生态科技光谷硅谷",
				preview: "linear-gradient(135deg, #00ff88 0%, #ff3d7f 100%)",
				accentPalette: [
					"#00ff88",
					"#ff3d7f",
					"#38bdf8",
					"#a78bfa"
				]
			}
		];
		const DEFAULT_THEME = "cyber-blue";
		const STORAGE_KEY = "dsh-dashboard-wuhan.theme";
		// src/client/useTheme.ts
		/** useTheme —— localStorage 持久化 + 跨标签页同步 + MutationObserver 监听 DOM 变化。 */
		function readFromStorage() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw === "cyber-blue" || raw === "midnight-gold" || raw === "aurora-green") return raw;
			} catch {}
			return DEFAULT_THEME;
		}
		function applyThemeClass(root, id) {
			if (!root) return;
			root.classList.remove("dwd-theme-cyber-blue", "dwd-theme-midnight-gold", "dwd-theme-aurora-green");
			root.classList.add(`dwd-theme-${id}`);
		}
		function useTheme() {
			const [theme, setThemeState] = (0, react.useState)(() => readFromStorage());
			const rootRef = (0, react.useRef)(null);
			const setTheme = (0, react.useCallback)((next) => {
				try {
					localStorage.setItem(STORAGE_KEY, next);
				} catch {}
				setThemeState(next);
				applyThemeClass(rootRef.current ?? document.querySelector(".dwd-root"), next);
			}, []);
			(0, react.useEffect)(() => {
				const tryFind = () => {
					const el = document.querySelector(".dwd-root");
					if (el) {
						rootRef.current = el;
						applyThemeClass(el, readFromStorage());
						return true;
					}
					return false;
				};
				if (!tryFind()) {
					const id = setInterval(() => {
						if (tryFind()) clearInterval(id);
					}, 200);
					return () => clearInterval(id);
				}
			}, []);
			(0, react.useEffect)(() => {
				const handler = (e) => {
					if (e.key === "dsh-dashboard-wuhan.theme" && e.newValue) {
						const v = e.newValue;
						setThemeState(v);
						applyThemeClass(rootRef.current, v);
					}
				};
				window.addEventListener("storage", handler);
				return () => window.removeEventListener("storage", handler);
			}, []);
			return [theme, setTheme];
		}
		// src/client/WuhanDashboard.tsx
		/**
		* 武汉城市科技大屏面板 —— 三套主题自适应。
		* 主题配置通过右上角 gear 按钮弹出抽屉，替代有问题的 plugins.row.config slot。
		*/
		function WuhanDashboard({ t }) {
			const [theme, setTheme] = useTheme();
			const [drawerOpen, setDrawerOpen] = (0, react.useState)(false);
			const palette = (0, react.useMemo)(() => THEMES.find((tm) => tm.id === theme)?.accentPalette ?? THEMES[0].accentPalette, [theme]);
			const [c0, c1, c2, c3] = palette;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dwd-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-bg",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-bg-grid" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-bg-scan" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-bg-glow dwd-bg-glow--a" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-bg-glow dwd-bg-glow--b" })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dwd-hero",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-hero-corner dwd-hero-corner--tl" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-hero-corner dwd-hero-corner--tr" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-hero-corner dwd-hero-corner--bl" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-hero-corner dwd-hero-corner--br" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-hero-top",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-hero-badge",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dwd-dot-pulse" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dwd-badge-text",
										children: "LIVE · WUHAN · 武汉"
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-hero-right",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dwd-hero-meta",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dwd-meta-item",
											children: "DATA // 2024"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dwd-meta-item",
											children: "SYS // ONLINE"
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dwd-gear-btn",
										type: "button",
										onClick: () => setDrawerOpen((v) => !v),
										"aria-label": "Theme settings",
										title: t("cfgTitle"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
											width: "18",
											height: "18",
											viewBox: "0 0 24 24",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.8",
											strokeLinecap: "round",
											strokeLinejoin: "round",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
												cx: "12",
												cy: "12",
												r: "3"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })]
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
								className: "dwd-title",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dwd-title-glitch",
									children: t("wuhanIntro")
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dwd-subtitle",
								children: t("subtitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-hero-divider",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dwd-divider-bar" }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dwd-divider-diamond",
										children: "◆"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dwd-divider-bar" })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dwd-kpi-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KpiCard, {
								label: t("population"),
								value: t("populationValue"),
								accent: c0
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KpiCard, {
								label: t("area"),
								value: t("areaValue"),
								accent: c1
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KpiCard, {
								label: "GDP",
								value: t("gdpValue"),
								accent: c2
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KpiCard, {
								label: t("founded"),
								value: t("foundedValue"),
								accent: c3
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-grid",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("geography"),
								accent: c0,
								icon: "🌐",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: "dwd-kv",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("location") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("locationValue") })] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("climate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("climateValue") })] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dwd-kv-full",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("water") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("waterValue") })]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("history"),
								accent: c2,
								icon: "📜",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "dwd-prose",
									children: t("historyContent")
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("basicInfo"),
								accent: c1,
								icon: "📋",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: "dwd-kv",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("province") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("provinceValue") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("nickname") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("nicknameValue") })] })]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("economy"),
								accent: c3,
								icon: "💼",
								highlight: true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: "dwd-kv",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dwd-kv-full",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("tech") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
											className: "dwd-optics-val",
											children: t("techValue")
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dwd-kv-full",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("industries") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("industriesValue") })]
									})]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("culture"),
								accent: palette[3] ?? c0,
								icon: "🎭",
								full: true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-three-col",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dwd-col",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dwd-col-tag",
													children: "FOOD"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("famousFoods") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("famousFoodsValue") })
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dwd-col",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dwd-col-tag",
													children: "SCENIC"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("famousAttractions") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("famousAttractionsValue") })
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dwd-col",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dwd-col-tag",
													children: "EDU"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("famousUniversities") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("famousUniversitiesValue") })
											]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
								title: t("traffic"),
								accent: palette[0] ?? c0,
								icon: "🚄",
								full: true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "dwd-prose",
									children: t("trafficContent")
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "dwd-footer",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("footer") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dwd-footer-sep",
								children: "|"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "SYS: ALL NOMINAL" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dwd-footer-sep",
								children: "|"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "BUILD: DWD-v0.2" })
						]
					}),
					drawerOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemeDrawer, {
						theme,
						onSelect: (id) => {
							setTheme(id);
							setDrawerOpen(false);
						},
						onClose: () => setDrawerOpen(false),
						t
					}),
					drawerOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-backdrop",
						onClick: () => setDrawerOpen(false)
					})
				]
			});
		}
		/** 右侧滑出的主题选择抽屉 */
		function ThemeDrawer({ theme, onSelect, onClose, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
				className: "dwd-drawer",
				role: "dialog",
				"aria-label": t("cfgTitle"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-drawer-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dwd-drawer-title",
							children: t("cfgTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dwd-drawer-sub",
							children: t("cfgDesc")
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "dwd-drawer-close",
							type: "button",
							onClick: onClose,
							"aria-label": "Close",
							children: "✕"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-drawer-body",
						children: THEMES.map((tm) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `dwd-drawer-card${theme === tm.id ? " dwd-drawer-card--active" : ""}`,
							onClick: () => onSelect(tm.id),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dwd-drawer-preview",
								style: { background: tm.preview },
								children: theme === tm.id && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dwd-drawer-check",
									children: "✓"
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-drawer-info",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dwd-drawer-name",
									children: tm.name
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dwd-drawer-desc",
									children: tm.desc
								})]
							})]
						}, tm.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-drawer-foot",
						children: t("cfgHint")
					})
				]
			});
		}
		function KpiCard({ label, value, accent }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dwd-kpi",
				style: { "--dwd-accent": accent },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-kpi-scan" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-kpi-corner dwd-kpi-corner--tl" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-kpi-corner dwd-kpi-corner--tr" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-kpi-corner dwd-kpi-corner--bl" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-kpi-corner dwd-kpi-corner--br" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-kpi-label",
						children: label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-kpi-value",
						children: value
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-kpi-bar",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
					})
				]
			});
		}
		function Card({ title, accent, icon, children, full, highlight }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: `dwd-card${full ? " dwd-card--full" : ""}${highlight ? " dwd-card--highlight" : ""}`,
				style: { "--dwd-accent": accent },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-card-corner dwd-card-corner--tl" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-card-corner dwd-card-corner--tr" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-card-corner dwd-card-corner--bl" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-card-corner dwd-card-corner--br" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-card-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dwd-card-icon",
								children: icon
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: title }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dwd-card-tag",
								children: "MODULE"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-card-body",
						children
					})
				]
			});
		}
		// src/client/PluginConfig.tsx
		function PluginConfig({ t }) {
			const [theme, setTheme] = useTheme();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dwd-theme-panel",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-theme-panel-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("cfgTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("cfgDesc") })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-theme-panel-grid",
						children: THEMES.map((tm) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `dwd-theme-panel-item${theme === tm.id ? " dwd-theme-panel-item--active" : ""}`,
							onClick: () => setTheme(tm.id),
							"aria-pressed": theme === tm.id,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemeThumb, {
									themeId: tm.id,
									palette: tm.accentPalette
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-theme-panel-meta",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dwd-theme-panel-name",
										children: tm.name
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dwd-theme-panel-desc",
										children: tm.desc
									})]
								}),
								theme === tm.id && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dwd-theme-panel-tick",
									children: "✓"
								})
							]
						}, tm.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-theme-panel-foot",
						children: t("cfgHint")
					})
				]
			});
		}
		/** 单个主题缩略图 —— 用 CSS 拼出小尺寸 dashboard 预览。 */
		function ThemeThumb({ themeId, palette }) {
			const [c0, c1, c2, c3] = palette;
			const themeClass = `dwd-thumb-${themeId.replace(/[^a-z]/gi, "")}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `dwd-thumb ${themeClass}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-thumb-hero",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dwd-thumb-title",
							style: { background: `linear-gradient(90deg, ${c0}, ${c1}, ${c2})` },
							children: "武汉 · 九省通衢"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dwd-thumb-meta",
							children: "DATA//2024"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dwd-thumb-kpi",
						children: palette.map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dwd-thumb-kpi-cell",
							style: {
								borderColor: c,
								boxShadow: `inset 0 0 6px ${c}33`
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dwd-thumb-kpi-num",
								style: { color: c },
								children: [
									"1374万",
									"8494",
									"2.29t",
									"3500+"
								][i]
							})
						}, i))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dwd-thumb-grid",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-thumb-card",
								style: { borderLeftColor: c0 },
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dwd-thumb-card-head",
									style: { color: c0 },
									children: "🌐 地理"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-thumb-card-lines",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-thumb-card",
								style: { borderLeftColor: c1 },
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dwd-thumb-card-head",
									style: { color: c1 },
									children: "📜 历史"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-thumb-card-lines",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dwd-thumb-card dwd-thumb-card--full",
								style: { borderLeftColor: c2 },
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dwd-thumb-card-head",
									style: { color: c2 },
									children: "💼 经济 · 光谷"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dwd-thumb-card-lines",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { width: "80%" } })
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dwd-thumb-scan" })
				]
			});
		}
		// src/client/locales.ts
		/** 中英文词典 —— 面板标题、侧边栏标签等产品可见文字。 */
		const zh = {
			panel: "大伟的仪表盘",
			sidebarIconAria: "大伟的仪表盘",
			wuhanIntro: "武汉 — 九省通衢，江城楚天",
			subtitle: "一座两江交汇、三镇鼎立的英雄之城",
			basicInfo: "基本信息",
			province: "所属省份",
			provinceValue: "湖北省",
			area: "面积",
			areaValue: "约 8494 平方公里",
			population: "常住人口",
			populationValue: "约 1374 万（2024）",
			founded: "建城史",
			foundedValue: "3500 年以上（盘龙城遗址）",
			nickname: "别称",
			nicknameValue: "江城、桥城、光谷、九省通衢",
			geography: "地理与气候",
			location: "位置",
			locationValue: "华中地区、长江与汉江交汇处",
			climate: "气候",
			climateValue: "亚热带季风气候，四季分明，夏季炎热（\"火炉\"），冬季湿冷",
			water: "水资源",
			waterValue: "长江、汉江、东湖（中国最大城中湖）、166 座湖泊",
			history: "历史沿革",
			historyContent: "武汉是楚文化发祥地之一。商代盘龙城遗址距今 3500 年。清末\"汉口\"成为通商口岸，有\"东方芝加哥\"之称。1911 年武昌起义打响辛亥革命第一枪。1927 年三镇合并设武汉市。2020 年抗击新冠疫情，成为全球焦点。",
			culture: "文化与美食",
			famousFoods: "特色美食",
			famousFoodsValue: "热干面、武昌鱼、黄陂三鲜、面窝、豆皮、鸭脖、糊汤粉、欢喜坨",
			famousAttractions: "著名景点",
			famousAttractionsValue: "黄鹤楼、东湖风景区、户部巷、归元寺、省博物馆、长江大桥、昙华林、江汉路步行街",
			famousUniversities: "知名学府",
			famousUniversitiesValue: "武汉大学、华中科技大学、武汉理工大学、华中农业大学、华中师范大学、中南财经政法大学",
			economy: "经济与产业",
			gdp: "2024 年 GDP",
			gdpValue: "约 2.29 万亿元人民币，全国城市前十",
			industries: "支柱产业",
			industriesValue: "光电子信息（光谷）、汽车制造（东风）、生物医药、智能制造、金融商贸",
			tech: "科创名片",
			techValue: "\"武汉·中国光谷\" —— 全球最大的光纤光缆生产基地，激光产业全国领先",
			traffic: "交通出行",
			trafficContent: "武汉是\"九省通衢\"的交通枢纽。天河机场是华中最大航空港。京广高铁、沪蓉高铁在此交汇。长江中游航运中心。地铁运营里程超 500 公里，多条过江隧道与大桥连接三镇。",
			footer: "—— 大伟的仪表盘 · 随手记录的城市笔记 ——",
			cfgTitle: "大屏主题",
			cfgDesc: "选择你喜欢的武汉科技大屏配色风格，切换即时生效。",
			cfgHint: "提示：主题偏好会自动保存到本机浏览器，跨 DSH 会话保持。"
		};
		const en = {
			panel: "Dawei Dashboard",
			sidebarIconAria: "Dawei Dashboard",
			wuhanIntro: "Wuhan — City of Rivers, Hero of Hubei",
			subtitle: "Where the Yangtze and Han meet, three towns stand as one",
			basicInfo: "Basic Info",
			province: "Province",
			provinceValue: "Hubei",
			area: "Area",
			areaValue: "~8,494 km²",
			population: "Population",
			populationValue: "~13.74 million (2024)",
			founded: "History",
			foundedValue: "3,500+ years (Panlongcheng Ruins)",
			nickname: "Nicknames",
			nicknameValue: "River City, Bridge City, Optics Valley, Gateway to Nine Provinces",
			geography: "Geography & Climate",
			location: "Location",
			locationValue: "Central China, confluence of Yangtze River and Han River",
			climate: "Climate",
			climateValue: "Subtropical monsoon — four distinct seasons; hot summers (\"Furnace\"), damp cold winters",
			water: "Water Resources",
			waterValue: "Yangtze, Han River, East Lake (largest urban lake in China), 166 lakes",
			history: "History",
			historyContent: "Wuhan is one of the birthplaces of Chu culture. The Panlongcheng ruins date back 3,500 years. Hankou opened as a treaty port in the late Qing dynasty, known as the \"Chicago of the East\". The 1911 Wuchang Uprising fired the first shot of the Xinhai Revolution. The three towns merged into Wuhan in 1927. In 2020, the city became the global focus during the COVID-19 outbreak.",
			culture: "Culture & Cuisine",
			famousFoods: "Famous Foods",
			famousFoodsValue: "Hot-dry noodles (reganmian), Wuchang fish, Huangpi three delicacies, mianwo, doupi, duck neck, hutangfen, huanxituo",
			famousAttractions: "Attractions",
			famousAttractionsValue: "Yellow Crane Tower, East Lake, Hubu Alley, Guiyuan Temple, Hubei Museum, Yangtze River Bridge, Tanhualin, Jianghan Road",
			famousUniversities: "Universities",
			famousUniversitiesValue: "Wuhan University, HUST, WUT, HZAU, CCNU, ZUEL",
			economy: "Economy & Industry",
			gdp: "2024 GDP",
			gdpValue: "~2.29 trillion RMB, top 10 in China",
			industries: "Key Industries",
			industriesValue: "Optoelectronics (Optics Valley), automotive (Dongfeng), biomedicine, smart manufacturing, finance",
			tech: "Tech Signature",
			techValue: "\"Wuhan · China Optics Valley\" — world's largest fiber-optic base, leading laser industry",
			traffic: "Transportation",
			trafficContent: "Wuhan is the \"Gateway to Nine Provinces\". Tianhe Airport is Central China's largest. Beijing-Guangzhou and Shanghai-Chengdu high-speed railways meet here. It's the Yangtze mid-stream shipping center. Metro exceeds 500 km, with multiple cross-river bridges and tunnels.",
			footer: "— Dawei Dashboard · City notes —",
			cfgTitle: "Dashboard Theme",
			cfgDesc: "Pick a color palette for the Wuhan dashboard. Changes apply instantly.",
			cfgHint: "Hint: your choice is saved to localStorage and persists across DSH sessions."
		};
		// src/client/index.css?raw
		var client_default = "/* ==========================================================================\n * 大伟的仪表盘 · 武汉科技大屏\n * 三套主题：Cyber Blue / Midnight Gold / Aurora Green\n * 主题通过 .dwd-theme-{id} 类切换，localStorage 持久化。\n * ========================================================================== */\n\n/* ---------- 主题变量：默认 / Cyber Blue ---------- */\n:root,\n.dwd-root.dwd-theme-cyber-blue {\n  --dwd-bg-0: #050a18;\n  --dwd-bg-1: #0a1228;\n  --dwd-bg-2: #0f1d3a;\n  --dwd-primary: #00f0ff;\n  --dwd-secondary: #7c3aed;\n  --dwd-accent-2: #f0ab00;\n  --dwd-accent-3: #00ff88;\n  --dwd-accent-4: #ff3d7f;\n  --dwd-accent-5: #38bdf8;\n  --dwd-text: #c9e4ff;\n  --dwd-text-dim: #7b9bc4;\n  --dwd-text-mute: #3f5d82;\n  --dwd-border: rgba(0, 240, 255, 0.25);\n  --dwd-border-soft: rgba(0, 240, 255, 0.12);\n  --dwd-hero-bg-a: rgba(0, 240, 255, 0.07);\n  --dwd-hero-bg-b: rgba(124, 58, 237, 0.05);\n  --dwd-col-bg: rgba(0, 240, 255, 0.03);\n  --dwd-col-border: rgba(0, 240, 255, 0.12);\n  --dwd-scan: rgba(0, 240, 255, 0.14);\n  --dwd-grid: rgba(0, 240, 255, 0.06);\n  --dwd-title-shadow-a: rgba(0, 240, 255, 0.7);\n  --dwd-title-shadow-b: rgba(0, 240, 255, 0.4);\n  --dwd-title-shadow-c: rgba(124, 58, 237, 0.3);\n  --dwd-title-grad-from: #fff;\n  --dwd-title-grad-a: #00f0ff;\n  --dwd-title-grad-b: #7c3aed;\n  --dwd-title-grad-c: #f0ab00;\n  --dwd-optics-color: #f0ab00;\n  --dwd-optics-shadow: rgba(240, 171, 0, 0.4);\n  --dwd-highlight-color: #f0ab00;\n  --dwd-footer-color: rgba(0, 240, 255, 0.1);\n  --dwd-footer-sep: rgba(0, 240, 255, 0.3);\n  --dwd-scrollbar-track: rgba(0, 240, 255, 0.04);\n  --dwd-scrollbar-from: #00f0ff;\n  --dwd-scrollbar-to: #7c3aed;\n  --dwd-scrollbar-border: rgba(0, 240, 255, 0.25);\n}\n\n/* ---------- Midnight Gold ---------- */\n.dwd-root.dwd-theme-midnight-gold {\n  --dwd-bg-0: #0a0600;\n  --dwd-bg-1: #150c00;\n  --dwd-bg-2: #1f1400;\n  --dwd-primary: #f0ab00;\n  --dwd-secondary: #ff6a00;\n  --dwd-accent-2: #ffd86b;\n  --dwd-accent-3: #ff9f1c;\n  --dwd-accent-4: #ff3d00;\n  --dwd-accent-5: #c77d00;\n  --dwd-text: #ffeccb;\n  --dwd-text-dim: #b89860;\n  --dwd-text-mute: #6e5520;\n  --dwd-border: rgba(240, 171, 0, 0.3);\n  --dwd-border-soft: rgba(240, 171, 0, 0.14);\n  --dwd-hero-bg-a: rgba(240, 171, 0, 0.08);\n  --dwd-hero-bg-b: rgba(255, 106, 0, 0.05);\n  --dwd-col-bg: rgba(240, 171, 0, 0.03);\n  --dwd-col-border: rgba(240, 171, 0, 0.14);\n  --dwd-scan: rgba(240, 171, 0, 0.15);\n  --dwd-grid: rgba(240, 171, 0, 0.06);\n  --dwd-title-shadow-a: rgba(240, 171, 0, 0.8);\n  --dwd-title-shadow-b: rgba(240, 171, 0, 0.45);\n  --dwd-title-shadow-c: rgba(255, 106, 0, 0.35);\n  --dwd-title-grad-from: #fff5d6;\n  --dwd-title-grad-a: #ffd86b;\n  --dwd-title-grad-b: #f0ab00;\n  --dwd-title-grad-c: #ff6a00;\n  --dwd-optics-color: #ff3d00;\n  --dwd-optics-shadow: rgba(255, 61, 0, 0.4);\n  --dwd-highlight-color: #ff6a00;\n  --dwd-footer-color: rgba(240, 171, 0, 0.12);\n  --dwd-footer-sep: rgba(240, 171, 0, 0.35);\n  --dwd-scrollbar-track: rgba(240, 171, 0, 0.04);\n  --dwd-scrollbar-from: #f0ab00;\n  --dwd-scrollbar-to: #ff6a00;\n  --dwd-scrollbar-border: rgba(240, 171, 0, 0.3);\n}\n\n/* ---------- Aurora Green ---------- */\n.dwd-root.dwd-theme-aurora-green {\n  --dwd-bg-0: #020f0a;\n  --dwd-bg-1: #041a12;\n  --dwd-bg-2: #082818;\n  --dwd-primary: #00ff88;\n  --dwd-secondary: #ff3d7f;\n  --dwd-accent-2: #38bdf8;\n  --dwd-accent-3: #a78bfa;\n  --dwd-accent-4: #f472b6;\n  --dwd-accent-5: #22d3ee;\n  --dwd-text: #d1ffe8;\n  --dwd-text-dim: #6ea888;\n  --dwd-text-mute: #2f6e4e;\n  --dwd-border: rgba(0, 255, 136, 0.28);\n  --dwd-border-soft: rgba(0, 255, 136, 0.12);\n  --dwd-hero-bg-a: rgba(0, 255, 136, 0.07);\n  --dwd-hero-bg-b: rgba(255, 61, 127, 0.05);\n  --dwd-col-bg: rgba(0, 255, 136, 0.03);\n  --dwd-col-border: rgba(0, 255, 136, 0.14);\n  --dwd-scan: rgba(0, 255, 136, 0.15);\n  --dwd-grid: rgba(0, 255, 136, 0.06);\n  --dwd-title-shadow-a: rgba(0, 255, 136, 0.75);\n  --dwd-title-shadow-b: rgba(0, 255, 136, 0.4);\n  --dwd-title-shadow-c: rgba(255, 61, 127, 0.3);\n  --dwd-title-grad-from: #e8fff4;\n  --dwd-title-grad-a: #00ff88;\n  --dwd-title-grad-b: #ff3d7f;\n  --dwd-title-grad-c: #a78bfa;\n  --dwd-optics-color: #38bdf8;\n  --dwd-optics-shadow: rgba(56, 189, 248, 0.4);\n  --dwd-highlight-color: #ff3d7f;\n  --dwd-footer-color: rgba(0, 255, 136, 0.12);\n  --dwd-footer-sep: rgba(0, 255, 136, 0.35);\n  --dwd-scrollbar-track: rgba(0, 255, 136, 0.04);\n  --dwd-scrollbar-from: #00ff88;\n  --dwd-scrollbar-to: #ff3d7f;\n  --dwd-scrollbar-border: rgba(0, 255, 136, 0.28);\n}\n\n/* ==========================================================================\n * 大屏主体样式 —— 全部引用 CSS 变量，主题切换即时生效\n * ========================================================================== */\n\n.dwd-root {\n  position: relative;\n  width: 100%;\n  max-width: none;\n  margin: 0;\n  padding: 18px 22px 28px;\n  box-sizing: border-box;\n  color: var(--dwd-text);\n  font-size: 13.5px;\n  line-height: 1.65;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\",\n    \"Hiragino Sans GB\", \"Microsoft YaHei\", sans-serif;\n  overflow-y: auto;\n  overflow-x: hidden;\n  isolation: isolate;\n  transition: background-color 0.4s ease, color 0.4s ease;\n}\n\n/* 滚动条 */\n.dwd-root::-webkit-scrollbar { width: 8px; }\n.dwd-root::-webkit-scrollbar-track { background: var(--dwd-scrollbar-track); }\n.dwd-root::-webkit-scrollbar-thumb {\n  background: linear-gradient(180deg, var(--dwd-scrollbar-from), var(--dwd-scrollbar-to));\n  border-radius: 4px;\n  border: 1px solid var(--dwd-scrollbar-border);\n  box-shadow: 0 0 8px var(--dwd-scrollbar-from);\n}\n.dwd-root::-webkit-scrollbar-thumb:hover {\n  box-shadow: 0 0 12px var(--dwd-scrollbar-from);\n}\n.dwd-root::-webkit-scrollbar-corner { background: transparent; }\n.dwd-root { scrollbar-width: thin; scrollbar-color: var(--dwd-scrollbar-from) var(--dwd-scrollbar-track); }\n\n/* 背景 */\n.dwd-bg {\n  position: absolute; inset: 0; pointer-events: none; z-index: 0;\n  background:\n    radial-gradient(ellipse at 20% 10%, color-mix(in srgb, var(--dwd-primary) 8%, transparent), transparent 55%),\n    radial-gradient(ellipse at 85% 85%, color-mix(in srgb, var(--dwd-secondary) 9%, transparent), transparent 55%),\n    linear-gradient(160deg, var(--dwd-bg-0) 0%, var(--dwd-bg-1) 55%, var(--dwd-bg-2) 100%);\n  transition: background 0.5s ease;\n}\n.dwd-bg-grid {\n  position: absolute; inset: 0;\n  background-image:\n    linear-gradient(var(--dwd-grid) 1px, transparent 1px),\n    linear-gradient(90deg, var(--dwd-grid) 1px, transparent 1px);\n  background-size: 40px 40px;\n  mask-image: radial-gradient(ellipse at center, black 55%, transparent 85%);\n  -webkit-mask-image: radial-gradient(ellipse at center, black 55%, transparent 85%);\n}\n.dwd-bg-scan {\n  position: absolute; inset: 0; height: 120px;\n  background: linear-gradient(180deg, transparent 0%, var(--dwd-scan) 45%, var(--dwd-scan) 50%, var(--dwd-scan) 55%, transparent 100%);\n  animation: dwdScan 6s linear infinite;\n}\n@keyframes dwdScan { 0% { top: -120px; } 100% { top: 100%; } }\n.dwd-bg-glow {\n  position: absolute; width: 480px; height: 480px; border-radius: 50%;\n  filter: blur(80px); opacity: 0.45; transition: background 0.5s ease;\n}\n.dwd-bg-glow--a { top: -120px; left: -100px; background: radial-gradient(circle, var(--dwd-primary), transparent 70%); }\n.dwd-bg-glow--b { bottom: -140px; right: -80px; background: radial-gradient(circle, var(--dwd-secondary), transparent 70%); }\n\n/* Hero */\n.dwd-hero {\n  position: relative; z-index: 1;\n  margin-bottom: 22px; padding: 22px 28px 18px;\n  background: linear-gradient(135deg, var(--dwd-hero-bg-a), var(--dwd-hero-bg-b));\n  border: 1px solid var(--dwd-border); border-radius: 10px; overflow: hidden;\n}\n.dwd-hero-corner, .dwd-kpi-corner, .dwd-card-corner {\n  position: absolute; width: 14px; height: 14px; border-style: solid;\n  border-color: var(--dwd-accent, var(--dwd-primary));\n}\n.dwd-hero-corner { border-color: var(--dwd-primary); }\n.dwd-hero-corner--tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }\n.dwd-hero-corner--tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }\n.dwd-hero-corner--bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }\n.dwd-hero-corner--br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }\n\n.dwd-hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }\n.dwd-hero-badge {\n  display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px;\n  border: 1px solid var(--dwd-border); border-radius: 3px;\n  background: color-mix(in srgb, var(--dwd-primary) 8%, transparent);\n  color: var(--dwd-primary); font-size: 11px; font-weight: 600;\n  letter-spacing: 0.14em; text-transform: uppercase;\n}\n.dwd-dot-pulse {\n  width: 6px; height: 6px; border-radius: 50%;\n  background: var(--dwd-primary); box-shadow: 0 0 8px var(--dwd-primary), 0 0 16px var(--dwd-primary);\n  animation: dwdPulse 1.6s ease-in-out infinite;\n}\n@keyframes dwdPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.6); } }\n.dwd-hero-meta { display: flex; gap: 18px; }\n.dwd-meta-item {\n  font-size: 10.5px; color: var(--dwd-text-mute); letter-spacing: 0.1em;\n  font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n}\n\n/* 标题 */\n.dwd-title { font-size: 34px; font-weight: 800; margin: 0 0 6px; letter-spacing: 0.04em; line-height: 1.2; }\n.dwd-title-glitch {\n  position: relative; color: var(--dwd-title-grad-from);\n  text-shadow: 0 0 8px var(--dwd-title-shadow-a), 0 0 20px var(--dwd-title-shadow-b), 0 0 40px var(--dwd-title-shadow-c);\n  background: linear-gradient(90deg, var(--dwd-title-grad-from) 0%, var(--dwd-title-grad-a) 40%, var(--dwd-title-grad-b) 70%, var(--dwd-title-grad-c) 100%);\n  background-size: 200% auto;\n  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;\n  animation: dwdFlowText 5s linear infinite;\n}\n@keyframes dwdFlowText { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }\n.dwd-subtitle { font-size: 14px; color: var(--dwd-text-dim); margin: 0; letter-spacing: 0.06em; }\n.dwd-hero-divider { display: flex; align-items: center; gap: 12px; margin-top: 16px; }\n.dwd-divider-bar { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--dwd-primary), transparent); opacity: 0.6; }\n.dwd-divider-diamond {\n  color: var(--dwd-primary); font-size: 10px; text-shadow: 0 0 8px var(--dwd-primary);\n  animation: dwdPulse 2.4s ease-in-out infinite;\n}\n\n/* KPI */\n.dwd-kpi-row {\n  position: relative; z-index: 1;\n  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px;\n}\n@media (max-width: 960px) { .dwd-kpi-row { grid-template-columns: repeat(2, 1fr); } }\n.dwd-kpi {\n  position: relative; padding: 16px 18px 14px;\n  background: linear-gradient(140deg, color-mix(in srgb, var(--dwd-primary) 6%, transparent), color-mix(in srgb, var(--dwd-secondary) 4%, transparent));\n  border: 1px solid var(--dwd-border-soft); border-radius: 4px; overflow: hidden;\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n.dwd-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 22px color-mix(in srgb, var(--dwd-primary) 30%, transparent); }\n.dwd-kpi-scan {\n  position: absolute; inset: 0;\n  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);\n  transform: translateX(-100%); animation: dwdKpiScan 3.6s ease-in-out infinite;\n}\n@keyframes dwdKpiScan { 0% { transform: translateX(-100%); } 60% { transform: translateX(100%); } 100% { transform: translateX(100%); } }\n.dwd-kpi-corner { z-index: 2; }\n.dwd-kpi-corner--tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; border-color: var(--dwd-accent); }\n.dwd-kpi-corner--tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; border-color: var(--dwd-accent); }\n.dwd-kpi-corner--bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; border-color: var(--dwd-accent); }\n.dwd-kpi-corner--br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; border-color: var(--dwd-accent); }\n.dwd-kpi-label {\n  font-size: 11px; color: var(--dwd-text-dim); letter-spacing: 0.1em; text-transform: uppercase;\n  margin-bottom: 6px; font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n}\n.dwd-kpi-value {\n  position: relative; z-index: 2; font-size: 20px; font-weight: 700; color: #fff; line-height: 1.25;\n  text-shadow: 0 0 10px var(--dwd-accent, var(--dwd-primary)); margin-bottom: 8px;\n}\n.dwd-kpi-bar { position: relative; height: 2px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden; }\n.dwd-kpi-bar span {\n  position: absolute; left: 0; top: 0; bottom: 0; width: 70%;\n  background: linear-gradient(90deg, var(--dwd-accent, var(--dwd-primary)), transparent);\n  box-shadow: 0 0 6px var(--dwd-accent, var(--dwd-primary));\n  animation: dwdKpiBar 2.8s ease-in-out infinite;\n}\n@keyframes dwdKpiBar { 0%, 100% { width: 40%; } 50% { width: 80%; } }\n\n/* 主网格 */\n.dwd-grid {\n  position: relative; z-index: 1;\n  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;\n}\n@media (max-width: 860px) { .dwd-grid { grid-template-columns: 1fr; } }\n\n/* 模块卡片 */\n.dwd-card {\n  position: relative; padding: 16px 18px 18px;\n  background: linear-gradient(150deg, color-mix(in srgb, var(--dwd-bg-1) 85%, transparent), color-mix(in srgb, var(--dwd-bg-2) 65%, transparent));\n  border: 1px solid var(--dwd-border-soft);\n  border-left: 2px solid var(--dwd-accent, var(--dwd-primary));\n  border-radius: 4px; backdrop-filter: blur(6px); transition: border-color 0.3s ease;\n}\n.dwd-card--full { grid-column: 1 / -1; }\n.dwd-card--highlight { border-left-color: var(--dwd-highlight-color); box-shadow: inset 0 0 28px color-mix(in srgb, var(--dwd-highlight-color) 5%, transparent); }\n.dwd-card-corner { z-index: 2; }\n.dwd-card-corner--tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; border-color: var(--dwd-accent); }\n.dwd-card-corner--tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; border-color: var(--dwd-accent); }\n.dwd-card-corner--bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; border-color: var(--dwd-accent); }\n.dwd-card-corner--br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; border-color: var(--dwd-accent); }\n\n.dwd-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed color-mix(in srgb, var(--dwd-primary) 18%, transparent); }\n.dwd-card-icon { font-size: 18px; filter: drop-shadow(0 0 4px var(--dwd-accent, var(--dwd-primary))); }\n.dwd-card-head h2 { margin: 0; flex: 1; font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.04em; text-shadow: 0 0 8px rgba(255, 255, 255, 0.2); }\n.dwd-card-tag {\n  font-size: 9px; font-weight: 600; letter-spacing: 0.12em; color: var(--dwd-text-mute);\n  padding: 2px 6px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 2px;\n  font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n}\n\n.dwd-kv { margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }\n.dwd-kv > div { display: flex; flex-direction: column; padding: 7px 0; border-bottom: 1px dashed color-mix(in srgb, var(--dwd-primary) 10%, transparent); }\n.dwd-kv-full { grid-column: 1 / -1; }\n.dwd-kv dt { font-size: 10.5px; color: var(--dwd-text-mute); letter-spacing: 0.1em; margin-bottom: 3px; font-family: \"JetBrains Mono\", \"Consolas\", monospace; text-transform: uppercase; }\n.dwd-kv dd { margin: 0; font-size: 13px; color: var(--dwd-text); font-weight: 500; line-height: 1.55; }\n.dwd-optics-val {\n  color: var(--dwd-optics-color) !important; font-weight: 600 !important;\n  text-shadow: 0 0 8px var(--dwd-optics-shadow) !important;\n}\n.dwd-prose { margin: 0; color: var(--dwd-text-dim); font-size: 13px; line-height: 1.85; }\n\n.dwd-three-col { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }\n@media (max-width: 720px) { .dwd-three-col { grid-template-columns: 1fr; } }\n.dwd-col {\n  padding: 12px 14px; background: var(--dwd-col-bg);\n  border: 1px solid var(--dwd-col-border); border-radius: 3px;\n}\n.dwd-col-tag {\n  display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.14em;\n  color: var(--dwd-primary); padding: 1px 6px; border: 1px solid var(--dwd-primary);\n  border-radius: 2px; margin-bottom: 8px; font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n}\n.dwd-col h3 { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #fff; }\n.dwd-col p { margin: 0; font-size: 12.5px; color: var(--dwd-text-dim); line-height: 1.75; }\n\n/* Footer */\n.dwd-footer {\n  position: relative; z-index: 1; margin-top: 22px; padding-top: 14px;\n  text-align: center; font-size: 10.5px; color: var(--dwd-text-mute);\n  letter-spacing: 0.12em; font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n  border-top: 1px solid var(--dwd-footer-color);\n}\n.dwd-footer-sep { margin: 0 10px; color: var(--dwd-footer-sep); }\n\n/* ==========================================================================\n * 主题选择面板（DSH 全局设置 + 插件管理设置页通用）\n * 外层适配 DSH 浅色白底，缩略图内部是深色主题预览。\n * ========================================================================== */\n\n.dwd-theme-panel {\n  padding: 8px 4px;\n  color: #333;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", sans-serif;\n}\n.dwd-theme-panel-head { margin-bottom: 18px; }\n.dwd-theme-panel-head h2 {\n  margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.01em;\n}\n.dwd-theme-panel-head p {\n  margin: 0; font-size: 12.5px; color: #6b7280; line-height: 1.6;\n}\n.dwd-theme-panel-grid {\n  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;\n}\n@media (max-width: 640px) { .dwd-theme-panel-grid { grid-template-columns: 1fr; } }\n\n/* 每个主题卡片 —— 白底 + 圆角 + hover 微抬升 */\n.dwd-theme-panel-item {\n  position: relative; cursor: pointer;\n  padding: 0; border-radius: 12px;\n  background: #fff; border: 2px solid #e5e7eb;\n  overflow: hidden; text-align: left; font: inherit; color: inherit;\n  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;\n}\n.dwd-theme-panel-item:hover {\n  border-color: #93c5fd;\n  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);\n  transform: translateY(-2px);\n}\n.dwd-theme-panel-item--active {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);\n}\n.dwd-theme-panel-tick {\n  position: absolute; top: 10px; right: 10px; z-index: 5;\n  width: 22px; height: 22px; border-radius: 50%;\n  background: #3b82f6; color: #fff;\n  display: flex; align-items: center; justify-content: center;\n  font-size: 12px; font-weight: 700;\n  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);\n}\n.dwd-theme-panel-meta {\n  display: flex; flex-direction: column; gap: 2px;\n  padding: 10px 12px 12px;\n}\n.dwd-theme-panel-name {\n  font-size: 13px; font-weight: 600; color: #1a1a1a;\n}\n.dwd-theme-panel-desc {\n  font-size: 11.5px; color: #6b7280; line-height: 1.5;\n}\n.dwd-theme-panel-foot {\n  margin-top: 16px; padding-top: 12px;\n  border-top: 1px solid #f3f4f6;\n  font-size: 11.5px; color: #9ca3af; line-height: 1.6;\n}\n\n/* ==========================================================================\n * 缩略图内部 —— 深色主题 + 小尺寸 dashboard 预览\n * 每个主题有独立色盘（通过 .dwd-thumb-{id} 设置子元素颜色）\n * ========================================================================== */\n\n.dwd-thumb {\n  position: relative; overflow: hidden;\n  height: 140px;\n  background: #050a18;\n}\n/* Cyber Blue —— 默认 */\n.dwd-thumb.dwd-thumb-cyberblue {\n  background:\n    radial-gradient(ellipse at 20% 10%, rgba(0, 240, 255, 0.08), transparent 55%),\n    radial-gradient(ellipse at 85% 85%, rgba(124, 58, 237, 0.09), transparent 55%),\n    linear-gradient(160deg, #050a18, #0a1228, #0f1d3a);\n}\n/* Midnight Gold */\n.dwd-thumb.dwd-thumb-midnightgold {\n  background:\n    radial-gradient(ellipse at 20% 10%, rgba(240, 171, 0, 0.1), transparent 55%),\n    radial-gradient(ellipse at 85% 85%, rgba(255, 106, 0, 0.08), transparent 55%),\n    linear-gradient(160deg, #0a0600, #150c00, #1f1400);\n}\n/* Aurora Green */\n.dwd-thumb.dwd-thumb-auroragreen {\n  background:\n    radial-gradient(ellipse at 20% 10%, rgba(0, 255, 136, 0.1), transparent 55%),\n    radial-gradient(ellipse at 85% 85%, rgba(255, 61, 127, 0.08), transparent 55%),\n    linear-gradient(160deg, #020f0a, #041a12, #082818);\n}\n\n/* Hero 条 */\n.dwd-thumb-hero {\n  padding: 7px 10px 0;\n  display: flex; justify-content: space-between; align-items: center;\n}\n.dwd-thumb-title {\n  font-size: 9px; font-weight: 700; letter-spacing: 0.02em;\n  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;\n}\n.dwd-thumb-meta {\n  font-size: 6.5px; color: rgba(255, 255, 255, 0.3);\n  font-family: \"JetBrains Mono\", \"Consolas\", monospace; letter-spacing: 0.06em;\n}\n\n/* KPI 4 格 */\n.dwd-thumb-kpi {\n  display: grid; grid-template-columns: repeat(4, 1fr);\n  gap: 3px; padding: 5px 10px 6px;\n}\n.dwd-thumb-kpi-cell {\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 2px; padding: 3px 4px;\n  background: rgba(255, 255, 255, 0.02);\n}\n.dwd-thumb-kpi-num {\n  font-size: 7px; font-weight: 700; letter-spacing: 0.02em;\n  font-family: \"JetBrains Mono\", \"Consolas\", monospace;\n}\n\n/* 卡片网格 */\n.dwd-thumb-grid {\n  display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;\n  gap: 3px; padding: 0 10px 10px;\n}\n.dwd-thumb-card {\n  border-left: 1.5px solid #00f0ff;\n  border-radius: 2px; padding: 3px 5px;\n  background: rgba(255, 255, 255, 0.03);\n}\n.dwd-thumb-card--full { grid-column: 1 / -1; }\n.dwd-thumb-card-head {\n  font-size: 6.5px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 2px;\n}\n.dwd-thumb-card-lines {\n  display: flex; flex-direction: column; gap: 2px;\n}\n.dwd-thumb-card-lines span {\n  display: block; height: 1.5px; width: 100%;\n  background: rgba(255, 255, 255, 0.12); border-radius: 1px;\n}\n\n/* 扫描线装饰 */\n.dwd-thumb-scan {\n  position: absolute; top: -60px; left: 0; right: 0; height: 60px;\n  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.05), transparent);\n  animation: dwdThumbScan 4s linear infinite;\n  pointer-events: none;\n}\n@keyframes dwdThumbScan {\n  0% { top: -60px; }\n  100% { top: 140px; }\n}\n\n/* ==========================================================================\n * Gear 按钮 + 主题选择抽屉（大屏内部实现，替代 plugins.row.config slot）\n * ========================================================================== */\n\n.dwd-hero-right { display: flex; align-items: center; gap: 14px; }\n.dwd-gear-btn {\n  position: relative; cursor: pointer;\n  padding: 7px; border-radius: 6px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid var(--dwd-border-soft);\n  color: var(--dwd-text-dim);\n  transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.15s;\n  display: flex; align-items: center; justify-content: center;\n}\n.dwd-gear-btn:hover {\n  color: var(--dwd-primary);\n  background: color-mix(in srgb, var(--dwd-primary) 10%, transparent);\n  border-color: var(--dwd-primary);\n  transform: rotate(40deg);\n}\n\n/* 背景遮罩 */\n.dwd-backdrop {\n  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55);\n  backdrop-filter: blur(3px); z-index: 1000;\n  animation: dwdFadeIn 0.18s ease-out;\n}\n@keyframes dwdFadeIn { from { opacity: 0; } to { opacity: 1; } }\n\n/* 抽屉整体 */\n.dwd-drawer {\n  position: fixed; top: 0; right: 0; bottom: 0; z-index: 1001;\n  width: 340px; max-width: 85vw;\n  background: linear-gradient(180deg, var(--dwd-bg-1), var(--dwd-bg-0));\n  border-left: 1px solid var(--dwd-border);\n  backdrop-filter: blur(14px);\n  display: flex; flex-direction: column;\n  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.5);\n  animation: dwdSlideIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);\n}\n@keyframes dwdSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }\n\n.dwd-drawer-head {\n  display: flex; justify-content: space-between; align-items: flex-start;\n  padding: 20px 20px 16px;\n  border-bottom: 1px solid var(--dwd-border-soft);\n}\n.dwd-drawer-title { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0.02em; }\n.dwd-drawer-sub { font-size: 12px; color: var(--dwd-text-dim); margin-top: 4px; line-height: 1.55; }\n.dwd-drawer-close {\n  cursor: pointer;\n  width: 28px; height: 28px; border-radius: 50%;\n  background: transparent; border: 1px solid var(--dwd-border-soft);\n  color: var(--dwd-text-dim); font-size: 14px; line-height: 1;\n  display: flex; align-items: center; justify-content: center;\n  transition: color 0.2s, background 0.2s, border-color 0.2s;\n}\n.dwd-drawer-close:hover { color: var(--dwd-primary); border-color: var(--dwd-primary); background: color-mix(in srgb, var(--dwd-primary) 10%, transparent); }\n\n.dwd-drawer-body { flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column; gap: 10px; }\n\n/* 抽屉内的主题卡片 */\n.dwd-drawer-card {\n  cursor: pointer; text-align: left; font: inherit; color: inherit;\n  display: flex; gap: 14px; align-items: center;\n  padding: 12px; border-radius: 8px;\n  background: rgba(255, 255, 255, 0.02);\n  border: 2px solid transparent;\n  transition: border-color 0.2s, background 0.2s, transform 0.15s;\n}\n.dwd-drawer-card:hover { border-color: var(--dwd-border); background: rgba(255, 255, 255, 0.05); transform: translateX(-3px); }\n.dwd-drawer-card--active {\n  border-color: var(--dwd-primary);\n  background: color-mix(in srgb, var(--dwd-primary) 12%, transparent);\n  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dwd-primary) 18%, transparent);\n}\n.dwd-drawer-preview {\n  position: relative; width: 64px; height: 64px; border-radius: 6px; flex-shrink: 0;\n  overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);\n}\n.dwd-drawer-check {\n  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);\n  width: 22px; height: 22px; border-radius: 50%;\n  background: rgba(0, 0, 0, 0.75); color: #fff;\n  display: flex; align-items: center; justify-content: center;\n  font-size: 12px; font-weight: 700;\n  border: 2px solid rgba(255, 255, 255, 0.5);\n}\n.dwd-drawer-info { display: flex; flex-direction: column; gap: 3px; }\n.dwd-drawer-name { font-size: 13px; font-weight: 600; color: #fff; }\n.dwd-drawer-desc { font-size: 11.5px; color: var(--dwd-text-dim); line-height: 1.5; }\n\n.dwd-drawer-foot {\n  padding: 14px 20px 18px;\n  border-top: 1px solid var(--dwd-border-soft);\n  font-size: 11px; color: var(--dwd-text-mute);\n  line-height: 1.6;\n}\n";
		// src/client/index.tsx
		const NS = "dwd";
		const PANEL_ID = "dwd-wuhan";
		const ENTRY = "dsh-dashboard-wuhan";
		function DashboardIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.8,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "12",
						r: "9"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 12 L12 7" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 12 L16 14" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12",
						cy: "12",
						r: "1.2",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4.5 V5.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M19.5 12 H18.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 19.5 V18.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.5 12 H5.5" })
				]
			});
		}
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dwd: dictionaries");
			const t = (key) => ctx.locale.bind(NS)(key);
			ctx.effect(() => {
				const style = document.createElement("style");
				style.setAttribute("data-plugin", "dsh-dashboard-wuhan");
				style.textContent = client_default;
				document.head.appendChild(style);
				return () => {
					style.remove();
				};
			}, "dwd: inject styles");
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: NS,
				inject: () => ({})
			}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WuhanDashboard, { t })));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 50,
				label: () => t("panel"),
				locale: NS
			}, DashboardIcon));
			ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
				name: "plugins.row.config",
				key: `${ENTRY}#${ENTRY}`,
				locale: NS
			}, (props) => props.view === "page" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginConfig, { t }) : null));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dwd-theme",
				order: 80,
				label: () => t("panel"),
				locale: NS
			}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginConfig, { t })));
		}
		exports.PANEL_ID = PANEL_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
