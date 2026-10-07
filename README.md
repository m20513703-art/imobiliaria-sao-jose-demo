# Imobiliária São José — demonstração integrada

Site público e painel demonstrativo para a Imobiliária São José, em Divinolândia–SP. O portal usa Supabase para anúncios e pedidos de interesse; o painel exige sessão autenticada. Os imóveis, valores, contatos, logo e fachada são fictícios ou ilustrativos — não use como operação comercial.

## Arquivos do site

- `index.html` — portal público e busca de anúncios.
- `painel.html` — painel autenticado para imóveis e interessados.
- `styles.css` — identidade visual em preto e laranja.
- `app.js` — leitura pública de anúncios, envio de interessados, login e operações do painel com Supabase.
- `schema.sql` — tabelas, RLS, permissões e os três imóveis fictícios iniciais.
- `logo-sao-jose.svg` — logo ilustrativo criado para a demonstração.
- `fachada-imobiliaria-ilustrativa.webp` — fachada gerada para esta prévia e identificada no site como ilustrativa.
- `casa-ficticia.webp`, `apartamento-ficticio.webp` — fotos ilustrativas de imóveis fictícios.
- Arquivos `.png` das casas/apartamento — imagens originais de apoio da demonstração.

## Banco, sincronização e segurança

O Supabase contém `properties`, `leads` e a lista privada `admin_users`, com Row Level Security habilitado e cadastro público desativado. Visitantes podem consultar anúncios ativos e enviar solicitações fictícias; somente a conta individualmente incluída em `admin_users` pode gerenciar anúncios e consultar interessados. A chave publishable usada no navegador é pública e limitada pelas políticas RLS; nunca adicionar chaves secretas ao repositório.

Anúncios e solicitações ficam guardados online e sincronizam entre aparelhos. O painel atualiza ao abrir, ao voltar para a janela e a cada 30 segundos. O formulário informa que esta é uma demonstração e solicita consentimento; use apenas dados fictícios. Para receber contatos reais, revisar privacidade, retenção, segurança, textos legais e dados da imobiliária.

## Conteúdo de demonstração

O logo, a fachada, os anúncios e valores são ilustrativos. Instagram `@imobiliariasaojose.demo`, WhatsApp e e-mail `.invalid` são placeholders não ativos — os botões informam que nenhum canal real será aberto. O mapa aponta para o endereço demonstrativo Rua Guanabara, 26, Centro, Divinolândia–SP. A marca deve substituir os contatos e imagens antes de uma operação comercial.

© MM Sistemas & Tecnologia 2026
