from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .admin_routes import router as admin_router
from .user_routes import router as user_router

app = FastAPI(
    title="InfraAI Admin API",
    description="Modular API for InfraAI MCP Server management",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.2.0"}

# ─── Routers ──────────────────────────────────────────────────────────────────



# Publicly accessible routes (file uploads via user token)
app.include_router(user_router, tags=["User Flow"])

# Protected administrative routes (Logs, Tenant management)
app.include_router(admin_router, tags=["Admin Flow"])

