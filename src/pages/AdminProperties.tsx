import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  Wand2,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  PropertyEditor,
  type AdminPropertyDraft,
} from "@/components/admin/PropertyEditor";
import { NewListingSetup } from "@/components/admin/NewListingSetup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { seedPremiumListings } from "@/components/admin/seed-premium-listings";
import { SmartImage } from "@/components/real-estate/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type DbProperty = {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  area_sqft: number;
  tag: string | null;
  cover_image: string;
  gallery: string[];
  description: string;
  amenities: string[];
  published: boolean;
  created_at: string;

  listing_type: string;
  property_type: string;
  placements: string[];
  featured: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unexpected error.";
}

function formatPropertyAdminError(error: unknown) {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  ) {
    return "Database rejected the write. This admin screen is browser-only; Supabase Auth/RLS still needs to allow property writes for the active user.";
  }

  if (
    lower.includes("column") &&
    (lower.includes("listing_type") ||
      lower.includes("property_type") ||
      lower.includes("placements") ||
      lower.includes("featured"))
  ) {
    return "Database schema is missing the newer property listing columns. Run the updated SQL schema before using the admin panel.";
  }

  return message;
}

const DRAFT_STORAGE_KEY = "zain_admin_new_property_draft_v1";
const MODE_STORAGE_KEY = "zain_admin_properties_mode_v1";

const emptyDraft = (): AdminPropertyDraft => ({
  title: "",
  location: "",
  price: 0,
  beds: 0,
  baths: 0,
  areaSqFt: 0,
  tag: "",
  coverImage: "",
  gallery: [],
  description: "",
  amenities: [],
  published: true,

  listingType: "sale",
  propertyType: "apartment",
  placements: ["buy"],
  featured: false,
});

function mapToDraft(p: DbProperty): AdminPropertyDraft {
  const placements = (p.placements ?? []) as any[];

  return {
    id: p.id,
    title: p.title,
    location: p.location,
    price: p.price,
    beds: p.beds,
    baths: p.baths,
    areaSqFt: p.area_sqft,
    tag: p.tag ?? "",
    coverImage: p.cover_image,
    gallery: p.gallery ?? [],
    description: p.description,
    amenities: p.amenities ?? [],
    published: p.published,

    listingType: (p.listing_type as any) ?? "sale",
    propertyType: (p.property_type as any) ?? "apartment",
    placements: placements.length ? (placements as any) : (["buy"] as any),
    featured: !!p.featured,
  };
}

function formatCompact(n: number) {
  try {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
  } catch {
    return String(n);
  }
}

type ViewMode = "list" | "new";

function safeReadDraft(): AdminPropertyDraft | null {
  const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminPropertyDraft;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.title !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function CoverFallback() {
  return (
    <div className="relative h-44 w-full">
      <div className="absolute inset-0 bg-[hsl(var(--brand-ink))]/85" />
      <div className="absolute inset-0 opacity-[0.18]">
        <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--brand))] blur-2xl" />
        <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[hsl(var(--brand-2))] blur-3xl" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-[5px] bg-white/10 px-4 py-3 text-center ring-1 ring-white/15 backdrop-blur">
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-[5px] bg-white/10 ring-1 ring-white/15">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div className="mt-2 text-xs font-extrabold tracking-[0.18em] text-white/80">
            NO COVER IMAGE
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterStatus = "all" | "published" | "draft";
type FilterListingType = "all" | "sale" | "rent";
type FilterFeatured = "all" | "featured";
type FilterPlacement =
  | "all"
  | "featured"
  | "buy"
  | "rent"
  | "communities"
  | "developers"
  | "featured-projects"
  | "services"
  | "more";
type FilterDuplicate = "all" | "duplicates" | "website-duplicates";

type DuplicateGroupMeta = {
  totalCount: number;
  publishedCount: number;
  ids: string[];
};

function normalizeDuplicateText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildDuplicateKey(
  property: Pick<DbProperty, "title" | "location" | "price" | "listing_type">,
) {
  return [
    normalizeDuplicateText(property.title),
    normalizeDuplicateText(property.location),
    String(property.price ?? 0),
    normalizeDuplicateText(property.listing_type ?? "sale"),
  ].join("|");
}

