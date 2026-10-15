import { Heading } from '../atoms/Heading';

export function FeaturePoint({ title, text }) {
    return (
        <article className="bq-point">
            <Heading as="h3" className="bq-point-title">{title}</Heading>
            <p>{text}</p>
        </article>
    );
}
