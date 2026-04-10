# FileFlow — Application de conversion et signature de documents

## Contexte
Application web à usage privé (admin + invités) permettant de convertir des
fichiers et de signer des documents PDF. Stack : Next.js 14 App Router,
Tailwind CSS, Supabase, Resend, déployé sur Vercel + microservice Render.

---

## Architecture globale

### Frontend / Backend
- **Framework** : Next.js 14 (App Router)
- **Styling** : Tailwind CSS
- **Auth** : Supabase Auth (email + mot de passe)
- **DB & Storage** : Supabase (PostgreSQL + Supabase Storage)
- **Emails** : Resend (invitations, notifications)
- **Manipulation PDF** : pdf-lib (côté serveur dans les API routes)
- **Déploiement** : Vercel (Hobby plan)

### Microservice de conversion
- **Technologie** : Gotenberg (image Docker officielle `gotenberg/gotenberg:8`)
- **Déploiement** : Render (free tier)
- **Rôle** : Conversion DOCX → PDF et PDF → DOCX via LibreOffice headless
- **Communication** : API routes Next.js appellent ce microservice via HTTP

---

## Fonctionnalités

### 1. Authentification & Gestion des accès
- Page de login (email + mot de passe) via Supabase Auth
- Middleware Next.js protégeant toutes les routes sauf `/login`
- Rôles stockés dans la table `profiles` : `admin` ou `user`
- Le premier compte créé (ou compte avec email défini dans `.env`) est automatiquement `admin`
- **Panel admin** (`/admin`) :
  - Inviter un utilisateur par email (Resend envoie un magic link Supabase + email personnalisé)
  - Lister les utilisateurs existants
  - Révoquer l'accès d'un utilisateur (désactiver le compte Supabase)

---

### 2. Conversion de fichiers (`/convert`)

#### Interface principale
Deux dropdowns côte à côte avec un bouton swap central (comme les sélecteurs
de destination sur Google Flights / Kayak) :

```
┌─────────────────┐     ┌─────────────────┐
│  FROM  ▼        │  ⇄  │  TO  ▼          │
│  PDF            │     │  DOCX           │
└─────────────────┘     └─────────────────┘

     ┌──────────────────────────────┐
     │  Glissez votre fichier ici   │
     │  ou cliquez pour parcourir   │
     └──────────────────────────────┘

              [  Convertir  ]
```

#### Comportement des dropdowns
- **Dropdown FROM** : liste tous les formats source disponibles
  `PDF, DOCX, XLSX, JPG, PNG, WebP`
- **Dropdown TO** : se met à jour dynamiquement selon le FROM choisi,
  en affichant uniquement les formats de sortie compatibles :

| FROM | TO possibles |
|------|-------------|
| PDF  | DOCX, JPG, PNG |
| DOCX | PDF |
| XLSX | PDF |
| JPG  | PDF, PNG, WebP |
| PNG  | PDF, JPG, WebP |
| WebP | JPG, PNG, PDF |

- Quand l'utilisateur upload un fichier, le **FROM se règle automatiquement**
  selon l'extension détectée, et le TO prend la valeur par défaut la plus
  logique (ex: DOCX uploadé → TO = PDF)

#### Bouton swap ⇄
- Inverse FROM et TO si la combinaison inverse est supportée
- Si la combinaison inverse n'existe pas dans la matrice ci-dessus →
  le bouton est désactivé (grisé) avec un tooltip "Conversion inverse non disponible"
- Animation de rotation 180° sur le bouton au clic (transition CSS)

#### Conversions et moteurs utilisés
| Conversion | Moteur |
|---|---|
| DOCX → PDF | Gotenberg |
| XLSX → PDF | Gotenberg |
| PDF → DOCX | Gotenberg |
| JPG / PNG / WebP → PDF | pdf-lib (côté serveur) |
| PDF → JPG / PNG | sharp (côté serveur) |
| JPG ↔ PNG ↔ WebP | sharp (côté serveur) |

#### UX post-upload
- Barre de progression pendant la conversion
- Si Render est en cold start : message explicite "Démarrage du moteur de
  conversion... (peut prendre 30 secondes)"
- Téléchargement automatique du fichier converti
- Bouton "Nouvelle conversion" pour réinitialiser l'interface

#### Historique (table `conversions` Supabase)
```sql
id, user_id, original_filename, original_format, output_format, created_at, file_size
```

---

### 3. Éditeur & Signature PDF (`/sign`)

Workflow en 3 étapes :

**Étape 1 — Upload**
- Upload d'un PDF ou d'un DOCX (converti automatiquement en PDF via Gotenberg avant signature)

**Étape 2 — Édition & Signature**
- Visualisation du PDF page par page (react-pdf)
- Ajout de la signature via l'une de ces deux méthodes :
  - Canvas de dessin (react-signature-canvas)
  - Upload d'une image de signature (PNG avec transparence)
- Drag & drop de la signature sur la page souhaitée
- Redimensionnement de la signature
- Ajout optionnel d'un bloc de texte (nom, date, titre)

