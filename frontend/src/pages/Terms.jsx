import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useLanguage } from "../lib/i18n.jsx";

export default function TermsPage() {
  const { t } = useLanguage();
  const [termsContent, setTermsContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/legal-content");
        setTermsContent(String(data?.terms_content || ""));
      } catch {
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            {t('termsTitle')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{t('termsLastUpdated')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          {termsContent ? (
            <section>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{termsContent}</p>
            </section>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection1Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection1Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection2Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection2Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection3Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection3Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection4Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection4Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection5Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection5Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection6Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection6Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection7Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection7Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection8Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection8Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection9Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection9Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('termsSection10Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('termsSection10Body')}</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
