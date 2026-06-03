from __future__ import annotations
from dataclasses import dataclass
from typing import TypeVar, Generic, Optional

T = TypeVar("T")
E = TypeVar("E")


@dataclass(frozen=True)
class Result(Generic[T, E]):
    """
    Railway-Oriented Programming pattern.
    Évite les exceptions pour les erreurs métier prévisibles.

    Usage:
        result = Email.creer("bad")
        if result.is_failure:
            return result.error   # str
        email = result.value      # Email
    """
    _ok: bool
    _value: Optional[T] = None
    _error: Optional[E] = None

    @classmethod
    def ok(cls, value: T) -> "Result[T, E]":
        return cls(_ok=True, _value=value)

    @classmethod
    def fail(cls, error: E) -> "Result[T, E]":
        return cls(_ok=False, _error=error)

    @property
    def is_success(self) -> bool:
        return self._ok

    @property
    def is_failure(self) -> bool:
        return not self._ok

    @property
    def value(self) -> T:
        if not self._ok:
            raise RuntimeError(f"Cannot access value of a failed Result: {self._error}")
        return self._value  # type: ignore[return-value]

    @property
    def error(self) -> E:
        if self._ok:
            raise RuntimeError("Cannot access error of a successful Result")
        return self._error  # type: ignore[return-value]

    def or_raise(self) -> T:
        """Retourne la valeur ou lève ValueError avec le message d'erreur."""
        if self.is_failure:
            raise ValueError(str(self._error))
        return self._value  # type: ignore[return-value]
