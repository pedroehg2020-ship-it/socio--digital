import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import db
from radar_engine import run_full_radar

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def recompute_all_companies():
    companies = await db.companies.find({"has_data": True}).to_list(1000)
    for c in companies:
        try:
            await run_full_radar(str(c["_id"]))
        except Exception as e:
            logger.error(f"Radar recompute failed for company {c['_id']}: {e}")


def start_scheduler():
    scheduler.add_job(recompute_all_companies, "interval", hours=6, id="radar_recompute", replace_existing=True)
    scheduler.start()
