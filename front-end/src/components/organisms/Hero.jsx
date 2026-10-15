import { motion } from 'motion/react';
import { Heading } from '../atoms/Heading';
import { Badge } from '../atoms/Badge';

const HeroCopy = motion.div;

export function Hero({ scene, cta }) {
    return (
        <header className="bq-hero">
            <HeroCopy
                className="bq-hero-copy"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <Badge className="bq-kicker">Sin fila</Badge>
                <Heading as="h1" className="bq-hero-title">
                    Bean Quick
                </Heading>
                <p className="bq-hero-lead">
                    Pide y paga antes de llegar. Recoge tu pedido listo.
                </p>
                {cta}
            </HeroCopy>
            {scene}
        </header>
    );
}
