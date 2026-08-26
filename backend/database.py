import os
import logging

logger = logging.getLogger(__name__)

mongo_url = os.environ.get("MONGO_URL", "").strip()
db_name = os.environ.get("DB_NAME", "socio_digital")

if mongo_url:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        logger.info(f"Conectado ao MongoDB externo via MONGO_URL ({db_name})")
    except Exception as e:
        logger.warning(f"Erro ao conectar ao MongoDB externo: {e}. Inicializando banco de demonstração em memória.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[db_name]
else:
    logger.info("MONGO_URL não configurada. Inicializando banco de dados em memória para demonstração.")
    from mongomock_motor import AsyncMongoMockClient
    client = AsyncMongoMockClient()
    db = client[db_name]
