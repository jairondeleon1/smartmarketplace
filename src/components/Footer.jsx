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
    content: `Last Updated: March 1, 2026

**1. Acceptance of the Agreement**
By accessing or using the SmartMenuIQ web application (the "Service"), you enter into a legally binding contract with SmartMenuIQ (a division of Follow the Jays Inc.). If you do not agree to these Terms, you must immediately cease use of the Service. Your continued use constitutes "Active Consent."

**2. The Nature of the Service (Informational Only)**
SmartMenuIQ is a decision-support tool. We provide menu analysis, nutritional transparency, and AI-driven insights.

No Professional Advice: We are not a medical organization, a hospital, or a registered dietitian firm.

The "Final Check" Rule: You acknowledge that the Service is a secondary reference. The primary source of truth for food safety is the establishment preparing the food and its physical labeling.

**3. Eligibility & Minor Safety**
Age Limit: You must be at least 13 years of age.

Parental Consent: Users between 13 and 18 years old represent that they have the permission of a parent or guardian.

California Minor Protections: Pursuant to the California Age-Appropriate Design Code, we strive to provide a "privacy by default" experience for all users.

**4. Anonymous User Profiles**
To enhance your experience, you may create an Anonymous Profile.

No PII: You agree not to enter "Personally Identifiable Information" (like your full name, SSN, or home address) into free-text fields.

Self-Management: You are the sole custodian of your profile settings. You may exercise your "Right to be Forgotten" at any time by using the in-app "Delete Profile" feature, which permanently scrubs your preferences from our active session cache.

**5. AI-Generated Content & Limitations**
SmartMenuIQ utilizes Large Language Models (LLMs). By using these AI features, you agree to the following:

Probabilistic Outputs: AI generates responses based on patterns, not necessarily "facts." It may produce inaccurate information regarding ingredients or calorie counts.

The "Hallucination" Waiver: SmartMenuIQ is not liable for "AI Hallucinations" (instances where the AI provides confident but false information).

Third-Party Processing: Prompts are processed by third-party providers (e.g., OpenAI, Google). While we anonymize data, you agree to their underlying processing terms.

**6. Medical & Allergy Disclaimer (Crucial)**
Strict Liability Waiver: SmartMenuIQ disclaims all liability for allergic reactions, foodborne illnesses, or any adverse health event resulting from reliance on the Service.

Ingredient Changes: Restaurants frequently change suppliers or preparation methods without updating digital databases. SmartMenuIQ cannot track "real-time" kitchen substitutions.

**7. Intellectual Property & License**
Ownership: The "SmartMenuIQ" name, the "IQ" analysis logic, the source code, and all UI designs are the exclusive property of SmartMenuIQ and its parent company.

Limited License: We grant you a personal, non-exclusive, non-transferable license to use the app for personal, non-commercial use. You may not "scrape" our AI-generated data to build a competing database.

**8. Acceptable Use Policy**
You agree not to:

- Use the Service to "stress-test" or find vulnerabilities in our AI.
- Input "Prompts" designed to bypass safety filters (Jailbreaking).
- Use any automated bot or "spider" to access the Service without our written consent.

**9. Disclaimer of Warranties**
THE SERVICE IS PROVIDED "AS IS." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING THE WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR DIETARY PURPOSE. WE DO NOT GUARANTEE THE ACCURACY OF NUTRITIONAL DATA.

**10. Limitation of Liability**
To the maximum extent permitted by California law, SmartMenuIQ's total liability for any claim arising out of your use of the Service shall not exceed $100.00 USD or the amount you paid to use the Service in the last month, whichever is lower.

**11. Governing Law & Dispute Resolution**
Jurisdiction: These Terms are governed by the laws of the State of California.

Arbitration: You agree that any dispute that cannot be resolved through informal negotiation will be settled through binding arbitration in Orange County, Florida (or a mutually agreed-upon virtual forum), rather than in court.

**12. Contact Information**
SmartMenuIQ Legal Team
Email: jairon.deleon@compass-usa.com`
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
  healthdisclaimer: {
    title: 'Nutrition & Health Disclaimer',
    content: `Last Updated: February 2026

**1. Not Medical Advice (The "Safe Harbor" Clause)**
The insights, nutritional calculations, and AI-generated suggestions provided by SmartMenuIQ are for informational and educational purposes only.

No Doctor-Patient Relationship: Use of this app does not create a professional-client or medical-patient relationship.

Consult Professionals: This platform is not a substitute for the clinical judgment of a healthcare professional. Always seek the advice of a physician, registered dietitian, or certified nutritionist regarding any medical condition, weight management program, or specific dietary restriction.

Emergency Situations: Never disregard professional medical advice or delay seeking it because of something you read on SmartMenuIQ.

**2. Accuracy of Nutritional Data**
Nutritional values (calories, macros, vitamins) are mathematical estimates and should be treated as such.

Variability in Preparation: Actual nutritional content may vary significantly based on portion sizes, regional ingredient sourcing, "secret" recipes, and individual preparation methods used by kitchen staff.

Supplier Data: SmartMenuIQ relies on third-party data and restaurant-provided information. We cannot guarantee that this data is always current, complete, or error-free.

Cross-Contamination: Our AI cannot account for real-time kitchen conditions, such as shared fryers or cross-contact with allergens.

**3. Assumption of Risk**
By using SmartMenuIQ, you acknowledge that you are doing so at your own risk.

User Verification: You are responsible for verifying any critical nutritional information (specifically regarding life-threatening allergens) directly with the food provider or restaurant manager before consumption.

Limitation of Liability: SmartMenuIQ, its developers, and its affiliates are not liable for any adverse health effects, allergic reactions, or dissatisfaction resulting from the use of the information provided within the app.`
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
    { key: 'healthdisclaimer', label: 'Health Disclaimer' },
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