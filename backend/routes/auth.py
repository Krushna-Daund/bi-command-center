from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_connection
from psycopg.rows import dict_row
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/login")
def login(request: LoginRequest):
    conn = get_connection()
    user = None
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (request.email,))
            user = cur.fetchone()
    finally:
        conn.close()

    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Update last login
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET last_login_at = %s WHERE id = %s", (datetime.utcnow(), user["id"]))
            conn.commit()
    finally:
        conn.close()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"])}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.post("/register")
def register(request: RegisterRequest):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            # Check if email exists
            cur.execute("SELECT id FROM users WHERE email = %s", (request.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Create user
            password_hash = get_password_hash(request.password)
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role)
                VALUES (%s, %s, %s, 'VIEWER') RETURNING id
            """, (request.name, request.email, password_hash))
            new_user = cur.fetchone()
            conn.commit()
            return {"message": "User registered successfully", "id": new_user["id"]}
    finally:
        conn.close()

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT password_hash FROM users WHERE id = %s", (current_user["id"],))
            user = cur.fetchone()
            
            if not verify_password(request.current_password, user["password_hash"]):
                raise HTTPException(status_code=400, detail="Incorrect current password")
            
            new_hash = get_password_hash(request.new_password)
            cur.execute("UPDATE users SET password_hash = %s, updated_at = %s WHERE id = %s", 
                        (new_hash, datetime.utcnow(), current_user["id"]))
            conn.commit()
    finally:
        conn.close()
    
    return {"message": "Password changed successfully"}

@router.post("/logout")
def logout():
    # Since we are using standard JWT, logout is handled client side by deleting the token.
    # We could implement a token blacklist here in Redis for true invalidation.
    return {"message": "Logged out successfully"}
