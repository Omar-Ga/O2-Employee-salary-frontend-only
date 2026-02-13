import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from '@/components/ui/provider'
import App from './App'
import { system } from './theme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider system={system} forcedTheme="light">
      <App />
    </Provider>
  </React.StrictMode>,
)
