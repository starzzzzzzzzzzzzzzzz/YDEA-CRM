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

/**
 * Identidade visual "ydea" — rebranding (Brandbook, ago/2026).
 * Isotipo oficial (arquivo em /public/logo.png) + paleta teal → azul:
 * #3ec6ac (teal) · #12b6c1 (ciano) · #1b7cb2 (azul).
 *
 * Observação: o manual não especifica uma família tipográfica própria
 * para o wordmark (apenas descreve "geométrica, caixa baixa, cantos
 * suavizados"). Por isso o wordmark usa a fonte display já adotada no
 * produto (Sora, minúscula), que atende a essas características.
 * Se a Ydea tiver o arquivo da fonte customizada, é só trocar aqui.
 */

function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="ydea"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
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
