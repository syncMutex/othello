import './App.scss'
import './scss/common.scss'
import './scss/buttons.scss'
import { BrowserRouter as Router } from 'react-router-dom'
import TheBody from './components/main/The-Body'

function App() {
  return (
    <Router>
      <TheBody />
    </Router>
  )
}

export default App
