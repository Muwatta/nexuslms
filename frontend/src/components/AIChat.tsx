import React, { useState } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

const AIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ from: string; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat/", { message: userMsg.text });
      const reply = res.data?.reply || "Sorry, I couldn't get a response.";
      setMessages((m) => [...m, { from: "ai", text: reply }] as any);
    } catch (e) {
      setMessages(
        (m) => [...m, { from: "ai", text: "AI service unavailable." }] as any,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">AI Tutor</div>
              <button onClick={() => setOpen(false)} className="text-sm">
                ✖
              </button>
            </div>
            <div className="h-48 overflow-auto mb-2 space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.from === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block rounded-md px-3 py-1 ${m.from === "user" ? "bg-blue-100 text-blue-800" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about courses, schedules, or fees..."
                className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-3 py-2 bg-teal-600 text-white rounded-md"
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-teal-500 to-indigo-600 text-white p-3 rounded-full shadow-lg"
      >
        🤖
      </motion.button>
    </div>
  );
};

export default AIChat;
