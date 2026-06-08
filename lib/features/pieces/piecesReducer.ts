// Pieces feature — state reducer.

import { type PiecesState, type Piece, type PiecesStats, type QueuePiece } from "./types";

export type PiecesAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; pieces: Piece[]; count: number }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "STATS_SUCCESS"; stats: PiecesStats }
  | { type: "PIECE_UPDATED"; piece: Piece }
  | { type: "PIECE_REMOVED"; id: string }
  | { type: "QUEUE_START" }
  | { type: "QUEUE_SUCCESS"; queue: QueuePiece[] }
  | { type: "QUEUE_ERROR"; error: string }
  | { type: "QUEUE_REMOVE"; id: string }
  | { type: "QUEUE_PATCH"; id: string; patch: Partial<QueuePiece> };

export const initialPiecesState: PiecesState = {
  list: [],
  count: 0,
  stats: null,
  status: "idle",
  error: null,
  queue: [],
  queueStatus: "idle",
};

export function piecesReducer(state: PiecesState, action: PiecesAction): PiecesState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.pieces, count: action.count, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "STATS_SUCCESS":
      return { ...state, stats: action.stats };
    case "PIECE_UPDATED":
      return { ...state, list: state.list.map((p) => (p.id === action.piece.id ? action.piece : p)) };
    case "PIECE_REMOVED":
      return {
        ...state,
        list: state.list.filter((p) => p.id !== action.id),
        count: Math.max(0, state.count - 1),
      };
    case "QUEUE_START":
      return { ...state, queueStatus: "loading", error: null };
    case "QUEUE_SUCCESS":
      return { ...state, queue: action.queue, queueStatus: "loaded" };
    case "QUEUE_ERROR":
      return { ...state, queueStatus: "error", error: action.error };
    case "QUEUE_REMOVE":
      return { ...state, queue: state.queue.filter((p) => p.id !== action.id) };
    case "QUEUE_PATCH":
      return { ...state, queue: state.queue.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    default:
      return state;
  }
}
