# Cloud Deployment Scripts and Configuration

## Build and Deploy Scripts

### Build Docker Image
```bash
# Build the Docker image
docker build -t name-that-thing:latest .

# Build with specific tag
docker build -t name-that-thing:v1.0.0 .
```

### Run Locally
```bash
# Run with Docker Compose
docker-compose up -d

# Run single container
docker run -d -p 8080:80 --name name-that-thing name-that-thing:latest
```

## Cloud Platform Deployments

### Google Cloud Platform (Cloud Run)

1. **Build and push to Container Registry:**
```bash
# Configure gcloud
gcloud auth configure-docker

# Build and tag for GCR
docker build -t gcr.io/YOUR_PROJECT_ID/name-that-thing:latest .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/name-that-thing:latest

# Deploy to Cloud Run
gcloud run deploy name-that-thing \
  --image gcr.io/YOUR_PROJECT_ID/name-that-thing:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi \
  --cpu 1
```

### AWS (ECS with Fargate)

1. **Push to ECR:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name name-that-thing

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t name-that-thing .
docker tag name-that-thing:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/name-that-thing:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/name-that-thing:latest
```

2. **Create ECS Task Definition (task-definition.json):**
```json
{
  "family": "name-that-thing",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "name-that-thing",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/name-that-thing:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/name-that-thing",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Azure (Container Instances)

```bash
# Create resource group
az group create --name name-that-thing-rg --location eastus

# Create container registry
az acr create --resource-group name-that-thing-rg --name nttregistry --sku Basic

# Build and push to ACR
az acr build --registry nttregistry --image name-that-thing:latest .

# Deploy to Container Instances
az container create \
  --resource-group name-that-thing-rg \
  --name name-that-thing \
  --image nttregistry.azurecr.io/name-that-thing:latest \
  --dns-name-label name-that-thing-unique \
  --ports 80 \
  --cpu 1 \
  --memory 1
```

### DigitalOcean App Platform

Create `app.yaml`:
```yaml
name: name-that-thing
services:
- name: web
  source_dir: /
  github_repo: YOUR_USERNAME/name-that-thing
  branch: main
  build_command: npm run build
  run_command: nginx -g 'daemon off;'
  http_port: 80
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
```

## Environment Variables

Since this is a client-side application with local storage, no environment variables are typically needed. However, you can add them for:

- **Analytics tracking IDs**
- **Feature flags**
- **API endpoints** (if you add backend features)

## Scaling Considerations

### Current Architecture (Client-Side Only)
- **Stateless**: Perfect for horizontal scaling
- **CDN-friendly**: Static assets can be cached globally
- **Serverless-ready**: Can run on serverless container platforms

### Future Backend Considerations
If you add backend features:
- **Database**: Consider managed database services
- **File Storage**: Cloud object storage for images
- **Session Management**: Redis or similar for multi-instance sessions

## Security Considerations

✅ **Already Implemented:**
- Security headers in Nginx config
- Content Security Policy
- No sensitive data exposure (client-side only)

🔒 **Additional Recommendations:**
- Use HTTPS in production (handled by cloud providers)
- Implement rate limiting if needed
- Monitor for DDoS attacks
- Regular security updates for base images

## Monitoring and Logging

- **Health checks**: Already implemented (`/health` endpoint)
- **Application logs**: Available in container logs
- **Metrics**: Use cloud provider monitoring (CloudWatch, Stackdriver, etc.)
- **Alerting**: Set up alerts for health check failures
