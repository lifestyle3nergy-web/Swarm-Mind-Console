"""Local-only paired-view representation training sandbox.

This is a research scaffold, not a validated JEPA implementation or an
automatic device data collector. Nothing trains or downloads at import time.
"""

from __future__ import annotations

import copy
import json
import logging
import os
import re
import sys
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from torchvision.models import resnet50


@dataclass(frozen=True)
class SandboxConfig:
    root_dir: str = "./sandbox"


@dataclass(frozen=True)
class DataConfig:
    data_path: str
    batch_size: int = 32
    num_workers: int = 0
    train_split: float = 0.8
    image_size: int = 224
    seed: int = 42


@dataclass(frozen=True)
class ModelConfig:
    latent_dim: int = 256
    hidden_dim: int = 512


@dataclass(frozen=True)
class TrainingConfig:
    epochs: int = 50
    learning_rate: float = 1e-4
    weight_decay: float = 1e-6
    ema_momentum: float = 0.99
    variance_weight: float = 0.05
    early_stopping_patience: int = 10
    checkpoint_interval: int = 10
    device: str = "auto"


class SandboxEnvironment:
    def __init__(self, config: SandboxConfig):
        self.root = Path(config.root_dir).expanduser().resolve()
        self.data_dir = self.root / "data"
        self.models_dir = self.root / "models"
        self.logs_dir = self.root / "logs"
        self.checkpoints_dir = self.root / "checkpoints"
        for folder in (self.data_dir, self.models_dir, self.logs_dir, self.checkpoints_dir):
            folder.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(f"orb.knowledge.{self.root}")
        self.logger.setLevel(logging.INFO)
        self.logger.propagate = False
        if not self.logger.handlers:
            formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
            for handler in (logging.FileHandler(self.logs_dir / "training.log"), logging.StreamHandler(sys.stdout)):
                handler.setFormatter(formatter)
                self.logger.addHandler(handler)

    def checkpoint_path(self, name: str) -> Path:
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,60}", name):
            raise ValueError("Checkpoint names must be short alphanumeric labels")
        return self.checkpoints_dir / f"{name}.pt"

    def save_config(self, data: dict) -> None:
        target = self.models_dir / "config.json"
        temp = self.models_dir / "config.json.tmp"
        temp.write_text(json.dumps(data, indent=2), encoding="utf-8")
        os.replace(temp, target)


class PairedImageDataset(Dataset):
    """Two independent views of the *same* image, not two unrelated images."""

    def __init__(self, files: list[Path], image_size: int, training: bool):
        self.files = files
        normalize = transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
        if training:
            self.context = transforms.Compose([
                transforms.RandomResizedCrop(image_size, scale=(0.5, 1.0)),
                transforms.RandomHorizontalFlip(),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                transforms.ToTensor(), normalize,
            ])
            self.target = transforms.Compose([
                transforms.RandomResizedCrop(image_size, scale=(0.5, 1.0)),
                transforms.RandomHorizontalFlip(), transforms.ToTensor(), normalize,
            ])
        else:
            self.context = transforms.Compose([
                transforms.Resize(int(image_size * 1.15)), transforms.CenterCrop(image_size),
                transforms.ToTensor(), normalize,
            ])
            self.target = transforms.Compose([
                transforms.Resize(int(image_size * 1.3)), transforms.CenterCrop(image_size),
                transforms.ToTensor(), normalize,
            ])

    def __len__(self) -> int:
        return len(self.files)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        # Pillow closes the underlying file before the views enter the pipeline.
        with Image.open(self.files[index]) as image:
            rgb = image.convert("RGB")
            return self.context(rgb), self.target(rgb)


