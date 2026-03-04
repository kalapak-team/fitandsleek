import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function HomepageSettingsTest() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('Fetching settings...');
        const response = await api.get('/homepage-settings');
        console.log('Response:', response.data);
        setSettings(response.data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Homepage Settings Test</h1>
      
      {settings ? (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-2">✅ Settings Loaded Successfully!</h2>
            <pre className="bg-white p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">Sections</h3>
              <ul>
                {Object.keys(settings.sections || {}).map(key => (
                  <li key={key} className="text-sm">
                    ✓ {settings.sections[key].title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-2">Header</h3>
              <p className="text-sm">Logo: {settings.header?.logo_text}</p>
              <p className="text-sm">Search: {settings.header?.search_enabled ? '✓' : '✗'}</p>
              <p className="text-sm">Cart: {settings.header?.cart_enabled ? '✓' : '✗'}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-2">Footer</h3>
              <p className="text-sm">Company: {settings.footer?.company_name}</p>
              <p className="text-sm">Sections: {Object.keys(settings.footer_sections || {}).length}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">No settings available</div>
      )}
    </div>
  );
}
