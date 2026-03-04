import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

// Helper to get subtitle based on gender
const getGenderSubtitle = (gender) => {
  const g = (gender || '').toLowerCase();
  if (g === 'women') return 'Discover';
  if (g === 'men') return 'Explore';
  if (g === 'boys') return 'Play';
  if (g === 'girls') return 'Style';
  return 'Shop Now';
};

const toParentCategoryLink = (gender) => {
  const g = String(gender || '').toLowerCase();
  if (!g) return '/search';
  const parent = g.charAt(0).toUpperCase() + g.slice(1);
  return `/search?parent_category=${encodeURIComponent(parent)}`;
};

// Fallback tiles in case API is empty
const fallbackTiles = [
  {
    id: "fallback-women",
    name: "Women Collection",
    subtitle: "Discover",
    link: "/search?parent_category=Women",
    image: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "fallback-men",
    name: "Men Collection",
    subtitle: "Explore",
    link: "/search?parent_category=Men",
    image: "https://images.unsplash.com/photo-1520975693411-b4d02a2be7d1?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "fallback-boys",
    name: "Boys Collection",
    subtitle: "Play",
    link: "/search?parent_category=Boys",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "fallback-girls",
    name: "Girls Collection",
    subtitle: "Style",
    link: "/search?parent_category=Girls",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=70",
  },
];

function Tile({ title, subtitle, to, image }) {
  return (
    <Link
      to={to}
      className="group block relative overflow-hidden rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-[240px] sm:h-auto sm:aspect-[4/5] bg-zinc-100 overflow-hidden">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent opacity-90" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-between text-white p-3 sm:p-5 md:p-6">
        <div>
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white/80 bg-white/15 border border-white/25 rounded-full px-2 sm:px-3 py-1">
            {subtitle}
          </span>
        </div>
        <div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow leading-tight">
            {title}
          </h3>
          <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-white/90">
            Explore Collection
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 border border-white/30 transition-transform duration-300 group-hover:translate-x-1">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CollectionTiles() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data } = await api.get("/collections");
        const items = data?.data || [];
        
        if (items.length > 0) {
          // Transform API data to tile format
          const tiles = items.map((c) => ({
            id: c.id,
            name: c.name,
            subtitle: getGenderSubtitle(c.gender),
            link: c.link || toParentCategoryLink(c.gender),
            image: c.image_url,
          }));
          setCollections(tiles);
        } else {
          // Use fallback if no collections from API
          setCollections(fallbackTiles);
        }
      } catch (error) {
        console.warn("Failed to fetch collections, using fallback:", error);
        setCollections(fallbackTiles);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <section className="container-safe mt-8">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="h-[240px] sm:h-auto sm:aspect-[4/5] bg-zinc-100 animate-pulse rounded-3xl"></div>
          <div className="h-[240px] sm:h-auto sm:aspect-[4/5] bg-zinc-100 animate-pulse rounded-3xl"></div>
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="container-safe mt-10 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
        {collections.map((tile) => (
          <Tile
            key={tile.id}
            title={tile.name}
            subtitle={tile.subtitle || "Discover"}
            to={tile.link || "/search"}
            image={tile.image}
          />
        ))}
      </div>
    </section>
  );
}