class DataHandler:
    def __init__(self, config: DataConfig):
        if not 0 < config.train_split < 1 or config.batch_size < 2 or config.image_size < 32:
            raise ValueError("Invalid split, batch size, or image size")
        root = Path(config.data_path).expanduser().resolve()
        if not root.is_dir():
            raise ValueError(f"Dataset directory does not exist: {root}")
        extensions = {".jpg", ".jpeg", ".png", ".webp"}
        files = sorted(path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in extensions and path.resolve().is_relative_to(root))
        if len(files) < 3:
            raise ValueError("At least three images are required for training and validation")
        rng = np.random.default_rng(config.seed)
        order = rng.permutation(len(files))
        train_count = max(2, min(len(files) - 1, int(len(files) * config.train_split)))
        self.train = PairedImageDataset([files[i] for i in order[:train_count]], config.image_size, True)
        self.val = PairedImageDataset([files[i] for i in order[train_count:]], config.image_size, False)
        self.config = config

    def loaders(self) -> tuple[DataLoader, DataLoader]:
        common = {"batch_size": self.config.batch_size, "num_workers": self.config.num_workers, "pin_memory": torch.cuda.is_available()}
        train_batch = min(self.config.batch_size, len(self.train))
        return (
            DataLoader(self.train, shuffle=True, batch_size=train_batch, drop_last=True, num_workers=self.config.num_workers, pin_memory=common["pin_memory"]),
            DataLoader(self.val, shuffle=False, **common),
        )


class Encoder(nn.Module):
    def __init__(self, config: ModelConfig):
        super().__init__()
        backbone = resnet50(weights=None)  # Never download model weights implicitly.
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])
        self.projection = nn.Sequential(nn.Flatten(), nn.Linear(2048, config.latent_dim), nn.LayerNorm(config.latent_dim))

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        return self.projection(self.backbone(images))


class Predictor(nn.Module):
    def __init__(self, config: ModelConfig):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(config.latent_dim, config.hidden_dim), nn.LayerNorm(config.hidden_dim),
            nn.GELU(), nn.Linear(config.hidden_dim, config.latent_dim),
        )

    def forward(self, latent: torch.Tensor) -> torch.Tensor:
        return self.network(latent)


