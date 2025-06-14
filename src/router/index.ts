import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/setup'
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/GameSetup.vue'),
      meta: {
        title: 'Game Setup - Name That Thing'
      }
    },
    {
      path: '/play',
      name: 'play',
      component: () => import('@/views/GamePlay.vue'),
      meta: {
        title: 'Playing - Name That Thing'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: {
        title: 'Settings - Name That Thing'
      }
    }
  ]
})

// Update document title based on route
router.beforeEach((to) => {
  document.title = to.meta.title as string || 'Name That Thing'
})

export default router
