import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/routes'

export default function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        duration={3000}
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
    </TooltipProvider>
  )
}
