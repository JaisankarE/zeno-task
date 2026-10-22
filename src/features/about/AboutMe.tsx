import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import { ZDiamond } from '../../components/Logo'

const PROFILE = {
  name: 'Jaisankar E',
  role: 'Senior Software Engineer',
  years: 5,
  email: 'jaisankar0110@gmail.com',
  phone: '+91 9042804835',
  linkedin: 'linkedin.com/in/jaisankar-e0110',
  summary:
    'Results-driven Senior Software Engineer with 5 years of experience building scalable, low-latency, high-performance web and mobile applications with Vue.js, React.js, React Native and Angular. I architect fintech solutions, modernize legacy systems and lead cross-functional frontend delivery — from stakeholder discovery and Figma designs to production on Linux servers, Cloudflare, payment gateways and REST APIs.',
}

const STATS: Array<[string, string]> = [
  ['5', 'Years experience'],
  ['17+', 'Production apps'],
  ['8', 'Repos led in parallel'],
  ['99%+', 'Operational availability'],
]

const SKILLS: Array<{ title: string; icon: IconName; items: string[] }> = [
  {
    title: 'Frontend & Languages',
    icon: 'monitor',
    items: ['React Native', 'React.js (Vite)', 'Vue.js (Vite)', 'Angular', 'TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3'],
  },
  {
    title: 'UI & State',
    icon: 'grid',
    items: ['Tailwind CSS', 'Vuetify', 'Bootstrap', 'Pinia', 'Zustand', 'Responsive Component Architecture'],
  },
  {
    title: 'Backend & Infrastructure',
    icon: 'zap',
    items: ['Node.js', 'Express.js', 'PHP', 'REST APIs', 'Linux Servers', 'Cloudflare', 'DNS Configuration', 'Razorpay', 'Stripe'],
  },
  {
    title: 'Tools & Engineering',
    icon: 'wrench',
    items: ['Git', 'Custom Packages', 'Chrome Extensions', 'UI/UX Optimization', 'Performance Tuning', 'Team Collaboration'],
  },
]

const EXPERIENCE = [
  {
    role: 'Senior Software Engineer',
    company: 'AliceBlue',
    tag: 'Fintech',
    period: 'Jul 2023 – Present',
    points: [
      "Architected and launched the frontend for the flagship US Stocks Trading Platform — responsive, fault-tolerant, low-latency trading components in React + TypeScript.",
      'Directed delivery across 8 active frontend repositories with 100% on-time sprint milestones while mentoring a junior engineer.',
      'Expanded frontend capabilities across 17 production apps in Angular, React and Vue.js with 99%+ availability.',
      'Delivered a 6-month roadmap in 3 months with reusable UI libraries and component-driven architecture — earning a 3-month performance bonus.',
      'Migrated legacy Angular codebases to Vue.js + Vuetify, cutting render latency and bundle size.',
      'Built a Heatmap Datewise Calendar package, an internal Chrome Extension and a reusable Email Template Framework.',
      'Managed production releases on Linux servers, Cloudflare and DNS; ran peer code reviews to drive defect rates down.',
    ],
  },
  {
    role: 'Freelance Web & App Developer',
    company: 'Plefigos',
    tag: 'Freelance',
    period: 'Aug 2021 – Jun 2023',
    points: [
      'Built and deployed web apps for 6+ clients (Neelinfotech, Done Website, Studio Three) with Vue.js and Angular.',
      'Launched Android apps on Google Play (Clicwin, Vijay Media) with 99%+ crash-free sessions.',
      'Ran discovery interviews, rapid UI/UX wireframes and full-lifecycle deployments — on time and on budget.',
    ],
  },
]

const EDUCATION: Array<[string, string, string]> = [
  ['B.E. Computer Science Engineering', 'Er. Perumal Manimekalai College of Engineering', '2018 – 2022 · 78%'],
  ['Higher Secondary (HSC)', 'Govt. Model Higher Secondary School', '2018 · 77%'],
  ['Secondary (SSLC)', 'Govt. Model Higher Secondary School', '2016 · 86%'],
]

const AWARDS: Array<[string, string]> = [
  ['3-Month Performance Bonus', 'AliceBlue — compressed an enterprise 6-month roadmap into 3 months'],
  ['Silver Coin Award', 'AliceBlue — outstanding execution, system quality and technical impact'],
  ['1st Place · Web Design', 'National Level Technical Symposium, SRM Institute of Science & Technology'],
]

