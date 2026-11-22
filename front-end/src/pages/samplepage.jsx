import { useState } from "react";

/* ---------- Edit your content here ---------- */
const BRAND = "Shara Digital Lab";
const WHATSAPP = "https://wa.me/94700000000"; // replace with your number
const EMAIL = "hello@example.com";

const PACKAGES = [
  {
    name: "Starter",
    price: "Rs. 25,000",
    note: "One-page site for a shop or small team",
    items: ["1 responsive page", "Contact + WhatsApp button", "Google Maps embed", "3 days delivery"],
  },
  {
    name: "Business",
    price: "Rs. 60,000",
    note: "Full website for a growing business",
    items: ["Up to 6 pages", "Product or service gallery", "Basic SEO setup", "Domain + hosting guidance"],
    featured: true,
  },
  {
    name: "Custom",
    price: "Let's talk",
    note: "Portals, dashboards, management systems",
    items: ["React web app", "Login + roles", "Database integration", "Training for your staff"],
  },
];

const STEPS = [
  ["Talk", "We discuss what your business does and who visits your site."],
  ["Design", "You see a clickable layout before any code is written."],
  ["Build", "I build it in React, tested on phones first."],
  ["Launch", "Domain, hosting, and a short handover guide."],
];

const WORK = [
  { title: "School anniversary site", tag: "Education", color: "#0E7C86" },
  { title: "Youth association site", tag: "Community", color: "#C2410C" },
  { title: "Tile and ceramics showroom", tag: "Retail", color: "#3B4A6B" },
];

const FAQ = [
  ["How long does a website take?", "A one-page site takes about 3 days. A full business site takes 2 to 3 weeks, depending on how quickly you send content."],
  ["Do I need to buy a domain and hosting?", "Yes, but I help you pick and set them up. You own both, so nothing is locked to me."],
  ["Can I edit the content later?", "Yes. I can set it up so you change text and photos yourself, or I can handle updates for you."],
  ["Will it work on mobile?", "Every site is designed for phones first, since most of your visitors will use one."],
];

/* ---------- Styles ---------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

.lp {
  --paper: #F3F6FA;
  --ink: #0F1B2D;
  --muted: #55627A;
  --teal: #0E7C86;
  --teal-dark: #0A5B63;
  --sun: #F2C14E;
  --line: #D5DDE8;
  --white: #FFFFFF;
  font-family: 'Figtree', system-ui, sans-serif;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.6;
  font-size: 17px;
}
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
.lp h1, .lp h2, .lp h3 {
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin: 0;
}
.lp p { margin: 0; }
.lp a { color: inherit; text-decoration: none; }
.lp :focus-visible { outline: 3px solid var(--sun); outline-offset: 3px; border-radius: 6px; }

.lp .wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.lp .block { padding: 96px 0; }

/* nav */
.lp .nav { display: flex; justify-content: space-between; align-items: center; padding: 22px 0; }
.lp .logo { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: -0.02em; }
.lp .nav-links { display: flex; gap: 28px; align-items: center; font-weight: 500; font-size: 15px; }
.lp .nav-links a:hover { color: var(--teal); }

/* buttons */
.lp .btn {
  display: inline-block; padding: 14px 26px; border-radius: 999px; font-weight: 600; font-size: 16px;
  background: var(--ink); color: var(--white); border: 2px solid var(--ink);
  transition: background .2s, color .2s, transform .15s; cursor: pointer; font-family: inherit;
}
.lp .btn:hover { background: var(--teal); border-color: var(--teal); }
.lp .btn:active { transform: translateY(1px); }
.lp .btn.ghost { background: transparent; color: var(--ink); }
.lp .btn.ghost:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
.lp .btn.sun { background: var(--sun); border-color: var(--sun); color: var(--ink); }
.lp .btn.sun:hover { background: var(--white); border-color: var(--white); }

/* hero */
.lp .hero { display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; align-items: center; padding: 56px 0 96px; }
.lp .hero h1 { font-size: clamp(40px, 6vw, 72px); font-weight: 800; }
.lp .hero p.lead { margin: 24px 0 32px; font-size: 19px; color: var(--muted); max-width: 30em; }
.lp .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }

