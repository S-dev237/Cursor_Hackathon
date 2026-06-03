from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import List, Optional

from ...domain.ports.moteur_organisation_port import IMoteurOrganisationPort
from ...domain.value_objects.categorie_inferee import CategorieInferee
from ...infrastructure.persistence.repository import SQLModelDossierVirtuelRepository


@dataclass(frozen=True)
class OrganiserRessourceCommand:
    ressource_id: uuid.UUID
    titre: str
    description: Optional[str] = None
    resume_ia: Optional[str] = None
    annee: Optional[int] = None
    auteurs: List[str] = field(default_factory=list)
    laboratoires: List[str] = field(default_factory=list)
    mots_cles_supplementaires: List[str] = field(default_factory=list)


class OrganiserRessourceUseCase:
    """
    PDF → (Extraction IA) → Métadonnées → Prolog → Classements automatiques.

    Déduit les dossiers virtuels d'une ressource via le moteur de règles puis
    matérialise les structures de classement (dossiers + rattachements).
    Le document physique n'est jamais dupliqué : seules les classifications
    changent.
    """

    def __init__(
        self,
        moteur: IMoteurOrganisationPort,
        repo: SQLModelDossierVirtuelRepository,
    ):
        self._moteur = moteur
        self._repo = repo

    async def execute(self, cmd: OrganiserRessourceCommand) -> List[CategorieInferee]:
        # 1. Extraction des mots-clés à partir des métadonnées textuelles.
        texte = " ".join(filter(None, [cmd.titre, cmd.description, cmd.resume_ia]))
        mots_cles = self._moteur.extraire_mots_cles(texte)
        for mot in cmd.mots_cles_supplementaires:
            if mot.lower() not in mots_cles:
                mots_cles.append(mot.lower())

        # 2. Inférence Prolog : catégories de classement (tous axes).
        categories = self._moteur.inferer_categories(
            mots_cles=mots_cles,
            annee=cmd.annee,
            auteurs=cmd.auteurs,
            laboratoires=cmd.laboratoires,
        )

        # 3. Re-matérialisation : on remplace les rattachements déduits par
        #    Prolog (les rattachements MANUELS de l'utilisateur sont préservés).
        await self._repo.supprimer_liens(cmd.ressource_id, origine="PROLOG")
        for cat in categories:
            dossier = await self._repo.trouver_ou_creer(cat.axe, cat.code, cat.libelle)
            await self._repo.lier(cmd.ressource_id, dossier.id, origine=cat.origine)

        await self._repo.commit()
        return categories
