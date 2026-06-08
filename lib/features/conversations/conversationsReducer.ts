// Conversations feature — state reducer.

import { type ConversationsState, type InboxItem, type ConvMessage } from "./types";

export type ConversationsAction =
  | { type: "INBOX_START" }
  | { type: "INBOX_SUCCESS"; inbox: InboxItem[]; count: number }
  | { type: "INBOX_ERROR"; error: string }
  | { type: "MESSAGES_START"; centreId: string }
  | { type: "MESSAGES_SUCCESS"; centreId: string; messages: ConvMessage[] }
  | { type: "MESSAGES_ERROR"; centreId: string }
  | { type: "APPEND_MESSAGE"; centreId: string; message: ConvMessage }
  | { type: "SET_TYPING"; centreId: string; value: boolean }
  | { type: "SET_UPLOADING"; centreId: string; name: string | null };

export const initialConversationsState: ConversationsState = {
  inbox: [],
  count: 0,
  status: "idle",
  error: null,
  messages: {},
  messageStatus: {},
  typing: {},
  uploading: {},
};

export function conversationsReducer(state: ConversationsState, action: ConversationsAction): ConversationsState {
  switch (action.type) {
    case "INBOX_START":
      return { ...state, status: "loading", error: null };
    case "INBOX_SUCCESS":
      return { ...state, inbox: action.inbox, count: action.count, status: "loaded", error: null };
    case "INBOX_ERROR":
      return { ...state, status: "error", error: action.error };
    case "MESSAGES_START":
      return { ...state, messageStatus: { ...state.messageStatus, [action.centreId]: "loading" } };
    case "MESSAGES_SUCCESS":
      return {
        ...state,
        messages: { ...state.messages, [action.centreId]: action.messages },
        messageStatus: { ...state.messageStatus, [action.centreId]: "loaded" },
      };
    case "MESSAGES_ERROR":
      return { ...state, messageStatus: { ...state.messageStatus, [action.centreId]: "error" } };
    case "APPEND_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.centreId]: [...(state.messages[action.centreId] ?? []), action.message],
        },
      };
    case "SET_TYPING":
      return { ...state, typing: { ...state.typing, [action.centreId]: action.value } };
    case "SET_UPLOADING":
      return { ...state, uploading: { ...state.uploading, [action.centreId]: action.name } };
    default:
      return state;
  }
}
