import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <div className="site-header">
        <div className="container header_content text_center">
          <div className="logo">
            <img src="./img/logo.png" alt="" />
          </div>
          <div className="text_header">
            <h2>Bienvenido <span>¿qué quieres reservar hoy?</span></h2>
          </div>
        </div>
      </div>
      <main className="sobre_nosotros text_center">
        <div className="container">
          <div className="contenido_nosotros">
            <h2>sobre<span> nosotros</span></h2>
            <div className="container_items">
              <div className="item_nosotros">
                <i className="fa-solid fa-bolt fa-3x"></i>
                <h3>Eficiencia</h3>
                <p>En Bean Quick optimizamos cada proceso para ofrecerte un servicio rápido y confiable. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tempus sapien sed ligula placerat, et dapibus lectus blandit.</p>
              </div>
              <div className="item_nosotros">
                <i className="fa-solid fa-star fa-3x"></i>
                <h3>Calidad</h3>
                <p>Nuestros productos son elaborados con los más altos estándares de calidad. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.</p>
              </div>
              <div className="item_nosotros">
                <i className="fa-solid fa-lightbulb fa-3x"></i>
                <h3>Innovación</h3>
                <p>Buscamos constantemente nuevas formas de mejorar la experiencia del cliente. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus elementum sem quis libero volutpat feugiat.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <main className="seccion seccion_productos">
        <h2 className="text_center">destacados</h2>
        <div className="container productos">
          <div className="producto_card">
            <div className="card_header">
              <img src="./img/productos/producto-0.png" alt="" />
              <p className="text_center">panecillos</p>
            </div>
          </div>
          <div className="producto_card">
            <div className="card_header">
              <img src="./img/productos/producto-1.png" alt="" />
              <p className="text_center">Nevados</p>
            </div>
          </div>
          <div className="producto_card">
            <div className="card_header">
              <img src="./img/productos/producto-2.png" alt="" />
              <p className="text_center">frapuccinos</p>
            </div>
          </div>
          <div className="producto_card">
            <div className="card_header">
              <img src="./img/productos/producto-3.png" alt="" />
              <p className="text_center">panecillos</p>
            </div>
          </div>
        </div>
      </main>

      <section className="seccion aliados">
        <h2 className="text_center">Aliados</h2>
        <div className="container aliados_container">
          <div className="text_aliados text_center cont_ali">
            <p>
              massa commodo elit consequat molestie maximus non nulla. Praesent luctus efficitur ullamcorper. Ut tempor, est sed sagittis porttitor, diam arcu auctor purus, et lacinia arcu felis ut purus. Integer quis sem arcu. Nunc consectetur sed lectus nec elementum. Nunc laoreet fermentum diam, ut aliquet odio maximus quis. Nullam magna neque, volutpat id eros a, mattis tempor nisi. Fusce semper lorem diam, hendrerit congue est tempor quis. Nunc nec dui nibh. Etiam velit justo, faucibus sit amet scelerisque id, molestie eget dolor. Mauris ipsum arcu, iaculis ac massa eu, tincidunt consectetur turpis. Duis ut dolor a neque finibus sodales ac vitae sem. Praesent eget lorem consequat, mattis sapien in, condimentum leo.
              In felis enim, sollicitudin in porta at, ultrices at magna. Mauris condimentum lorem et dolor tempus interdum. Nunc lobortis, lectus ut bibendum fringilla, arcu magna luctus diam, id elementum tortor velit in dolor. Donec in faucibus magna. Maecenas placerat vitae lacus vel porttitor. Mauris gravida metus a tellus rhoncus aliquam. Aenean eu metus finibus, egestas nunc eu, condimentum lorem. Aliquam sed magna sit amet mi porta suscipit.
              Proin laoreet interdum fermentum. Nunc vehicula sodales aliquet. Aliquam erat volutpat. Nulla euismod, erat id volutpat fringilla, quam risus consequat elit, nec suscipit lorem urna non magna. Vivamus posuere commodo ipsum, vulputate gravida tortor tristique nec. Ut eget tristique est. Duis varius blandit dolor ac feugiat. Proin placerat hendrerit risus nec rutrum.
            </p>
          </div>
          <div className="logo_aliados cont_ali">
            <img src="./img/aliados/SENAlogo.png" alt="" />
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;