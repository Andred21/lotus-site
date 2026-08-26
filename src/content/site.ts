/**
 * Conteúdo institucional, verbatim de `docs/inventario/02-conteudo.md`. Não
 * importa React, componente nem integração — a direção de dependências é
 * catraca de lint em eslint.config.js. Nada aqui é traduzido, corrigido ou
 * completado: a inconsistência entre o rótulo `ALUMNOS` e o corpo sobre
 * `888 horas`, a caixa de `NUESTRos cursos` e o ano `2022` do rodapé são do
 * site original e ficam como estão (decisão D2 da spec).
 */
export const site = {
  name: 'Lotus OTEC',
  locale: 'es-CL',
  logoAlt: 'LOTUS',

  nav: [
    { label: 'Inicio', href: '/' },
    { label: 'Quienes Somos', href: '#Somos' },
    { label: 'Cursos', href: '#Cursos' },
    { label: 'Contacto', href: '#Contacto' },
  ],

  hero: {
    kicker: 'ENTRENAMIENTO PARA TRABAJOS EN INSTALACIONES ENERGIZADAS',
    title: 'LOTUS OTEC',
    subtitle: 'SERVICIOS DE CAPACITACIÓN Y CERTIFICACIÓN',
    body: 'Somos especialistas en entrenamiento en servicios de Alta y Media Tensión para líneas de transmisión y subestaciones.',
    cta: { label: 'Learn More', href: '' },
  },

  institucional: {
    body: 'En LOTUS OTEC tenemos una oferta especializada en satisfacer las necesidades de capacitación de la industria eléctrica. Somos expertos en las áreas de Seguridad, Entrenamiento y Certificación en métodos de trabajo con líneas energizadas a contacto, distancia y a potencial.',
    logoAlt: 'Logotipo de LOTUS OTEC',
  },

  destaques: [
    {
      label: 'ENERGIZADAS',
      body: 'Somos especialistas en entrenamiento de métodos de trabajo en Instalaciones Energizadas.',
    },
    {
      label: 'ALUMNOS',
      body: 'A la fecha hemos realizado un total de 888 horas de capacitación para la industria de la energía.',
    },
    {
      label: 'CERTIFICACIÓN',
      body: 'Estamos certificados bajo la norma NCH 2728:2015 como consta en certificado N° CA-751 y registro INN: A-10981.',
    },
  ],

  cursos: {
    heading: 'NUESTRos cursos',
    intro:
      'A continuación presentamos los principales curso de nuestra oferta. Si desea conocer toda nuestra oferta de cursos, por favor contáctenos.',
    items: [
      {
        nombre: 'Curso Especialistas Líneas Vivas en Media Tensión',
        imageAlt: 'Puesto de trabajo con computador portátil',
      },
      {
        nombre: 'Curso Especialistas en Líneas Vivas en Alta Tensión',
        imageAlt: 'Especialista trabajando en una línea de alta tensión',
      },
      {
        nombre: 'Curso Supervisor de Trabajos de Líneas Vivas',
        imageAlt: 'Supervisor de trabajos en líneas vivas sobre un poste',
      },
    ],
    cta: { label: 'See More', href: '#' },
  },

  contacto: {
    heading: 'CONTÁCTENOS',
    body: 'Contactese con nosotros, déjenos mensaje describiendo su requerimiento y le contactaremos a la brevedad o escribanos al siguiente correo: ',
    email: 'contacto@lotusotec.cl',
    form: {
      fields: [
        { name: 'nombre', label: 'Nombre Completo', type: 'text' },
        { name: 'email', label: 'Correo Electrónico', type: 'text' },
        { name: 'empresa', label: 'Empresa', type: 'text' },
        { name: 'mensaje', label: 'Mensaje', type: 'textarea' },
      ],
      submit: 'Enviar',
    },
  },

  footer: {
    copyright: 'Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.',
  },
} as const
