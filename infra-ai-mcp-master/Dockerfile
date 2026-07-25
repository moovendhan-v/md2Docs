FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Non-root user
RUN groupadd -r infraai && useradd -r -g infraai infraai

WORKDIR /app

# Copy uv project files
COPY pyproject.toml uv.lock ./

# Install deps as root into .venv, then fix ownership
ENV UV_CACHE_DIR=/tmp/uv-cache
RUN uv sync --frozen --no-dev --no-install-project && \
    chown -R infraai:infraai /app/.venv

# Copy server code
COPY src/ ./src/

# Content directory
RUN mkdir -p /srv/mcp-context/config && \
    chown -R infraai:infraai /srv/mcp-context && \
    chown -R infraai:infraai /app

USER infraai

ENV MCP_TRANSPORT=sse
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=80
ENV MCP_CONTENT_DIR=/srv/mcp-context
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 80

# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD python -c "import httpx; httpx.get('http://localhost:80/health', timeout=3)"

# Call .venv python directly — no uv run needed at runtime
CMD ["/app/.venv/bin/python", "src/server.py"]
