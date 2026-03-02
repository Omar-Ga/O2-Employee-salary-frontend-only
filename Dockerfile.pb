FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache unzip ca-certificates wget

# PocketBase version
ARG PB_VERSION=0.36.4

# Download and unzip PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb/ && \
    chmod +x /pb/pocketbase && \
    rm /tmp/pb.zip

# Copy hooks and migrations
COPY pb/pb_hooks /pb/pb_hooks
COPY pb/pb_migrations /pb/pb_migrations

# PRE-SEED: Copy backups from the repo to a temporary location
# These will be moved to the persistent volume at runtime
COPY pb/pb_data/backups /pb/backups_preseed

# Expose the API port
EXPOSE 8090

# Declare the data volume
VOLUME [ "/pb/pb_data" ]

# Runtime: Ensure the backups folder exists in the persistent volume, 
# then copy the pre-seeded backups (without overwriting existing ones).
CMD ["sh", "-c", "mkdir -p /pb/pb_data/backups && cp -n /pb/backups_preseed/* /pb/pb_data/backups/ 2>/dev/null; /pb/pocketbase serve --http=0.0.0.0:8090"]
