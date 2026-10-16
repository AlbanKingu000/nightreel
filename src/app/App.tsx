import { RouterProvider } from 'react-router'
import { CatalogProvider } from './CatalogProvider'
import { router } from './router'

export function App() {
  return (
    <CatalogProvider>
      <RouterProvider router={router} />
    </CatalogProvider>
  )
}
