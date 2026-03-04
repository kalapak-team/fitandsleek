import React from "react";
import { useLanguage } from "../lib/i18n.jsx";

export default function CookiesPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.12-3 2.5 0 1.381 1.343 2.5 3 2.5s3 1.12 3 2.5-1.343 2.5-3 2.5m0-10a3.5 3.5 0 013.5 3.5M12 4.5a7.5 7.5 0 010 15" />
              </svg>
            </span>
            {t('cookiesTitle')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{t('cookiesLastUpdated')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection1Title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('cookiesSection1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection2Title')}</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>{t('cookiesSection2Item1')}</li>
              <li>{t('cookiesSection2Item2')}</li>
              <li>{t('cookiesSection2Item3')}</li>
              <li>{t('cookiesSection2Item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection3Title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('cookiesSection3Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection4Title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('cookiesSection4Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection5Title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('cookiesSection5Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('cookiesSection6Title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('cookiesSection6Body')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
