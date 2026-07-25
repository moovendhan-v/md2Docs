FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN groupadd -r infraai && useradd -r -g infraai infraai

WORKDIR /app

# Copy shared uv.lock from root workspace + api pyproject.toml
COPY uv.lock ./
COPY api/pyproject.toml ./pyproject.toml

# Install deps as root into .venv, then fix ownership
ENV UV_CACHE_DIR=/tmp/uv-cache
RUN uv sync --frozen --no-dev --no-install-project && \
    chown -R infraai:infraai /app/.venv

# Copy admin API source
COPY api/src/ ./src/

RUN mkdir -p /srv/mcp-context/config && \
    chown -R infraai:infraai /srv/mcp-context && \
    chown -R infraai:infraai /app

USER infraai

ENV MCP_CONTENT_DIR=/srv/mcp-context
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 80

# Call .venv uvicorn directly — no uv run needed at runtime
CMD ["/app/.venv/bin/uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "80"]