/* browser mockup */
.lp .browser {
  background: var(--white); border: 2px solid var(--ink); border-radius: 16px; overflow: hidden;
  box-shadow: 10px 10px 0 var(--ink);
  animation: lp-rise .8s ease-out both;
}
.lp .browser-bar { display: flex; align-items: center; gap: 7px; padding: 12px 14px; border-bottom: 2px solid var(--ink); background: var(--paper); }
.lp .dot { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--ink); }
.lp .dot:nth-child(1) { background: var(--sun); }
.lp .url { margin-left: 10px; flex: 1; font-size: 12px; color: var(--muted); background: var(--white); border: 1.5px solid var(--line); border-radius: 999px; padding: 3px 12px; }
.lp .browser-body { padding: 22px; display: grid; gap: 14px; }
.lp .mock-hero { height: 120px; border-radius: 10px; background: var(--teal); position: relative; overflow: hidden; }
.lp .mock-hero::after { content: ""; position: absolute; right: -30px; bottom: -40px; width: 140px; height: 140px; border-radius: 50%; background: var(--sun); }
.lp .mock-line { height: 10px; border-radius: 6px; background: var(--line); }
.lp .mock-line.w60 { width: 60%; } .lp .mock-line.w80 { width: 80%; }
.lp .mock-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.lp .mock-card { height: 56px; border-radius: 8px; border: 2px solid var(--line); }
@keyframes lp-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }

/* section heads */
.lp .head { max-width: 640px; margin-bottom: 48px; }
.lp .head h2 { font-size: clamp(30px, 4vw, 46px); font-weight: 700; }
.lp .head p { margin-top: 14px; color: var(--muted); }

/* packages */
.lp .packages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; align-items: stretch; }
.lp .pack { background: var(--white); border: 2px solid var(--line); border-radius: 18px; padding: 32px 28px; display: flex; flex-direction: column; }
.lp .pack.featured { background: var(--ink); color: var(--white); border-color: var(--ink); }
.lp .pack.featured .pack-note, .lp .pack.featured li { color: #C6D0E2; }
.lp .pack h3 { font-size: 26px; }
.lp .price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 34px; font-weight: 800; margin: 14px 0 6px; }
.lp .pack-note { color: var(--muted); font-size: 15px; }
.lp .pack ul { list-style: none; padding: 0; margin: 24px 0 28px; display: grid; gap: 10px; flex: 1; }
.lp .pack li { padding-left: 26px; position: relative; color: var(--ink); font-size: 16px; }
.lp .pack li::before { content: ""; position: absolute; left: 2px; top: 8px; width: 12px; height: 7px; border-left: 3px solid var(--teal); border-bottom: 3px solid var(--teal); transform: rotate(-45deg); }
.lp .pack.featured li::before { border-color: var(--sun); }

/* process (a real sequence, so numbered) */
.lp .band { background: var(--white); border-top: 2px solid var(--line); border-bottom: 2px solid var(--line); }
.lp .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; counter-reset: step; }
.lp .step { counter-increment: step; }
.lp .step::before {
  content: counter(step); display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%;
  background: var(--teal); color: var(--white); font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 20px; margin-bottom: 16px;
}
.lp .step h3 { font-size: 22px; margin-bottom: 8px; }
.lp .step p { color: var(--muted); font-size: 16px; }

/* work */
.lp .work { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.lp .case { border-radius: 18px; overflow: hidden; border: 2px solid var(--ink); background: var(--white); transition: transform .2s; }
.lp .case:hover { transform: translateY(-4px); }
.lp .case-art { height: 180px; position: relative; }
.lp .case-art::before { content: ""; position: absolute; inset: 22px 22px auto 22px; height: 18px; border-radius: 6px; background: rgba(255,255,255,.85); }
.lp .case-art::after { content: ""; position: absolute; left: 22px; bottom: 22px; width: 55%; height: 60px; border-radius: 8px; background: rgba(255,255,255,.35); }
.lp .case-info { padding: 18px 22px 22px; }
.lp .case-info h3 { font-size: 21px; }
.lp .case-info span { color: var(--muted); font-size: 15px; }

/* faq */
.lp .faq { max-width: 760px; }
.lp .q { border-bottom: 2px solid var(--line); }
.lp .q button {
  width: 100%; text-align: left; background: none; border: 0; padding: 22px 0; cursor: pointer; font: inherit;
  font-weight: 600; font-size: 19px; color: var(--ink); display: flex; justify-content: space-between; gap: 16px; align-items: center;
}
.lp .q .plus { flex: none; width: 26px; height: 26px; position: relative; }
.lp .q .plus::before, .lp .q .plus::after { content: ""; position: absolute; left: 4px; right: 4px; top: 12px; height: 2px; background: var(--ink); transition: transform .25s; }
.lp .q .plus::after { transform: rotate(90deg); }
.lp .q.open .plus::after { transform: rotate(0deg); }
.lp .answer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s ease; }
.lp .q.open .answer { grid-template-rows: 1fr; }
.lp .answer > div { overflow: hidden; }
.lp .answer p { padding-bottom: 22px; color: var(--muted); max-width: 40em; }

