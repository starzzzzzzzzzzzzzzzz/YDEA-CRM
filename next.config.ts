import type { NextConfig } from "next";

// firebase-admin NÃO fica em serverExternalPackages de propósito: na Vercel, como pacote externo,
// ele carrega o jose (módulo ESM) via require() e a função cai com ERR_REQUIRE_ESM.
// Sem a opção, o Next empacota tudo junto e a incompatibilidade some.
const nextConfig: NextConfig = {};

export default nextConfig;
