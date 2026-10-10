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

## Criar um link público gratuito

O arquivo `render.yaml` prepara o site para publicação como um serviço gratuito no Render:

1. Envie as alterações do projeto para o repositório no GitHub.
2. Crie uma conta em [render.com](https://render.com) e conecte o GitHub.
3. No painel do Render, escolha **New** → **Blueprint**, selecione o repositório `schmitt007/Nocaute` e confirme a criação do serviço `nocaute-ct`.
4. Quando a publicação terminar, abra o endereço `https://nocaute-ct.onrender.com` mostrado no painel e compartilhe esse link.

O Render pode levar alguns instantes para iniciar o serviço depois de um período sem acessos. O endereço gratuito serve para apresentar o projeto; não é preciso comprar um domínio para compartilhar o site.

O armazenamento local do plano gratuito não é persistente. Por isso, os contatos enviados pelo formulário podem ser perdidos quando o serviço reiniciar. Use esse link apenas como prévia do projeto e não como canal de matrícula/recebimento de contatos até configurar armazenamento persistente e avisos de privacidade. Para ativar o botão do WhatsApp, configure `WHATSAPP_NUMBER` nas variáveis de ambiente do serviço no Render.
