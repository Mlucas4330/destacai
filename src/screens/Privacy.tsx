import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const Privacy = () => {
  return (
    <div className='min-h-screen bg-surface px-6 py-12'>
      <div className='mx-auto w-full max-w-2xl'>
        <Link
          href='/'
          className='inline-flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors'
        >
          <ArrowLeft size={14} /> Back to app
        </Link>

        <div className='mt-6 rounded-2xl border border-border bg-canvas p-8'>
          <h1 className='text-2xl font-semibold text-navy'>Privacy Policy</h1>
          <p className='mt-1 text-xs text-navy-muted'>DestacAI — Last updated: June 2026</p>

          <h2 className='mt-8 text-base font-semibold text-navy'>Overview</h2>
          <p className='mt-2 text-sm leading-relaxed text-navy-muted'>
            DestacAI is a web app that generates ATS-optimized CVs tailored to specific job descriptions. This policy
            describes what data is collected, where it is stored, and which third parties process it. The app can be used
            as a guest (no sign-up) or with a free email/password account.
          </p>

          <h2 className='mt-8 text-base font-semibold text-navy'>Data Collected</h2>
          <p className='mt-2 text-sm leading-relaxed text-navy-muted'>
            The following data is stored to operate the app:
          </p>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy-muted'>
            <li>Your uploaded CV file (PDF) and the text extracted from it</li>
            <li>Saved job descriptions and metadata (title, company, application status)</li>
            <li>Generated CV content and ATS scores (both uploaded and tailored)</li>
            <li>Email address and a one-way hash of your password (signed-in users only)</li>
            <li>CV generation count, used to enforce free-tier limits (resets monthly)</li>
            <li>
              A locally-generated guest identifier and the IP address of the request, used only to enforce guest
              generation limits
            </li>
            <li>
              Stripe customer and subscription identifiers (paid users only; payment card details never touch our
              servers)
            </li>
            <li>App configuration and preferences</li>
          </ul>

          <h2 className='mt-8 text-base font-semibold text-navy'>Data Storage</h2>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy-muted'>
            <li><strong className='text-navy'>Cloudflare R2</strong>: uploaded and generated PDF files</li>
            <li><strong className='text-navy'>PostgreSQL (Railway)</strong>: accounts, jobs, ATS scores, subscription state</li>
            <li>
              <strong className='text-navy'>Redis (Railway)</strong>: transient job queue for asynchronous CV generation
              and ATS scoring; entries are removed once a job completes
            </li>
            <li>
              <strong className='text-navy'>Browser localStorage</strong>: guest identifier and app preferences. Your
              signed-in session is an httpOnly cookie set by the backend, not stored in localStorage
            </li>
          </ul>

          <h2 className='mt-8 text-base font-semibold text-navy'>Third-Party Services</h2>
          <p className='mt-2 text-sm leading-relaxed text-navy-muted'>
            When generating a CV or computing an ATS score, the text of your CV and the job description are sent to the
            LLM provider. Sign-up and password-reset codes are sent via Brevo. Paid subscriptions are handled by Stripe.
          </p>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-navy-muted'>
            <li>OpenAI — <a className='text-navy underline underline-offset-2' href='https://openai.com/policies/privacy-policy'>Privacy Policy</a></li>
            <li>Brevo — <a className='text-navy underline underline-offset-2' href='https://www.brevo.com/legal/privacypolicy/'>Privacy Policy</a></li>
            <li>Stripe — <a className='text-navy underline underline-offset-2' href='https://stripe.com/privacy'>Privacy Policy</a></li>
            <li>Cloudflare — <a className='text-navy underline underline-offset-2' href='https://www.cloudflare.com/privacypolicy/'>Privacy Policy</a></li>
            <li>Railway — <a className='text-navy underline underline-offset-2' href='https://railway.com/legal/privacy'>Privacy Policy</a></li>
          </ul>

          <h2 className='mt-8 text-base font-semibold text-navy'>Data Retention</h2>
          <p className='mt-2 text-sm leading-relaxed text-navy-muted'>
            Guest accounts and all data associated with them (uploaded CV, jobs, generated CVs, ATS scores) are
            automatically deleted 10 days after creation. Signed-in account data is kept until you delete it: you can
            remove individual jobs, clear all jobs, or remove your uploaded CV at any time from the Settings screen. Full
            account deletion is available on request via the contact below.
          </p>

          <h2 className='mt-8 text-base font-semibold text-navy'>Contact</h2>
          <p className='mt-2 text-sm leading-relaxed text-navy-muted'>
            For questions about this policy:{' '}
            <a className='text-navy underline underline-offset-2' href='mailto:mlucas4330@gmail.com'>mlucas4330@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
