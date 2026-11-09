/** 「大伟总结」面板的全部样式，运行时以 <style> 注入。 */
export const STYLES = `
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
`
