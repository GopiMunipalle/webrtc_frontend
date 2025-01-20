import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import { io } from "socket.io-client";
import "./App.css";
import { useEffect } from "react";
import Call from "./components/VideoCall.js";

export const socket = io("http://localhost:5000", { autoConnect: false });

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
