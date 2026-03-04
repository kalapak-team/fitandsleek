import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

export default function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    bakong: {
      receive_account: "",
      merchant_name: "",
      merchant_city: "",
    },
    card: {
      provider: "demo",
      stripe_key: "",
      stripe_secret: "",
      square_app_id: "",
      square_access_token: "",
    },
    enabled_methods: {
      bakong_khqr: true,
      card_visa: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/admin/superadmin/payment-settings");
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load payment settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleMethodToggle = (method) => {
    setSettings((prev) => ({
      ...prev,
      enabled_methods: {
        ...prev.enabled_methods,
        [method]: !prev.enabled_methods[method],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/superadmin/payment-settings", settings);
      toast.success("Payment settings updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminContentSkeleton lines={3} imageHeight={200} className="mt-4" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
              Payment Gateway Settings
            </h3>

            {/* Payment Methods Toggle */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Enabled Payment Methods
              </h4>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enabled_methods.bakong_khqr}
                    onChange={() => handleMethodToggle("bakong_khqr")}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    Bakong KHQR (Cambodia)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enabled_methods.card_visa}
                    onChange={() => handleMethodToggle("card_visa")}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    Credit/Debit Card (Visa/Mastercard)
                  </span>
                </label>
              </div>
            </div>

            {/* Bakong Settings */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Bakong KHQR Configuration (Cambodia)
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Receive Account (Bakong ID) *
                  </label>
                  <input
                    type="text"
                    value={settings.bakong.receive_account}
                    onChange={(e) =>
                      handleInputChange("bakong", "receive_account", e.target.value)
                    }
                    placeholder="e.g., yourshop@bkrt"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This is the Bakong username/account that actually receives customer payments.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Merchant/Store Name
                    </label>
                    <input
                      type="text"
                      value={settings.bakong.merchant_name}
                      onChange={(e) =>
                        handleInputChange("bakong", "merchant_name", e.target.value)
                      }
                      placeholder="Fitandsleek Clothes Store"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Displayed in the KHQR for customer confirmation.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Merchant City
                    </label>
                    <input
                      type="text"
                      value={settings.bakong.merchant_city}
                      onChange={(e) =>
                        handleInputChange("bakong", "merchant_city", e.target.value)
                      }
                      placeholder="Phnom Penh"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Used in the KHQR payload alongside your store name.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Settings */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Card Payment Configuration
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Provider
                  </label>
                  <select
                    value={settings.card.provider}
                    onChange={(e) =>
                      handleInputChange("card", "provider", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="demo">Demo (Testing Only)</option>
                    <option value="stripe">Stripe</option>
                    <option value="square">Square</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select your preferred card payment processor
                  </p>
                </div>

                {settings.card.provider === "stripe" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stripe Publishable Key
                      </label>
                      <input
                        type="password"
                        value={settings.card.stripe_key}
                        onChange={(e) =>
                          handleInputChange("card", "stripe_key", e.target.value)
                        }
                        placeholder="pk_live_..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stripe Secret Key
                      </label>
                      <input
                        type="password"
                        value={settings.card.stripe_secret}
                        onChange={(e) =>
                          handleInputChange("card", "stripe_secret", e.target.value)
                        }
                        placeholder="sk_live_..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {settings.card.provider === "square" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Square Application ID
                      </label>
                      <input
                        type="password"
                        value={settings.card.square_app_id}
                        onChange={(e) =>
                          handleInputChange("card", "square_app_id", e.target.value)
                        }
                        placeholder="Your Square App ID"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Square Access Token
                      </label>
                      <input
                        type="password"
                        value={settings.card.square_access_token}
                        onChange={(e) =>
                          handleInputChange("card", "square_access_token", e.target.value)
                        }
                        placeholder="Your Square Access Token"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={fetchSettings}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Payment Configuration Guide
          </h5>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Bakong Receive Account:</strong> Use your @bkrt Bakong ID that receives customer payments.</li>
            <li>• <strong>Merchant Details:</strong> Store name + city appear in the KHQR so match your business certificate.</li>
            <li>• <strong>Card Provider:</strong> Use "Demo" for testing, "Stripe" or "Square" for production.</li>
            <li>• <strong>Enable/Disable:</strong> Toggle payment methods to control which options customers see.</li>
            <li>• <strong>Security:</strong> All credentials are encrypted and only accessible to superadmin.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
