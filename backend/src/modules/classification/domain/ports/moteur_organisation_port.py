from abc import ABC, abstractmethod
from typing import List, Optional
from ..value_objects.categorie_inferee import CategorieInferee


class IMoteurOrganisationPort(ABC):
    """
    Port du moteur d'inférence chargé de construire automatiquement les
    structures de classement (dossiers virtuels) à partir des connaissances
    extraites d'un document.

    Implémentations (infrastructure) : moteur Prolog embarqué, serveur
    SWI-Prolog HTTP, etc.
    """

    @abstractmethod
    def extraire_mots_cles(self, texte: str) -> List[str]:
        """
        Repère, dans un texte libre (titre, description, résumé extrait par
        l'IA), les mots-clés connus du vocabulaire de la taxonomie.
        Retourne des codes normalisés (ex : ["cnn", "oncologie"]).
        """
        ...

    @abstractmethod
    def inferer_categories(
        self,
        mots_cles: List[str],
        annee: Optional[int] = None,
        auteurs: Optional[List[str]] = None,
        laboratoires: Optional[List[str]] = None,
    ) -> List[CategorieInferee]:
        """
        Déduit, par les règles de la taxonomie, l'ensemble des catégories de
        classement (tous axes confondus) auxquelles appartient une ressource.
        Inclut les catégories ancêtres via la fermeture transitive
        `appartient/2`.
        """
        ...

    @abstractmethod
    def libelle_categorie(self, code: str) -> Optional[str]:
        """Retourne le libellé affichable d'un code de catégorie connu."""
        ...
