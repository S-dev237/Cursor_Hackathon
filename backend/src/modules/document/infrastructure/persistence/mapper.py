from ...domain.aggregates.ressource import Ressource
from ...domain.entities.fichier import Fichier
from .models import RessourceModel, FichierModel


class RessourceMapper:
    @staticmethod
    def to_domain(model: RessourceModel, fichiers: list[FichierModel] | None = None) -> Ressource:
        import uuid
        from ...domain.value_objects.titre_document import TitreDocument
        from ...domain.value_objects.type_document import TypeDocument
        titre_vo = TitreDocument.creer(model.titre).or_raise()
        type_vo = TypeDocument.from_str(model.type_document)
        r = Ressource(
            id=model.id,
            _titre=titre_vo,
            _type=type_vo,
            _proprietaire_id=model.proprietaire_id,
            _niveau_acces=model.niveau_acces,
            _annee=model.annee,
            _description=model.description,
            _publiee=model.publiee,
            _doi=model.doi,
        )
        if fichiers:
            for f in fichiers:
                r._fichiers.append(FichierMapper.to_domain(f))
        return r

    @staticmethod
    def to_model(domain: Ressource) -> RessourceModel:
        return RessourceModel(
            id=domain.id,
            titre=domain.titre,
            type_document=domain.type,
            categorie=domain.categorie,
            niveau_acces=domain.niveau_acces,
            annee=domain.annee,
            description=domain.description,
            publiee=domain.publiee,
            proprietaire_id=domain.proprietaire_id,
        )


class FichierMapper:
    @staticmethod
    def to_domain(model: FichierModel) -> Fichier:
        return Fichier(
            id=model.id,
            ressource_id=model.ressource_id,
            minio_bucket=model.minio_bucket,
            minio_key=model.minio_key,
            nom_original=model.nom_original,
            taille_octets=model.taille_octets,
            type_mime=model.type_mime,
            checksum_sha256=model.checksum_sha256,
        )

    @staticmethod
    def to_model(domain: Fichier) -> FichierModel:
        return FichierModel(
            id=domain.id,
            ressource_id=domain.ressource_id,
            minio_bucket=domain.minio_bucket,
            minio_key=domain.minio_key,
            nom_original=domain.nom_original,
            taille_octets=domain.taille_octets,
            type_mime=domain.type_mime,
            checksum_sha256=domain.checksum_sha256,
        )
