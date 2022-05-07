import './App.scss'
import './scss/common.scss'
import './scss/buttons.scss'
import { BrowserRouter as Router } from 'react-router-dom'
import TheBody from './components/main/The-Body'

function App() {
  return (
    <Router>
      <header className="header-main">
        <h1 className="logo">Othello</h1>
      </header>
      <TheBody />
    </Router>
  )
}

export default App
