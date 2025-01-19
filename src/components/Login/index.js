import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../App";

function Login() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username.trim()) {
      navigate("/call", { state: { username } });
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
