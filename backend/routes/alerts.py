from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from database import get_connection
from psycopg.rows import dict_row
from auth_utils import require_role

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class AlertConfigCreate(BaseModel):
    name: str
    category: str
    metric: str
    condition: str
    threshold: float
    severity: str
    is_enabled: bool = True

@router.get("/config")
def get_alerts_config(current_user: dict = Depends(require_role(["ADMIN"]))):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM alerts_config ORDER BY created_at DESC")
            return cur.fetchall()
    finally:
        conn.close()

@router.post("/config")
def create_alert_config(config: AlertConfigCreate, current_user: dict = Depends(require_role(["ADMIN"]))):
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""
                INSERT INTO alerts_config (name, category, metric, condition, threshold, severity, is_enabled)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *
            """, (config.name, config.category, config.metric, config.condition, config.threshold, config.severity, config.is_enabled))
            new_config = cur.fetchone()
            conn.commit()
            return new_config
    finally:
        conn.close()

@router.patch("/config/{config_id}")
def update_alert_config(config_id: int, is_enabled: bool, current_user: dict = Depends(require_role(["ADMIN"]))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE alerts_config SET is_enabled = %s WHERE id = %s", (is_enabled, config_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Alert config not found")
            conn.commit()
            return {"message": "Alert config updated successfully"}
    finally:
        conn.close()

def run_alert_evaluation():
    # Simple alert generation logic to evaluate rules and create notifications
    conn = get_connection()
    try:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM alerts_config WHERE is_enabled = true")
            configs = cur.fetchall()
            
            # Simple mock evaluation logic using current DB metrics
            # E.g., fetch on-time delivery rate if a metric is configured
            for config in configs:
                # Based on the config metric, we could query the exact table
                # For this demo, let's say the engine evaluates basic thresholds on aggregated data
                # e.g., if metric is 'On-Time Delivery Rate', we query from order delivery days
                
                # Prevent duplicate: check if an alert for this config was generated today
                cur.execute("""
                    SELECT id FROM notifications 
                    WHERE category = %s AND title = %s 
                    AND created_at > CURRENT_DATE
                """, (config["category"], config["name"]))
                
                if cur.fetchone() is None:
                    # Let's mock a triggered condition for active alerts for now
                    # We will send it to all admins/managers
                    cur.execute("SELECT id FROM users WHERE role IN ('ADMIN', 'MANAGER')")
                    users = cur.fetchall()
                    
                    message = f"Alert '{config['name']}': Threshold {config['threshold']} reached based on condition {config['condition']}."
                    
                    for u in users:
                        cur.execute("""
                            INSERT INTO notifications (user_id, title, message, priority, category)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (u["id"], config["name"], message, config["severity"], config["category"]))
            conn.commit()
    finally:
        conn.close()

@router.post("/evaluate")
def trigger_alert_evaluation(background_tasks: BackgroundTasks, current_user: dict = Depends(require_role(["ADMIN"]))):
    # This can be triggered by a chron job or admin to run evaluations
    background_tasks.add_task(run_alert_evaluation)
    return {"message": "Alert evaluation triggered in background"}
