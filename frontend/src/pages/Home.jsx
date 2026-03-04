import React, { useEffect, useMemo, useState } from "react";
import Hero from "../components/home/Hero.jsx";
import BrandRow from "../components/home/BrandRow.jsx";
import CollectionTiles from "../components/home/CollectionTiles.jsx";
import PromoBannerSlider from "../components/home/PromoBannerSlider.jsx";
import Section from "../components/shop/Section.jsx";
import { useHomepageSettings } from "../state/homepageSettings.jsx";
import api from "../lib/api";
import { useLanguage } from "../lib/i18n.jsx";

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickCategory(categories, names) {
  if (!Array.isArray(categories)) return null;
  const tokens = (names || []).map(normalizeToken).filter(Boolean);
  if (!tokens.length) return null;

  const exact = categories.find((category) => {
    const name = normalizeToken(category?.name);
    const slug = normalizeToken(category?.slug);
    const type = normalizeToken(category?.type);
    return tokens.some((token) => token === name || token === slug || token === type);
  });

  if (exact) return exact;

  return (
    categories.find((category) => {
      const name = normalizeToken(category?.name);
      const slug = normalizeToken(category?.slug);
      const type = normalizeToken(category?.type);
      return tokens.some(
        (token) =>
          name.includes(token) ||
          slug.includes(token) ||
          type.includes(token)
      );
    }) || null
  );
}

function getSectionSearchTokens(section) {
  const key = normalizeToken(section?.key);
  const title = normalizeToken(section?.title);
  const tokens = [key, title].filter(Boolean);

  if (key.includes("belt") || title.includes("belt")) {
    tokens.push("belts", "belt");
  }

  if (key.includes("vanna") || title.includes("vanna") || title.includes("វ៉ាន់ណា")) {
    tokens.push("vanna", "វ៉ាន់ណា");
  }

  return Array.from(new Set(tokens));
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const { settings: homepageSettings } = useHomepageSettings();
  const [sections, setSections] = useState({});
  const { t } = useLanguage();

  // Load categories
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/categories");
      const list = Array.isArray(data) ? data : data?.data;
      setCategories(Array.isArray(list) ? list : []);
    })();
  }, []);

  // Get enabled sections from settings, sorted by order
  const enabledSections = useMemo(() => {
    if (!homepageSettings?.sections) {
      // Fallback to default sections
      return [
        { key: 'discounts', title: t('discounts'), enabled: true, order: 1 },
        { key: 'clothes', title: t('clothes'), enabled: true, order: 2 },
        { key: 'shoes', title: t('shoes'), enabled: true, order: 3 },
        { key: 'belts', title: t('belts'), enabled: true, order: 4 },
      ].filter(s => s.enabled).sort((a, b) => a.order - b.order);
    }

    return Object.entries(homepageSettings.sections)
      .filter(([_, section]) => section.enabled)
      .map(([key, section]) => ({
        key,
        title: section.title,
        enabled: section.enabled,
        order: section.order,
      }))
      .sort((a, b) => a.order - b.order);
  }, [homepageSettings]);

  const sectionCategories = useMemo(() => {
    const mapped = {};
    enabledSections.forEach((section) => {
      if (section.key === "discounts") {
        return;
      }

      const searchTokens = getSectionSearchTokens(section);

      mapped[section.key] = pickCategory(categories, searchTokens);
    });
    return mapped;
  }, [enabledSections, categories]);

  // Load section products
  useEffect(() => {
    const loadSection = async (key, category) => {
      if (!category?.slug && !category?.id) {
        setSections((s) => ({ ...s, [key]: { loading: false, items: [] } }));
        return;
      }

      setSections((s) => ({ ...s, [key]: { ...(s[key] || {}), loading: true } }));
      try {
        const params = category?.slug
          ? { category: category.slug }
          : { category_id: category.id };
        const { data } = await api.get("/products", { params });
        const items = (data?.data || []).slice(0, 10);
        setSections((s) => ({ ...s, [key]: { loading: false, items } }));
      } catch (error) {
        console.error(`Error loading section ${key}:`, error);
        setSections((s) => ({ ...s, [key]: { loading: false, items: [] } }));
      }
    };

    const loadDiscounts = async () => {
      setSections((s) => ({ ...s, discounts: { ...(s.discounts || {}), loading: true } }));
      try {
        const { data } = await api.get("/products/discounts");
        const items = (data?.data || []).slice(0, 10);
        setSections((s) => ({ ...s, discounts: { loading: false, items } }));
      } catch (error) {
        console.error("Error loading discounts:", error);
        setSections((s) => ({ ...s, discounts: { loading: false, items: [] } }));
      }
    };

    enabledSections.forEach((section) => {
      if (section.key === "discounts") {
        loadDiscounts();
      } else {
        loadSection(section.key, sectionCategories[section.key]);
      }
    });
  }, [enabledSections, sectionCategories]);

  const getSectionLink = (section) => {
    const key = section?.key;
    const cat = sectionCategories[key];

    if (key === 'discounts') return '/discounts';
    if (cat?.slug) return `/category/${cat.slug}`;
    return `/search?search=${encodeURIComponent(section?.title || key || '')}`;
  };

  return (
    <div className="pb-14 max-w-[1600px] mx-auto">
      <Hero />
      <div className="animate-fade-in">
        <BrandRow />
      </div>
      <div className="animate-fade-in-up delay-100">
        <CollectionTiles />
      </div>

      {/* Dynamically render sections based on homepage settings */}
      {enabledSections.map((section, index) => (
        <div key={section.key} className={`animate-fade-in-up delay-${(index + 2) * 100}`}>
          <Section
            title={section.title}
            to={getSectionLink(section)}
            items={sections[section.key]?.items || []}
            loading={sections[section.key]?.loading ?? true}
            showDiscount={section.key === 'discounts'}
          />
          {section.key === 'discounts' && <PromoBannerSlider />}
        </div>
      ))}
    </div>
  );
}
