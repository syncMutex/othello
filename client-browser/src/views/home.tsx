import { Link } from "react-router-dom"
import { useUserName } from "../hooks/user-name"
import "./home.scss"

export default function Home() {
  const [userName] = useUserName();

  return (<div className="home-page">
    <div>
      <h1>Welcome <span className="username">{userName}</span></h1>
      <Link className="link" to="/create-game">
        Create game
      </Link>
      <Link className="link" to="/join-game">
        Join game
      </Link>
      <Link className="link" to="/change-username">
        Change name
      </Link>
    </div>
  </div>)
}