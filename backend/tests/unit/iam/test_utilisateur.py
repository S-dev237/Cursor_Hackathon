import pytest
from src.modules.iam.domain.aggregates.utilisateur import Utilisateur
from src.modules.iam.domain.value_objects.email import Email
from src.modules.iam.domain.events.utilisateur_cree import UtilisateurCreeEvent


def test_creer_utilisateur_emet_event():
    u = Utilisateur.creer("alice@univ.fr", "ETUDIANT", "hash_bcrypt")
    assert len(u.domain_events) == 1
    event = u.domain_events[0]
    assert isinstance(event, UtilisateurCreeEvent)
    assert event.email == "alice@univ.fr"


def test_email_valide():
    result = Email.creer("alice@univ.fr")
    assert result.is_success
    assert result.value.valeur == "alice@univ.fr"


def test_email_invalide():
    result = Email.creer("pas_un_email")
    assert result.is_failure


def test_utilisateur_desactiver():
    u = Utilisateur.creer("bob@univ.fr", "ENSEIGNANT", "hash")
    assert u.actif is True
    u.desactiver()
    assert u.actif is False


def test_clear_events():
    u = Utilisateur.creer("carol@univ.fr", "ADMIN", "hash")
    assert len(u.domain_events) == 1
    u.clear_events()
    assert len(u.domain_events) == 0
