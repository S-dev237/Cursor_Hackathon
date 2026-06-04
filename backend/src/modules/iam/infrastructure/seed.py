"""Crée des comptes de démonstration au démarrage (idempotent).

Ces comptes permettent aux tests de l'appli mobile et du frontend web de
fonctionner immédiatement contre le backend réel sans inscription préalable.
"""
import logging
from src.shared.infrastructure.database import async_session_factory
from .persistence.repository import SQLModelUtilisateurRepository
from .services.password_service import PasswordService
from ..domain.aggregates.utilisateur import Utilisateur

logger = logging.getLogger("acadoc.iam.seed")

# Colonnes : (email, mot_de_passe, type, prenom, nom, institution_id)
_DEMO_USERS = [
    # ── Administrateur ───────────────────────────────────────────────
    ("admin@openscience.cm",  "demo123", "ADMIN",      "Administrateur", "OpenScience",  "ins-1"),

    # ── Enseignants ──────────────────────────────────────────────────
    ("prof.kamga@enspy.cm",   "demo123", "ENSEIGNANT", "Joseph",         "Kamga",        "ins-1"),
    ("prof.mbida@uy1.cm",     "demo123", "ENSEIGNANT", "Hortense",       "Mbida",        "ins-2"),

    # ── Étudiants ────────────────────────────────────────────────────
    ("demo@etudiant.cm",      "demo123", "ETUDIANT",   "Marie",          "Kouassi",      "ins-2"),
    ("awa.diallo@uy1.cm",     "demo123", "ETUDIANT",   "Awa",            "Diallo",       "ins-2"),
    ("paul.nkomo@ud.cm",      "demo123", "ETUDIANT",   "Paul",           "Nkomo",        "ins-4"),
    ("claire.fotso@uds.cm",   "demo123", "ETUDIANT",   "Claire",         "Fotso",        "ins-5"),
]


async def seed_demo_users() -> None:
    pwd = PasswordService()
    async with async_session_factory() as session:
        repo = SQLModelUtilisateurRepository(session)
        for email, password, type_user, prenom, nom, institution_id in _DEMO_USERS:
            if await repo.existe_par_email(email):
                continue
            nom_complet = f"{prenom} {nom}"
            utilisateur = Utilisateur.creer(
                email_str=email,
                type_user=type_user,          # type: ignore[arg-type]
                mot_de_passe_hash=pwd.hacher(password),
                prenom=prenom,
                nom=nom,
                nom_complet=nom_complet,
                institution_id=institution_id,
            )
            utilisateur.clear_events()
            await repo.sauvegarder(utilisateur)
            logger.info("Compte de démonstration créé : %s (%s %s)", email, prenom, nom)
