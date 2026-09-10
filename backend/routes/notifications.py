from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_connection
from psycopg.rows import dict_row
from auth_utils import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
def get_notifications(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    is_read: bool = Query(None)
):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            query = "SELECT * FROM notifications WHERE user_id = %s"
            params = [current_user["id"]]
            
            if is_read is not None:
                query += " AND is_read = %s"
                params.append(is_read)
                
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cur.execute(query, params)
            notifications = cur.fetchall()
            
            cur.execute("SELECT COUNT(*) as total FROM notifications WHERE user_id = %s", (current_user["id"],))
            total = cur.fetchone()["total"]
            
            return {
                "notifications": notifications,
                "total": total
            }
    finally:
        conn.close()

@router.get("/unread-count")
def get_unread_count(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = false", (current_user["id"],))
            result = cur.fetchone()
            return {"count": result["count"]}
    finally:
        conn.close()

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE notifications SET is_read = true, read_at = %s WHERE id = %s AND user_id = %s",
                (datetime.utcnow(), notification_id, current_user["id"])
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Notification not found")
            conn.commit()
            return {"message": "Notification marked as read"}
    finally:
        conn.close()

@router.patch("/read-all")
def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE notifications SET is_read = true, read_at = %s WHERE user_id = %s AND is_read = false",
                (datetime.utcnow(), current_user["id"])
            )
            conn.commit()
            return {"message": "All notifications marked as read"}
    finally:
        conn.close()

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM notifications WHERE id = %s AND user_id = %s", (notification_id, current_user["id"]))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Notification not found")
            conn.commit()
            return {"message": "Notification deleted"}
    finally:
        conn.close()
