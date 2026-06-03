"""
Moteur d'organisation multi-vues — implémentation Prolog embarquée.

Reproduit fidèlement la sémantique de `backend/prolog/taxonomie.pl` :
  - faits        : categorie_meta/3, sous_domaine/2, motcle/2
  - règles       : appartient/2 (fermeture transitive), categorie/2

L'intérêt de Prolog ici n'est PAS de gérer les documents, mais de DÉDUIRE
automatiquement les structures de classement (dossiers virtuels) à partir des
connaissances extraites d'un document. La fermeture transitive sur la taxonomie
(`appartient/2`) évite de stocker explicitement « Deep Learning ⟹ ML ⟹ IA ».
"""
from __future__ import annotations
import unicodedata
from typing import List, Optional, Dict, Tuple

from ...domain.ports.moteur_organisation_port import IMoteurOrganisationPort
from ...domain.value_objects.categorie_inferee import CategorieInferee


# =============================================================================
# Base de connaissances (miroir de taxonomie.pl)
# =============================================================================

# categorie_meta(Code) -> (Axe, Libelle)
_CATEGORIE_META: Dict[str, Tuple[str, str]] = {
    # Axe DISCIPLINE
    "informatique": ("DISCIPLINE", "Informatique"),
    "intelligence_artificielle": ("DISCIPLINE", "Intelligence Artificielle"),
    "machine_learning": ("DISCIPLINE", "Machine Learning"),
    "deep_learning": ("DISCIPLINE", "Deep Learning"),
    "reseaux_neurones": ("DISCIPLINE", "Réseaux de neurones"),
    "cnn": ("DISCIPLINE", "Réseaux convolutifs (CNN)"),
    "nlp": ("DISCIPLINE", "Traitement du langage (NLP)"),
    "vision_par_ordinateur": ("DISCIPLINE", "Vision par ordinateur"),
    "data_science": ("DISCIPLINE", "Data Science"),
    "big_data": ("DISCIPLINE", "Big Data"),
    "securite_informatique": ("DISCIPLINE", "Sécurité informatique"),
    "cryptographie": ("DISCIPLINE", "Cryptographie"),
    "reseaux": ("DISCIPLINE", "Réseaux & télécoms"),
    "bases_de_donnees": ("DISCIPLINE", "Bases de données"),
    "genie_logiciel": ("DISCIPLINE", "Génie logiciel"),
    # Axe DOMAINE (application)
    "sante": ("DOMAINE", "Santé"),
    "imagerie_medicale": ("DOMAINE", "Imagerie médicale"),
    "oncologie": ("DOMAINE", "Oncologie"),
    "agriculture": ("DOMAINE", "Agriculture"),
    "finance": ("DOMAINE", "Finance"),
    "environnement": ("DOMAINE", "Environnement"),
    "education": ("DOMAINE", "Éducation"),
    "transport": ("DOMAINE", "Transport"),
    "energie": ("DOMAINE", "Énergie"),
}

# sous_domaine(Enfant, Parent)
_SOUS_DOMAINE: List[Tuple[str, str]] = [
    ("cnn", "reseaux_neurones"),
    ("reseaux_neurones", "deep_learning"),
    ("deep_learning", "machine_learning"),
    ("machine_learning", "intelligence_artificielle"),
    ("nlp", "intelligence_artificielle"),
    ("vision_par_ordinateur", "intelligence_artificielle"),
    ("intelligence_artificielle", "informatique"),
    ("data_science", "informatique"),
    ("big_data", "data_science"),
    ("securite_informatique", "informatique"),
    ("cryptographie", "securite_informatique"),
    ("reseaux", "informatique"),
    ("bases_de_donnees", "informatique"),
    ("genie_logiciel", "informatique"),
    ("imagerie_medicale", "sante"),
    ("oncologie", "sante"),
]

