from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Optional, List
from src.shared.domain.aggregate_root import AggregateRoot
from ..value_objects.type_document import TypeDocument
from ..value_objects.titre_document import TitreDocument
from ..entities.fichier import Fichier
from ..events.ressource_cree import RessourceCreeEvent, FichierAjouteEvent, RessourcePublieeEvent

_NIVEAU_ACCES_VALEURS = ("PUBLIC", "CAMPUS", "PRIVE")


@dataclass
class Ressource(AggregateRoot):
    id: uuid.UUID
    _titre: TitreDocument
    _type: TypeDocument
    _proprietaire_id: uuid.UUID
    _niveau_acces: str  # PUBLIC | CAMPUS | PRIVE
    _annee: Optional[int] = None
    _description: Optional[str] = None
    _publiee: bool = False
    _doi: Optional[str] = None
    _fichiers: List[Fichier] = field(default_factory=list)
    _ue_ids: List[uuid.UUID] = field(default_factory=list)
    _auteur_ids: List[uuid.UUID] = field(default_factory=list)

    # ── Factory ────────────────────────────────────────────────────────
    @classmethod
    def creer(
        cls,
        titre: str,
        type_str: str,
        proprietaire_id: uuid.UUID,
        niveau_acces: str = "CAMPUS",
        annee: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "Ressource":
        if niveau_acces not in _NIVEAU_ACCES_VALEURS:
            raise ValueError(f"Niveau d'accès invalide : {niveau_acces}")

        titre_vo = TitreDocument.creer(titre).or_raise()
        type_vo = TypeDocument.from_str(type_str)
        ressource_id = uuid.uuid4()

        r = cls(
            id=ressource_id,
            _titre=titre_vo,
            _type=type_vo,
            _proprietaire_id=proprietaire_id,
            _niveau_acces=niveau_acces,
            _annee=annee,
            _description=description,
        )
        r._add_event(RessourceCreeEvent(
            ressource_id=str(ressource_id),
            titre=titre,
            type_document=type_str,
            proprietaire_id=str(proprietaire_id),
            niveau_acces=niveau_acces,
        ))
        return r

    # ── Comportements ──────────────────────────────────────────────────
    def ajouter_fichier(self, fichier: Fichier) -> None:
        self._fichiers.append(fichier)
        self._add_event(FichierAjouteEvent(
            ressource_id=str(self.id),
            fichier_id=str(fichier.id),
            minio_bucket=fichier.minio_bucket,
            minio_key=fichier.minio_key,
        ))

    def publier(self) -> None:
        if not self._fichiers:
            raise ValueError("Impossible de publier une ressource sans fichier")
        self._publiee = True
        self._add_event(RessourcePublieeEvent(ressource_id=str(self.id)))

    def assigner_ue(self, ue_id: uuid.UUID) -> None:
        if ue_id not in self._ue_ids:
            self._ue_ids.append(ue_id)

    def assigner_auteur(self, auteur_id: uuid.UUID) -> None:
        if auteur_id not in self._auteur_ids:
            self._auteur_ids.append(auteur_id)

    def peut_etre_accede_par(self, utilisateur_id: Optional[uuid.UUID], est_authentifie: bool) -> bool:
        match self._niveau_acces:
            case "PUBLIC":
                return True
            case "CAMPUS":
                return est_authentifie
            case "PRIVE":
                return utilisateur_id == self._proprietaire_id

    # ── Propriétés ─────────────────────────────────────────────────────
    @property
    def titre(self) -> str:
        return self._titre.valeur

    @property
    def type(self) -> str:
        return self._type.valeur

    @property
    def categorie(self) -> str:
        return self._type.categorie()

    @property
    def proprietaire_id(self) -> uuid.UUID:
        return self._proprietaire_id

    @property
    def niveau_acces(self) -> str:
        return self._niveau_acces

    @property
    def annee(self) -> Optional[int]:
        return self._annee

    @property
    def description(self) -> Optional[str]:
        return self._description

    @property
    def publiee(self) -> bool:
        return self._publiee

    @property
    def fichiers(self) -> List[Fichier]:
        return list(self._fichiers)

    @property
    def ue_ids(self) -> List[uuid.UUID]:
        return list(self._ue_ids)
