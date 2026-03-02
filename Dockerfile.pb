FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache unzip ca-certificates wget

# PocketBase version based on what you are currently using
ARG PB_VERSION=0.36.4

# Download and unzip PocketBase (Linux binary)
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip && 
    unzip /tmp/pb.zip -d /pb/ && 
    chmod +x /pb/pocketbase && 
    rm /tmp/pb.zip

# Copy our hooks and migrations from the repo into the Docker image
COPY pb/pb_hooks /pb/pb_hooks
COPY pb/pb_migrations /pb/pb_migrations

# Expose the API port
EXPOSE 8090

# Declare the data volume (database files)
VOLUME [ "/pb/pb_data" ]

# Command to start the server
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
