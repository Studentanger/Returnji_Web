'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#ede8de] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-900 border border-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Terms & Conditions</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Last updated: June 2026</p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-[#3b5034] mb-2">Welcome to Return Ji.</p>
          <p className="text-gray-600 mb-10 leading-relaxed">
            By accessing or using our platform, you agree to comply with and be bound by these Terms and Conditions.
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">1. Definitions</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li><strong className="text-gray-800">“Service”</strong> refers to the Return Ji platform (website/app).</li>
                <li><strong className="text-gray-800">“User”</strong> refers to any individual using our services or products.</li>
                <li><strong className="text-gray-800">“Owner”</strong> refers to the person who registered an item.</li>
                <li><strong className="text-gray-800">“Finder”</strong> refers to the person who scans the QR code.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">2. Eligibility</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You must be at least 18 years old or use the service under the consent and supervision of a parent or legal guardian.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">3. Description of Service</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Return Ji provides QR-based help to recover lost items by enabling secure anonymous communication between finder and owner without revealing their identity, along with pickup or delivery services through providers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">4. User Responsibilities</h2>
              <p className="text-sm font-bold text-gray-700 mb-3">By using Return Ji, you agree that:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>You are fully responsible for the information you provide and the actions you take.</li>
                <li>All details shared by you will be accurate and not misleading.</li>
                <li>You will use the platform only for genuine lost-and-found purposes.</li>
                <li>You will not misuse QR codes, create fake listings, or attempt to deceive other users.</li>
                <li>You will not engage in any illegal, harmful, or fraudulent activities.</li>
                <li>You will not upload false, offensive, or misleading content.</li>
                <li>You will behave respectfully while using communication features and will not harass or threaten other users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">5. Privacy & Data</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>We do not share personal data publicly.</li>
                <li>Communication will be anonymous.</li>
                <li>Data is stored securely and used only for service functionality.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">6. Limitation of Liability</h2>
              <p className="text-sm font-bold text-gray-700 mb-3">Return Ji acts only as a platform connecting users. By using the service, you acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>Return Ji does not guarantee recovery of lost items.</li>
                <li>Return Ji is not responsible for any loss, damage, or misuse of items.</li>
                <li>Any exchange of items is solely between users (owner and finder).</li>
                <li>Return Ji is not liable for the actions, behavior, or intentions of any user.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">7. Pickup & Delivery Services</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>Pickup and delivery options are facilitated through third-party service providers.</li>
                <li>Return Ji does not control or guarantee the performance, reliability, or actions of these providers.</li>
                <li>Return Ji shall not be held responsible for any loss, damage, delay, theft, or misleading situation during delivery.</li>
                <li>Users choose to use these services at their own risk and must provide accurate delivery information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">8. Prohibited Activities</h2>
              <p className="text-sm font-bold text-gray-700 mb-3">Users must not:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>Use the platform for scams, illegal, or fraudulent activities.</li>
                <li>Any tampering, duplication, or misuse of QR codes.</li>
                <li>Harass, threaten, or harm other users.</li>
                <li>Upload harmful, false, or misleading content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">9. Illegal or Restricted Items</h2>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800 leading-relaxed">
                <p className="mb-3 font-medium">
                  Users are strictly prohibited from listing or transferring items containing any unauthorized, illegal, restricted, or undisclosed materials, including but not limited to liquor, drugs, hazardous goods, or any items prohibited under applicable laws.
                </p>
                <p>
                  Return Ji shall not process, handle, or deliver such items under any circumstances and disclaims all liability in relation to them. The user shall bear sole legal responsibility, and Return Ji reserves the right to take appropriate legal action and report such matters to relevant authorities.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">10. Account Responsibility</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality and security of your account. Any activity under your account will be considered your responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">11. Termination</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Return Ji reserves the right to suspend or terminate user accounts that violate these Terms and Conditions or misuse the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">12. Dispute Resolution</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Any disputes arising from the use of Return Ji shall be governed by the laws of India.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">13. Changes to Terms</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Return Ji may update these Terms and Conditions at any time. Continued use of the platform constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">14. Contact Information</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                For support or queries, contact us at: <a href="mailto:returnji.app@gmail.com" className="text-blue-600 font-bold hover:underline">returnji.app@gmail.com</a>
              </p>
            </section>

            <section className="mt-12 pt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
              <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest">15. User Acknowledgement</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-2xl mx-auto">
                By using Return Ji, you confirm that you have read, understood, and agreed to these Terms and Conditions and accept full responsibility for your use of the platform.
              </p>
              <p className="text-xl font-bold text-[#3b5034]">Thank You!</p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
