import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Map Docs  - TeeFrame",
  description: "A VitePress Site",

  srcDir: 'src',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' }
    ],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
        }
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/teeframe/map-documentation' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Datafile', link: '/datafile' },
        ]
      },

      {
        text: 'Map Items',
        items: [
          { text: 'Map Items', link: '/map-items' },
        ]
      },

      {
        text: 'Layers',
        items: [
          { text: 'Layers', link: '/layers' },
        ]
      },

      {
        text: 'Collision',
        items: [
          { text: 'Collision', link: '/collision' },
        ]
      },
    ],
  }
})
