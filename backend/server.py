from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
import hashlib
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and password hashing
SECRET_KEY = "strike-crm-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def verify_password(plain_password, hashed_password):
    # Pre-hash with SHA-256 to match the hashing process
    digest = hashlib.sha256(plain_password.encode('utf-8')).digest()
    encoded = base64.b64encode(digest).decode('ascii')
    return pwd_context.verify(encoded, hashed_password)

def get_password_hash(password):
    # Pre-hash with SHA-256 to handle long passwords and ensure bcrypt compatibility
    digest = hashlib.sha256(password.encode('utf-8')).digest()
    encoded = base64.b64encode(digest).decode('ascii')
    return pwd_context.hash(encoded)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: str
    email: str
    name: str
    company: Optional[str] = None
    created_at: datetime

class LeadCreate(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    stage: str = "New Leads"  # Default stage
    priority: str = "medium"  # high, medium, low
    notes: Optional[str] = None

class Lead(BaseModel):
    id: str
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    stage: str
    priority: str
    notes: Optional[str] = None
    user_id: str
    created_at: datetime
    last_interaction: Optional[datetime] = None

class BusinessCardCreate(BaseModel):
    name: str
    title: str
    company: str
    phone: str
    email: str
    website: Optional[str] = None
    template: str = "professional"  # professional, modern, minimal

class BusinessCard(BaseModel):
    id: str
    name: str
    title: str
    company: str
    phone: str
    email: str
    website: Optional[str] = None
    template: str
    qr_code: Optional[str] = None
    user_id: str
    created_at: datetime

class ActivityCreate(BaseModel):
    lead_id: str
    activity_type: str  # call, email, note
    content: str
    outcome: Optional[str] = None  # For calls: answered, missed, declined, callback_needed
    duration: Optional[int] = None  # For calls: duration in minutes

class Activity(BaseModel):
    id: str
    lead_id: str
    activity_type: str
    content: str
    outcome: Optional[str] = None
    duration: Optional[int] = None
    user_id: str
    created_at: datetime

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "_id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "company": user.company,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        company=current_user.get("company"),
        created_at=current_user["created_at"]
    )

# Lead endpoints
@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead_doc = {
        "_id": str(uuid.uuid4()),
        **lead.dict(),
        "user_id": current_user["_id"],
        "created_at": datetime.utcnow(),
        "last_interaction": None
    }
    
    await db.leads.insert_one(lead_doc)
    return Lead(**lead_doc, id=lead_doc["_id"])

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(current_user: dict = Depends(get_current_user)):
    leads = await db.leads.find({"user_id": current_user["_id"]}).to_list(1000)
    return [Lead(**lead, id=lead["_id"]) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"_id": lead_id, "user_id": current_user["_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return Lead(**lead, id=lead["_id"])

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_update: LeadCreate, current_user: dict = Depends(get_current_user)):
    result = await db.leads.update_one(
        {"_id": lead_id, "user_id": current_user["_id"]},
        {"$set": lead_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = await db.leads.find_one({"_id": lead_id})
    return Lead(**updated_lead, id=updated_lead["_id"])

@api_router.patch("/leads/{lead_id}/stage")
async def update_lead_stage(lead_id: str, stage: str, current_user: dict = Depends(get_current_user)):
    valid_stages = ["New Leads", "Contacted", "Follow-up", "Negotiation", "Closed"]
    if stage not in valid_stages:
        raise HTTPException(status_code=400, detail="Invalid stage")
    
    result = await db.leads.update_one(
        {"_id": lead_id, "user_id": current_user["_id"]},
        {"$set": {"stage": stage, "last_interaction": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"success": True}

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"_id": lead_id, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True}

# Business Card endpoints
@api_router.post("/business-card", response_model=BusinessCard)
async def create_business_card(card: BusinessCardCreate, current_user: dict = Depends(get_current_user)):
    # Delete existing card if any
    await db.business_cards.delete_many({"user_id": current_user["_id"]})
    
    card_doc = {
        "_id": str(uuid.uuid4()),
        **card.dict(),
        "user_id": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.business_cards.insert_one(card_doc)
    return BusinessCard(**card_doc, id=card_doc["_id"])

@api_router.get("/business-card", response_model=BusinessCard)
async def get_business_card(current_user: dict = Depends(get_current_user)):
    card = await db.business_cards.find_one({"user_id": current_user["_id"]})
    if not card:
        raise HTTPException(status_code=404, detail="Business card not found")
    return BusinessCard(**card, id=card["_id"])

# Activity endpoints
@api_router.post("/activities", response_model=Activity)
async def create_activity(activity: ActivityCreate, current_user: dict = Depends(get_current_user)):
    # Verify lead belongs to user
    lead = await db.leads.find_one({"_id": activity.lead_id, "user_id": current_user["_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    activity_doc = {
        "_id": str(uuid.uuid4()),
        **activity.dict(),
        "user_id": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.activities.insert_one(activity_doc)
    
    # Update lead's last interaction
    await db.leads.update_one(
        {"_id": activity.lead_id},
        {"$set": {"last_interaction": datetime.utcnow()}}
    )
    
    return Activity(**activity_doc, id=activity_doc["_id"])

@api_router.get("/leads/{lead_id}/activities", response_model=List[Activity])
async def get_lead_activities(lead_id: str, current_user: dict = Depends(get_current_user)):
    # Verify lead belongs to user
    lead = await db.leads.find_one({"_id": lead_id, "user_id": current_user["_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    activities = await db.activities.find({"lead_id": lead_id, "user_id": current_user["_id"]}).sort("created_at", -1).to_list(1000)
    return [Activity(**activity, id=activity["_id"]) for activity in activities]

# Dashboard endpoints
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    
    # Get total leads
    total_leads = await db.leads.count_documents({"user_id": user_id})
    
    # Get leads by stage
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    leads_by_stage = await db.leads.aggregate(pipeline).to_list(1000)
    
    # Get this week's activities
    week_start = datetime.utcnow() - timedelta(days=7)
    this_week_calls = await db.activities.count_documents({
        "user_id": user_id,
        "activity_type": "call",
        "created_at": {"$gte": week_start}
    })
    
    this_week_emails = await db.activities.count_documents({
        "user_id": user_id,
        "activity_type": "email",
        "created_at": {"$gte": week_start}
    })
    
    # Get recent activities
    recent_activities = await db.activities.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_leads": total_leads,
        "leads_by_stage": {item["_id"]: item["count"] for item in leads_by_stage},
        "this_week_calls": this_week_calls,
        "this_week_emails": this_week_emails,
        "recent_activities": [Activity(**activity, id=activity["_id"]) for activity in recent_activities]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
