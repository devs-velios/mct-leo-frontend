"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

// App-wide toast host. Mounted once in the root layout; fire toasts anywhere with
// `import { toast } from "sonner"` → toast.success(...) / toast.error(...).
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !shadow-[0_12px_35px_rgba(51,33,81,0.12)] !text-xs !font-bold",
        },
        style: { fontFamily: "var(--font-poppins)" },
      }}
      {...props}
    />
  );
}
