from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

from app.api.deps import get_current_admin_user
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.models.resume import ResumeDocument
from app.models.interview import MockInterviewDocument
from app.models.agent_trace import AgentToolCallDocument
from app.models.notification import NotificationDocument
from app.schemas.common import StandardResponse
from app.services.admin_ws_service import admin_ws_manager
from app.core.security import decode_access_token, verify_password
from app.core.exceptions import PermissionDeniedError, ResourceNotFoundError, ValidationError

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


# Request Schemas for Admin
class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role to set: 'user' or 'admin'")


class DBCleanupRequest(BaseModel):
    cleanup_type: str = Field(..., description="'selective' or 'full_test_reset'")
    target_collections: List[str] = Field(default=[], description="Collections to clear: traces, interviews, notifications, test_users")
    admin_password_confirm: str = Field(..., description="Admin password confirmation for safety")


# --- REST ENDPOINTS ---

@router.get("/stats", response_model=StandardResponse[dict])
async def get_admin_stats(admin_user: UserDocument = Depends(get_current_admin_user)):
    """
    Returns dashboard overview stats: Total Users, Online Users, Resumes, Interviews, Traces.
    """
    total_users = await UserDocument.count()
    online_users = await UserDocument.find(UserDocument.is_online == True).count()
    verified_users = await UserDocument.find(UserDocument.is_verified == True).count()
    admin_count = await UserDocument.find(UserDocument.role == "admin").count()
    
    total_resumes = await ResumeDocument.count()
    total_interviews = await MockInterviewDocument.count()
    total_traces = await AgentToolCallDocument.count()

    return StandardResponse(
        success=True,
        message="Admin statistics retrieved successfully",
        data={
            "total_users": total_users,
            "online_users": online_users,
            "offline_users": max(0, total_users - online_users),
            "verified_users": verified_users,
            "admin_count": admin_count,
            "total_resumes": total_resumes,
            "total_interviews": total_interviews,
            "total_agent_traces": total_traces,
            "system_time": datetime.now(timezone.utc).isoformat()
        }
    )


