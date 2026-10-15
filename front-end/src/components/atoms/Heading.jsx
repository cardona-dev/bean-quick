export function Heading({ as = 'h2', children, className = '' }) {
    const Tag = as;
    return <Tag className={`bq-heading ${className}`.trim()}>{children}</Tag>;
}
