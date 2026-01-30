import { useEffect, useState } from "react";
import { MessageCircleIcon, XIcon, LoaderIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { v4 as uuid } from "uuid";

const ChatbotWidget = ({ isLoggedIn }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your language learning assistant! 🌍 Ask me about grammar, vocabulary, phrases, or practice conversation in any language you'd like to learn!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuid()); // unique session ID

  useEffect(() => {
    if (!isLoggedIn) setOpen(false);
  }, [isLoggedIn]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      // Send user message to backend
      const res = await axiosInstance.post("/chat/chat", {
        message: input,
        sessionId,
      });
      setMessages((prev) => [...prev, { from: "bot", text: res.data.reply }]);
    } catch(error) {
      console.error("Error getting chat response:", error);
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="bg-base-200 shadow-xl rounded-2xl w-96 flex flex-col border border-base-300 h-[500px]">
          <div className="bg-primary text-primary-content p-4 flex justify-between items-center rounded-t-2xl">
            <div>
              <span className="font-bold text-lg">Language Assistant 🌍</span>
              <p className="text-xs opacity-80">Learn languages with AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm btn-circle">
              <XIcon className="size-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-base-100">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat ${msg.from === "user" ? "chat-end" : "chat-start"}`}>
                <div className={`chat-bubble ${msg.from === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-secondary">
                  <LoaderIcon className="animate-spin size-4 inline-block mr-1" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-2 border-t border-base-300 bg-base-200 rounded-b-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="input input-bordered flex-1 input-sm"
              placeholder="Ask about grammar, vocabulary, phrases..."
            />
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setOpen(true)} 
          className="btn btn-circle btn-primary shadow-lg btn-lg hover:scale-110 transition-transform"
        >
          <MessageCircleIcon className="size-6" />
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;
