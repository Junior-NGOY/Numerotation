# Composant Combobox Searchable

Un composant de sélection avec recherche réutilisable, basé sur Radix UI et Shadcn/ui.

## Caractéristiques

- 🔍 **Recherche intégrée** : Filtrage instantané des options
- ⌨️ **Accessible** : Navigation clavier complète
- 🎨 **Personnalisable** : Style cohérent avec le design system
- 📱 **Responsive** : Fonctionne sur tous les appareils
- ♿ **ARIA compliant** : Support complet de l'accessibilité

## Utilisation

### Import

\`\`\`tsx
import { Combobox } from "@/components/ui/combobox"
\`\`\`

### Exemple basique

\`\`\`tsx
<Combobox
  options={[
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="Sélectionner..."
/>
\`\`\`

### Exemple avec recherche avancée

\`\`\`tsx
<Combobox
  options={proprietaires.map((p) => ({
    value: p.id,
    label: \`\${p.prenom} \${p.nom}\`,
    // searchText permet de rechercher sur des champs additionnels
    searchText: \`\${p.prenom} \${p.nom} \${p.telephone} \${p.numeroPiece}\`,
  }))}
  value={selectedProprietaire}
  onValueChange={setSelectedProprietaire}
  placeholder="Sélectionner un propriétaire"
  searchPlaceholder="Rechercher par nom, téléphone ou N° pièce..."
  emptyText="Aucun propriétaire trouvé"
/>
\`\`\`

## Props

| Prop | Type | Description | Défaut |
|------|------|-------------|--------|
| `options` | `ComboboxOption[]` | Liste des options à afficher | Requis |
| `value` | `string` | Valeur sélectionnée | `undefined` |
| `onValueChange` | `(value: string) => void` | Callback appelé lors de la sélection | Requis |
| `placeholder` | `string` | Texte affiché quand aucune sélection | `"Sélectionner..."` |
| `searchPlaceholder` | `string` | Placeholder du champ de recherche | `"Rechercher..."` |
| `emptyText` | `string` | Message si aucun résultat | `"Aucun résultat trouvé."` |
| `className` | `string` | Classes CSS additionnelles | `undefined` |
| `disabled` | `boolean` | Désactive le composant | `false` |

## Type ComboboxOption

\`\`\`typescript
interface ComboboxOption {
  value: string        // Valeur unique de l'option
  label: string        // Texte affiché dans la liste
  searchText?: string  // Texte additionnel pour améliorer la recherche
}
\`\`\`

## Utilisations dans le projet

### 1. Formulaire de véhicules - Sélection du propriétaire
**Fichier**: `app/vehicules/page.tsx`

Permet de rechercher un propriétaire par nom, téléphone ou numéro de pièce.

### 2. Formulaire de véhicules - Sélection de l'itinéraire
**Fichier**: `app/vehicules/page.tsx`

Permet de rechercher un itinéraire par nom ou description.

### 3. Page documents - Sélection du véhicule pour PDF
**Fichier**: `app/documents/page.tsx`

Permet de rechercher un véhicule par:
- Marque et modèle
- Numéro d'immatriculation
- Code unique
- Nom du propriétaire
- Téléphone du propriétaire

## Avantages par rapport au Select classique

- ✅ **Recherche instantanée** : Utile pour les longues listes
- ✅ **Meilleure UX** : Pas besoin de scroller pour trouver une option
- ✅ **Flexible** : Recherche sur plusieurs champs via `searchText`
- ✅ **Performance** : Filtrage côté client optimisé
- ✅ **Accessible** : Meilleur support screen readers

## Notes techniques

- Utilise `cmdk` pour la gestion de la recherche
- Basé sur Radix UI Popover pour le positionnement
- Intégration complète avec Shadcn/ui
- Support du thème clair/sombre automatique
