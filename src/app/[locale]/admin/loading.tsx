import { ProfessionalLoader } from "@/components/ui/professional-loader";

export default function Loading() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <ProfessionalLoader label="Loading the admin workspace…" size="lg" />
    </div>
  );
}
