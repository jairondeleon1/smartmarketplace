import React, { useState } from 'react';
import { X } from 'lucide-react';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    content: `Last Updated: March 1, 2026

**1. Introduction**
Welcome to SmartMenuIQ ("SmartMenuIQ," "we," "our," or "us"). We provide digital menu intelligence and nutritional insights designed to empower your dining choices. Your privacy is not an afterthought; it is built into our architecture.

This Privacy Policy describes how we collect, use, and disclose your information when you use our web application (the "Service"). By accessing SmartMenuIQ, you agree to the collection and use of information in accordance with this policy.

**2. Information Collection & Use**
We operate on a principle of Data Minimization. We only collect the information strictly necessary to provide our nutritional analysis and menu services.

**A. Voluntarily Provided "Anonymous Profile" Data**
To provide personalized insights, you may choose to provide:

Dietary Preferences & Restrictions: (e.g., Vegan, Gluten-Free, Halal).
Allergen Information: (e.g., Nut-free, Shellfish-free).
Health & Wellness Goals: (e.g., Low-sodium, High-protein).
Interaction Data: Specific menu items you select or "like."

Privacy Note: This data is stored in a localized or pseudonymized profile. We do not require your legal name, home address, or government ID to provide these services.

**B. Technical, Usage, and Analytical Data**
When you visit SmartMenuIQ, our servers automatically record:

Device Identifiers: IP address (masked/hashed where possible), browser type, and operating system.
Usage Logs: Pages visited, time spent on the app, and crash reports.
Cookies & Tracking: We use strictly necessary cookies for session management. We do not use "Third-Party Targeting Cookies" for cross-site advertising.

**C. AI Interactions (Conversational Data)**
SmartMenuIQ utilizes Artificial Intelligence to answer nutritional queries.

Session-Based: Conversations are primarily stored in your local session.
Third-Party Processing: We may use providers like OpenAI or Google Gemini. While we strip direct identifiers before sending prompts, these providers process data according to their own safety policies. Do not share sensitive personal info (like medical records) in the chat.

**3. How We Process Your Data**
We use your information for the following "Business Purposes":

Personalization: Aligning menu options with your specific dietary needs.
Security: Detecting and preventing fraudulent activity or "Bot" attacks.
Improvement: Analyzing aggregated, non-identifiable trends to improve our AI's accuracy.
Communication: Responding to your support requests.

**4. Data Sharing & Disclosure**
No Sale of Data: We do not "sell" your personal information to third parties for money.
No Behavioral Advertising: We do not "share" your data with data brokers or ad networks.
Service Providers: We may share data with trusted vendors (e.g., cloud hosting) who are contractually bound to keep your data confidential.
Legal Necessity: We may disclose info if required by a court order or to protect the safety of our users.

**5. Data Retention & Deletion**
User Control: You may delete your profile and dietary preferences at any time via the "Delete Profile" button in the app settings.
Automatic Purge: Technical logs are automatically purged after 90 days unless required for an ongoing security investigation.
AI History: Session data is cleared once the browser session is closed or after a period of inactivity.

**6. Regional Rights (California CCPA/CPRA & GDPR)**
Under various modern privacy laws, you have specific rights:

Right to Know/Access: Request a report of what data we have collected about you.
Right to Delete: Request that we wipe your data from our systems.
Right to Correct: Update inaccurate information in your profile.
Opt-Out of Automated Decision Making: You can choose to browse the menu without AI-driven recommendations.
Global Privacy Control (GPC): Our app is configured to recognize GPC signals. If your browser sends an opt-out signal, we will automatically treat it as a request to limit data processing.

**7. Security Standards**
We employ industry-standard AES-256 encryption for data at rest and TLS/SSL encryption for data in transit. While we strive to protect your data, please remember that no method of transmission over the internet is 100% secure.

**8. Children's Privacy**
SmartMenuIQ is intended for a general audience. We do not knowingly collect personal data from children under 13 (or 16 in certain jurisdictions). If you become aware that a child has provided us with personal data, please contact us immediately.

**9. Changes to This Policy**
We may update this policy to reflect changes in law or our services. If we make significant changes, we will notify you via a prominent notice on our homepage or within the app interface.

**10. Contact Information**
For privacy-related inquiries or to exercise your data rights, please contact:

SmartMenuIQ Privacy Team
Email: jairon.deleon@compass-usa.com
Attn: Data Privacy Officer`
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
  },
  aitransparency: {
    title: 'AI Transparency & Data Handling',
    content: `Last Updated: February 2026

**A. How Our AI Works**
SmartMenuIQ utilizes large language models (LLMs) to interpret complex menu data and match it against your saved preferences. This process involves "Prompt Engineering," where your dietary profile is compared against menu databases to highlight potential matches or risks.

**B. The "Human-in-the-Loop" Requirement**
While our AI is highly capable, it is not a "certified nutritionist." SmartMenuIQ is a decision-support tool, not a medical diagnostic tool.

User Responsibility: The user maintains final responsibility for food consumption.

Allergy Warning: Because menu formulations at restaurants can change without notice, our AI may not always reflect the most current "real-world" kitchen practices.

**C. Technical Processing & Third Parties**
To provide high-quality responses, your anonymized queries may be transmitted to third-party AI infrastructure providers.

Anonymization: We strip direct identifiers from your profile before a prompt is sent to a third-party model.

No Training on Your Data: We contractually request (where possible) that our providers do not use SmartMenuIQ user prompts to train their future public models.

**D. Session Persistence**
To protect your privacy, SmartMenuIQ does not maintain a permanent, searchable database of your chat history on our cloud servers. Once you clear your cache or end your session, the conversational context is purged from our active memory.`
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
    { key: 'aitransparency', label: 'AI Transparency' },
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