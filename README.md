# The Long Distance Company

Site vitrine de The Long Distance Company (exploration et outdoor, Lyon) : accompagnement de projets longue distance, tests de matériel pour les marques, coaching de chefs d'entreprise.

- `index.html` : page d'accueil
- `assets/css/style.css` : styles (style guide « San Rita »)
- `assets/js/main.js` : animations GSAP + ScrollTrigger, défilement fluide Lenis
- `assets/img/` : photos Unsplash provisoires (auteurs dans `CREDITS.txt`)

## Voir le site en local

```bash
python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080. GSAP, Lenis et les polices sont chargés depuis des CDN, il faut donc une connexion internet.

## À faire

- Remplacer l'email et le téléphone provisoires (`email@exemple.fr`, `+33 (0)0 00 00 00 00`)
- Créer les pages `a-propos.html`, `services.html` et `contact.html`
