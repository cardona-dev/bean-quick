import { Heading } from '../atoms/Heading';
import { ProductSpotlight } from '../molecules/ProductSpotlight';

export function FeaturedShelf({ loading, catalogDown, productos }) {
    return (
        <section className="bq-shelf" aria-labelledby="bq-shelf-title">
            <Heading as="h2" className="bq-section-title">
                <span id="bq-shelf-title">Favoritos para pedir ya</span>
            </Heading>
            {loading ? (
                <p className="bq-shelf-status">Buscando cafés destacados…</p>
            ) : productos.length > 0 ? (
                <div className="bq-spots">
                    {productos.map((producto) => (
                        <ProductSpotlight
                            key={producto.id}
                            nombre={producto.nombre}
                            cafeteria={producto.empresa?.nombre || 'Cafetería Bean Quick'}
                        />
                    ))}
                </div>
            ) : (
                <p className="bq-shelf-fallback" data-testid="catalog-fallback">
                    {catalogDown
                        ? 'Los destacados no están disponibles ahora. Puedes entrar y pedir igualmente: el menú sigue ahí.'
                        : 'Aún no hay destacados. Entra al menú y arma tu pedido antes de llegar.'}
                </p>
            )}
        </section>
    );
}