# Vocabulaire : phrase (normalisée, sans accent) -> codes de catégories.
# L'ordre importe : les phrases les plus longues/spécifiques d'abord pour
# éviter les faux positifs (ex : « reseau de neurones » avant « reseau »).
_VOCABULAIRE: List[Tuple[str, List[str]]] = [
    ("reseau de neurones convolutif", ["cnn"]),
    ("convolutional neural network", ["cnn"]),
    ("reseau convolutif", ["cnn"]),
    ("cnn", ["cnn"]),
    ("reseau de neurones", ["reseaux_neurones"]),
    ("neural network", ["reseaux_neurones"]),
    ("neurone", ["reseaux_neurones"]),
    ("apprentissage profond", ["deep_learning"]),
    ("deep learning", ["deep_learning"]),
    ("apprentissage automatique", ["machine_learning"]),
    ("apprentissage statistique", ["machine_learning"]),
    ("machine learning", ["machine_learning"]),
    ("intelligence artificielle", ["intelligence_artificielle"]),
    ("artificial intelligence", ["intelligence_artificielle"]),
    ("traitement du langage", ["nlp"]),
    ("langage naturel", ["nlp"]),
    ("natural language", ["nlp"]),
    ("nlp", ["nlp"]),
    ("vision par ordinateur", ["vision_par_ordinateur"]),
    ("computer vision", ["vision_par_ordinateur"]),
    ("imagerie medicale", ["imagerie_medicale"]),
    ("medical imaging", ["imagerie_medicale"]),
    ("radiolog", ["imagerie_medicale"]),
    ("scanner", ["imagerie_medicale"]),
    ("irm", ["imagerie_medicale"]),
    ("tumeur", ["oncologie"]),
    ("tumor", ["oncologie"]),
    ("cancer", ["oncologie"]),
    ("oncolog", ["oncologie"]),
    ("medical", ["sante"]),
    ("medecine", ["sante"]),
    ("clinique", ["sante"]),
    ("patient", ["sante"]),
    ("sante", ["sante"]),
    ("big data", ["big_data"]),
    ("donnees massives", ["big_data"]),
    ("data science", ["data_science"]),
    ("science des donnees", ["data_science"]),
    ("cryptograph", ["cryptographie"]),
    ("chiffrement", ["cryptographie"]),
    ("cybersecurite", ["securite_informatique"]),
    ("securite informatique", ["securite_informatique"]),
    ("base de donnees", ["bases_de_donnees"]),
    ("nosql", ["bases_de_donnees"]),
    ("genie logiciel", ["genie_logiciel"]),
    ("software engineering", ["genie_logiciel"]),
    ("agricol", ["agriculture"]),
    ("agriculture", ["agriculture"]),
    ("finance", ["finance"]),
    ("bancaire", ["finance"]),
    ("environnement", ["environnement"]),
    ("ecologie", ["environnement"]),
    ("climat", ["environnement"]),
    ("education", ["education"]),
    ("pedagog", ["education"]),
    ("enseignement", ["education"]),
    ("transport", ["transport"]),
    ("mobilite", ["transport"]),
    ("energie", ["energie"]),
]


def _normaliser(texte: str) -> str:
    """Minuscule + suppression des accents pour une comparaison robuste."""
    sans_accent = "".join(
        c for c in unicodedata.normalize("NFD", texte)
        if unicodedata.category(c) != "Mn"
    )
    return sans_accent.lower()


class MoteurOrganisationProlog(IMoteurOrganisationPort):
    def __init__(self) -> None:
        # Index parent : enfant -> liste de parents directs (sous_domaine/2)
        self._parents: Dict[str, List[str]] = {}
        for enfant, parent in _SOUS_DOMAINE:
            self._parents.setdefault(enfant, []).append(parent)

    # ── appartient/2 : fermeture transitive de sous_domaine/2 ──────────────
    def _ancetres(self, code: str) -> List[str]:
        resultat: List[str] = []
        vus = set()
        pile = list(self._parents.get(code, []))
        while pile:
            parent = pile.pop()
            if parent in vus:
                continue
            vus.add(parent)
            resultat.append(parent)
            pile.extend(self._parents.get(parent, []))
        return resultat

    # ── Port : extraction des mots-clés ────────────────────────────────────
    def extraire_mots_cles(self, texte: str) -> List[str]:
        norm = _normaliser(texte or "")
        codes: List[str] = []
        for phrase, cibles in _VOCABULAIRE:
            if phrase in norm:
                for code in cibles:
                    if code not in codes:
                        codes.append(code)
        return codes

    # ── Port : inférence des catégories (categorie/2) ──────────────────────
    def inferer_categories(
        self,
        mots_cles: List[str],
        annee: Optional[int] = None,
        auteurs: Optional[List[str]] = None,
        laboratoires: Optional[List[str]] = None,
    ) -> List[CategorieInferee]:
        resultats: List[CategorieInferee] = []
        deja: set[Tuple[str, str]] = set()

        def _ajouter(axe: str, code: str, libelle: str) -> None:
            cle = (axe, code)
            if cle not in deja:
                deja.add(cle)
                resultats.append(CategorieInferee(axe=axe, code=code, libelle=libelle, origine="PROLOG"))

        # categorie(Doc, Cat) :- motcle(Doc, Cat).
        # categorie(Doc, Cat) :- motcle(Doc, M), appartient(M, Cat).
        for mot in mots_cles:
            mot = mot.lower()
            for code in [mot, *self._ancetres(mot)]:
                meta = _CATEGORIE_META.get(code)
                if meta:
                    axe, libelle = meta
                    _ajouter(axe, code, libelle)

        # Axes non issus du vocabulaire (faits directs sur la ressource).
        if annee:
            _ajouter("ANNEE", str(annee), str(annee))
        for auteur in auteurs or []:
            nom = auteur.strip()
            if nom:
                _ajouter("AUTEUR", _normaliser(nom).replace(" ", "_"), nom)
        for labo in laboratoires or []:
            nom = labo.strip()
            if nom:
                _ajouter("LABORATOIRE", _normaliser(nom).replace(" ", "_"), nom)

        return resultats

    # ── Port : libellé d'un code ───────────────────────────────────────────
    def libelle_categorie(self, code: str) -> Optional[str]:
        meta = _CATEGORIE_META.get(code.lower())
        return meta[1] if meta else None