function FiltersPanel({
  query,
  setQuery,
  status,
  setStatus,
  listingType,
  setListingType,
  featuredOnly,
  setFeaturedOnly,
  placement,
  setPlacement,
  duplicateMode,
  setDuplicateMode,
  activeFiltersCount,
  clearFilters,
  filteredCount,
  duplicateGroupsCount,
  websiteDuplicateGroupsCount,
  loading,
  onNew,
  onRefresh,
  onSeedLuxury,
  seeding,
  dense,
}: {
  query: string;
  setQuery: (v: string) => void;
  status: FilterStatus;
  setStatus: (v: FilterStatus) => void;
  listingType: FilterListingType;
  setListingType: (v: FilterListingType) => void;
  featuredOnly: FilterFeatured;
  setFeaturedOnly: (v: FilterFeatured) => void;
  placement: FilterPlacement;
  setPlacement: (v: FilterPlacement) => void;
  duplicateMode: FilterDuplicate;
  setDuplicateMode: (v: FilterDuplicate) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
  filteredCount: number;
  duplicateGroupsCount: number;
  websiteDuplicateGroupsCount: number;
  loading: boolean;
  onNew: () => void;
  onRefresh: () => void;
  onSeedLuxury: () => void;
  seeding: boolean;
  dense?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold tracking-[0.22em] text-[hsl(var(--brand-ink))]/60">
            FILTERS
          </div>
          <div className={cn("mt-2 font-extrabold tracking-tight text-[hsl(var(--brand-ink))]", dense ? "text-xl" : "text-2xl")}>
            Find listings
          </div>
          <div className="mt-2 text-sm font-semibold text-muted-foreground">
            Narrow down by status, type, and placements.
          </div>
        </div>

        <Button
          className="h-10 rounded-[5px] bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90"
          onClick={onNew}
        >
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      <Separator className="my-2 bg-black/10" />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 rounded-[5px] bg-white/80 pl-9 pr-10"
          placeholder="Search title, location, tag…"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "inline-flex h-7 w-7 items-center justify-center rounded-full",
              "bg-white text-[hsl(var(--brand-ink))] ring-1 ring-black/10",
              "hover:bg-muted/30 transition",
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-extrabold tracking-[0.18em] text-[hsl(var(--brand-ink))]/70">
          STATUS
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as FilterStatus)}>
          <SelectTrigger className="h-11 rounded-[5px] bg-white/80">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-[5px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-extrabold tracking-[0.18em] text-[hsl(var(--brand-ink))]/70">
          LISTING TYPE
        </div>
        <Select
          value={listingType}
          onValueChange={(v) => setListingType(v as FilterListingType)}
        >
          <SelectTrigger className="h-11 rounded-[5px] bg-white/80">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-[5px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-extrabold tracking-[0.18em] text-[hsl(var(--brand-ink))]/70">
          FEATURED
        </div>
        <Select
          value={featuredOnly}
          onValueChange={(v) => setFeaturedOnly(v as FilterFeatured)}
        >
          <SelectTrigger className="h-11 rounded-[5px] bg-white/80">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-[5px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-extrabold tracking-[0.18em] text-[hsl(var(--brand-ink))]/70">
          PLACEMENT
        </div>
        <Select value={placement} onValueChange={(v) => setPlacement(v as FilterPlacement)}>
          <SelectTrigger className="h-11 rounded-[5px] bg-white/80">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-[5px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
            <SelectItem value="communities">Communities</SelectItem>
            <SelectItem value="developers">Developers</SelectItem>
            <SelectItem value="featured-projects">Featured Projects</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="more">More</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-extrabold tracking-[0.18em] text-[hsl(var(--brand-ink))]/70">
          DUPLICATES
        </div>
        <Select
          value={duplicateMode}
          onValueChange={(v) => setDuplicateMode(v as FilterDuplicate)}
        >
          <SelectTrigger className="h-11 rounded-[5px] bg-white/80">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-[5px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="duplicates">Any duplicate</SelectItem>
            <SelectItem value="website-duplicates">Website live duplicates</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-[11px] font-semibold text-muted-foreground">
          Groups: {duplicateGroupsCount} all / {websiteDuplicateGroupsCount} live on website
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between rounded-[5px] bg-white/75 px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-black/10">
        <span>Showing</span>
        <span className="text-[hsl(var(--brand-ink))]">
          {loading ? "—" : filteredCount}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-10 rounded-[5px] bg-white/70"
          disabled={!activeFiltersCount}
          onClick={clearFilters}
        >
          Clear
          {activeFiltersCount ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--brand))]/14 px-1.5 text-[11px] font-extrabold text-[hsl(var(--brand-ink))] ring-1 ring-[hsl(var(--brand))]/25">
              {activeFiltersCount}
            </span>
          ) : null}
        </Button>

        <Button
          variant="outline"
          className="h-10 rounded-[5px] bg-white/70"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>

      <Button
        variant="outline"
        className="h-10 rounded-[5px] bg-white/70"
        disabled={seeding}
        onClick={onSeedLuxury}
      >
        <Wand2 className="mr-2 h-4 w-4" />
        {seeding ? "Seeding..." : "Seed luxury"}
      </Button>
    </div>
  );
}

