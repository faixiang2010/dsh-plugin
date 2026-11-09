/**
 * deepseek-harness-login — Client 端插件。
 *
 * 设置页「账号与余额」区块里，有几个指向 platform.deepseek.com 的可点击入口
 * 是 DSH 组件硬编码的，Host 端的返回值无法移除它们：
 *
 *   - 「更多账号信息 ↗」        → <a class=accountInfo>
 *   - 「前往开放平台查看」       → <a class=unavailableLink>
 *   - 「查询用量」/「充值」      → <a class=linkButton>
 *
 * 这些链接在离线部署里没有意义，因此这里用一条样式表把它们连同余额卡片整块
 * 隐去，只保留身份卡片（账户名 + 副标题）。
 *
 * 选择器说明：DSH 的 CSS Modules 编译产物保留了 local 名
 * （形如 `AccountSection_accountInfo__hash`），所以 `[class*="..."]` 是稳定的，
 * 这也是 dsh-skin-techno-neon 已经验证过的做法。
 */

window.__ModuleLoader__.load({
  id: 'deepseek-harness-login',
  factory: () => {
    var module = { exports: {} }
    var exports = module.exports

    /** Plugin id；同时是本插件注入样式的 data 标记。 */
    const PLUGIN_ID = 'deepseek-harness-login'

    /**
     * 隐藏 Platform 入口。
     *
     * 整个 balanceCard 一起隐藏，是因为它的三行内容（余额、赠金、更多）全部
     * 只有「前往开放平台查看 / 查询用量 / 充值」三种出口，在离线部署下都属于
     * 无效链接；留着空行反而更乱。身份信息改由本地账户页展示。
     */
    const HIDE_CSS = [
      /* 「更多账号信息 ↗」 */
      '[class*="accountInfo"] { display: none !important; }',
      /* 余额卡片：余额 / 赠金 / 更多（含查询用量、充值） */
      '[class*="balanceCard"] { display: none !important; }',
    ].join('\n')

    /**
     * 注入样式表，并在插件卸载时移除。
     * @param {object} ctx - Client Cordis context.
     */
    function installHideStyles(ctx) {
      ctx.effect(() => {
        const tag = document.createElement('style')
        tag.dataset.plugin = PLUGIN_ID
        tag.setAttribute('data-dsh-plugin-login', '')
        tag.textContent = HIDE_CSS
        document.head.appendChild(tag)
        return () => { tag.remove() }
      }, PLUGIN_ID + ': hide platform account entries')
    }

    exports.name = PLUGIN_ID
    exports.inject = []
    exports.apply = function apply(ctx) {
      installHideStyles(ctx)
    }

    return module.exports
  },
})
