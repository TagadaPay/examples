import { Link } from 'react-router-dom';
import { DOCS_URL, EXAMPLE_REPO_URL } from '../lib/config';

export function Landing() {
  return (
    <main className="page">
      <header className="topbar">
        <span className="brand">Harbor Clinic</span>
        <a href={DOCS_URL} target="_blank" rel="noreferrer">
          Docs
        </a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Landing → quiz → checkout → offer → thank-you → portal</p>
          <h1>Same Funnel v2 as the hosted templates</h1>
          <p className="lede">
            This example creates that canvas with <code>tagada.funnels.create</code>, then
            runs the bricks on your own routes. Marketing quiz before pay. Medical
            intake after pay, on thank-you.
          </p>
          <Link className="btn" to="/quiz">
            Start the assessment
          </Link>
          <p className="hint">
            Source:{' '}
            <a href={EXAMPLE_REPO_URL} target="_blank" rel="noreferrer">
              github.com/TagadaPay/examples/rx-storefront
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
