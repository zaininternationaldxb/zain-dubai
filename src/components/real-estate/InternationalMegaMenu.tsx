import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const REGIONS = [
  {
    key: "europe",
    label: "Europe",
    code: "EU",
    color: "bg-blue-600",
    description: "Premium properties across European capitals",
    href: "/international/europe",
  },
  {
    key: "uk",
    label: "United Kingdom",
    code: "UK",
    color: "bg-rose-600",
    description: "Residential & commercial listings in the UK",
    href: "/international/uk",
  },
  {
    key: "pakistan",
    label: "Pakistan",
    code: "PK",
    color: "bg-emerald-600",
    description: "Luxury & investment properties in major cities",
    href: "/international/pakistan",
  },
] as const;

export function InternationalMegaMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-x-0 bottom-0 top-[calc(56px+76px)] z-40 cursor-default bg-transparent"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div className="fixed left-0 right-0 top-[calc(56px+76px)] z-50">
        <div className="mx-auto max-w-7xl px-4">
          <div
            className={cn(
              "rounded-[5px] border border-black/10 bg-white shadow-[0_30px_90px_-65px_rgba(15,23,42,0.55)]",
              "ring-1 ring-black/5 overflow-hidden",
            )}
          >
            <div className="px-10 py-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-[#111827]">
                    International Properties
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#111827]/65">
                    Explore premium real estate across global markets.
                  </div>
                </div>

                <div className="rounded-[5px] bg-[hsl(var(--brand))]/10 px-3 py-2 text-xs font-semibold text-[hsl(var(--brand-ink))] ring-1 ring-black/5">
                  3 regions
                </div>
              </div>

              <div className="mt-7 grid gap-x-6 gap-y-3 md:grid-cols-3">
                {REGIONS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      navigate(r.href);
                      onClose();
                    }}
                    className={cn(
                      "group flex w-full items-start gap-4 rounded-[5px] px-4 py-4 text-left",
                      "ring-1 ring-black/10 bg-white/70",
                      "transition hover:bg-white hover:shadow-sm",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white",
                      r.color,
                    )}>
                      {r.code}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-[#11124a]">
                          {r.label}
                        </span>
                        <ArrowUpRight className="h-4 w-4 opacity-40 transition group-hover:opacity-80" />
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#111827]/55 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-black/8 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/international");
                    onClose();
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[5px] px-4 py-2.5 text-sm font-semibold",
                    "bg-[hsl(var(--brand-ink))] text-white",
                    "hover:bg-[hsl(var(--brand-ink))]/92 transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
                  )}
                >
                  View All International Listings
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
