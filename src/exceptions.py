"""Custom domain exceptions for AI Railway Block Planner."""

class RailPlannerError(Exception):
    """Base exception for all domain errors in the system."""
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def __str__(self) -> str:
        if self.details:
            return f"{self.message} | Details: {self.details}"
        return self.message


class DataValidationError(RailPlannerError):
    """Raised when incoming raw or processed data fails schema or domain constraints."""
    pass


class IncompatibleSchemaError(DataValidationError):
    """Raised when external dataset schema cannot be adapted to internal format."""
    pass


class MissingEntityError(RailPlannerError):
    """Raised when an entity referenced by foreign key (asset, section, block, etc.) is missing."""
    pass


class ModelInferenceError(RailPlannerError):
    """Raised when risk or impact model fails during scoring/inference."""
    pass


class OptimizationError(RailPlannerError):
    """Raised when CP-SAT solver fails, times out, or encounters fatal structural issues."""
    pass


class InfeasibleScheduleError(RailPlannerError):
    """Raised when hard safety/resource constraints lead to an infeasible plan."""
    pass


class ConfigurationError(RailPlannerError):
    """Raised when application configuration is invalid or missing required sections."""
    pass


class PlanningError(RailPlannerError):
    """Raised when weekly, monthly, or dynamic planning fails or encounters invalid input state."""
    pass

