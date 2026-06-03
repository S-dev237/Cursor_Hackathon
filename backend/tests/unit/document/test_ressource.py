import pytest
import uuid
from src.modules.document.domain.aggregates.ressource import Ressource
from src.modules.document.domain.entities.fichier import Fichier
from src.modules.document.domain.events.ressource_cree import RessourceCreeEvent, FichierAjouteEvent


def make_ressource(**kwargs):
    defaults = dict(
        titre="Cours Réseaux",
        type_str="COURS",
        proprietaire_id=uuid.uuid4(),
        niveau_acces="CAMPUS",
    )
    defaults.update(kwargs)
    return Ressource.creer(**defaults)


def test_creer_ressource_emet_event():
    r = make_ressource()
    assert len(r.domain_events) == 1
    assert isinstance(r.domain_events[0], RessourceCreeEvent)


def test_categorie_cours():
    r = make_ressource(type_str="COURS")
    assert r.categorie == "RESSOURCE_PEDAGOGIQUE"


def test_categorie_these():
    r = make_ressource(type_str="THESE")
    assert r.categorie == "PRODUCTION_SCIENTIFIQUE"


def test_ajouter_fichier_emet_event():
    r = make_ressource()
    r.clear_events()
    fichier = Fichier.creer(
        ressource_id=r.id,
        minio_bucket="documents",
        minio_key="key/fichier.pdf",
        nom_original="cours.pdf",
        taille_octets=1024,
    )
    r.ajouter_fichier(fichier)
    assert len(r.domain_events) == 1
    assert isinstance(r.domain_events[0], FichierAjouteEvent)


def test_publier_sans_fichier_leve_erreur():
    r = make_ressource()
    with pytest.raises(ValueError):
        r.publier()


def test_acces_public():
    r = make_ressource(niveau_acces="PUBLIC")
    assert r.peut_etre_accede_par(None, False) is True


def test_acces_campus_non_authentifie():
    r = make_ressource(niveau_acces="CAMPUS")
    assert r.peut_etre_accede_par(None, False) is False


def test_acces_prive_proprietaire():
    proprio = uuid.uuid4()
    r = make_ressource(niveau_acces="PRIVE", proprietaire_id=proprio)
    assert r.peut_etre_accede_par(proprio, True) is True
    assert r.peut_etre_accede_par(uuid.uuid4(), True) is False
