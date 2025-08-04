import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import { Toaster } from './components/ui/sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
)
