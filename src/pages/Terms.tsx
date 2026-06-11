import React from 'react';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <Link to="/" className="flex items-center gap-2 mb-8 text-slate-900 hover:opacity-80 transition-opacity w-fit">
          <Target className="w-6 h-6" />
          <span className="font-semibold text-lg">ManageGoal CRM</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms and Conditions</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using ManageGoal CRM, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Account Registration</h2>
          <p>
            You must register for an account to use our Services. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service. 
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Subscription and Billing</h2>
          <p>
            Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Acceptable Use</h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Violate any laws, regulations, or third-party rights.</li>
            <li>Transmit viruses, malware, or any other malicious code.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Attempt to gain unauthorized access to the Service or related systems.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. 
            Upon termination, your right to use the Service will immediately cease.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. We will notify you of any changes by posting the new Terms on this page.
          </p>
        </div>
      </div>
    </div>
  );
}
