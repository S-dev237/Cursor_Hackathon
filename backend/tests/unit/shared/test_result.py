import pytest
from src.shared.domain.result import Result


def test_ok_result():
    r = Result.ok(42)
    assert r.is_success
    assert r.value == 42


def test_fail_result():
    r = Result.fail("erreur")
    assert r.is_failure
    assert r.error == "erreur"


def test_ok_cannot_access_error():
    r = Result.ok("valeur")
    with pytest.raises(RuntimeError):
        _ = r.error


def test_fail_cannot_access_value():
    r = Result.fail("erreur")
    with pytest.raises(RuntimeError):
        _ = r.value


def test_or_raise_success():
    r = Result.ok("ok")
    assert r.or_raise() == "ok"


def test_or_raise_failure():
    r = Result.fail("erreur critique")
    with pytest.raises(ValueError, match="erreur critique"):
        r.or_raise()
