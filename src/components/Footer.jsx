import React, { useState } from 'react';
import { X } from 'lucide-react';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    content: `Last updated: February 2026

**Information We Collect**
We collect information you provide directly, including dietary restrictions, preferences, and health goals entered in your profile. We also collect standard platform data such as your name and email address for authentication purposes.

**How We Use Your Information**
Your information is used solely to personalize your menu experience, including filtering menu items based on your dietary needs and health goals. We do not sell your personal information to third parties.

**Health-Related Data**
Any health-related information (dietary restrictions, health goals) you provide is stored securely and used only to improve your in-app experience. This data is not shared with third parties and is not used for marketing purposes.

**Data Security**
All data is encrypted at rest and in transit using industry-standard security measures provided by the Base44 platform.

**California Residents (CCPA/CPRA)**
California residents have the right to: know what personal data is collected, request deletion of personal data, and opt out of the sale of personal data. We do not sell personal data. To exercise your rights, contact us at the information below.

**Data Retention**
Chat history is stored only for the duration of your session and is not persisted in our database. Profile and menu data is retained as long as your account is active.

**Contact**
For privacy-related inquiries, please contact your site administrator.`
  },
  terms: {
    title: 'Terms of Service',
    content: `Last updated: February 2026

**Acceptance of Terms**
By accessing and using SmartMenu IQ, you accept and agree to be bound by these Terms of Service.

**Use of Service**
SmartMenu IQ is provided for informational and meal-planning purposes only. You agree to use the service only for lawful purposes and in accordance with these Terms.

**Nutritional Information Disclaimer**
Nutritional information provided is based on data from the U.S. Department of Agriculture (USDA) FoodData Central database and supplier information. Values are estimates and may vary due to product substitutions, preparation methods, and portion sizes.

**Not Medical Advice**
The information provided by SmartMenu IQ, including nutritional data, AI assistant responses, and dietary suggestions, is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical guidance.

**AI Assistant**
The AI assistant provides general information based on available menu data. Responses are automated and may not always be accurate. Do not rely on AI responses for medical or allergy-critical decisions.

**Allergen Warning**
While we strive to provide accurate allergen information, we cannot guarantee the absence of any allergen due to shared preparation areas. Always speak with a manager if you have severe food allergies.

**Limitation of Liability**
SmartMenu IQ and its operators are not liable for any damages arising from use of this service, including but not limited to reliance on nutritional or allergen information.

**Changes to Terms**
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.`
  },
  allergens: {
    title: 'Allergen Policy',
    content: `Last updated: February 2026

**Cross-Contact Risk**
Our food service handles and prepares items containing the following major allergens: Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat/Gluten, Soybeans, and Sesame.

**Shared Preparation Areas**
All menu items are prepared in shared kitchen environments. Cross-contact with allergens is possible even for items that do not contain a specific allergen as an ingredient.

**Accuracy of Allergen Information**
Allergen information is provided based on standard recipes and supplier data. Unplanned substitutions or preparation changes may affect allergen content.

**High-Risk Individuals**
Guests with severe food allergies or anaphylaxis risk should exercise extreme caution and speak directly with a manager before consuming any item. We cannot guarantee a completely allergen-free environment.

**Special Dietary Requests**
For individualized assistance with food allergies or dietary restrictions, please speak with a food service manager.

**Regulatory Compliance**
Our allergen labeling follows guidelines set by the U.S. Food and Drug Administration (FDA) under the Food Allergen Labeling and Consumer Protection Act (FALCPA) and the FASTER Act of 2021.`
  },
  accessibility: {
    title: 'Accessibility',
    content: `Last updated: February 2026

**Our Commitment**
SmartMenu IQ is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

**Standards**
We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.

**Features**
- High contrast text and color choices
- Responsive design for all screen sizes
- Keyboard navigation support
- Screen reader compatible labels and structure

**Feedback**
If you experience any accessibility barriers while using SmartMenu IQ, please contact your site administrator so we can address the issue promptly.`
  }
};

function LegalModal({ doc, onClose }) {
  if (!doc) return null;
  const { title, content } = LEGAL_CONTENT[doc];

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-gray-800 mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.trim() === '') return <div key={i} className="h-1" />;
      return <p key={i} className="text-gray-600 text-sm leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-lg uppercase tracking-widest text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-1">
          {renderContent(content)}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [activeDoc, setActiveDoc] = useState(null);

  const links = [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms of Service' },
    { key: 'allergens', label: 'Allergen Policy' },
    { key: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <>
      <footer className="bg-slate-900 text-white mt-8 py-8 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveDoc(key)}
                className="text-slate-400 hover:text-teal-400 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-4 text-center space-y-1">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} SmartMenu IQ. All rights reserved.
            </p>
            <p className="text-slate-600 text-[10px] leading-relaxed max-w-xl mx-auto">
              Nutritional information is for informational purposes only and does not constitute medical advice. 
              Always consult a healthcare professional for dietary guidance.
            </p>
          </div>
        </div>
      </footer>

      <LegalModal doc={activeDoc} onClose={() => setActiveDoc(null)} />
    </>
  );
}