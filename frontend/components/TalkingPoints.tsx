import Link from 'next/link'
import styles from './TalkingPoints.module.css'

interface TalkingPointsProps {
  talkingPoints: string[];
  mpHref: string;
  email: string;
  name: string;
  subject: string;
}

export default function TalkingPoints({
  talkingPoints,
  mpHref,
  email,
  name,
  subject,
}: TalkingPointsProps) {
  return (
    <section className={styles.letterPanel} aria-labelledby="letter-heading">
      <p className={styles.eyebrow}>FOR YOUR LETTER TO YOUR MP</p>
      <h3 id="letter-heading" className="ea-underline">
        {subject}
      </h3>
      <ul className="ea-list">
        {talkingPoints.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
      <div className="action-row">
                <Link className="button button-primary" style={{color: "white"}} href={mpHref}>Use this to write to your MP <span aria-hidden="true">→</span></Link>
                <a className="button button-quiet" style={{color: "white"}} href={`mailto:${email}`}>Email {name} directly</a>
            </div>
            <p className={styles.letterNote}>
                These figures are drawn from a small sample so you can see how the numbers read. They are
                not a full census of the constituency.
            </p>
    </section>
  );
}


