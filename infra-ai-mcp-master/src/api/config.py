import os

MCP_HOST           = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT           = int(os.getenv("MCP_PORT", "8000"))
MCP_PATH           = os.getenv("MCP_PATH", "/mcp")
MCP_PUBLIC_BASE_URL = os.getenv("MCP_PUBLIC_BASE_URL", "").rstrip("/")

COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]   
COGNITO_CLIENT_ID    = os.environ["COGNITO_CLIENT_ID"]      
COGNITO_DOMAIN       = os.environ["COGNITO_DOMAIN"]         
AWS_REGION           = os.environ.get("AWS_REGION")

COGNITO_TOKEN_URL = f"{COGNITO_DOMAIN}/oauth2/token"
OUR_CALLBACK_URL = f"{MCP_PUBLIC_BASE_URL}/callback" if MCP_PUBLIC_BASE_URL else ""

AUTH_STATE_STORE: dict[str, dict] = {}