export function AboutMe() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white grid-glow">
      <ZDiamond className="pointer-events-none absolute -right-28 top-16 size-[440px] text-white/[0.03] animate-float" strokeWidth={3} />

      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {/* Hero */}
        <header className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="relative shrink-0 animate-scale-in">
            <span className="absolute inset-0 rounded-[32px] bg-zeno-400/30 blur-2xl" />
            <div className="relative grid size-28 place-items-center rounded-[32px] bg-gradient-to-br from-zeno-400 to-zeno-700 font-display text-4xl font-bold shadow-xl shadow-zeno-500/30">
              JE
            </div>
          </div>
          <div className="animate-fade-up">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zeno-400">About me</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{PROFILE.name}</h1>
            <p className="mt-2 text-lg text-slate-300">
              {PROFILE.role} · <span className="text-white">{PROFILE.years} years</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Contact icon="info" label={PROFILE.email} href={`mailto:${PROFILE.email}`} />
              <Contact icon="phone" label={PROFILE.phone} href={`tel:${PROFILE.phone.replace(/\s/g, '')}`} />
              <Contact icon="user" label={PROFILE.linkedin} href={`https://${PROFILE.linkedin}`} />
            </div>
          </div>
        </header>

        <p className="mt-10 max-w-3xl text-[15px] leading-7 text-slate-300 animate-fade-up" style={{ animationDelay: '100ms' }}>
          {PROFILE.summary}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map(([v, l], i) => (
            <div
              key={l}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 animate-fade-up"
              style={{ animationDelay: `${150 + i * 60}ms` }}
            >
              <p className="font-display text-3xl font-bold text-zeno-300">{v}</p>
              <p className="mt-1 text-xs text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Experience */}
        <Section title="Experience">
          <ol className="relative space-y-6 border-l border-white/10 pl-6">
            {EXPERIENCE.map((job, i) => (
              <li key={job.company} className="relative animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="absolute -left-[31px] top-1.5 size-3.5 rounded-full border-2 border-ink-950 bg-zeno-400 ring-4 ring-zeno-400/20" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{job.role}</h3>
                      <p className="text-sm text-slate-400">
                        {job.company} <span className="ml-1 rounded-md bg-zeno-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-zeno-300">{job.tag}</span>
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{job.period}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {job.points.map((p) => (
                      <li key={p} className="flex gap-2.5 text-sm leading-6 text-slate-300">
                        <Icon name="check" className="mt-1 size-3.5 shrink-0 text-zeno-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Skills */}
        <Section title="Technical skills">
          <div className="grid gap-4 md:grid-cols-2">
            {SKILLS.map((group, i) => (
              <div key={group.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid size-7 place-items-center rounded-lg bg-zeno-500/15 text-zeno-300">
                    <Icon name={group.icon} className="size-3.5" />
                  </span>
                  {group.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((s) => (
                    <span key={s} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 transition hover:border-zeno-400/50 hover:text-white">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-10 md:grid-cols-2">
          <Section title="Achievements">
            <ul className="space-y-3">
              {AWARDS.map(([t, d]) => (
                <li key={t} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
                    <Icon name="trend" className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Education & languages">
            <ul className="space-y-3">
              {EDUCATION.map(([deg, school, meta]) => (
                <li key={deg} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold">{deg}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{school}</p>
                  <p className="mt-1 font-mono text-[11px] text-zeno-300">{meta}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">English · Professional</span>
              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">Tamil · Native</span>
            </div>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-zeno-400/20 bg-gradient-to-br from-zeno-500/15 to-transparent p-8 text-center animate-fade-up">
          <p className="font-display text-2xl font-bold">Zeno EV battery swap — assessment build</p>
          <p className="max-w-lg text-sm text-slate-400">
            Admin console, rider portal (RFID + OTP) and an interactive 10-box swap station kiosk, all on mock data.
          </p>
          <a
            href="/"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-zeno-500 px-6 text-[15px] font-semibold shadow-lg shadow-zeno-500/30 transition hover:bg-zeno-400"
          >
            View my task
            <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
        <span className="h-px flex-1 bg-white/10" />
      </h2>
      {children}
    </section>
  )
}

function Contact({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:border-zeno-400/40 hover:text-white"
    >
      <Icon name={icon} className="size-3.5" />
      {label}
    </a>
  )
}