export default function AdminPropertiesPage() {
  const [params] = useSearchParams();
  const startNew = params.get("new") === "1";

  const [items, setItems] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [seeding, setSeeding] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>(() => {
    if (startNew) return "new";
    const saved = sessionStorage.getItem(MODE_STORAGE_KEY);
    return saved === "new" ? "new" : "list";
  });

  const [newMode, setNewMode] = useState<"setup" | "details">(() => {
    return safeReadDraft() ? "details" : "setup";
  });

  const [draft, setDraft] = useState<AdminPropertyDraft>(() => {
    const existing = safeReadDraft();
    return existing ?? emptyDraft();
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters (list view only)
  const [status, setStatus] = useState<FilterStatus>("all");
  const [listingType, setListingType] = useState<FilterListingType>("all");
  const [featuredOnly, setFeaturedOnly] = useState<FilterFeatured>("all");
  const [placement, setPlacement] = useState<FilterPlacement>("all");
  const [duplicateMode, setDuplicateMode] = useState<FilterDuplicate>("all");

  // Mobile filters sheet
  const [filtersOpen, setFiltersOpen] = useState(false);

  const persistDraft = (next: AdminPropertyDraft) => {
    setDraft(next);
    if (!next.id) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id,title,location,price,beds,baths,area_sqft,tag,cover_image,gallery,description,amenities,published,created_at,listing_type,property_type,placements,featured",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data ?? []) as DbProperty[]);
    } catch (error) {
      toast({
        title: "Could not load properties",
        description: formatPropertyAdminError(error),
        variant: "destructive",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(MODE_STORAGE_KEY, view);
  }, [view]);

  const duplicateInsights = useMemo(() => {
    const grouped = new Map<string, DbProperty[]>();

    for (const item of items) {
      const key = buildDuplicateKey(item);
      const group = grouped.get(key) ?? [];
      group.push(item);
      grouped.set(key, group);
    }

    const byId = new Map<string, DuplicateGroupMeta>();
    let duplicateGroupsCount = 0;
    let websiteDuplicateGroupsCount = 0;

    for (const group of grouped.values()) {
      if (group.length < 2) continue;

      duplicateGroupsCount += 1;
      const publishedCount = group.filter((item) => item.published).length;
      if (publishedCount > 1) websiteDuplicateGroupsCount += 1;

      const meta: DuplicateGroupMeta = {
        totalCount: group.length,
        publishedCount,
        ids: group.map((item) => item.id),
      };

      for (const item of group) {
        byId.set(item.id, meta);
      }
    }

    return { byId, duplicateGroupsCount, websiteDuplicateGroupsCount };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((p) => {
      const hay = `${p.title} ${p.location} ${p.tag ?? ""} ${p.listing_type} ${p.property_type} ${(p.placements ?? []).join(" ")}`.toLowerCase();

      const matchesQuery = !q || hay.includes(q);

      const matchesStatus =
        status === "all"
          ? true
          : status === "published"
            ? p.published
            : !p.published;

      const matchesListingType =
        listingType === "all" ? true : p.listing_type === listingType;

      const matchesFeatured = featuredOnly === "all" ? true : !!p.featured;

      const placements = (p.placements ?? []).map((x) => String(x).toLowerCase());
      const matchesPlacement =
        placement === "all" ? true : placements.includes(placement);

      const duplicateMeta = duplicateInsights.byId.get(p.id);
      const matchesDuplicates =
        duplicateMode === "all"
          ? true
          : duplicateMode === "duplicates"
            ? !!duplicateMeta
            : !!duplicateMeta && p.published && duplicateMeta.publishedCount > 1;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesListingType &&
        matchesFeatured &&
        matchesPlacement &&
        matchesDuplicates
      );
    });
  }, [
    duplicateInsights.byId,
    duplicateMode,
    featuredOnly,
    items,
    listingType,
    placement,
    query,
    status,
  ]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return items.find((x) => x.id === selectedId) ?? null;
  }, [items, selectedId]);

  const save = async (nextDraft: AdminPropertyDraft = draft) => {
    setSaving(true);
    try {
      const payload = {
        title: nextDraft.title,
        location: nextDraft.location,
        price: nextDraft.price,
        beds: nextDraft.beds,
        baths: nextDraft.baths,
        area_sqft: nextDraft.areaSqFt,
        tag: nextDraft.tag.trim() ? nextDraft.tag.trim() : null,
        cover_image: nextDraft.coverImage,
        gallery: nextDraft.gallery,
        description: nextDraft.description,
        amenities: nextDraft.amenities,
        published: nextDraft.published,

        listing_type: nextDraft.listingType,
        property_type: nextDraft.propertyType,
        placements: nextDraft.placements,
        featured: nextDraft.featured,
      };

      if (nextDraft.id) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", nextDraft.id);
        if (error) throw error;

        toast({ title: "Saved", description: "Property updated." });
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;

        toast({ title: "Created", description: "New property added." });
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(emptyDraft());
        setNewMode("setup");
        setView("list");
      }

      await load();
    } catch (error) {
      toast({
        title: "Could not save property",
        description: formatPropertyAdminError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!draft.id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", draft.id);
      if (error) throw error;

      toast({ title: "Deleted", description: "Property removed." });
      setSelectedId(null);
      setView("list");
      await load();
    } catch (error) {
      toast({
        title: "Could not delete property",
        description: formatPropertyAdminError(error),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openNew = () => {
    setSelectedId(null);
    setView("new");
    setFiltersOpen(false);

    const existing = safeReadDraft();
    if (existing) {
      persistDraft(existing);
      setNewMode("details");
      return;
    }

    persistDraft(emptyDraft());
    setNewMode("setup");
  };

  const openEdit = (p: DbProperty) => {
    setSelectedId(p.id);
    setView("new");
    setNewMode("details");
    setDraft(mapToDraft(p));
  };

  const backToList = () => {
    setView("list");
    setSelectedId(null);
    if (!draft.id) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  };

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setListingType("all");
    setFeaturedOnly("all");
    setPlacement("all");
    setDuplicateMode("all");
  };

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (query.trim()) c += 1;
    if (status !== "all") c += 1;
    if (listingType !== "all") c += 1;
    if (featuredOnly !== "all") c += 1;
    if (placement !== "all") c += 1;
    if (duplicateMode !== "all") c += 1;
    return c;
  }, [duplicateMode, featuredOnly, listingType, placement, query, status]);

  const onSeedLuxury = async () => {
    setSeeding(true);
    try {
      const { inserted } = await seedPremiumListings();
      toast({
        title: "Luxury seed complete",
        description:
          inserted === 0
            ? "Seed listings already exist."
            : `Inserted ${inserted} luxury listings.`,
      });
      await load();
    } catch (error) {
      toast({
        title: "Could not seed listings",
        description: formatPropertyAdminError(error),
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const isEditingExisting = !!draft.id;

  return (
    <AdminShell title="Properties">
      {view === "list" ? (
        <>
          {/* Top controls (always visible) */}
          <div className="mb-4">
            <Card className="rounded-[5px] border border-black/10 bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/55">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-extrabold tracking-[0.22em] text-[hsl(var(--brand-ink))]/60">
                    PROPERTIES
                  </div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight text-[hsl(var(--brand-ink))]">
                    Inventory
                  </div>
                  <div className="mt-2 text-sm font-semibold text-muted-foreground">
                    Filter, browse, then click a card to edit.
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="h-10 rounded-[5px] bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90"
                      onClick={openNew}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New property
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-[5px] bg-white/70"
                      onClick={load}
                    >
                      Refresh
                    </Button>

                    {/* Mobile/tablet filters button */}
                    <Button
                      variant="outline"
                      className="h-10 rounded-[5px] bg-white/70 lg:hidden"
                      onClick={() => setFiltersOpen(true)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount ? (
                        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--brand))]/14 px-1.5 text-[11px] font-extrabold text-[hsl(var(--brand-ink))] ring-1 ring-[hsl(var(--brand))]/25">
                          {activeFiltersCount}
                        </span>
                      ) : null}
                    </Button>
                  </div>

                  <div className="rounded-[5px] bg-white/75 px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-black/10">
                    Showing{" "}
                    <span className="font-extrabold text-[hsl(var(--brand-ink))]">
                      {loading ? "—" : filtered.length}
                    </span>{" "}
                    / {loading ? "—" : items.length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Mobile filters sheet */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent side="right" className="w-[360px] p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white/75 px-4 py-3 backdrop-blur">
                  <div className="text-sm font-extrabold tracking-tight text-[hsl(var(--brand-ink))]">
                    Filters
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-black/5"
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <Card className="rounded-[5px] border border-black/10 bg-white/70 p-4 ring-1 ring-black/5">
                    <FiltersPanel
                      query={query}
                      setQuery={setQuery}
                      status={status}
                      setStatus={setStatus}
                      listingType={listingType}
                      setListingType={setListingType}
                      featuredOnly={featuredOnly}
                      setFeaturedOnly={setFeaturedOnly}
                      placement={placement}
                      setPlacement={setPlacement}
                      duplicateMode={duplicateMode}
                      setDuplicateMode={setDuplicateMode}
                      activeFiltersCount={activeFiltersCount}
                      clearFilters={clearFilters}
                      filteredCount={filtered.length}
                      duplicateGroupsCount={duplicateInsights.duplicateGroupsCount}
                      websiteDuplicateGroupsCount={duplicateInsights.websiteDuplicateGroupsCount}
                      loading={loading}
                      onNew={openNew}
                      onRefresh={load}
                      onSeedLuxury={onSeedLuxury}
                      seeding={seeding}
                      dense
                    />
                  </Card>

                  <div className="mt-3">
                    <Button
                      className="h-11 w-full rounded-[5px] bg-[hsl(var(--brand-ink))] text-white hover:bg-[hsl(var(--brand-ink))]/92"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: sidebar + grid */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="hidden lg:block lg:col-span-4">
              <Card
                className={cn(
                  "rounded-[5px] border border-black/10 bg-white/70 p-6 ring-1 ring-black/5",
                  "backdrop-blur supports-[backdrop-filter]:bg-white/55",
                )}
              >
                <FiltersPanel
                  query={query}
                  setQuery={setQuery}
                  status={status}
                  setStatus={setStatus}
                  listingType={listingType}
                  setListingType={setListingType}
                  featuredOnly={featuredOnly}
                  setFeaturedOnly={setFeaturedOnly}
                  placement={placement}
                  setPlacement={setPlacement}
                  duplicateMode={duplicateMode}
                  setDuplicateMode={setDuplicateMode}
                  activeFiltersCount={activeFiltersCount}
                  clearFilters={clearFilters}
                  filteredCount={filtered.length}
                  duplicateGroupsCount={duplicateInsights.duplicateGroupsCount}
                  websiteDuplicateGroupsCount={duplicateInsights.websiteDuplicateGroupsCount}
                  loading={loading}
                  onNew={openNew}
                  onRefresh={load}
                  onSeedLuxury={onSeedLuxury}
                  seeding={seeding}
                />
              </Card>
            </div>

            <div className="lg:col-span-8">
              <Card
                className={cn(
                  "rounded-[5px] border border-black/10 bg-white/70 p-6 ring-1 ring-black/5",
                  "backdrop-blur supports-[backdrop-filter]:bg-white/55",
                )}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {loading ? (
                    <div className="rounded-[5px] bg-white/70 p-4 text-sm text-muted-foreground ring-1 ring-black/5 sm:col-span-2">
                      Loading…
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="rounded-[5px] bg-white/70 p-6 text-center ring-1 ring-black/10 sm:col-span-2">
                      <div className="text-lg font-extrabold tracking-tight text-[hsl(var(--brand-ink))]">
                        No matches
                      </div>
                      <div className="mt-1 text-sm font-semibold text-muted-foreground">
                        Try clearing filters or changing the search.
                      </div>
                    </div>
                  ) : (
                    filtered.map((p) => {
                      const statusLabel = p.published ? "Published" : "Draft";
                      const typeHint = p.listing_type === "rent" ? "Rent" : "Sale";
                      const hasCover = String(p.cover_image ?? "").trim().length > 5;
                      const duplicateMeta = duplicateInsights.byId.get(p.id);
                      const isWebsiteDuplicate =
                        !!duplicateMeta && p.published && duplicateMeta.publishedCount > 1;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openEdit(p)}
                          className="text-left"
                        >
                          <Card
                            className={cn(
                              "group overflow-hidden rounded-[5px] border border-black/10 bg-white/70",
                              "ring-1 ring-black/5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.35)]",
                              "transition hover:bg-white hover:-translate-y-0.5",
                            )}
                          >
                            <div className="relative">
                              {hasCover ? (
                                <SmartImage
                                  src={p.cover_image}
                                  alt={p.title}
                                  className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                                  loading="lazy"
                                />
                              ) : (
                                <CoverFallback />
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />

                              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                                <Badge className="rounded-[5px] bg-white/85 text-foreground hover:bg-white">
                                  {typeHint}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "rounded-[5px] hover:bg-white/85",
                                    p.published
                                      ? "bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand-ink))]"
                                      : "bg-white/85 text-foreground",
                                  )}
                                >
                                  {statusLabel}
                                </Badge>
                                {p.featured ? (
                                  <Badge className="rounded-[5px] bg-[hsl(var(--brand-2))]/18 text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-2))]/18">
                                    Featured
                                  </Badge>
                                ) : null}
                                {duplicateMeta ? (
                                  <Badge className="rounded-[5px] bg-amber-100 text-amber-900 hover:bg-amber-100">
                                    Duplicate x{duplicateMeta.totalCount}
                                  </Badge>
                                ) : null}
                                {isWebsiteDuplicate ? (
                                  <Badge className="rounded-[5px] bg-rose-100 text-rose-900 hover:bg-rose-100">
                                    Live duplicate
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="absolute bottom-3 left-3 right-3">
                                <div className="text-lg font-extrabold tracking-tight text-white drop-shadow">
                                  {p.title}
                                </div>
                                <div className="mt-0.5 text-sm font-semibold text-white/85">
                                  {p.location}
                                </div>
                              </div>
                            </div>

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-muted-foreground">
                                    Price
                                  </div>
                                  <div className="truncate text-sm font-extrabold text-[hsl(var(--brand-ink))]">
                                    {formatCompact(p.price)} AED
                                  </div>

                                  <div className="mt-2 text-xs font-semibold text-muted-foreground">
                                    Placements:{" "}
                                    <span className="text-foreground">
                                      {(p.placements ?? []).length
                                        ? (p.placements ?? []).join(", ")
                                        : "—"}
                                    </span>
                                  </div>
                                </div>

                                {duplicateMeta ? (
                                  <div className="rounded-[5px] bg-amber-50 px-3 py-2 text-right ring-1 ring-amber-200">
                                    <div className="text-[11px] font-semibold text-amber-900/75">
                                      Duplicate Group
                                    </div>
                                    <div className="text-xs font-extrabold text-amber-900">
                                      {duplicateMeta.totalCount} total / {duplicateMeta.publishedCount} live
                                    </div>
                                  </div>
                                ) : null}

                                <div className="rounded-[5px] bg-muted/35 px-3 py-2 text-right ring-1 ring-black/5">
                                  <div className="text-[11px] font-semibold text-muted-foreground">
                                    Beds / Baths
                                  </div>
                                  <div className="text-xs font-extrabold text-[hsl(var(--brand-ink))]">
                                    {p.beds} / {p.baths}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              className="h-11 rounded-[5px] bg-white/70"
              onClick={backToList}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to properties
            </Button>

            {!isEditingExisting ? (
              <div className="rounded-[5px] bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-black/10">
                Draft saved automatically while you work.
              </div>
            ) : (
              <div className="rounded-[5px] bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-black/10">
                Editing existing property
              </div>
            )}
          </div>

          {!isEditingExisting && newMode === "setup" ? (
            <NewListingSetup
              value={draft}
              onChange={persistDraft}
              onCancel={() => backToList()}
              onContinue={() => {
                toast({
                  title: "Setup saved",
                  description: "Now fill in the listing details.",
                });
                setNewMode("details");
              }}
            />
          ) : (
            <PropertyEditor
              value={draft}
              onChange={(next) => {
                if (!next.id) persistDraft(next);
                else setDraft(next);
              }}
              onSave={save}
              onDelete={selected ? del : undefined}
              saving={saving}
              deleting={deleting}
            />
          )}
        </div>
      )}
    </AdminShell>
  );
}
