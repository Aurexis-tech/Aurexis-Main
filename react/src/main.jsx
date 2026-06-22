import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// No <StrictMode>: the ported engine boots imperatively in App's mount effect
// and owns real DOM (canvas RAF loop, window listeners, async sequences).
// StrictMode's dev-only double-invoke would boot it twice. The baseline shipped
// a single classic <script> at end of <body> — one boot. We match that.
createRoot(document.getElementById('root')).render(<App />)
