import { Box, Button, Grid, IconButton, Input, Textarea, useDisclosure, Wrap, WrapItem } from "@chakra-ui/react";
import { AddIcon, ChatIcon } from "@chakra-ui/icons";
import { FiFileText } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNotes, createNotes } from "../redux/notes/note_actions";
import NoteCard from "../components/Notes/NoteCard/NoteCard";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import Chatbot from "../Chatbot";
import { BASE_URL, getAiErrorMessage } from "../constants/config";

export default function Notespage() {
  const dispatch = useDispatch();
  const { data = [], loading: isSavingNote, createError, getError } = useSelector((state) => state.noteReducer);
  const token = useSelector((state) => state.userReducer.token);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ingestError, setIngestError] = useState("");

  useEffect(() => { dispatch(getNotes()); }, [dispatch]);
  useEffect(() => { const refresh = () => dispatch(getNotes()); window.addEventListener("thunder-notes-changed", refresh); return () => window.removeEventListener("thunder-notes-changed", refresh); }, [dispatch]);
  const closeNoteForm = () => { setTitle(""); setBody(""); setIngestError(""); onClose(); };
  const createNote = async () => {
    if (!title.trim()) return;
    const result = await dispatch(createNotes({ title: title.trim(), body }));
    if (result.success) closeNoteForm();
  };
  const runAiAction = async (action) => {
    if (!body.trim() || aiBusy) return;
    setAiBusy(true);
    try {
      const response = await fetch(`${BASE_URL}/api/ai/transform`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ action, title, text: body }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI action failed");
      if (action === "metadata") {
        const metadata = JSON.parse(result.result);
        if (metadata.title) setTitle(metadata.title);
        if (metadata.summary) setBody(`${metadata.summary}

${body}`);
      } else setBody(result.result || body);
    } catch (error) { setIngestError(getAiErrorMessage(error, "AI action failed")); }
    finally { setAiBusy(false); }
  };
  const ingestFile = async (file) => {
    if (!file) return;
    const kind = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : null;
    if (!kind) { setIngestError("Choose an audio, image, or PDF file."); return; }
    if (file.size > 12 * 1024 * 1024) { setIngestError("Choose a file smaller than 12 MB."); return; }
    setAiBusy(true); setIngestError("");
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await fetch(`${BASE_URL}/api/ai/ingest`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ kind, name: file.name, mimeType: file.type, data }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "File processing failed");
      setBody((previous) => [previous, result.text].filter(Boolean).join("\n\n"));
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (error) { setIngestError(getAiErrorMessage(error, "File processing failed")); }
    finally { setAiBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const toggleRecording = async () => {
    if (recording && recorderRef.current) { recorderRef.current.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); void ingestFile(new File(chunks, `voice-note-${Date.now()}.webm`, { type: recorder.mimeType || "audio/webm" })); };
      recorderRef.current = recorder; recorder.start(); setRecording(true);
    } catch (error) { setIngestError(error.message || "Microphone access is unavailable."); }
  };

  return <Box as="main" className="notes-page">
    <header className="notes-heading"><div><span className="section-kicker">YOUR PRIVATE WORKSPACE</span><h1>My notes</h1><p>A clear place for everything on your mind.</p></div><span className="notes-count"><i />{data.length} {data.length === 1 ? "note" : "notes"}</span></header>
    {getError ? <section className="empty-notes" role="alert"><span className="empty-notes-icon"><FiFileText /></span><h2>Your notes couldn’t be loaded.</h2><p>{getError}</p><Button className="auth-submit" width="auto" px={6} mt={5} onClick={() => dispatch(getNotes())}>Try again</Button></section> : data.length > 0 ? <Grid className="notes-grid">{data.map((note, index) => <NoteCard key={note._id} {...note} index={index} />)}</Grid> : <section className="empty-notes"><span className="empty-notes-icon"><FiFileText /></span><h2>Your first note starts here.</h2><p>Save an idea, a reminder, or anything you want to come back to.</p></section>}
    <IconButton className="notes-fab" aria-label="Create a note" icon={<AddIcon />} onClick={onOpen} />
    <IconButton className="notes-fab notes-chat-fab" aria-label="Open AI chat" icon={<ChatIcon />} onClick={() => setChatOpen(true)} />
    <Modal initialFocusRef={initialRef} finalFocusRef={finalRef} isOpen={isOpen} onClose={closeNoteForm}>
      <ModalOverlay className="notes-modal-overlay" /><ModalContent className="notes-modal"><ModalHeader>Create a note</ModalHeader><ModalCloseButton /><ModalBody pb={6}>
        {createError && <p className="note-form-error" role="alert">{createError}</p>}{ingestError && <p className="note-form-error" role="alert">{ingestError}</p>}
        <Input ref={initialRef} value={title} placeholder="Give your note a title" onChange={(event) => setTitle(event.target.value)} />
        <Textarea mt={4} value={body} placeholder="Start writing..." minHeight="170px" resize="vertical" onChange={(event) => setBody(event.target.value)} />
        <Wrap mt={3} spacing={2}>
          {[ ["summarize", "Summarize"], ["reformat", "Reformat"], ["grammar", "Fix grammar"], ["metadata", "Smart title"] ].map(([action, label]) => <WrapItem key={action}><Button size="xs" variant="outline" color="var(--paper)" isDisabled={aiBusy || !body.trim()} isLoading={aiBusy} onClick={() => runAiAction(action)}>{label}</Button></WrapItem>)}
          <WrapItem><Button size="xs" variant="outline" color="var(--paper)" isDisabled={aiBusy} onClick={() => fileRef.current?.click()}>Add audio, image, or PDF</Button></WrapItem>
          <WrapItem><Button size="xs" variant="outline" color={recording ? "var(--danger)" : "var(--paper)"} isDisabled={aiBusy} onClick={toggleRecording}>{recording ? "Stop recording" : "Record voice note"}</Button></WrapItem>
        </Wrap>
        <input ref={fileRef} hidden type="file" accept="audio/*,image/*,application/pdf" onChange={(event) => ingestFile(event.target.files?.[0])} />
      </ModalBody><ModalFooter gap={3}><Button className="auth-submit" width="auto" px={6} onClick={createNote} isDisabled={!title.trim() || isSavingNote} isLoading={isSavingNote}>Save note</Button><Button variant="ghost" color="var(--muted)" onClick={closeNoteForm}>Cancel</Button></ModalFooter></ModalContent>
    </Modal>
    <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
  </Box>;
}

