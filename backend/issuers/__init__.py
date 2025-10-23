# Package initializer for issuers
# Expose a small public API and provide helpful import-time errors if submodules are missing.

__all__ = [
    "Issuer",
    "IssuerCreate",
    "IssuerRead",
    "get_issuer",
    "create_issuer",
    "list_issuers",
    "issuer_router",
    "__version__",
]

__version__ = "0.1.0"

try:
    # Public objects expected to exist in sibling modules
    from .models import Issuer
    from .schemas import IssuerCreate, IssuerRead
    from .crud import get_issuer, create_issuer, list_issuers
    from .router import router as issuer_router
except Exception as _e:
    # Provide lazy placeholders that raise clear ImportError when used.
    class _MissingProxy:
        def __init__(self, target_name):
            self._target_name = target_name

        def __getattr__(self, item):
            raise ImportError(
                f"Cannot import '{self._target_name}' from 'issuers' package. "
                f"Ensure the module exists and does not raise on import. Original error: {_e!r}"
            ) from _e

        def __call__(self, *args, **kwargs):
            raise ImportError(
                f"Cannot call '{self._target_name}' from 'issuers' package. "
                f"Ensure the module exists and does not raise on import. Original error: {_e!r}"
            ) from _e

    def _make_raiser(name):
        def _raise(*args, **kwargs):
            raise ImportError(
                f"Cannot use '{name}' from 'issuers' package. "
                f"Ensure the module exists and does not raise on import. Original error: {_e!r}"
            ) from _e
        return _raise

    Issuer = _MissingProxy("models.Issuer")
    IssuerCreate = _MissingProxy("schemas.IssuerCreate")
    IssuerRead = _MissingProxy("schemas.IssuerRead")
    get_issuer = _make_raiser("crud.get_issuer")
    create_issuer = _make_raiser("crud.create_issuer")
    list_issuers = _make_raiser("crud.list_issuers")
    issuer_router = _MissingProxy("router.router")