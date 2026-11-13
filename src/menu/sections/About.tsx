import { ABOUT, PROFILE } from '../../data/content'

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.]+)/

/** Turns any email address in the text into a mailto link. */
function withEmailLinks(text: string) {
  return text.split(EMAIL).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${part}`}>
        {part}
      </a>
    ) : (
      part
    ),
  )
}

export default function About() {
  return (
    <div className="about">
      <img className="avatar" src={`${ABOUT.avatar}&s=352`} alt={PROFILE.name} width={176} height={176} decoding="async" />
      <div className="card readme">
        <h3>{ABOUT.heading}</h3>
        <p className="bio">{ABOUT.bio}</p>
        <ul className="bullets">
          {ABOUT.bullets.map((b) => (
            <li key={b}>{withEmailLinks(b)}</li>
          ))}
        </ul>
        <a className="btn" href={PROFILE.github} target="_blank" rel="noreferrer">
          GitHub profile <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  )
}
