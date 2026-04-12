import { HelpShell } from "@/components/help/HelpShell";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <HelpShell>{children}</HelpShell>;
}
