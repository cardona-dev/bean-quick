/** Continuous CSS 3D rotation of a hexagonal prism. */
export function BeanScene() {
    return (
        <div className="bean-scene" data-testid="bean-3d" aria-hidden="true">
            <div className="bean-prism">
                <div className="bean-face" />
                <div className="bean-face" />
                <div className="bean-face" />
                <div className="bean-face" />
                <div className="bean-face" />
                <div className="bean-face" />
            </div>
        </div>
    );
}
