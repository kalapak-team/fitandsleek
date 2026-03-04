import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth.jsx";
import { useCart } from "../../state/cart.jsx";
import { useWishlist } from "../../state/wishlist.jsx";
import { useLanguage } from "../../lib/i18n.jsx";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import api from "../../lib/api.js";
import { resolveImageUrl } from "../../lib/images.js";
import { Camera, X, Globe, Bell, Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
import Logo from "../Logo.jsx";
import LoginDialog from "../dialogs/LoginDialog.jsx";
import RegisterDialog from "../dialogs/RegisterDialog.jsx";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/AlertDialog.jsx";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function getInitials(label) {
  const text = String(label || "").trim();
  if (!text) return "";
  return text.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Badge({ value }) {
  if (!value) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-900 text-white text-[10px] leading-[18px] text-center animate-pulse">
      {value}
    </span>
  );
}

function Icon({ name }) {
  const cls = "w-5 h-5 transition-transform duration-300 group-hover:scale-110";
  if (name === "search") return <Search className={cls} strokeWidth={2} />;
  if (name === "user") return <User className={cls} strokeWidth={2} />;
  if (name === "heart") return <Heart className={cls} strokeWidth={2} />;
  if (name === "bag") return <ShoppingBag className={cls} strokeWidth={2} />;
  return null;
}

