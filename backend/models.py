from datetime import datetime, timezone
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]


class BaseDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    @classmethod
    def from_mongo(cls, doc):
        if doc is None:
            return None
        return cls(**doc)

    def to_mongo(self):
        data = self.model_dump(by_alias=True, exclude_none=True)
        if data.get("_id") is None:
            data.pop("_id", None)
        else:
            data["_id"] = ObjectId(data["_id"])
        return data


class UserDoc(BaseDocument):
    email: str
    password_hash: str
    name: str
    role: str
    company_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyDoc(BaseDocument):
    name: str
    owner_id: str
    has_data: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionDoc(BaseDocument):
    company_id: str
    date: str
    description: str
    amount: float
    type: str
    category: str = "Outros"
    status: str = "pago"
    due_date: Optional[str] = None
    customer_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CustomerDoc(BaseDocument):
    company_id: str
    name: str
    total_spent: float = 0
    purchase_count: int = 0
    first_purchase_date: Optional[str] = None
    last_purchase_date: Optional[str] = None
    status: str = "ativo"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductDoc(BaseDocument):
    company_id: str
    name: str
    stock_qty: float = 0
    min_stock: float = 0
    avg_monthly_sales: float = 0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AlertDoc(BaseDocument):
    company_id: str
    type: str
    priority: str
    title: str
    description: str
    action_label: Optional[str] = None
    action_route: Optional[str] = None
    resolved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessageDoc(BaseDocument):
    company_id: str
    user_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
