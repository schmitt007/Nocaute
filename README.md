# Nocaute CT

Site responsivo do Centro de Treinamento Nocaute com um servidor Node.js sem dependências externas. A navegação está dividida em páginas: início, O CT, modalidades, horários e contato. O botão de tema alterna entre os modos claro e escuro e salva a preferência no navegador.

## Rodar no computador

1. Instale o Node.js 20 ou superior.
2. No Explorador de Arquivos, abra esta pasta e dê dois cliques em `iniciar.bat`.
3. Deixe a janela aberta e acesse [http://localhost:3000](http://localhost:3000).

As páginas do site também estão disponíveis diretamente em `/ct.html`, `/modalidades.html`, `/horarios.html` e `/contato.html`. Na página de modalidades, cada card abre uma descrição e permite seguir para o contato com a modalidade já selecionada.

Se preferir usar o terminal, abra-o nesta pasta e execute `node server.js`. Não é necessário usar `npm install`. Para desenvolvimento com reinicialização automática, execute `node --watch server.js`.

## Formulário e contatos

O formulário valida os dados e grava cada contato como uma linha JSON em `data/leads.jsonl`. Esse arquivo contém dados pessoais: não o publique nem o envie para controle de versão. O servidor aplica limites de tamanho, validação e limitação básica de tentativas.

Para ativar o link do WhatsApp, copie `.env.example` para `.env` e preencha `WHATSAPP_NUMBER` com código do país, DDD e número, somente dígitos. Exemplo: `5511999999999`. Reinicie o servidor após alterar a configuração.

## Publicar na internet

O servidor escuta na porta definida pela hospedagem (ou na 3000 local), então pode ser publicado em um serviço que aceite aplicações Node.js. Configure `WHATSAPP_NUMBER` nas variáveis de ambiente da hospedagem e use `node server.js` como comando de inicialização.

Para manter os contatos entre reinicializações e novas versões, configure armazenamento persistente para a pasta `data`. Algumas hospedagens apagam arquivos locais quando a aplicação reinicia. Antes de divulgar o formulário publicamente, configure HTTPS, armazenamento persistente e proteção antispam apropriada.

Um domínio público precisa ser registrado e apontado para uma hospedagem. O código permite executar o site localmente, mas criar um domínio público exige uma conta de hospedagem e acesso a um domínio registrado.
