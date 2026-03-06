import { defineConfig } from 'vitepress';

function normalizeBase(input?: string): string {
  if (!input || input.trim() === '') return '/';
  const withLeading = input.startsWith('/') ? input : `/${input}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

const base = normalizeBase(process.env.DOCS_BASE);

export default defineConfig({
  title: 'mangoo',
  description: 'Native-first async task guardrails',
  base,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'mangoo',
    nav: [
      { text: 'Guide', link: '/api-reference' },
      { text: '中文', link: '/zh/' },
      { text: 'GitHub', link: 'https://github.com/haoyinag/mangoo' }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/haoyinag/mangoo' }],
    footer: {
      message: 'Released under MIT License.',
      copyright: 'Copyright © 2026 mangoo contributors'
    },
    sidebar: {
      '/': [
        {
          text: 'Docs',
          items: [
            { text: 'API Reference', link: '/api-reference' },
            { text: 'React Usage', link: '/react' },
            { text: 'Vue Usage', link: '/vue' }
          ]
        }
      ],
      '/zh/': [
        {
          text: '入门',
          items: [
            { text: '简介', link: '/zh/introduction' },
            { text: '10 分钟上手', link: '/zh/get-started' },
            { text: '快速开始', link: '/zh/quick-start' },
            { text: '核心概念', link: '/zh/essentials' }
          ]
        },
        {
          text: '使用指南',
          items: [
            { text: 'Signal 决策图', link: '/zh/signal-guide' },
            { text: '并发模式对照表', link: '/zh/parallel-mode-table' },
            { text: 'React 使用', link: '/zh/react' },
            { text: 'Vue 使用', link: '/zh/vue' }
          ]
        },
        {
          text: '参考',
          items: [
            { text: 'API 参考', link: '/zh/api-reference' },
            { text: '最佳实践', link: '/zh/best-practices' },
            { text: '常见问题', link: '/zh/faq' },
            { text: '版本说明', link: '/zh/version' }
          ]
        }
      ]
    },
    search: {
      provider: 'local'
    }
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      link: '/'
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/'
    }
  }
});
