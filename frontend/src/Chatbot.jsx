import { Box, Button, VStack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BASE_URL, getAiErrorMessage } from "./constants/config";

export default function Chatbot({ open, onClose }) {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const token = useSelector((state) => state.userReducer.token);
  const user = useSelector((state) => state.userReducer.user);
  const sessionId = `thunder-${user || "guest"}`;

  useEffect(() => {
    if (!open || !token) return;
    let active = true;
    fetch(`${BASE_URL}/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: token } })
      .then((response) => response.ok ? response.json() : { messages: [] })
      .then((data) => { if (active) setChat((data.messages || []).map((item) => ({ sender: item.role === "user" ? "user" : "bot", text: item.content }))); })
      .catch(() => {});
    return () => { active = false; };
  }, [open, token, sessionId]);

  if (!open) return null;

  const sendMsg = async () => {
    const message = msg.trim();
    if (!message || isSending) return;
    setMsg("");
    setIsSending(true);
    const answerIndex = chat.length + 1;
    setChat((prev) => [...prev, { sender: "user", text: message }, { sender: "bot", text: "" }]);
    try {
      const response = await fetch(`${BASE_URL}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ message, sessionId }) });
      window.dispatchEvent(new Event("thunder-notes-changed"));
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chat request failed");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const line = event.split("\n").find((part) => part.startsWith("data: "));
          if (!line || line === "data: [DONE]") continue;
          const data = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.token) setChat((prev) => prev.map((item, i) => i === answerIndex ? { ...item, text: item.text + data.token } : item));
        }
      }
    } catch (error) {
      const message = getAiErrorMessage(error, "Sorry, I couldn't reach AI. Please try again.");
      setChat((prev) => prev.map((item, i) => i === answerIndex ? { ...item, text: message } : item));
    } finally { setIsSending(false); }
  };

  return <Box className="chat-panel" position="fixed" right="24px" bottom="24px" width="min(390px, calc(100vw - 32px))" height="min(600px, calc(100vh - 48px))" border="1px solid var(--line)" borderRadius="20px" boxShadow="var(--shadow)" zIndex="99999" p={4} display="flex" flexDirection="column" overflow="hidden">
    <Box color="var(--paper)" p={2} display="flex" justifyContent="space-between" alignItems="center"><Text fontSize="xl" fontWeight="bold"><span style={{ color: "var(--sage)" }}>Thunder</span> AI</Text><Button size="xs" onClick={onClose} variant="ghost" color="var(--muted)">✕</Button></Box>
    <VStack flex={1} mt={3} spacing={3} overflowY="auto" align="stretch" fontSize="14px" color="var(--paper)">
      {!chat.length && <Text color="var(--muted)">Ask a question about your notes, or ask me to create and update one.</Text>}
      {chat.map((item, index) => <Box key={index} bg={item.sender === "user" ? "var(--surface-soft)" : "var(--ink-raised)"} p={3} borderRadius="14px" alignSelf={item.sender === "user" ? "flex-end" : "flex-start"} maxW="90%"><Text whiteSpace="pre-wrap">{item.text || "…"}</Text></Box>)}
    </VStack>
    <Box pt={3} borderTop="1px solid var(--line)" display="flex" gap={2} alignItems="center">
      <Textarea aria-label="Chat message" placeholder="Ask about your notes..." value={msg} onChange={(event) => setMsg(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMsg(); } }} flex={1} minH="42px" maxH="100px" resize="vertical" bg="var(--input-surface)" color="var(--paper)" borderRadius="12px" border="1px solid var(--line)" />
      <Button onClick={sendMsg} isDisabled={isSending || !msg.trim()} bg="var(--sage)" color="var(--accent-contrast)" borderRadius="12px">{isSending ? "…" : "Send"}</Button>
    </Box>
  </Box>;
}