**Étape 3 — Génération du document signé**
- La signature est incrustée dans le PDF via pdf-lib (API route `/api/sign`)
- Génération d'un hash SHA-256 du document final
- Stockage dans Supabase Storage (bucket privé `signed-documents`)
- Enregistrement dans la table `signed_documents` :
  ```sql
  id, user_id, original_filename, signed_at, sha256_hash, signer_ip, storage_path
  ```
- Génération d'un "certificat d'audit" : page PDF supplémentaire ajoutée
  en fin de document contenant :
  - Nom du signataire (depuis profil Supabase)
  - Date et heure de signature (UTC)
  - Hash SHA-256 du document
  - IP du signataire
- Téléchargement du PDF final signé

---

### 4. Dashboard (`/dashboard`)
- Historique des conversions récentes
- Historique des documents signés avec lien de téléchargement
- Espace de stockage utilisé (depuis Supabase Storage)

---

## Structure des dossiers

```
/app
  /login          → page de connexion
  /dashboard      → tableau de bord utilisateur
  /convert        → outil de conversion (dropdowns + swap + drag&drop)
  /sign           → outil de signature PDF
  /admin          → panel admin (protégé rôle admin)
  /api
    /convert      → route API : appelle Gotenberg ou pdf-lib/sharp
    /sign         → route API : incrustation signature + hash SHA-256
    /admin
      /invite     → route API : envoi invitation Resend
      /revoke     → route API : désactivation compte Supabase

/components
  /ui             → composants génériques (Button, Card, Badge, Tooltip...)
  /convert        → FileDropzone, FormatDropdown, SwapButton, ConversionProgress
  /sign           → PDFViewer, SignatureCanvas, SignatureDragger, AuditCertificate
  /admin          → UserTable, InviteForm
  /layout         → Navbar, Sidebar, ProtectedRoute

/lib
  supabase.ts     → client Supabase (server + client)
  gotenberg.ts    → helper pour appeler le microservice Render
  pdf.ts          → helpers pdf-lib (hash SHA-256, incrustation, certificat audit)
  sharp.ts        → helpers sharp (PDF→images, images→images)
  resend.ts       → templates emails Resend

/middleware.ts    → protection des routes (toutes sauf /login)
```

---

## Variables d'environnement (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=

# Gotenberg (URL du microservice Render)
GOTENBERG_URL=https://ton-service.onrender.com

# Admin
ADMIN_EMAIL=ton@email.com
```

---

## Base de données Supabase — Schéma SQL

```sql
-- Profils utilisateurs (créé automatiquement via trigger auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Trigger : création automatique du profil à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true)
         then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Historique des conversions
create table conversions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  original_filename text,
  original_format text,
  output_format text,
  file_size bigint,
  created_at timestamptz default now()
);

-- Documents signés
create table signed_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  original_filename text,
  signed_at timestamptz default now(),
  sha256_hash text,
  signer_ip text,
  storage_path text
);

-- RLS : chaque utilisateur voit uniquement ses propres données
alter table profiles enable row level security;
alter table conversions enable row level security;
alter table signed_documents enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id);

create policy "own conversions" on conversions
  for all using (auth.uid() = user_id);

create policy "own signed docs" on signed_documents
  for all using (auth.uid() = user_id);

-- Admin : accès total sur toutes les tables
create policy "admin full access profiles" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin full access conversions" on conversions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin full access signed docs" on signed_documents
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

---

## Microservice Gotenberg — Instructions de déploiement sur Render

Sur Render, créer un **Web Service** avec les paramètres suivants :
- **Type** : Docker
- **Image Docker** : `gotenberg/gotenberg:8`
- **Port** : `3000`
- **Plan** : Free
- Aucune variable d'environnement requise

L'URL obtenue (ex: `https://fileflow-gotenberg.onrender.com`)
est à renseigner dans `GOTENBERG_URL` dans `.env.local`.

---

## Points d'attention pour Claude Code

1. **Cold start Render** : afficher un loader explicite côté UI
   ("Démarrage du moteur de conversion... ~30 secondes") dès que
   Gotenberg est appelé.

2. **Limite de taille fichier** : 10MB max, configurable dans `next.config.js` :
   ```js
   api: { bodyParser: { sizeLimit: '10mb' } }
   ```

3. **Fichiers non persistés sur Vercel** : les fichiers transitent uniquement
   en mémoire (Buffer) dans les API routes. Seuls les documents signés sont
   stockés dans Supabase Storage.

4. **Bucket Supabase Storage** `signed-documents` en mode **privé** avec RLS activée.

5. **Bootstrap admin** : au premier login, si l'email de l'utilisateur correspond
   à `ADMIN_EMAIL` dans `.env`, mettre à jour son rôle à `admin` dans `profiles`.

6. **Swap button** : la matrice de compatibilité FROM/TO doit être définie dans
   un fichier de config centralisé (`/lib/formats.ts`) utilisé à la fois par
   le composant `SwapButton`, les deux `FormatDropdown`, et la validation
   côté API route `/api/convert`.

7. **sharp** doit être installé en tant que dépendance optionnelle pour
   être compatible avec le build Vercel :
   ```bash
   npm install sharp --save-optional
   ```

---

## Nom du projet
**FileFlow** — tagline : *"Convertissez. Modifiez. Signez."*
