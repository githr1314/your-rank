import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        <Outlet />
      </div>
    </div>
  )
}
