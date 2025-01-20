import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { socket } from "../../App";

function Call() {
  const [users, setUsers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const peerConnectionRef = useRef(null);
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const iceConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    socket.emit("register-user", username);

    socket.on("users-list", (usersList) => {
      setUsers(usersList);
      console.log("Users list:", usersList);
    });

    // Listen for incoming call
    socket.on("incomingCall", async ({ from, offer }) => {
      console.log("Incoming call from:", from, offer);
      setIncomingCall({ from, offer });
    });

    // Listen for call accepted
    socket.on("callAccepted", async ({ answer }) => {
      console.log("Call accepted");
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    // Listen for ICE candidates
    socket.on("iceCandidate", async ({ candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    return () => {
      socket.off("users-list");
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("iceCandidate");
    };
  }, [username]);

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { candidate: event.candidate });
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const handleCall = async (user) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available devices:", devices);

      const hasVideo = devices.some((device) => device.kind === "videoinput");
      const hasAudio = devices.some((device) => device.kind === "audioinput");

      if (!hasVideo && !hasAudio) {
        alert("No camera or microphone found!");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo ? true : false,
        audio: hasAudio ? true : false,
      });

      setLocalStream(stream);
      const peerConnection = createPeerConnection();
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("callUser", { offer, from: socket.id, to: user.socketId });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const acceptCall = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((device) => device.kind === "videoinput");
      const hasAudio = devices.some((device) => device.kind === "audioinput");

      if (!hasVideo && !hasAudio) {
        alert("No camera or microphone found!");
        return;
      }

      const peerConnection = createPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo ? true : false,
        audio: hasAudio ? true : false,
      });
      setLocalStream(stream);

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("acceptCall", { answer, to: incomingCall.from });

      setIncomingCall(null);
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Error accepting call: " + error.message);
    }
  };

  console.log("localStream", localStream);
  console.log("remoteStream", remoteStream);

  return (
    <div>
      <h1>Video Call</h1>
      <h1>Logined User {username}</h1>
      {incomingCall && (
        <div>
          <p>Incoming call from {incomingCall.from}</p>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}

      {users.map(
        (user) =>
          user.socketId !== socket.id && (
            <div key={user.socketId}>
              <p>{user.username}</p>
              <button onClick={() => handleCall(user)}>Call</button>
            </div>
          )
      )}

      {localStream && (
        <video
          autoPlay
          playsInline
          muted
          ref={(video) => video && (video.srcObject = localStream)}
        />
      )}

      {remoteStream && (
        <video
          autoPlay
          playsInline
          ref={(video) => video && (video.srcObject = remoteStream)}
        />
      )}
    </div>
  );
}

export default Call;
