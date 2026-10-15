export function Button({ children, onClick, className = '', testId }) {
    return (
        <button
            type="button"
            className={`bq-btn ${className}`.trim()}
            onClick={onClick}
            data-testid={testId}
        >
            {children}
        </button>
    );
}
