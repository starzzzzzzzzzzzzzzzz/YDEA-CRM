/**
 * Identidade visual "ydea" — rebranding (Brandbook, ago/2026).
 *
 * Isotipo: traço único fundindo a letra "y" ao contorno de um balão de
 * ideias, com três faíscas no topo. Gradiente diagonal teal → azul.
 * Paleta oficial: #3ec6ac (teal) · #12b6c1 (ciano) · #1b7cb2 (azul).
 *
 * Observação: o manual não especifica uma família tipográfica própria
 * para o wordmark (apenas descreve "geométrica, caixa baixa, cantos
 * suavizados"). Por isso o wordmark usa a fonte display já adotada no
 * produto (Space Grotesk, minúscula), que atende a essas características.
 * Se a Ydea tiver o arquivo da fonte customizada, é só trocar aqui.
 */

function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gradientId = "ydea-mark-gradient";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ydea"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="10" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3ec6ac" />
          <stop offset="50%" stopColor="#12b6c1" />
          <stop offset="100%" stopColor="#1b7cb2" />
        </linearGradient>
      </defs>

      {/* faíscas */}
      <g stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round">
        <path d="M30 8 L34 20" />
        <path d="M44 4 L44 17" />
        <path d="M58 9 L52 20" />
      </g>

      {/* traço único: y + balão de ideias */}
      <path
        d="M74 34
           A28 28 0 1 1 33 30
           L33 58
           A17 17 0 0 0 60 70
           L60 88
           L46 74"
        stroke={`url(#${gradientId})`}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  size = 28,
  showWordmark = true,
  showDescriptor = false,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  showDescriptor?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className="font-display font-bold text-text-dark lowercase"
            style={{ fontSize: size * 0.62 }}
          >
            ydea
          </span>
          {showDescriptor && (
            <>
              <span className="h-4 w-px bg-border" />
              <span className="text-[10px] leading-tight text-text-gray">
                Engenharia e
                <br />
                energia solar
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { LogoMark };
