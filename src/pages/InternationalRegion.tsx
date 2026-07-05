import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bed, Bath, Maximize2, MapPin, Filter } from "lucide-react";

import { RealEstateHeader } from "@/components/real-estate/RealEstateHeader";
import {
  useInternationalProperties,
  formatIntlPrice,
  type IntlRegion,
} from "@/hooks/use-international-properties";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const REGION_META: Record<
  IntlRegion,
  { label: string; code: string; description: string; image: string; defaultCurrency: string; color: string }
> = {
  europe: {
    label: "Europe",
    code: "EU",
    description:
      "Premium properties across European capitals and coastal destinations.",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2200&q=80",
    defaultCurrency: "EUR",
    color: "bg-blue-600",
  },
  uk: {
    label: "United Kingdom",
    code: "UK",
    description:
      "Residential, commercial and investment properties across the UK.",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2200&q=80",
    defaultCurrency: "GBP",
    color: "bg-rose-600",
  },
  pakistan: {
    label: "Pakistan",
    code: "PK",
    description:
      "Luxury residences and investment opportunities in Pakistan's major cities.",
    image:
      "https://images.unsplash.com/photo-1584713836492-86c6e5c95d72?auto=format&fit=crop&w=2200&q=80",
    defaultCurrency: "PKR",
    color: "bg-emerald-600",
  },
};

export default function InternationalRegionPage() {
  const { region } = useParams<{ region: string }>();
  const navigate = useNavigate();

  const meta = REGION_META[region as IntlRegion];

  const { data: properties = [], isLoading } = useInternationalProperties(
    region as IntlRegion,
  );

  const [listingFilter, setListingFilter] = useState<"all" | "sale" | "rent">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const propertyTypes = useMemo(() => {
    const types = Array.from(new Set(properties.map((p) => p.propertyType)));
    return types.filter(Boolean).sort();
  }, [properties]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (listingFilter !== "all" && p.listingType !== listingFilter) return false;
      if (typeFilter !== "all" && p.propertyType !== typeFilter) return false;
      return true;
    });
  }, [properties, listingFilter, typeFilter]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-[hsl(var(--page))]">
        <RealEstateHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center pt-32 text-center">
          <div className="text-4xl">🌐</div>
          <div className="mt-4 text-xl font-extrabold text-[#111827]">Region not found</div>
          <Button className="mt-6" onClick={() => navigate("/international")}>
            Back to International
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--page))]">
      <RealEstateHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d1224] pt-[132px] pb-24">
        {/* Background image at higher opacity so it's actually visible */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${meta.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.45,
          }}
        />
        {/* Left-heavy gradient so text (on left) stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1224]/95 via-[#0d1224]/70 to-[#0d1224]/30" />
        {/* Bottom fade back into page */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(var(--page))] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pt-10">
          <Link
            to="/international"
            className="inline-flex items-center gap-2 rounded-[5px] bg-white/10 px-3 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/15 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            All Regions
          </Link>

          <div className="mt-10">
            <div className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-xl text-base font-extrabold text-white shadow-lg",
              meta.color,
            )}>
              {meta.code}
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {meta.label}
            </h1>
            <p className="mt-3 max-w-xl text-base font-medium text-white/70">
              {meta.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80">
              {isLoading ? "Loading..." : `${properties.length} listing${properties.length !== 1 ? "s" : ""} available`}
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-[132px] z-30 border-b border-black/8 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Filter className="h-4 w-4 text-[#111827]/50 flex-shrink-0" />

          <Select value={listingFilter} onValueChange={(v) => setListingFilter(v as typeof listingFilter)}>
            <SelectTrigger className="h-9 w-36 rounded-[5px] text-sm font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">For Sale & Rent</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-44 rounded-[5px] text-sm font-semibold">
              <SelectValue placeholder="Property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {propertyTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(listingFilter !== "all" || typeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-[5px] text-xs font-semibold"
              onClick={() => {
                setListingFilter("all");
                setTypeFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}

          <span className="ml-auto text-xs font-semibold text-[#111827]/50">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Property Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-[5px] bg-black/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="text-5xl">🏘️</div>
            <div className="mt-4 text-xl font-extrabold text-[#111827]">
              No properties found
            </div>
            <p className="mt-2 text-sm font-medium text-[#111827]/55">
              {properties.length === 0
                ? "No listings have been published for this region yet."
                : "Try adjusting your filters."}
            </p>
            {properties.length > 0 && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setListingFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property) => (
              <Link
                key={property.id}
                to={`/international/${region}/${property.id}`}
                className="group block overflow-hidden rounded-[5px] bg-white ring-1 ring-black/10 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={property.coverImage || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {property.tag && (
                    <div className="absolute left-3 top-3">
                      <Badge className="bg-[hsl(var(--brand))] text-white text-[11px] font-semibold">
                        {property.tag}
                      </Badge>
                    </div>
                  )}

                  {property.featured && (
                    <div className="absolute right-3 top-3">
                      <Badge variant="secondary" className="text-[11px] font-semibold">
                        Featured
                      </Badge>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3">
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      property.listingType === "sale"
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white",
                    )}>
                      For {property.listingType === "sale" ? "Sale" : "Rent"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold text-[#111827]">
                        {property.title}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#111827]/55">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {property.location}, {property.country}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-base font-extrabold text-[hsl(var(--brand-ink))]">
                        {formatIntlPrice(property.price, property.currency)}
                      </div>
                      <div className="text-[10px] font-semibold text-[#111827]/40 capitalize">
                        {property.propertyType}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#111827]/60">
                    {property.beds > 0 && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        {property.beds} Bed{property.beds !== 1 ? "s" : ""}
                      </span>
                    )}
                    {property.baths > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {property.baths} Bath{property.baths !== 1 ? "s" : ""}
                      </span>
                    )}
                    {property.areaSqFt > 0 && (
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5" />
                        {property.areaSqFt.toLocaleString()} sqft
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
