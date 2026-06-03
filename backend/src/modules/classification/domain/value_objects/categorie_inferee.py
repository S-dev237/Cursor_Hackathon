from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class CategorieInferee:
    """
    Résultat d'inférence du moteur de règles : une catégorie de classement
    déduite pour une ressource, avec l'axe auquel elle appartient.

    `origine` indique comment la classification a été obtenue :
      - PROLOG : déduite par les règles de la taxonomie
      - IA     : extraite par un modèle (métadonnées du document)
      - MANUELLE : choisie explicitement par l'utilisateur
    """

    axe: str          # DISCIPLINE | DOMAINE | ANNEE | AUTEUR | LABORATOIRE
    code: str         # identifiant stable du dossier (ex : "deep_learning", "2026")
    libelle: str      # libellé affiché (ex : "Deep Learning")
    origine: str = "PROLOG"

    def cle(self) -> tuple[str, str]:
        return (self.axe, self.code)