/* cta */
.lp .cta { background: var(--teal); color: var(--white); border-radius: 28px; padding: 64px 48px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; align-items: center; }
.lp .cta h2 { font-size: clamp(30px, 4vw, 48px); font-weight: 800; }
.lp .cta p { margin-top: 14px; color: #D6F0F2; }
.lp .cta-actions { display: grid; gap: 12px; justify-items: start; }
.lp .cta-actions .mail { font-weight: 500; color: var(--white); border-bottom: 2px solid var(--sun); padding-bottom: 2px; }

/* footer */
.lp .foot { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 40px 0 48px; color: var(--muted); font-size: 15px; }

/* responsive */
@media (max-width: 900px) {
  .lp .hero, .lp .cta { grid-template-columns: 1fr; }
  .lp .packages, .lp .work { grid-template-columns: 1fr; }
  .lp .steps { grid-template-columns: repeat(2, 1fr); }
  .lp .block { padding: 64px 0; }
  .lp .cta { padding: 44px 28px; }
  .lp .browser { box-shadow: 6px 6px 0 var(--ink); }
}
@media (max-width: 560px) {
  .lp .nav-links a.hide-sm { display: none; }
  .lp .steps { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .lp .browser { animation: none; }
  .lp .case, .lp .answer, .lp .btn { transition: none; }
}
`;

/* ---------- Component ---------- */
export default function LandingPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="lp">
      <style>{css}</style>

      <div className="wrap">
        <nav className="nav" aria-label="Main">
          <a className="logo" href="#top">{BRAND}</a>
          <div className="nav-links">
            <a className="hide-sm" href="#packages">Packages</a>
            <a className="hide-sm" href="#process">Process</a>
            <a className="hide-sm" href="#work">Work</a>
            <a className="btn sun" href={WHATSAPP}>Message me</a>
          </div>
        </nav>

        <header className="hero" id="top">
          <div>
            <h1>Websites that bring customers to your door.</h1>
            <p className="lead">
              I design and build fast, mobile-friendly websites for schools, shops, and community groups in Sri Lanka. You get a clear price and a launch date.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#packages">See packages</a>
              <a className="btn ghost" href={WHATSAPP}>Chat on WhatsApp</a>
            </div>
          </div>

          <div className="browser" aria-hidden="true">
            <div className="browser-bar">
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span className="url">yourbusiness.lk</span>
            </div>
            <div className="browser-body">
              <div className="mock-hero" />
              <div className="mock-line w80" />
              <div className="mock-line w60" />
              <div className="mock-row">
                <div className="mock-card" /><div className="mock-card" /><div className="mock-card" />
              </div>
            </div>
          </div>
        </header>
      </div>

      <section className="block" id="packages" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="head">
            <h2>Pick the package that fits your business</h2>
            <p>Prices below are starting points. Hosting and domain are paid directly to the provider.</p>
          </div>
          <div className="packages">
            {PACKAGES.map((p) => (
              <article key={p.name} className={"pack" + (p.featured ? " featured" : "")}>
                <h3>{p.name}</h3>
                <div className="price">{p.price}</div>
                <p className="pack-note">{p.note}</p>
                <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                <a className={"btn" + (p.featured ? " sun" : " ghost")} href={WHATSAPP}>
                  {p.featured ? "Start this package" : "Ask about " + p.name}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="block band" id="process">
        <div className="wrap">
          <div className="head">
            <h2>From first message to live site in four steps</h2>
          </div>
          <div className="steps">
            {STEPS.map(([t, d]) => (
              <div className="step" key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="work">
        <div className="wrap">
          <div className="head">
            <h2>Recent work</h2>
            <p>Replace these cards with screenshots and links to your live projects.</p>
          </div>
          <div className="work">
            {WORK.map((w) => (
              <article className="case" key={w.title}>
                <div className="case-art" style={{ background: w.color }} />
                <div className="case-info">
                  <h3>{w.title}</h3>
                  <span>{w.tag}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="head"><h2>Questions people ask</h2></div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <div key={q} className={"q" + (open === i ? " open" : "")}>
                <button
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  {q}
                  <span className="plus" aria-hidden="true" />
                </button>
                <div className="answer"><div><p>{a}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 24 }}>
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>Tell me what you need. I'll reply today.</h2>
              <p>Send a message with your business name and what you want the site to do.</p>
            </div>
            <div className="cta-actions">
              <a className="btn sun" href={WHATSAPP}>Message on WhatsApp</a>
              <a className="mail" href={"mailto:" + EMAIL}>{EMAIL}</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="wrap foot">
        <span>© {new Date().getFullYear()} {BRAND}</span>
        <span>Built in Sri Lanka</span>
      </footer>
    </div>
  );
}