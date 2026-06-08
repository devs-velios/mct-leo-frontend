// Assistant feature — state reducer (chat history cache).

import { type AssistantState, type RagResponse } from "./types";

export type AssistantAction =
  | { type: "ADD_USER"; text: string }
  | { type: "ASK_SUCCESS"; response: RagResponse }
  | { type: "ASK_ERROR"; error: string }
  | { type: "RESET" };

export const initialAssistantState: AssistantState = {
  messages: [],
  status: "idle",
  error: null,
};

export function assistantReducer(state: AssistantState, action: AssistantAction): AssistantState {
  switch (action.type) {
    case "ADD_USER":
      return { ...state, messages: [...state.messages, { role: "user", text: action.text }], status: "loading", error: null };
    case "ASK_SUCCESS":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "leo", text: action.response.answer, sources: action.response.sources, needsApproval: action.response.needsApproval },
        ],
        status: "idle",
      };
    case "ASK_ERROR":
      return {
        ...state,
        messages: [...state.messages, { role: "leo", text: "Désolé, une erreur est survenue lors de la requête." }],
        status: "error",
        error: action.error,
      };
    case "RESET":
      return initialAssistantState;
    default:
      return state;
  }
}
