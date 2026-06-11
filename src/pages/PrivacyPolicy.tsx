import React from 'react';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <Link to="/" className="flex items-center gap-2 mb-8 text-slate-900 hover:opacity-80 transition-opacity w-fit">
          <Target className="w-6 h-6" />
          <span className="font-semibold text-lg">ManageGoal CRM</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>
            When you use ManageGoal CRM, we collect information that you provide directly to us, such as when you create or modify your account, request support, or otherwise communicate with us. This information may include your name, email address, password, postal address, phone number, and any other information you choose to provide.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. How We Use Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide, maintain, and improve our services;</li>
            <li>Process transactions and send related information;</li>
            <li>Send you technical notices, updates, security alerts, and support messages;</li>
            <li>Respond to your comments, questions, and requests;</li>
            <li>Communicate with you about products, services, offers, and events.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Information Sharing</h2>
          <p>
            We do not share your personal information with third parties except as described in this privacy policy or with your consent. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the Internet or data storage system is guaranteed to be 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@managegoal.com.
          </p>
        </div>
      </div>
    </div>
  );
}
