import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { TeamLogosBar } from "@/components/TeamLogosBar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TeamLogosBar />
      <PublicHeader />
      <main className="flex-1 bg-[var(--background)]">{children}</main>
      <PublicFooter />
    </>
  );
}
