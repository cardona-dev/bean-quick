// ========================================
// IMPORTACIONES - Traemos las herramientas que necesitamos
// ========================================
import GranosCafe from '../img/GranosCafe.png'; // ← AGREGAR ESTO AL INICIO CON LOS OTROS IMPORTS

// React y useState: nos permite crear componentes y manejar datos que cambian
import React, { useState } from 'react';

// axios: herramienta para comunicarnos con el servidor (enviar y recibir datos)
import axios from 'axios';

// useNavigate: nos permite cambiar de página dentro de la aplicación
import { useNavigate } from 'react-router-dom';

// Iconos decorativos para el formulario
import { 
  FaBuilding,      // Edificio (para nombre de empresa)
  FaEnvelope,      // Sobre (para correo)
  FaIdCard,        // Tarjeta de ID (para NIT)
  FaPhone,         // Teléfono
  FaMapMarkerAlt,  // Marcador de mapa (para dirección)
  FaFileAlt,       // Archivo (para descripción)
  FaImage,         // Imagen (para subir fotos)
  FaCoffee,        // Café (logo de la marca)
  FaCheckCircle,   // Círculo con check (beneficios)
  FaArrowRight     // Flecha derecha (botón)
} from 'react-icons/fa';

// ========================================
// COMPONENTE PRINCIPAL - RegistroEmpresa
// ========================================
const RegistroEmpresa = () => {
  // navigate: función para cambiar de página
  const navigate = useNavigate();
  
  // ========================================
  // ESTADO INICIAL - Valores vacíos del formulario
  // ========================================
  // Esta es la "plantilla" de cómo debe verse el formulario vacío
  const estadoInicial = {
    nombre: '',           // Nombre de la empresa
    correo: '',          // Correo electrónico
    nit: '',             // Número de identificación tributaria
    telefono: '',        // Teléfono de contacto
    direccion: '',       // Dirección física del local
    descripcion: '',     // Descripción de la empresa
    logo: null,          // Archivo del logo (inicialmente sin archivo)
    foto_local: null     // Archivo de foto del local (inicialmente sin archivo)
  };

  // ========================================
  // ESTADOS - Variables que pueden cambiar
  // ========================================
  
  // formData: guarda todos los datos que el usuario escribe o sube
  const [formData, setFormData] = useState(estadoInicial);
  
  // errores: guarda mensajes de error para cada campo
  // Ejemplo: { nombre: ["El nombre es obligatorio"], correo: ["Email inválido"] }
  const [errores, setErrores] = useState({});
  
  // loading: indica si estamos esperando respuesta del servidor
  const [loading, setLoading] = useState(false);
  
  // resetKey: número que cambia para "resetear" los inputs de archivo
  // Cuando cambia, React recrea los campos de archivo desde cero
  const [resetKey, setResetKey] = useState(0);
  
  // focusedInput: recuerda qué campo está activo (para cambiar su estilo)
  const [focusedInput, setFocusedInput] = useState('');
  
  // logoPreview: guarda la URL temporal de la imagen del logo para mostrarla
  const [logoPreview, setLogoPreview] = useState(null);
  
  // fotoPreview: guarda la URL temporal de la foto del local para mostrarla
  const [fotoPreview, setFotoPreview] = useState(null);

  // ========================================
  // FUNCIÓN 1: Cuando el usuario escribe o sube archivos
  // ========================================
  const handleChange = (e) => {
    // Extraemos información del campo que cambió
    const { name, value, files } = e.target;
    
    // Si había un error en este campo, lo limpiamos
    // Es como borrar una nota roja de corrección cuando empiezas a corregir
    if (errores[name]) setErrores({ ...errores, [name]: null });

    // Si el usuario subió un archivo (imagen)
    if (files && files[0]) {
      // Guardamos el archivo en formData
      setFormData({ ...formData, [name]: files[0] });
      
      // Crear una vista previa de la imagen
      // FileReader es como un "lector de archivos" que convierte la imagen en algo que podemos mostrar
      const reader = new FileReader();
      
      // Cuando termine de leer el archivo, ejecutamos esto:
      reader.onloadend = () => {
        // Si es el logo, guardamos la vista previa en logoPreview
        if (name === 'logo') {
          setLogoPreview(reader.result);
        } 
        // Si es la foto del local, guardamos la vista previa en fotoPreview
        else if (name === 'foto_local') {
          setFotoPreview(reader.result);
        }
      };
      
      // Iniciamos la lectura del archivo como Data URL (formato de imagen para web)
      reader.readAsDataURL(files[0]);
    } 
    // Si el usuario escribió texto (no es archivo)
    else {
      // Actualizamos el campo correspondiente con el nuevo valor
      setFormData({ ...formData, [name]: value });
    }
  };

  // ========================================
  // FUNCIÓN 2: Cuando el usuario envía el formulario
  // ========================================
  const handleSubmit = async (e) => {
    // Evitamos que la página se recargue (comportamiento por defecto)
    e.preventDefault();
    
    // Limpiamos todos los errores anteriores
    setErrores({});
    
    // ========================================
    // VALIDACIÓN DE SEGURIDAD - Sanitización
    // ========================================
    // Creamos una "lista negra" de caracteres peligrosos
    // Estos caracteres pueden ser usados para ataques informáticos
    const dangerousChars = /[<>{}[\]\\/]/;
    
    // Verificamos si el nombre o descripción contienen caracteres peligrosos
    if (dangerousChars.test(formData.nombre) || dangerousChars.test(formData.descripcion)) {
        // Si encontramos caracteres peligrosos, mostramos un error y detenemos el envío
        setErrores({ general: 'No se permiten caracteres especiales como < > { } [ ]' });
        return; // Salimos de la función sin enviar nada
    }

    // Activamos el estado de "cargando"
    setLoading(true);

    // ========================================
    // PREPARAR DATOS PARA ENVÍO
    // ========================================
    // FormData es un formato especial para enviar archivos e imágenes al servidor
    // Es como empacar todo en una caja para envío postal
    const data = new FormData();
    
    // Recorremos cada campo del formulario
    Object.keys(formData).forEach(key => {
      // Si el campo tiene un valor (no está vacío)
      if (formData[key] !== null) {
        // Lo agregamos a la "caja" FormData
        data.append(key, formData[key]);
      }
    });

    try {
      // Obtenemos el token de autenticación guardado anteriormente
      // Es como mostrar tu credencial para demostrar quién eres
      const token = localStorage.getItem('AUTH_TOKEN');
      
      // Enviamos los datos al servidor
      const response = await axios.post(
        'http://127.0.0.1:8000/api/solicitud-empresa', // Dirección del servidor
        data, // Los datos que enviamos
        {
          headers: { 
            'Content-Type': 'multipart/form-data', // Tipo de datos (archivos + texto)
            'Authorization': `Bearer ${token}` // Enviamos el token de autenticación
          }
        }
      );
      
      // Si llegamos aquí, todo salió bien
      console.log("Respuesta exitosa:", response.data);
      
      // Mostramos mensaje de éxito al usuario
      alert('¡Solicitud enviada con éxito! Espera la aprobación del administrador.');
      
      // ========================================
      // LIMPIAR TODO DESPUÉS DEL ÉXITO
      // ========================================
      
      // Reseteamos el formulario a su estado inicial (todo vacío)
      setFormData(estadoInicial);
      
      // Limpiamos las vistas previas de las imágenes
      setLogoPreview(null);
      setFotoPreview(null);
      
      // Cambiamos el resetKey para forzar a React a recrear los campos de archivo
      // Es como "refrescar" los campos de subida de archivos
      setResetKey(prev => prev + 1);
      
      // Enviamos al usuario de regreso a la página principal
      navigate('/');

    } catch (error) {
      // Si algo sale mal, capturamos el error aquí
      
      // Si el servidor devolvió un error de validación (código 422)
      if (error.response && error.response.status === 422) {
        // Guardamos los errores específicos de cada campo
        // Ejemplo: { nombre: ["Campo obligatorio"], correo: ["Email inválido"] }
        setErrores(error.response.data.errors);
      } else {
        // Para cualquier otro tipo de error, mostramos un mensaje genérico
        setErrores({ general: 'Hubo un error al enviar.' });
      }
    } finally {
      // Este bloque SIEMPRE se ejecuta (haya éxito o error)
      // Apagamos el estado de "cargando"
      setLoading(false);
    }
  };

  // ========================================
  // PARTE VISUAL - Lo que se muestra en pantalla
  // ========================================
  return (
    <div style={styles.page}>
      {/* ========================================
          DECORACIONES DE FONDO - Círculos decorativos
          ======================================== */}
      <div style={styles.bgCircle1} /> {/* Círculo grande arriba-derecha */}
      <div style={styles.bgCircle2} /> {/* Círculo mediano abajo-izquierda */}

      <div style={styles.container}>
        {/* ========================================
            HEADER - Encabezado con branding y beneficios
            ======================================== */}
        <div style={styles.header}>
          {/* Sección del logo y título */}
          <div style={styles.brandSection}>
            {/* Círculo con ícono de café */}
            <div style={styles.logoCircle}>
              <FaCoffee style={styles.logoIcon} />
            </div>
            <div>
              {/* Título principal */}
              <h1 style={styles.brandTitle}>Únete a Bean Quick Business</h1>
              {/* Subtítulo descriptivo */}
              <p style={styles.brandSubtitle}>Registra tu cafetería y comienza a recibir pedidos</p>
            </div>
          </div>

          {/* Fila de beneficios (badges) */}
          <div style={styles.benefitsRow}>
            {/* Beneficio 1 */}
            <div style={styles.benefitBadge}>
              <FaCheckCircle style={styles.badgeIcon} />
              <span>Sin comisiones el primer mes</span>
            </div>
            {/* Beneficio 2 */}
            <div style={styles.benefitBadge}>
              <FaCheckCircle style={styles.badgeIcon} />
              <span>Alcance local garantizado</span>
            </div>
            {/* Beneficio 3 */}
            <div style={styles.benefitBadge}>
              <FaCheckCircle style={styles.badgeIcon} />
              <span>Panel de administración</span>
            </div>
          </div>
        </div>

        {/* ========================================
            TARJETA DEL FORMULARIO
            ======================================== */}
        <div style={styles.formCard}>
          {/* Caja de error general - solo se muestra si hay un error general */}
          {errores.general && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠</span>
              <span>{errores.general}</span>
            </div>
          )}

          {/* FORMULARIO PRINCIPAL */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* ========================================
                FILA 1: NOMBRE Y CORREO
                ======================================== */}
            <div style={styles.row}>
              {/* CAMPO: Nombre de la Empresa */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre de la Empresa *</label>
                <div style={{
                  ...styles.inputBox,
                  // Si este campo está enfocado, aplicamos estilos especiales
                  ...(focusedInput === 'nombre' ? styles.inputBoxFocused : {}),
                  // Si hay error en este campo, aplicamos estilos de error
                  ...(errores.nombre ? styles.inputBoxError : {})
                }}>
                  {/* Ícono de edificio */}
                  <FaBuilding style={styles.inputIcon} />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('nombre')}
                    onBlur={() => setFocusedInput('')}
                    style={styles.input}
                    placeholder="Ej: Café Aroma Central"
                  />
                </div>
                {/* Mensaje de error específico del campo (si existe) */}
                {errores.nombre && <small style={styles.errorText}>{errores.nombre[0]}</small>}
              </div>

              {/* CAMPO: Correo Corporativo */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Corporativo *</label>
                <div style={{
                  ...styles.inputBox,
                  ...(focusedInput === 'correo' ? styles.inputBoxFocused : {}),
                  ...(errores.correo ? styles.inputBoxError : {})
                }}>
                  {/* Ícono de sobre */}
                  <FaEnvelope style={styles.inputIcon} />
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('correo')}
                    onBlur={() => setFocusedInput('')}
                    style={styles.input}
                    placeholder="empresa@correo.com"
                  />
                </div>
                {errores.correo && <small style={styles.errorText}>{errores.correo[0]}</small>}
              </div>
            </div>

            {/* ========================================
                FILA 2: NIT Y TELÉFONO
                ======================================== */}
            <div style={styles.row}>
              {/* CAMPO: NIT / Identificación */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>NIT / Identificación</label>
                <div style={{
                  ...styles.inputBox,
                  ...(focusedInput === 'nit' ? styles.inputBoxFocused : {})
                }}>
                  {/* Ícono de tarjeta de ID */}
                  <FaIdCard style={styles.inputIcon} />
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('nit')}
                    onBlur={() => setFocusedInput('')}
                    style={styles.input}
                    placeholder="123456789-0"
                  />
                </div>
              </div>

              {/* CAMPO: Teléfono de Contacto */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Teléfono de Contacto *</label>
                <div style={{
                  ...styles.inputBox,
                  ...(focusedInput === 'telefono' ? styles.inputBoxFocused : {}),
                  ...(errores.telefono ? styles.inputBoxError : {})
                }}>
                  {/* Ícono de teléfono */}
                  <FaPhone style={styles.inputIcon} />
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('telefono')}
                    onBlur={() => setFocusedInput('')}
                    style={styles.input}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errores.telefono && <small style={styles.errorText}>{errores.telefono[0]}</small>}
              </div>
            </div>

            {/* ========================================
                CAMPO: DIRECCIÓN (ANCHO COMPLETO)
                ======================================== */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Dirección Física *</label>
              <div style={{
                ...styles.inputBox,
                ...(focusedInput === 'direccion' ? styles.inputBoxFocused : {}),
                ...(errores.direccion ? styles.inputBoxError : {})
              }}>
                {/* Ícono de marcador de mapa */}
                <FaMapMarkerAlt style={styles.inputIcon} />
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('direccion')}
                  onBlur={() => setFocusedInput('')}
                  style={styles.input}
                  placeholder="Calle 123 #45-67, Barrio"
                />
              </div>
              {errores.direccion && <small style={styles.errorText}>{errores.direccion[0]}</small>}
            </div>

            {/* ========================================
                CAMPO: DESCRIPCIÓN (TEXTAREA)
                ======================================== */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Descripción de la Empresa *</label>
              <div style={{
                ...styles.textareaBox,
                ...(focusedInput === 'descripcion' ? styles.inputBoxFocused : {}),
                ...(errores.descripcion ? styles.inputBoxError : {})
              }}>
                {/* Ícono de archivo (para descripción) */}
                <FaFileAlt style={styles.textareaIcon} />
                <textarea
                  name="descripcion"
                  rows="4" // 4 líneas de altura
                  value={formData.descripcion}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('descripcion')}
                  onBlur={() => setFocusedInput('')}
                  style={styles.textarea}
                  placeholder="Describe brevemente tu cafetería, especialidades, ambiente..."
                />
              </div>
              {errores.descripcion && <small style={styles.errorText}>{errores.descripcion[0]}</small>}
            </div>

            {/* ========================================
                FILA 3: ARCHIVOS (LOGO Y FOTO)
                ======================================== */}
            <div style={styles.row}>
              {/* CAMPO: Logo Corporativo */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Logo Corporativo *</label>
                <div style={styles.fileUploadBox}>
                  {/* Input de archivo (oculto visualmente) */}
                  {/* key={`logo-${resetKey}`} fuerza a React a recrear el input cuando resetKey cambia */}
                  <input
                    type="file"
                    name="logo"
                    key={`logo-${resetKey}`}
                    onChange={handleChange}
                    accept="image/*" // Solo acepta imágenes
                    style={styles.fileInput}
                    id="logo-upload"
                  />
                  {/* Label que actúa como botón personalizado */}
                  <label htmlFor="logo-upload" style={styles.fileLabel}>
                    {/* Si hay vista previa, mostramos la imagen */}
                    {logoPreview ? (
                      <div style={styles.previewContainer}>
                        <img src={logoPreview} alt="Logo preview" style={styles.previewImage} />
                        <span style={styles.changeText}>Cambiar imagen</span>
                      </div>
                    ) : (
                      /* Si no hay vista previa, mostramos el área de carga */
                      <div style={styles.uploadPlaceholder}>
                        <FaImage style={styles.uploadIcon} />
                        <span style={styles.uploadText}>Subir logo</span>
                        <span style={styles.uploadHint}>PNG, JPG (max 2MB)</span>
                      </div>
                    )}
                  </label>
                  {errores.logo && <small style={styles.errorText}>{errores.logo[0]}</small>}
                </div>
              </div>

              {/* CAMPO: Foto del Local */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Foto del Local</label>
                <div style={styles.fileUploadBox}>
                  {/* Input de archivo (oculto) */}
                  <input
                    type="file"
                    name="foto_local"
                    key={`foto-${resetKey}`}
                    onChange={handleChange}
                    accept="image/*"
                    style={styles.fileInput}
                    id="foto-upload"
                  />
                  {/* Label que actúa como botón personalizado */}
                  <label htmlFor="foto-upload" style={styles.fileLabel}>
                    {/* Si hay vista previa, mostramos la imagen */}
                    {fotoPreview ? (
                      <div style={styles.previewContainer}>
                        <img src={fotoPreview} alt="Foto preview" style={styles.previewImage} />
                        <span style={styles.changeText}>Cambiar imagen</span>
                      </div>
                    ) : (
                      /* Si no hay vista previa, mostramos el área de carga */
                      <div style={styles.uploadPlaceholder}>
                        <FaImage style={styles.uploadIcon} />
                        <span style={styles.uploadText}>Subir foto</span>
                        <span style={styles.uploadHint}>PNG, JPG (max 2MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* ========================================
                BOTÓN DE ENVÍO
                ======================================== */}
            <button
              type="submit"
              disabled={loading} // Deshabilitamos si está cargando
              style={{
                ...styles.submitBtn,
                // Si está cargando, aplicamos estilos de deshabilitado
                ...(loading ? styles.submitBtnDisabled : {})
              }}
              // Efecto hover: cuando el mouse pasa por encima
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = 'translateY(-2px)';
              }}
              // Cuando el mouse sale del botón
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {/* Si está cargando, mostramos spinner y texto "Enviando..." */}
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Enviando solicitud segura...
                </>
              ) : (
                /* Si no está cargando, mostramos el texto normal y flecha */
                <>
                  Enviar Registro
                  <FaArrowRight style={styles.arrowIcon} />
                </>
              )}
            </button>
          </form>

          {/* ========================================
              FOOTER - Nota legal
              ======================================== */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Al enviar este formulario, aceptas los términos y condiciones de Bean Quick Business.
              Un administrador revisará tu solicitud en las próximas 24-48 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ========================================
// ESTILOS - Toda la apariencia visual
// ========================================
const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: `url(${GranosCafe})`, // ← IMAGEN DE FONDO
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    padding: '40px 20px',
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  
  bgCircle1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 94, 60, 0.08) 0%, transparent 70%)',
    top: '-200px',
    right: '-200px',
    pointerEvents: 'none'
  },
  
  bgCircle2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(111, 78, 55, 0.06) 0%, transparent 70%)',
    bottom: '-150px',
    left: '-150px',
    pointerEvents: 'none'
  },
  
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(62, 39, 35, 0.08)'
  },
  
  brandSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
    marginBottom: '30px'
  },
  
  logoCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(165deg, #6F4E37 0%, #8B5E3C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  
  logoIcon: {
    fontSize: '2rem',
    color: '#FFFFFF'
  },
  
  brandTitle: {
    fontSize: '2.2rem', // ← AUMENTADO de 2rem
    fontWeight: '800',
    color: '#3E2723',
    marginBottom: '5px',
    letterSpacing: '-0.5px'
  },
  
  brandSubtitle: {
    fontSize: '1.15rem', // ← AUMENTADO de 1.05rem
    color: '#8D6E63'
  },
  
  benefitsRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  
  benefitBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F5EBE0',
    padding: '10px 18px',
    borderRadius: '50px',
    fontSize: '1rem', // ← AUMENTADO de 0.9rem
    color: '#5D4037',
    fontWeight: '600'
  },
  
  badgeIcon: {
    color: '#8B5E3C',
    fontSize: '1.1rem' // ← AUMENTADO de 1rem
  },
  
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '50px',
    boxShadow: '0 10px 30px rgba(62, 39, 35, 0.08)'
  },
  
  errorBox: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1rem', // ← AUMENTADO de 0.9rem
    fontWeight: '500'
  },
  
  errorIcon: {
    fontSize: '1.2rem' // ← AUMENTADO de 1.1rem
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px'
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  label: {
    fontSize: '1rem', // ← AUMENTADO de 0.9rem
    fontWeight: '600',
    color: '#5D4037',
    letterSpacing: '0.3px'
  },
  
  inputBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: '14px',
    border: '2px solid #E8E0D8',
    transition: 'all 0.3s'
  },
  
  inputBoxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8B5E3C',
    boxShadow: '0 0 0 4px rgba(139, 94, 60, 0.1)'
  },
  
  inputBoxError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2'
  },
  
  inputIcon: {
    position: 'absolute',
    left: '18px',
    color: '#A0816C',
    fontSize: '1.15rem' // ← AUMENTADO de 1.05rem
  },
  
  input: {
    width: '100%',
    padding: '16px 18px 16px 52px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '1.05rem', // ← AUMENTADO de 1rem
    color: '#3E2723',
    outline: 'none',
    fontWeight: '500'
  },
  
  textareaBox: {
    position: 'relative',
    backgroundColor: '#FAFAFA',
    borderRadius: '14px',
    border: '2px solid #E8E0D8',
    transition: 'all 0.3s'
  },
  
  textareaIcon: {
    position: 'absolute',
    left: '18px',
    top: '18px',
    color: '#A0816C',
    fontSize: '1.15rem' // ← AUMENTADO de 1.05rem
  },
  
  textarea: {
    width: '100%',
    padding: '16px 18px 16px 52px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '1.05rem', // ← AUMENTADO de 1rem
    color: '#3E2723',
    outline: 'none',
    fontWeight: '500',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  
  fileUploadBox: {
    position: 'relative'
  },
  
  fileInput: {
    display: 'none'
  },
  
  fileLabel: {
    display: 'block',
    cursor: 'pointer'
  },
  
  uploadPlaceholder: {
    backgroundColor: '#FAFAFA',
    border: '2px dashed #E8E0D8',
    borderRadius: '14px',
    padding: '30px 20px',
    textAlign: 'center',
    transition: 'all 0.3s',
    ':hover': {
      borderColor: '#8B5E3C',
      backgroundColor: '#FFFFFF'
    }
  },
  
  uploadIcon: {
    fontSize: '2.8rem', // ← AUMENTADO de 2.5rem
    color: '#A0816C',
    marginBottom: '10px',
    display: 'block',
    margin: '0 auto 10px'
  },
  
  uploadText: {
    display: 'block',
    fontSize: '1.05rem', // ← AUMENTADO de 0.95rem
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: '5px'
  },
  
  uploadHint: {
    display: 'block',
    fontSize: '0.9rem', // ← AUMENTADO de 0.8rem
    color: '#8D6E63'
  },
  
  previewContainer: {
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    border: '2px solid #E8E0D8'
  },
  
  previewImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    display: 'block'
  },
  
  changeText: {
    display: 'block',
    padding: '10px',
    textAlign: 'center',
    fontSize: '0.95rem', // ← AUMENTADO de 0.85rem
    fontWeight: '600',
    color: '#8B5E3C',
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  
  errorText: {
    color: '#B91C1C',
    fontSize: '0.85rem', // ← AUMENTADO de 0.8rem
    marginLeft: '5px',
    fontWeight: '500'
  },
  
  submitBtn: {
    backgroundColor: '#8B5E3C',
    color: '#FFFFFF',
    padding: '18px',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1.1rem', // ← AUMENTADO de 1.05rem
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 12px 24px rgba(139, 94, 60, 0.25)',
    transition: 'all 0.3s',
    marginTop: '15px'
  },
  
  submitBtnDisabled: {
    backgroundColor: '#A0816C',
    cursor: 'not-allowed',
    boxShadow: '0 8px 16px rgba(139, 94, 60, 0.15)'
  },
  
  arrowIcon: {
    fontSize: '1.1rem' // ← AUMENTADO de 1rem
  },
  
  spinner: {
    width: '18px',
    height: '18px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid #FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  
  footer: {
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '1px solid #E8E0D8'
  },
  
  footerText: {
    fontSize: '0.95rem', // ← AUMENTADO de 0.85rem
    color: '#8D6E63',
    lineHeight: 1.6,
    textAlign: 'center'
  }
};

// ========================================
// ANIMACIÓN DEL SPINNER
// ========================================
// Creamos una hoja de estilos CSS
const styleSheet = document.createElement('style');
// Definimos la animación de rotación (0° a 360°)
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }    /* Inicio */
    100% { transform: rotate(360deg); } /* Fin: vuelta completa */
  }
`;
// Agregamos la animación al documento
document.head.appendChild(styleSheet);

// Exportamos el componente
export default RegistroEmpresa;