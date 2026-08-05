import io
import unicodedata
from datetime import datetime
import pandas as pd

from models import TransactionDoc, ProductDoc


def _normalize(col) -> str:
    col = str(col).strip().lower()
    col = "".join(c for c in unicodedata.normalize("NFKD", col) if not unicodedata.combining(c))
    return col.replace(" ", "_")


def _read_csv(content: bytes) -> pd.DataFrame:
    for encoding in ("utf-8", "latin-1"):
        for sep in (",", ";"):
            try:
                df = pd.read_csv(io.BytesIO(content), sep=sep, encoding=encoding)
                if len(df.columns) > 1:
                    df.columns = [_normalize(c) for c in df.columns]
                    return df
            except Exception:
                continue
    raise ValueError("Não foi possível ler o arquivo. Verifique se é um CSV válido.")


def _find_col(df: pd.DataFrame, aliases):
    for alias in aliases:
        if alias in df.columns:
            return alias
    return None


def _parse_date(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.strftime("%Y-%m-%d")
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    try:
        return pd.to_datetime(s, dayfirst=True).strftime("%Y-%m-%d")
    except Exception:
        return None


def _parse_amount(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return None
        return float(value)
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None
    s = s.replace("R$", "").replace(" ", "")
    if "," in s and s.count(",") == 1 and s.rfind(",") > s.rfind("."):
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


TRANSACTION_ALIASES = {
    "date": ["data", "date", "dt", "data_transacao"],
    "description": ["descricao", "description", "historico", "discriminacao"],
    "amount": ["valor", "amount", "valor_total", "value"],
    "type": ["tipo", "type"],
    "category": ["categoria", "category"],
    "customer": ["cliente", "customer", "cliente_nome"],
    "status": ["status", "situacao"],
    "due_date": ["vencimento", "due_date", "data_vencimento"],
}

DESPESA_TOKENS = {"despesa", "saida", "debito", "expense", "pagamento"}
PENDENTE_TOKENS = {"pendente", "pending", "aberto", "a_pagar", "a_receber", "em_aberto"}


def parse_transactions_csv(content: bytes, company_id: str):
    df = _read_csv(content)
    col_date = _find_col(df, TRANSACTION_ALIASES["date"])
    col_desc = _find_col(df, TRANSACTION_ALIASES["description"])
    col_amount = _find_col(df, TRANSACTION_ALIASES["amount"])
    col_type = _find_col(df, TRANSACTION_ALIASES["type"])
    col_category = _find_col(df, TRANSACTION_ALIASES["category"])
    col_customer = _find_col(df, TRANSACTION_ALIASES["customer"])
    col_status = _find_col(df, TRANSACTION_ALIASES["status"])
    col_due = _find_col(df, TRANSACTION_ALIASES["due_date"])

    if not col_date or not col_amount:
        raise ValueError("O arquivo precisa conter ao menos as colunas 'data' e 'valor'.")

    results = []
    for _, row in df.iterrows():
        date = _parse_date(row.get(col_date))
        amount_raw = _parse_amount(row.get(col_amount))
        if date is None or amount_raw is None:
            continue
        if col_type and row.get(col_type) is not None and not pd.isna(row.get(col_type)):
            type_val = _normalize(row.get(col_type))
            ttype = "despesa" if type_val in DESPESA_TOKENS else "receita"
            amount = abs(amount_raw)
        else:
            ttype = "despesa" if amount_raw < 0 else "receita"
            amount = abs(amount_raw)
        description = str(row.get(col_desc)).strip() if col_desc and pd.notna(row.get(col_desc)) else "Sem descrição"
        category = str(row.get(col_category)).strip() if col_category and pd.notna(row.get(col_category)) else "Outros"
        customer = str(row.get(col_customer)).strip() if col_customer and pd.notna(row.get(col_customer)) else None
        status_val = _normalize(row.get(col_status)) if col_status and pd.notna(row.get(col_status)) else "pago"
        status = "pendente" if status_val in PENDENTE_TOKENS else "pago"
        due_date = _parse_date(row.get(col_due)) if col_due else None
        results.append(
            TransactionDoc(
                company_id=company_id,
                date=date,
                description=description,
                amount=round(amount, 2),
                type=ttype,
                category=category,
                status=status,
                due_date=due_date,
                customer_name=customer,
            )
        )
    return results


INVENTORY_ALIASES = {
    "name": ["produto", "product", "item", "nome"],
    "stock": ["estoque_atual", "estoque", "quantidade", "stock", "quantidade_estoque"],
    "min_stock": ["estoque_minimo", "minimo", "min_stock", "estoque_seguranca"],
    "avg_sales": ["vendas_mes", "vendas_mensal", "media_vendas", "vendas_media_mensal"],
}


def parse_inventory_csv(content: bytes, company_id: str):
    df = _read_csv(content)
    col_name = _find_col(df, INVENTORY_ALIASES["name"])
    col_stock = _find_col(df, INVENTORY_ALIASES["stock"])
    col_min = _find_col(df, INVENTORY_ALIASES["min_stock"])
    col_avg = _find_col(df, INVENTORY_ALIASES["avg_sales"])

    if not col_name or not col_stock:
        raise ValueError("O arquivo precisa conter ao menos as colunas 'produto' e 'estoque_atual'.")

    results = []
    for _, row in df.iterrows():
        name = str(row.get(col_name)).strip() if pd.notna(row.get(col_name)) else None
        if not name:
            continue
        stock = _parse_amount(row.get(col_stock)) or 0
        min_stock = (_parse_amount(row.get(col_min)) or 0) if col_min else 0
        avg_sales = (_parse_amount(row.get(col_avg)) or 0) if col_avg else 0
        results.append(
            ProductDoc(
                company_id=company_id,
                name=name,
                stock_qty=stock,
                min_stock=min_stock,
                avg_monthly_sales=avg_sales,
            )
        )
    return results
