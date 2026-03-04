import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Show button after scrolling down 500px
      setIsVisible(scrollTop > 500);
      
      // Calculate scroll progress percentage (0-100)
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Calculate stroke dash offset for circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 group cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
        >
          {/* Glassmorphism Container with Mouse Shape */}
          <div className="relative">
            {/* Progress Ring */}
            <svg
              className="absolute inset-0 -rotate-90"
              width="64"
              height="64"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#ffffff"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-150 ease-out"
                style={{
                  filter: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))",
                }}
              />
            </svg>

            {/* Mouse-shaped Button with Glassmorphism */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-xl border-2 border-white shadow-2xl shadow-black/30 group-hover:bg-white group-hover:shadow-white/30 transition-all duration-300">
                {/* Animated Double Arrow Up */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex flex-col items-center"
                  >
                    <ChevronUp className="w-5 h-5 text-zinc-800" strokeWidth={3} />
                    <ChevronUp className="w-5 h-5 text-zinc-800 -mt-3" strokeWidth={3} />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 rounded-full bg-white/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
