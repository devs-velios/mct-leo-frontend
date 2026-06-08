// Users feature — state reducer (in-session invite log).

import { type UsersState, type InviteResult } from "./types";

export type UsersAction = { type: "INVITED"; result: InviteResult };

export const initialUsersState: UsersState = {
  invited: [],
};

export function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "INVITED":
      return { ...state, invited: [action.result, ...state.invited] };
    default:
      return state;
  }
}
