/* DreamCarz Network — Privacy Policy Page */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Introduction",
    content: `DreamCarz Network ("Company," "we," "us," or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at dreamcarz.com and use our membership services.

Please read this policy carefully. If you disagree with its terms, please discontinue use of our site and services. If you have questions or concerns, contact us at info@dreamcarz.com or call (301) 772-2500.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect information you provide directly to us, including:

• **Personal Identifiers:** Full name, email address, phone number, mailing address, and date of birth.
• **Account Information:** Username, password, membership tier, and membership start date.
• **Financial Information:** Payment card details (processed securely through our payment processor; we do not store full card numbers), billing address, and transaction history.
• **Vehicle & Program Data:** Vehicle preferences, DCP (Dream Carz Points) balance, program participation history, and booking records.
• **Communications:** Messages you send us via our contact form, email, or phone.

We also automatically collect certain information when you visit our website, including IP address, browser type, operating system, referring URLs, pages viewed, and time spent on pages.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information we collect to:

• Create and manage your membership account
• Process transactions and send related information, including purchase confirmations and invoices
• Administer your DCP balance and program benefits
• Send administrative information, such as changes to our terms, conditions, and policies
• Respond to your comments, questions, and requests
• Send promotional communications (you may opt out at any time)
• Monitor and analyze usage and trends to improve your experience
• Detect, investigate, and prevent fraudulent transactions and other illegal activities
• Comply with legal obligations`,
  },
  {
    title: "4. Sharing Your Information",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:

• **Service Providers:** Third-party vendors who perform services on our behalf (payment processing, email delivery, analytics, hosting). These parties are contractually obligated to keep your information confidential.
• **Business Partners:** Vehicle hosts and fleet operators who need your information to fulfill your booking.
• **Legal Requirements:** When required by law, subpoena, or other legal process, or when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, or investigate fraud.
• **Business Transfers:** In connection with a merger, acquisition, or sale of all or a portion of our assets.`,
  },
  {
    title: "5. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. If you request deletion of your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law.`,
  },
  {
    title: "6. Security",
    content: `We implement industry-standard security measures to protect your personal information, including SSL/TLS encryption for data in transit, encrypted storage for sensitive data, and access controls limiting who can view your information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.`,
  },
  {
    title: "7. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal information:

• **Access:** Request a copy of the personal data we hold about you.
• **Correction:** Request correction of inaccurate or incomplete data.
• **Deletion:** Request deletion of your personal data, subject to certain exceptions.
• **Portability:** Request a machine-readable copy of your data.
• **Opt-Out:** Opt out of marketing communications at any time by clicking "unsubscribe" in any email or contacting us directly.

To exercise any of these rights, contact us at info@dreamcarz.com or (301) 772-2500.`,
  },
  {
    title: "8. Cookies",
    content: `We use cookies and similar tracking technologies to track activity on our website and hold certain information. Please refer to our Cookie Policy for detailed information about the cookies we use and how to manage them.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have questions or comments about this Privacy Policy, please contact us at:

DreamCarz Network
10001 Derekwood Ln, Suite 204
Lanham, MD 20706
Phone: (301) 772-2500
Email: info@dreamcarz.com`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          {/* Header */}
          <div className="mb-12">
            <div className="section-label mb-3">Legal</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>
              Last Updated: August 7, 2026
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                This Privacy Policy describes how DreamCarz Network collects, uses, and shares information about you when you use our website and membership services. By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i} className="border-b border-gray-100 pb-10 last:border-0">
                <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
                  {section.title}
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed space-y-3" style={{ fontFamily: "var(--font-sans)" }}>
                  {section.content.split("\n\n").map((para, j) => (
                    <p key={j} className="whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 p-6 bg-black rounded-2xl text-white text-center">
            <h3 className="font-display text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Questions About This Policy?</h3>
            <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>Our team is happy to help clarify anything.</p>
            <a href="mailto:info@dreamcarz.com" className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              Contact Us
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
