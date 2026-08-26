from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import db
from models import UserDoc
from auth import get_current_user
from radar_engine import run_full_radar

router = APIRouter(prefix="/radar", tags=["radar"])


@router.get("/alerts")
async def list_alerts(current_user: UserDoc = Depends(get_current_user), priority: str = None, resolved: bool = False):
    query = {"company_id": current_user.company_id, "resolved": resolved}
    if priority:
        query["priority"] = priority
    docs = await db.alerts.find(query).sort("created_at", -1).to_list(200)
    return [
        {
            "id": str(d["_id"]), "type": d["type"], "priority": d["priority"], "title": d["title"],
            "description": d["description"], "action_label": d.get("action_label"), "action_route": d.get("action_route"),
            "created_at": d["created_at"].isoformat() if hasattr(d["created_at"], "isoformat") else d["created_at"],
        }
        for d in docs
    ]


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user: UserDoc = Depends(get_current_user)):
    result = await db.alerts.update_one({"_id": ObjectId(alert_id), "company_id": current_user.company_id}, {"$set": {"resolved": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    return {"success": True}


@router.post("/recompute")
async def recompute(current_user: UserDoc = Depends(get_current_user)):
    count = await run_full_radar(current_user.company_id)
    return {"alerts_created": count}
