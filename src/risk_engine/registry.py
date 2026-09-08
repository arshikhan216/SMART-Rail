"""Model Versioning, SHA-256 Artifact Integrity, and Metadata Registry Engine."""

from __future__ import annotations
import datetime as dt
import hashlib
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
import joblib
from pydantic import BaseModel, Field

from src.exceptions import ModelInferenceError

logger = logging.getLogger(__name__)


class ModelVersionMetadata(BaseModel):
    """Metadata record for a registered machine learning model version."""
    model_id: str
    model_name: str
    version: str
    algorithm: str
    created_at: dt.datetime
    metrics: Dict[str, float] = Field(default_factory=dict)
    feature_names: List[str] = Field(default_factory=list)
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    artifact_paths: Dict[str, str] = Field(default_factory=dict)
    artifact_checksums: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True
    description: str = ""


class ModelRegistry:
    """Manages model artifact versioning, SHA-256 integrity verification, and champion promotion."""

    def __init__(self, registry_root: Union[str, Path] = "models/registry"):
        self.registry_root = Path(registry_root)
        self.registry_root.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.registry_root / "registry_manifest.json"
        self._manifest: Dict[str, List[Dict[str, Any]]] = self._load_manifest()

    def _load_manifest(self) -> Dict[str, List[Dict[str, Any]]]:
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Could not read registry manifest: %s. Creating fresh manifest.", e)
        return {}

    def _save_manifest(self):
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self._manifest, f, indent=2, default=str)

    @staticmethod
    def _compute_sha256(file_path: Path) -> str:
        """Compute SHA-256 hash checksum of an artifact file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def register_model(
        self,
        model_name: str,
        version: str,
        model_obj: Any,
        pipeline_obj: Any,
        algorithm: str,
        metrics: Dict[str, float],
        feature_names: List[str],
        hyperparameters: Dict[str, Any],
        description: str = "",
        set_as_active: bool = True,
    ) -> ModelVersionMetadata:
        """Serialize, checksum, and register a new machine learning model version."""
        model_id = f"{model_name}_v{version}"
        version_dir = self.registry_root / model_name / f"v{version}"
        version_dir.mkdir(parents=True, exist_ok=True)

        model_file = version_dir / "model.joblib"
        pipeline_file = version_dir / "pipeline.joblib"

        joblib.dump(model_obj, model_file)
        joblib.dump(pipeline_obj, pipeline_file)

        checksums = {
            "model.joblib": self._compute_sha256(model_file),
            "pipeline.joblib": self._compute_sha256(pipeline_file),
        }

        paths = {
            "model.joblib": str(model_file.as_posix()),
            "pipeline.joblib": str(pipeline_file.as_posix()),
        }

        # If setting as active champion, deactivate previous active versions
        if set_as_active and model_name in self._manifest:
            for item in self._manifest[model_name]:
                item["is_active"] = False

        meta = ModelVersionMetadata(
            model_id=model_id,
            model_name=model_name,
            version=version,
            algorithm=algorithm,
            created_at=dt.datetime.now(),
            metrics=metrics,
            feature_names=feature_names,
            hyperparameters=hyperparameters,
            artifact_paths=paths,
            artifact_checksums=checksums,
            is_active=set_as_active,
            description=description,
        )

        # Write version-specific metadata.json
        meta_file = version_dir / "metadata.json"
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(meta.model_dump(), f, indent=2, default=str)

        # Append to manifest
        self._manifest.setdefault(model_name, []).append(meta.model_dump())
        self._save_manifest()

        logger.info("Successfully registered model %s (v%s) with SHA-256 checksums", model_name, version)
        return meta

    def get_model(
        self,
        model_name: str,
        version: Optional[str] = None,
    ) -> Tuple[Any, Any, ModelVersionMetadata]:
        """Load model, preprocessing pipeline, and metadata for specified or champion version."""
        versions = self._manifest.get(model_name, [])
        if not versions:
            raise ModelInferenceError(f"No registered versions found for model '{model_name}'.")

        target_meta_dict = None
        if version:
            for v in versions:
                if v["version"] == version:
                    target_meta_dict = v
                    break
            if not target_meta_dict:
                raise ModelInferenceError(f"Version '{version}' not found for model '{model_name}'.")
        else:
            # Pick active champion
            for v in versions:
                if v.get("is_active", False):
                    target_meta_dict = v
                    break
            if not target_meta_dict:
                target_meta_dict = versions[-1]  # Fallback to latest

        meta = ModelVersionMetadata(**target_meta_dict)
        model_path = Path(meta.artifact_paths["model.joblib"])
        pipeline_path = Path(meta.artifact_paths["pipeline.joblib"])

        if not model_path.exists() or not pipeline_path.exists():
            raise ModelInferenceError(f"Model artifact files missing on disk for {meta.model_id}.")

        # Verify integrity
        if not self.verify_integrity(meta.model_name, meta.version):
            raise ModelInferenceError(f"SHA-256 integrity checksum mismatch for {meta.model_id}!")

        model_obj = joblib.load(model_path)
        pipeline_obj = joblib.load(pipeline_path)

        return model_obj, pipeline_obj, meta

    def list_models(self, model_name: Optional[str] = None) -> List[ModelVersionMetadata]:
        """List all registered models or versions of a specified model."""
        results = []
        if model_name:
            for v in self._manifest.get(model_name, []):
                results.append(ModelVersionMetadata(**v))
        else:
            for m_name, v_list in self._manifest.items():
                for v in v_list:
                    results.append(ModelVersionMetadata(**v))
        return results

    def promote_model(self, model_name: str, version: str) -> bool:
        """Promote a specific model version to become active production champion."""
        versions = self._manifest.get(model_name, [])
        found = False
        for v in versions:
            if v["version"] == version:
                v["is_active"] = True
                found = True
            else:
                v["is_active"] = False

        if found:
            self._save_manifest()
            logger.info("Promoted %s v%s to active production champion.", model_name, version)
            return True
        return False

    def verify_integrity(self, model_name: str, version: str) -> bool:
        """Verify that files on disk match their stored SHA-256 checksums."""
        versions = self._manifest.get(model_name, [])
        target = next((v for v in versions if v["version"] == version), None)
        if not target:
            return False

        meta = ModelVersionMetadata(**target)
        for fname, stored_hash in meta.artifact_checksums.items():
            fpath = Path(meta.artifact_paths[fname])
            if not fpath.exists():
                logger.error("Artifact file %s missing during integrity check.", fpath)
                return False
            curr_hash = self._compute_sha256(fpath)
            if curr_hash != stored_hash:
                logger.error("SHA-256 mismatch for %s: expected %s, got %s", fname, stored_hash, curr_hash)
                return False
        return True

    def rollback_model(self, model_name: str, target_version: str) -> bool:
        """Rollback production champion to a prior model version."""
        return self.promote_model(model_name, target_version)
