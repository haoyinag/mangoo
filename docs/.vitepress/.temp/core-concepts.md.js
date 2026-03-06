import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Core Concepts","description":"","frontmatter":{},"headers":[],"relativePath":"core-concepts.md","filePath":"core-concepts.md","lastUpdated":1772787619000}');
const _sfc_main = { name: "core-concepts.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="core-concepts" tabindex="-1">Core Concepts <a class="header-anchor" href="#core-concepts" aria-label="Permalink to &quot;Core Concepts&quot;">​</a></h1><h2 id="one-api-two-modes" tabindex="-1">One API, two modes <a class="header-anchor" href="#one-api-two-modes" aria-label="Permalink to &quot;One API, two modes&quot;">​</a></h2><p><code>runTask</code> supports two input shapes:</p><ul><li>function input: returns <code>TaskHandleSimple</code> (stateful task)</li><li>array input: returns <code>Promise&lt;O[]&gt;</code> (parallel execution)</li></ul><h2 id="task-state-model" tabindex="-1">Task state model <a class="header-anchor" href="#task-state-model" aria-label="Permalink to &quot;Task state model&quot;">​</a></h2><p>Function mode provides:</p><ul><li><code>status</code>: <code>idle | running | success | error | aborted</code></li><li><code>loading</code></li><li><code>data</code></li><li><code>error</code></li><li><code>meta</code></li><li><code>startedAt</code> / <code>endedAt</code></li></ul><h2 id="cancellation-model" tabindex="-1">Cancellation model <a class="header-anchor" href="#cancellation-model" aria-label="Permalink to &quot;Cancellation model&quot;">​</a></h2><p>Cancellation is cooperative via <code>AbortSignal</code>.</p><ul><li><code>cancel()</code> aborts internal controller</li><li>your async layer must consume <code>signal</code> to stop work immediately</li></ul><h2 id="parallel-model" tabindex="-1">Parallel model <a class="header-anchor" href="#parallel-model" aria-label="Permalink to &quot;Parallel model&quot;">​</a></h2><p>Array mode supports:</p><ul><li><code>concurrency</code> (positive integer)</li><li><code>mode</code>: <code>fail-fast | collect-all</code></li></ul><p><code>fail-fast</code> rejects on first failure. <code>collect-all</code> waits all and rejects with <code>AggregateError</code> when any fail.</p><h2 id="runner-defaults" tabindex="-1">Runner defaults <a class="header-anchor" href="#runner-defaults" aria-label="Permalink to &quot;Runner defaults&quot;">​</a></h2><p><code>createRunner({ concurrency, mode })</code> sets default options for array mode of <code>runTask</code>.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("core-concepts.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const coreConcepts = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  coreConcepts as default
};
