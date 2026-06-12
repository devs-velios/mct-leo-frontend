// Composes every feature's cache provider into one wrapper, mounted once at the
// dashboard layout. Most providers are LAZY: they hold reducer state but only fetch
// when a page first calls ensureLoaded()/browse()/ask() — so logging in does not
// fire a dozen requests, yet navigating between pages reuses the cached state.
// Exception: DashboardProvider eagerly loads + polls the KPI stats (landing page).

"use client";

import { type ReactNode } from "react";
import { DialogProvider } from "@/components/ui/DialogProvider";
import { RoleProvider } from "./auth/RoleProvider";
import { DashboardProvider } from "./dashboard";
import { CentresProvider } from "./centres";
import { DossiersProvider } from "./dossiers";
import { PiecesProvider } from "./pieces";
import { AlertsProvider } from "./alerts";
import { RagProvider } from "./rag";
import { RemindersProvider } from "./reminders";
import { ConversationsProvider } from "./conversations";
import { FoldersProvider } from "./folders";
import { DriveProvider } from "./drive";
import { AssistantProvider } from "./assistant";
import { UsersProvider } from "./users";
import { SimulateProvider } from "./simulate";
import { DocumentsProvider } from "./documents";
import { PipelineProvider } from "./pipeline";
import { IntervenersProvider } from "./interveners";
import { DepartmentsProvider } from "./departments";
import { HeatmapProvider } from "./heatmap";

// Order is irrelevant — the providers are independent. Compose from an array to keep
// the nesting flat and easy to extend.
const PROVIDERS = [
  DialogProvider,
  RoleProvider,
  DashboardProvider,
  CentresProvider,
  DossiersProvider,
  PiecesProvider,
  AlertsProvider,
  RagProvider,
  RemindersProvider,
  ConversationsProvider,
  FoldersProvider,
  DriveProvider,
  AssistantProvider,
  UsersProvider,
  SimulateProvider,
  DocumentsProvider,
  PipelineProvider,
  IntervenersProvider,
  DepartmentsProvider,
  HeatmapProvider,
] as const;

export function AppProviders({ children }: { children: ReactNode }) {
  return PROVIDERS.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children,
  );
}
