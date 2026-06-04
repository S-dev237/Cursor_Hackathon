import uuid
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.value_objects.email import Email
from .models import UtilisateurModel


class UtilisateurMapper:
    @staticmethod
    def to_domain(model: UtilisateurModel) -> Utilisateur:
        email = Email.creer(model.email).or_raise()
        return Utilisateur(
            id=model.id,
            _email=email,
            _type=model.type,          # type: ignore[arg-type]
            _mot_de_passe_hash=model.mot_de_passe_hash,
            _actif=model.actif,
            _nom=model.nom,
            _prenom=model.prenom,
            _nom_complet=model.nom_complet,
            _institution_id=model.institution_id,
            _cree_le=model.cree_le,
            _derniere_connexion=model.derniere_connexion,
        )

    @staticmethod
    def to_model(domain: Utilisateur) -> UtilisateurModel:
        return UtilisateurModel(
            id=domain.id,
            email=domain.email,
            mot_de_passe_hash=domain.mot_de_passe_hash,
            type=domain.type,
            actif=domain.actif,
            nom=domain.nom,
            prenom=domain.prenom,
            nom_complet=domain.nom_complet,
            institution_id=domain.institution_id,
            cree_le=domain.cree_le,
            derniere_connexion=domain.derniere_connexion,
        )
