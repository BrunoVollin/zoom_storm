# ⚙️ Configuração do Debugger - Estado Atual

## 📍 Localização dos Ficheiros de Configuração

```
checkout-service/
├── .vscode/
│   ├── launch.json          ← Configuração do debugger (ATUALIZADO)
│   ├── settings.json        ← Definições do workspace (NOVO)
│   ├── DEBUG-GUIDE.md       ← Este guia de troubleshooting (NOVO)
│   └── cleanup-port.sh      ← Script para limpar portas (NOVO)
├── tsconfig.json            ← TypeScript config (sourceMap ✓)
├── tsconfig.build.json      ← TypeScript build config
├── package.json             ← NPM scripts
├── src/
│   ├── infrastructure/
│   │   └── server.ts        ← Ponto de entrada
│   ├── domain/
│   ├── use-cases/
│   ├── adapters/
│   └── di/
```

---

## 🔴 Causas Resolvidas

| # | Causa | Estado | Ação |
|---|-------|--------|------|
| 1 | Source Maps não ativadas | ✅ RESOLVIDA | `tsconfig.json` tem `"sourceMap": true` |
| 2 | `--enable-source-maps` não estava em runtimeArgs | ✅ RESOLVIDA | Adicionado a `launch.json` |
| 3 | Falta de configuração de `outFiles` | ✅ RESOLVIDA | Configurado em `launch.json` |
| 4 | Path aliases não resolvidos | ✅ RESOLVIDA | `resolveSourceMapLocations` adicionado |
| 5 | Processo zumbi na porta 3000 | ✅ RESOLVIDA | PID 20599 eliminado |

---

## 📋 Configurações Aplicadas

### `launch.json`

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Checkout Service",
  "runtimeExecutable": "node",
  "runtimeArgs": [
    "--enable-source-maps",
    "--import",
    "tsx"
  ],
  "args": ["${workspaceFolder}/src/infrastructure/server.ts"],
  "outFiles": ["${workspaceFolder}/**/*.js"],
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**",
    "!**/node_modules/**"
  ],
  "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
  "console": "integratedTerminal",
  "sourceMaps": true,
  "sourceMapPathOverrides": { "tsx/*": "${workspaceFolder}/*" }
}
```

### `tsconfig.json` (Secção Relevante)

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@use-cases/*": ["src/use-cases/*"],
      "@adapters/*": ["src/adapters/*"],
      "@infrastructure/*": ["src/infrastructure/*"]
    }
  }
}
```

---

## ✅ Como Testar

1. **Limpar processos zumbis:**
   ```bash
   bash .vscode/cleanup-port.sh
   ```

2. **Pressionar F5** para iniciar o debugger

3. **Colocar breakpoint** em qualquer ficheiro `.ts`:
   - `src/infrastructure/server.ts`
   - `src/adapters/controllers/CreateOrderController.ts`
   - `src/use-cases/create-order/CreateOrderUseCase.ts`

4. **Enviar requisição HTTP** usando REST Client:
   ```http
   POST http://localhost:3000/orders
   Content-Type: application/json

   {
     "customerId": "cust_123",
     "items": [
       {
         "productId": "prod_1",
         "quantity": 2,
         "unitPriceCents": 1500
       }
     ]
   }
   ```

5. **Verificar** que o debugger pausa no breakpoint

---

## 🎯 Estado Final

- ✅ Source Maps ativadas
- ✅ Debugger corretamente configurado
- ✅ Path aliases resolvidos
- ✅ Portas limpas e disponíveis
- ✅ Pronto para debugging!

**Próximo passo:** Pressione **F5** e comece a debugar! 🚀
