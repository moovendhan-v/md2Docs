import json
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from .shared import (
    BASE_CONTENT_DIR, make_jwt, 
    tenant_path, safe_file_path, VALID_FOLDERS,
    load_tenants, save_tenants, load_tokens, save_tokens,
    require_user_token, COGNITO_USER_POOL_ID, COGNITO_REGION
)


router = APIRouter()

FolderType = Literal["templates", "context", "prompts"]


@router.post("/tenants/{tenant_id}/tokens")
def create_token(tenant_id: str):
    """
    Generate a signed JWT bearer token for a tenant.
    Expects the 'tenant_id' to be the system-generated UUID.
    Publicly accessible (User Flow).
    """
    import uuid
    try:
        # We expect the 'tenant_id' passed in the URL to be the UUID (Tenant ID)
        tenant_uuid = tenant_id 
        base = BASE_CONTENT_DIR / tenant_uuid
        
        if not base.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Tenant folder '{tenant_uuid}' (UUID) not found. "
                       "Tokens must be created using the Tenant ID (UUID)."
            )

        # find friendly name (email) for metadata directly from Cognito
        friendly_name = tenant_uuid
        if COGNITO_USER_POOL_ID:
            try:
                import boto3
                client = boto3.client('cognito-idp', region_name=COGNITO_REGION)
                resp = client.list_users(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Filter=f'sub = "{tenant_uuid}"'
                )
                users = resp.get("Users", [])
                if users:
                    attributes = {attr["Name"]: attr["Value"] for attr in users[0].get("Attributes", [])}
                    friendly_name = attributes.get("email") or tenant_uuid
            except Exception as e:
                import logging
                logging.error(f"Failed to fetch user email from Cognito for {tenant_uuid}: {e}")
        
        if friendly_name == tenant_uuid:
            tenants = load_tenants().get("tenants", {})
            friendly_name = next((name for name, uid in tenants.items() if uid == tenant_uuid), tenant_uuid)

        jti = str(uuid.uuid4())
        raw_jwt = make_jwt(tenant_uuid, jti)

        # Persist token for admin management/revocation
        # Store token info
        import time
        now = time.time()
        tokens = load_tokens()
        tokens[jti] = {
            "tenant_id": tenant_uuid,
            "friendly_name": friendly_name, # Store email / friendly name
            "created_at": int(now),
            "expires_at": int(now) + (365 * 24 * 60 * 60)
        }
        save_tokens(tokens)

        return {
            "message": "JWT token created and persisted",
            "tenant_id": tenant_uuid,
            "friendly_name": friendly_name,
            "raw_token": raw_jwt,
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in create_token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tenants/{tenant_id}/files/{folder}")
async def upload_file(tenant_id: str, folder: FolderType, file: UploadFile = File(...)):
    """
    Upload a markdown file to a tenant's folder.
    Expects the 'tenant_id' to be the system-generated UUID.
    Publicly accessible (User Flow).
    """
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are accepted")

    try:
        # We expect the 'tenant_id' to be the UUID
        tenant_uuid = tenant_id
        base = BASE_CONTENT_DIR / tenant_uuid
        
        if not base.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Tenant folder '{tenant_uuid}' (UUID) not found. "
                       "File uploads must use the Tenant ID (UUID)."
            )

        import urllib.parse
        folder = urllib.parse.unquote(folder)
        # Resolve safe path manually within the UUID folder
        target_dir = (base / folder).resolve()
        target = (target_dir / file.filename).resolve()
        
        try:
            target.relative_to(target_dir)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file path")

        target.parent.mkdir(parents=True, exist_ok=True)
        content = await file.read()
        target.write_bytes(content)

        return {
            "message": "File uploaded",
            "tenant_id": tenant_uuid,
            "folder": folder,
            "filename": file.filename,
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in upload_file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/files/{folder}")
def list_files(folder: FolderType, token: dict = Depends(require_user_token)):
    """List files in a tenant's folder (Token-based)."""
    try:
        import urllib.parse
        folder = urllib.parse.unquote(folder)
        tenant_id = token["tenant_id"]
        base = tenant_path(tenant_id)
        target_dir = base / folder
        if not target_dir.exists():
            return {"files": []}
        
        files = [f.name for f in target_dir.iterdir() if f.is_file() and f.name.endswith(".md")]
        return {"files": sorted(files)}
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in list_files: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/files/{folder}/{filename}")
def get_file_content(folder: FolderType, filename: str, token: dict = Depends(require_user_token)):
    """Retrieve the content of a specific file (Token-based)."""
    try:
        tenant_id = token["tenant_id"]
        path = safe_file_path(tenant_id, folder, filename)
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return {"content": path.read_text()}
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in get_file_content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/files/{folder}/{filename}")
def update_file_content(folder: FolderType, filename: str, data: dict, token: dict = Depends(require_user_token)):
    """Update the content of an existing file (Token-based)."""
    try:
        tenant_id = token["tenant_id"]
        path = safe_file_path(tenant_id, folder, filename)
        content = data.get("content", "")
        path.write_text(content)
        return {"message": "File updated"}
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in update_file_content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/files/{folder}/{filename}")
def create_empty_file(folder: FolderType, filename: str, token: dict = Depends(require_user_token)):
    """Create a new empty markdown file (Token-based)."""
    try:
        tenant_id = token["tenant_id"]
        if not filename.endswith(".md"):
            filename += ".md"
        path = safe_file_path(tenant_id, folder, filename)
        if path.exists():
            raise HTTPException(status_code=409, detail="File already exists")
        path.write_text("")
        return {"message": "File created", "filename": filename}
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in create_empty_file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/files/{folder}/{filename}")
def delete_file(folder: FolderType, filename: str, token: dict = Depends(require_user_token)):
    """Delete a file (Token-based)."""
    try:
        tenant_id = token["tenant_id"]
        path = safe_file_path(tenant_id, folder, filename)
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        path.unlink()
        return {"message": "File deleted"}
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.error(f"Error in delete_file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

 