from fastapi import HTTPException, status


class DomainException(Exception):
    """Erreur métier du domaine (non 500)."""
    pass


class NotFoundException(DomainException):
    pass


class UnauthorizedException(DomainException):
    pass


class AccessDeniedException(DomainException):
    pass


class ValidationException(DomainException):
    pass


class ConflictException(DomainException):
    pass


def domain_exception_to_http(exc: DomainException) -> HTTPException:
    """Convertit une DomainException en HTTPException FastAPI."""
    if isinstance(exc, NotFoundException):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, UnauthorizedException):
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    if isinstance(exc, AccessDeniedException):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, ConflictException):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if isinstance(exc, ValidationException):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
