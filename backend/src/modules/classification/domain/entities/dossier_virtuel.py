from __future__ import annotations
import uuid
from dataclasses import dataclass


@dataclass
class DossierVirtuel:
    """
    Dossier virtuel d'organisation. N'est PAS un dossier physique : aucun
    fichier n'est dupliqué. C'est une vue de classement à laquelle des
    ressources sont rattachées (relation N..N via DocumentDossier).
    """

    id: uuid.UUID
    axe: str       # DISCIPLINE | DOMAINE | ANNEE | AUTEUR | LABORATOIRE
    code: str      # identifiant stable et unique au sein d'un axe
    nom: str       # libellé affiché

    @classmethod
    def creer(cls, axe: str, code: str, nom: str) -> "DossierVirtuel":
        return cls(id=uuid.uuid4(), axe=axe.upper(), code=code.lower(), nom=nom)
