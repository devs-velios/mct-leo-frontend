// Conversations feature — public hook. Cached inbox + per-centre message cache,
// with send + upload that flow through the simulator pipeline.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { conversationsReducer, initialConversationsState } from "./conversationsReducer";
import {
  fetchInbox,
  fetchMessages,
  sendClientMessage,
  uploadClientDocument,
} from "./api";
import { type ConvMessage } from "./types";

// Léo replies asynchronously (HTTP, not a socket) — poll the thread until its
// answer lands or we give up.
const REPLY_POLL_ATTEMPTS = 10;
const REPLY_POLL_INTERVAL_MS = 2500;

const leoCount = (msgs: ConvMessage[]) => msgs.filter((m) => m.sender === "leo").length;

export function useConversations() {
  const [state, dispatch] = useReducer(conversationsReducer, initialConversationsState);
  const mountedRef = useRef(true);
  const inboxStatusRef = useRef(state.status);
  inboxStatusRef.current = state.status;
  const inboxKeyRef = useRef<string | null>(null);
  const msgStatusRef = useRef(state.messageStatus);
  msgStatusRef.current = state.messageStatus;
  // Mirror the message cache so the poller reads the latest without stale closures.
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshInbox = useCallback(async (params?: { q?: string }) => {
    dispatch({ type: "INBOX_START" });
    try {
      const data = await fetchInbox(params);
      if (mountedRef.current) dispatch({ type: "INBOX_SUCCESS", inbox: data.conversations, count: data.count });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "INBOX_ERROR", error: err instanceof Error ? err.message : "Failed to load inbox" });
      }
    }
  }, []);

  const ensureInbox = useCallback(async (params?: { q?: string }, force = false) => {
    const key = JSON.stringify(params ?? {});
    if (!force && inboxKeyRef.current === key && (inboxStatusRef.current === "loaded" || inboxStatusRef.current === "loading")) {
      return;
    }
    inboxKeyRef.current = key;
    await refreshInbox(params);
  }, [refreshInbox]);

  // Re-pull the inbox with the last-used filter (cache reconciliation).
  const lastInboxParamsRef = useRef<{ q?: string } | undefined>(undefined);
  const revalidateInbox = useCallback(() => {
    const last = inboxKeyRef.current ? (JSON.parse(inboxKeyRef.current) as { q?: string }) : undefined;
    lastInboxParamsRef.current = last;
    return refreshInbox(last);
  }, [refreshInbox]);

  // Fetch a thread from the backend and store it; returns the fetched messages
  // (or the cached ones when the cache-guard skips the fetch).
  const loadMessages = useCallback(async (centreId: string, force = false): Promise<ConvMessage[]> => {
    const status = msgStatusRef.current[centreId];
    if (!force && (status === "loaded" || status === "loading")) {
      return messagesRef.current[centreId] ?? [];
    }
    dispatch({ type: "MESSAGES_START", centreId });
    try {
      const data = await fetchMessages(centreId);
      if (mountedRef.current) dispatch({ type: "MESSAGES_SUCCESS", centreId, messages: data.messages });
      return data.messages;
    } catch {
      if (mountedRef.current) dispatch({ type: "MESSAGES_ERROR", centreId });
      return messagesRef.current[centreId] ?? [];
    }
  }, []);

  // Optimistically append a message to a centre's cached thread.
  const appendLocal = useCallback((centreId: string, message: ConvMessage) => {
    if (mountedRef.current) dispatch({ type: "APPEND_MESSAGE", centreId, message });
  }, []);

  // Poll the thread until Léo's reply (a new `leo` message) lands or we exhaust
  // attempts. Drives the "Léo écrit…" typing indicator + keeps the inbox fresh.
  const pollForReply = useCallback(async (centreId: string) => {
    const baselineLeo = leoCount(messagesRef.current[centreId] ?? []);
    dispatch({ type: "SET_TYPING", centreId, value: true });
    for (let attempt = 0; attempt < REPLY_POLL_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, REPLY_POLL_INTERVAL_MS));
      if (!mountedRef.current) return;
      const msgs = await loadMessages(centreId, true);
      void revalidateInbox();
      if (leoCount(msgs) > baselineLeo) break; // Léo answered
    }
    if (mountedRef.current) dispatch({ type: "SET_TYPING", centreId, value: false });
  }, [loadMessages, revalidateInbox]);

  // `poll` defaults on (in-page chat needs the messages-store poll). Callers that drive
  // their own reply poll (the dossier hub polls centre detail) pass { poll: false } to
  // avoid a second, unused polling loop hitting /messages + /inbox.
  const send = useCallback(async (centreId: string, text: string, opts: { poll?: boolean } = {}) => {
    await sendClientMessage(centreId, text);
    if (opts.poll !== false) void pollForReply(centreId); // HTTP, not a socket → poll for Léo's reply.
  }, [pollForReply]);

  const upload = useCallback(async (centreId: string, file: File, opts: { poll?: boolean } = {}) => {
    // Show the file in the thread immediately + a spinner while it uploads.
    dispatch({ type: "SET_UPLOADING", centreId, name: file.name });
    appendLocal(centreId, {
      id: `local-doc-${Date.now()}`,
      sender: "client",
      contenu: `📎 ${file.name}`,
      received_at: new Date().toISOString(),
    });
    try {
      await uploadClientDocument(centreId, file);
    } finally {
      if (mountedRef.current) dispatch({ type: "SET_UPLOADING", centreId, name: null });
    }
    // OCR + Léo's follow-up are async → poll the thread for the result.
    if (opts.poll !== false) void pollForReply(centreId);
  }, [appendLocal, pollForReply]);

  return {
    inbox: state.inbox,
    count: state.count,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    messages: state.messages,
    messageStatus: state.messageStatus,
    typing: state.typing,
    uploading: state.uploading,
    refreshInbox,
    ensureInbox,
    revalidateInbox,
    loadMessages,
    appendLocal,
    send,
    upload,
  };
}