class JEPATrainer:
    def __init__(self, model: ModelConfig, config: TrainingConfig, sandbox: SandboxEnvironment, loaders: tuple[DataLoader, DataLoader]):
        if not 0 <= config.ema_momentum < 1 or config.epochs < 1 or config.checkpoint_interval < 1:
            raise ValueError("Invalid training configuration")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu") if config.device == "auto" else torch.device(config.device)
        self.encoder = Encoder(model).to(self.device)
        self.target_encoder = copy.deepcopy(self.encoder).to(self.device).eval()
        self.target_encoder.requires_grad_(False)
        self.predictor = Predictor(model).to(self.device)
        self.optimizer = torch.optim.AdamW(
            list(self.encoder.parameters()) + list(self.predictor.parameters()),
            lr=config.learning_rate, weight_decay=config.weight_decay,
        )
        self.config, self.sandbox = config, sandbox
        self.train_loader, self.val_loader = loaders
        self.epoch = 0
        self.best_val_loss = float("inf")

    @torch.no_grad()
    def update_target(self) -> None:
        for target, source in zip(self.target_encoder.parameters(), self.encoder.parameters()):
            target.lerp_(source, 1 - self.config.ema_momentum)
        for target, source in zip(self.target_encoder.buffers(), self.encoder.buffers()):
            target.copy_(source)

    def loss(self, prediction: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        regression = F.mse_loss(F.normalize(prediction, dim=-1), F.normalize(target, dim=-1))
        # EMA alone does not guarantee non-collapse. Penalize low batch variance.
        if prediction.shape[0] < 2:
            return regression
        variance = F.relu(1 - torch.sqrt(prediction.var(dim=0, unbiased=False) + 1e-4)).mean()
        return regression + self.config.variance_weight * variance

    def run_epoch(self, training: bool) -> float:
        self.encoder.train(training)
        self.predictor.train(training)
        self.target_encoder.eval()
        loader = self.train_loader if training else self.val_loader
        total = 0.0
        for context, target in loader:
            context, target = context.to(self.device), target.to(self.device)
            with torch.set_grad_enabled(training):
                prediction = self.predictor(self.encoder(context))
                with torch.no_grad():
                    target_latent = self.target_encoder(target)
                loss = self.loss(prediction, target_latent)
                if training:
                    self.optimizer.zero_grad(set_to_none=True)
                    loss.backward()
                    self.optimizer.step()
                    self.update_target()
            total += float(loss.detach())
        return total / len(loader)

    def save_checkpoint(self, name: str) -> None:
        path = self.sandbox.checkpoint_path(name)
        temp = path.with_suffix(".tmp")
        torch.save({
            "epoch": self.epoch, "best_val_loss": self.best_val_loss,
            "encoder": self.encoder.state_dict(), "target": self.target_encoder.state_dict(),
            "predictor": self.predictor.state_dict(), "optimizer": self.optimizer.state_dict(),
        }, temp)
        os.replace(temp, path)

    def load_checkpoint(self, name: str, resume: bool = True) -> None:
        # Only load checkpoints from this trusted local sandbox.
        checkpoint = torch.load(self.sandbox.checkpoint_path(name), map_location=self.device, weights_only=True)
        self.encoder.load_state_dict(checkpoint["encoder"])
        self.target_encoder.load_state_dict(checkpoint["target"])
        self.predictor.load_state_dict(checkpoint["predictor"])
        if resume:
            self.optimizer.load_state_dict(checkpoint["optimizer"])
            self.epoch = int(checkpoint["epoch"]) + 1
            self.best_val_loss = float(checkpoint["best_val_loss"])

    def train(self) -> None:
        patience = 0
        for epoch in range(self.epoch, self.config.epochs):
            self.epoch = epoch
            train_loss = self.run_epoch(training=True)
            val_loss = self.run_epoch(training=False)
            self.sandbox.logger.info("Epoch %d/%d train=%.4f val=%.4f", epoch + 1, self.config.epochs, train_loss, val_loss)
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.save_checkpoint("best")
                patience = 0
            else:
                patience += 1
            if (epoch + 1) % self.config.checkpoint_interval == 0:
                self.save_checkpoint(f"epoch_{epoch + 1}")
            if patience >= self.config.early_stopping_patience:
                break
        self.save_checkpoint("final")


class KnowledgeLibrary:
    def __init__(self, data: DataConfig, sandbox: SandboxConfig | None = None, model: ModelConfig | None = None, training: TrainingConfig | None = None):
        self.data_config = data
        self.model_config = model or ModelConfig()
        self.training_config = training or TrainingConfig()
        self.sandbox = SandboxEnvironment(sandbox or SandboxConfig())
        self.trainer: JEPATrainer | None = None

    def prepare(self) -> JEPATrainer:
        data = DataHandler(self.data_config)
        self.trainer = JEPATrainer(self.model_config, self.training_config, self.sandbox, data.loaders())
        return self.trainer

    def train(self) -> None:
        trainer = self.trainer or self.prepare()
        self.sandbox.save_config({
            "data": asdict(self.data_config), "model": asdict(self.model_config),
            "training": asdict(self.training_config),
        })
        trainer.train()

    def fine_tune(self, checkpoint: str = "best", new_data_path: str | None = None) -> None:
        if new_data_path is not None:
            self.data_config = replace(self.data_config, data_path=new_data_path)
        trainer = self.prepare()
        trainer.load_checkpoint(checkpoint, resume=False)
        self.train()

    @torch.no_grad()
    def extract_embeddings(self, loader: Iterable) -> np.ndarray:
        if self.trainer is None:
            raise RuntimeError("Call prepare() and load a trusted checkpoint first")
        encoder = self.trainer.encoder.eval()
        batches = []
        for batch in loader:
            images = batch[0] if isinstance(batch, (tuple, list)) else batch
            batches.append(encoder(images.to(self.trainer.device)).cpu().numpy())
        if not batches:
            raise ValueError("Cannot extract embeddings from an empty loader")
        return np.concatenate(batches, axis=0)