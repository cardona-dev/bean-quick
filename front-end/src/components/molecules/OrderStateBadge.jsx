import { Badge } from '../atoms/Badge';
import { ORDER_STATE_COLORS } from '../../domain/orderRules';

export function OrderStateBadge({ estado }) {
    return (
        <Badge className="bq-state-badge" color={ORDER_STATE_COLORS[estado]}>
            {estado}
        </Badge>
    );
}
