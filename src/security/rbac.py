"""Role-Based Access Control (RBAC) and Security Dependencies."""

from __future__ import annotations
import logging
from typing import List, Optional
from fastapi import Header, HTTPException, status, Depends
from src.schemas import UserRole
from src.config import CONFIG

logger = logging.getLogger(__name__)


class UserContext:
    """Authenticated user security principal."""
    def __init__(self, user_id: str, role: UserRole, department: Optional[str] = None):
        self.user_id = user_id
        self.role = role
        self.department = department


def get_current_user(
    x_user_id: Optional[str] = Header(default="controller_01", alias="X-User-ID"),
    x_user_role: Optional[str] = Header(default="PLANNER", alias="X-User-Role"),
    x_department: Optional[str] = Header(default="ENGINEERING", alias="X-Department")
) -> UserContext:
    """Extract and validate user principal from request headers / internal gateway tokens."""
    try:
        role = UserRole(x_user_role.upper())
    except ValueError:
        role = UserRole.VIEWER

    return UserContext(user_id=x_user_id, role=role, department=x_department)


def require_roles(allowed_roles: List[UserRole]):
    """FastAPI dependency enforcing RBAC authorization boundaries."""
    def role_checker(user: UserContext = Depends(get_current_user)) -> UserContext:
        if not CONFIG.security.rbac_enabled:
            return user  # Bypass in open prototype mode

        if user.role not in allowed_roles:
            logger.warning(
                "Access DENIED for user '%s' with role '%s' (Required: %s)",
                user.user_id, user.role.value, [r.value for r in allowed_roles]
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user.role.value}' does not have authorized permission."
            )
        return user
    return role_checker
