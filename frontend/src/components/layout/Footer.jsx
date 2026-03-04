import React from "react";
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import Logo from "../Logo.jsx";
import { useLanguage } from "../../lib/i18n.jsx";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useHomepageSettings();
  const { t } = useLanguage();

  // Get footer settings with fallback defaults
  const footerSettings = settings?.footer || {
    company_name: "FIT&SLEEK Pro",
    company_description: t('footerDescription'),
    contact_title: t('contact'),
    contact_email: "kalapakgpt@gmail.com",
    contact_phone: "+855 00 00 000",
    contact_address: t('location'),
    copyright_text: t('footerCopyright').replace('{year}', String(currentYear)),
    social_title: t('followUs'),
    social_enabled: true,
    support_enabled: true,
    tracking_enabled: true,
    privacy_enabled: true,
    contact_enabled: true,
  };

  const footerSocials = settings?.footer_socials || [
    { platform: 'facebook', url: '#' },
    { platform: 'instagram', url: '#' },
    { platform: 'twitter', url: '#' },
  ];

  const socialIcon = (platform) => {
    const p = String(platform || '').toLowerCase();
    if (p === 'facebook') return <Facebook className="w-4 h-4" strokeWidth={2} />;
    if (p === 'instagram') return <Instagram className="w-4 h-4" strokeWidth={2} />;
    if (p === 'twitter') return <Twitter className="w-4 h-4" strokeWidth={2} />;
    if (p === 'youtube') return <Youtube className="w-4 h-4" strokeWidth={2} />;
    if (p === 'linkedin') return <Linkedin className="w-4 h-4" strokeWidth={2} />;
    if (p === 'whatsapp') return <MessageCircle className="w-4 h-4" strokeWidth={2} />;
    if (p === 'telegram') return <Send className="w-4 h-4" strokeWidth={2} />;
    return <Globe className="w-4 h-4" strokeWidth={2} />;
  };

  const footerSections = settings?.footer_sections || {
    support: {
      title: t('footerHelp'),
      items: [
        { label: t('footerHelpCenter'), link: "/support" },
        { label: t('footerFaq'), link: "/faq" },
        { label: t('contactUsTitle'), link: "/contact" },
      ],
    },
    tracking: {
      title: t('footerTracking'),
      items: [
        { label: t('trackOrder'), link: "/track-order" },
        { label: t('footerReturns'), link: "/returns" },
        { label: t('footerShippingInfo'), link: "/shipping" },
      ],
    },
    legal: {
      title: t('footerLegal'),
      items: [
        { label: t('footerPrivacyPolicy'), link: "/privacy" },
        { label: t('footerTermsConditions'), link: "/terms" },
        { label: t('footerCookiesPolicy'), link: "/cookies" },
      ],
    },
  };


  return (
    <footer className="hidden md:block border-t border-zinc-200" style={{ backgroundColor: footerSettings.background_color || '#6F8F72' }}>
      <div className="container-safe py-12 grid gap-8 md:grid-cols-4">
        {/* Brand Section */}
        <div className="space-y-4">
          <Link to="/" className="inline-block transition-transform duration-300 hover:scale-105">
            <Logo className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-white/80 leading-relaxed">
            {footerSettings.company_description}
          </p>
          {/* Social Links */}
          {footerSettings.social_enabled && (
            <div className="pt-2">
              <div className="text-xs font-black tracking-wide uppercase text-white/90 mb-2">
                {footerSettings.social_title || t('followUs')}
              </div>
              <div className="flex items-center gap-3">
                {footerSocials.map((social, idx) => (
                  <a
                    key={`${social.platform}-${idx}`}
                    href={social.url || '#'}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 hover:text-white transition-all duration-300 hover:scale-110"
                    aria-label={social.platform || 'social'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {socialIcon(social.platform)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support Section - Conditional */}
        {footerSettings.support_enabled && footerSections.support && (
          <div>
            <div className="text-xs font-black tracking-wide uppercase text-white mb-4">
              {footerSections.support.title || t('footerHelp')}
            </div>
            <div className="grid gap-2 text-sm">
              {footerSections.support.items && footerSections.support.items.map((item, idx) => (
                <Link
                  key={idx}
                  className="text-white/80 hover:text-white group flex items-center gap-1 w-fit transition-colors"
                  to={item.link}
                >
                  {item.label}
                  <svg
                    className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tracking Section - Conditional */}
        {footerSettings.tracking_enabled && footerSections.tracking && (
          <div>
            <div className="text-xs font-black tracking-wide uppercase text-white mb-4">
              {footerSections.tracking.title || t('footerTracking')}
            </div>
            <div className="grid gap-2 text-sm">
              {footerSections.tracking.items && footerSections.tracking.items.map((item, idx) => (
                <Link
                  key={idx}
                  className="text-white/80 hover:text-white group flex items-center gap-1 w-fit transition-colors"
                  to={item.link}
                >
                  {item.label}
                  <svg
                    className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section - Conditional */}
        {footerSettings.contact_enabled && (
          <div>
            <div className="text-xs font-black tracking-wide uppercase text-white mb-4">
              {footerSettings.contact_title || t('contact')}
            </div>
            <div className="grid gap-2 text-sm text-white/80">
              <a
                href={`mailto:${footerSettings.contact_email}`}
                className="group flex items-center gap-2 hover:text-white transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {footerSettings.contact_email}
              </a>
              <a
                href={`tel:${String(footerSettings.contact_phone || '').replace(/\s+/g, '')}`}
                className="group flex items-center gap-2 hover:text-white transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {footerSettings.contact_phone}
              </a>
              <span className="group flex items-center gap-2">
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {footerSettings.contact_address}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="container-safe py-4 flex flex-col md:flex-row items-center justify-between text-xs text-white/80 gap-4">
          <span>
            {footerSettings.copyright_text}
          </span>
          <div className="flex items-center gap-6">
            {footerSettings.privacy_enabled && (
              <>
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors duration-200"
                >
                  {t('terms')}
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors duration-200"
                >
                  {t('privacy')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
