"""FastAPI Application Entrypoint for AI Railway Block Planning Backend."""

from __future__ import annotations
import datetime as dt
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.exceptions import (
    RailPlannerError,
    InfeasibleScheduleError,
    DataValidationError,
    OptimizationError,
    PlanningError,
)
from src.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Indian Railways AI Block Planning Backend",
    description=(
        "Production-grade Hybrid AI + Operations Research (CP-SAT) Backend "
        "to Maximize Corridor Asset Availability and Minimize Train Delay for Indian Railways."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router)


# ============================================================================
# Global Exception Handlers
# ============================================================================

@app.exception_handler(InfeasibleScheduleError)
async def infeasible_schedule_handler(request: Request, exc: InfeasibleScheduleError):
    logger.error("Infeasible Schedule Error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_type": "InfeasibleScheduleError",
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(DataValidationError)
async def data_validation_handler(request: Request, exc: DataValidationError):
    logger.error("Data Validation Error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_type": "DataValidationError",
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(OptimizationError)
async def optimization_error_handler(request: Request, exc: OptimizationError):
    logger.error("Optimization Solver Error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_type": "OptimizationError",
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(PlanningError)
async def planning_error_handler(request: Request, exc: PlanningError):
    logger.error("Planning Engine Error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_type": "PlanningError",
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(RailPlannerError)
async def rail_planner_base_handler(request: Request, exc: RailPlannerError):
    logger.error("Rail Planner Base Error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_type": "RailPlannerError",
            "message": exc.message,
            "details": exc.details,
        },
    )


# ============================================================================
# Root & Health Endpoints
# ============================================================================

@app.get("/", tags=["System Health"])
def root():
    return {
        "system": "Indian Railways AI Block Planning Backend",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "docs": "/docs",
    }


@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "timestamp": dt.datetime.now().isoformat(),
    }
