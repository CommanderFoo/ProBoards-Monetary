Monetary System 0.9.8
=====================

Forum Topic - http://support.proboards.com/thread/429762/

Build
-----

Rebuild the ProBoards import bundles after editing source JavaScript:

```
python scripts/build_pbp.py
python scripts/build_shop_pbp.py
```

The builders preserve the existing `.pbp` metadata and replace the JavaScript component from the source files.
