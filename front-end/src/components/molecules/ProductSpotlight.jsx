export function ProductSpotlight({ nombre, cafeteria }) {
    return (
        <article className="bq-spot">
            <p className="bq-spot-name">{nombre}</p>
            <p className="bq-spot-cafe">{cafeteria}</p>
        </article>
    );
}
