"""
Meta-Learning Module (MAML-inspired)
=====================================
Implements Model-Agnostic Meta-Learning (MAML) wrapper that enables
the base model to adapt quickly to new leaf disease classes with
only a few labeled examples (few-shot learning).

Reference: Finn et al., "Model-Agnostic Meta-Learning for Fast
           Adaptation of Deep Networks", ICML 2017.
"""

import copy
from typing import List, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


class MAMLWrapper(nn.Module):
    """
    MAML wrapper around any base model.

    During meta-training, the inner loop fine-tunes a temporary copy
    of the model on a small support set; the outer loop updates the
    original parameters so inner adaptation is maximally effective.
    """

    def __init__(
        self,
        base_model:  nn.Module,
        inner_lr:    float = 0.01,
        inner_steps: int   = 5,
    ):
        super().__init__()
        self.base_model  = base_model
        self.inner_lr    = inner_lr
        self.inner_steps = inner_steps

    # ------------------------------------------------------------------
    # Inner-loop adaptation (few-shot fine-tuning on a support set)
    # ------------------------------------------------------------------
    def adapt(
        self,
        support_images: torch.Tensor,
        support_labels: torch.Tensor,
    ) -> nn.Module:
        """
        Adapt a copy of the base model to a support set.

        Args:
            support_images: Tensor [N, C, H, W] of labelled leaf images.
            support_labels: Tensor [N] of integer class indices.

        Returns:
            A *copied* model fine-tuned on the support set (original unchanged).
        """
        adapted = copy.deepcopy(self.base_model)
        adapted.train()

        optimizer = torch.optim.SGD(adapted.parameters(), lr=self.inner_lr)

        for _ in range(self.inner_steps):
            logits = adapted(support_images)
            loss   = F.cross_entropy(logits, support_labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        return adapted

    # ------------------------------------------------------------------
    # Query / inference on an adapted model
    # ------------------------------------------------------------------
    def forward(
        self,
        query_images:   torch.Tensor,
        adapted_model:  nn.Module | None = None,
    ) -> torch.Tensor:
        """
        Run forward pass through the (optionally adapted) model.

        Args:
            query_images:  Tensor [B, C, H, W].
            adapted_model: If provided, run through this adapted copy;
                           otherwise run through the base model.

        Returns:
            Logits tensor [B, num_classes].
        """
        model = adapted_model if adapted_model is not None else self.base_model
        model.eval()
        with torch.no_grad():
            return model(query_images)

    # ------------------------------------------------------------------
    # Outer-loop meta-training step (returns loss for gradient update)
    # ------------------------------------------------------------------
    def meta_train_step(
        self,
        tasks: List[Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]],
    ) -> torch.Tensor:
        """
        Compute meta-training loss across a batch of N-way K-shot tasks.

        Each task is a tuple of (support_images, support_labels,
                                  query_images,  query_labels).

        Returns:
            Scalar loss averaged across tasks.
        """
        total_loss = torch.tensor(0.0, requires_grad=True)

        for s_imgs, s_lbls, q_imgs, q_lbls in tasks:
            adapted      = self.adapt(s_imgs, s_lbls)
            query_logits = adapted(q_imgs)
            task_loss    = F.cross_entropy(query_logits, q_lbls)
            total_loss   = total_loss + task_loss

        return total_loss / max(len(tasks), 1)


class PrototypicalHead(nn.Module):
    """
    Prototypical Network head for few-shot classification.
    Computes class prototypes from support embeddings and classifies
    query samples by nearest-prototype distance.
    """

    def __init__(self, distance: str = "euclidean"):
        super().__init__()
        assert distance in ("euclidean", "cosine")
        self.distance = distance

    def forward(
        self,
        support_embeddings: torch.Tensor,  # [N_way * K_shot, D]
        support_labels:     torch.Tensor,  # [N_way * K_shot]
        query_embeddings:   torch.Tensor,  # [Q, D]
    ) -> torch.Tensor:
        classes    = support_labels.unique()
        prototypes = torch.stack([
            support_embeddings[support_labels == c].mean(0) for c in classes
        ])

        if self.distance == "cosine":
            q_norm = F.normalize(query_embeddings, dim=-1)
            p_norm = F.normalize(prototypes, dim=-1)
            logits = q_norm @ p_norm.T
        else:
            diffs  = query_embeddings.unsqueeze(1) - prototypes.unsqueeze(0)
            logits = -diffs.pow(2).sum(-1)

        return logits
