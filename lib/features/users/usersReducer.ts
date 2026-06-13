// Users feature — state reducer (user directory + in-session invite log).

import { type UsersState, type InviteResult, type AppUser } from "./types";

export type UsersAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; users: AppUser[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "INVITED"; result: InviteResult }
  | { type: "REMOVE"; id: string };

export const initialUsersState: UsersState = {
  list: [],
  status: "idle",
  error: null,
  invited: [],
};

export function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.users, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "INVITED":
      return { ...state, invited: [action.result, ...state.invited] };
    case "REMOVE":
      return { ...state, list: state.list.filter((u) => u.id !== action.id) };
    default:
      return state;
  }
}
