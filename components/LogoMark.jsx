// Marca "Tu Equipo IA": ícono de átomo con "AI" al centro.
// Recreado en SVG (en vez de una imagen subida) para que se vea nítido
// en cualquier tamaño, sobre todo achicado en el sidebar.
export default function LogoMark({ size = 17, color = "#ffffff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="4.5">
        <ellipse cx="50" cy="50" rx="42" ry="16" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(120 50 50)" />
      </g>
      <text x="50" y="58" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="26" fill={color}>
        AI
      </text>
    </svg>
  );
}
