import React, { useEffect, useState } from "react";

const Notifications: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host.replace(/:\d+/, ":8000")}/ws/notifications/`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("notification socket open");
    };
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.message) {
          setMessages((m) => [data.message, ...m]);
        }
      } catch (e) {
        console.error("bad notification", e);
      }
    };
    ws.onerror = (e) => console.error("ws error", e);
    return () => {
      ws.close();
    };
  }, []);

  if (messages.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 w-64 bg-white dark:bg-gray-800 shadow-lg rounded p-4 space-y-2">
      {messages.map((msg, i) => (
        <div key={i} className="text-sm text-gray-900 dark:text-gray-100">
          {msg}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
