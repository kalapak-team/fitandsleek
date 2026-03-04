import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";

// Fallback slides in case API is empty
const fallbackSlides = [
  {
    badge: "SALE",
    title: "Up to 50% Off",
    desc: "Limited-time discounts on selected items.",
    cta: { label: "Shop Sale", to: "/search?gender=sale" },
    bg: "from-rose-400 via-red-500 to-red-600",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70",
  },
  {
    badge: "NEW IN",
    title: "Fresh street-ready drops",
    desc: "New arrivals curated for daily wear.",
    cta: { label: "Shop New", to: "/search?tab=new" },
    bg: "from-zinc-200 via-zinc-100 to-white",
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=70",
  },
];

// High-End Animation Variants (3 Styles for Random Selection)
const imageVariants = {
  // Style 1: Fade-In (Elegant and Simple)
  fadeInEnter: {
    opacity: 0,
  },
  fadeInCenter: {
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  fadeInExit: {
    opacity: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
  
  // Style 2: Zoom-In / Ken Burns Effect (Cinematic)
  zoomInEnter: {
    scale: 1.2,
    opacity: 0,
  },
  zoomInCenter: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  zoomInExit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
  
  // Style 3: Slide-from-Right (Dynamic)
  slideFromRightEnter: {
    x: "100%",
    opacity: 0,
  },
  slideFromRightCenter: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 22,
      mass: 1,
    },
  },
  slideFromRightExit: {
    x: "-30%",
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: "easeIn",
    },
  },
};

// Paragon-style text animation variants with sophisticated staggering
const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.4, // Start after image begins
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Individual text element animations
const badgeVariants = {
  hidden: { 
    y: -20, 
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    scale: 0.9,
  },
};

const titleVariants = {
  hidden: { 
    y: 40, 
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    y: -20,
    opacity: 0,
  },
};

