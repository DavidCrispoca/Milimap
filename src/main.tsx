import { createRoot } from 'react-dom/client'
import { Root } from './Root'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root not found in index.html')
}

createRoot(container).render(<Root />)
