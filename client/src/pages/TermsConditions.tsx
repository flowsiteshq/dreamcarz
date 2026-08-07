/* DreamCarz Network — Terms & Conditions Page */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using the DreamCarz Network website, mobile application, or membership services (collectively, the "Services"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Services.

These Terms constitute a legally binding agreement between you and DreamCarz Network, LLC ("Company," "we," "us," or "our"), located at 10001 Derekwood Ln, Suite 204, Lanham, MD 20706.`,
  },
  {
    title: "2. Membership & Eligibility",
    content: `To become a member of DreamCarz Network, you must:

• Be at least 18 years of age
• Hold a valid driver's license
• Provide accurate, complete, and current information during registration
• Maintain the accuracy of such information
• Accept responsibility for all activities that occur under your account

Membership is personal and non-transferable. You may not share your account credentials with any other person. We reserve the right to refuse membership or terminate accounts at our sole discretion.`,
  },
  {
    title: "3. Membership Tiers & Fees",
    content: `DreamCarz Network offers multiple membership tiers (Freedom, Plus, Pro, and Elite), each with distinct monthly fees, program fees, and benefits. By enrolling in a membership tier, you agree to pay the applicable monthly membership fee on the date it is due each month.

All fees are non-refundable unless otherwise stated in writing. We reserve the right to modify membership fees upon 30 days' written notice. Continued use of the Services after the effective date of a fee change constitutes your acceptance of the new fees.`,
  },
  {
    title: "4. DCP (Dream Carz Points) Program",
    content: `The DCP program is a loyalty rewards program that allows members to accumulate points based on membership payments, vehicle transactions, rental activity, and good-standing bonuses. DCP points have no cash value and cannot be sold, transferred, or exchanged for cash.

DCP redemption values, multipliers, and eligibility requirements are subject to change at our discretion. The Company makes no guarantee regarding the future value or redemption rate of DCP points. Points may expire if your account becomes inactive or is terminated.

The "Credit Free" program and "Be Free" milestones described in our marketing materials are aspirational goals based on projected program participation. Actual outcomes depend on individual member activity, market conditions, and program availability at the time of redemption.`,
  },
  {
    title: "5. Vehicle Use & Conduct",
    content: `Members who access vehicles through DreamCarz Network agree to:

• Use vehicles only for lawful purposes
• Comply with all applicable traffic laws and regulations
• Not operate a vehicle while impaired by alcohol, drugs, or any substance
• Not use vehicles for commercial purposes, racing, or off-road driving
• Return vehicles in the same condition as received, normal wear and tear excepted
• Report any accidents, damage, or theft immediately to DreamCarz Network and applicable authorities

Members are financially responsible for any damage, traffic violations, tolls, and parking fines incurred during their use of a vehicle.`,
  },
  {
    title: "6. Host Program",
    content: `Vehicle owners who participate in the DreamCarz Network Host Program agree to maintain their vehicles in safe, roadworthy condition and to comply with all applicable laws and regulations. The Company acts as a facilitator between vehicle hosts and members and is not responsible for the condition of host-owned vehicles beyond the inspection standards set forth in the Host Program Agreement.`,
  },
  {
    title: "7. Cancellation & Termination",
    content: `You may cancel your membership at any time by contacting us at info@dreamcarz.com or (301) 772-2500. Cancellation will take effect at the end of your current billing period. No refunds will be issued for partial months.

We reserve the right to suspend or terminate your membership immediately, without notice, if you violate these Terms, engage in fraudulent activity, or if your account poses a risk to other members or the Company.`,
  },
  {
    title: "8. Intellectual Property",
    content: `All content on the DreamCarz Network website and application, including but not limited to text, graphics, logos, images, and software, is the property of DreamCarz Network, LLC and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.`,
  },
  {
    title: "9. Disclaimer of Warranties",
    content: `THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.`,
  },
  {
    title: "10. Limitation of Liability",
    content: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, DREAMCARZ NETWORK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.`,
  },
  {
    title: "11. Governing Law & Dispute Resolution",
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of Maryland, without regard to its conflict of law provisions. Any dispute arising from these Terms shall first be subject to good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in Prince George's County, Maryland, under the rules of the American Arbitration Association.`,
  },
  {
    title: "12. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of the Services after the effective date constitutes your acceptance of the revised Terms.`,
  },
  {
    title: "13. Contact Information",
    content: `For questions about these Terms & Conditions, please contact:

DreamCarz Network, LLC
10001 Derekwood Ln, Suite 204
Lanham, MD 20706
Phone: (301) 772-2500
Email: info@dreamcarz.com`,
  },
];

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="mb-12">
            <div className="section-label mb-3">Legal</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Terms & Conditions
            </h1>
            <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>
              Last Updated: August 7, 2026
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                Please read these Terms & Conditions carefully before using DreamCarz Network's website or membership services. These Terms govern your use of our Services and constitute a binding legal agreement between you and DreamCarz Network, LLC.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i} className="border-b border-gray-100 pb-10 last:border-0">
                <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
                  {section.title}
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                  {section.content.split("\n\n").map((para, j) => (
                    <p key={j} className="whitespace-pre-line mb-3 last:mb-0">{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-black rounded-2xl text-white text-center">
            <h3 className="font-display text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Have Questions About Our Terms?</h3>
            <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>We're happy to explain anything in plain language.</p>
            <a href="tel:+13017722500" className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              Call (301) 772-2500
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
