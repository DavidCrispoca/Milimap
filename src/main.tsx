import { createRoot } from 'react-dom/client'
import { Root } from './Root'
import { recordAppOpen } from './backend/analytics'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root not found in index.html')
}

// Fire-and-forget active-user signal. Never blocks first paint.
recordAppOpen()

createRoot(container).render(<Root />)
