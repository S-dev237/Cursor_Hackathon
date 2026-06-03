# Plan d'Implémentation — Gestion de Documents Académiques
## Architecture Domain-Driven Design (DDD)

**Stack :** FastAPI · SQLModel · React Native · PostgreSQL · MinIO · LanceDB · Prolog  
**Édition :** Hackathon JUIN 2026

---

## Table des matières

1. [Principes DDD appliqués](#1-principes-ddd-appliqués)
2. [Bounded Contexts](#2-bounded-contexts)
3. [Structure du projet FastAPI](#3-structure-du-projet-fastapi)
4. [Détail de chaque Bounded Context](#4-détail-de-chaque-bounded-context)
   - 4.1 [IAM — Identity & Access Management](#41-iam--identity--access-management)
   - 4.2 [Académique — Organisation](#42-académique--organisation)
   - 4.3 [Document — Ressource documentaire](#43-document--ressource-documentaire)
   - 4.4 [Classification — Taxonomie & Prolog](#44-classification--taxonomie--prolog)
   - 4.5 [RAG — Vectorisation LanceDB](#45-rag--vectorisation-lancedb)
   - 4.6 [Usage — Analytics & Interactions](#46-usage--analytics--interactions)
5. [Schéma SQLModel & PostgreSQL](#5-schéma-sqlmodel--postgresql)
6. [LanceDB — Stockage vectoriel](#6-lancedb--stockage-vectoriel)
7. [Shared Kernel & Infrastructure](#7-shared-kernel--infrastructure)
8. [API REST — Endpoints par contexte](#8-api-rest--endpoints-par-contexte)
9. [Phases d'implémentation](#9-phases-dimplémentation)
10. [Application React Native](#10-application-react-native)
11. [Diagramme d'architecture](#11-diagramme-darchitecture)

---

## 1. Principes DDD appliqués

### Glossaire DDD dans ce projet

| Concept DDD | Définition | Exemple Python |
|-------------|-----------|---------------|
| **Bounded Context** | Frontière dans laquelle un modèle de domaine est cohérent | `modules/iam/`, `modules/document/` |
| **Aggregate Root** | Entité racine qui garantit les invariants | `class Ressource` |
| **Entity** | Objet avec identité persistante | `class Utilisateur`, `class UE` |
| **Value Object** | Immuable, défini par valeur, `@dataclass(frozen=True)` | `Email`, `NiveauAcces`, `CodeUE` |
| **Domain Event** | Fait métier passé, `@dataclass(frozen=True)` | `RessourceCreeEvent` |
| **Repository** | `ABC` dans le domaine, implémenté en infrastructure | `IUtilisateurRepository` |
| **Use Case** | Orchestre le domaine, sans logique métier | `InscrireUtilisateurUseCase` |
| **Domain Service** | Logique métier multi-agrégats | `PolitiqueAccesService` |
| **Port / Adapter** | Interface domaine + implémentation infra (ACL) | `IStockagePort` → `MinioAdapter` |

### Règles architecturales

```
Règle 1 — Dépendance vers l'intérieur
  infrastructure/ → application/ → domain/
  (domain/ n'importe ni SQLModel, ni FastAPI, ni LanceDB)

Règle 2 — Communication inter-contextes par événements
  Document Context  --RessourceCreeEvent-->  RAG Context (indexation)
  Document Context  --RessourceCreeEvent-->  Classification Context

Règle 3 — Un contexte = un schéma PostgreSQL
  iam.*, academique.*, document.*, classification.*, rag.*, usage.*

Règle 4 — Value Objects immuables (@dataclass frozen=True)
  NiveauAcces("CAMPUS")  →  .valeur = "PRIVE"  →  FrozenInstanceError

Règle 5 — SQLModel seulement en infrastructure/persistence/
  Les modèles SQLModel (table=True) ne doivent JAMAIS apparaître dans domain/
  Le Mapper traduit Domain Entity ↔ SQLModel ORM Model
```

---

## 2. Bounded Contexts

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CARTE DES BOUNDED CONTEXTS                         │
│                                                                       │
│  ┌─────────────────┐      ┌──────────────────────────────────────┐   │
│  │  IAM Context    │      │        Document Context              │   │
│  │                 │      │                                      │   │
│  │  Utilisateur ◄──┼──────┤  Ressource (Aggregate Root) ★       │   │
│  │  Role           │      │  ├─ Fichier                         │   │
│  │  NiveauAcces(VO)│      │  ├─ RessourceAuteur                 │   │
│  └────────┬────────┘      │  └─ RessourceUE                     │   │
│           │               └───────────────┬──────────────────────┘   │
│     [ACL] │                               │ Domain Events             │
│           ▼               ┌───────────────┼───────────┐              │
│  ┌─────────────────┐      ▼               ▼           ▼              │
│  │  Académique     │  ┌──────────┐  ┌──────────┐ ┌──────────────┐   │
│  │  Context        │  │Classific.│  │  RAG     │ │  Usage       │   │
│  │                 │  │ Context  │  │  Context │ │  Context     │   │
│  │  Faculte        │  │          │  │          │ │              │   │
│  │  Departement    │  │Thematique│  │  LanceDB │ │ Consultation │   │
│  │  Formation      │  │MotCle    │  │  Chunks  │ │ Télécharge.  │   │
│  │  UE ◄───────────┼──┤[Prolog]  │  │  Embed.  │ │ Favori       │   │
│  └─────────────────┘  └──────────┘  └──────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Ownership des données

| Bounded Context | PostgreSQL (schema) | LanceDB | MinIO |
|----------------|---------------------|---------|-------|
| IAM | `iam.*` | — | — |
| Académique | `academique.*` | — | — |
| Document | `document.*` | — | `bucket: documents` |
| Classification | `classification.*` | — | — |
| RAG | `rag.*` (métadonnées chunks) | `table: chunks` | — |
| Usage | `usage.*` | — | — |

---

## 3. Structure du projet FastAPI

```
backend/
├── src/
│   │
│   ├── shared/                          # Shared Kernel
│   │   ├── domain/
│   │   │   ├── aggregate_root.py        # AggregateRoot base class
│   │   │   ├── entity.py
│   │   │   ├── value_object.py          # ValueObject base (frozen dataclass)
│   │   │   ├── domain_event.py          # IDomainEvent protocol
│   │   │   └── result.py                # Result[T, E] — Railway pattern
│   │   ├── application/
│   │   │   ├── use_case.py              # Protocol IUseCase[I, O]
│   │   │   └── event_bus.py             # IEventBus ABC
│   │   └── infrastructure/
│   │       ├── database.py              # SQLModel engine + get_session
│   │       ├── event_bus.py             # SimpleEventBus implémentation
│   │       └── settings.py             # Pydantic Settings
│   │
│   ├── modules/
│   │   │
│   │   ├── iam/                         # ① Identity & Access Management
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── utilisateur.py   # Aggregate Root
│   │   │   │   ├── value_objects/
│   │   │   │   │   ├── email.py
│   │   │   │   │   ├── mot_de_passe.py
│   │   │   │   │   └── niveau_acces.py
│   │   │   │   ├── events/
│   │   │   │   │   └── utilisateur_cree.py
│   │   │   │   └── repositories/
│   │   │   │       └── utilisateur_repository.py  # ABC
│   │   │   ├── application/
│   │   │   │   └── use_cases/
│   │   │   │       ├── inscrire_utilisateur.py
│   │   │   │       └── connecter_utilisateur.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── models.py        # SQLModel table=True
│   │   │   │   │   ├── repository.py    # implements ABC
│   │   │   │   │   └── mapper.py        # Domain ↔ SQLModel
│   │   │   │   └── http/
│   │   │   │       ├── router.py        # APIRouter FastAPI
│   │   │   │       ├── schemas.py       # Pydantic request/response
│   │   │   │       └── dependencies.py  # Depends()
│   │   │   └── iam_module.py            # wiring DI
│   │   │
│   │   ├── academique/                  # ② Organisation Académique
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/ue.py
│   │   │   │   ├── entities/
│   │   │   │   │   ├── faculte.py
│   │   │   │   │   ├── departement.py
│   │   │   │   │   └── formation.py
│   │   │   │   └── value_objects/
│   │   │   │       ├── code_ue.py
│   │   │   │       ├── niveau_formation.py
│   │   │   │       └── semestre.py
│   │   │   ├── application/use_cases/
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/models.py
│   │   │   │   └── http/router.py
│   │   │   └── academique_module.py
│   │   │
│   │   ├── document/                    # ③ Ressource Documentaire (cœur)
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── ressource.py     # ★ Aggregate Root
│   │   │   │   ├── entities/
│   │   │   │   │   ├── fichier.py
│   │   │   │   │   ├── auteur.py
│   │   │   │   │   └── ressource_auteur.py
│   │   │   │   ├── value_objects/
│   │   │   │   │   ├── type_document.py
│   │   │   │   │   ├── categorie_document.py
│   │   │   │   │   ├── titre_document.py
│   │   │   │   │   └── doi.py
│   │   │   │   ├── events/
│   │   │   │   │   ├── ressource_cree.py
│   │   │   │   │   ├── fichier_ajoute.py
│   │   │   │   │   └── ressource_publiee.py
│   │   │   │   ├── services/
│   │   │   │   │   └── politique_acces.py   # Domain Service
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── ressource_repository.py  # ABC
│   │   │   │   │   └── fichier_repository.py    # ABC
│   │   │   │   └── ports/
│   │   │   │       └── stockage_port.py          # IStockagePort ABC
│   │   │   ├── application/use_cases/
│   │   │   │   ├── creer_ressource.py
│   │   │   │   ├── ajouter_fichier.py
│   │   │   │   └── lister_ressources.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── models.py
│   │   │   │   │   ├── repository.py
│   │   │   │   │   └── mapper.py
│   │   │   │   ├── adapters/
│   │   │   │   │   └── minio_adapter.py     # implements IStockagePort
│   │   │   │   └── http/
│   │   │   │       ├── router.py
│   │   │   │       ├── schemas.py
│   │   │   │       └── dependencies.py
│   │   │   └── document_module.py
│   │   │
│   │   ├── classification/              # ④ Classification & Prolog
│   │   │   ├── domain/
│   │   │   │   ├── entities/thematique.py
│   │   │   │   ├── value_objects/origine_classification.py
│   │   │   │   ├── services/classification_service.py
│   │   │   │   └── ports/moteur_regles_port.py   # IMoteurReglesPort ABC
│   │   │   ├── application/use_cases/
│   │   │   │   ├── classifier_ressource.py
│   │   │   │   └── obtenir_prerequis.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── adapters/prolog_adapter.py    # implements IMoteurReglesPort
│   │   │   │   ├── persistence/models.py
│   │   │   │   └── http/router.py
│   │   │   └── classification_module.py
│   │   │
│   │   ├── rag/                         # ⑤ RAG & LanceDB
│   │   │   ├── domain/
│   │   │   │   ├── entities/chunk.py
│   │   │   │   ├── value_objects/
│   │   │   │   │   ├── vecteur.py
│   │   │   │   │   └── modele_embedding.py
│   │   │   │   ├── services/
│   │   │   │   │   └── chunking_service.py
│   │   │   │   └── ports/
│   │   │   │       ├── vecteur_store_port.py     # IVecteurStorePort ABC
│   │   │   │       └── embedding_port.py         # IEmbeddingPort ABC
│   │   │   ├── application/use_cases/
│   │   │   │   ├── indexer_ressource.py
│   │   │   │   └── poser_question.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── lancedb_adapter.py        # ★ implements IVecteurStorePort
│   │   │   │   │   └── openai_embedding_adapter.py
│   │   │   │   ├── persistence/models.py         # chunk metadata en PG
│   │   │   │   └── http/router.py
│   │   │   └── rag_module.py
│   │   │
│   │   └── usage/                       # ⑥ Usage & Analytics
│   │       ├── domain/entities/
│   │       │   ├── consultation.py
│   │       │   ├── telechargement.py
│   │       │   └── favori.py
│   │       ├── application/use_cases/
│   │       ├── infrastructure/
│   │       │   ├── persistence/models.py
│   │       │   └── http/router.py
│   │       └── usage_module.py
│   │
│   ├── app.py                           # FastAPI factory + routers
│   └── main.py                          # uvicorn entrypoint
│
├── prolog/
│   ├── acadoc.pl
│   └── Dockerfile.prolog
├── alembic/                             # migrations
├── requirements.txt
├── docker-compose.yml
└── .env.example
```

---

## 4. Détail de chaque Bounded Context

### 4.1 IAM — Identity & Access Management

#### Value Objects (Python frozen dataclasses)

```python
# modules/iam/domain/value_objects/email.py
from __future__ import annotations
import re
from dataclasses import dataclass
from src.shared.domain.result import Result

@dataclass(frozen=True)
class Email:
    valeur: str

    @classmethod
    def creer(cls, valeur: str) -> Result["Email", str]:
        pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(pattern, valeur):
            return Result.echouer(f"Email invalide : {valeur}")
        return Result.reussir(cls(valeur=valeur.lower()))
```

```python
# modules/iam/domain/value_objects/niveau_acces.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

NiveauAccesValeur = Literal["PUBLIC", "CAMPUS", "PRIVE"]

@dataclass(frozen=True)
class NiveauAcces:
    valeur: NiveauAccesValeur

    PUBLIC = None   # initialisé après la classe
    CAMPUS = None
    PRIVE  = None

    @classmethod
    def from_str(cls, v: str) -> "NiveauAcces":
        if v not in ("PUBLIC", "CAMPUS", "PRIVE"):
            raise ValueError(f"NiveauAcces invalide : {v}")
        return cls(valeur=v)  # type: ignore

    def est_accessible_par(self, type_user: str | None, actif: bool) -> bool:
        match self.valeur:
            case "PUBLIC": return True
            case "CAMPUS": return actif and type_user is not None
            case "PRIVE":  return False  # vérifié au niveau propriétaire

NiveauAcces.PUBLIC = NiveauAcces(valeur="PUBLIC")  # type: ignore
NiveauAcces.CAMPUS = NiveauAcces(valeur="CAMPUS")  # type: ignore
NiveauAcces.PRIVE  = NiveauAcces(valeur="PRIVE")   # type: ignore
```

#### Aggregate Root : `Utilisateur`

```python
# modules/iam/domain/aggregates/utilisateur.py
from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Optional
from src.shared.domain.aggregate_root import AggregateRoot
from ..value_objects.email import Email
from ..value_objects.niveau_acces import NiveauAcces
from ..events.utilisateur_cree import UtilisateurCreeEvent

TypeUtilisateur = Literal["ETUDIANT", "ENSEIGNANT", "ADMIN"]

@dataclass
class Utilisateur(AggregateRoot):
    _id: uuid.UUID
    _email: Email
    _type: TypeUtilisateur
    _mot_de_passe_hash: str
    _actif: bool = True

    @classmethod
    def creer(
        cls,
        email_str: str,
        type_user: TypeUtilisateur,
        mot_de_passe_hash: str,
    ) -> "Utilisateur":
        email = Email.creer(email_str).ou_lever()
        id_ = uuid.uuid4()
        u = cls(
            _id=id_,
            _email=email,
            _type=type_user,
            _mot_de_passe_hash=mot_de_passe_hash,
        )
        u.ajouter_evenement(UtilisateurCreeEvent(
            utilisateur_id=str(id_),
            email=email_str,
            type_user=type_user,
        ))
        return u

    def peut_acceder(self, niveau: NiveauAcces) -> bool:
        return niveau.est_accessible_par(self._type, self._actif)

    @property
    def id(self) -> uuid.UUID: return self._id
    @property
    def email(self) -> str: return self._email.valeur
    @property
    def type(self) -> TypeUtilisateur: return self._type
    @property
    def actif(self) -> bool: return self._actif
```

#### Repository ABC (domaine)

```python
# modules/iam/domain/repositories/utilisateur_repository.py
from abc import ABC, abstractmethod
from typing import Optional
import uuid
from ..aggregates.utilisateur import Utilisateur

class IUtilisateurRepository(ABC):
    @abstractmethod
    async def sauvegarder(self, utilisateur: Utilisateur) -> None: ...

    @abstractmethod
    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Utilisateur]: ...

    @abstractmethod
    async def trouver_par_email(self, email: str) -> Optional[Utilisateur]: ...

    @abstractmethod
    async def existe_par_email(self, email: str) -> bool: ...
```

#### SQLModel ORM Model (infrastructure)

```python
# modules/iam/infrastructure/persistence/models.py
import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class UtilisateurModel(SQLModel, table=True):
    __tablename__ = "utilisateur"
    __table_args__ = (
        UniqueConstraint("email"),
        {"schema": "iam"},
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=320)
    mot_de_passe_hash: str = Field(max_length=255)
    type: str = Field(max_length=20)   # ETUDIANT | ENSEIGNANT | ADMIN
    nom: Optional[str] = None
    prenom: Optional[str] = None
    actif: bool = True
    date_creation: Optional[str] = None  # TIMESTAMPTZ via alembic


class RoleModel(SQLModel, table=True):
    __tablename__ = "role"
    __table_args__ = {"schema": "iam"}

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=50, unique=True)
    description: Optional[str] = None


class UtilisateurRoleModel(SQLModel, table=True):
    __tablename__ = "utilisateur_role"
    __table_args__ = {"schema": "iam"}

    utilisateur_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id", primary_key=True)
    role_id: int = Field(foreign_key="iam.role.id", primary_key=True)
```

#### Mapper Domain ↔ SQLModel

```python
# modules/iam/infrastructure/persistence/mapper.py
from ..models import UtilisateurModel
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.value_objects.email import Email

class UtilisateurMapper:
    @staticmethod
    def to_model(u: Utilisateur) -> UtilisateurModel:
        return UtilisateurModel(
            id=u.id,
            email=u.email,
            mot_de_passe_hash=u._mot_de_passe_hash,
            type=u.type,
            actif=u.actif,
        )

    @staticmethod
    def to_domain(m: UtilisateurModel) -> Utilisateur:
        return Utilisateur(
            _id=m.id,
            _email=Email(valeur=m.email),
            _type=m.type,             # type: ignore
            _mot_de_passe_hash=m.mot_de_passe_hash,
            _actif=m.actif,
        )
```

#### Repository SQLModel (infrastructure)

```python
# modules/iam/infrastructure/persistence/repository.py
from typing import Optional
import uuid
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from .models import UtilisateurModel
from .mapper import UtilisateurMapper

class SQLModelUtilisateurRepository(IUtilisateurRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def sauvegarder(self, utilisateur: Utilisateur) -> None:
        model = UtilisateurMapper.to_model(utilisateur)
        self._session.add(model)
        await self._session.commit()

    async def trouver_par_email(self, email: str) -> Optional[Utilisateur]:
        stmt = select(UtilisateurModel).where(UtilisateurModel.email == email)
        result = await self._session.exec(stmt)
        model = result.first()
        return UtilisateurMapper.to_domain(model) if model else None

    async def existe_par_email(self, email: str) -> bool:
        stmt = select(UtilisateurModel.id).where(UtilisateurModel.email == email)
        result = await self._session.exec(stmt)
        return result.first() is not None

    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Utilisateur]:
        stmt = select(UtilisateurModel).where(UtilisateurModel.id == id_)
        result = await self._session.exec(stmt)
        model = result.first()
        return UtilisateurMapper.to_domain(model) if model else None
```

#### Use Case : `InscrireUtilisateur`

```python
# modules/iam/application/use_cases/inscrire_utilisateur.py
from dataclasses import dataclass
from src.shared.application.event_bus import IEventBus
from ...domain.aggregates.utilisateur import Utilisateur, TypeUtilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from ..exceptions import EmailDejaUtiliseException

@dataclass(frozen=True)
class InscrireUtilisateurCommand:
    email: str
    mot_de_passe: str
    type_user: TypeUtilisateur = "ETUDIANT"

class InscrireUtilisateurUseCase:
    def __init__(
        self,
        repo: IUtilisateurRepository,
        event_bus: IEventBus,
        password_service: "IPasswordService",
    ):
        self._repo = repo
        self._event_bus = event_bus
        self._pwd = password_service

    async def execute(self, cmd: InscrireUtilisateurCommand) -> str:
        if await self._repo.existe_par_email(cmd.email):
            raise EmailDejaUtiliseException(cmd.email)

        hash_ = await self._pwd.hacher(cmd.mot_de_passe)
        utilisateur = Utilisateur.creer(cmd.email, cmd.type_user, hash_)

        await self._repo.sauvegarder(utilisateur)
        await self._event_bus.publier(utilisateur.domaine_evenements)
        utilisateur.effacer_evenements()
        return str(utilisateur.id)
```

#### Router FastAPI

```python
# modules/iam/infrastructure/http/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_async_session
from src.shared.infrastructure.event_bus import get_event_bus
from .schemas import InscrireRequest, ConnecterRequest, TokenResponse
from .dependencies import get_utilisateur_courant
from ..persistence.repository import SQLModelUtilisateurRepository
from ...application.use_cases.inscrire_utilisateur import (
    InscrireUtilisateurUseCase,
    InscrireUtilisateurCommand,
)
from ...application.use_cases.connecter_utilisateur import ConnecterUtilisateurUseCase

router = APIRouter(prefix="/auth", tags=["IAM"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def inscrire(
    body: InscrireRequest,
    session: AsyncSession = Depends(get_async_session),
    event_bus = Depends(get_event_bus),
):
    repo = SQLModelUtilisateurRepository(session)
    use_case = InscrireUtilisateurUseCase(repo, event_bus, BcryptPasswordService())
    utilisateur_id = await use_case.execute(
        InscrireUtilisateurCommand(
            email=body.email,
            mot_de_passe=body.mot_de_passe,
            type_user=body.type_user,
        )
    )
    return {"id": utilisateur_id}


@router.post("/login", response_model=TokenResponse)
async def connecter(
    body: ConnecterRequest,
    session: AsyncSession = Depends(get_async_session),
):
    repo = SQLModelUtilisateurRepository(session)
    use_case = ConnecterUtilisateurUseCase(repo, BcryptPasswordService(), JWTService())
    token = await use_case.execute(body.email, body.mot_de_passe)
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me")
async def profil(utilisateur = Depends(get_utilisateur_courant)):
    return {"id": str(utilisateur.id), "email": utilisateur.email, "type": utilisateur.type}
```

---

### 4.2 Académique — Organisation

#### Value Objects

```python
# modules/academique/domain/value_objects/code_ue.py
import re
from dataclasses import dataclass
from src.shared.domain.result import Result

@dataclass(frozen=True)
class CodeUE:
    valeur: str

    @classmethod
    def creer(cls, valeur: str) -> Result["CodeUE", str]:
        if not re.match(r'^[A-Z]{2,4}\d{3,4}$', valeur):
            return Result.echouer(f"Code UE invalide: {valeur} (ex: INF431)")
        return Result.reussir(cls(valeur=valeur))
```

```python
# modules/academique/domain/value_objects/niveau_formation.py
from dataclasses import dataclass
from typing import Literal

NiveauValeur = Literal["L1", "L2", "L3", "M1", "M2", "D"]

@dataclass(frozen=True)
class NiveauFormation:
    valeur: NiveauValeur

    @classmethod
    def from_str(cls, v: str) -> "NiveauFormation":
        if v not in ("L1", "L2", "L3", "M1", "M2", "D"):
            raise ValueError(f"Niveau invalide : {v}")
        return cls(valeur=v)  # type: ignore

    def est_master(self) -> bool: return self.valeur in ("M1", "M2")
    def est_doctorat(self) -> bool: return self.valeur == "D"
```

#### SQLModel Models (Académique)

```python
# modules/academique/infrastructure/persistence/models.py
import uuid
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class FaculteModel(SQLModel, table=True):
    __tablename__ = "faculte"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(max_length=20, unique=True)
    nom: str = Field(max_length=300)
    sigle: Optional[str] = Field(default=None, max_length=20)
    departements: List["DepartementModel"] = Relationship(back_populates="faculte")

class DepartementModel(SQLModel, table=True):
    __tablename__ = "departement"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    faculte_id: uuid.UUID = Field(foreign_key="academique.faculte.id")
    code: str = Field(max_length=20, unique=True)
    nom: str = Field(max_length=300)
    faculte: Optional[FaculteModel] = Relationship(back_populates="departements")
    formations: List["FormationModel"] = Relationship(back_populates="departement")

class FormationModel(SQLModel, table=True):
    __tablename__ = "formation"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    departement_id: uuid.UUID = Field(foreign_key="academique.departement.id")
    code: str = Field(max_length=20, unique=True)
    nom: str = Field(max_length=300)
    niveau: str = Field(max_length=5)  # L1 | L2 | L3 | M1 | M2 | D
    departement: Optional[DepartementModel] = Relationship(back_populates="formations")

class UEModel(SQLModel, table=True):
    __tablename__ = "ue"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    formation_id: uuid.UUID = Field(foreign_key="academique.formation.id")
    code: str = Field(max_length=20, unique=True)   # INF431
    nom: str = Field(max_length=300)
    semestre: int = Field(ge=1, le=12)
    credits_ects: Optional[int] = None
```

---

### 4.3 Document — Ressource documentaire

#### Value Objects

```python
# modules/document/domain/value_objects/type_document.py
from dataclasses import dataclass
from typing import Literal

TypeDocValeur = Literal[
    "COURS", "TD", "TP", "EXAMEN", "CORRECTION", "SUPPORT_COURS",
    "MEMOIRE", "THESE", "ARTICLE", "RAPPORT_RECHERCHE", "AUTRE",
]
CategorieValeur = Literal["RESSOURCE_PEDAGOGIQUE", "PRODUCTION_SCIENTIFIQUE"]

_MAP: dict[str, CategorieValeur] = {
    "COURS": "RESSOURCE_PEDAGOGIQUE",    "TD": "RESSOURCE_PEDAGOGIQUE",
    "TP": "RESSOURCE_PEDAGOGIQUE",       "EXAMEN": "RESSOURCE_PEDAGOGIQUE",
    "CORRECTION": "RESSOURCE_PEDAGOGIQUE","SUPPORT_COURS": "RESSOURCE_PEDAGOGIQUE",
    "MEMOIRE": "PRODUCTION_SCIENTIFIQUE", "THESE": "PRODUCTION_SCIENTIFIQUE",
    "ARTICLE": "PRODUCTION_SCIENTIFIQUE", "RAPPORT_RECHERCHE": "PRODUCTION_SCIENTIFIQUE",
    "AUTRE": "RESSOURCE_PEDAGOGIQUE",
}

@dataclass(frozen=True)
class TypeDocument:
    valeur: TypeDocValeur

    @classmethod
    def from_str(cls, v: str) -> "TypeDocument":
        if v not in _MAP:
            raise ValueError(f"TypeDocument invalide : {v}")
        return cls(valeur=v)  # type: ignore

    @property
    def categorie(self) -> CategorieValeur:
        return _MAP[self.valeur]
```

#### Aggregate Root : `Ressource` ★

```python
# modules/document/domain/aggregates/ressource.py
from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Optional
from src.shared.domain.aggregate_root import AggregateRoot
from src.shared.domain.result import Result
from ..value_objects.type_document import TypeDocument
from ..value_objects.titre_document import TitreDocument
from ..entities.fichier import Fichier
from ..events.ressource_cree import RessourceCreeEvent
from ..events.fichier_ajoute import FichierAjouteEvent
from src.modules.iam.domain.value_objects.niveau_acces import NiveauAcces

@dataclass
class Ressource(AggregateRoot):
    _id: uuid.UUID
    _titre: TitreDocument
    _type_document: TypeDocument
    _proprietaire_id: uuid.UUID
    _niveau_acces: NiveauAcces
    _description: Optional[str] = None
    _annee: Optional[int] = None
    _langue: str = "fr"
    _doi: Optional[str] = None
    _fichiers: list[Fichier] = field(default_factory=list)
    _ue_ids: list[uuid.UUID] = field(default_factory=list)

    # ─── Factory ───────────────────────────────────────────────────
    @classmethod
    def creer(
        cls,
        titre: str,
        type_doc: str,
        proprietaire_id: uuid.UUID,
        niveau_acces: str = "CAMPUS",
        description: Optional[str] = None,
        annee: Optional[int] = None,
    ) -> Result["Ressource", str]:
        titre_vo = TitreDocument.creer(titre)
        if titre_vo.est_echec():
            return Result.echouer(titre_vo.erreur)

        id_ = uuid.uuid4()
        r = cls(
            _id=id_,
            _titre=titre_vo.valeur,
            _type_document=TypeDocument.from_str(type_doc),
            _proprietaire_id=proprietaire_id,
            _niveau_acces=NiveauAcces.from_str(niveau_acces),
            _description=description,
            _annee=annee,
        )
        r.ajouter_evenement(RessourceCreeEvent(
            ressource_id=str(id_),
            titre=titre,
            type_doc=type_doc,
            proprietaire_id=str(proprietaire_id),
        ))
        return Result.reussir(r)

    # ─── Invariants métier ─────────────────────────────────────────
    def ajouter_fichier(self, fichier: Fichier) -> None:
        if len(self._fichiers) >= 5:
            raise ValueError(f"Limite de 5 fichiers atteinte pour {self._id}")
        self._fichiers.append(fichier)
        self.ajouter_evenement(FichierAjouteEvent(
            ressource_id=str(self._id),
            fichier_id=str(fichier.id),
            ue_ids=[str(uid) for uid in self._ue_ids],
            niveau_acces=self._niveau_acces.valeur,
        ))

    def associer_ue(self, ue_id: uuid.UUID) -> None:
        if ue_id not in self._ue_ids:
            self._ue_ids.append(ue_id)

    def changer_niveau_acces(self, niveau: NiveauAcces, demandeur_id: uuid.UUID) -> None:
        if demandeur_id != self._proprietaire_id:
            raise PermissionError("Seul le propriétaire peut modifier le niveau d'accès")
        self._niveau_acces = niveau

    def est_accessible_par(self, utilisateur: Optional["Utilisateur"]) -> bool:
        match self._niveau_acces.valeur:
            case "PUBLIC": return True
            case "CAMPUS": return utilisateur is not None and utilisateur.actif
            case "PRIVE":  return (
                utilisateur is not None
                and utilisateur.id == self._proprietaire_id
            )

    # ─── Propriétés ────────────────────────────────────────────────
    @property
    def id(self) -> uuid.UUID:          return self._id
    @property
    def titre(self) -> str:             return self._titre.valeur
    @property
    def type_document(self) -> str:     return self._type_document.valeur
    @property
    def categorie(self) -> str:         return self._type_document.categorie
    @property
    def niveau_acces(self) -> str:      return self._niveau_acces.valeur
    @property
    def fichiers(self) -> list[Fichier]:return list(self._fichiers)
    @property
    def ue_ids(self) -> list[uuid.UUID]:return list(self._ue_ids)
```

#### SQLModel — Ressource

```python
# modules/document/infrastructure/persistence/models.py
import uuid
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint

class RessourceModel(SQLModel, table=True):
    __tablename__ = "ressource"
    __table_args__ = {"schema": "document"}

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    titre: str = Field(max_length=500)
    description: Optional[str] = None
    type_document: str = Field(max_length=30)
    categorie: str = Field(max_length=40)
    niveau_acces: str = Field(max_length=10, default="CAMPUS")
    proprietaire_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id")
    annee: Optional[int] = None
    langue: str = Field(default="fr", max_length=10)
    statut_validation: str = Field(default="EN_ATTENTE", max_length=30)
    doi: Optional[str] = Field(default=None, max_length=200)
    # Relationships
    fichiers: List["FichierModel"] = Relationship(back_populates="ressource")
    ues: List["RessourceUEModel"] = Relationship(back_populates="ressource")


class FichierModel(SQLModel, table=True):
    __tablename__ = "fichier"
    __table_args__ = {"schema": "document"}

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    nom_original: str = Field(max_length=500)
    taille_octets: Optional[int] = None
    mime_type: str = Field(default="application/pdf", max_length=100)
    hash_sha256: Optional[str] = Field(default=None, max_length=64)
    minio_bucket: str = Field(max_length=100)
    minio_key: str = Field(max_length=500)
    version: int = Field(default=1)
    ressource: Optional[RessourceModel] = Relationship(back_populates="fichiers")


class RessourceUEModel(SQLModel, table=True):
    __tablename__ = "ressource_ue"
    __table_args__ = {"schema": "document"}

    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    ue_id: uuid.UUID = Field(foreign_key="academique.ue.id", primary_key=True)
    ressource: Optional[RessourceModel] = Relationship(back_populates="ues")
```

#### Use Case : `CreerRessource`

```python
# modules/document/application/use_cases/creer_ressource.py
from dataclasses import dataclass
from typing import Optional
import uuid
from ...domain.aggregates.ressource import Ressource
from ...domain.repositories.ressource_repository import IRessourceRepository
from ...domain.ports.stockage_port import IStockagePort
from src.shared.application.event_bus import IEventBus

@dataclass(frozen=True)
class CreerRessourceCommand:
    titre: str
    type_doc: str
    proprietaire_id: uuid.UUID
    niveau_acces: str = "CAMPUS"
    description: Optional[str] = None
    annee: Optional[int] = None
    ue_ids: list[uuid.UUID] = None     # type: ignore

class CreerRessourceUseCase:
    def __init__(
        self,
        repo: IRessourceRepository,
        event_bus: IEventBus,
    ):
        self._repo = repo
        self._event_bus = event_bus

    async def execute(self, cmd: CreerRessourceCommand) -> uuid.UUID:
        result = Ressource.creer(
            titre=cmd.titre,
            type_doc=cmd.type_doc,
            proprietaire_id=cmd.proprietaire_id,
            niveau_acces=cmd.niveau_acces,
            description=cmd.description,
            annee=cmd.annee,
        )
        if result.est_echec():
            raise ValueError(result.erreur)

        ressource = result.valeur
        for ue_id in (cmd.ue_ids or []):
            ressource.associer_ue(ue_id)

        await self._repo.sauvegarder(ressource)
        await self._event_bus.publier(ressource.domaine_evenements)
        ressource.effacer_evenements()
        return ressource.id
```

#### Port Stockage + MinIO Adapter

```python
# modules/document/domain/ports/stockage_port.py
from abc import ABC, abstractmethod

class IStockagePort(ABC):
    @abstractmethod
    async def stocker(self, contenu: bytes, bucket: str, cle: str) -> None: ...

    @abstractmethod
    async def url_signee(self, bucket: str, cle: str, duree_s: int = 3600) -> str: ...

    @abstractmethod
    async def supprimer(self, bucket: str, cle: str) -> None: ...
```

```python
# modules/document/infrastructure/adapters/minio_adapter.py
from miniopy_async import Minio
from ..domain.ports.stockage_port import IStockagePort
import io

class MinioAdapter(IStockagePort):
    def __init__(self, client: Minio):
        self._client = client

    async def stocker(self, contenu: bytes, bucket: str, cle: str) -> None:
        await self._client.put_object(
            bucket, cle, io.BytesIO(contenu), length=len(contenu)
        )

    async def url_signee(self, bucket: str, cle: str, duree_s: int = 3600) -> str:
        return await self._client.presigned_get_object(bucket, cle, expires=duree_s)

    async def supprimer(self, bucket: str, cle: str) -> None:
        await self._client.remove_object(bucket, cle)
```

---

### 4.4 Classification — Taxonomie & Prolog

#### Port + Adapter Prolog

```python
# modules/classification/domain/ports/moteur_regles_port.py
from abc import ABC, abstractmethod

class IMoteurReglesPort(ABC):
    @abstractmethod
    async def classifier(self, titre: str, mots_cles: list[str]) -> list[str]: ...

    @abstractmethod
    async def prerequis_chemin(self, code_ue: str) -> list[str]: ...

    @abstractmethod
    async def recommander(self, ressource_id: str) -> list[str]: ...

    @abstractmethod
    async def peut_suivre(self, etudiant_id: str, code_ue: str) -> bool: ...
```

```python
# modules/classification/infrastructure/adapters/prolog_adapter.py
import httpx
from ...domain.ports.moteur_regles_port import IMoteurReglesPort

class PrologAdapter(IMoteurReglesPort):
    def __init__(self, base_url: str):
        self._base_url = base_url

    async def _query(self, goal: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{self._base_url}/query", json={"goal": goal})
            r.raise_for_status()
            return r.json().get("solutions", [])

    async def classifier(self, titre: str, mots_cles: list[str]) -> list[str]:
        kws = ",".join(f'"{k}"' for k in mots_cles)
        solutions = await self._query(
            f'classifier_document("{titre}", [{kws}], Types)'
        )
        return [s["Types"] for s in solutions if "Types" in s]

    async def prerequis_chemin(self, code_ue: str) -> list[str]:
        solutions = await self._query(f'prerequis_chemin("{code_ue}", Chemin)')
        return solutions[0].get("Chemin", []) if solutions else []

    async def recommander(self, ressource_id: str) -> list[str]:
        solutions = await self._query(f'recommande("{ressource_id}", Recs)')
        return solutions[0].get("Recs", []) if solutions else []

    async def peut_suivre(self, etudiant_id: str, code_ue: str) -> bool:
        solutions = await self._query(f'peut_suivre("{etudiant_id}", "{code_ue}")')
        return len(solutions) > 0
```

#### Event Listener — Classification automatique

```python
# modules/classification/infrastructure/listeners/ressource_cree_listener.py
from src.shared.domain.domain_event import IDomainEvent
from src.modules.document.domain.events.ressource_cree import RessourceCreeEvent
from ...application.use_cases.classifier_ressource import (
    ClassifierRessourceUseCase,
    ClassifierRessourceCommand,
)

class RessourceCreeListener:
    def __init__(self, use_case: ClassifierRessourceUseCase):
        self._use_case = use_case

    async def handle(self, event: IDomainEvent) -> None:
        if isinstance(event, RessourceCreeEvent):
            await self._use_case.execute(
                ClassifierRessourceCommand(
                    ressource_id=event.ressource_id,
                    titre=event.titre,
                    mots_cles=[],   # enrichis après upload du PDF
                )
            )
```

---

### 4.5 RAG — Vectorisation LanceDB

#### Port `IVecteurStorePort`

```python
# modules/rag/domain/ports/vecteur_store_port.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import numpy as np

@dataclass
class EntreeVecteur:
    chunk_id: str
    ressource_id: str
    ue_ids: list[str]
    niveau_acces: str
    vecteur: np.ndarray       # float32 shape (1536,)
    contenu_snippet: str
    page_debut: int = 0

@dataclass
class ResultatVecteur:
    chunk_id: str
    ressource_id: str
    contenu_snippet: str
    score: float
    page_debut: int

class IVecteurStorePort(ABC):
    @abstractmethod
    async def indexer(self, entree: EntreeVecteur) -> None: ...

    @abstractmethod
    async def rechercher(
        self,
        vecteur_requete: np.ndarray,
        ue_ids: Optional[list[str]] = None,
        niveaux_acces: Optional[list[str]] = None,
        top_k: int = 10,
    ) -> list[ResultatVecteur]: ...

    @abstractmethod
    async def supprimer_par_ressource(self, ressource_id: str) -> None: ...
```

#### Adapter LanceDB ★

```python
# modules/rag/infrastructure/adapters/lancedb_adapter.py
import asyncio
import json
from typing import Optional
import numpy as np
import lancedb
import pyarrow as pa
from ...domain.ports.vecteur_store_port import IVecteurStorePort, EntreeVecteur, ResultatVecteur

VECTOR_DIM = 1536  # text-embedding-3-small

class LanceDBAdapter(IVecteurStorePort):
    def __init__(self, uri: str):
        self._uri = uri
        self._db: lancedb.DBConnection | None = None
        self._table: lancedb.Table | None = None

    async def initialiser(self) -> None:
        """Appeler au démarrage de l'application (lifespan FastAPI)."""
        self._db = await lancedb.connect_async(self._uri)
        noms = await self._db.table_names()
        if "chunks" in noms:
            self._table = await self._db.open_table("chunks")
        else:
            schema = pa.schema([
                pa.field("chunk_id",        pa.utf8()),
                pa.field("ressource_id",    pa.utf8()),
                pa.field("niveau_acces",    pa.utf8()),
                pa.field("ue_ids_json",     pa.utf8()),
                pa.field("contenu_snippet", pa.utf8()),
                pa.field("page_debut",      pa.int32()),
                pa.field("vecteur",         pa.list_(pa.float32(), VECTOR_DIM)),
            ])
            self._table = await self._db.create_empty_table("chunks", schema=schema)

    async def indexer(self, entree: EntreeVecteur) -> None:
        data = [{
            "chunk_id":        entree.chunk_id,
            "ressource_id":    entree.ressource_id,
            "niveau_acces":    entree.niveau_acces,
            "ue_ids_json":     json.dumps(entree.ue_ids),
            "contenu_snippet": entree.contenu_snippet,
            "page_debut":      entree.page_debut,
            "vecteur":         entree.vecteur.astype(np.float32).tolist(),
        }]
        await self._table.add(data)

    async def rechercher(
        self,
        vecteur_requete: np.ndarray,
        ue_ids: Optional[list[str]] = None,
        niveaux_acces: Optional[list[str]] = None,
        top_k: int = 10,
    ) -> list[ResultatVecteur]:
        query = (
            self._table
            .vector_search(vecteur_requete.astype(np.float32).tolist())
            .column("vecteur")
            .metric("cosine")
            .limit(top_k * 3)   # sur-selection pour le post-filtrage
        )

        # Filtres WHERE LanceDB (SQL-like)
        conditions = []
        if niveaux_acces:
            niveaux_str = ", ".join(f"'{n}'" for n in niveaux_acces)
            conditions.append(f"niveau_acces IN ({niveaux_str})")
        if conditions:
            query = query.where(" AND ".join(conditions))

        rows = await query.to_list()

        # Post-filtrage UE (JSON string)
        if ue_ids:
            rows = [
                r for r in rows
                if any(uid in json.loads(r["ue_ids_json"]) for uid in ue_ids)
            ]

        return [
            ResultatVecteur(
                chunk_id=r["chunk_id"],
                ressource_id=r["ressource_id"],
                contenu_snippet=r["contenu_snippet"],
                score=float(1 - r["_distance"]),
                page_debut=r["page_debut"],
            )
            for r in rows[:top_k]
        ]

    async def supprimer_par_ressource(self, ressource_id: str) -> None:
        await self._table.delete(f"ressource_id = '{ressource_id}'")

    async def creer_index_ivf_pq(self) -> None:
        """À appeler après avoir inséré ~1000 lignes (min. LanceDB)."""
        await self._table.create_index(
            "vecteur",
            config=lancedb.index.IvfPq(num_partitions=64, num_sub_vectors=32),
        )
```

#### Use Case : `IndexerRessource`

```python
# modules/rag/application/use_cases/indexer_ressource.py
from dataclasses import dataclass
import uuid
from ..domain.entities.chunk import Chunk
from ..domain.services.chunking_service import ChunkingService
from ..domain.ports.vecteur_store_port import IVecteurStorePort, EntreeVecteur
from ..domain.ports.embedding_port import IEmbeddingPort
from ..domain.repositories.chunk_repository import IChunkRepository
from src.shared.application.event_bus import IEventBus

@dataclass(frozen=True)
class IndexerRessourceCommand:
    ressource_id: str
    texte: str
    ue_ids: list[str]
    niveau_acces: str

class IndexerRessourceUseCase:
    def __init__(
        self,
        vecteur_store: IVecteurStorePort,
        embedder: IEmbeddingPort,
        chunking_service: ChunkingService,
        chunk_repo: IChunkRepository,
        event_bus: IEventBus,
    ):
        self._store = vecteur_store
        self._embedder = embedder
        self._chunking = chunking_service
        self._chunk_repo = chunk_repo
        self._event_bus = event_bus

    async def execute(self, cmd: IndexerRessourceCommand) -> int:
        chunks_texte = self._chunking.decouper(
            cmd.texte, taille_tokens=512, overlap=50
        )
        n_indexed = 0
        for i, chunk_data in enumerate(chunks_texte):
            chunk_id = str(uuid.uuid4())

            # 1. Persistance métadonnées en PostgreSQL
            chunk = Chunk.creer(
                chunk_id, cmd.ressource_id, i,
                chunk_data.contenu, chunk_data.page_debut, chunk_data.page_fin
            )
            await self._chunk_repo.sauvegarder(chunk)

            # 2. Embedding via OpenAI (ou modèle local)
            vecteur = await self._embedder.embarquer(chunk_data.contenu)

            # 3. Indexation dans LanceDB
            await self._store.indexer(EntreeVecteur(
                chunk_id=chunk_id,
                ressource_id=cmd.ressource_id,
                ue_ids=cmd.ue_ids,
                niveau_acces=cmd.niveau_acces,
                vecteur=vecteur,
                contenu_snippet=chunk_data.contenu[:200],
                page_debut=chunk_data.page_debut or 0,
            ))
            n_indexed += 1

        return n_indexed
```

#### Use Case : `PoserQuestion` (RAG)

```python
# modules/rag/application/use_cases/poser_question.py
from dataclasses import dataclass
from typing import Optional
from ..domain.ports.vecteur_store_port import IVecteurStorePort
from ..domain.ports.embedding_port import IEmbeddingPort
from ..domain.repositories.chunk_repository import IChunkRepository
from ..domain.ports.llm_port import ILLMPort

SYSTEM_PROMPT = """Tu es un assistant pédagogique de l'université.
Tu réponds UNIQUEMENT à partir des documents fournis dans le contexte.
Cite chaque information avec [Source: id, page X].
Si l'information n'est pas disponible, dis-le clairement.
Réponds en français."""

@dataclass(frozen=True)
class PoserQuestionCommand:
    question: str
    ue_id: Optional[str] = None
    niveau_acces_utilisateur: list[str] = None  # type: ignore

@dataclass
class ReponseRAG:
    reponse: str
    sources: list[dict]

class PoserQuestionUseCase:
    def __init__(
        self,
        vecteur_store: IVecteurStorePort,
        embedder: IEmbeddingPort,
        chunk_repo: IChunkRepository,
        llm: ILLMPort,
    ):
        self._store = vecteur_store
        self._embedder = embedder
        self._chunk_repo = chunk_repo
        self._llm = llm

    async def execute(self, cmd: PoserQuestionCommand) -> ReponseRAG:
        niveaux = cmd.niveau_acces_utilisateur or ["PUBLIC"]

        # 1. Embedding de la question
        vecteur_question = await self._embedder.embarquer(cmd.question)

        # 2. Recherche dans LanceDB
        resultats = await self._store.rechercher(
            vecteur_requete=vecteur_question,
            ue_ids=[cmd.ue_id] if cmd.ue_id else None,
            niveaux_acces=niveaux,
            top_k=6,
        )

        # 3. Récupérer le contenu complet depuis PostgreSQL
        chunk_ids = [r.chunk_id for r in resultats]
        chunks = await self._chunk_repo.trouver_par_ids(chunk_ids)

        # 4. Construction du contexte
        contexte = "\n\n---\n\n".join(
            f"[Source: {c.ressource_id}, page {c.page_debut}]\n{c.contenu}"
            for c in chunks
        )

        # 5. Génération LLM
        reponse_texte = await self._llm.generer(
            system=SYSTEM_PROMPT,
            user=f"Question: {cmd.question}\n\nContexte:\n{contexte}",
        )

        return ReponseRAG(
            reponse=reponse_texte,
            sources=[
                {
                    "ressource_id": r.ressource_id,
                    "snippet": r.contenu_snippet,
                    "score": round(r.score, 3),
                    "page": r.page_debut,
                }
                for r in resultats
            ],
        )
```

---

### 4.6 Usage — Analytics & Interactions

```python
# modules/usage/infrastructure/persistence/models.py
import uuid
from typing import Optional
from sqlmodel import SQLModel, Field

class ConsultationModel(SQLModel, table=True):
    __tablename__ = "consultation"
    __table_args__ = {"schema": "usage"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    utilisateur_id: Optional[uuid.UUID] = Field(default=None, foreign_key="iam.utilisateur.id")

class FavoriModel(SQLModel, table=True):
    __tablename__ = "favori"
    __table_args__ = {"schema": "usage"}
    utilisateur_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id", primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)

class RechercheModel(SQLModel, table=True):
    __tablename__ = "recherche"
    __table_args__ = {"schema": "usage"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    utilisateur_id: Optional[uuid.UUID] = Field(default=None, foreign_key="iam.utilisateur.id")
    requete: str

class ResultatRechercheModel(SQLModel, table=True):
    __tablename__ = "resultat_recherche"
    __table_args__ = {"schema": "usage"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    recherche_id: uuid.UUID = Field(foreign_key="usage.recherche.id")
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    rang: Optional[int] = None
    score: Optional[float] = None
```

---

## 5. Schéma SQLModel & PostgreSQL

### Initialisation de l'engine SQLModel async

```python
# shared/infrastructure/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from .settings import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
)

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def create_db_and_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_async_session():
    async with async_session_factory() as session:
        yield session
```

### Migrations Alembic

```bash
# Initialisation
alembic init alembic

# Génération automatique depuis les modèles SQLModel
alembic revision --autogenerate -m "init_schemas"
alembic upgrade head
```

```python
# alembic/env.py  — import de TOUS les modèles pour autodiscovery
from src.modules.iam.infrastructure.persistence.models import *
from src.modules.academique.infrastructure.persistence.models import *
from src.modules.document.infrastructure.persistence.models import *
from src.modules.classification.infrastructure.persistence.models import *
from src.modules.rag.infrastructure.persistence.models import *
from src.modules.usage.infrastructure.persistence.models import *
from sqlmodel import SQLModel
target_metadata = SQLModel.metadata
```

### Script SQL complémentaire (types PostgreSQL)

```sql
-- Types ENUM natifs PostgreSQL (gérés via Alembic)
CREATE TYPE document.type_document AS ENUM (
  'COURS','TD','TP','EXAMEN','CORRECTION','SUPPORT_COURS',
  'MEMOIRE','THESE','ARTICLE','RAPPORT_RECHERCHE','AUTRE'
);
CREATE TYPE document.niveau_acces AS ENUM ('PUBLIC','CAMPUS','PRIVE');
CREATE TYPE academique.niveau_formation AS ENUM ('L1','L2','L3','M1','M2','D');
CREATE TYPE classification.origine AS ENUM ('MANUELLE','PROLOG','IA');
```

---

## 6. LanceDB — Stockage vectoriel

### Installation

```bash
pip install lancedb pyarrow numpy
```

### Comparaison LanceDB vs pgvector

| Critère | pgvector | LanceDB |
|---------|----------|---------|
| Déploiement | Extension PostgreSQL | Bibliothèque Python embarquée |
| SDK Python | `pgvector` + SQLAlchemy | `lancedb` natif async |
| Format stockage | TOAST PostgreSQL | Apache Lance (colonnar) |
| Filtrage hybride | SQL WHERE | SQL-like WHERE intégré |
| Scalabilité | Limitée par PG RAM | Fichiers Lance partitionnés |
| Index | HNSW / IVFFlat | IVF-PQ / HNSW |
| Zéro serveur | Non | **Oui** |

### Configuration dans FastAPI (lifespan)

```python
# app.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.shared.infrastructure.database import create_db_and_tables
from src.modules.rag.infrastructure.adapters.lancedb_adapter import LanceDBAdapter
from src.shared.infrastructure.settings import get_settings

settings = get_settings()
lancedb_adapter = LanceDBAdapter(uri=settings.lancedb_uri)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage
    await create_db_and_tables()
    await lancedb_adapter.initialiser()
    app.state.lancedb = lancedb_adapter
    yield
    # Arrêt (cleanup si nécessaire)

def create_app() -> FastAPI:
    app = FastAPI(
        title="Gestion Documents Académiques",
        version="1.0.0",
        lifespan=lifespan,
    )
    # Enregistrement des routers
    from src.modules.iam.infrastructure.http.router import router as iam_router
    from src.modules.academique.infrastructure.http.router import router as acad_router
    from src.modules.document.infrastructure.http.router import router as doc_router
    from src.modules.classification.infrastructure.http.router import router as class_router
    from src.modules.rag.infrastructure.http.router import router as rag_router
    from src.modules.usage.infrastructure.http.router import router as usage_router

    app.include_router(iam_router,   prefix="/api")
    app.include_router(acad_router,  prefix="/api")
    app.include_router(doc_router,   prefix="/api")
    app.include_router(class_router, prefix="/api")
    app.include_router(rag_router,   prefix="/api")
    app.include_router(usage_router, prefix="/api")
    return app
```

---

## 7. Shared Kernel & Infrastructure

### `AggregateRoot` base

```python
# shared/domain/aggregate_root.py
from dataclasses import dataclass, field
from .domain_event import IDomainEvent

@dataclass
class AggregateRoot:
    _domaine_evenements: list[IDomainEvent] = field(
        default_factory=list, init=False, repr=False
    )

    def ajouter_evenement(self, event: IDomainEvent) -> None:
        self._domaine_evenements.append(event)

    @property
    def domaine_evenements(self) -> list[IDomainEvent]:
        return list(self._domaine_evenements)

    def effacer_evenements(self) -> None:
        self._domaine_evenements.clear()
```

### `Result[T, E]` — Railway pattern

```python
# shared/domain/result.py
from __future__ import annotations
from dataclasses import dataclass
from typing import TypeVar, Generic, Optional

T = TypeVar("T")
E = TypeVar("E")

@dataclass(frozen=True)
class Result(Generic[T, E]):
    _ok: bool
    _valeur: Optional[T] = None
    _erreur: Optional[E] = None

    @classmethod
    def reussir(cls, valeur: T) -> "Result[T, E]":
        return cls(_ok=True, _valeur=valeur)

    @classmethod
    def echouer(cls, erreur: E) -> "Result[T, E]":
        return cls(_ok=False, _erreur=erreur)

    def est_succes(self) -> bool: return self._ok
    def est_echec(self) -> bool:  return not self._ok

    @property
    def valeur(self) -> T:
        if not self._ok: raise RuntimeError("Résultat en échec")
        return self._valeur  # type: ignore

    @property
    def erreur(self) -> E:
        if self._ok: raise RuntimeError("Résultat en succès")
        return self._erreur  # type: ignore

    def ou_lever(self) -> T:
        if self.est_echec():
            raise ValueError(str(self._erreur))
        return self._valeur  # type: ignore
```

### `SimpleEventBus`

```python
# shared/infrastructure/event_bus.py
from typing import Callable, Awaitable
from src.shared.application.event_bus import IEventBus
from src.shared.domain.domain_event import IDomainEvent

Handler = Callable[[IDomainEvent], Awaitable[None]]

class SimpleEventBus(IEventBus):
    def __init__(self):
        self._handlers: dict[type, list[Handler]] = {}

    def abonner(self, event_type: type, handler: Handler) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    async def publier(self, evenements: list[IDomainEvent]) -> None:
        for event in evenements:
            for handler in self._handlers.get(type(event), []):
                await handler(event)

# Singleton partagé via FastAPI Depends
_bus = SimpleEventBus()

def get_event_bus() -> SimpleEventBus:
    return _bus
```

### `Settings` (Pydantic)

```python
# shared/infrastructure/settings.py
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://acadoc:secret@localhost:5432/acadoc"
    jwt_secret: str = "change_me"
    jwt_expire_minutes: int = 60 * 24 * 7
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "documents"
    lancedb_uri: str = "./data/lancedb"
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4o-mini"
    prolog_url: str = "http://localhost:8081"
    debug: bool = False

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### `requirements.txt`

```txt
# Web
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.12

# ORM & DB
sqlmodel==0.0.21
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.3

# Auth
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Stockage
miniopy-async==1.20

# Vecteurs
lancedb==0.13.0
pyarrow==17.0.0
numpy==2.0.2

# IA
openai==1.52.0

# Prolog bridge
httpx==0.27.2

# Config
pydantic-settings==2.5.2

# Dev
pytest==8.3.3
pytest-asyncio==0.24.0
httpx  # pour les tests FastAPI
```

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  # ── Base de données ────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: acadoc
      POSTGRES_USER: acadoc
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./sql/init_schemas.sql:/docker-entrypoint-initdb.d/01_schemas.sql

  # ── Stockage objet ─────────────────────────────────────────
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]

  # ── Moteur de règles Prolog ────────────────────────────────
  prolog:
    build:
      context: ./prolog
      dockerfile: Dockerfile.prolog
    ports: ["8081:8080"]
    volumes: ["./prolog:/app"]

  # ── API FastAPI ────────────────────────────────────────────
  api:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://acadoc:secret@postgres:5432/acadoc
      MINIO_ENDPOINT: minio:9000
      LANCEDB_URI: /app/data/lancedb
      PROLOG_URL: http://prolog:8080
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - lancedb_data:/app/data/lancedb
    depends_on: [postgres, minio, prolog]
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  pg_data:
  minio_data:
  lancedb_data:
```

---

## 8. API REST — Endpoints par contexte

### IAM

```
POST   /api/auth/register          InscrireUtilisateurUseCase
POST   /api/auth/login             ConnecterUtilisateurUseCase  → JWT
GET    /api/auth/me                [JWT]
POST   /api/auth/refresh           [JWT]
```

### Académique

```
GET    /api/facultes
POST   /api/facultes               [ADMIN]
GET    /api/facultes/{id}/departements
GET    /api/departements/{id}/formations
GET    /api/formations/{id}/ues
GET    /api/ues/{code}             par code INF431
GET    /api/ues/{id}/ressources    ?type=COURS&niveau_acces=PUBLIC
POST   /api/ues                    [ADMIN]
```

### Document

```
GET    /api/ressources             ?q=&type=&categorie=&ue=&annee=&page=
POST   /api/ressources             [JWT] → CreerRessourceUseCase
GET    /api/ressources/{id}        → PolitiqueAccesService
PATCH  /api/ressources/{id}        [OWNER|ADMIN]
DELETE /api/ressources/{id}        [OWNER|ADMIN]

POST   /api/ressources/{id}/fichiers  [JWT] (multipart/form-data)
GET    /api/fichiers/{id}/download    → URL signée MinIO
DELETE /api/fichiers/{id}             [OWNER|ADMIN]

GET    /api/ressources/{id}/prerequis      → PrologAdapter
GET    /api/ressources/{id}/recommandations → PrologAdapter
```

### Classification

```
GET    /api/thematiques
POST   /api/thematiques            [ADMIN]
POST   /api/ressources/{id}/classifier  [ADMIN|OWNER]
POST   /api/ressources/{id}/thematiques
GET    /api/mot-cles
POST   /api/ressources/{id}/mot-cles
```

### RAG

```
POST   /api/rag/index/{ressource_id}   [ADMIN|OWNER] → IndexerRessourceUseCase
GET    /api/rag/status/{ressource_id}
POST   /api/rag/search             { query, ue_id?, top_k? }
POST   /api/rag/ask                { question, ue_id? } → PoserQuestionUseCase
```

### Usage

```
GET    /api/favoris                [JWT]
POST   /api/favoris/{ressource_id} [JWT]
DELETE /api/favoris/{ressource_id} [JWT]
GET    /api/historique             [JWT]
```

---

## 9. Phases d'implémentation

### Phase 0 — Fondations DDD (Semaine 1)

```
Livrables :
  □ shared/domain/ : AggregateRoot, Result, ValueObject, IDomainEvent
  □ shared/infrastructure/ : Settings, database.py (SQLModel async), EventBus
  □ docker-compose.yml fonctionnel
  □ alembic init + configuration
  □ sql/init_schemas.sql (CREATE SCHEMA iam, academique, document, ...)
  □ requirements.txt complet
  □ Tests unitaires : Result, AggregateRoot, ValueObjects de base
```

### Phase 1 — IAM Context (Semaine 2)

```
Livrables :
  □ Value Objects : Email, MotDePasse, NiveauAcces (frozen dataclasses)
  □ Aggregate Utilisateur avec domain events
  □ IUtilisateurRepository ABC
  □ SQLModel UtilisateurModel + RoleModel
  □ SQLModelUtilisateurRepository
  □ UtilisateurMapper (Domain ↔ SQLModel)
  □ InscrireUtilisateurUseCase + ConnecterUtilisateurUseCase
  □ JWT (python-jose) + Bcrypt (passlib)
  □ FastAPI router /auth avec Depends()
  □ Tests : use cases (mocks), intégration auth
```

### Phase 2 — Académique Context (Semaine 3)

```
Livrables :
  □ Entités : Faculte, Departement, Formation, UE
  □ Value Objects : CodeUE (regex), NiveauFormation, Semestre
  □ SQLModel models avec Relationships
  □ CRUD Endpoints + validations Pydantic
  □ Alembic migration : schema academique.*
  □ Seed : Fac. Informatique → Dep. GL → L3/M1 → UEs (INF431, INF452...)
```

### Phase 3 — Document Context (Semaines 4–5)

```
Livrables :
  □ Ressource Aggregate Root (invariants + domain events)
  □ TypeDocument (avec dérivation catégorie automatique)
  □ PolitiqueAccesService (Domain Service)
  □ IStockagePort ABC + MinioAdapter (miniopy-async)
  □ SQLModel RessourceModel, FichierModel, RessourceUEModel
  □ CreerRessourceUseCase, AjouterFichierUseCase, ListerRessourcesUseCase
  □ FastAPI routers /ressources, /fichiers
  □ URL présignée MinIO avec vérification ACL
  □ Alembic migration : schema document.*
  □ Tests : agrégat Ressource, PolitiqueAcces, MinioAdapter (mock)
```

### Phase 4 — Classification + Prolog (Semaine 6)

```
Livrables :
  □ IMoteurReglesPort ABC + PrologAdapter (httpx async)
  □ SWI-Prolog server HTTP (acadoc.pl : classifier, prerequis, recommande)
  □ ClassifierRessourceUseCase
  □ Event Listener : RessourceCreeListener
  □ Endpoints : /prerequis, /recommandations
  □ Alembic migration : schema classification.*
  □ Tests : PrologAdapter avec mock httpx, ClassifierUseCase
```

### Phase 5 — RAG + LanceDB (Semaines 7–8)

```
Livrables :
  □ pip install lancedb pyarrow
  □ LanceDBAdapter complet (indexer, rechercher, supprimer)
  □ ChunkingService (tiktoken pour comptage tokens)
  □ IEmbeddingPort + OpenAIEmbeddingAdapter
  □ ILLMPort + OpenAILLMAdapter
  □ IndexerRessourceUseCase
  □ PoserQuestionUseCase (RAG complet)
  □ Event Listener : FichierAjouteListener → déclenche IndexerRessource
  □ Endpoints /rag/index, /rag/search, /rag/ask
  □ Alembic migration : schema rag.*
  □ Tests : LanceDB en mode fichier temporaire, mocks OpenAI
```

**Pipeline automatique (déclenché par événement) :**

```
POST /api/ressources/{id}/fichiers
           │
           ▼
AjouterFichierUseCase
   ├── stocker PDF dans MinIO
   ├── INSERT FichierModel (PostgreSQL)
   └── émet FichierAjouteEvent
           │
           ▼ (EventBus)
FichierAjouteListener
   ├── télécharger PDF depuis MinIO
   ├── extraire texte (pypdf / pdfplumber)
   └── appelle IndexerRessourceUseCase
           │
           ▼
IndexerRessourceUseCase
   ├── ChunkingService → chunks (512 tokens, overlap 50)
   ├── Pour chaque chunk :
   │   ├── INSERT rag.chunk (PostgreSQL)
   │   ├── OpenAIEmbeddingAdapter.embarquer()
   │   └── LanceDBAdapter.indexer()
   └── émet DocumentIndexeEvent
```

### Phase 6 — Usage Context (Semaine 9)

```
Livrables :
  □ SQLModel : ConsultationModel, FavoriModel, RechercheModel
  □ Event Listeners : ConsultationListener, TelechargementListener
  □ Endpoints : /favoris, /historique
  □ Alembic migration : schema usage.*
```

### Phase 7 — React Native (Semaines 10–12)

Voir section 10.

---

## 10. Application React Native

### Structure (Expo Router + DDD-inspired)

```
mobile/
├── app/
│   ├── (auth)/login.tsx, register.tsx
│   ├── (tabs)/
│   │   ├── explorer.tsx   # Faculte → UE → Ressources
│   │   ├── search.tsx     # Recherche + RAG
│   │   ├── favoris.tsx
│   │   └── profil.tsx
│   └── ressource/
│       ├── [id].tsx
│       └── deposer.tsx
├── features/
│   ├── iam/          api/, hooks/useAuth.ts, store/
│   ├── academique/   api/, hooks/useUEs.ts
│   ├── document/     api/, hooks/useRessources.ts, components/
│   ├── rag/          api/, hooks/useRAG.ts, components/RAGChat.tsx
│   └── usage/        api/, hooks/useFavoris.ts
├── shared/
│   ├── api/base.ts   # axios + JWT interceptor
│   └── components/
└── package.json
```

### Hooks principaux (React Query)

```typescript
// features/document/hooks/useRessources.ts
export function useRessourcesParUE(ueId: string) {
  return useQuery({
    queryKey: ["ressources", "ue", ueId],
    queryFn: () => api.get(`/ues/${ueId}/ressources`).then(r => r.data),
  });
}

// features/rag/hooks/useRAG.ts
export function usePoserQuestion() {
  return useMutation({
    mutationFn: (payload: { question: string; ue_id?: string }) =>
      api.post("/rag/ask", payload).then(r => r.data),
  });
}
```

### Dépendances mobile

```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.0",
  "expo-secure-store": "~14.0.0",
  "expo-document-picker": "~12.0.0",
  "zustand": "^4.5.0",
  "@shopify/flash-list": "^1.6.0"
}
```

---

## 11. Diagramme d'architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         React Native (Expo)                               │
│   features/iam  features/document  features/rag  features/academique      │
└─────────────────────────┬────────────────────────────────────────────────┘
                          │ HTTPS + JWT
┌─────────────────────────▼────────────────────────────────────────────────┐
│                     FastAPI + SQLModel — DDD                              │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  IAM         │  │  Académique  │  │   Document    │  │ Classif.    │ │
│  │  Context     │  │  Context     │  │   Context     │  │ Context     │ │
│  │              │  │              │  │   Ressource ★ │  │ Thematique  │ │
│  │ Utilisateur  │  │ Faculte      │  │   Fichier     │  │ [Prolog ACL]│ │
│  │ JWT / Bcrypt │  │ Formation    │  │   MinioAdapter│  └──────┬──────┘ │
│  └──────────────┘  │ UE           │  └───────┬───────┘         │        │
│                    └──────────────┘          │ Events           │        │
│  ┌──────────────┐                            ▼                  ▼        │
│  │  RAG Context │◄────────────────── FichierAjouteEvent                 │
│  │              │◄────────────────── RessourceCreeEvent                  │
│  │  ChunkingService                                                       │
│  │  LanceDBAdapter ◄──── IVecteurStorePort                               │
│  │  OpenAIEmbedding ◄─── IEmbeddingPort                                  │
│  └──────────────┘                                                         │
│  ┌──────────────┐                                                         │
│  │  Usage       │ ← Event Listeners (Consultation, Telechargement)        │
│  │  Context     │                                                         │
│  └──────────────┘                                                         │
└────┬────────────────┬───────────────┬────────────────┬───────────────────┘
     │                │               │                │
┌────▼────────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
│ PostgreSQL  │ │   MinIO    │ │  LanceDB   │ │ SWI-Prolog  │
│             │ │            │ │            │ │             │
│ schema: iam │ │ bucket:    │ │ table:     │ │ acadoc.pl   │
│ schema: acad│ │ documents  │ │ chunks     │ │ HTTP :8080  │
│ schema: doc │ │ (PDF files)│ │ float32[]  │ │ classifier  │
│ schema: rag │ │            │ │ IVF-PQ idx │ │ prerequis   │
│ schema: usag│ │            │ │ cosine     │ │ recommande  │
└─────────────┘ └────────────┘ └────────────┘ └─────────────┘
```

---

## Récapitulatif des phases

| Phase | Bounded Context | Outils principaux | Semaine |
|-------|----------------|-------------------|---------|
| 0 | Shared Kernel + Infra | SQLModel, Alembic, Docker | 1 |
| 1 | IAM | FastAPI, python-jose, passlib | 2 |
| 2 | Académique | SQLModel Relationships | 3 |
| 3 | Document | MinIO (miniopy-async), Aggregate | 4–5 |
| 4 | Classification | Prolog (httpx bridge) | 6 |
| 5 | RAG | lancedb, openai, tiktoken | 7–8 |
| 6 | Usage | Event Listeners | 9 |
| 7 | React Native | Expo, React Query, Zustand | 10–12 |

### Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql+asyncpg://acadoc:secret@localhost:5432/acadoc
JWT_SECRET=change_me_in_production
JWT_EXPIRE_MINUTES=10080

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents

LANCEDB_URI=./data/lancedb

OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini

PROLOG_URL=http://localhost:8081
DEBUG=false
```

---

*Document généré le 3 juin 2026 — Architecture DDD · FastAPI · SQLModel · LanceDB*
