import { useState } from 'react';
import { setLanguage, getCurrentLanguage } from '../i18n';

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
  ];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600">
        <span className="w-5 h-5">🌐</span>
        <span>{currentLang.toUpperCase()}</span>
        <span className="w-4 h-4">▼</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-gray-700 rounded-md shadow-lg z-50">
          {languages.map(lang => (
            <a key={lang.code} href="#" onClick={(e) => { e.preventDefault(); handleLanguageChange(lang.code); }}
               className="block px-4 py-2 text-sm text-white hover:bg-gray-600">
              {lang.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}