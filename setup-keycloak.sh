#!/usr/bin/env bash
set -e

KEYCLOAK_URL="http://localhost:3040"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM="zoom-storm"
CLIENT_ID="bff"
CLIENT_SECRET="hjOm3lu18570zFI86ZyJ5uDP6dieUaL5"

echo "Obtaining admin token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASSWORD&grant_type=password" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Creating realm '$REALM'..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'"$REALM"'",
    "enabled": true,
    "displayName": "Zoom Storm",
    "registrationAllowed": true,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true,
    "accessTokenLifespan": 300,
    "ssoSessionIdleTimeout": 1800,
    "ssoSessionMaxLifespan": 36000,
    "offlineSessionIdleTimeout": 2592000
  }' -w "\nRealm HTTP %{http_code}\n"

echo "Creating client '$CLIENT_ID'..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'"$CLIENT_ID"'",
    "enabled": true,
    "protocol": "openid-connect",
    "publicClient": false,
    "secret": "'"$CLIENT_SECRET"'",
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": false,
    "redirectUris": [
      "http://localhost:8088/auth/callback",
      "http://localhost:3100/api/auth/callback"
    ],
    "webOrigins": [
      "http://localhost:3100"
    ],
    "attributes": {
      "pkce.code.challenge.method": "S256",
      "use.refresh.tokens": "true"
    }
  }' -w "\nClient HTTP %{http_code}\n"

echo "Creating test user..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@test.com",
    "firstName": "Test",
    "lastName": "User",
    "enabled": true,
    "credentials": [{ "type": "password", "value": "test123", "temporary": false }]
  }' -w "\nUser HTTP %{http_code}\n"

echo "Creating user bruno..."
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bruno",
    "email": "bruno@test.com",
    "firstName": "Bruno",
    "lastName": "",
    "enabled": true,
    "credentials": [{ "type": "password", "value": "123", "temporary": false }]
  }' -w "\nUser HTTP %{http_code}\n"

echo "Done."
echo "  test / test123"
echo "  bruno / 123"
