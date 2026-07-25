import shutil
import time
import logging
from datetime import datetime, timezone
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from pydantic import BaseModel
import boto3
from .shared import (
    BASE_CONTENT_DIR, VALID_FOLDERS,
    tenant_path, safe_file_path, require_admin,
    load_tenants, save_tenants, resolve_tenant_id,
    load_tokens, save_tokens, require_user_token,
    load_disabled_users, save_disabled_users,
    COGNITO_USER_POOL_ID, COGNITO_REGION
)
from .user_routes import FolderType

log = logging.getLogger("infraai-api")

INVITE_STALE_DAYS = 7  # resend badge threshold


class InviteUserRequest(BaseModel):
    email: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None


def _cognito():
    return boto3.client("cognito-idp", region_name=COGNITO_REGION)


def _require_pool():
    if not COGNITO_USER_POOL_ID:
        raise HTTPException(status_code=500, detail="COGNITO_USER_POOL_ID is not configured")



# ── Admin router (Cognito JWT or API key required) ──────────────────────────────
# Protect all routes in this router with require_admin
router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/health-check")
def admin_health():
    """Protected health check for Admin UI."""
    return {"status": "ok", "auth": "success"}


@router.post("/tenants/invite")
def invite_user(body: InviteUserRequest):
    """
    Create a Cognito user and send them a temporary-password email (invite).
    If the user already exists with FORCE_CHANGE_PASSWORD status, resend the invite.
    """
    _require_pool()
    email = body.email.strip()
    if not email:
        raise HTTPException(status_code=422, detail="email is required")

    client = _cognito()
    attrs = [
        {"Name": "email", "Value": email},
        {"Name": "email_verified", "Value": "true"},
    ]
    if body.given_name:
        attrs.append({"Name": "given_name", "Value": body.given_name.strip()})
    if body.family_name:
        attrs.append({"Name": "family_name", "Value": body.family_name.strip()})

    try:
        resp = client.admin_create_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
            UserAttributes=attrs,
            DesiredDeliveryMediums=["EMAIL"],
        )
        user = resp["User"]
        attributes = {a["Name"]: a["Value"] for a in user.get("Attributes", [])}
        log.info("[INVITE] Created user | email=%s | status=%s", email, user.get("UserStatus"))
        return {
            "message": f"Invitation sent to {email}",
            "username": user.get("Username"),
            "sub": attributes.get("sub"),
            "status": user.get("UserStatus"),
            "resent": False,
        }
    except client.exceptions.UsernameExistsException:
        # User exists — resend if they haven't accepted yet
        try:
            user_resp = client.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
        except Exception:
            raise HTTPException(status_code=409, detail=f"User '{email}' already exists and is confirmed")

        if user_resp.get("UserStatus") != "FORCE_CHANGE_PASSWORD":
            raise HTTPException(status_code=409, detail=f"User '{email}' already exists and has already logged in")

        # Resend by resetting — this triggers a new temp password email
        client.admin_reset_user_password(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
        log.info("[INVITE] Resent invite | email=%s", email)
        return {
            "message": f"Invitation resent to {email}",
            "username": email,
            "status": "FORCE_CHANGE_PASSWORD",
            "resent": True,
        }
    except Exception as e:
        log.error("[INVITE] Error | email=%s | %s", email, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tenants/{username}/resend-invite")
def resend_invite(username: str):
    """
    Resend the invite (new temp password) to a user who hasn't logged in yet.
    Only works if the user is still in FORCE_CHANGE_PASSWORD status.
    """
    _require_pool()
    client = _cognito()
    try:
        user_resp = client.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=username)
    except client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    except Exception as e:
        log.error("[RESEND] Error fetching user | %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

    if user_resp.get("UserStatus") != "FORCE_CHANGE_PASSWORD":
        raise HTTPException(status_code=400, detail="User has already accepted their invite")

    try:
        client.admin_reset_user_password(UserPoolId=COGNITO_USER_POOL_ID, Username=username)
        log.info("[RESEND] Resent invite | username=%s", username)
        return {"message": f"Invite resent to {username}"}
    except Exception as e:
        log.error("[RESEND] Error | username=%s | %s", username, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/files/{folder}")
async def upload_file(folder: FolderType, file: UploadFile = File(...), token: dict = Depends(require_user_token)):
    """
    Upload a markdown file to a tenant's folder (Token-based).
    """
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are accepted")

    tenant_id = token["tenant_id"]
    base = tenant_path(tenant_id)
    
    if not base.exists():
        raise HTTPException(status_code=404, detail="Tenant folder not found")
    
    target = base / folder / file.filename
    target.parent.mkdir(parents=True, exist_ok=True)
    
    content = await file.read()
    target.write_bytes(content)
    
    return {"message": "File uploaded", "filename": file.filename}

@router.get("/tenants")
def list_tenants():
    """List all existing tenants from Cognito using boto3, handling pagination."""
    _require_pool()
    try:
        client = _cognito()
        tenants = {}
        details = {}
        pagination_token = None
        now = datetime.now(timezone.utc)

        disabled_subs = load_disabled_users()

        while True:
            params = {"UserPoolId": COGNITO_USER_POOL_ID}
            if pagination_token:
                params["PaginationToken"] = pagination_token

            users_resp = client.list_users(**params)

            for user in users_resp.get("Users", []):
                username = user.get("Username")
                attributes = {attr["Name"]: attr["Value"] for attr in user.get("Attributes", [])}
                sub = attributes.get("sub", "")

                if username and sub:
                    last_modified: datetime = user.get("UserLastModifiedDate")
                    status = user.get("UserStatus", "UNKNOWN")
                    is_disabled = sub in disabled_subs
                    invite_stale = (
                        status == "FORCE_CHANGE_PASSWORD"
                        and last_modified is not None
                        and (now - last_modified).days >= INVITE_STALE_DAYS
                    )
                    tenants[username] = sub
                    details[username] = {
                        "sub": sub,
                        "email": attributes.get("email", ""),
                        "enabled": not is_disabled,
                        "status": status,
                        "last_modified": last_modified.isoformat() if last_modified else None,
                        "invite_stale": invite_stale,
                    }

            pagination_token = users_resp.get("PaginationToken")
            if not pagination_token:
                break

        return {"tenants": tenants, "details": details}
    except Exception as e:
        log.error("Error in list_tenants: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/tenants/{tenant_id}")
def delete_tenant(tenant_id: str):
    """Disable a tenant by adding their sub to disabled_users.json and signing them out of Cognito."""
    _require_pool()
    try:
        # Resolve sub from Cognito username
        client = _cognito()
        user_resp = client.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=tenant_id)
        attributes = {a["Name"]: a["Value"] for a in user_resp.get("UserAttributes", [])}
        sub = attributes.get("sub", tenant_id)

        # Write to disabled_users.json
        disabled = load_disabled_users()
        disabled.add(sub)
        save_disabled_users(disabled)

        # Best-effort global sign-out from Cognito
        try:
            client.admin_user_global_sign_out(UserPoolId=COGNITO_USER_POOL_ID, Username=tenant_id)
        except Exception:
            pass

        log.info("[DISABLE] Disabled user | username=%s | sub=%s", tenant_id, sub)
        return {"message": f"User '{tenant_id}' disabled"}
    except Exception as e:
        log.error("Error in delete_tenant: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tenants/{tenant_id}/enable")
def enable_tenant(tenant_id: str):
    """Re-enable a tenant by removing their sub from disabled_users.json."""
    _require_pool()
    try:
        client = _cognito()
        user_resp = client.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=tenant_id)
        attributes = {a["Name"]: a["Value"] for a in user_resp.get("UserAttributes", [])}
        sub = attributes.get("sub", tenant_id)

        disabled = load_disabled_users()
        disabled.discard(sub)
        save_disabled_users(disabled)

        log.info("[ENABLE] Enabled user | username=%s | sub=%s", tenant_id, sub)
        return {"message": f"User '{tenant_id}' enabled"}
    except Exception as e:
        log.error("Error in enable_tenant: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")



@router.patch("/tenants/{tenant_id}")
def modify_tenant(tenant_id: str, metadata: dict):
    """Modify tenant metadata in Cognito."""
    if not COGNITO_USER_POOL_ID:
        raise HTTPException(status_code=500, detail="COGNITO_USER_POOL_ID is not configured")
        
    try:
        client = boto3.client('cognito-idp', region_name=COGNITO_REGION)
        
        user_attributes = []
        for k, v in metadata.items():
            user_attributes.append({
                "Name": k,
                "Value": str(v)
            })
            
        client.admin_update_user_attributes(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=tenant_id,
            UserAttributes=user_attributes
        )
        return {"message": "Tenant modified successfully", "metadata": metadata}
    except Exception as e:
        log.error(f"Error in modify_tenant: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/logs")
def get_logs(lines: int = 100):
    """Read the last N lines of the MCP server log file."""
    log_file = BASE_CONTENT_DIR / "logs" / "mcp.log"
    if not log_file.exists():
        return {"logs": [], "message": "Log file not found"}
    with open(log_file, "r") as f:
        tail = f.readlines()[-lines:]
    return {"lines": len(tail), "logs": [l.strip() for l in tail]}


# File discovery (Admin only)
@router.get("/tenants/{tenant_id}/files/{folder_name}")
def list_files(
    tenant_id: str, 
    folder_name: str, 
    admin: str = Depends(require_admin),
    x_tenant_id: Optional[str] = Header(None)
):
    """List files in a specific folder for a tenant."""
    import urllib.parse
    folder_name = urllib.parse.unquote(folder_name)
    effective_tenant_id = x_tenant_id or tenant_id
    path = tenant_path(effective_tenant_id) / folder_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Folder not found")
    files = [f.name for f in path.glob("*.md")]
    return {"files": files}


@router.get("/tenants/{tenant_id}/files/{folder_name}/{filename}")
def get_file(
    tenant_id: str, 
    folder_name: str, 
    filename: str, 
    admin: str = Depends(require_admin),
    x_tenant_id: Optional[str] = Header(None)
):
    """Read file content."""
    effective_tenant_id = x_tenant_id or tenant_id
    target = safe_file_path(effective_tenant_id, folder_name, filename)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return {"content": target.read_text()}


@router.put("/tenants/{tenant_id}/files/{folder_name}/{filename}")
def update_file(
    tenant_id: str, 
    folder_name: str, 
    filename: str, 
    body: dict,
    admin: str = Depends(require_admin),
    x_tenant_id: Optional[str] = Header(None)
):
    """Update a markdown file's content."""
    content = body.get("content")
    if content is None:
        raise HTTPException(status_code=400, detail="Missing content in body")
    
    effective_tenant_id = x_tenant_id or tenant_id
    target = safe_file_path(effective_tenant_id, folder_name, filename)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    return {"message": "File updated", "size": len(content)}


@router.post("/tenants/{tenant_id}/files/{folder}/{filename}")
def create_file(tenant_id: str, folder: str, filename: str):
    """Create a new empty markdown file."""
    if not filename.endswith(".md"):
        filename += ".md"
    
    target = safe_file_path(tenant_id, folder, filename)
    if target.exists():
        raise HTTPException(status_code=409, detail="File already exists")
    
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("") # Start empty
    return {"message": "File created", "filename": filename}
