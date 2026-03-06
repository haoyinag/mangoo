import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"核心概念","description":"","frontmatter":{},"headers":[],"relativePath":"zh/essentials.md","filePath":"zh/essentials.md","lastUpdated":1772787619000}');
const _sfc_main = { name: "zh/essentials.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="核心概念" tabindex="-1">核心概念 <a class="header-anchor" href="#核心概念" aria-label="Permalink to &quot;核心概念&quot;">​</a></h1><h2 id="一个-api-两种模式" tabindex="-1">一个 API，两种模式 <a class="header-anchor" href="#一个-api-两种模式" aria-label="Permalink to &quot;一个 API，两种模式&quot;">​</a></h2><p><code>runTask</code> 同时支持：</p><ul><li>传入函数：返回 <code>TaskHandleSimple</code>（有状态）</li><li>传入数组：返回 <code>Promise&lt;O[]&gt;</code>（并发执行）</li></ul><h2 id="状态模型" tabindex="-1">状态模型 <a class="header-anchor" href="#状态模型" aria-label="Permalink to &quot;状态模型&quot;">​</a></h2><p>函数模式下，任务状态统一为：</p><ul><li><code>status</code>: <code>idle | running | success | error | aborted</code></li><li><code>loading</code></li><li><code>data</code></li><li><code>error</code></li><li><code>meta</code></li><li><code>startedAt</code> / <code>endedAt</code></li></ul><h2 id="取消模型" tabindex="-1">取消模型 <a class="header-anchor" href="#取消模型" aria-label="Permalink to &quot;取消模型&quot;">​</a></h2><p>取消基于 <code>AbortSignal</code>，属于协作式机制：</p><ul><li>你调用 <code>cancel()</code> 只会触发中断信号</li><li>请求是否立即停止，取决于底层是否使用 <code>signal</code></li></ul><h2 id="并发模型" tabindex="-1">并发模型 <a class="header-anchor" href="#并发模型" aria-label="Permalink to &quot;并发模型&quot;">​</a></h2><p>数组模式支持：</p><ul><li><code>concurrency</code>（必须是正整数）</li><li><code>mode</code>: <code>fail-fast | collect-all</code></li></ul><h2 id="runner-默认值" tabindex="-1">Runner 默认值 <a class="header-anchor" href="#runner-默认值" aria-label="Permalink to &quot;Runner 默认值&quot;">​</a></h2><p><code>createRunner({ concurrency, mode })</code> 只影响数组模式下的 <code>runTask</code> 默认配置。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh/essentials.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const essentials = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  essentials as default
};
