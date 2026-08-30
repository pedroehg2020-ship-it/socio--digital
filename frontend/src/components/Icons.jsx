/**
 * Ícones em SVG inline — evita uma dependência de biblioteca de ícones e
 * mantém o bundle pequeno. Todos herdam `currentColor`.
 */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const Icon = ({ name, size = 18, ...rest }) => {
  const paths = SHAPES[name] || SHAPES.dot;
  return (
    <svg {...base(size)} {...rest} aria-hidden="true">
      {paths}
    </svg>
  );
};

const SHAPES = {
  dot: <circle cx="12" cy="12" r="3" />,
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.2 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.4" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M12 3v3M21 12h-3M3 12h3M18.4 5.6l-2.1 2.1" />
      <path d="M3.5 18a9.5 9.5 0 1 1 17 0" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M16 12h5v-3h-5a1.5 1.5 0 0 0 0 3Z" />
    </>
  ),
  invoice: (
    <>
      <path d="M6 2h9l5 5v15H6Z" />
      <path d="M15 2v5h5" />
      <path d="M9.5 12h6M9.5 16h4" />
    </>
  ),
  box: (
    <>
      <path d="M3.3 7.5 12 12l8.7-4.5" />
      <path d="M12 12v9.5" />
      <path d="M20.7 7.4v9.2L12 21.5l-8.7-4.9V7.4L12 2.5Z" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7.5" r="3.3" />
      <path d="M22 20v-1.6a4 4 0 0 0-3-3.85" />
      <path d="M16.5 4.4a4 4 0 0 1 0 6.2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .33-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.33H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.33 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47 1Z" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12Z" />,
  robot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4.5M9 4.5h6" />
      <circle cx="9.2" cy="14" r="1.2" />
      <circle cx="14.8" cy="14" r="1.2" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-8 8H4l2-3.3A8 8 0 1 1 21 12Z" />,
  trendUp: (
    <>
      <path d="M3 17 9.5 10.5l4 4L21 7" />
      <path d="M15 7h6v6" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3 7 9.5 13.5l4-4L21 17" />
      <path d="M15 17h6v-6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 22 20H2Z" />
      <path d="M12 10v4M12 17.2v.1" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 20 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  logout: (
    <>
      <path d="M15 17.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5" />
      <path d="M10 12h11M18 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7Z" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12 18.4 5.6" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10h18M5 10v9M19 10v9M9.5 10v9M14.5 10v9M3 21h18M12 3l9 5H3Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.4-4.6A8.4 8.4 0 1 1 20.5 11.6Z" />
      <path d="M8.9 8.4c.3-.1.7 0 .9.4l.6 1.2c.1.3 0 .6-.2.8l-.4.4c.5 1 1.3 1.8 2.3 2.3l.4-.4c.2-.2.5-.3.8-.2l1.2.6c.4.2.5.6.4.9-.2.8-1 1.3-1.9 1.2-2.6-.4-4.7-2.5-5.2-5.1-.1-.9.4-1.7 1.1-2.1Z" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 1 0-5.7-5.7l-1.3 1.3" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 1 0 5.7 5.7l1.3-1.3" />
    </>
  ),
  doc: (
    <>
      <path d="M6 2h8l5 5v15H6Z" />
      <path d="M14 2v5h5M9 13h7M9 17h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  arrowDownLeft: (
    <>
      <path d="M17 7 7 17" />
      <path d="M16 17H7V8" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  send: <path d="M21 3 3 10.5l7.5 3L14 21Z" />,
  shield: (
    <>
      <path d="M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10.5-4.6-1.9-8-5.5-8-10.5v-6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.6 8 18 9.6 13.6 11 12 15.5 10.4 11 6 9.6 10.4 8Z" />
      <path d="M18.5 16.5 19.2 18.4 21 19l-1.8.7-.7 1.9-.7-1.9L16 19l1.8-.6Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
      <path d="M3 21v-5h5M21 3v5h-5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7.5 11 4.5 4.5 4.5-4.5" />
      <path d="M4 20h16" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8Z" />,
  tag: (
    <>
      <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5L21 12.5 12.5 21Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v11H3ZM14 9.5h4l3 3.2V17h-7Z" />
      <circle cx="7" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </>
  ),
};

export default Icon;
