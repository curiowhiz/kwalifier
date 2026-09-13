import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          // Sonner sets these on the toaster root per data-sonner-theme; an
          // inline style here outranks that regardless of theme, so toasts
          // read as parchment notes instead of sonner's default light card.
          "--normal-bg": "var(--card)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--card-foreground)",
          "--success-bg": "var(--card)",
          "--success-border": "var(--eligible)",
          "--success-text": "var(--card-foreground)",
          "--error-bg": "var(--card)",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--card-foreground)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast on-parchment shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
