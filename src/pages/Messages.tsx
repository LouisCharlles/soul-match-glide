import { useState, useRef, useEffect } from "react";
import { Search, Send, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { matches, chatMessages, Match, Message } from "@/data/mockData";

const Messages = () => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>(chatMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMatches = matches.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedMatch]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedMatch) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: "current",
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [selectedMatch.id]: [...(prev[selectedMatch.id] || []), msg],
    }));
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mobile: show either list or chat
  const showChat = selectedMatch !== null;

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] gap-0 md:gap-4">
      {/* Match List */}
      <div className={`${showChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-1/3 card-surface overflow-hidden`}>
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar matches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-accent border-0 text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredMatches.map((match) => (
            <button
              key={match.id}
              onClick={() => setSelectedMatch(match)}
              className={`w-full flex items-center gap-3 p-3 transition-colors hover:bg-accent/50 ${
                selectedMatch?.id === match.id ? "bg-accent" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <img src={match.user.photos[0]} alt={match.user.name} className="h-14 w-14 rounded-full object-cover border-2 border-primary" />
                {match.user.online && (
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm text-foreground">{match.user.name}</span>
                  <span className="text-xs text-muted-foreground font-body">{match.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground font-body truncate">{match.lastMessage}</p>
              </div>
              {match.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${showChat ? "flex" : "hidden md:flex"} flex-col flex-1 card-surface overflow-hidden`}>
        {selectedMatch ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-3 border-b border-white/10">
              <button onClick={() => setSelectedMatch(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <img src={selectedMatch.user.photos[0]} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-heading text-sm text-foreground">{selectedMatch.user.name}</p>
                <p className="text-xs text-success font-body">{selectedMatch.user.online ? "Online" : "Offline"}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(messages[selectedMatch.id] || []).map((msg) => {
                const isMine = msg.senderId === "current";
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm font-body ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                        : "bg-accent text-foreground rounded-2xl rounded-bl-md"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.timestamp}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex items-center gap-2">
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-accent border-0 text-foreground placeholder:text-muted-foreground text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-body text-sm">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
