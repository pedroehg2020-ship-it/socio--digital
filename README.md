# Sócio Digital — reconstrução V4

Esta versão acrescenta uma camada de **integrações reais pronta para configuração**:

- OpenAI Responses API para o módulo “Falar com IA”;
- WhatsApp via endpoint HTTPS configurável no padrão de envio da Cloud API;
- webhook de WhatsApp;
- status das integrações;
- fallback local/mock para que o sistema continue funcionando sem credenciais;
- Dockerfile e configuração inicial de deploy.

## O que ainda exige ação da proprietária
Eu não posso ativar serviços externos sem contas/credenciais próprias. Para ligar de fato:
1. criar/usar uma chave de API da OpenAI;
2. criar/configurar a conta/provedor de WhatsApp;
3. colocar essas credenciais nas variáveis de ambiente da hospedagem;
4. escolher a hospedagem e fazer o deploy.

Nenhuma credencial do projeto do Henrique foi incluída ou reutilizada.
