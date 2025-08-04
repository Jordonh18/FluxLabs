from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from database import SessionLocal
from models import ScheduledTask, Lab
from lab_service import LabService
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Scheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.lab_service = LabService()

    def start(self):
        """Start the scheduler"""
        # Check for expired labs every 5 minutes
        self.scheduler.add_job(
            func=self.check_expired_labs,
            trigger=IntervalTrigger(minutes=5),
            id='check_expired_labs',
            name='Check for expired labs'
        )
        
        self.scheduler.start()
        logger.info("Scheduler started")

    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")

    def check_expired_labs(self):
        """Check for and process expired labs"""
        db = SessionLocal()
        try:
            # Find pending expiry tasks that are due
            now = datetime.utcnow()
            tasks = db.query(ScheduledTask).filter(
                ScheduledTask.task_type == "expire_lab",
                ScheduledTask.status == "pending",
                ScheduledTask.execute_at <= now
            ).all()

            for task in tasks:
                try:
                    # Run the expiry task
                    asyncio.run(self.lab_service.expire_lab(db, task.target_id))
                    task.status = "completed"
                    logger.info(f"Expired lab {task.target_id}")
                except Exception as e:
                    task.status = "failed"
                    logger.error(f"Failed to expire lab {task.target_id}: {e}")

            db.commit()

        except Exception as e:
            logger.error(f"Error in check_expired_labs: {e}")
        finally:
            db.close()

# Global scheduler instance
scheduler = Scheduler()
