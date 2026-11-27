import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useNavMenuInventory } from "@/hooks/use-nav-menu-inventory";

type FooterLink = { label: string; onClick: () => void };

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.97L6.02 22H2.9l7.24-8.28L1 2h6.25l4.32 6.31L18.9 2Zm-1.07 18h1.69L6.33 3.89H4.52L17.83 20Z" />
    </svg>
  );
}

export function SiteFooter({
  onGetInTouch,
  onNavigateSection,
  className,
}: {
  onGetInTouch: () => void;
  onNavigateSection: (hash: string) => void;
  className?: string;
}) {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { menus } = useNavMenuInventory();

  const quickLinks = useMemo<FooterLink[]>(
    () => [
      ...(menus.buy.hasAny
        ? [{ label: "Buy", onClick: () => navigate("/nav/buy/option/all") }]
        : []),
      ...(menus.rent.hasAny
        ? [{ label: "Rent", onClick: () => navigate("/nav/rent/option/all") }]
        : []),
      ...(menus.communities.hasAny
        ? [
            {
              label: "Communities",
              onClick: () => navigate("/nav/communities/option/all"),
            },
          ]
        : []),
      ...(menus.developers.hasAny
        ? [
            {
              label: "Developers",
              onClick: () => navigate("/nav/developers/option/all"),
            },
          ]
        : []),
      ...(menus["featured-projects"].hasAny
        ? [
            {
              label: "Featured Projects",
              onClick: () => navigate("/nav/featured-projects/option/all"),
            },
          ]
        : []),
      ...(menus.services.hasAny
        ? [
            {
              label: "Services",
              onClick: () => navigate("/nav/services/option/all"),
            },
          ]
        : []),
      ...(menus.more.hasAny
        ? [{ label: "More", onClick: () => navigate("/nav/more/option/all") }]
        : []),
      { label: "Top", onClick: () => onNavigateSection("#top") },
    ],
    [menus, navigate, onNavigateSection],
  );

  const resources = useMemo<FooterLink[]>(
    () => [
      {
        label: "Blogs",
        onClick: () => navigate("/blogs"),
      },
      {
        label: "Careers",
        onClick: () => navigate("/careers"),
      },
      {
        label: "Insights",
        onClick: () => navigate("/insights"),
      },
    ],
    [navigate],
  );

  const social = useMemo(
    () => [
      {
        label: "Facebook",
        handle: "Zain Real Estate",
        href: "https://www.facebook.com/ZainRealEstate",
        icon: Facebook,
      },
      {
        label: "X",
        handle: "@zainavenue10",
        href: "https://x.com/zainavenue10",
        icon: XIcon,
      },
      {
        label: "LinkedIn",
        handle: "Kashif Raza",
        href: "https://www.linkedin.com/in/kashif-raza-33062513/",
        icon: Linkedin,
      },
      {
        label: "Instagram",
        handle: "@zainavenuereality",
        href: "https://www.instagram.com/zainavenuereality/",
        icon: Instagram,
      },
    ],
    [],
  );

  const ctaBg =
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2600&q=85";

  const ink = "text-[#0b1025]";
  const sectionTitle = cn("text-sm font-extrabold tracking-tight", ink);

  const linkClass = cn(
    "text-sm font-semibold text-[#0b1025]/75 transition hover:text-[#0b1025]",
    "rounded-[5px] px-2 py-1 text-left",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
  );

  const outlineCard = cn(
    "rounded-[5px] border border-black/10 bg-white",
    "p-4 sm:p-5",
  );

  const containerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

  const bottomLinkClass = cn(
    "text-xs font-semibold text-[#0b1025]/70 transition hover:text-[#0b1025]",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
    "rounded-[5px] px-2 py-1",
  );

  return (
    <footer className={cn("w-full", className)}>
      {/* Full-width CTA strip (softened to avoid repeating the Contact section) */}
      <section className="relative overflow-hidden border-t border-white/10">
        <img
          src={ctaBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#0b1220]/64" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220]/82 via-[#0b1220]/65 to-[#0b1220]/18" />

        <div className="relative z-[2]">
          <div
            className={cn(
              containerClass,
              "py-10 sm:py-12 lg:py-14",
              "rounded-[5px]",
              "bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-sm",
            )}
          >
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.18em] text-white/80">
                  <span>ZAiN AVENUE REALTY REAL ESTATE</span>
                  <span className="hidden sm:inline">/</span>
                  <span className="text-white/70">
                    Your Efficient Partner in Real Estate Since 2011
                  </span>
                </div>

                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Get a weekly shortlist worth opening
                </h3>

                <p className="mt-3 max-w-xl text-sm font-medium text-white/85">
                  New launches, ready units, and community highlights — curated
                  into a quick, buyer-friendly update.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-[5px] bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/80 ring-1 ring-white/15 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  No spam · unsubscribe anytime
                </div>
              </div>

              <div className="md:col-span-4 md:flex md:justify-end">
                <div className="grid w-full gap-3 sm:max-w-[380px]">
                  <Button
                    onClick={() => {
                      toast({
                        title: "Newsletter",
                        description:
                          "Use the Newsletter box below to subscribe — we’ll wire it to your email tool next.",
                      });
                      const el = document.getElementById("footer-newsletter");
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="h-11 w-full rounded-[5px] bg-white px-7 font-semibold text-[#111827] hover:bg-white/95"
                  >
                    Subscribe below
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full rounded-[5px]",
                      "border-white/25 bg-white/0 text-white",
                      "ring-1 ring-white/15",
                      "hover:bg-white/10 hover:text-white",
                    )}
                    onClick={onGetInTouch}
                  >
                    Need help now? Contact us
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* White footer */}
      <section className="relative border-t border-black/10 bg-white">
        <div className={cn(containerClass, "py-12 sm:py-14 lg:py-16")}>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            {/* Newsletter */}
            <div className="lg:col-span-5" id="footer-newsletter">
              <Card className="rounded-[5px] border border-black/10 bg-white p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.35)] sm:p-7">
                <div className="text-2xl font-extrabold tracking-tight text-[#0b1025]">
                  Newsletter
                </div>
                <div className="mt-2 text-sm text-[#0b1025]/60">
                  Subscribe for our weekly newsletter and marketing updates
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0b1025]/45" />
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className={cn(
                        "h-12 rounded-[5px] border border-black/10 bg-[#0b1025]/[0.05] pl-11",
                        "text-[#0b1025] placeholder:text-[#0b1025]/45",
                        "focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
                      )}
                    />
                  </div>

                  <Button
                    className="h-12 rounded-[5px] bg-[hsl(var(--brand-ink))] text-white hover:bg-[hsl(var(--brand-ink))]/92"
                    onClick={() => {
                      const v = email.trim();
                      if (!v) {
                        toast({
                          title: "Email required",
                          description: "Please enter your email address.",
                        });
                        return;
                      }
                      toast({
                        title: "Subscribed",
                        description: "You’re on the list — welcome aboard.",
                      });
                      setEmail("");
                    }}
                  >
                    Submit
                  </Button>

                  <div className="pt-1 text-[11px] font-semibold text-[#0b1025]/55">
                    No spam. Unsubscribe anytime.
                  </div>
                </div>
              </Card>
            </div>

            {/* Right side */}
            <div className="lg:col-span-7">
              <div
                className={cn(
                  "grid gap-10",
                  "sm:grid-cols-2",
                  "lg:grid-cols-3",
                  // prevent any accidental overlap from long content
                  "[&>*]:min-w-0",
                )}
              >
                {/* Quick Links + Resources */}
                <div>
                  <div className={sectionTitle}>Quick Links</div>

                  <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
                    <ul className="grid gap-2">
                      {quickLinks.slice(0, 4).map((l) => (
                        <li key={l.label}>
                          <button
                            type="button"
                            onClick={l.onClick}
                            className={linkClass}
                          >
                            {l.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <ul className="grid gap-2">
                      {quickLinks.slice(4).map((l) => (
                        <li key={l.label}>
                          <button
                            type="button"
                            onClick={l.onClick}
                            className={linkClass}
                          >
                            {l.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 text-sm font-extrabold tracking-tight text-[#0b1025]">
                    Resources
                  </div>
                  <ul className="mt-4 grid gap-2">
                    {resources.map((l) => (
                      <li key={l.label}>
                        <button
                          type="button"
                          onClick={l.onClick}
                          className={linkClass}
                        >
                          {l.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <div className={sectionTitle}>Contact Details</div>

                  <div className="mt-5 grid gap-4">
                    <div className={outlineCard}>
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-[#0b1025]/55">
                        ADDRESS
                      </div>
                      <div className="mt-2 text-sm font-semibold leading-relaxed text-[#0b1025]/85">
                        Tamani Arts Office Tower, Business Bay, Dubai, U.A.E.
                      </div>
                    </div>

                    <div className={outlineCard}>
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-[#0b1025]/55">
                        EMAIL
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0b1025]/85">
                        ask@zaindubai.com
                      </div>
                    </div>

                    <div className={outlineCard}>
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-[#0b1025]/55">
                        VISIT US
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0b1025]/85">
                        www.zaindubai.com
                      </div>
                    </div>

                    <div className={outlineCard}>
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-[#0b1025]/55">
                        CALL / WHATSAPP
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0b1025]/85">
                        +971 52 136 2224
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social + availability */}
                <div>
                  <div className={sectionTitle}>Follow ZAiN</div>
                  <div className="mt-2 text-sm font-semibold text-[#0b1025]/65">
                    Property updates, market signals, and direct contact points.
                  </div>

                  <div className="mt-5 grid gap-3">
                    {social.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "group flex items-center justify-between gap-3 rounded-[5px]",
                          "border border-black/12 bg-white px-4 py-3 text-left text-[#0b1025]",
                          "transition hover:bg-[#0b1025]/[0.03]",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#0b1025]/[0.04] text-[#0b1025] ring-1 ring-black/8">
                            <s.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold tracking-[0.18em] text-[#0b1025]/55">
                              {s.label}
                            </span>
                            <span className="block truncate text-sm font-semibold text-[#0b1025]/85">
                              {s.handle}
                            </span>
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#0b1025]/45 transition group-hover:text-[#0b1025]" />
                      </a>
                    ))}
                  </div>

                  <div className={cn("mt-6", outlineCard)}>
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-[#0b1025]/55">
                      AVAILABILITY
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-relaxed text-[#0b1025]/85">
                      Online 24/7 for shortlists & viewings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH separator + bottom bar (outside max-width container) */}
        <div className="border-t border-black/10">
          <div className={cn(containerClass, "py-6")}>
            <div className="grid grid-cols-[48px_1fr_48px] items-center">
              <div aria-hidden="true" />

              <div className="text-center">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <div className="text-xs font-semibold text-[#0b1025]/80">
                    © {year} ZAiN International Group. All Rights Reserved
                  </div>

                  <span className="h-4 w-px bg-black/10" />

                  <button
                    type="button"
                    onClick={() => navigate("/privacy-policy")}
                    className={bottomLinkClass}
                  >
                    Privacy Policy
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/terms-of-service")}
                    className={bottomLinkClass}
                  >
                    Terms of Service
                  </button>

                  <span className="h-4 w-px bg-black/10" />

                  <div className="text-xs font-semibold text-[#0b1025]/60">
                    Created by{" "}
                    <a
                      href="https://marknova.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0b1025]/80 underline underline-offset-4 decoration-black/20 transition hover:text-[#0b1025] hover:decoration-black/40"
                    >
                      marknova
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onNavigateSection("#top")}
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-[5px]",
                    "bg-white text-[#0b1025] ring-1 ring-black/10",
                    "shadow-sm transition hover:bg-[#0b1025]/[0.03]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/25",
                    "shrink-0",
                  )}
                  aria-label="Scroll to top"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
