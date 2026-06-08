// Reminders feature — state reducer.

import { type RemindersState, type Reminder } from "./types";

export type RemindersAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; reminders: Reminder[]; count: number }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPSERT"; reminder: Reminder }
  | { type: "SET_STATUS"; id: string; status: string }
  | { type: "REMOVE"; id: string };

export const initialRemindersState: RemindersState = {
  list: [],
  count: 0,
  status: "idle",
  error: null,
};

export function remindersReducer(state: RemindersState, action: RemindersAction): RemindersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.reminders, count: action.count, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "UPSERT": {
      const exists = state.list.some((r) => r.id === action.reminder.id);
      return exists
        ? { ...state, list: state.list.map((r) => (r.id === action.reminder.id ? action.reminder : r)) }
        : { ...state, list: [action.reminder, ...state.list], count: state.count + 1 };
    }
    case "SET_STATUS":
      return { ...state, list: state.list.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) };
    case "REMOVE":
      return { ...state, list: state.list.filter((r) => r.id !== action.id), count: Math.max(0, state.count - 1) };
    default:
      return state;
  }
}
