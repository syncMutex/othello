import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { validateUserName } from "../ts/utils"
import "./home.scss"

export default function Home() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    validateUserName();
    setUserName(window.localStorage.userName);
  }, [])

  return (<div className="home">
    <div>
      <h1>Welcome {userName}</h1>
      <Link className="link" to="/join-game">
        Join game
      </Link>
      <Link className="link" to="/create-game">
        Create game
      </Link>
      <Link className="link" to="/change-username">
        Change name
      </Link>
    </div>
  </div>)
}