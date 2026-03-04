import React, { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../components/ui/Dialog";
import { useLanguage } from "../lib/i18n.jsx";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/legal-content");
        setPrivacyContent(String(data?.privacy_content || ""));
      } catch {
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/contact", { ...form, subject: `${t('privacySubjectPrefix')}${form.subject}` });
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (e) {
      setError(e.response?.data?.message || t('contactSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            {t('privacyPolicyTitle')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{t('privacyLastUpdated')}</p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8 mb-8">
          {privacyContent ? (
            <section>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{privacyContent}</p>
            </section>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection1Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection1Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection2Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{t('privacySection2Intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li><strong>{t('privacySection2Item1Label')}</strong> {t('privacySection2Item1Text')}</li>
                  <li><strong>{t('privacySection2Item2Label')}</strong> {t('privacySection2Item2Text')}</li>
                  <li><strong>{t('privacySection2Item3Label')}</strong> {t('privacySection2Item3Text')}</li>
                  <li><strong>{t('privacySection2Item4Label')}</strong> {t('privacySection2Item4Text')}</li>
                  <li><strong>{t('privacySection2Item5Label')}</strong> {t('privacySection2Item5Text')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection3Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{t('privacySection3Intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>{t('privacySection3Item1')}</li>
                  <li>{t('privacySection3Item2')}</li>
                  <li>{t('privacySection3Item3')}</li>
                  <li>{t('privacySection3Item4')}</li>
                  <li>{t('privacySection3Item5')}</li>
                  <li>{t('privacySection3Item6')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection4Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection4Intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                  <li><strong>{t('privacySection4Item1Label')}</strong> {t('privacySection4Item1Text')}</li>
                  <li><strong>{t('privacySection4Item2Label')}</strong> {t('privacySection4Item2Text')}</li>
                  <li><strong>{t('privacySection4Item3Label')}</strong> {t('privacySection4Item3Text')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection5Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection5Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection6Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{t('privacySection6Intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li><strong>{t('privacySection6Item1Label')}</strong> {t('privacySection6Item1Text')}</li>
                  <li><strong>{t('privacySection6Item2Label')}</strong> {t('privacySection6Item2Text')}</li>
                  <li><strong>{t('privacySection6Item3Label')}</strong> {t('privacySection6Item3Text')}</li>
                  <li><strong>{t('privacySection6Item4Label')}</strong> {t('privacySection6Item4Text')}</li>
                </ul>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">{t('privacySection6Contact')} <strong>kalapakgpt@gmail.com</strong></p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection7Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection7Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection8Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection8Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection9Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection9Body')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{t('privacySection10Title')}</h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t('privacySection10Body')}</p>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-slate-800 dark:text-white"><strong>FitandSleek</strong></p>
                  <p className="text-slate-600 dark:text-slate-300">{t('privacyEmailLabel')} kalapakgpt@gmail.com</p>
                  <p className="text-slate-600 dark:text-slate-300">{t('location')}</p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Privacy Inquiry CTA Button */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('privacyInquiry')}
            </h2>
            <p className="text-purple-100 text-sm">{t('privacyInquiryDesc')}</p>
          </div>
          
          <div className="p-6 text-center">
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {t('sendPrivacyInquiry')}
            </button>
          </div>
        </div>

        {/* Dialog Form */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogPopup className="max-w-md w-full p-0" from="top" showCloseButton={true}>
            <div className="px-6 pt-6 flex items-start justify-between mb-6">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-black">{t('privacyInquiry')}</DialogTitle>
                <DialogDescription className="mt-2">
                  {t('privacyInquiryDialogDesc')}
                </DialogDescription>
              </div>
            </div>

            <div className="px-6">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Message sent successfully!
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('yourName')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('namePlaceholder')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('subject')}</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder={t('privacySubjectPlaceholder')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('message')}</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t('privacyMessagePlaceholder')}
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all duration-300"
                  >
                    {loading ? t('sending') : t('sendInquiry')}
                  </button>
                  <DialogClose
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 border border-gray-300 bg-white text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    {t('cancel')}
                  </DialogClose>
                </div>
              </form>
            </div>
          </DialogPopup>
        </Dialog>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

