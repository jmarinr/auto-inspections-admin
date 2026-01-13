import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})
```

Haz commit.

---

### Paso 3: Crear archivo CNAME

Crea un archivo nuevo en la carpeta `public/` llamado `CNAME` (sin extensión) con este contenido:
```
inspections-admin.henkancx.com