const subtitleVariants = {
  hidden: { 
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

// Button with continuous pulse animation
const buttonVariants = {
  hidden: { 
    scale: 0.5,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
  },
};

export default function Hero() {
  const [i, setI] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animationStyle, setAnimationStyle] = useState("fadeIn");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Array of 3 high-end animation styles for random selection
  const animationStyles = ["fadeIn", "zoomIn", "slideFromRight"];

  // Get random animation style (not sequential - truly random)
  const getRandomAnimationStyle = () => {
    const randomIndex = Math.floor(Math.random() * animationStyles.length);
    return animationStyles[randomIndex];
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await api.get("/banners/hero");
        const items = data?.data || [];
        if (items.length > 0) {
          setBanners(items);
        } else {
          // Use fallback if no banners from API
          setBanners(fallbackSlides.map((slide, idx) => ({
            id: `fallback-${idx}`,
            badge: slide.badge,
            title: slide.title,
            subtitle: slide.desc,
            image_url: slide.image,
            link_url: slide.cta.to,
            bg: slide.bg,
          })));
        }
      } catch (error) {
        console.warn("Failed to fetch banners, using fallback:", error);
        setBanners(fallbackSlides.map((slide, idx) => ({
          id: `fallback-${idx}`,
          badge: slide.badge,
          title: slide.title,
          subtitle: slide.desc,
          image_url: slide.image,
          link_url: slide.cta.to,
          bg: slide.bg,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const slides = useMemo(() => {
    return banners.map((b) => ({
      id: b.id,
      badge: b.title || "SALE",
      title: b.title || b.badge,
      subtitle: b.subtitle,
      desc: b.subtitle,
      cta: { 
        label: b.title || "Shop Now", 
        to: b.link_url || "/search" 
      },
      image: b.image_url,
      link_url: b.link_url,
      bg: b.bg || "from-rose-400 via-red-500 to-red-600",
    }));
  }, [banners]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setAnimationStyle(getRandomAnimationStyle());
      setI((x) => (x + 1) % slides.length);
    }, 5000); // 5-second auto-play
    return () => clearInterval(t);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="container-safe pt-4 md:pt-6 max-w-[1600px] mx-auto">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-200 bg-gradient-to-r from-zinc-100 via-zinc-50 to-white animate-pulse aspect-video md:aspect-auto md:min-h-[400px] lg:min-h-[560px]">
          <div className="absolute inset-0 flex items-end p-4 md:p-10">
            <div className="w-full max-w-xl">
              <div className="h-3 md:h-4 w-16 md:w-20 bg-zinc-200 rounded mb-3 md:mb-4"></div>
              <div className="h-6 md:h-10 w-40 md:w-48 bg-zinc-200 rounded mb-2"></div>
              <div className="h-3 md:h-4 w-full max-w-xs bg-zinc-200 rounded mb-4 md:mb-6"></div>
              <div className="h-8 md:h-10 w-24 md:w-28 bg-zinc-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const active = slides[i];

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setAnimationStyle(getRandomAnimationStyle());
      setI((x) => (x + 1) % slides.length);
    }
    if (isRightSwipe) {
      setAnimationStyle(getRandomAnimationStyle());
      setI((x) => (x - 1 + slides.length) % slides.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Handle dot click
  const handleDotClick = (index) => {
    if (index !== i) {
      setAnimationStyle(getRandomAnimationStyle());
      setI(index);
    }
  };

  return (
    <section className="container-safe pt-4 max-w-[1600px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div 
          className="relative aspect-video md:aspect-auto md:min-h-[400px] lg:min-h-[560px] overflow-hidden cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Animated Banner Images */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`banner-${i}-${animationStyle}`}
              initial={`${animationStyle}Enter`}
              animate={`${animationStyle}Center`}
              exit={`${animationStyle}Exit`}
              variants={imageVariants}
              className="absolute inset-0"
            >
              {active.image && (
                <img
                  src={active.image}
                  alt={active.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Animated Text Content - Paragon Style */}
          <div className="relative z-10 h-full flex items-end pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${i}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={textContainerVariants}
                className="p-4 md:p-6 lg:p-10 max-w-xl text-white w-full"
              >
                {/* Badge with spring animation */}
                <motion.span 
                  variants={badgeVariants}
                  className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  {active.badge || "Featured"}
                </motion.span>
                
                {/* Title slides down - Responsive sizing */}
                <motion.h1 
                  variants={titleVariants}
                  className="mt-2 md:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight"
                >
                  {active.title}
                </motion.h1>
                
                {/* Subtitle fades in - Hide on very small screens */}
                {active.desc && (
                  <motion.p 
                    variants={subtitleVariants}
                    className="mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base text-white/90 line-clamp-2"
                  >
                    {active.desc}
                  </motion.p>
                )}
                
                {/* Button scales up - Compact on mobile */}
                <motion.div 
                  variants={buttonVariants}
                  className="mt-3 md:mt-4 pointer-events-auto"
                >
                  <Link
                    to={active.cta?.to || active.link_url || "/search"}
                    className="inline-flex items-center h-8 md:h-10 px-4 md:px-6 rounded-full bg-white text-zinc-900 text-xs md:text-sm font-semibold shadow-lg hover:shadow-xl hover:bg-zinc-100 transition-all duration-300"
                  >
                    {active.cta?.label || "Shop now"}
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Elegant Progress Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2">
              {slides.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.85 }}
                  className="relative group"
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {/* Dot background */}
                  <span 
                    className={`block rounded-full transition-all duration-500 ${
                      idx === i
                        ? "w-8 md:w-10 h-1.5 md:h-2 bg-white shadow-lg"
                        : "w-1.5 md:w-2 h-1.5 md:h-2 bg-white/40 group-hover:bg-white/70"
                    }`}
                  />
                  
                  {/* Active progress bar */}
                  {idx === i && (
                    <motion.span
                      className="absolute inset-0 bg-white/50 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 5, ease: "linear" }}
                      style={{ transformOrigin: "left" }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
