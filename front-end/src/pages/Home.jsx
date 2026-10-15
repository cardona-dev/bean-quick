import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import { motion } from 'motion/react';
import { FaBolt, FaStar, FaLightbulb, FaArrowRight, FaStore } from 'react-icons/fa';
import { Heading } from '../components/atoms/Heading';
import { Badge } from '../components/atoms/Badge';
import { PrimaryCta } from '../components/molecules/PrimaryCta';
import { Hero } from '../components/organisms/Hero';
import { BeanScene } from '../components/organisms/BeanScene';
import { PromiseSection } from '../components/organisms/PromiseSection';
import { OrderJourney } from '../components/organisms/OrderJourney';
import { FeaturedShelf } from '../components/organisms/FeaturedShelf';
import { menuTarget } from '../domain/orderRules';
import '../styles/home.css';
const Home = () => {
    const [destacados, setDestacados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [catalogDown, setCatalogDown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const fetchDestacados = async () => {
            try {
                const res = await api.get('/api/productos/destacados', { timeout: 2500 });
                if (!cancelled) {
                    setDestacados(Array.isArray(res.data) ? res.data : []);
                    setCatalogDown(false);
                }
            } catch (error) {
                console.error("Error al cargar destacados", error);
                if (!cancelled) {
                    setDestacados([]);
                    setCatalogDown(true);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDestacados();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleVerMenu = () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        const role = localStorage.getItem('USER_ROLE');
        navigate(menuTarget({ token, role }));
    };

    return (
        <div className="bq-home">
            <Hero
                scene={<BeanScene />}
                cta={<PrimaryCta onClick={handleVerMenu}>Ver menú</PrimaryCta>}
            />
            <PromiseSection />
            <OrderJourney />
            <FeaturedShelf
                loading={loading}
                catalogDown={catalogDown}
                productos={destacados}
            />
            <section className="bq-close">
                <Badge>Pedido anticipado</Badge>
                <Heading as="h2" className="bq-close-title">
                    Una sola decisión: ver el menú y pedir antes de llegar.
                </Heading>
            </section>
        </div>
    );
};

export default Home;
