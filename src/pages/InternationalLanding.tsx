import { ArrowRight, Globe, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

import { RealEstateHeader } from "@/components/real-estate/RealEstateHeader";
import { useInternationalProperties } from "@/hooks/use-international-properties";
import { cn } from "@/lib/utils";

const REGIONS = [
  {
    key: "europe",
    label: "Europe",
    code: "EU",
    color: "bg-blue-600",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
    description:
      "From Parisian apartments to Mediterranean villas — discover investment-grade properties across the continent.",
    highlights: ["France", "Spain", "Italy", "Germany", "Portugal"],
    currency: "EUR",
  },
  {
    key: "uk",
    label: "United Kingdom",
    code: "UK",
    color: "bg-rose-600",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
    description:
      "Prime London postcodes, Scottish countryside estates, and high-yield rental markets across England and Wales.",
    highlights: ["London", "Manchester", "Edinburgh", "Birmingham", "Bristol"],
    currency: "GBP",
  },
  {
    key: "pakistan",
    label: "Pakistan",
    code: "PK",
    color: "bg-emerald-600",
    image:
      "https://images.unsplash.com/photo-1584713836492-86c6e5c95d72?auto=format&fit=crop&w=1600&q=80",
    description:
      "Luxury residences, gated communities, and commercial spaces in Karachi, Lahore, and Islamabad.",
    highlights: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "DHA"],
    currency: "PKR",
  },
] as const;

export default function InternationalLandingPage() {
  const { data: allProps = [] } = useInternationalProperties();

  const countByRegion = (region: string) =>
    allProps.filter((p) => p.region === region).length;

  return (
    <div className="min-h-screen bg-[hsl(var(--page))]">
      <RealEstateHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0f1e] pt-[132px] pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -20%, hsl(var(--brand)) 0%, transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-[hsl(var(--brand))]/8 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[200px] w-[400px] rounded-full bg-[hsl(var(--brand-2))]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.15em] text-white/70 ring-1 ring-white/15">
            <Globe className="h-3.5 w-3.5" />
            GLOBAL REAL ESTATE
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            International
            <br />
            <span className="text-[hsl(var(--brand))]">Properties</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-white/60">
            Invest beyond borders. Explore curated real estate across Europe, the
            United Kingdom, and Pakistan — all managed by ZAiN Avenue Realty.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {REGIONS.map((r) => (
              <Link
                key={r.key}
                to={`/international/${r.key}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[5px] px-5 py-3 text-sm font-semibold",
                  "bg-white/10 text-white ring-1 ring-white/15",
                  "hover:bg-white/15 transition",
                )}
              >
                <span className={cn("inline-flex h-5 w-7 items-center justify-center rounded text-[10px] font-bold text-white", r.color)}>
                  {r.code}
                </span>
                {r.label}
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Region Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111827]">
            Browse by Region
          </h2>
          <p className="mt-3 text-base font-medium text-[#111827]/55">
            Select a market to explore available listings.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {REGIONS.map((r) => {
            const count = countByRegion(r.key);
            return (
              <Link
                key={r.key}
                to={`/international/${r.key}`}
                className="group block overflow-hidden rounded-[5px] ring-1 ring-black/10 transition hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5">
                    <div className={cn("inline-flex h-9 w-12 items-center justify-center rounded-lg text-sm font-extrabold text-white shadow-md", r.color)}>
                      {r.code}
                    </div>
                    <div className="mt-2 text-xl font-extrabold text-white">
                      {r.label}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/70">
                      {count > 0 ? `${count} listing${count !== 1 ? "s" : ""}` : "Coming soon"}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5">
                  <p className="text-sm font-medium text-[#111827]/65 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.highlights.map((city) => (
                      <span
                        key={city}
                        className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand))]/8 px-3 py-1 text-xs font-semibold text-[hsl(var(--brand-ink))]"
                      >
                        <MapPin className="h-3 w-3" />
                        {city}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111827]/40">
                      Currency: {r.currency}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--brand-ink))]">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why Invest section */}
      <section className="bg-[#f8f9fc] py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111827]">
              Why Invest Internationally?
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Portfolio Diversification",
                body: "Spread investment risk across multiple currencies and economies for long-term stability.",
              },
              {
                icon: Building2,
                title: "High-Yield Markets",
                body: "Access markets with strong rental yields and capital growth potential unavailable locally.",
              },
              {
                icon: MapPin,
                title: "Expert Local Knowledge",
                body: "Our regional teams provide on-the-ground insights, legal guidance, and full management support.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[5px] bg-white p-6 ring-1 ring-black/10"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[5px] bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand-ink))]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-base font-extrabold text-[#111827]">{title}</div>
                <p className="mt-2 text-sm font-medium text-[#111827]/60 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-lg px-4">
          <h3 className="text-2xl font-extrabold tracking-tight text-[#111827]">
            Ready to invest globally?
          </h3>
          <p className="mt-3 text-sm font-medium text-[#111827]/55">
            Our international team is available 7 days a week.
          </p>
          <Link
            to="/nav/services/option/all"
            className={cn(
              "mt-6 inline-flex items-center gap-2 rounded-[5px] px-6 py-3.5 text-sm font-semibold",
              "bg-[hsl(var(--brand-ink))] text-white hover:bg-[hsl(var(--brand-ink))]/92 transition",
            )}
          >
            Talk to an Advisor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
