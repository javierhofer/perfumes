import { useConfig } from '../contexts/ConfigContext';

export const PrivacidadPage = () => {
  const { config } = useConfig();
  const { datosNegocio } = config;
  const nombreNegocio = datosNegocio.nombre?.trim() || 'Perfumes Roberto';
  const email = datosNegocio.email?.trim();
  const telefono = datosNegocio.telefono?.trim();
  const direccion = datosNegocio.direccion?.trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-semibold mb-2">
            {nombreNegocio}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Política de Privacidad
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Última actualización: 30 de junio de 2026
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 space-y-8 text-[15px] leading-relaxed">
          <section>
            <p>
              En <strong>{nombreNegocio}</strong> valoramos y respetamos la privacidad
              de nuestros clientes y visitantes. Esta Política de Privacidad explica
              cómo recopilamos, utilizamos y protegemos la información que nos brindás
              al utilizar nuestro sitio web, redes sociales o cualquier otro medio de
              contacto.
            </p>
            <p className="mt-3">
              Al utilizar nuestros servicios, el usuario presta su consentimiento
              libre, informado y expreso para el tratamiento de sus datos personales
              conforme a los términos aquí descriptos y a la Ley 25.326 de Protección
              de los Datos Personales (Argentina).
            </p>
          </section>

          <Seccion numero="1" titulo="Información que recopilamos">
            <p>Podemos recopilar la siguiente información:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nombre y apellido.</li>
              <li>Dirección de correo electrónico.</li>
              <li>Número de teléfono.</li>
              <li>Dirección de envío y facturación.</li>
              <li>Información relacionada con pedidos y compras.</li>
              <li>Cualquier otro dato que el usuario decida proporcionar voluntariamente.</li>
            </ul>
          </Seccion>

          <Seccion numero="2" titulo="Uso de la información">
            <p>La información recopilada podrá utilizarse para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Gestionar pedidos y entregas.</li>
              <li>Brindar atención al cliente.</li>
              <li>Responder consultas y solicitudes.</li>
              <li>
                Enviar información sobre productos, promociones o novedades (cuando el
                usuario lo autorice).
              </li>
              <li>Mejorar nuestros productos, servicios y la experiencia del usuario.</li>
              <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>
          </Seccion>

          <Seccion numero="3" titulo="Conservación de los datos">
            <p>
              Los datos personales se conservan mientras se mantenga la relación
              comercial y durante el plazo legal aplicable. Una vez cumplido el
              propósito, los datos son eliminados o anonimizados, salvo disposición
              legal en contrario.
            </p>
          </Seccion>

          <Seccion numero="4" titulo="Protección de los datos">
            <p>
              Implementamos medidas de seguridad razonables para proteger la
              información personal contra accesos no autorizados, pérdidas,
              alteraciones o divulgaciones indebidas.
            </p>
            <p className="mt-2">
              Si bien trabajamos para proteger los datos, ningún sistema de
              transmisión o almacenamiento electrónico puede garantizar seguridad
              absoluta.
            </p>
          </Seccion>

          <Seccion numero="5" titulo="Compartición de información">
            <p>No vendemos ni comercializamos datos personales.</p>
            <p className="mt-2">
              La información podrá compartirse únicamente cuando sea necesario para:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Procesar pagos.</li>
              <li>Realizar envíos mediante empresas de logística.</li>
              <li>
                Cumplir obligaciones legales o requerimientos de autoridades
                competentes.
              </li>
            </ul>
          </Seccion>

          <Seccion numero="6" titulo="WhatsApp y servicios de terceros">
            <p>
              Este sitio utiliza enlaces a WhatsApp para facilitar el contacto con
              nuestros clientes. Al hacer clic en un enlace de WhatsApp, el usuario
              es redirigido a la plataforma operada por <strong>WhatsApp LLC</strong>{' '}
              (Meta Platforms, Inc.), donde rigen las{' '}
              <a
                href="https://www.whatsapp.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                políticas de privacidad de WhatsApp
              </a>
              . La información que el usuario comparta una vez en WhatsApp se rige por
              los términos de dicho servicio y no por esta política.
            </p>
          </Seccion>

          <Seccion numero="7" titulo="Cookies">
            <p>
              Nuestro sitio puede utilizar cookies y tecnologías similares para
              mejorar la navegación, analizar estadísticas de uso y optimizar la
              experiencia del usuario.
            </p>
            <p className="mt-2">
              El usuario puede configurar su navegador para rechazar las cookies,
              aunque algunas funcionalidades del sitio podrían verse afectadas.
            </p>
          </Seccion>

          <Seccion numero="8" titulo="Derechos del usuario">
            <p>
              Conforme a la Ley 25.326, el titular de los datos podrá ejercer en
              cualquier momento sus derechos de acceso, rectificación, actualización,
              supresión y oposición. Para ello, podrá solicitar:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acceder a sus datos personales.</li>
              <li>Corregir información incorrecta o desactualizada.</li>
              <li>Solicitar la eliminación de sus datos cuando corresponda.</li>
              <li>Revocar el consentimiento para determinadas comunicaciones.</li>
            </ul>
            <p className="mt-2">
              En caso de considerarlo necesario, el usuario podrá interponer una
              denuncia ante la Agencia de Acceso a la Información Pública (AAIP),
              autoridad de aplicación de la Ley 25.326.
            </p>
          </Seccion>

          <Seccion numero="9" titulo="Enlaces a sitios de terceros">
            <p>
              Nuestro sitio puede contener enlaces a páginas externas. No somos
              responsables por las prácticas de privacidad ni por el contenido de
              dichos sitios.
            </p>
          </Seccion>

          <Seccion numero="10" titulo="Cambios en esta política">
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad
              cuando sea necesario. Las modificaciones entrarán en vigencia desde su
              publicación en esta página.
            </p>
          </Seccion>

          <Seccion numero="11" titulo="Contacto">
            <p>
              Si tenés consultas sobre esta Política de Privacidad o sobre el
              tratamiento de tus datos personales, podés comunicarte con nosotros a
              través de los siguientes canales:
            </p>
            <ul className="mt-3 space-y-1 text-slate-700">
              <li>
                <strong>{nombreNegocio}</strong>
              </li>
              {direccion && <li>Dirección: {direccion}</li>}
              {telefono && <li>Teléfono: {telefono}</li>}
              {email && (
                <li>
                  Email:{' '}
                  <a
                    href={`mailto:${email}`}
                    className="text-brand-600 hover:underline"
                  >
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </Seccion>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-500">
          <p>
            {nombreNegocio} · Comprometidos con la protección de tu privacidad y la
            seguridad de tu información.
          </p>
        </footer>
      </div>
    </div>
  );
};

interface SeccionProps {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}

const Seccion = ({ numero, titulo, children }: SeccionProps) => (
  <section>
    <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3">
      {numero}. {titulo}
    </h2>
    <div className="text-slate-700">{children}</div>
  </section>
);