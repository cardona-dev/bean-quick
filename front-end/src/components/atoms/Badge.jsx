export function Badge({ children, color, className = '' }) {
    return (
        <span
            className={`bq-badge ${className}`.trim()}
            style={color ? { backgroundColor: color } : undefined}
        >
            {children}
        </span>
    );
}
