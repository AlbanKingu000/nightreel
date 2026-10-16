import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import HomePage from '../pages/HomePage'
import { Layout } from './Layout'
import { RouteError } from './RouteError'

/** Code-splits each page into its own chunk. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'browse', lazy: page(() => import('../pages/BrowsePage')) },
      { path: 'movie/:slug', lazy: page(() => import('../pages/MoviePage')) },
      { path: 'person/:personKey', lazy: page(() => import('../pages/PersonPage')) },
      { path: 'genre/:genreSlug', lazy: page(() => import('../pages/GenrePage')) },
      { path: 'collection/:collectionId', lazy: page(() => import('../pages/CollectionPage')) },
      { path: 'my-list', lazy: page(() => import('../pages/MyListPage')) },
      { path: 'spin', lazy: page(() => import('../pages/SpinPage')) },
      { path: 'about', lazy: page(() => import('../pages/AboutPage')) },
      { path: '*', lazy: page(() => import('../pages/NotFoundPage')) },
    ],
  },
]

export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
