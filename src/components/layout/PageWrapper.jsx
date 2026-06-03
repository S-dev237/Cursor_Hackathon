import Navbar from './Navbar.jsx'

export default function PageWrapper({ children, fullWidth = false }) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className={fullWidth ? 'flex-1' : 'mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6'}>
        {children}
      </main>
    </div>
  )
}