function ProfileMenu({ user, onLogout, t, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const avatarSrc = user?.profile_image_url || user?.profile_image_path ? resolveImageUrl(user.profile_image_url || user.profile_image_path) : null;
  const initials = getInitials(user?.name || user?.email || "");

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fs-iconbtn-header transition-transform duration-300 hover:scale-110"
        aria-label={t("account")}
      >
        <span className="w-9 h-9 rounded-full bg-zinc-900/10 text-zinc-900 flex items-center justify-center overflow-hidden">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{initials || "U"}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900/10 text-zinc-900 flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{initials || "U"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{user?.name || t("account")}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">{t("account")}</span>
            </Link>
            <Link
              to="/profile?tab=orders"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm">{t("orders")}</span>
            </Link>
          </div>
          <div className="py-2 border-t border-slate-100">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// Enhanced Dropdown Menu Component with sections support
function DropdownMenu({ items, children, hasSubtitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const safeItems = Array.isArray(items) ? items : [];

  // Check if items have sections (groups)
  const hasSections = safeItems.some(item => item?.type === 'section');

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children(isOpen)}
      <div
        className={`
          fixed left-0 right-0 top-[108px] pt-4
          bg-transparent
          overflow-visible transition-all duration-200 ease-out z-50
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
        `}
      >
        <div className="bg-white shadow-xl border-t border-zinc-100">
          {hasSections ? (
            // Full-width sections layout
            <div className="container-safe mx-auto py-6 px-8">
              <div className="grid grid-cols-4 gap-10">
              {safeItems.filter(item => item?.type === 'section').map((section, idx) => (
                <div key={idx} className={section.className || ''}>
                  {section.to ? (
                    <Link
                      to={section.to}
                      className="block group mb-3"
                    >
                      <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">
                        {section.label}
                      </h4>
                      {section.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                    </Link>
                  ) : (
                    <div className="block mb-3">
                      <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-1">
                        {section.label}
                      </h4>
                      {section.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    {section.items && section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={item.to}
                        className="fs-menu-item"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            // Simple list layout - horizontal row
            <div className="container-safe mx-auto py-6 px-8">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {safeItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  className={cn(
                    "px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg",
                    item.highlight 
                      ? "text-zinc-900 font-semibold bg-zinc-100 hover:bg-zinc-200" 
                      : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Animated Nav Link with full-width background bar
function AnimatedNavLink({ to, label, hasDropdown, onHover, isHovered }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "fs-nav-link",
          isActive ? "fs-nav-link-active" : ""
        )
      }
      onMouseEnter={onHover}
    >
      {({ isActive }) => (
        <>
          <span className="relative z-10">{label}</span>
          <span className={cn("fs-nav-underline", (isActive || isHovered) && "is-on")} />
        </>
      )}
    </NavLink>
  );
}

function NavBar({ navItems }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showMore, setShowMore] = useState(false);
  
  // Responsive menu: show fewer items on smaller desktops, more on larger screens
  const visibleItemsCount = navItems.length > 8 ? 5 : navItems.length > 6 ? 5 : Math.min(6, navItems.length);
  const visibleItems = navItems.slice(0, visibleItemsCount);
  const moreItems = navItems.slice(visibleItemsCount);
  const hasMore = moreItems.length > 0;

  return (
    <div
      className="relative"
      onMouseLeave={() => {
        setHoveredIndex(null);
        setShowMore(false);
      }}
    >
      <nav className="flex items-center justify-center gap-8 container-safe relative z-10 max-w-[1600px] mx-auto px-4 py-2">
        {visibleItems.map((item, index) => {
          const itemKey = item.to || item.label || `nav-${index}`;
          return item.items ? (
            <DropdownMenu key={itemKey} items={item.items}>
              {(isOpen) => (
                <AnimatedNavLink 
                  to={item.to} 
                  label={item.label} 
                  hasDropdown 
                  onHover={() => setHoveredIndex(index)}
                  isHovered={hoveredIndex === index || isOpen}
                />
              )}
            </DropdownMenu>
          ) : (
            <AnimatedNavLink 
              key={itemKey} 
              to={item.to} 
              label={item.label} 
              hasDropdown={false}
              onHover={() => setHoveredIndex(index)}
              isHovered={hoveredIndex === index}
            />
          );
        })}
        
        {/* More dropdown for overflow items */}
        {hasMore && (
          <div className="relative">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              onMouseEnter={() => setShowMore(true)}
              onMouseLeave={() => setShowMore(false)}
            >
              {t('more') || 'More'}
            </button>
            {showMore && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-zinc-200 overflow-hidden z-50">
                {moreItems.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.to}
                    className="block px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    onClick={() => setShowMore(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export default function Header({ onOpenCart, onOpenNotifications, notificationsUnread = 0 }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const { t, language, toggleLanguage } = useLanguage();
  const { settings } = useHomepageSettings();
  const [q, setQ] = useState("");
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const searchInputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [activeLeftSection, setActiveLeftSection] = useState(0);
  const [autoLeftMenu, setAutoLeftMenu] = useState({
    newProduct: [],
    trending: [],
    discounts: [],
    brandsCategories: [],
  });

  useEffect(() => {
    const openLogin = () => {
      if (user) return;
      setShowRegisterDialog(false);
      setShowLoginDialog(true);
    };
    const openRegister = () => {
      if (user) return;
      setShowLoginDialog(false);
      setShowRegisterDialog(true);
    };
    window.addEventListener("fs:open-login", openLogin);
    window.addEventListener("fs:open-register", openRegister);
    return () => {
      window.removeEventListener("fs:open-login", openLogin);
      window.removeEventListener("fs:open-register", openRegister);
    };
  }, [user]);


  // Get header settings with fallback defaults
  const headerSettings = settings?.header || {
    logo_text: "FIT&SLEEK",
    logo_url: "/logo.png",
    search_placeholder: "Search everything",
    search_enabled: false,
    cart_enabled: true,
    wishlist_enabled: true,
    language_enabled: true,
    free_delivery_icon: "🚚",
    free_delivery_text: "Free delivery on orders above $40",
    nav_visibility: {
      newIn: true,
      discounts: true,
      women: true,
      men: true,
      sale: true,
    },
    custom_nav: [],
    left_menu: [],
    nav_labels: {},
  };

  const headerLabels = headerSettings.nav_labels || {};
  const localizedNavLabels = (headerLabels && (headerLabels.en || headerLabels.km))
    ? (headerLabels[language] || headerLabels.en || {})
    : (language === "km" ? {} : headerLabels);
  const label = (key, fallback) => localizedNavLabels[key] || fallback;
  const searchPlaceholder = language === "km"
    ? t('searchProducts')
    : (headerSettings.search_placeholder || "Search everything");
  const navVisibility = headerSettings.nav_visibility || {};
  const isVisible = (key) => navVisibility[key] !== false;
  const customNavItems = Array.isArray(headerSettings.custom_nav) ? headerSettings.custom_nav : [];
  const defaultLeftMenu = [
    {
      title: t('menuVisibility'),
      items: [
        { label: t('newIn'), to: '/search?tab=new', image: '/placeholder.svg' },
        { label: t('discounts'), to: '/discounts', image: '/placeholder.svg' },
        { label: t('women'), to: '/search?parent_category=Women', image: '/placeholder.svg' },
        { label: t('men'), to: '/search?parent_category=Men', image: '/placeholder.svg' },
        { label: t('boys'), to: '/search?parent_category=Boys', image: '/placeholder.svg' },
        { label: t('girls'), to: '/search?parent_category=Girls', image: '/placeholder.svg' },
        { label: t('sale'), to: '/search?tab=sale', image: '/placeholder.svg' },
      ],
    },
    {
      title: t('newProduct'),
      items: [
        { label: t('newArrivals'), to: '/search?tab=new', image: '/placeholder.svg' },
        { label: t('trendingNow'), to: '/search?tab=trending', image: '/placeholder.svg' },
        { label: t('thisWeek'), to: '/search?tab=this-week', image: '/placeholder.svg' },
        { label: t('bestSellers'), to: '/search?q=Best%20Seller', image: '/placeholder.svg' },
        { label: t('editorPicks'), to: '/search?q=Editors%20Pick', image: '/placeholder.svg' },
        { label: t('limitedDrop'), to: '/search?q=Limited%20Drop', image: '/placeholder.svg' },
        { label: t('freshStyles'), to: '/search?q=Fresh%20Style', image: '/placeholder.svg' },
        { label: t('justAdded'), to: '/search?q=Just%20Added', image: '/placeholder.svg' },
      ],
    },
    {
      title: t('productTrending'),
      items: [
        { label: t('trendingNow'), to: '/search?tab=trending', image: '/placeholder.svg' },
        { label: t('topRated'), to: '/search?sort=rating', image: '/placeholder.svg' },
        { label: t('bestSellers'), to: '/search?sort=popular', image: '/placeholder.svg' },
        { label: t('mostViewed'), to: '/search?q=Most%20Viewed', image: '/placeholder.svg' },
        { label: t('popularNow'), to: '/search?q=Popular%20Now', image: '/placeholder.svg' },
        { label: t('streetStyle'), to: '/search?q=Street%20Style', image: '/placeholder.svg' },
        { label: t('viralPicks'), to: '/search?q=Viral', image: '/placeholder.svg' },
        { label: t('trendingThisWeek'), to: '/search?q=Trending%20This%20Week', image: '/placeholder.svg' },
      ],
    },
    {
      title: t('productDiscounts'),
      items: [
        { label: t('allDiscounts'), to: '/discounts', image: '/placeholder.svg' },
        { label: t('clothes'), to: '/discounts/clothes', image: '/placeholder.svg' },
        { label: t('shoes'), to: '/discounts/shoes', image: '/placeholder.svg' },
        { label: t('under20'), to: '/discounts?max_price=20', image: '/placeholder.svg' },
        { label: t('topDeals'), to: '/discounts?sort=discount', image: '/placeholder.svg' },
        { label: t('accessories'), to: '/discounts?q=Accessories', image: '/placeholder.svg' },
        { label: t('bags'), to: '/discounts?q=Bags', image: '/placeholder.svg' },
        { label: t('flashSale'), to: '/discounts?q=Flash', image: '/placeholder.svg' },
      ],
    },
    {
      title: t('brandsCategories'),
      items: [
        { label: t('brandLogos'), to: '/search', image: '/placeholder.svg' },
        { label: t('categoriesLabel'), to: '/search', image: '/placeholder.svg' },
        { label: 'Nike', to: '/search?q=Nike', image: '/placeholder.svg' },
        { label: 'Adidas', to: '/search?q=Adidas', image: '/placeholder.svg' },
        { label: 'Puma', to: '/search?q=Puma', image: '/placeholder.svg' },
        { label: 'Zara', to: '/search?q=Zara', image: '/placeholder.svg' },
        { label: t('clothes'), to: '/search?q=Clothes', image: '/placeholder.svg' },
        { label: t('accessories'), to: '/search?q=Accessories', image: '/placeholder.svg' },
      ],
    },
  ];
  const leftMenu = Array.isArray(headerSettings.left_menu) && headerSettings.left_menu.length > 0
    ? headerSettings.left_menu
    : defaultLeftMenu;

  useEffect(() => {
    let mounted = true;
    const loadAutoMenu = async () => {
      try {
        const [productsRes, discountsRes, brandsRes, categoriesRes] = await Promise.all([
          api.get("/products"),
          api.get("/products/discounts"),
          api.get("/brands"),
          api.get("/categories"),
        ]);

        const products = productsRes?.data?.data || [];
        const discounts = discountsRes?.data?.data || [];
        const brands = brandsRes?.data?.data || [];
        const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

        const newProductItems = products.slice(0, 6).map((p) => ({
          label: p.name,
          to: p.slug ? `/p/${p.slug}` : "/search",
          image: resolveImageUrl(p.image_url),
        }));

        const trendingItems = products.slice(6, 12).map((p) => ({
          label: p.name,
          to: p.slug ? `/p/${p.slug}` : "/search",
          image: resolveImageUrl(p.image_url),
        }));

        const discountItems = discounts.slice(0, 6).map((p) => ({
          label: p.name,
          to: p.slug ? `/p/${p.slug}` : "/search",
          image: resolveImageUrl(p.image_url),
        }));

        const brandItems = brands.slice(0, 6).map((b) => ({
          label: b.name,
          to: `/search?q=${encodeURIComponent(b.name)}`,
          image: resolveImageUrl(b.logo_url),
        }));

        const categoryItems = categories.slice(0, 6).map((c) => ({
          label: c.name,
          to: c.id ? `/search?category_id=${c.id}` : "/search",
          image: resolveImageUrl(c.image_url),
        }));

        if (mounted) {
          setAutoLeftMenu({
            newProduct: newProductItems,
            trending: trendingItems.length ? trendingItems : newProductItems,
            discounts: discountItems,
            brandsCategories: [...brandItems, ...categoryItems].slice(0, 8),
          });
        }
      } catch {
        if (mounted) {
          setAutoLeftMenu({
            newProduct: [],
            trending: [],
            discounts: [],
            brandsCategories: [],
          });
        }
      }
    };

    loadAutoMenu();
    return () => {
      mounted = false;
    };
  }, []);

  const mergeUniqueItems = (baseItems = [], extraItems = []) => {
    const seen = new Set();
    const toKey = (item) => `${item.label || ""}::${item.to || ""}`;
    const merged = [];
    [...baseItems, ...extraItems].forEach((item) => {
      const key = toKey(item || {});
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    return merged;
  };

  const leftMenuWithAuto = useMemo(() => {
    const normalized = (leftMenu || []).map((section) => {
      const title = String(section?.title || "").toLowerCase();
      if (title === "new product") {
        return { ...section, items: autoLeftMenu.newProduct };
      }
      if (title === "product trending") {
        return { ...section, items: autoLeftMenu.trending };
      }
      if (title === "product discounts") {
        return { ...section, items: autoLeftMenu.discounts };
      }
      if (title === "brands & categories") {
        return { ...section, items: autoLeftMenu.brandsCategories };
      }
      return section;
    });

    const findByTitle = (title) =>
      normalized.find((s) => String(s?.title || "").toLowerCase() === title);

    const ensureSection = (title, fallbackItems, autoItems) => {
      const existing = findByTitle(title);
      if (existing) {
        return {
          ...existing,
          items: autoItems || fallbackItems,
        };
      }
      return {
        title: title.replace(/\b\w/g, (c) => c.toUpperCase()),
        items: autoItems || fallbackItems,
      };
    };

    const defaultByTitle = (title) =>
      (defaultLeftMenu || []).find((s) => String(s?.title || "").toLowerCase() === title)?.items || [];

    const ensured = [
      ensureSection("new product", defaultByTitle("new product"), autoLeftMenu.newProduct),
      ensureSection("product trending", defaultByTitle("product trending"), autoLeftMenu.trending),
      ensureSection("product discounts", defaultByTitle("product discounts"), autoLeftMenu.discounts),
      ensureSection("brands & categories", defaultByTitle("brands & categories"), autoLeftMenu.brandsCategories),
    ];

    const ensuredTitles = new Set(ensured.map((s) => String(s?.title || "").toLowerCase()));
    const remaining = normalized.filter(
      (s) => !ensuredTitles.has(String(s?.title || "").toLowerCase())
    );

    return [...remaining, ...ensured];
  }, [leftMenu, autoLeftMenu]);

  const getLeftMenuTitle = (title) => {
    const key = String(title || '').toLowerCase();
    const map = {
      'menu visibility': 'menuVisibility',
      'new product': 'newProduct',
      'product trending': 'productTrending',
      'product discounts': 'productDiscounts',
      'brands & categories': 'brandsCategories',
    };
    const tKey = map[key];
    return tKey ? t(tKey) : title;
  };

  const navItems = useMemo(
    () => [
      {
        key: 'newIn',
        label: 'NEW IN',
        to: "/search?q=New%20Arrivals",
        items: [
          { label: 'New Arrivals', to: "/search?q=New%20Arrivals" },
          { label: 'Trending Now', to: "/search?q=Trending%20Now" },
          { label: 'This Week', to: "/search?q=This%20Week" },
        ],
      },
      {
        key: 'discounts',
        label: '🎉 Discounts',
        to: "/discounts",
        items: [
          { label: 'All Discounts', to: '/discounts' },
          { label: 'Clothes', to: '/discounts/clothes' },
          { label: 'Shoes', to: '/discounts/shoes' },
          { label: 'Bags', to: '/discounts/bags' },
          { label: 'Belts', to: '/discounts/belts' },
          { label: 'Accessories', to: '/discounts/accessories' },
        ],
      },
      {
        key: 'women',
        label: 'WOMEN',
        to: "/search?parent_category=Women",
        items: [
          {
            type: 'section',
            label: 'Tops/Bottoms/...',
            items: [
              { label: 'Tops', to: '/search?parent_category=Women&q=Tops' },
              { label: 'Bottoms', to: '/search?parent_category=Women&q=Bottoms' },
              { label: 'Dresses', to: '/search?parent_category=Women&q=Dresses' },
              { label: 'Outerwear', to: '/search?parent_category=Women&q=Outerwear' },
              { label: 'Activewear', to: '/search?parent_category=Women&q=Activewear' },
            ],
          },
          {
            type: 'section',
            label: 'Sneakers/Heels/...',
            items: [
              { label: 'Sneakers', to: '/search?parent_category=Women&q=Sneakers' },
              { label: 'Slides', to: '/search?parent_category=Women&q=Slides' },
              { label: 'Heels', to: '/search?parent_category=Women&q=Heels' },
              { label: 'Boots', to: '/search?parent_category=Women&q=Boots' },
            ],
          },
          {
            type: 'section',
            label: 'Bags/Hats/...',
            items: [
              { label: 'Bags', to: '/search?parent_category=Women&q=Bags' },
              { label: 'Belts', to: '/search?parent_category=Women&q=Belts' },
              { label: 'Hats', to: '/search?parent_category=Women&q=Hats' },
              { label: 'Jewelry', to: '/search?parent_category=Women&q=Jewelry' },
            ],
          },
          {
            type: 'section',
            label: 'Girls',
            description: 'Fresh drops for everyday fits',
            items: [
              { label: 'View All', to: '/search?parent_category=Girls' },
              { label: 'New Arrivals', to: '/search?parent_category=Girls&q=New%20Arrivals' },
              { label: 'Trending Now', to: '/search?parent_category=Girls&q=Trending%20Now' },
              { label: 'This Week', to: '/search?parent_category=Girls&q=This%20Week' },
            ],
          },
        ],
      },
      {
        key: 'men',
        label: 'MEN',
        to: "/search?parent_category=Men",
        items: [
          {
            type: 'section',
            label: 'T-Shirts/Hoodies/...',
            items: [
              { label: 'T-Shirts', to: '/search?parent_category=Men&q=T-Shirts' },
              { label: 'Shirts', to: '/search?parent_category=Men&q=Shirts' },
              { label: 'Hoodies', to: '/search?parent_category=Men&q=Hoodies' },
              { label: 'Jeans', to: '/search?parent_category=Men&q=Jeans' },
              { label: 'Shorts', to: '/search?parent_category=Men&q=Shorts' },
            ],
          },
          {
            type: 'section',
            label: 'Sneakers/Running/...',
            items: [
              { label: 'Sneakers', to: '/search?parent_category=Men&q=Sneakers' },
              { label: 'Running', to: '/search?parent_category=Men&q=Running' },
              { label: 'Slides', to: '/search?parent_category=Men&q=Slides' },
              { label: 'Boots', to: '/search?parent_category=Men&q=Boots' },
            ],
          },
          {
            type: 'section',
            label: 'Bags/Watches/...',
            items: [
              { label: 'Bags', to: '/search?parent_category=Men&q=Bags' },
              { label: 'Belts', to: '/search?parent_category=Men&q=Belts' },
              { label: 'Caps & Hats', to: '/search?parent_category=Men&q=Caps%20Hats' },
              { label: 'Watches', to: '/search?parent_category=Men&q=Watches' },
            ],
          },
          {
            type: 'section',
            label: 'Boys',
            description: 'Grab deals before they\'re gone',
            items: [
              { label: 'View All', to: '/search?parent_category=Boys' },
              { label: 'New Arrivals', to: '/search?parent_category=Boys&q=New%20Arrivals' },
              { label: 'Trending Now', to: '/search?parent_category=Boys&q=Trending%20Now' },
              { label: 'This Week', to: '/search?parent_category=Boys&q=This%20Week' },
            ],
          },
        ],
      },
      { 
        key: 'sale',
        label: label('sale', t('sale')), 
        to: "/search?tab=sale",
        items: [
          { label: label('allSaleItems', t('allSaleItems')), to: "/search?tab=sale" },
          { label: label('womensSale', t('womensSale')), to: "/search?tab=sale&gender=women" },
          { label: label('mensSale', t('mensSale')), to: "/search?tab=sale&gender=men" },
        ],
      },
    ]
      .filter((item) => (item.key ? isVisible(item.key) : true))
      .concat(
        customNavItems
          .filter((item) => item && item.label && item.to)
          .map((item) => ({ label: item.label, to: item.to, items: item.items || [] }))
      ),
    [t, headerSettings.nav_labels, headerSettings.nav_visibility, headerSettings.custom_nav]
  );

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const { data } = await api.get("/products", {
        params: { q: searchTerm, per_page: 8 }
      });
      const products = data?.data || data || [];
      setSuggestions(products.slice(0, 8));
      setShowSuggestions(products.length > 0);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced search input handler
  const handleSearchInput = (value) => {
    setQ(value);
    setSelectedIndex(-1);
    
    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Debounce API call
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        setShowSearchDialog(false);
        setSuggestions([]);
        setShowSuggestions(false);
        nav(`/p/${selected.slug}`);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Select suggestion by click
  const selectSuggestion = (product) => {
    setShowSearchDialog(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setQ("");
    nav(`/p/${product.slug}`);
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="font-extrabold text-zinc-900 bg-yellow-100/50 px-0.5 rounded">{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    setSuggestions([]);
    setShowSuggestions(false);
    nav(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  useEffect(() => {
    if (!showSearchDialog) return;
    const tId = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(tId);
  }, [showSearchDialog]);

  return (
    <div className="sticky top-0 z-30 backdrop-blur-md shadow-sm" style={{ backgroundColor: headerSettings.background_color || '#6F8F72' }}>
      {/* Mobile: logo + search only */}
      <div className="lg:hidden container-safe h-14 md:h-16 flex items-center gap-2 sm:gap-3">
        <Link to="/" className="shrink-0 max-w-[80px] sm:max-w-none">
          <Logo className="h-12 sm:h-14 md:h-16 w-auto" src={headerSettings.logo_url || "/logo.png"} />
        </Link>

        {headerSettings.search_enabled && (
          <button
            type="button"
            onClick={() => setShowSearchDialog(true)}
            className="flex-1 min-w-0"
          >
            <div className="relative">
              <div className="w-full h-9 sm:h-10 rounded-full border border-white/60 bg-white/95 pl-9 sm:pl-10 pr-9 sm:pr-10 text-xs text-zinc-800 shadow-sm flex items-center">
                <span className="truncate text-zinc-500">{searchPlaceholder}</span>
              </div>
              <span className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
                <Icon name="search" />
              </span>
              <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Desktop: full header */}
      <div
        className="hidden lg:flex container-safe h-16 items-center justify-center gap-2 lg:gap-3 xl:gap-4 relative max-w-[1600px] mx-auto"
        onMouseLeave={() => setShowLeftMenu(false)}
      >
        {headerSettings.search_enabled && (
          <div className="absolute left-0 items-center gap-1 lg:gap-1.5 xl:gap-2 flex">
            <button
              type="button"
              className="fs-btn fs-btn-outline fs-btn-sm text-white border-white/40 bg-white/10 hover:bg-white/20 hidden xl:flex"
              onMouseEnter={() => setShowLeftMenu(true)}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden 2xl:inline">{t('menu')}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSearchDialog(true)}
              className="transition-all duration-300 w-40 md:w-44 lg:w-48 xl:w-56 2xl:w-64 max-w-[300px]"
            >
              <div className="relative group">
                <div className="w-full h-9 rounded-full border border-white/30 bg-white/20 pl-10 pr-10 text-xs text-white placeholder-white/60 outline-none focus:bg-white focus:border-white focus:text-zinc-900 focus:placeholder-zinc-400 transition-all duration-300 flex items-center">
                  <span className="truncate">{searchPlaceholder}</span>
                </div>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 transition-colors duration-300">
                  <Icon name="search" />
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>
        )}

        <Link to="/" className="transition-transform duration-300 hover:scale-105 flex-shrink-0">
          <Logo className="h-16 lg:h-20 xl:h-24 w-auto" src={headerSettings.logo_url || "/logo.png"} />
        </Link>

        <div className="absolute right-0 items-center gap-0.5 lg:gap-1 xl:gap-1.5 flex">
          {headerSettings.language_enabled && (
            <div className="relative group hidden lg:flex xl:flex">
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1 h-9 px-2.5 lg:px-3 rounded-full border border-white/30 bg-white/10 text-white text-xs font-semibold transition-all duration-200 hover:bg-white/20"
                title={t('language')}
                aria-label={t('language')}
              >
                <span className="text-base" aria-hidden="true">
                  {language === "km" ? "🇰🇭" : "🇺🇸"}
                </span>
                <span className="uppercase tracking-wide text-[10px] lg:text-xs hidden xl:inline\">{language === "km" ? "KM" : "EN"}</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                {language === "km" ? t('english') : t('khmer')}
              </div>
            </div>
          )}

          <button
            onClick={onOpenNotifications}
            className="fs-iconbtn-header transition-transform duration-300 hover:scale-110"
            aria-label={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            <Badge value={notificationsUnread} />
          </button>

          {headerSettings.wishlist_enabled && (
            <Link
              className="fs-iconbtn-header transition-transform duration-300 hover:scale-110"
              to="/search?tab=wishlist"
              aria-label={t('wishlist')}
            >
              <Icon name="heart" />
              <Badge value={wishlist.count} />
            </Link>
          )}

          {headerSettings.cart_enabled && (
            <button
              className="fs-iconbtn-header transition-transform duration-300 hover:scale-110"
              onClick={onOpenCart}
              aria-label={t('cart')}
            >
              <Icon name="bag" />
              <Badge value={count} />
            </button>
          )}

          <ProfileMenu user={user} onLogout={logout} t={t} />

          {user ? null : (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setShowLoginDialog(true)}
                className="fs-btn fs-btn-secondary fs-btn-sm"
              >
                {t('login')}
              </button>
              <button
                onClick={() => setShowRegisterDialog(true)}
                className="fs-btn fs-btn-primary fs-btn-sm"
              >
                {t('register')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation Row */}
      <div className="hidden lg:block border-b border-white/20 relative" style={{ backgroundColor: headerSettings.background_color || '#6F8F72' }}>
        <NavBar navItems={navItems} />
      </div>

      {/* Desktop Left Mega Menu Panel */}
      {showLeftMenu && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-16 bg-white shadow-xl border-t border-zinc-200/60 z-40 transition-all duration-200 ease-out"
          onMouseEnter={() => setShowLeftMenu(true)}
          onMouseLeave={() => setShowLeftMenu(false)}
        >
          <div className="container-safe py-6 max-w-[1600px] mx-auto">
            {leftMenuWithAuto.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                <div className="max-h-[440px] overflow-y-auto pr-3 scrollbar-hide border-r border-zinc-100 space-y-1">
                  {leftMenuWithAuto.map((section, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setActiveLeftSection(idx)}
                      className={cn(
                        "relative w-full text-left px-4 py-3 text-base font-semibold rounded-lg transition-all duration-200 ease-out hover:translate-x-0.5",
                        activeLeftSection === idx
                          ? "bg-zinc-50 text-zinc-900 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900"
                      )}
                    >
                      {activeLeftSection === idx && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-zinc-900 rounded-r" />
                      )}
                      <span className="block whitespace-normal leading-tight">
                        {getLeftMenuTitle(section.title)}
                      </span>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-base font-black tracking-wide uppercase text-zinc-500 mb-4">
                    {getLeftMenuTitle(leftMenuWithAuto[activeLeftSection]?.title)}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(leftMenuWithAuto[activeLeftSection]?.items || []).map((item, i) => (
                      <Link
                        key={i}
                        to={item.to}
                        className="group flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-transparent hover:border-zinc-200 hover:bg-zinc-50/70 hover:shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5"
                      >
                        <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-zinc-100 text-zinc-900 text-xs font-bold transition-transform duration-200 group-hover:scale-105 overflow-hidden">
                          {getInitials(item.label)}
                          {item.image ? (
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.label}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                        </span>
                        <span className="text-base font-semibold text-zinc-700 group-hover:text-zinc-900">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Image Search Modal */}
      <AlertDialog open={showSearchDialog} onOpenChange={(open) => {
        setShowSearchDialog(open);
        if (!open) {
          setSuggestions([]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
          setQ("");
        }
      }}>
        <AlertDialogContent className="top-[12%] translate-y-0 max-w-xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('searchProducts')}</AlertDialogTitle>
            <AlertDialogDescription>
              Type a keyword to search products.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form
            onSubmit={(e) => {
              submitSearch(e);
              setShowSearchDialog(false);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                value={q}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-zinc-900"
                autoFocus
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" />
              </span>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-h-[320px] overflow-hidden z-50 backdrop-blur-sm">
                  {loadingSuggestions && (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center animate-pulse">
                      Loading...
                    </div>
                  )}
                  
                  <div className="overflow-y-auto max-h-[320px] py-2">
                    {!loadingSuggestions && suggestions.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectSuggestion(product)}
                        className={`w-full px-5 py-3 text-left hover:bg-gradient-to-r hover:from-zinc-50 hover:to-slate-50 transition-all duration-200 group ${
                          selectedIndex === index ? 'bg-gradient-to-r from-zinc-100 to-slate-100' : ''
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="text-[15px] text-slate-800 font-medium group-hover:text-zinc-900 transition-colors leading-snug">
                          {highlightMatch(product.name, q)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* View All Results */}
                  <button
                    type="submit"
                    className="w-full px-5 py-3.5 text-sm font-semibold text-zinc-900 bg-gradient-to-r from-slate-50 to-zinc-50 hover:from-slate-100 hover:to-zinc-100 transition-all duration-200 border-t border-slate-200/80 flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>View all results for "{q}"</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowSearchDialog(false);
                  nav('/image-search');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Camera className="w-4 h-4" />
                Search by image
              </button>
              <div className="flex items-center gap-2">
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 text-white px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onSwitchToRegister={() => {
          setShowLoginDialog(false);
          setShowRegisterDialog(true);
        }}
      />

      {/* Register Dialog */}
      <RegisterDialog
        isOpen={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onSwitchToLogin={() => {
          setShowRegisterDialog(false);
          setShowLoginDialog(true);
        }}
      />

    </div>
  );
}

