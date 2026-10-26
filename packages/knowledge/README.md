# JEPA-style knowledge sandbox

`knowledge_library.py` is a local research scaffold, not an Android component and not a verified world model. Install its Python dependencies explicitly in an isolated environment before use. It has no import-time training, no automatic weights download, no remote data access, and no frontend execution path.

The supplied draft had several correctness risks: `ImageFolder` requires class subfolders despite the single-folder comment; changing the transform on `random_split` subsets changes the shared dataset; splitting a batch into two halves pairs unrelated images; `BatchNorm1d` can fail with singleton batches; `device="auto"` was later passed directly to `.to()`; a new-data fine-tune path rebuilt and then restored incompatible state; and unrestricted checkpoint loading can deserialize unsafe objects.

This version enumerates images under a specified directory, gives train/validation independent datasets, makes two views of each same image, uses LayerNorm, resolves the device once, maintains an EMA target, adds a batch-variance penalty, and loads only local sandbox checkpoints with `weights_only=True`. EMA plus variance regularization still does **not** prove collapse prevention. Model quality requires held-out evaluation and evidence classification before any downstream use. Do not use for medical or safety-critical decisions.

Example from a Python environment where dependencies have already been installed:

```python
from knowledge_library import KnowledgeLibrary, DataConfig, SandboxConfig

library = KnowledgeLibrary(
    data=DataConfig(data_path="/path/to/consented/images"),
    sandbox=SandboxConfig(root_dir="./local_sandbox"),
)
# Explicit opt-in only:
library.train()
```

Keep source datasets consented, bounded, and separate from secrets. Review checkpoints before loading them, even with safe loading enabled. The module has not been trained or benchmarked in this repository.