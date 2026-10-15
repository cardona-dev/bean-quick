import { Heading } from '../atoms/Heading';
import { FeaturePoint } from '../molecules/FeaturePoint';

const POINTS = [
    {
        title: 'Pide',
        text: 'Elige tu café desde el celular, antes de salir de casa.',
    },
    {
        title: 'Paga',
        text: 'Paga el pedido por adelantado y llega con la cuenta lista.',
    },
    {
        title: 'Recoge',
        text: 'Tu pedido te espera listo. Entras, recoges y sigues tu día.',
    },
];

export function PromiseSection() {
    return (
        <section className="bq-promise" aria-labelledby="bq-promise-title">
            <Heading as="h2" className="bq-section-title" >
                <span id="bq-promise-title">Tu café, listo al llegar</span>
            </Heading>
            <div className="bq-points">
                {POINTS.map((point) => (
                    <FeaturePoint key={point.title} title={point.title} text={point.text} />
                ))}
            </div>
        </section>
    );
}
