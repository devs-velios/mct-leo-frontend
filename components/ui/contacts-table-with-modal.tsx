"use client";

/**
 * ContactsTable — the original 21st.dev "contacts-table-with-modal", now a thin
 * preset over the generic <DataTable/>. Public API (ContactsTable / Contact) is
 * unchanged so existing imports keep working.
 */

import { useMemo, useState } from "react";
import { Mail, Users, User } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface Contact {
  id: string;
  name: string;
  email: string;
  connectionStrength: "Very weak" | "Weak" | "Good" | "Very strong";
  twitterFollowers: number;
  description?: string;
}

interface ContactsTableProps {
  title?: string;
  contacts?: Contact[];
  onContactSelect?: (contactId: string) => void;
  className?: string;
  enableAnimations?: boolean;
}

const STRENGTH_ORDER: Record<Contact["connectionStrength"], number> = {
  "Very weak": 0,
  Weak: 1,
  Good: 2,
  "Very strong": 3,
};

// Light + dark badge classes (no JS theme detection needed).
const STRENGTH_BADGE: Record<Contact["connectionStrength"], { badge: string; dot: string }> = {
  "Very weak": { badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-600 dark:bg-red-400" },
  Weak: { badge: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400", dot: "bg-orange-600 dark:bg-orange-400" },
  Good: { badge: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", dot: "bg-blue-600 dark:bg-blue-400" },
  "Very strong": { badge: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400", dot: "bg-green-600 dark:bg-green-400" },
};

function StrengthBadge({ strength }: { strength: Contact["connectionStrength"] }) {
  const { badge, dot } = STRENGTH_BADGE[strength];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${badge}`}>
      {strength === "Very strong" ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1L3 9H7L8 15L13 7H9L8 1Z" />
        </svg>
      ) : (
        <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      )}
      {strength}
    </div>
  );
}

const defaultContacts: Contact[] = [
  { id: "1", name: "Pierre from Claap", email: "pierre@claap.io", connectionStrength: "Weak", twitterFollowers: 2400, description: "Tech entrepreneur and investor" },
  { id: "2", name: "HardwareSavvy", email: "hardwaresavvy+andr...", connectionStrength: "Very strong", twitterFollowers: 8900, description: "Hardware specialist" },
  { id: "3", name: "Voiceform", email: "harrison@voiceform.c...", connectionStrength: "Good", twitterFollowers: 5200, description: "Voice technology expert" },
  { id: "4", name: "Marketer Milk", email: "hi@marketmilk.com", connectionStrength: "Good", twitterFollowers: 6100, description: "Marketing strategist" },
  { id: "5", name: "Allen from CAST AI", email: "allen@mail.cast.ai", connectionStrength: "Weak", twitterFollowers: 3300, description: "AI infrastructure lead" },
  { id: "6", name: "Marija Krasnovskytė", email: "marija@cast.ai", connectionStrength: "Very weak", twitterFollowers: 1800, description: "Technical advisor" },
  { id: "7", name: "eryn@basistheory.com", email: "eryn@basistheory.com", connectionStrength: "Very weak", twitterFollowers: 2100, description: "Security specialist" },
  { id: "8", name: "Brad Patterson", email: "brad@basistheory.com", connectionStrength: "Good", twitterFollowers: 4500, description: "Product manager" },
  { id: "9", name: "Sarah Chen", email: "sarah.chen@techvault.com", connectionStrength: "Very strong", twitterFollowers: 12400, description: "CEO and founder" },
  { id: "10", name: "David Rodriguez", email: "david.rodriguez@innovate.io", connectionStrength: "Good", twitterFollowers: 7800, description: "Lead developer" },
  { id: "11", name: "Emily Watson", email: "emily.watson@future.co", connectionStrength: "Weak", twitterFollowers: 3900, description: "Marketing director" },
  { id: "12", name: "James Mitchell", email: "james@buildit.dev", connectionStrength: "Very strong", twitterFollowers: 9200, description: "Architect and advisor" },
  { id: "13", name: "Lisa Anderson", email: "lisa.anderson@ventures.com", connectionStrength: "Good", twitterFollowers: 5600, description: "Venture investor" },
  { id: "14", name: "Michael Zhang", email: "michael@cloudtech.ai", connectionStrength: "Weak", twitterFollowers: 4100, description: "Infrastructure engineer" },
  { id: "15", name: "Jennifer Lee", email: "jen@designsystem.io", connectionStrength: "Very strong", twitterFollowers: 11200, description: "Design system lead" },
  { id: "16", name: "Robert Chang", email: "robert.chang@quantify.co", connectionStrength: "Good", twitterFollowers: 6800, description: "Analytics expert" },
  { id: "17", name: "Amanda Pierce", email: "amanda@growthlab.com", connectionStrength: "Weak", twitterFollowers: 2900, description: "Growth consultant" },
  { id: "18", name: "Christopher Hayes", email: "chris.hayes@webscale.io", connectionStrength: "Very strong", twitterFollowers: 13500, description: "Platform engineer" },
  { id: "19", name: "Victoria Moore", email: "victoria@datasync.com", connectionStrength: "Good", twitterFollowers: 7100, description: "Data scientist" },
  { id: "20", name: "Nicholas Brown", email: "nick@apibase.dev", connectionStrength: "Very weak", twitterFollowers: 1500, description: "API developer" },
  { id: "21", name: "Rebecca Sullivan", email: "rebecca.s@innovationlab.io", connectionStrength: "Good", twitterFollowers: 8300, description: "Innovation strategist" },
  { id: "22", name: "Thomas Wright", email: "thomas@blockchain.tech", connectionStrength: "Weak", twitterFollowers: 3700, description: "Blockchain developer" },
  { id: "23", name: "Maria Garcia", email: "maria.garcia@futuretech.com", connectionStrength: "Very strong", twitterFollowers: 10800, description: "Tech evangelist" },
  { id: "24", name: "Daniel Park", email: "daniel@smartsolutions.ai", connectionStrength: "Good", twitterFollowers: 6400, description: "Solutions architect" },
  { id: "25", name: "Sophie Laurent", email: "sophie.laurent@design.co", connectionStrength: "Weak", twitterFollowers: 4200, description: "UX lead" },
];

export function ContactsTable({
  title = "Person",
  contacts: initialContacts = defaultContacts,
  onContactSelect,
  className = "",
  enableAnimations = true,
}: ContactsTableProps = {}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStrength, setFilterStrength] = useState<string | null>(null);

  const data = useMemo(
    () => (filterStrength ? initialContacts.filter((c) => c.connectionStrength === filterStrength) : initialContacts),
    [initialContacts, filterStrength],
  );

  const selection = {
    isSelected: (id: string) => selected.has(id),
    toggle: (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      onContactSelect?.(id);
    },
    toggleAll: () => {
      setSelected((prev) => {
        const all = data.every((c) => prev.has(c.id));
        const next = new Set(prev);
        data.forEach((c) => (all ? next.delete(c.id) : next.add(c.id)));
        return next;
      });
    },
    allSelected: data.length > 0 && data.every((c) => selected.has(c.id)),
    someSelected: data.some((c) => selected.has(c.id)) && !data.every((c) => selected.has(c.id)),
  };

  const columns: DataTableColumn<Contact>[] = [
    {
      id: "name",
      header: title,
      width: "220px",
      icon: <User className="h-3.5 w-3.5" />,
      sortValue: (c) => c.name.toLowerCase(),
      exportValue: (c) => c.name,
      cell: (c) => (
        <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-muted/30 px-2 py-1">
          <User className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className="truncate text-sm text-foreground">{c.name}</span>
        </div>
      ),
    },
    {
      id: "connectionStrength",
      header: "Connection",
      width: "160px",
      sortValue: (c) => STRENGTH_ORDER[c.connectionStrength],
      exportValue: (c) => c.connectionStrength,
      cell: (c) => <StrengthBadge strength={c.connectionStrength} />,
    },
    {
      id: "twitterFollowers",
      header: "Followers",
      width: "140px",
      sortValue: (c) => c.twitterFollowers,
      exportValue: (c) => c.twitterFollowers,
      cell: (c) => <span className="text-sm text-foreground/80">{c.twitterFollowers.toLocaleString()}</span>,
    },
    {
      id: "email",
      header: "Email Addresses",
      width: "200px",
      exportValue: (c) => c.email,
      cell: (c) => (
        <a
          href={`mailto:${c.email}`}
          className="truncate text-sm text-blue-500 hover:text-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          {c.email}
        </a>
      ),
    },
    {
      id: "description",
      header: "Description",
      width: "1fr",
      exportValue: (c) => c.description ?? "",
      cell: (c) => <span className="truncate text-sm text-muted-foreground/80">{c.description || "—"}</span>,
    },
  ];

  return (
    <DataTable<Contact>
      className={className}
      data={data}
      columns={columns}
      getRowId={(c) => c.id}
      minWidth="1100px"
      enableAnimations={enableAnimations}
      selection={selection}
      enableSort
      exportConfig={{ fileName: "contacts" }}
      filter={{
        label: "Filter",
        allLabel: "All Connections",
        value: filterStrength,
        onChange: setFilterStrength,
        options: ["Very strong", "Good", "Weak", "Very weak"].map((s) => ({ label: s, value: s })),
      }}
      pagination="internal"
      itemsPerPage={10}
      renderDetail={(c) => (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{c.name}</h3>
              <div className="mt-1">
                <StrengthBadge strength={c.connectionStrength} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span>
              </div>
              <a href={`mailto:${c.email}`} className="text-sm text-blue-500 hover:text-blue-600">
                {c.email}
              </a>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Twitter Followers</span>
              </div>
              <p className="text-sm font-medium text-foreground">{c.twitterFollowers.toLocaleString()}</p>
            </div>
            {c.description && (
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Description</span>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 pt-3">
            <button
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => {
                window.location.href = `mailto:${c.email}`;
              }}
            >
              Send Email
            </button>
          </div>
        </div>
      )}
    />
  );
}
