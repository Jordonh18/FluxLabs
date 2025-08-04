from sqlalchemy.orm import Session
from models import UserProfile, UserSettings

def get_user_profile(db: Session, user_id: int):
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

def create_user_profile(db: Session, user_id: int, first_name: str = None, last_name: str = None):
    profile = UserProfile(user_id=user_id, first_name=first_name, last_name=last_name)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def update_user_profile(db: Session, user_id: int, first_name: str = None, last_name: str = None):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        return create_user_profile(db, user_id, first_name, last_name)
    
    if first_name is not None:
        profile.first_name = first_name
    if last_name is not None:
        profile.last_name = last_name
    
    db.commit()
    db.refresh(profile)
    return profile

def get_user_settings(db: Session, user_id: int):
    return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

def create_user_settings(db: Session, user_id: int, auto_extend_labs: bool = False, default_duration: int = 60):
    settings = UserSettings(user_id=user_id, auto_extend_labs=auto_extend_labs, default_duration=default_duration)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings

def update_user_settings(db: Session, user_id: int, auto_extend_labs: bool = None, default_duration: int = None):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        return create_user_settings(db, user_id, auto_extend_labs or False, default_duration or 60)
    
    if auto_extend_labs is not None:
        settings.auto_extend_labs = auto_extend_labs
    if default_duration is not None:
        settings.default_duration = default_duration
    
    db.commit()
    db.refresh(settings)
    return settings
