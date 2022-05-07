import { Link } from "react-router-dom"
import "./home.scss"

export default function Home() {
  return (<div className="home">
    <div>
      <h1>Menu</h1>
      <Link className="link" to="/join-game">
        Join game
      </Link>
      <Link className="link" to="/create-game">
        Create game
      </Link>
    </div>
  </div>)
}