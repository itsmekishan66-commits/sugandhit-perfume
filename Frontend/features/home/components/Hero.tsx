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
    /* tilt is a desktop/hover nicety — never fight touch scrolling */
    if (e.pointerType !== "mouse") return;

    const rect = e.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    /* ease the effect off on narrow stages so it never feels cramped */
    const k = Math.min(1, rect.width / 420);

    const rx = (0.5 - py) * 14 * k;
    const ry = (px - 0.5) * 16 * k;

    if (stageRef.current) {
      stageRef.current.style.transform = `rotateX(${rx.toFixed(
        2
      )}deg) rotateY(${ry.toFixed(2)}deg)`;
    }

    if (chip1Ref.current) {
      chip1Ref.current.style.transform = `translate3d(${(
        (px - 0.5) *
        22 *
        k
      ).toFixed(2)}px, ${((py - 0.5) * 14 * k).toFixed(2)}px, 0)`;
    }

    if (chip2Ref.current) {
      chip2Ref.current.style.transform = `translate3d(${(
        (0.5 - px) *
        16 *
        k
      ).toFixed(2)}px, ${((py - 0.5) * 18 * k).toFixed(2)}px, 0)`;
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
    <section className="relative w-full overflow-hidden rounded-2xl border border-gold/15 bg-cream shadow-xl shadow-espresso/5 sm:rounded-3xl">
      {/* liquid-blob backdrop tints with the active theme */}
      <div
        className="liquid-blob pointer-events-none absolute -top-16 right-1/4 h-52 w-52 blur-[55px] transition-[background] duration-700 sm:-top-24 sm:right-1/3 sm:h-96 sm:w-96 sm:blur-[70px]"
        style={{ background: theme.grad }}
      />

      <div
        className="liquid-blob pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 blur-[60px] transition-[background] duration-700 sm:-bottom-32 sm:-left-20 sm:h-80 sm:w-80 sm:blur-[80px]"
        style={{ background: theme.gradDeep }}
      />

      <div
        className="liquid-blob pointer-events-none absolute -bottom-16 -right-12 h-52 w-52 blur-[55px] transition-[background] duration-700 sm:-bottom-24 sm:-right-20 sm:h-80 sm:w-80 sm:blur-[70px]"
        style={{ background: theme.grad }}
      />

      <div className="pointer-events-none absolute right-0 top-0 h-px w-2/3 bg-linear-to-l from-gold/40 to-transparent" />

      <div className="relative grid items-center gap-9 px-4 py-7 sm:gap-11 sm:px-6 sm:py-8 md:px-9 lg:grid-cols-2 lg:gap-8 xl:gap-14">
        {/* ═══════════ LEFT — copy + mood switcher ─══════════ */}
        <div className="min-w-0 text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[0.62rem] tracking-luxe uppercase text-espresso sm:gap-2.5 sm:text-xs">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />

              The Liquid Gallery

              <span className="h-px w-6 bg-gold/50 sm:w-8" />
            </span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-5 font-display leading-[1.04] text-ink sm:mt-6">
              <span className="block text-[2rem] font-medium tracking-tight min-[400px]:text-[2.6rem] sm:text-5xl xl:text-6xl">
                Scent, set in
              </span>

              <span className="mt-1 block text-[2rem] min-[400px]:text-[2.6rem] sm:text-5xl xl:text-6xl gold-text">
                liquid motion.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-5 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-lg lg:mx-0">
              A modern atelier for intimate chemistry — hand-blended oils,
              layered notes and a palette of moods that shift with you, hour
              by hour.
            </p>
          </Reveal>

          {/* mood switcher */}
          <Reveal delay={320}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3 lg:justify-start">
              <span className="text-[0.58rem] tracking-luxe uppercase text-ink-soft sm:text-[0.6rem]">
                Mood
              </span>

              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeIndex(i)}
                  aria-pressed={themeIndex === i}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] tracking-wide transition-all duration-300 sm:gap-2 sm:px-3.5 sm:text-xs ${
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
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:mt-8 sm:flex-row sm:gap-5 lg:justify-start">
              <Link to="/customize" className="btn-gold w-full sm:w-auto">
                Compose Your Scent
              </Link>

              <Link
                to="/collection"
                className="relative text-center font-display text-lg text-ink underline-script transition-colors hover:text-espresso sm:text-xl"
              >
                Shop the Collection →
              </Link>
            </div>
          </Reveal>

          {/* fine stats */}
          <Reveal delay={480}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:mt-5 sm:gap-x-8 sm:gap-y-4 lg:justify-start">
              <div className="text-center lg:text-left">
                <p className="font-display text-2xl font-semibold gold-text sm:text-3xl">
                  {products.length || 18}
                </p>

                <p className="mt-1 text-[0.5rem] tracking-luxe uppercase text-ink-soft sm:text-[0.55rem]">
                  Curated Scents
                </p>
              </div>

              <span className="hidden h-10 w-px bg-gold/25 sm:block" />

              <div className="flex items-center gap-1 text-center">
                <Star className="h-4 w-4 fill-gold text-gold" />

                <p className="font-display text-2xl font-semibold gold-text sm:text-3xl">
                  {avg.toFixed(1)}
                </p>
              </div>

              <span className="hidden h-10 w-px bg-gold/25 sm:block" />

              <div className="text-center lg:text-left">
                <p className="font-display text-2xl font-semibold gold-text sm:text-3xl">
                  100%
                </p>

                <p className="mt-1 text-[0.5rem] tracking-luxe uppercase text-ink-soft sm:text-[0.55rem]">
                  Hand-Blended
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ═══════════ RIGHT — the liquid stage ═══════════ */}
        <Reveal direction="zoom" delay={200} className="w-full min-w-0">
          <div
            onPointerMove={onTilt}
            onPointerLeave={resetTilt}
            className="perspective-[1100px]"
          >
            <div
              ref={stageRef}
              className="relative mx-auto w-full max-w-68 transition-transform duration-300 ease-out will-change-transform sm:max-w-xs md:max-w-sm xl:max-w-md"
            >
              {/* rotating conic ring — tinted by the active mood */}
              {/* COMMENTED OUT: the revolving/conic animation around the card is temporarily disabled.
                  To re-enable, remove the opening and closing comment markers below.
              <div
                className="pointer-events-none absolute -inset-4 rounded-[2.5rem] spin-slow transition-[background] duration-700"
                style={{
                  background: `conic-linear(from 0deg, transparent 0 300deg, ${theme.ring} 330deg, transparent 360deg)`,
                }}
              />
              */}

              {/* mood glow behind the card */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-full blur-3xl pulse-soft transition-[background] duration-700"
                style={{
                  background: `radial-linear(circle, ${theme.orb}, transparent 70%)`,
                }}
              />

              {featured.length === 0 ? (
                /* fallback — the hand-crafted bottle */
                <div className="group relative w-full overflow-hidden rounded-[1.75rem] border border-gold/25 bg-[#f9f4e9] shadow-[0_25px_70px_rgba(61,45,27,0.12)] transition-all duration-500 hover:-translate-y-1 sm:rounded-[2.8rem]">

                  {/* Product visual */}
                  <div className="relative aspect-[4/4.2] overflow-hidden bg-[#eee9df] sm:aspect-[4/3.8]">

                    <div className="absolute inset-0 bg-linear-to-br from-[#f8f6ef] via-[#e9e8e3] to-[#d8d7d1]" />

                    <div className="absolute right-0 top-0 h-full w-[52%] bg-linear-to-l from-[#26282b] via-[#3b3d40] to-transparent opacity-90" />

                    <div className="absolute left-0 top-0 h-full w-[45%] bg-linear-to-r from-[#faf8ef] via-[#eeece5] to-transparent" />

                    {/* House badge */}
                    <div className="absolute left-0 top-0 z-30 max-w-[62%] rounded-br-2xl rounded-tl-[1.75rem] rounded-tr-[1.75rem] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:max-w-none sm:rounded-br-[1.6rem] sm:rounded-tl-[2.8rem] sm:rounded-tr-[2.8rem] sm:px-7 sm:py-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#d2ae3d] sm:text-[11px] sm:tracking-[0.28em]">
                        HOUSE
                      </p>

                      <p className="mt-1 truncate font-serif text-[15px] text-[#40372e] sm:text-[19px]">
                        Resins
                      </p>
                    </div>

                    {/* Bottle */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center">

                      <div className="absolute h-[55%] w-[45%] rounded-full bg-white/30 blur-3xl" />

                      <div className="relative mt-4 transition-all duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.035] sm:mt-7">

                        <div className="absolute -bottom-3 left-1/2 h-7 w-32 -translate-x-1/2 rounded-full bg-black/25 blur-xl sm:w-44" />

                        <PerfumeBottle
                          tint={theme.tint}
                          className="relative z-10 h-40 w-34 drop-shadow-[0_25px_25px_rgba(0,0,0,0.30)] sm:h-72 sm:w-60"
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-0 right-0 z-30 rounded-tl-[1.1rem] rounded-br-[1.75rem] rounded-tr-[1.1rem] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:rounded-tl-[1.8rem] sm:rounded-br-3xl sm:rounded-tr-[1.8rem] sm:px-7 sm:py-5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Star
                          size={15}
                          fill="currentColor"
                          className="text-[#d8b43d]"
                        />

                        <span className="font-serif text-[16px] text-[#4b4034] sm:text-[18px]">
                          4.8
                        </span>
                      </div>

                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#d0aa36] sm:text-[10px] sm:tracking-[0.2em]">
                        196 REVIEWS
                      </p>
                    </div>
                  </div>

                  {/* Product footer */}
                  <div className="flex min-h-22 items-center gap-2 border-t border-gold/15 bg-[#fcfaf5] px-3 py-4 sm:min-h-25 sm:gap-3 sm:px-6 sm:py-5">

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-serif text-[16px] text-[#40372e] sm:text-[20px]">
                        Rose Oud Royale
                      </h3>

                      <p className="mt-1.5 text-[13px] font-semibold text-[#d4ae35] sm:mt-2 sm:text-[14px]">
                        Rs. 2,650
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e4d4ae] bg-white text-[#5d4d3d] transition hover:border-[#d9b640] hover:bg-[#fffaf0] sm:h-12 sm:w-12"
                    >
                      <Heart size={20} strokeWidth={1.7} />
                    </button>

                    <button
                      type="button"
                      className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#d9b63d] px-3.5 text-[13px] font-semibold text-[#3e3529] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e3c44d] sm:h-12 sm:px-5"
                    >
                      <ShoppingCart size={17} strokeWidth={1.8} />
                      <span className="hidden sm:inline">
                        Add to Cart
                      </span>
                    </button>

                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e4d4ae] bg-white text-[#554738] transition hover:translate-x-1 hover:border-[#d5af38] sm:h-12 sm:w-12"
                    >
                      <ArrowRight size={21} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="@container relative overflow-hidden rounded-[1.75rem] border border-gold/20 bg-linear-to-br from-white/85 via-sand/40 to-blush/50 shadow-2xl shadow-espresso/10 backdrop-blur-xl sm:rounded-[2.5rem]"
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                >
                  {/* product image with 3D flip */}
                  <div className="relative flex items-center justify-center px-3 pt-6 pb-14 sm:px-8 sm:pt-10 sm:pb-20">
                    {active && (
                      <div
                        className={`hero-flip flip-card relative aspect-8/9 w-full max-w-[20rem] ${flipping
                          ? "flipping"
                          : ""}`}
                      >
                        <div className="flip-card-inner">
                          {/* front - previous product (shown during flip) */}
                          <div className="flip-card-front">
                            <div className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-gold/25 blur-3xl @min-[18rem]:h-48 @min-[18rem]:w-48 sm:h-64 sm:w-64" />

                            {prevProduct &&
                              flipping &&
                              prevProduct.image?.[0] ? (
                              <img
                                src={prevProduct.image[0]}
                                alt={prevProduct.name}
                                className="relative h-full w-full rounded-2xl object-cover shadow-2xl shadow-espresso/20 ring-1 ring-white/70 sm:rounded-3xl"
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
                            <div className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-gold/25 blur-3xl @min-[18rem]:h-48 @min-[18rem]:w-48 sm:h-64 sm:w-64" />

                            {active.image?.[0] ? (
                              <img
                                src={active.image[0]}
                                alt={active.name}
                                className="relative h-full w-full rounded-2xl object-cover shadow-2xl shadow-espresso/20 ring-1 ring-white/70 sm:rounded-3xl"
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

                    {/* floating info chips — with parallax depth */}
                    {active && (
                      <>
                        <div className="absolute left-2.5 top-2.5 float-anim-late sm:left-5 sm:top-5">
                          <div
                            ref={chip1Ref}
                            className="will-change-transform"
                          >
                            <div className="rounded-xl border border-gold/25 bg-white/85 px-2.5 py-1.5 shadow-lg shadow-espresso/10 backdrop-blur sm:rounded-2xl sm:px-4 sm:py-2.5">
                              <p className="text-[0.55rem] tracking-luxe uppercase text-gold sm:text-[0.6rem]">
                                House
                              </p>

                              <p className="max-w-30 truncate font-display text-base text-ink sm:max-w-none sm:text-lg">
                                {active.subCategory || "Parfum"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-2.5 right-2.5 float-anim-late sm:bottom-5 sm:right-4">
                          <div
                            ref={chip2Ref}
                            className="will-change-transform"
                          >
                            <div className="rounded-xl border border-gold/25 bg-white/85 px-2.5 py-1.5 shadow-lg shadow-espresso/10 backdrop-blur sm:rounded-2xl sm:px-4 sm:py-2.5">
                              <Star className="h-3 w-3 fill-gold text-gold sm:h-3.5 sm:w-3.5" />

                              <p className="mt-0.5 font-display text-base leading-none text-ink sm:text-lg">
                                {(Number(active.rating) || 0).toFixed(1)}
                              </p>

                              <p className="mt-0.5 text-[0.5rem] tracking-luxe uppercase text-gold sm:text-[0.55rem]">
                                {active.reviews || 0} reviews
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* lower action bar - in normal flow so it can never overlap */}
                  <div className="relative border-t border-gold/20 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
                    {active ? (
                      <div
                        key={`bar-${active._id}`}
                        className="flex flex-col gap-2.5 @min-[15rem]:flex-row @min-[15rem]:items-center @min-[15rem]:justify-between @min-[15rem]:gap-3"
                        style={{
                          animation:
                            "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg text-ink sm:text-xl">
                            {active.name}
                          </p>

                          <p className="mt-0.5 text-[0.7rem] font-semibold gold-text sm:text-xs">
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
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-white/80 transition-transform hover:scale-110 sm:h-10 sm:w-10"
                          >
                            <Heart
                              className={`h-4 w-4 ${inWishlist
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
                            className="flex items-center gap-1.5 rounded-full bg-linear-to-br from-gold-soft to-gold px-3.5 py-2.5 text-[0.7rem] font-semibold text-ink transition-transform hover:scale-105 active:scale-95 sm:px-4 sm:text-xs"
                          >
                            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />

                            <span className="hidden @min-[24rem]:inline">
                              Add to Cart
                            </span>
                          </button>

                          <Link
                            to={`/product/${active._id}`}
                            aria-label={`View ${active.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-white/80 text-ink transition-transform hover:scale-110 sm:h-10 sm:w-10"
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
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-2.5">
                    {featured.map((p, i) => (
                      <button
                        key={`${p._id}-${i}`}
                        type="button"
                        aria-label={`Go to scent ${i + 1}`}
                        onClick={() => goTo(i)}
                        className="relative h-1.5 w-6 overflow-hidden rounded-full bg-ink/15 sm:w-8"
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
      <div className="relative overflow-hidden border-t border-gold/15 bg-white/40 py-2.5 backdrop-blur sm:py-3">
        <div className="marquee-track text-[0.55rem] tracking-luxe uppercase text-espresso/70 sm:text-[0.62rem]">
          {ticker.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-4 whitespace-nowrap px-4 sm:gap-6 sm:px-6"
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