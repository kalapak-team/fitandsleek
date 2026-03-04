import React from "react";
import { useLanguage } from "../lib/i18n.jsx";

export default function FAQPage() {
  const { t } = useLanguage();
  const sections = [
    {
      title: t('faqPageOrdersShipping'),
      items: [
        {
          q: t('faqPageTrackOrderQ'),
          a: t('faqPageTrackOrderA'),
        },
        {
          q: t('faqPageShippingTimeQ'),
          a: t('faqPageShippingTimeA'),
        },
        {
          q: t('faqPageInternationalShippingQ'),
          a: t('faqPageInternationalShippingA'),
        },
      ],
    },
    {
      title: t('faqPageReturnsRefunds'),
      items: [
        {
          q: t('faqPageReturnPolicyQ'),
          a: t('faqPageReturnPolicyA'),
        },
        {
          q: t('faqPageReturnStartQ'),
          a: t('faqPageReturnStartA'),
        },
        {
          q: t('faqPageRefundTimeQ'),
          a: t('faqPageRefundTimeA'),
        },
      ],
    },
    {
      title: t('faqPagePayments'),
      items: [
        {
          q: t('faqPagePaymentMethodsQ'),
          a: t('faqPagePaymentMethodsA'),
        },
        {
          q: t('faqPagePaymentSecureQ'),
          a: t('faqPagePaymentSecureA'),
        },
      ],
    },
    {
      title: t('faqPageAccountSupport'),
      items: [
        {
          q: t('faqPageCreateAccountQ'),
          a: t('faqPageCreateAccountA'),
        },
        {
          q: t('faqPageForgotPasswordQ'),
          a: t('faqPageForgotPasswordA'),
        },
        {
          q: t('faqPageContactSupportQ'),
          a: t('faqPageContactSupportA'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {t('faqPageTitle')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{t('faqPageSubtitle')}</p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{section.title}</h2>
              </div>
              <div className="p-6 space-y-4">
                {section.items.map((item, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="font-medium text-slate-800 dark:text-white group-open:text-amber-600 transition-colors">
                        {item.q}
                      </span>
                      <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
