# PWA button text fix

## Pending change
In `index.html`, change line:
```
pwaBtn.textContent = '🔄 Actualizar';
```
to:
```
pwaBtn.textContent = '📲 Actualizar App';
```

So both install and update buttons use the same 📲 emoji, and the update one says "Actualizar App" to match "Instalar App".

## Context
User noticed `controllerchange` was showing "🔄 Actualizar" even when the PWA wasn't installed. Fixed that to only show when in standalone mode. Now just needs the text/emoji alignment.
