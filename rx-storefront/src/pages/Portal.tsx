import { Link } from 'react-router-dom';
import { DOCS_URL } from '../lib/config';

export function Portal() {
  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Harbor Clinic
        </Link>
        <span>Portal</span>
      </header>
      <div className="card">
        <p className="eyebrow">Step 6 of 6</p>
        <h1>Patient portal</h1>
        <p>
          Sign in with the email from your order (OTP → CMS session). Messaging,
          photo-ID, and case timeline live on the portal endpoints — see the{' '}
          <a href="https://docs.tagada.io/developer-tools/rx/patient-portal" target="_blank" rel="noreferrer">
            patient portal docs
          </a>
          .
        </p>
        <p className="hint">
          Full brick list:{' '}
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            Headless SDK
          </a>
        </p>
      </div>
    </main>
  );
}
