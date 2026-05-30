# 🐛 Guia de Troubleshooting - Debugger VS Code

## Problema: Breakpoints Não São Atingidos

### ✅ Soluções Aplicadas

1. **Source Maps Ativadas** ✓
   - `tsconfig.json`: `"sourceMap": true`
   - `launch.json`: `"--enable-source-maps"` adicionado aos `runtimeArgs`

2. **Configuração Corrigida do Debugger** ✓
   - `outFiles` configurado para mapear ficheiros TypeScript
   - `resolveSourceMapLocations` para resolver path aliases (`@domain/*`, `@infrastructure/*`, etc)
   - `sourceMapPathOverrides` para o `tsx`

3. **Porta Liberada** ✓
   - Processo Node zumbi na porta 3000 foi eliminado
   - Porta 3000 está disponível para o debugger

---

## 📋 Checklist Antes de Debugar

- [ ] Confirmar que não há processos Node ativos: `lsof -i :3000`
- [ ] Executar `npm install` (se houver mudanças em `package.json`)
- [ ] Limpar `.vscode/` cache se necessário
- [ ] Colocar breakpoint no ficheiro desejado
- [ ] Pressionar **F5** para iniciar o debugger
- [ ] Enviar requisição HTTP (REST Client ou `curl`)

---

## 🔧 Comandos Úteis

### Limpar Processos Zumbis

```bash
# Eliminar processo na porta 3000
bash .vscode/cleanup-port.sh

# Eliminar processo em porta específica
bash .vscode/cleanup-port.sh 8080
```

### Verificar Porta

```bash
lsof -i :3000
```

### Iniciar Desenvolvimento

```bash
npm run dev    # Modo watch (sem debugger)
npm run build  # Compilar TypeScript
```

---

## 🎯 Testando o Debugger

1. **Coloque um breakpoint** na primeira linha de `src/infrastructure/server.ts`:
   ```typescript
   import 'reflect-metadata';
   // ← Clique aqui para adicionar breakpoint
   ```

2. **Pressione F5** para iniciar o debugger

3. **Verifique** no terminal integrado que a aplicação iniciou:
   ```
   Server listening on port 3000
   ```

4. **Abra `test.http`** e execute a requisição POST

5. **Verifique** que o breakpoint foi atingido no VS Code

---

## 💡 Dicas Avançadas

### Se o Debugger Não Pausar nos Breakpoints:

1. **Verifique se é um breakpoint verificado** (bolinha vermelha sólida)
   - Bolinha cinzenta = breakpoint não verificado
   - Solução: Reinicie o debugger (Ctrl+Shift+F5)

2. **Verifique os Path Aliases**
   - Abra a Dev Tools (Ctrl+Shift+J) no VS Code
   - Verifique se os ficheiros estão sendo mapeados corretamente

3. **Experimente um Breakpoint Condicional**
   - Clique com botão direito no breakpoint
   - Selecione "Edit Breakpoint"
   - Adicione uma condição: `true`

4. **Teste sem `tsx`** (método alternativo):
   - Execute: `npm run build`
   - Altere `launch.json` para:
     ```json
     "program": "${workspaceFolder}/dist/infrastructure/server.js"
     ```
   - Pressione F5

---

## 📊 Estrutura de Debug Neste Projeto

- **Runtime**: Node.js v22+
- **Transpilador**: `tsx` (TypeScript on-the-fly)
- **Source Maps**: Ativadas (`sourceMap: true` em `tsconfig.json`)
- **Path Aliases**: Configurados em `tsconfig.json` (ex: `@domain/*`)
- **DI Container**: `tsyringe` com `reflect-metadata`

---

## 🚀 Próximos Passos

1. ✅ Pressione **F5** para iniciar o debugger
2. ✅ Coloque breakpoints nos Controllers ou Use Cases
3. ✅ Envie requisições HTTP via REST Client
4. ✅ Inspecione variáveis no painel de Debug

Agora o debugger deve parar nos breakpoints! 🎉
