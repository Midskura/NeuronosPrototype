"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="bottom-right"
      duration={3000}
      toastOptions={{
        style: {
          background: "var(--theme-bg-surface)",
          border: "1px solid var(--theme-border-default)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--theme-text-primary)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
          letterSpacing: "0",
        },
      }}
      style={
        {
          "--normal-bg": "var(--theme-bg-surface)",
          "--normal-text": "var(--theme-text-primary)",
          "--normal-border": "var(--theme-border-default)",
          "--success-bg": "var(--theme-bg-surface)",
          "--success-text": "var(--theme-text-primary)",
          "--success-border": "var(--theme-border-default)",
          "--error-bg": "var(--theme-bg-surface)",
          "--error-text": "var(--theme-text-primary)",
          "--error-border": "var(--theme-border-default)",
          "--info-bg": "var(--theme-bg-surface)",
          "--info-text": "var(--theme-text-primary)",
          "--info-border": "var(--theme-border-default)",
          "--warning-bg": "var(--theme-bg-surface)",
          "--warning-text": "var(--theme-text-primary)",
          "--warning-border": "var(--theme-border-default)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
