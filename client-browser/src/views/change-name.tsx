import "./change-name.scss";
import { ChangeEvent, useEffect, useState } from "react";
import { validateUserName } from "../ts/utils";
import { Link, useNavigate } from "react-router-dom";

export default function ChangeName() {
  const [newUserName, setNewUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    validateUserName();
    setNewUserName(window.localStorage.userName);
  } ,[])

  return (<div className="change-username">
    <h1>Change Name</h1>
    <div className="form-group">
      <div>
        <div className="form-field">
          <input
            type="text" 
            value={newUserName}
            onChange={(e:ChangeEvent<HTMLInputElement>) => setNewUserName(e.target.value)} 
            data-theme="dark" 
            maxLength={18}
            spellCheck="false"
          />
          <label>new name</label>
        </div>
        <div className="flex-btns">
          <Link className="btn-red link-btn" to="/">cancel</Link>
          <button 
            className="btn-green" 
            onClick={() => {
              window.localStorage.userName = newUserName;
              navigate("/")
            }}
            disabled={
              newUserName === window.localStorage.userName || newUserName.length < 3
            }>done</button>
        </div>
      </div>
    </div>
  </div>)
}