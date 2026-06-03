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
        )
