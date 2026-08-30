# Deploy — Conta Azul

O código já contém:
- OAuth com state assinado, expiração e nonce de uso único;
- tokens criptografados no SQLite;
- refresh automático;
- sincronização real de contas a receber e a pagar;
- status separado entre "conectado" e "sincronizado";
- CORS restrito ao FRONTEND_URL.

Antes de publicar:
1. Configure um disco/volume persistente e a variável SQLITE_PATH.
2. Gere OAUTH_STATE_SECRET (segredo longo e aleatório).
3. Gere TOKEN_ENCRYPTION_KEY com:
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
4. Crie/abra o aplicativo no Portal do Desenvolvedor da Conta Azul e obtenha CLIENT_ID e CLIENT_SECRET.
5. Depois que a hospedagem fornecer a URL pública, configure:
   FRONTEND_URL=https://SUA_URL_PUBLICA
   CONTAAZUL_REDIRECT_URI=https://SUA_URL_PUBLICA/api/integrations/contaazul/callback
6. Cadastre exatamente essa mesma callback no Portal da Conta Azul.
7. Faça novo deploy/restart.
8. Entre no site > Configurações > Conectar Conta Azul > autorize > Sincronizar agora.

Observação: a URL pública não pode ser criada apenas pelo código; ela é fornecida pelo serviço de hospedagem/deploy.
