import React from 'react';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <Link to="/" className="flex items-center gap-2 mb-8 text-slate-900 hover:opacity-80 transition-opacity w-fit">
          <Target className="w-6 h-6" />
          <span className="font-semibold text-lg">ManageGoal CRM</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Refund Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Overview</h2>
          <p>
            At ManageGoal CRM, we want to ensure you are fully satisfied with our services. We offer a 14-day free trial on our paid plans so that you can evaluate our platform to ensure it meets your needs before committing to a paid subscription.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Subscription Refunds</h2>
          <p>
            If you upgrade to a paid plan and are not completely satisfied, you may request a full refund within the first 14 days of your initial purchase. This applies to your first subscription payment only.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Non-Refundable Items</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Any requests made after the 14-day guarantee period has expired.</li>
            <li>Renewal payments for existing subscriptions (unless there is a verified billing error).</li>
            <li>Custom development or professional services fees.</li>
            <li>Accounts that have violated our Terms and Conditions.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. How to Request a Refund</h2>
          <p>
            To request a refund, please contact our support team at support@managegoal.com with your account details and reason for the refund request. We aim to process all eligible refund requests within 5-7 business days.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Cancellations</h2>
          <p>
            You may cancel your subscription at any time. When you cancel, you will continue to have access to the paid features until the end of your current billing cycle. Cancelling your subscription does not automatically process a refund.
          </p>
        </div>
      </div>
    </div>
  );
}
