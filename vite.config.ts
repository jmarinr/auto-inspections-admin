import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/auto-inspections-admin/',
})
```

Haz commit de este cambio.

---

### 4️⃣ Configurar Pages

1. Ve a **Settings** → **Pages**
2. En **Source** selecciona **GitHub Actions**

Después de esto, el workflow se ejecutará y tu sitio estará en:
```
https://jmarinr.github.io/auto-inspections-admin/
