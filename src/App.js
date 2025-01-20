import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import { io } from "socket.io-client";
import "./App.css";
import { useEffect } from "react";
import Call from "./components/VideoCall.js";

export const socket = io("https://71ad-183-82-1-224.ngrok-free.app", {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling", "flashsocket"],
});

function App() {
  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/call" element={<Call />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
