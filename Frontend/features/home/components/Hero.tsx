import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type PointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { Star, Heart, ShoppingCart, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import PerfumeBottle from "./PerfumeBottle";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { CURRENCY } from "@/config/constants";
import { FRAGRANCE_FAMILIES } from "@/features/categories/catalog";
import type { Product } from "@/types/product";

type Theme = {
  id: string;
  label: string;
  orb: string;
  grad: string;
  gradDeep: string;
  tint: string;
  ring: string;
};

const THEMES: Theme[] = [
  {
    id: "amber",
    label: "Amber",
    orb: "rgba(201, 162, 39, 0.5)",
    grad: "rgba(230, 201, 107, 0.8)",
    gradDeep: "rgba(201, 162, 39, 0.55)",
    tint: "#c9a227",
    ring: "rgba(201, 162, 39, 0.45)",
  },
  {
    id: "rose",
    label: "Rose",
    orb: "rgba(176, 106, 76, 0.5)",
    grad: "rgba(226, 194, 174, 0.85)",
    gradDeep: "rgba(176, 106, 76, 0.5)",
    tint: "#b06a4c",
    ring: "rgba(176, 106, 76, 0.45)",
  },
  {
    id: "sage",
    label: "Sage",
    orb: "rgba(122, 155, 126, 0.5)",
    grad: "rgba(201, 216, 198, 0.85)",
    gradDeep: "rgba(122, 155, 126, 0.5)",
    tint: "#7a9b7e",
    ring: "rgba(122, 155, 126, 0.45)",
  },
];

const Hero = () => {
  const { products } = useApp();

  const addToCart = useCart((s) => s.addToCart);
  const toggleWishlist = useCart((s) => s.toggleWishlist);
  const wishlist = useCart((s) => s.wishlist);

  const [themeIndex, setThemeIndex] = useState(0);
  const [spotIndex, setSpotIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const theme = THEMES[themeIndex];

  const featured = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);

  /* safe index resolution (features load asynchronously) */
  const resolvedCount = featured.length;

  const active: Product | undefined = resolvedCount
    ? featured[spotIndex % resolvedCount]
    : undefined;

  const inWishlist = active
    ? wishlist.includes(active._id)
    : false;

  /* previous product rendered during transitions */
  const [prevProduct, setPrevProduct] = useState<Product | undefined>(
    undefined
  );

  const [flipping, setFlipping] = useState(false);

  const flipTimerRef = useRef<number | null>(null);
  const spotRef = useRef(0);

  /*
   * Finish the flip animation and clean up the previous product.
   */
  const finishFlip = useCallback(() => {
    setFlipping(false);
    setPrevProduct(undefined);
    flipTimerRef.current = null;
  }, []);

  /*
   * Clear any existing flip timer before starting another one.
   */
  const clearFlipTimer = useCallback(() => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
  }, []);

  /*
   * Start the product flip animation.
   */
  const startFlip = useCallback(
    (prev: Product | undefined) => {
      setPrevProduct(prev);
      setFlipping(true);

      clearFlipTimer();

      flipTimerRef.current = window.setTimeout(() => {
        finishFlip();
      }, 800);
    },
    [clearFlipTimer, finishFlip]
  );

  /*
   * Keep the active index valid when products are loaded,
   * removed, or changed asynchronously.
   */
  useEffect(() => {
    if (!featured.length) {
      spotRef.current = 0;
      return;
    }

    if (spotIndex >= featured.length) {
      const next = 0;
      spotRef.current = next;
      setTimeout(() => setSpotIndex(next), 0);
    }
  }, [featured.length, spotIndex]);

  const goTo = useCallback(
    (i: number) => {
      if (!featured.length) return;

      const next =
        ((i % featured.length) + featured.length) % featured.length;

      if (next === spotIndex) return;

      const previousProduct =
        featured[spotIndex % featured.length];

      spotRef.current = next;

      startFlip(previousProduct);
      setSpotIndex(next);
    },
    [featured, spotIndex, startFlip]
  );

  /*
   * Gentle auto-rotate, pauses while hovered —
   * split-flip on change.
   */
  useEffect(() => {
    if (featured.length <= 1 || paused) {
      return undefined;
    }

    const id = window.setInterval(() => {
      const cur = spotRef.current % featured.length;
      const next = (cur + 1) % featured.length;

      spotRef.current = next;

      startFlip(featured[cur]);
      setSpotIndex(next);
    }, 4600);

    return () => {
      window.clearInterval(id);
    };
  }, [featured, paused, startFlip]);

  /*
   * Clean up flip timer when component unmounts.
   */
  useEffect(() => {
    return () => {
      clearFlipTimer();
    };
  }, [clearFlipTimer]);

  /* ── 3D pointer tilt ─────────────────────────────────── */
  const stageRef = useRef<HTMLDivElement | null>(null);
  const chip1Ref = useRef<HTMLDivElement | null>(null);
  const chip2Ref = useRef<HTMLDivElement | null>(null);

  const onTilt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rx = (0.5 - py) * 14;
    const ry = (px - 0.5) * 16;

    if (stageRef.current) {
      stageRef.current.style.transform = `rotateX(${rx.toFixed(
        2
      )}deg) rotateY(${ry.toFixed(2)}deg)`;
    }

    if (chip1Ref.current) {
      chip1Ref.current.style.transform = `translate3d(${(
        (px - 0.5) *
        22
      ).toFixed(2)}px, ${((py - 0.5) * 14).toFixed(
        2
      )}px, 0)`;
    }

    if (chip2Ref.current) {
      chip2Ref.current.style.transform = `translate3d(${(
        (0.5 - px) *
        16
      ).toFixed(2)}px, ${((py - 0.5) * 18).toFixed(
        2
      )}px, 0)`;
    }
  };

  const resetTilt = () => {
    if (stageRef.current) {
      stageRef.current.style.transform = "";
    }

    if (chip1Ref.current) {
      chip1Ref.current.style.transform = "";
    }

    if (chip2Ref.current) {
      chip2Ref.current.style.transform = "";
    }
  };

  const avg = useMemo(() => {
    const nums = products
      .map((p) => Number(p.rating))
      .filter((v) => Number.isFinite(v) && v > 0);

    return nums.length
      ? nums.reduce((a, b) => a + b, 0) / nums.length
      : 4.9;
  }, [products]);

  const ticker = useMemo(
    () => [...FRAGRANCE_FAMILIES, ...FRAGRANCE_FAMILIES],
    []
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold/15 bg-cream shadow-xl shadow-espresso/5">
      {/* liquid-blob backdrop tints with the active theme */}
      <div
        className="liquid-blob pointer-events-none absolute -top-24 right-1/3 h-96 w-96 blur-[70px] transition-[background] duration-700"
        style={{ background: theme.grad }}
      />

      <div
        className="liquid-blob pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 blur-[80px] transition-[background] duration-700"
        style={{ background: theme.gradDeep }}
      />

      <div
        className="liquid-blob pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 blur-[70px] transition-[background] duration-700"
        style={{ background: theme.grad }}
      />

      <div className="pointer-events-none absolute right-0 top-0 h-px w-2/3 bg-linear-to-l from-gold/40 to-transparent" />

      <div className="relative grid items-center gap-14 px-6 py-5 md:px-9 lg:grid-cols-2">
        {/* ═══════════ LEFT — copy + mood switcher ─══════════ */}
        <div className="text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 text-xs tracking-luxe uppercase text-espresso">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />

              The Liquid Gallery

              <span className="h-px w-8 bg-gold/50" />
            </span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 font-display leading-[1.04] text-ink">
              <span className="block text-4xl font-medium tracking-tight sm:text-5xl xl:text-6xl">
                Scent, set in
              </span>

              <span className="mt-1 block text-4xl sm:text-5xl xl:text-6xl gold-text">
                liquid motion.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-soft lg:mx-0">
              A modern atelier for intimate chemistry — hand-blended oils,
              layered notes and a palette of moods that shift with you, hour
              by hour.
            </p>
          </Reveal>

          {/* mood switcher */}
          <Reveal delay={320}>
            <div className="mt-6 flex items-center justify-center gap-3 lg:justify-start">
              <span className="text-[0.6rem] tracking-luxe uppercase text-ink-soft">
                Mood
              </span>

              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeIndex(i)}
                  aria-pressed={themeIndex === i}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-all duration-300 ${
                    themeIndex === i
                      ? "border-transparent bg-ink text-cream shadow-md"
                      : "border-gold/25 bg-white/70 text-ink-soft hover:border-gold/60"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-white/70"
                    style={{ background: t.tint }}
                  />

                  {t.label}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link to="/customize" className="btn-gold">
                Compose Your Scent
              </Link>

              <Link
                to="/collection"
                className="relative font-display text-xl text-ink underline-script transition-colors hover:text-espresso"
              >
                Shop the Collection →
              </Link>
            </div>
          </Reveal>

          {/* fine stats */}
          <Reveal delay={480}>
            <div className="mt-5 flex items-center justify-center gap-6 sm:gap-8 lg:justify-start">
              <div className="text-center lg:text-left">
                <p className="font-display text-3xl font-semibold gold-text">
                  {products.length || 18}
                </p>

                <p className="mt-1 text-[0.55rem] tracking-luxe uppercase text-ink-soft">
                  Curated Scents
                </p>
              </div>

              <span className="h-10 w-px bg-gold/25" />

              <div className="flex items-center gap-1 text-center">
                <Star className="h-4 w-4 fill-gold text-gold" />

                <p className="font-display text-3xl font-semibold gold-text">
                  {avg.toFixed(1)}
                </p>
              </div>

              <span className="h-10 w-px bg-gold/25" />

              <div className="text-center lg:text-left">
                <p className="font-display text-3xl font-semibold gold-text">
                  100%
                </p>

                <p className="mt-1 text-[0.55rem] tracking-luxe uppercase text-ink-soft">
                  Hand-Blended
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ═══════════ RIGHT — the liquid stage ═══════════ */}
        <Reveal direction="zoom" delay={200}>
          <div
            onPointerMove={onTilt}
            onPointerLeave={resetTilt}
            className="perspective-[1100px]"
          >
            <div
              ref={stageRef}
              className="relative mx-auto w-full max-w-sm transition-transform duration-300 ease-out will-change-transform"
            >
              {/* rotating conic ring — tinted by the active mood */}
              {/* COMMENTED OUT: the revolving/conic animation around the card is temporarily disabled.
                  To re-enable, remove the opening and closing comment markers below.
              <div
                className="pointer-events-none absolute -inset-4 rounded-[2.5rem] spin-slow transition-[background] duration-700"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0 300deg, ${theme.ring} 330deg, transparent 360deg)`,
                }}
              />
              */}

              {/* mood glow behind the card */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-full blur-3xl pulse-soft transition-[background] duration-700"
                style={{
                  background: `radial-gradient(circle, ${theme.orb}, transparent 70%)`,
                }}
              />

              {featured.length === 0 ? (
                /* fallback — the hand-crafted bottle */
                <div className="relative flex aspect-4/5 items-center justify-center overflow-hidden rounded-[2.5rem] border border-gold/20 bg-linear-to-br from-white via-sand/50 to-blush/40 shadow-2xl shadow-espresso/10">
                  <div className="absolute inset-8 rounded-full bg-linear-to-br from-blush/40 via-sand/50 to-gold/20 breathe" />

                  <div className="absolute inset-0 flex items-center justify-center float-anim">
                    <PerfumeBottle
                      tint={theme.tint}
                      className="h-64 w-52 drop-shadow-2xl"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="relative overflow-hidden rounded-[2.5rem] border border-gold/20 bg-linear-to-br from-white/85 via-sand/40 to-blush/50 shadow-2xl shadow-espresso/10 backdrop-blur-xl"
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                >
                  {/* product image with 3D flip */}
                  <div className="flex items-center justify-center px-8 pt-10 pb-24">
                    {active && (
                      <div
                        className={`flip-card relative ${
                          flipping ? "flipping" : ""
                        }`}
                        style={{
                          width: "320px",
                          height: "360px",
                        }}
                      >
                        <div className="flip-card-inner">
                          {/* front - previous product (shown during flip) */}
                          <div className="flip-card-front">
                            <div className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-gold/25 blur-3xl" />

                            {prevProduct &&
                            flipping &&
                            prevProduct.image?.[0] ? (
                              <img
                                src={prevProduct.image[0]}
                                alt={prevProduct.name}
                                className="relative h-full w-full rounded-3xl object-cover shadow-2xl shadow-espresso/20 ring-1 ring-white/70"
                              />
                            ) : (
                              <PerfumeBottle
                                tint={theme.tint}
                                className="relative h-full w-full drop-shadow-2xl"
                              />
                            )}
                          </div>

                          {/* back - current product (shown by default) */}
                          <div className="flip-card-back">
                            <div className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-gold/25 blur-3xl" />

                            {active.image?.[0] ? (
                              <img
                                src={active.image[0]}
                                alt={active.name}
                                className="relative h-full w-full rounded-3xl object-cover shadow-2xl shadow-espresso/20 ring-1 ring-white/70"
                              />
                            ) : (
                              <PerfumeBottle
                                tint={theme.tint}
                                className="relative h-full w-full drop-shadow-2xl"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* floating info chips — with parallax depth */}
                  {active && (
                    <>
                      <div className="absolute left-5 top-5 float-anim-late">
                        <div
                          ref={chip1Ref}
                          className="will-change-transform"
                        >
                          <div className="rounded-2xl border border-gold/25 bg-white/85 px-4 py-2.5 shadow-lg shadow-espresso/10 backdrop-blur">
                            <p className="text-[0.6rem] tracking-luxe uppercase text-gold">
                              House
                            </p>

                            <p className="font-display text-lg text-ink">
                              {active.subCategory || "Parfum"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-24 right-3 float-anim-late">
                        <div
                          ref={chip2Ref}
                          className="will-change-transform"
                        >
                          <div className="rounded-2xl border border-gold/25 bg-white/85 px-4 py-2.5 shadow-lg shadow-espresso/10 backdrop-blur">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />

                            <p className="mt-0.5 font-display text-lg leading-none text-ink">
                              {(Number(active.rating) || 0).toFixed(1)}
                            </p>

                            <p className="mt-0.5 text-[0.55rem] tracking-luxe uppercase text-gold">
                              {active.reviews || 0} reviews
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* lower action bar */}
                  <div className="absolute inset-x-0 bottom-0 border-t border-gold/20 bg-white/70 px-5 py-4 backdrop-blur-xl">
                    {active ? (
                      <div
                        key={`bar-${active._id}`}
                        className="flex items-center justify-between gap-3"
                        style={{
                          animation:
                            "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display text-xl text-ink">
                            {active.name}
                          </p>

                          <p className="mt-0.5 text-xs font-semibold gold-text">
                            {CURRENCY} {active.price}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            aria-label={
                              inWishlist
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            onClick={() => toggleWishlist(active._id)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-white/80 transition-transform hover:scale-110"
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                inWishlist
                                  ? "fill-espresso text-espresso"
                                  : "text-ink-soft"
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              addToCart(active._id, "100ml")
                            }
                            className="flex items-center gap-1.5 rounded-full bg-linear-to-br from-gold-soft to-gold px-4 py-2.5 text-xs font-semibold text-ink transition-transform hover:scale-105 active:scale-95"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />

                            Add to Cart
                          </button>

                          <Link
                            to={`/product/${active._id}`}
                            aria-label={`View ${active.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-white/80 text-ink transition-transform hover:scale-110"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* carousel controls */}
              {featured.length > 1 && (
                <>
                  <div className="absolute -left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                    {/* <button
                      type="button"
                      aria-label="Previous scent"
                      onClick={() => goTo(spotIndex - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-white/80 text-ink shadow-lg shadow-espresso/10 backdrop-blur transition-transform hover:scale-110 hover:bg-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next scent"
                      onClick={() => goTo(spotIndex + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-white/80 text-ink shadow-lg shadow-espresso/10 backdrop-blur transition-transform hover:scale-110 hover:bg-white"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button> */}
                  </div>

                  {/* dots with race progress */}
                  <div className="mt-5 flex items-center justify-center gap-2.5">
                    {featured.map((p, i) => (
                      <button
                        key={`${p._id}-${i}`}
                        type="button"
                        aria-label={`Go to scent ${i + 1}`}
                        onClick={() => goTo(i)}
                        className="relative h-1.5 w-8 overflow-hidden rounded-full bg-ink/15"
                      >
                        {i === spotIndex && (
                          <span
                            className="absolute inset-y-0 left-0 rounded-full race-bar bg-gold"
                            style={{
                              animationPlayState: paused
                                ? "paused"
                                : "running",
                              width: "0%",
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {/* scent ticker */}
      <div className="relative overflow-hidden border-t border-gold/15 bg-white/40 py-3 backdrop-blur">
        <div className="marquee-track text-[0.62rem] tracking-luxe uppercase text-espresso/70">
          {ticker.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-6 whitespace-nowrap px-6"
            >
              {f.label.replace(/[^\w\s&-]/g, "").trim()}

              <span className="text-gold">❦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;