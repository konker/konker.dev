# Debugging 503 Service Unavailable Error

## Initial Situation

- Deployment and Ingress routes defined in `deployment/k8s/`
- HTTP requests to https://backend-boilerplate.hetzner.konker.dev/ returning 503 Service Unavailable
- Pod showing as Running (1/1 Ready)

## Diagnostic Steps

### 1. Set Pod Name Variable

```bash
export POD=$(kubectl get pods -n backend-boilerplate -l app=backend-boilerplatedotkonkerdotdev -o jsonpath='{.items[0].metadata.name}')
echo "Pod name: $POD"
```

**Result:**

```
Pod name: backend-boilerplatedotkonkerdotdev-8b7b9c457-2w6ks
```

### 2. Check Service Endpoints

```bash
kubectl get endpoints -n backend-boilerplate backend-boilerplatedotkonkerdotdev
```

**Result:**

```
NAME                                 ENDPOINTS         AGE
backend-boilerplatedotkonkerdotdev   10.42.0.41:3000   18h
```

**Analysis:** ✅ Service has endpoints - pod is registered correctly

### 3. Check Pod Logs

```bash
kubectl logs -n backend-boilerplate $POD
```

**Result:** No output (no startup logging in current version)

### 4. Describe Pod

```bash
kubectl describe pod -n backend-boilerplate $POD
```

**Key findings:**

- Status: Running
- Ready: True
- Container ID: containerd://7185e909bfff8a5bb29c82cab890b9bd83e9b91a5e4f942ad2d62a65cba9be32
- Image: 047719649582.dkr.ecr.eu-west-1.amazonaws.com/backend-boilerplate.konker.dev:latest
- Port: 3000/TCP
- No health probes configured
- No recent events

**Analysis:** ✅ Pod appears healthy from Kubernetes perspective

### 5. Test Application from Within Cluster

```bash
kubectl run test-curl --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -v http://backend-boilerplatedotkonkerdotdev.backend-boilerplate.svc.cluster.local:3000/
```

**Result:**

```
* Host backend-boilerplatedotkonkerdotdev.backend-boilerplate.svc.cluster.local:3000 was resolved.
* IPv4: 10.43.11.115
*   Trying 10.43.11.115:3000...
* Connected to backend-boilerplatedotkonkerdotdev.backend-boilerplate.svc.cluster.local (10.43.11.115:3000)
> GET / HTTP/1.1
> Host: backend-boilerplatedotkonkerdotdev.backend-boilerplate.svc.cluster.local:3000
> User-Agent: curl/8.17.0
> Accept: */*
>
< HTTP/1.1 200 OK
< content-type: application/json; charset=utf-8
< Content-Length: 93
<
{"apiId":"backend-boilerplate-konker-dev","version":"0.0.2","ip":"UNKNOWN","konker":"RULEZ!"}
```

**Analysis:** ✅✅ **CRITICAL FINDING** - Application is working correctly and responding with 200 OK from within the cluster. This means:

- The app is running properly
- Service routing is working
- The issue is NOT with the application or k8s service
- **The issue must be with the Traefik IngressRoute**

### 6. Check Traefik Logs

```bash
kubectl logs -n traefik traefik-87ddb4fc4-vbq2q --tail=100 | grep -i backend-boilerplate
```

**Result:**

```
2025-12-05T19:01:55Z ERR error="kubernetes service not found: backend-boilerplate/backend-boilerplatedotkonkerdotdev"
  ingress=backend-boilerplatedotkonkerdotdev namespace=backend-boilerplate providerName=kubernetescrd
```

**Analysis:** 🔴 **ROOT CAUSE IDENTIFIED** - Traefik logged an error that it couldn't find the service

### 7. Check IngressRoute and Service Creation Times

```bash
kubectl describe ingressroute -n backend-boilerplate backend-boilerplatedotkonkerdotdev
```

**Result:**

```
Creation Timestamp:  2025-12-05T19:01:55Z
```

```bash
kubectl get service -n backend-boilerplate backend-boilerplatedotkonkerdotdev -o yaml
```

**Result:**

```
creationTimestamp: "2025-12-05T19:01:56Z"
```

**Analysis:** 🔴 **TIMING ISSUE IDENTIFIED**

- IngressRoute created: `2025-12-05T19:01:55Z`
- Service created: `2025-12-05T19:01:56Z` (1 second LATER)
- Traefik tried to configure the route before the service existed
- Traefik cached the error and never retried
- Service now exists and is working, but Traefik still has stale error state

## Root Cause

**Timing race condition during initial deployment:**

1. IngressRoute was created 1 second before the Service
2. Traefik attempted to configure routing immediately
3. Service didn't exist yet → error logged
4. Traefik cached the error state
5. Service was created shortly after
6. Traefik never retried the configuration
7. External requests fail with 503, but internal cluster requests work fine

## Solution

Recreate the IngressRoute to force Traefik to re-read the configuration:

```bash
# Delete the IngressRoute
kubectl delete ingressroute -n backend-boilerplate backend-boilerplatedotkonkerdotdev

# Recreate it
kubectl apply -f deployment/k8s/k8s-ingresroute.yaml

# Wait a few seconds for Traefik to process
sleep 3

# Test external access
curl https://backend-boilerplate.hetzner.konker.dev/
```

**Result:**

```json
{ "apiId": "backend-boilerplate-konker-dev", "version": "0.0.2", "ip": "10.42.0.1", "konker": "RULEZ!" }
```

## Verification

```bash
# Test with headers
curl -I https://backend-boilerplate.hetzner.konker.dev/
```

**Result:**

```
HTTP/2 200
content-type: application/json; charset=utf-8
...
```

✅ **503 Error Resolved** - External access now working correctly

## Key Learnings

1. **Always test from multiple access points** - Testing from within the cluster revealed the app was working
2. **Check ingress controller logs** - Traefik logs contained the critical error message
3. **Verify resource creation order** - k8s resources may be created in unexpected order
4. **Traefik caches errors** - IngressRoute may need to be recreated if services are created out of order
5. **Service endpoints are populated** doesn't mean ingress is configured correctly

## Prevention

To avoid this timing issue in future deployments:

1. Ensure Service is created before IngressRoute (separate kubectl apply commands)
2. Add health probes so k8s only marks pod Ready when actually serving traffic
3. Monitor ingress controller logs during deployments
4. Consider adding retry logic or watching for service changes in the ingress controller configuration