@router.get("/users", response_model=StandardResponse[dict])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    filter_status: Optional[str] = Query(None, description="All, online, offline, admin"),
    admin_user: UserDocument = Depends(get_current_admin_user)
):
    """
    Retrieves paginated list of users with online status and session timestamps.
    """
    query_conditions = []
    
    if search:
        query_conditions.append(UserDocument.email.regex(search, options="i"))
        
    if filter_status == "online":
        query_conditions.append(UserDocument.is_online == True)
    elif filter_status == "offline":
        query_conditions.append(UserDocument.is_online == False)
    elif filter_status == "admin":
        query_conditions.append(UserDocument.role == "admin")

    if query_conditions:
        if len(query_conditions) == 1:
            base_query = UserDocument.find(query_conditions[0])
        else:
            base_query = UserDocument.find(*query_conditions)
    else:
        base_query = UserDocument.find_all()

    total_count = await base_query.count()
    users = await base_query.sort("-created_at").skip((page - 1) * limit).limit(limit).to_list()

    user_list = []
    for u in users:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == u.id)
        user_list.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": profile.full_name if profile else "",
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "is_online": u.is_online,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "last_logout_at": u.last_logout_at.isoformat() if u.last_logout_at else None,
            "created_at": u.created_at.isoformat(),
        })

    return StandardResponse(
        success=True,
        message="User list retrieved",
        data={
            "users": user_list,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
    )


@router.patch("/users/{target_user_id}/role", response_model=StandardResponse[dict])
async def update_user_role(
    target_user_id: str,
    req: RoleUpdateRequest,
    admin_user: UserDocument = Depends(get_current_admin_user)
):
    """
    Changes user role between 'user' and 'admin'.
    """
    if req.role not in ["user", "admin"]:
        raise ValidationError("Role must be 'user' or 'admin'", code="INVALID_ROLE")

    target = await UserDocument.get(PydanticObjectId(target_user_id))
    if not target:
        raise ResourceNotFoundError("User not found", code="USER_NOT_FOUND")

    target.role = req.role
    target.update_timestamp()
    await target.save()

    # Broadcast event
    await admin_ws_manager.broadcast("USER_ROLE_UPDATED", {
        "user_id": str(target.id),
        "email": target.email,
        "new_role": req.role
    })

    return StandardResponse(
        success=True,
        message=f"User role updated to '{req.role}'",
        data={"user_id": str(target.id), "email": target.email, "role": target.role}
    )


@router.delete("/users/{target_user_id}", response_model=StandardResponse[dict])
async def delete_user(
    target_user_id: str,
    admin_user: UserDocument = Depends(get_current_admin_user)
):
    """
    Deletes a user account and associated documents.
    """
    if str(admin_user.id) == target_user_id:
        raise PermissionDeniedError("You cannot delete your own admin account", code="CANNOT_DELETE_SELF")

    target = await UserDocument.get(PydanticObjectId(target_user_id))
    if not target:
        raise ResourceNotFoundError("User not found", code="USER_NOT_FOUND")

    email = target.email
    # Delete related documents
    await ProfileDocument.find(ProfileDocument.user_id == target.id).delete()
    await ResumeDocument.find(ResumeDocument.user_id == target.id).delete()
    await MockInterviewDocument.find(MockInterviewDocument.user_id == target.id).delete()
    await target.delete()

    await admin_ws_manager.broadcast("USER_DELETED", {
        "user_id": target_user_id,
        "email": email
    })

    return StandardResponse(
        success=True,
        message=f"User {email} and associated data deleted successfully",
        data={"user_id": target_user_id, "email": email}
    )


@router.post("/db/cleanup", response_model=StandardResponse[dict])
async def cleanup_database(
    req: DBCleanupRequest,
    admin_user: UserDocument = Depends(get_current_admin_user)
):
    """
    One-click Database Cleanup endpoint to purge test data or reset specific collections safely.
    Requires admin password confirmation.
    """
    if not verify_password(req.admin_password_confirm, admin_user.hashed_password):
        raise PermissionDeniedError("Invalid admin password confirmation", code="INVALID_ADMIN_PASSWORD")

    deleted_counts = {}

    if req.cleanup_type == "selective":
        if "traces" in req.target_collections:
            res = await AgentToolCallDocument.find_all().delete()
            deleted_counts["agent_traces"] = res.deleted_count if res else 0

        if "notifications" in req.target_collections:
            res = await NotificationDocument.find_all().delete()
            deleted_counts["notifications"] = res.deleted_count if res else 0

        if "interviews" in req.target_collections:
            res = await MockInterviewDocument.find_all().delete()
            deleted_counts["mock_interviews"] = res.deleted_count if res else 0

        if "unverified_users" in req.target_collections:
            unverified = await UserDocument.find(UserDocument.is_verified == False).to_list()
            count = 0
            for u in unverified:
                await ProfileDocument.find(ProfileDocument.user_id == u.id).delete()
                await u.delete()
                count += 1
            deleted_counts["unverified_users"] = count

    elif req.cleanup_type == "full_test_reset":
        # Clear traces, notifications, mock interviews, and non-admin profiles
        res1 = await AgentToolCallDocument.find_all().delete()
        res2 = await NotificationDocument.find_all().delete()
        res3 = await MockInterviewDocument.find_all().delete()
        
        deleted_counts["agent_traces"] = res1.deleted_count if res1 else 0
        deleted_counts["notifications"] = res2.deleted_count if res2 else 0
        deleted_counts["mock_interviews"] = res3.deleted_count if res3 else 0

    # Broadcast notification to connected admins
    await admin_ws_manager.broadcast("DB_CLEANUP_EXECUTED", {
        "admin_email": admin_user.email,
        "cleanup_type": req.cleanup_type,
        "summary": deleted_counts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return StandardResponse(
        success=True,
        message="Database cleanup executed successfully",
        data={"summary": deleted_counts}
    )


# --- WEBSOCKET ENDPOINT ---

@router.websocket("/ws")
async def admin_websocket(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    Real-time WebSocket endpoint for Admin Panel live monitoring.
    Requires access token with admin privileges in query parameters.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = await UserDocument.get(PydanticObjectId(user_id))
        if not user or user.role != "admin" or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await admin_ws_manager.connect(websocket)
    try:
        # Send initial welcome payload
        await websocket.send_json({
            "type": "CONNECTED",
            "data": {
                "message": "Connected to Admin Live Feed",
                "server_time": datetime.now(timezone.utc).isoformat()
            }
        })

        while True:
            # Keep connection alive & listen for client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        admin_ws_manager.disconnect(websocket)
    except Exception:
        admin_ws_manager.disconnect(websocket)
