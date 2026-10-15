import { Button } from '../atoms/Button';

export function PrimaryCta({ onClick, children }) {
    return (
        <Button className="bq-btn-primary" onClick={onClick} testId="primary-order">
            {children}
        </Button>
    );
}
