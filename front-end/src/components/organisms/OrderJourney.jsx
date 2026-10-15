import { Heading } from '../atoms/Heading';
import { OrderStateBadge } from '../molecules/OrderStateBadge';
import { ORDER_STATES } from '../../domain/orderRules';

export function OrderJourney() {
    return (
        <section className="bq-journey" aria-labelledby="bq-journey-title">
            <Heading as="h2" className="bq-section-title">
                <span id="bq-journey-title">Así avanza tu pedido</span>
            </Heading>
            <p className="bq-journey-note">
                Cada estado tiene su propia señal para que sepas si falta pagar, si lo están preparando o si ya puedes recogerlo.
            </p>
            <ol className="bq-states">
                {ORDER_STATES.map((estado) => (
                    <li key={estado}>
                        <OrderStateBadge estado={estado} />
                    </li>
                ))}
            </ol>
        </section>
    );
}
